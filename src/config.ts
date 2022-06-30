import path from 'path';
import { cosmiconfigSync } from 'cosmiconfig';
import { Arguments } from 'yargs';
import { ArgTypes } from './cli-builder';
import { isCI } from './commons';

export type Config = Arguments<ArgTypes> & {
	projectPath: string,
	dockerImage: string,
	bootstrapCmd: string,
};

export const defaultConfig: Partial<Config> = {
	projectPath: process.cwd(),
	dockerImage: 'cypress/browsers:node16.13.0-chrome95-ff94',
	bootstrapCmd: 'true',
	docker: isCI,
	cypressCmd: 'cypress run',
	resultsFolder: 'cypress/results',
	reportsFolder: 'cypress/reports',
};

export let config: Config;

export const loadConfig = (argv: Arguments<ArgTypes>): void => {
	const cosmiconfig = loadCosmiconfig() ?? {};

	const nonProfileConfig = Object.fromEntries(Object.entries({ ...cosmiconfig }).filter(([k]) => k !== 'profiles'));
	const profileConfig = (argv.profile ? (cosmiconfig.profiles?.[argv.profile] ?? {}) : {});
	const commandLineConfig = Object.fromEntries(Object.entries(argv).filter(([k]) => k !== 'profile'));

	config = {
		...defaultConfig,
		...nonProfileConfig,
		...profileConfig,
		...convertCyEnvVarsToConfigProps(process.env),
		...commandLineConfig
	};
};

const loadCosmiconfig = () => {
	const COSMICONFIG_MODULE_NAME = 'gocdCypress';

	try {
		return cosmiconfigSync(COSMICONFIG_MODULE_NAME).search()?.config || {};
	}
	catch (error) {
		throw new Error(`Unable to load ${COSMICONFIG_MODULE_NAME} configuration: ${error}`);
	}
};

export const convertCyEnvVarsToConfigProps = (envVars: Record<string, string | undefined>): Record<string, string | undefined> =>
	Object.fromEntries(
		Object.entries(envVars)
			.filter(([k]) => k.startsWith('CY_'))
			.map(([k, v]) => [convertUnderscoreCaseToSnakeCase(k.replace(/^CY_/, '')), v]));

export const convertUnderscoreCaseToSnakeCase = (str: string) => {
	const words = str.split('_');
	return [
		...words.slice(0, 1).map(word => word.toLowerCase()),
		...words.slice(1).map(word =>
			word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase())
	].join('');
}

export const loadProjectName = (): string =>
	//eslint-disable-next-line @typescript-eslint/no-var-requires
	require(path.resolve(process.cwd(), 'package.json')).name;
