import { convertCyEnvVarsToConfigProps, convertUnderscoreCaseToSnakeCase } from '../src/config';

describe('config', function () {
	it('converts underscore case to snake case', () => {
		expect(convertUnderscoreCaseToSnakeCase('MY_TEST_VARIABLE')).toEqual('myTestVariable');
	});

	it('converts converts env vars to config props', () => {
		expect(convertCyEnvVarsToConfigProps({ 'CY_TEST_VARIABLE': 'my value' })).toEqual({ testVariable: 'my value' });
	});
});
