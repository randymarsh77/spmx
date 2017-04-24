import fs from 'fs';
// import github from 'github';

function parseDependencies() {
	const swiftPackage = fs.readFileSync('Package.Swift', 'utf8');
	console.log('package: ', swiftPackage);
	return [
		{ source: 'someRepo' },
	];
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
	const dependencies = parseDependencies()
		.filter(x => !allowableSourcePrefix || x.source.startsWith(allowableSourcePrefix));
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
