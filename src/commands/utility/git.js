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

export default function getRevision(cwd) {
	return execGit('rev-parse HEAD', { cwd })
		.then(sha => sha.trim());
}
