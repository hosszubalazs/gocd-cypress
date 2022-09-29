import { config, convertCyEnvVarsToConfigProps, convertUnderscoreCaseToSnakeCase, loadConfig } from '../src/config';
import { Arguments } from 'yargs';
import { ArgTypes, buildCli } from '../src/cli-builder';
import mockArg from 'mock-argv';

jest.mock('../src/runner', () => ({
	...(jest.requireActual('../src/runner')),
	runHandler: (argv: Arguments<ArgTypes>) => {
		loadConfig(argv);
	}
}));

describe('config', function () {
	it('converts underscore case to snake case', () => {
		expect(convertUnderscoreCaseToSnakeCase('MY_TEST_VARIABLE')).toEqual('myTestVariable');
	});

	it('converts CY_ env vars to config props', () => {
		expect(convertCyEnvVarsToConfigProps({
			'CY_TEST_VARIABLE': 'my value',
			HOME: 'this variable should not be converted',
			CYPRESS_CMD: 'testing a wrongly named env var'
		})).toEqual({
			testVariable: 'my value'
		});
	});

	it('allows multiple docker run args via CLI', () => {
		return mockArg([
			'--dockerRunArg=-e', '--dockerRunArg=TEST_VAR_1=myValue1',
			'--dockerRunArg=-e', '--dockerRunArg=TEST_VAR_2=myValue2'
		], async () => {
			buildCli().parse();
			expect(config.dockerRunArg).toEqual([
				'-e', 'TEST_VAR_1=myValue1',
				'-e', 'TEST_VAR_2=myValue2'
			]);
		});
	});

});
