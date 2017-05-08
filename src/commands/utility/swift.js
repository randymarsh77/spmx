import fs from 'fs';
import { getRemoteUrl, getRevision } from './git';
import { parsePackage } from './swift-package-parser';

function getPackageState({ url, version }, pulledPackages) {
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

function tagArray(tag) {
	return tag.split('.');
}

function tagGreaterThanOrEqualTo(a, b) {
	const maxLength = Math.max(a.length, b.length);
	for (let i = 0; i < maxLength; i++) {
		if (a[i] < b[i]) return false;
	}
	return true;
}

function tagLessThanOrEqualTo(a, b) {
	const maxLength = Math.max(a.length, b.length);
	for (let i = 0; i < maxLength; i++) {
		if (a[i] > b[i]) return false;
	}
	return true;
}

function isValidVersionTag(tag) {
	const parts = tag.tag.split('.');
	return parts && parts.length !== 0 && parts.every(x => !isNaN(x));
}

function resolveTag(version, tags) {
	const { lowerBound, upperBound } = version;
	const lowest = tagArray(lowerBound);
	const highest = tagArray(upperBound);
	const resolved = tags.filter(isValidVersionTag).reduce((cur, tag) => {
		const tagData = tagArray(tag.tag);
		const curData = cur && tagArray(cur.tag);
		const tagWithinRange = tagGreaterThanOrEqualTo(tagData, lowest)
			&& tagLessThanOrEqualTo(tagData, highest);
		const tagGreaterThanCur = !curData || tagGreaterThanOrEqualTo(tagData, curData);
		return tagGreaterThanCur && tagWithinRange ? tag : cur;
	}, null);
	return resolved;
}

module.exports = {
	getUpstreamState,
	resolveTag,
};
