import fs from 'fs';
import os from 'os';
import path from 'path';

const registryPath = path.resolve(os.homedir(), '.swiftx');

async function readLinkRegistry() {
	if (!fs.existsSync(registryPath)) return Promise.resolve({ exports: [], imports: [] });
	const promise = new Promise((resolve, reject) => {
		fs.readFile(registryPath, 'utf8', (err, data) => {
			if (err) reject(err);
			resolve(JSON.parse(data));
		});
	});
	return promise;
}

async function writeLinkRegistry(content) {
	const promise = new Promise((resolve, reject) => {
		fs.writeFile(registryPath, JSON.stringify(content, null, '  '), (err) => {
			if (err) reject(err);
			resolve();
		});
	});
	return promise;
}

module.exports = {
	readLinkRegistry,
	writeLinkRegistry,
};
