import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runHandler } from './runner';
import { isCI } from './commons';

export const DEFAULT_REPORTS_FOLDER = 'cypress/results';

export type ArgTypes = {
	docker?: boolean;
	cypressCommand?: string;
	serveCmd?: string;
	serveHost?: string;
	resultsFolder?: string;
	reportsFolder?: string;
	profile?: string;
};

// Assemble CLI interface with yargs
export function buildCli(): Argv {

	return yargs(hideBin(process.argv))
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
							describe: 'Run Cypress in Docker. Defaults to true if a CI environment is detected',
							default: isCI,
							boolean: true,
						},
						cypressCmd: {
							describe: 'Command to execute Cypress tests. Must support receiving more parameters that customize' +
								' the reporter',
							type: 'string',
							default: 'cypress run'
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
							describe: 'Path to the folder to store intermediary test result files in',
							type: 'string',
							default: DEFAULT_REPORTS_FOLDER,
						},
						reportsFolder: {
							describe: 'Path to the folder to create the HTML report in',
							type: 'string',
							default: DEFAULT_REPORTS_FOLDER,
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

}
