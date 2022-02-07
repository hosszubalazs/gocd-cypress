import { Arguments } from 'yargs';
import chalk from 'chalk';
import execa from 'execa';
import { ArgTypes } from './cli-builder';
import { createBootstrapCmd, CY_DOCKER_IMAGE, CY_PROJECT_PATH, projectName } from './commons';

// This is a eslint error:
// eslint-disable-next-line no-unused-vars
type YargsHandler = (a: Arguments<ArgTypes>) => Promise<void>;

export function dockerize(realHandler: YargsHandler): YargsHandler {

	return async (argv: Arguments<ArgTypes>) => {

		if (argv.docker) {

			console.log(chalk.inverse(`🐳 Docker mode: using ${CY_DOCKER_IMAGE}`));

			const command = [
				`npx`,
				`anx-cpyress`,
				`${argv.testFolder}`,
				`--serveCmd="${argv.serveCmd ?? ''}"`,
				`--serveHost="${argv.serveHost ?? ''}"`,
				`--browser="${argv.browser ?? ''}"`
			].join(' ');

			console.log(chalk.inverse(`command: ${command}`));

			const { stdout: userId } = await execa('id', ['-u']);
			const { stdout: groupId } = await execa('id', ['-g']);
			const HOME = process.env.HOME;
			const bootstrapping = createBootstrapCmd();
			const containerName = `cypress-runner-${projectName()}`;

			console.log(`Use bootstrap command: ${bootstrapping}`);

			// handle Ctrl+C - remove docker container was started
			process.once('SIGINT', function () {
				console.log(`Killing container ${containerName}`);

				execa.commandSync(`docker rm -f ${containerName}`);

				console.log(`${containerName} killed`);
			});

			await execa(`docker`, ['run',
				'--name', containerName,
				'--rm',
				'-v', `${HOME}:/opt/cypress/home`,
				'-v', `${HOME}/.cache/Cypress:/opt/cypress/cache`,
				'-v', `${CY_PROJECT_PATH}:/e2e`,
				'-w', '/e2e',
				'-e', 'HOME=/opt/cypress/home',
				'-e', 'CYPRESS_CACHE_FOLDER=/opt/cypress/cache',
				'-e', `CYPRESS_BASE_URL=${process.env.CYPRESS_BASE_URL}`,
				'-e', 'HTTP_PROXY', '-e', 'HTTPS_PROXY', '-e', 'NO_PROXY',
				'--entrypoint=bash',
				'-t',
				CY_DOCKER_IMAGE,
				'-c',
				[
					// create tester user
					`useradd -s /bin/bash -d /e2e -u ${userId} -g ${groupId} tester`,

					// bootstrap project if it was defined
					bootstrapping,

					// install cypress binary
					`runuser -u tester -- npx cypress install`,

					// finally run command as tester user
					`runuser -u tester -- ${command}`,

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
