import base64 from 'base-64';
import github from './github';

function getBlobContent(request) {
	return github.gitdata.getBlob(request)
		.then(result => JSON.parse(base64.decode(result.data.content)));
}

function parseConfigPath(configPath) {
	const pathComponents = configPath.split('/');
	const repo = pathComponents[0];
	const basePath = (pathComponents.length > 1 ? pathComponents.slice(1).join('/') : '').toLowerCase();
	return {
		repo,
		basePath,
	};
}

export function createConfig({ owner, name, upstream, downstream }) {
	return {
		name,
		source: `${github.swiftx.baseUri}${owner}/${name}`,
		upstream,
		downstream,
	};
}

export function getAllConfigs({ owner, configPath, predicate }) {
	const { repo, basePath } = parseConfigPath(configPath);
	return github.gitdata.getReference({ owner, repo, ref: 'heads/master' })
		.then(head =>
			github.gitdata.getTree({ owner, repo, sha: head.data.object.sha, recursive: true }))
		.then(treeResult => treeResult.data.tree
			.filter(x => x.path.startsWith(basePath) && x.path.endsWith('.json'))
			.filter(x => !predicate || predicate(x)))
		.then(files => files.map(meta => ({
			meta,
			getContent: () => getBlobContent({ owner, repo, sha: meta.sha }),
			updateContent: (content, message) => github.repos.updateFile({
				owner,
				repo,
				message,
				sha: meta.sha,
				path: meta.path,
				content: base64.encode(`${JSON.stringify(content, null, '	')}\n`),
			}),
		})));
}

export function getConfig({ name, owner, configPath }) {
	return getAllConfigs({
		owner,
		configPath,
		predicate: (x) => x.path.toLowerCase().endsWith(`${name}.json`.toLowerCase()),
	}).then(matches => (matches && matches.length > 0 ? matches[0] : null));
}

export function publishNewConfig({ owner, configPath, content }) {
	const { name } = content;
	const { repo, basePath } = parseConfigPath(configPath);
	const destination = `${basePath}/${name.toLowerCase()}.json`;
	console.log(`Publishing config for ${name} to ${destination}`);
	return github.repos.createFile({
		owner,
		repo,
		message: `[SWIFTX-BOT] Adding config for ${name}`,
		path: destination,
		content: base64.encode(`${JSON.stringify(content, null, '	')}\n`),
	}).then(() => {
		console.log('  ... Success');
	});
}

export function isConfigContentEquivalent(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}
