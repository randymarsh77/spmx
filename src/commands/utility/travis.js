import fetch from 'node-fetch';

const headers = {
	'Travis-API-Version': '3',
};
if (process.env.GitHubToken) {
	headers.Authorization = `token ${process.env.TravisToken}`;
} else {
	console.warn('`TravisToken` environment variable is NOT set. Requests to Travis will be unauthenticated.');
}

export default function trigger(slug, branch) {
	return fetch(`https://api.travis-ci.org/repo/${encodeURIComponent(slug)}/requests`, {
		method: 'POST',
		headers: {
			...headers,
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: `{"request": {"branch":"${branch || 'master'}"}}`,
	});
}
