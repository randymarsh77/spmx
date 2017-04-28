import base64 from 'base-64';
import github from 'github';
import parsePackage from './utility/swift';

const headers = {};
if (process.env.GitHubToken) {
	headers.Authorization = `token ${process.env.GitHubToken}`;
}
const git = github({ headers });

const build = {};
if (process.env.TRAVIS_REPO_SLUG) {
	build.travis = process.env.TRAVIS_REPO_SLUG;
}

function createConfig({ owner, repo, name, downstream }, expectedPath) {
	console.log('Creating config at', expectedPath);
	return Promise.resolve({
		name,
		source: `https://github.com/${owner}/${name}`,
		downstream,
	}).then(config => git.repos.createFile({
		owner,
		repo,
		path: expectedPath,
		message: `[SWIFTX-BOT] Adding config for ${name}`,
		content: base64.encode(`${JSON.stringify(config, null, '	')}\n`),
	})).then(result => {
		console.log('  ... Success', name);
		console.log(result);
	});
}

function getBlobContent(request) {
	return git.gitdata.getBlob(request)
		.then(result => JSON.parse(base64.decode(result.data.content)));
}

function updateConfig({ owner, repo }, pkg, blobPath) {
	console.log('Processing config update for ', blobPath);
	return git.gitdata.getReference({ owner, repo, ref: 'heads/master' })
		.then(head => git.gitdata.getTree({ owner, repo, sha: head.data.object.sha, recursive: true }))
		.then(treeResult => treeResult.data.tree.find(x => x.path === blobPath))
		.then(({ sha }) => getBlobContent({ owner, repo, sha }).then(config => ({ config, sha })))
		.then(({ config, sha }) => {
			const needsReference = pkg.dependencies.find(x => x.name === config.name);
			const hasReference = config.downstream.find(x => x.name === pkg.name);
			if (needsReference && !hasReference) {
				console.log('  ... Adding reference');
				return {
					config: {
						...config,
						downstream: [
							...config.downstream,
							{ name: pkg.name, build },
						],
					},
					sha,
				};
			} else if (!needsReference && hasReference) {
				console.log('  ... Removing reference');
				return {
					config: {
						...config,
						downstream: config.downstream.filter(x => x.name !== pkg.name),
					},
					sha,
				};
			}
			console.log('  ... Skipping');
			return {};
		})
		.then(({ config, sha }) => (config ? git.repos.updateFile({
			owner,
			repo,
			path: blobPath,
			message: `[SWIFTX-BOT] Adding ${pkg.name} as a dependency to ${config.name}`,
			content: base64.encode(`${JSON.stringify(config, null, '	')}\n`),
			sha,
		}) : null))
		.then(result => {
			if (result) {
				console.log('Updated config with', pkg.name);
			}
		});
}

function processPackage({ pkg, owner, configPath }) {
	const pathComponents = configPath.split('/');
	const repo = pathComponents[0];
	const basePath = pathComponents.length > 1 ? pathComponents.slice(1).join('/') : '';
	return git.gitdata.getReference({ owner, repo, ref: 'heads/master' })
		.then(head => git.gitdata.getTree({ owner, repo, sha: head.data.object.sha, recursive: true }))
		.then(treeResult => treeResult.data.tree.filter(x => x.path.startsWith(basePath) && x.path.endsWith('.json')))
		.then(existingConfigs => {
			let updatePromise = Promise.resolve();
			const processedConfigPaths = [];
			existingConfigs.forEach(blobMeta => {
				processedConfigPaths.push(blobMeta.path);
				updatePromise = updatePromise
					.then(() => updateConfig({ owner, repo }, pkg, blobMeta.path));
			});
			return updatePromise.then(() => processedConfigPaths);
		})
		.then(processedConfigPaths => {
			const missingConfigs = pkg.dependencies
				.filter(x => !processedConfigPaths.find(y => y === `${basePath}/${x.name}.json`));
			let createPromise = missingConfigs.reduce((acc, x) => acc.then(() =>
				createConfig({ owner, repo, name: x.name, downstream: [{ name: pkg.name, build }] }, `${basePath}/${x.name}.json`)), Promise.resolve());
			if (missingConfigs.find(x => x === `${basePath}/${pkg.name}.json`)) {
				createPromise = createPromise.then(() =>
					createConfig({ owner, repo, name: pkg.name, downstream: [] }, `${basePath}/${pkg.name}.json`));
			}
			return createPromise;
		});
}

export default function updateBuildConfig({ owner, configPath }) {
	return parsePackage(owner)
		.then(pkg => processPackage({ pkg, owner, configPath }))
		.then(() => ({
			code: 0,
		}));
}
