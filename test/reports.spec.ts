import path from 'path';
import execa from 'execa';
import fs from 'fs';
import { DEFAULT_REPORTS_FOLDER } from '../src/cli-builder';
import http from 'http';

describe('cli', function () {
	const WITH_DOCKER = true;
	const NO_DOCKER = false;

	const testProjectDir = path.resolve(__dirname, '../project-under-test');
	const reportsDir = path.resolve(testProjectDir, DEFAULT_REPORTS_FOLDER);

	beforeAll(() => {
		console.log(`Change dir to ${testProjectDir}`)
		process.chdir(testProjectDir);

		Object.keys(process.env)
			.filter(envVar => envVar.startsWith('CY_'))
			.forEach(envVar => delete process.env[envVar]);

		delete process.env['CYPRESS_BASE_URL'];
	});

	beforeEach(() => {
		fs.rmSync(reportsDir, { recursive: true, force: true });
	})

	it('generates reports without dev web server and without docker', async () => {
		await withMockDevWebServer(async () => {
			await runCypress(NO_DOCKER);
			expectHtmlReportExists();
		});
	});

	it('generates reports with dev web server and with docker', async () => {
		await runCypress(WITH_DOCKER, [
			'--serveCmd="npm start"',
			'--serveHost=http://localhost:4200']
		);
		expectHtmlReportExists();
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

	const runCypress = async (dockerEnabled: boolean, cypressArgs: string[] = []) => {
		const browser = dockerEnabled ? 'chrome' : 'electron';

		const { all } = await execa('gocd-cypress', [
			`--docker=${dockerEnabled}`,
			`--cypressCmd="cypress run --browser ${browser}"`,
			...cypressArgs
		], {
			preferLocal: true,
			all: true,
			stdin: 'ignore'
		});
		console.log(all);
	}

	const expectHtmlReportExists = () => {
		const reportHtml = path.resolve(reportsDir, `index.html`);
		expect(fs.existsSync(reportHtml)).toBeTruthy();
	};
});
