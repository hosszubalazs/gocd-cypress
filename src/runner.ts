import waitOn from 'wait-on';
import { cleanUpFolder, exec, } from './commons';
import { dockerize } from './dockerize';
import path from 'path';
import { config, loadConfig } from './config';
import { ArgTypes } from './cli-builder';
import { Arguments } from 'yargs';

export const runHandler = async (argv: Arguments<ArgTypes>) => {
	let exitCode = 0;

	try {
		loadConfig(argv);

		if (config.docker) {
			await dockerize();
		}
		else {
			await runCommand();
		}
	}
	catch (e) {
		console.error(e);
		exitCode = 1;
	}
	finally {
		process.exit(exitCode);
	}
}

export const runCommand = async (): Promise<void> => {
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

const runCypress = async (cypressCmd: string, resultsFolder: string, reportsFolder: string): Promise<void> => {
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
	finally {
		await exec(`mochawesome-merge ${resultsFolderAbs}/mochawesome*.json --output ${resultsFolderAbs}/all.json`);
		await exec(`marge ${resultsFolderAbs}/all.json --reportDir ${reportsFolderAbs} --reportFilename index.html`);
	}
};

const runWithStartCommand = async (serveCmd: string, serveHost: string, runCypressCallback: () => void): Promise<void> => {
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
	finally {
		serve.kill();
	}
};
