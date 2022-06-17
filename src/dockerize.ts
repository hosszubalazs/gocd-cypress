import { Arguments } from 'yargs';
import chalk from 'chalk';
import execa from 'execa';
import { ArgTypes } from './cli-builder';
import { CY_BOOTSTRAP_COMMAND, CY_DOCKER_IMAGE, CY_PROJECT_PATH, exec, findCypressEnvVars, isCI, projectName } from './commons';
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
				...hideBin(process.argv).filter(arg => !arg.startsWith('--docker')),
				'--docker=false',
			].join(' ');

			console.log(chalk.inverse(`Command: ${command}`));

			const { stdout: userId } = await exec('id -u', {stdout: 'pipe'});
			const { stdout: groupId } = await exec('id -g', {stdout: 'pipe'});
			const HOME = process.env.HOME;
			const containerName = `cypress-runner-${projectName()}`;
			const cypressEnvVars = findCypressEnvVars().map(envVarDef => ['-e', envVarDef]).flat();

			console.log(chalk.inverse(`Bootstrap command: ${CY_BOOTSTRAP_COMMAND}`));

			await execa(`docker`, ['run',
				'--name', containerName,
				'--rm',
				'--init',
				'--user', `${userId}:${groupId}`,
				...(!isCI ? ['-t'] : []),
				'-v', `${HOME}:/opt/cypress/home`,
				'-v', `${HOME}/.cache/Cypress:/opt/cypress/cache`,
				'-v', `${CY_PROJECT_PATH}:/e2e`,
				'-w', '/e2e',
				'-e', 'HOME=/opt/cypress/home',
				'-e', 'NPM_CONFIG_PREFIX=/e2e',
				...cypressEnvVars,
				'-e', 'CYPRESS_CACHE_FOLDER=/opt/cypress/cache',
				'-e', 'HTTP_PROXY', '-e', 'HTTPS_PROXY', '-e', 'NO_PROXY',
				'-e', 'http_proxy', '-e', 'https_proxy', '-e', 'no_proxy',
				...(isCI ? ['-e', 'CI'] : []),
				'--entrypoint=bash',
				CY_DOCKER_IMAGE,
				'-c', // bash command execution flag
				[
					// bootstrap project if it was defined
					CY_BOOTSTRAP_COMMAND,

					// install cypress binary
					`npx cypress install`,

					// finally run command as tester user
					command,

				].join(' && '), // join bash commands
			], {
				cwd: CY_PROJECT_PATH,
				stdin: 'ignore',
				stdout: 'inherit',
				stderr: 'inherit',
			});

		}
		else {
			await realHandler(argv);
		}

	};
}
