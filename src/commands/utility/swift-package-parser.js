import { exec, spawn } from 'child_process';

function getOriginalBuildCommand() {
	const promise = new Promise((resolve) => {
		const buildCommand = spawn('sh', ['-c', 'swift build --verbose']);
		buildCommand.stdout.on('data', (data) => {
			const command = data.toString().split('\n')[0];
			buildCommand.kill('SIGINT');
			resolve(command);
		});
	});
	return promise;
}

function getCommandOutput(command) {
	const promise = new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) reject(stderr);
			resolve(stdout);
		});
	});
	return promise;
}

export default function parsePackage() {
	return getOriginalBuildCommand()
		.then(command => command.replace('-fileno 3', '-fileno 1'))
		.then(command => getCommandOutput(command))
		.then(result => JSON.parse(result).package);
}
