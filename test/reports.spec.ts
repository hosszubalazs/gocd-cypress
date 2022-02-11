import test from 'ava';
import path from 'path';
import execa from 'execa';
import fs from 'fs';

const testProjectDir = path.resolve(__dirname, '../project-under-test');

test.before(async (t) => {
	t.log(`Change dir to ${testProjectDir}`)
	process.chdir(testProjectDir);
});

test.beforeEach(() => {

	for (const envVar in process.env) {
		if (envVar.substring(0, 3) == 'CY_') {
			delete process.env[envVar];
		}
	}
	delete process.env['CYPRESS_BASE_URL'];
	fs.rmSync(path.resolve(testProjectDir, 'reports'), { recursive: true, force: true });
})

test('cli - Default config runs default cypress settings', async t => {
	await execa('gocd-cypress', {
		preferLocal: true,
		stdio: 'inherit',
	});

	const reportHtml = path.resolve(testProjectDir, 'reports/cypress/reports/index.html');
	t.true(fs.existsSync(reportHtml), 'HTML report is generated');
});
