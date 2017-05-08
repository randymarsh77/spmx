import config from './config';

const globalOptions = {
	options: [
		{ name: 'debug', alias: 'd', type: Boolean, description: 'Run in debug mode.' },
	],
};

const configPathOption = {
	options: [
		{ name: 'configPath', type: String, description: 'The build config repo and subpath. Example: "builds/swift/config" will look for name.json in the builds repo at the path swift/config/name.json.' },
	],
	populateOptions: () => {
		const configPath = process.env.SWIFTX_CONFIG_PATH || config.getOption('configPath');
		return configPath ? { configPath } : {};
	},
	validate: ({ options }) => {
		const { configPath } = options;
		if (!configPath) throw new Error('Must include the configPath option.');
		return true;
	},
};

const ownerOption = {
	options: [
		{ name: 'owner', type: String, description: 'The github owner; Currently only supports single owners.' },
	],
	validate: ({ options }) => {
		const { owner } = options;
		if (!owner) throw new Error('Must include the owner option, or set TRAVIS_REPO_SLUG.');
		return true;
	},
	populateOptions: () => {
		const parts = (process.env.TRAVIS_REPO_SLUG || '').split('/');
		return (parts && parts.length !== 0) ? { owner: parts[0] } : {};
	},
};

const repoOption = {
	options: [
		{ name: 'repo', type: String, description: 'The github repo.' },
	],
	validate: ({ options }) => {
		const { repo } = options;
		if (!repo) throw new Error('Must include the repo option, or set TRAVIS_REPO_SLUG.');
		return true;
	},
	populateOptions: () => {
		const parts = (process.env.TRAVIS_REPO_SLUG || '').split('/');
		return (parts && parts.length > 1) ? { repo: parts[1] } : {};
	},
};

module.exports = {
	globalOptions,
	configPathOption,
	ownerOption,
	repoOption,
};
