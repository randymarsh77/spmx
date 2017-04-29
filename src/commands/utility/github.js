import github from 'github';

const headers = {};
if (process.env.GitHubToken) {
	headers.Authorization = `token ${process.env.GitHubToken}`;
} else {
	console.warn('`GitHubToken` environment variable is NOT set. Requests to GitHub will be unauthenticated.');
}

const api = github({ headers });

api.swiftx = {
	baseUri: 'https://github.com/',
};

export default api;
