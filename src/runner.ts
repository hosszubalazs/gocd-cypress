import { Arguments } from 'yargs';
import execa from 'execa';
import path from 'path';
import waitOn from 'wait-on';
import { ArgTypes } from './cli-builder';
import {
	cleanUpReports,
	cleanUpResults,
	CY_INTEGRATION_FOLDER,
	CY_PROJECT_PATH,
	CY_REPORTS_PATH,
	CY_RESULTS_PATH,
	CY_SPEC_FILES_PATTERN,
	exec,
	joinTestFolder,
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
		await cleanUpResults(testFolder);
		await exec(['cypress run',
			`--browser ${browser}`,
			`--spec ${joinTestFolder(CY_INTEGRATION_FOLDER, testFolder)}/${CY_SPEC_FILES_PATTERN}`,
			`--reporter cypress-multi-reporters`,
			`--reporter-options configFile=${reporterConfPath}`,
		].join(' '), {
			preferLocal: true,
			env: {
				CY_TEST_FOLDER: path.resolve(CY_RESULTS_PATH, testFolder),
			},
		});
	}
	catch (e) {
		console.error(e);
		throw e;
	}
	finally {
		await cleanUpReports(`${testFolder}/*`);
		await exec(`mochawesome-merge ${joinTestFolder(CY_RESULTS_PATH, testFolder)}/*.json -o ${joinTestFolder(CY_REPORTS_PATH,
			testFolder)}/index.json`);
		await exec(
			`marge ${joinTestFolder(CY_REPORTS_PATH, testFolder)}/index.json -o ${joinTestFolder(CY_REPORTS_PATH, testFolder)}`);
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
