import { exec } from 'child_process';

function execGit(command, options) {
	const promise = new Promise((resolve, reject) => {
		exec(`git ${command}`, options, (error, stdout, stderr) => {
			if (error) reject(stderr);
			resolve(stdout);
		});
	});
	return promise;
}

function getRemoteUrl(options) {
	return execGit('config --get remote.origin.url', options)
		.then(sha => sha.trim());
}

function getRevision(options) {
	return execGit('rev-parse HEAD', options)
		.then(sha => sha.trim());
}

module.exports = {
	getRemoteUrl,
	getRevision,
};
