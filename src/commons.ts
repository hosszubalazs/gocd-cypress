import execa from 'execa';
import path from 'node:path';

function env(envVarName: string, defaultValue: string) {
	return process.env[envVarName] || defaultValue;
}

export const CY_PROJECT_PATH = env('CY_PROJECT_PATH', process.cwd());
export const CY_REPORTS_PATH = env('CY_REPORTS_PATH', path.resolve(CY_PROJECT_PATH, './reports/cypress/reports'));
export const CY_RESULTS_PATH = env('CY_RESULTS_PATH', path.resolve(CY_PROJECT_PATH, './reports/cypress/results'));
export const CY_TESTS_BASE_PATH = env('CY_TESTS_BASE_PATH', path.resolve(CY_PROJECT_PATH, './cypress/test'));
export const CY_DOCKER_IMAGE = env('CY_DOCKER_IMAGE', 'cypress/browsers:node16.13.0-chrome95-ff94');

export function exec(command: string, options?: execa.Options): execa.ExecaChildProcess {

	return execa.command(command, {
		preferLocal: true,
		stdio: 'inherit',
		cwd: CY_PROJECT_PATH,
		...options,
	});
}

const packageJson = () => require(path.resolve(CY_PROJECT_PATH, 'package.json'));

export const createBootstrapCmd = (): string => packageJson().cyCli?.dockerBootstrapCmd ?? '';
export const projectName = (): string => packageJson().name;

export const cleanUpReports = async (testFolder: string): Promise<void> => {
	await cleanUpFolder(`${CY_REPORTS_PATH}/${testFolder}`);
};

export const cleanUpResults = async (testFolder: string): Promise<void> => {
	await cleanUpFolder(`${CY_RESULTS_PATH}/${testFolder}`);
};

export const cleanUpFolder = async (testFolder: string): Promise<void> => {
	await exec(`rm -rf ${testFolder}`);
};

export function findTsNodeInstance(): { options: { project: string; } } {
	// way to get ts-node instance: https://github.com/TypeStrong/ts-node/issues/846#issuecomment-631828160
	const tsNodeRegisterSym = Symbol.for('ts-node.register.instance');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (process as any)[tsNodeRegisterSym];
}
