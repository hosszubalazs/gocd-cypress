import { Arguments } from 'yargs';
import * as execa from 'execa';
import path from 'node:path';
import * as waitOn from 'wait-on';
import { ArgTypes } from './cli-builder';
import {
	cleanUpReports,
	cleanUpResults,
	CY_PROJECT_PATH,
	CY_REPORTS_PATH,
	CY_RESULTS_PATH,
	CY_TESTS_BASE_PATH,
	exec,
} from './commons';
import { dockerize } from './dockerize';

async function runCommand(argv: Arguments<ArgTypes>) {

	if (argv.serveCmd) {
		await runWithStartCommand(
			argv.testFolder as string,
			argv.serveCmd,
			argv.serveHost as string,
			argv.browser as string,
		);
	}
	else {
		await runCypress(
			argv.testFolder as string,
			argv.browser as string,
		);
	}

}

const reporterConfPath = `${__dirname}/reporter.conf.js`;

async function runCypress(testFolder: string, browser: string) {

	try {
		await cleanUpResults(`/${testFolder}`);
		await exec(['cypress run',
			`--browser ${browser}`,
			`--spec ${CY_TESTS_BASE_PATH}/${testFolder}/**/*.spec.ts`,
			`--reporter-options configFile=${reporterConfPath}`,
		].join(' '), {
			env: {
				CY_TEST_FOLDER: path.resolve(CY_RESULTS_PATH, testFolder),
			},
		});
	}
	finally {
		await cleanUpReports(`/${testFolder}/*`);
		await exec(`mochawesome-merge ${CY_RESULTS_PATH}/${testFolder}/*.json -o ${CY_REPORTS_PATH}/${testFolder}/index.json`);
		await exec(`marge ${CY_REPORTS_PATH}/${testFolder}/index.json -o ${CY_REPORTS_PATH}/${testFolder}`);
	}
}

async function runWithStartCommand(testFolder: string, serveCmd: string, serveHost: string, browser: string) {

	let exitCode = 0;

	const serveCmdParts = serveCmd.split(' ');

	const serve = execa(serveCmdParts[0], serveCmdParts.slice(1), {
		env: {
			BROWSER: 'none', // disable browser opening
		},
		cwd: CY_PROJECT_PATH,
		stdout: 'inherit',
	});

	try {
		await waitOn({
			resources: [
				serveHost,
			],
		});

		process.env.CYPRESS_BASE_URL = serveHost;

		await runCypress(testFolder, browser);
	}
	catch (e) {
		exitCode = 1;
	}
	finally {
		// do not serve after test finished
		serve.kill();

		process.exit(exitCode);
	}
}

export const runHandler = dockerize(runCommand);
