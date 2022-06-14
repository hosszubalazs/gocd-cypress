/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testPathIgnorePatterns: ['/node_modules/', '/project-under-test/'],
	testMatch: ['**/?(*.)+(spec).ts'],
	testTimeout: 120000 // 2 mins
};
