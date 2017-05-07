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

function getTags(options) {
	return execGit('show-ref --tags', options)
		.then(data => data.split('/n'))
		.then(lines => lines.map(x => x.split(' ')))
		.then(data => data.map(x => {
			const sha = x[0];
			const tag = x[1].replace('refs/tags/', '');
			return { sha, tag };
		}));
}

module.exports = {
	getRemoteUrl,
	getRevision,
	getTags,
};
