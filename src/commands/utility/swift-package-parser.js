import { exec, spawn } from 'child_process';

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

function parsePackage(options) {
	return getOriginalBuildCommand(options)
		.then(command => command.replace('-fileno 3', '-fileno 1'))
		.then(command => getCommandOutput(command))
		.then(result => JSON.parse(result).package);
}

module.exports = {
	parsePackage,
};
