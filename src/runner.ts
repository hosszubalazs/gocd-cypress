import waitOn from 'wait-on';
import { cleanUpFolder, exec, } from './commons';
import { dockerize } from './dockerize';
import path from 'path';
import { config, loadConfig } from './config';
import { ArgTypes } from './cli-builder';
import { Arguments } from 'yargs';

export const runHandler = (argv: Arguments<ArgTypes>) => {
	loadConfig(argv);

	if (config.docker) {
		dockerize();
	}
	else {
		runCommand();
	}
}

export const runCommand: () => void = async () => {
	if (config.serveCmd) {
		await runWithStartCommand(
			config.serveCmd,
			config.serveHost as string,
			async () => {
				await runCypress(
					config.cypressCmd as string,
					config.resultsFolder as string,
					config.reportsFolder as string,
				);
			},
		);
	}
	else {
		await runCypress(
			config.cypressCmd as string,
			config.resultsFolder as string,
			config.reportsFolder as string,
		);
	}

}

async function runCypress(cypressCmd: string, resultsFolder: string, reportsFolder: string) {

	const resultsFolderAbs = path.resolve(config.projectPath, resultsFolder);
	const reportsFolderAbs = path.resolve(config.projectPath, reportsFolder);

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
