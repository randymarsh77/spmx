const globalOptions = {
	options: [
		{ name: 'debug', alias: 'd', type: Boolean, description: 'Run in debug mode.' },
	],
};

const repoOptions = {
	options: [
		{ name: 'owner', type: String, description: 'The github owner; Currently only supports single owners/orgs.' },
		{ name: 'configPath', type: String, description: 'The build config repo and subpath. Example: "builds/swift/config" will look for name.json in the builds repo at the path swift/config/name.json.' },
	],
	validate: ({ options }) => {
		const { owner, configPath } = options;
		if (!owner) throw new Error('Must include the owner option.');
		if (!configPath) throw new Error('Must include the configPath option.');
		return true;
	},
};

module.exports = {
	globalOptions,
	repoOptions,
};
