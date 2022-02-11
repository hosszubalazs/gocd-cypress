import yargs, { Arguments, Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import { CY_INTEGRATION_FOLDER, joinTestFolder } from './commons';
import { runHandler } from './runner';

export type ArgTypes = {
	docker?: boolean;
	testFolder?: string;
	serveCmd?: string;
	serveHost?: string;
	browser?: string;
};

// Assemble CLI interface with yargs
export function buildCli(): Argv {

	return yargs(hideBin(process.argv))
		.help()
		.command({
			command: '$0 [testFolder]',
			describe: `Starts Cypress testing

			Example
				CI=true npx gocd-cypress uiAcceptance --serveCmd="npm start" --serveHost=http://localhost:3000
			`,
			builder: (args: Argv<ArgTypes>) => {
				return args
					.positional('testFolder', {
						describe: 'test types to run',
						type: 'string',
						default: ''
					}).options({
						docker: {
							describe: 'Turns on docker mode. The task will run in cypress docker image',
							default: ['1', 'true'].includes('' + process.env.CI),
							boolean: true,
						},
						serveCmd: {
							describe: 'Serve command',
							type: 'string',
						},
						serveHost: {
							describe: 'URL to application that serveCmd starts',
							type: 'string',
						},
						browser: {
							describe: 'Browser name to use. See: https://docs.cypress.io/guides/guides/launching-browsers',
							type: 'string',
							required: true,
							default: 'firefox'
						}
					})
					.implies('serveCmd', 'serveHost');
			},
			handler: runHandler,
		})
		.middleware(validateRun)
		.showHelpOnFail(false)
		.demandCommand(1);

}

function validateRun(args: Arguments<ArgTypes>) {

	if (args.testFolder) {
		const testFolderAbsolute = joinTestFolder(CY_INTEGRATION_FOLDER, args.testFolder);
		if (!fs.existsSync(testFolderAbsolute)) {
			throw new Error(`specified test folder "${args.testFolder}" does not exists here: ${testFolderAbsolute}`);
		}
	}

}
