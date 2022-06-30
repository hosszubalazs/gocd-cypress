import { convertCyEnvVarsToConfigProps, convertUnderscoreCaseToSnakeCase } from '../src/config';

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
});
