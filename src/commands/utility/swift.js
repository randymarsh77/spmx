import fs from 'fs';

export default function parsePackage(owner) {
	const promise = new Promise((resolve, reject) => {
		fs.readFile('Package.swift', 'utf8', (err, data) => {
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
