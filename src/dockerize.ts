import chalk from 'chalk';
import execa from 'execa';
import { exec, findCypressEnvVars, isCI } from './commons';
import { hideBin } from 'yargs/helpers';
import { config, loadProjectName } from './config';

export const dockerize: () => void = async () => {

	console.log(chalk.inverse(`🐳 Docker mode: using ${config.dockerImage}`));

	const command = [
		'npx gocd-cypress',
		...hideBin(process.argv).filter(arg => !arg.startsWith('--docker'))
			.map(arg => arg.replace(/"/g, '\\"'))
			.map(arg => `"${arg}"`),
		'--docker=false',
	].join(' ');

	console.log(chalk.inverse(`Command: ${command}`));

	const { stdout: userId } = await exec('id -u', { stdout: 'pipe' });
	const { stdout: groupId } = await exec('id -g', { stdout: 'pipe' });
	const HOME = process.env.HOME;
	const cypressEnvVars = findCypressEnvVars().map(envVarDef => ['-e', envVarDef]).flat();

	console.log(chalk.inverse(`Bootstrap command: ${config.bootstrapCmd}`));

	await execa(`docker`, ['run',
		'--name', `cypress-runner-${loadProjectName()}`,
		'--rm',
		'--init',
		'--user', `${userId}:${groupId}`,
		...(!isCI ? ['-t'] : []),
		'-v', `${HOME}:/opt/cypress/home`,
		'-v', `${config.projectPath}:/workdir`,
		'-w', '/workdir',
		'-e', 'HOME=/opt/cypress/home',
		'-e', 'NPM_CONFIG_PREFIX=/workdir',
		...cypressEnvVars,
		'-e', 'HTTP_PROXY', '-e', 'HTTPS_PROXY', '-e', 'NO_PROXY',
		'-e', 'http_proxy', '-e', 'https_proxy', '-e', 'no_proxy',
		...(isCI ? ['-e', 'CI'] : []),
		'--entrypoint=bash',
		config.dockerImage,
		'-c', // bash command execution flag
		[
			// bootstrap project if it was defined
			config.bootstrapCmd,

			// install cypress binary
			`npx cypress install`,

			// finally run command as tester user
			command,

		].join(' && '), // join bash commands
	], {
		cwd: config.projectPath,
		stdin: 'ignore',
		stdout: 'inherit',
		stderr: 'inherit',
	});

};
