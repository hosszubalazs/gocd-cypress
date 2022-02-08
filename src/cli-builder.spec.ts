import test from 'ava';
import { buildCli } from './cli-builder';

test.beforeEach(() => {
	for (const envVar in process.env) {
		if (envVar.substring(0, 3) == 'CY_') {
			delete process.env[envVar];
		}
	}
	delete process.env['CYPRESS_BASE_URL'];
})

test('buildCli - fails if no CYPRESS_BASE_URL or --serveCmd is provided', async t => {
	const argv = buildCli();

	const error = await t.throwsAsync(async () => {
		argv.parse('src');
	});

	t.is(error.message, 'Either CYPRESS_BASE_URL environment variable or --serveCmd must be specified.');
});
