import { Arguments } from 'yargs';
import chalk from 'chalk';
import execa from 'execa';
import { ArgTypes } from './cli-builder';
import { CY_BOOTSTRAP_COMMAND, CY_DOCKER_IMAGE, CY_PROJECT_PATH, findCypressEnvVars, projectName } from './commons';
import { hideBin } from 'yargs/helpers';

// This is a eslint error:
// eslint-disable-next-line no-unused-vars
type YargsHandler = (a: Arguments<ArgTypes>) => Promise<void>;

export function dockerize(realHandler: YargsHandler): YargsHandler {

	return async (argv: Arguments<ArgTypes>) => {

		if (argv.docker) {

			console.log(chalk.inverse(`🐳 Docker mode: using ${CY_DOCKER_IMAGE}`));

			const command = [
				'npx gocd-cypress',
				...hideBin(process.argv).filter(arg => !arg.startsWith('--docker'))
			].join(' ');

			console.log(chalk.inverse(`Command: ${command}`));

			const { stdout: userId } = await execa('id', ['-u'], {stderr: 'inherit'});
			const { stdout: groupId } = await execa('id', ['-g'], {stderr: 'inherit'});
			const HOME = process.env.HOME;
			const bootstrapCommand = CY_BOOTSTRAP_COMMAND;
			const containerName = `cypress-runner-${projectName()}`;
			const cypressEnvVars = findCypressEnvVars().map(envVarDef => ['-e', envVarDef]).flat();

			console.log(chalk.inverse(`Bootstrap command: ${bootstrapCommand}`));

			// handle Ctrl+C - remove docker container was started
			process.once('SIGINT', function () {
				console.log(`Killing container ${containerName}`);

				execa.commandSync(`docker rm -f ${containerName}`);

				console.log(`${containerName} killed`);
			});

			await execa(`docker`, ['run',
				'--name', containerName,
				'--rm',
				'--user', `${userId}:${groupId}`,
				'-t',
				'-v', `${HOME}:/opt/cypress/home`,
				'-v', `${HOME}/.cache/Cypress:/opt/cypress/cache`,
				'-v', `${CY_PROJECT_PATH}:/e2e`,
				'-w', '/e2e',
				'-e', 'HOME=/opt/cypress/home',
				'-e', 'NPM_CONFIG_PREFIX=/e2e',
				...cypressEnvVars,
				'-e', 'CYPRESS_CACHE_FOLDER=/opt/cypress/cache',
				'-e', 'HTTP_PROXY', '-e', 'HTTPS_PROXY', '-e', 'NO_PROXY',
				'--entrypoint=bash',
				CY_DOCKER_IMAGE,
				'-c', // bash command execution flag
				[
					// bootstrap project if it was defined
					bootstrapCommand,

					// install cypress binary
					`npx cypress install`,

					// finally run command as tester user
					command,

				].filter(cmd => !!cmd).join(' && '), // join bash commands
			], {
				cwd: CY_PROJECT_PATH,
				stdio: 'inherit',
			});

		}
		else {
			await realHandler(argv);
		}

	};
}
