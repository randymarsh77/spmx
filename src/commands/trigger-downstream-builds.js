import base64 from 'base-64';
import fetch from 'node-fetch';
import github from 'github';
import parsePackage from './utility/swift';

const headers = {};
if (process.env.GitHubToken) {
	headers.Authorization = `token ${process.env.GitHubToken}`;
}
const git = github({ headers });

function getBlobContent(request) {
	return git.gitdata.getBlob(request)
		.then(result => JSON.parse(base64.decode(result.data.content)));
}

function getConfig({ pkg, owner, configPath }) {
	const pathComponents = configPath.split('/');
	const repo = pathComponents[0];
	const basePath = pathComponents.length > 1 ? pathComponents.slice(1).join('/') : '';
	return git.gitdata.getReference({ owner, repo, ref: 'heads/master' })
		.then(head => git.gitdata.getTree({ owner, repo, sha: head.data.object.sha, recursive: true }))
		.then(treeResult => treeResult.data.tree.find(x => x.path.toLowerCase() === `${basePath}/${pkg.name}.json`.toLowerCase()))
		.then(({ sha }) => getBlobContent({ owner, repo, sha }));
}

function trigger({ name, build }) {
	const { travis, branch } = build;
	if (!travis) {
		console.log(`Skipping triggering ${name}; No travis slug.`);
		return Promise.resolve();
	}
	console.log(`Triggering ${name}`);
	return fetch(`https://api.travis-ci.org/repo/${encodeURIComponent(travis)}/requests`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'Travis-API-Version': '3',
			Authorization: `token ${process.env.TravisToken}`,
		},
		body: `{"request": {"branch":"${branch || 'master'}"}}`,
	});
}

export default function triggerDownstreamBuilds({ owner, configPath }) {
	return parsePackage()
		.then(pkg => getConfig({ pkg, owner, configPath }))
		.then(config => Promise.all((config.downstream || []).map(x => trigger(x))))
		.then(() => ({
			code: 0,
		}));
}
