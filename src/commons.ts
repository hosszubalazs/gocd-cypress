import execa from 'execa';

export const DEFAULT_PROJECT_PATH = process.cwd();
export const IS_CI = ['1', 'true'].includes('' + process.env.CI);

export const exec = (command: string, options?: execa.Options): execa.ExecaChildProcess =>
	execa.command(command, {
		preferLocal: true,
		stdin: 'ignore',
		stdout: 'inherit',
		stderr: 'inherit',
		cwd: DEFAULT_PROJECT_PATH,
		...options,
	});

export const cleanUpFolder = async (folder: string): Promise<void> => {
	await exec(`rm -rf ${folder}`);
};

export const findCypressEnvVars = (): string[] =>
	Object.keys(process.env)
		.filter(envVar => envVar.toUpperCase().startsWith('CYPRESS_'))
		.map(envVar => `${envVar}=${process.env[envVar]}`);
