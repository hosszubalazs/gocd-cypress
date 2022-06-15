import { Arguments } from 'yargs';
import waitOn from 'wait-on';
import { ArgTypes } from './cli-builder';
import { cleanUpFolder, CY_PROJECT_PATH, exec, } from './commons';
import { dockerize } from './dockerize';
import path from 'path';

async function runCommand(argv: Arguments<ArgTypes>) {

	if (argv.serveCmd) {
		await runWithStartCommand(
			argv.serveCmd,
			argv.serveHost as string,
			async () => {
				await runCypress(
					argv.cypressCmd as string,
					argv.resultsFolder as string,
					argv.reportsFolder as string,
				);
			},
		);
	}
	else {
		await runCypress(
			argv.cypressCmd as string,
			argv.resultsFolder as string,
			argv.reportsFolder as string,
		);
	}

}

async function runCypress(cypressCmd: string, resultsFolder: string, reportsFolder: string) {

	const resultsFolderAbs = path.resolve(CY_PROJECT_PATH, resultsFolder);
	const reportsFolderAbs = path.resolve(CY_PROJECT_PATH, reportsFolder);

	try {
		await cleanUpFolder(resultsFolderAbs);
		await cleanUpFolder(reportsFolderAbs);
		await exec([
			cypressCmd,
			'--reporter mochawesome',
			`--reporter-options reportDir="${resultsFolderAbs}",overwrite=false,html=false,json=true`,
		].join(' '));
	}
	catch (e) {
		console.error(e);
		throw e;
	}
	finally {
		await exec(`mochawesome-merge ${resultsFolderAbs}/mochawesome*.json --output ${resultsFolderAbs}/all.json`);
		await exec(`marge ${resultsFolderAbs}/all.json --reportDir ${reportsFolderAbs} --reportFilename index.html`);
	}
}

const runWithStartCommand = async (serveCmd: string, serveHost: string, runCypressCallback: () => void): Promise<void> => {

	let exitCode = 0;

	const serve = exec(serveCmd, {
		env: {
			BROWSER: 'none', // disable browser opening
		},
	});

	try {
		await waitOn({
			resources: [
				serveHost,
			],
		});

		process.env.CYPRESS_BASE_URL = serveHost;

		await runCypressCallback();
	}
	catch (e) {
		exitCode = 1;
	}
	finally {
		serve.kill();
		process.exit(exitCode);
	}
};

export const runHandler = dockerize(runCommand);
