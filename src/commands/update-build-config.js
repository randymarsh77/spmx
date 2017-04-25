import fs from 'fs';
import github from 'github';
import base64 from 'base-64';

const git = github();

function parseDependencies(owner) {
	const promise = new Promise((resolve, reject) => {
		fs.readFile('Package.swift', 'utf8', (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
	return promise
		.then(text => {
			const dependencies = [];
			[owner].forEach(x => {
				const prefix = `https:\/\/github\.com\/${x}\/`;
				const re = new RegExp(`\.Package[ ]*.*${prefix}([a-zA-Z0-9]*)`, 'g');
				let match = re.exec(text);
				while (match != null) {
					dependencies.push({
						name: match[1],
						source: `${prefix}${match[1]}`,
					});
					match = re.exec(text);
				}
			});
			return dependencies;
		});
}

function createConfig(owner, name) {
	return Promise.resolve({
		name,
		source: `https://github.com/${owner}/${name}`,
	});
}

function getBlobContent(request) {
	return git.gitdata.getBlob(request)
		.then(result => JSON.parse(base64.decode(result.data.content)));
}

function getConfigs({ dependencies, owner, configPath }) {
	const pathComponents = configPath.split('/');
	const repo = pathComponents[0];
	const basePath = pathComponents.length > 1 ? pathComponents.slice(1).join('/') : '';
	return git.gitdata.getReference({ owner, repo, ref: 'heads/master' })
		.then(head => git.gitdata.getTree({ owner, repo, sha: head.data.object.sha, recursive: true }))
		.then(treeResult => Promise.all(dependencies.map(x => {
			const { name } = x;
			const blobMeta = treeResult.data.tree.find(y => y.path === `${basePath}/${name}.json`);
			return !blobMeta ?
				createConfig(owner, name) :
				getBlobContent({ owner, repo, sha: blobMeta.sha });
		})));
}

export default function updateBuildConfig({ owner, configPath }) {
	return parseDependencies(owner)
		.then(dependencies => getConfigs({ dependencies, owner, configPath }))
		.then(configs => {
			console.log('got configs: ', configs);
			// TODO
			// ... update them with downstream info, if needed
			// ... get self config, update lastTriggered to ensure we have a commit
			// ... commit all configs
		})
		.then(() => ({
			code: 0,
		}));
}
