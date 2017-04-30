import fs from 'fs';
import getRevision from './git';

export function parsePackage(owner, file) {
	const promise = new Promise((resolve, reject) => {
		fs.readFile(file || 'Package.swift', 'utf8', (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
	return promise
		.then(text => {
			const name = (new RegExp('name[ ]*:[ ]*"([a-zA-Z0-9]*)"')).exec(text)[1];
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
			return {
				name,
				dependencies,
			};
		});
}

function getPackageRevision({ name }, pulledPackages) {
	const pkg = pulledPackages.find(x => x.pkg.name.toLowerCase() === name.toLowerCase());
	if (!pkg) {
		console.warn(`No pulled package matching ${name}; Revision will not be configured.`);
		return Promise.resolve('unknown');
	}
	return getRevision(`Packages/${pkg.dir}`)
		.then(sha => ({
			name,
			sha,
		}));
}

function parsePulledPackages(owner) {
	const promise = new Promise((resolve, reject) => {
		fs.readdir('Packages', (err, items) => {
			if (err) reject(err);
			resolve(items);
		});
	});
	return promise
		.then(items => Promise.all(items.map(x =>
			parsePackage(owner, `Packages/${x}/Package.swift`)
				.then(pkg => ({ dir: x, pkg })))));
}

export function getResolvedPackageShas({ owner, pkg }) {
	return parsePulledPackages(owner)
		.then(pulled =>
			Promise.all(pkg.dependencies.map(x => getPackageRevision(x, pulled))));
}
