import test from 'ava';
import path from 'path';
import execa from 'execa';
import fs from 'fs';

const demoDir = path.resolve(__dirname, '../demo');

test.before(async (t) => {
	t.log(`Change dir to ${demoDir}`)
	process.chdir(demoDir);
});

test.beforeEach(() => {

	for (const envVar in process.env) {
		if (envVar.substring(0, 3) == 'CY_') {
			delete process.env[envVar];
		}
	}
	delete process.env['CYPRESS_BASE_URL'];
	fs.rmSync(path.resolve(__dirname, '../demo/reports'), { recursive: true, force: true });
})

test('cli - Default config runs default cypress settings', async t => {
	await execa('anx-cypress', {
		preferLocal: true,
		stdio: 'inherit',
	});

	t.true(fs.existsSync(path.resolve(__dirname, '../demo/reports/cypress/reports/index.html')), 'HTML report is generated');
});
