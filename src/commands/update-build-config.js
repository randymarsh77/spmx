import fs from 'fs';
// import github from 'github';

function parseDependencies() {
	const promise = new Promise((resolve, reject) => {
		fs.readFile('Package.swift', 'utf8', (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
	return promise
		.then(text => {
			console.log(text);
			return [
				{ source: 'someRepo' },
			];
		});
}

function getConfig({ repo }) {
	return {
		downstream: [
			{ repo },
		],
	};
}

function createOrUpdateConfig() {
}

export default function updateBuildConfig({ downstreamRepo, configRepo, allowableSourcePrefix }) {
	return parseDependencies()
		.then(dependencies => dependencies
			.filter(x => !allowableSourcePrefix || x.source.startsWith(allowableSourcePrefix)))
		.then(dependencies => {
			dependencies.forEach(x => {
				const existingConfig = getConfig({ repo: x, configRepo });
				const downstream = [...existingConfig.downstream
					.filter(y => y.source !== downstreamRepo),
					{ repo: downstreamRepo },
				];
				const updatedConfig = {
					...existingConfig,
					downstream,
				};
				createOrUpdateConfig(x, updatedConfig);
			});
			return {
				code: 0,
			};
		});
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
