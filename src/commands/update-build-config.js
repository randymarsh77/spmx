import fs from 'fs';
// import github from 'github';

const testPrefix = {
	prefix: 'https:\/\/github\.com\/randymarsh77\/',
	getUrl: (pre, match) => `${pre}${match}`,
};

function parseDependencies(allowablePrefixes = [testPrefix]) {
	const promise = new Promise((resolve, reject) => {
		fs.readFile('Package.swift', 'utf8', (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
	return promise
		.then(text => {
			const repos = [];
			allowablePrefixes.forEach(({ prefix, getUrl }) => {
				const re = new RegExp(`\.Package[ ]*.*${prefix}([a-zA-Z0-9]*)`, 'g');
				let match = re.exec(text);
				while (match != null) {
					repos.push({
						source: getUrl(prefix, match[1]),
					});
					match = re.exec(text);
				}
			});
			console.log(repos);
			return repos;
		});
}

function getConfig({ repo }) {
	// get tree with configRepo
	return {
		downstream: [
			{ repo },
		],
	};
}

// return git tree
function createOrUpdateConfig() {
}

export default function updateBuildConfig({ downstreamRepo, configRepo, allowableSourcePrefixes }) {
	return parseDependencies(allowableSourcePrefixes)
		.then(dependencies =>
			Promise.all(dependencies.forEach(repo =>
				getConfig({ repo, configRepo })
					.then(config => {
						const downstream = [
							...config.downstream
								.filter(y => y.source !== downstreamRepo),
							{ repo: downstreamRepo },
						];
						const updatedConfig = {
							...config,
							downstream,
						};
						// create tree
						return { updatedConfig };
					})
					.then(({ tree, config }) => createOrUpdateConfig(tree, config)))))
		.then(() => {
			// create commit and push
		})
		.then(() => ({
			code: 0,
		}));
}

//
// update build config
//
// parse package.swift
// get upstream repos and versions (for packages wth allowable source prefix)
// clone build repo, or get or create each file at /{repo}/{upstream}.json via api, ideally
// update to {
//   repo: {upstream},
//   ...,
//   downstream: [
//	   { repo: {self} }
//   ],
// }
//
// push to build repo, or use api
//
