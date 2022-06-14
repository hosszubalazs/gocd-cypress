import path from 'path';
import execa from 'execa';
import fs from 'fs';

describe('cli', function () {
	const testProjectDir = path.resolve(__dirname, '../project-under-test');

	beforeAll(() => {
		console.log(`Change dir to ${testProjectDir}`)
		process.chdir(testProjectDir);

		Object.keys(process.env)
			.filter(envVar => envVar.startsWith('CY_'))
			.forEach(envVar => delete process.env[envVar]);

		delete process.env['CYPRESS_BASE_URL'];
	});

	beforeEach(() => {
		fs.rmSync(path.resolve(testProjectDir, 'reports'), { recursive: true, force: true });
	})

	test('Default config runs default cypress settings', async () => {
		const { all } = await execa('gocd-cypress', {
			preferLocal: true,
			all: true
		});
		console.log(all);

		const reportHtml = path.resolve(testProjectDir, 'reports/cypress/reports/index.html');
		expect(fs.existsSync(reportHtml)).toBeTruthy();
	});
});
