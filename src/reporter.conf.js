module.exports = {
	reporterEnabled: 'mochawesome',
	mochawesomeReporterOptions: {
		reportDir: process.env.CY_TEST_FOLDER,
		overwrite: false,
		html: false,
		json: true
	}
};
