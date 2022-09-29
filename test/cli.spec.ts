import path from 'path';
import execa from 'execa';
import fs from 'fs';
import http from 'http';
import { defaultConfig } from '../src/config';

describe('cli', function () {
	const WITH_DOCKER = true;
	const NO_DOCKER = false;
	const SERVE_ARGS = [
		'--serveCmd=npm start',
		'--serveHost=http://localhost:4200',
	];

	const testProjectDir = path.resolve(__dirname, '../project-under-test');
	const reportsDirInTestProj = path.resolve(testProjectDir, defaultConfig.reportsFolder as string);

	beforeAll(() => {
		console.log(`Change dir to ${testProjectDir}`)
		process.chdir(testProjectDir);

		Object.keys(process.env)
			.filter(envVar => envVar.startsWith('CY_'))
			.forEach(envVar => delete process.env[envVar]);

		delete process.env['CYPRESS_BASE_URL'];
	});

	beforeEach(() => {
		fs.rmSync(reportsDirInTestProj, { recursive: true, force: true });
	})

	it('generates reports without dev web server and without docker', async () => {
		await withMockDevWebServer(async () => {
			await runCypress(NO_DOCKER);
		});
		expectHtmlReportExists();
	});

	it('generates reports with dev web server and with docker', async () => {
		await runCypress(WITH_DOCKER, SERVE_ARGS);
		expectHtmlReportExists();
	});

	it('escapes quotes', async () => {
		await runCypress(WITH_DOCKER, [
			'--serveCmd=`echo "npm" \'run\' "start"`',
			'--serveHost="http://localhost:4200"',
		]);
		expectHtmlReportExists();
	});

	it('can use a different profile', async () => {
		const all = await runCypress(WITH_DOCKER, [
			...SERVE_ARGS,
			'--profile=testBootstrap',
		]);
		expect(all).toContain('This is a dummy bootstrap command');
	});

	it('can override yargs defaults', async () => {
		const customReportsDir = path.join(reportsDirInTestProj, 'subdir');

		await withMockDevWebServer(async () => {
			await runCypress(NO_DOCKER, [
				`--reportsFolder=${customReportsDir}`,
			]);
		});
		expectHtmlReportExists(customReportsDir);
	});

	it('can use custom docker run arguments', async () => {
		const all = await runCypress(WITH_DOCKER, [
			...SERVE_ARGS,
			'--dockerRunArgs=-e', '--dockerRunArgs=TEST_VAR_1=myValue1',
			'--bootstrapCmd=echo TEST_VAR_1 is: $TEST_VAR_1'
		]);
		expect(all).toContain('TEST_VAR_1 is: myValue1');
	});

	const withMockDevWebServer = (callback: () => Promise<void>) => {
		return new Promise<void>((resolve, reject) => {
			const host = 'localhost';
			const port = 4200;
			const html = fs.readFileSync(`${__dirname}/../project-under-test/src/fake-app.html`);

			const server = http.createServer()
				.on('request', (req, res) => {
					res.setHeader('Content-Type', 'text/html');
					res.writeHead(200);
					res.end(html);
				})
				.on('error', function (e) {
					console.error(e);
					reject(e);
					server.close();
				})
				.listen(port, host, async () => {
					try {
						await callback();
						resolve();
					}
					catch (err) {
						reject(err);
					}
					finally {
						server.close();
					}
				});
		});
	};

	const runCypress = async (dockerEnabled: boolean, gocdCypressArgs: string[] = []): Promise<string> => {
		const browser = dockerEnabled ? 'chrome' : 'electron';

		const { all } = await execa('gocd-cypress', [
			`--docker=${dockerEnabled}`,
			`--cypressCmd=cypress run --browser ${browser}`,
			...gocdCypressArgs
		], {
			preferLocal: true,
			all: true,
			stdin: 'ignore'
		});
		console.log(all);

		return all ?? '';
	}

	const expectHtmlReportExists = (reportsDir = reportsDirInTestProj) => {
		const reportHtml = path.resolve(reportsDir, `index.html`);
		expect(fs.existsSync(reportHtml)).toBeTruthy();
	};
});
