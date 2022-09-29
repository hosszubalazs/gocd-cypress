import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runHandler } from './runner';
import { defaultConfig } from './config';

export type ArgTypes = {
	docker?: boolean;
	cypressCmd?: string;
	serveCmd?: string;
	serveHost?: string;
	resultsFolder?: string;
	reportsFolder?: string;
	dockerRunArgs?: string[];
	profile?: string;
};

// Assemble CLI interface with yargs
export const buildCli = (): Argv =>
	yargs(hideBin(process.argv))
		.help()
		.command({
			command: '$0',
			describe: `Starts Cypress testing

			Example
				CI=true npx gocd-cypress --cypressCmd="cypress run --browser chrome" \\
					--serveCmd="npm start" --serveHost=http://localhost:4200 \\
					--resultsFolder="build/cypress/results" --reportsFolder="build/cypress/reports"
			`,
			builder: (args: Argv<ArgTypes>) => {
				return args
					.options({
						docker: {
							describe: withDefault('Run Cypress in Docker. Defaults to true if a CI environment is detected',
								defaultConfig.docker as boolean),
							boolean: true,
						},
						cypressCmd: {
							describe: withDefault('Command to execute Cypress tests. Must support receiving more parameters' +
								' that customize the reporter',
								defaultConfig.cypressCmd as string),
							type: 'string',
						},
						serveCmd: {
							describe: 'Serve command',
							type: 'string',
						},
						serveHost: {
							describe: 'URL to application that serveCmd starts. Required if serveCmd is specified',
							type: 'string',
						},
						resultsFolder: {
							describe: withDefault('Path to the folder to store intermediary test result files in',
								defaultConfig.resultsFolder as string),
							type: 'string',
						},
						reportsFolder: {
							describe: withDefault('Path to the folder to create the HTML report in',
								defaultConfig.reportsFolder as string),
							type: 'string',
						},
						dockerRunArgs: {
							describe: 'Extra arguments for the "docker run" command when Docker is enabled. E.g.: ' +
								'--dockerRunArgs=-e --dockerRunArgs=TEST_VAR=myValue',
							type: 'string',
							array: true,
						},
						profile: {
							describe: 'Configuration profile to use. Overrides configuration based on use case',
							type: 'string',
						}
					})
					.implies('serveCmd', 'serveHost');
			},
			handler: runHandler,
		})
		.showHelpOnFail(false);

// Can't define default values with yargs, as in our setup they would always override the Cosmiconfig configuration too.
const withDefault = (description: string, defaultValue: string | boolean) =>
	`${description} [default: ${defaultValue}]`;
