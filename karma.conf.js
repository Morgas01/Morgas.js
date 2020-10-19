module.exports = function (config)
{
	config.set({
		basePath: '',
		frameworks: ['qunit'],
		client: {
			clearContext: false,
			qunit: {
				showDebugUI: true,
				showUI: true,
				testTimeout: 5000
			}
		},
		files: [
			'src/test/test-main.js',
			'build/Morgas-*.js',
			'test/tests/*',
			'test/tests/!(NodeJs|Worker)/*',
			{pattern: 'test/tests/Worker/**/*', included: false},
			{pattern: "test/resources/**/*", included: false},
			{pattern: "src/**/*", included: false}
		],
		exclude: [],
		reporters: ['dots'],
		port: 9876,
		colors: true,
		logLevel: config.LOG_INFO,
		autoWatch: true,
		singleRun: false,
		concurrency: Infinity
	});
};
