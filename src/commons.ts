import execa from 'execa';
import { config } from './config';

export function exec(command: string, options?: execa.Options): execa.ExecaChildProcess {

	return execa.command(command, {
		preferLocal: true,
		stdin: 'ignore',
		stdout: 'inherit',
		stderr: 'inherit',
		cwd: config.projectPath,
		...options,
	});
}

export const cleanUpFolder = async (folder: string): Promise<void> => {
	await exec(`rm -rf ${folder}`);
};

export const findCypressEnvVars = (): string[] =>
	Object.keys(process.env)
		.filter(envVar => envVar.toUpperCase().startsWith('CYPRESS_'))
		.map(envVar => `${envVar}=${process.env[envVar]}`);

export const isCI = ['1', 'true'].includes('' + process.env.CI);
