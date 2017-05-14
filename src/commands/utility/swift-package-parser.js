import { exec, spawn } from 'child_process';

const PackageParseMode = {
	Build: 'build',
	Package: 'package',
};

function getOriginalBuildCommand(options) {
	const promise = new Promise((resolve) => {
		const buildCommand = spawn('sh', ['-c', 'swift build --verbose'], options);
		buildCommand.stdout.on('data', (data) => {
			const command = data.toString().split('\n')[0];
			buildCommand.kill('SIGINT');
			resolve(command);
		});
	});
	return promise;
}

function getCommandOutput(command, options) {
	const promise = new Promise((resolve, reject) => {
		exec(command, options, (error, stdout, stderr) => {
			if (error) reject(stderr);
			resolve(stdout);
		});
	});
	return promise;
}

function parsePackageUsingBuild(options) {
	return getOriginalBuildCommand(options)
		.then(command => command.replace('-fileno 3', '-fileno 1'))
		.then(command => getCommandOutput(command))
		.then(result => JSON.parse(result).package);
}

async function parsePackageUsingPackage(options) {
	const data = await new Promise((resolve, reject) => {
		exec('swift package show-dependencies --format json', options, (error, stdout, stderr) => {
			if (error) reject(stderr);
			resolve(stdout);
		});
	});
	return JSON.parse(data);
}

function validateMode(mode) {
	if (mode && mode !== PackageParseMode.Build && mode !== PackageParseMode.Package) {
		throw new Error(`Invalid package parse mode: ${mode}`);
	}
}

function parsePackage(options) {
	const { mode } = options;
	validateMode(mode);
	return !mode || mode === PackageParseMode.Build ?
		parsePackageUsingBuild(options) :
		parsePackageUsingPackage(options);
}

module.exports = {
	parsePackage,
	PackageParseMode,
};
