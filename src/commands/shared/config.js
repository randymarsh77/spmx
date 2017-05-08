import fs from 'fs';

function readConfig() {
	if (!fs.existsSync('.swiftx')) return {};
	const data = fs.readFileSync('.swiftx', 'utf8');
	return JSON.parse(data);
}

const data = readConfig();

module.exports = {
	getOption: (option) => data.options[option],
};
