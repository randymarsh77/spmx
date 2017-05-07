import fs from 'fs';
import { getRemoteUrl, getRevision } from './git';
import { parsePackage } from './swift-package-parser';

function getPackageState({ url, version }, pulledPackages) {
	// fetch url/Package.swift blob,
	// parse to get name? can't parse package without being stored locally
	// or... use pulled package upstream to get url where pulled from... yes
	const pkg = pulledPackages.find(x => x.url.toLowerCase() === url.toLowerCase());
	if (!pkg) {
		console.warn(`No pulled package sourced from ${url}; Revision data will not be configured.`);
		return Promise.resolve('unknown');
	}
	return {
		...pkg,
		version,
	};
}

function parsePulledPackages() {
	const promise = new Promise((resolve, reject) => {
		fs.readdir('Packages', (err, items) => {
			if (err) reject(err);
			resolve(items);
		});
	});
	return promise
		.then(items => items.map(x => ({ cwd: `Packages/${x}/` })))
		.then(options => {
			const promises = options.map(x =>
				Promise.all([parsePackage(x), getRevision(x), getRemoteUrl(x)]));
			return Promise.all(promises);
		})
		.then(packages => packages.map(x => {
			if (!x || x.length !== 3) throw new Error('Failure in parsing pulled packages');
			const { name } = x[0];
			const sha = x[1];
			const url = x[2];
			return { name, sha, url };
		}));
}

function packagesDirExists() {
	return fs.existsSync('Packages');
}

function getUpstreamState({ pkg }) {
	if (!packagesDirExists()) return Promise.resolve([]);
	return parsePulledPackages()
		.then(pulled => pkg.dependencies.map(x => getPackageState(x, pulled)));
}

module.exports = {
	getUpstreamState,
};
