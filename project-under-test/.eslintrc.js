module.exports = {
	root: true,
	plugins: [
		'cypress',
	],
	extends: [
		'eslint:recommended',
		'plugin:cypress/recommended',
	],
	env: {
		node: true,
		'cypress/globals': true,
	},
};
