import createUsage from 'command-line-usage';
import pkg from '../package.json';
import triggerDownstreamBuilds from './commands/trigger-downstream-builds';
import updateBuildConfig from './commands/update-build-config';

const globalOptions = [
	{ name: 'debug', alias: 'd', type: Boolean, description: 'Run in debug mode.' },
];

module.exports = {
	null: {
		definitions: [
			...globalOptions,
			{ name: 'version', alias: 'v', type: Boolean, description: 'Print the version number.' },
		],
		usage: [
			{
				header: 'swiftx',
				content: 'Extensions for Swift Package Manager',
			},
			{
				header: 'Synopsis',
				content: '$ swiftx <options> <command>',
			},
			{
				header: 'Command List',
				content: [
					{ name: 'help', summary: 'Get some help with a command' },
					{ name: 'update-build-config', summary: 'Configure a build repo to automtically track downstream builds for CI' },
					{ name: 'trigger-downstream-builds', summary: 'Trigger configured downstream builds for CI' },
				],
			},
		],
		execute: ({ options, tool }) => {
			console.log(options.version ? pkg.version : createUsage(tool.null.usage));
			return Promise.resolve({
				code: 0,
			});
		},
	},
	help: {
		definitions: [...globalOptions],
		usage: [
			{
				header: 'swiftx help',
				content: 'Get some help for a command',
			},
			{
				header: 'Synopsis',
				content: '$ swiftx help <command>',
			},
		],
		validate: ({ argv, tool }) => {
			const hasZeroOrOneArgs = !argv || argv.length < 2;
			if (!hasZeroOrOneArgs) {
				throw new Error(`help only accepts 0 or 1 arguments. Found ${argv.length}: ${argv}`);
			}
			const command = argv.length === 1 ? argv[0] : 'help';
			const isValid = tool[command];
			if (!isValid) {
				throw new Error(`Unknown command to get help with: ${command}`);
			}
			return true;
		},
		execute: ({ argv, tool }) => {
			console.log(createUsage(tool[(argv && argv.length === 1 && argv[0]) || 'help'].usage));
			return Promise.resolve({
				code: 0,
			});
		},
	},
	'update-build-config': {
		definitions: [
			...globalOptions,
			{ name: 'owner', type: String, description: 'The github owner; Currently only supports single owners/orgs.' },
			{ name: 'configPath', type: String, description: 'The build config repo and subpath. Example: "builds/swift/config" will look for name.json in the builds repo at the path swift/config/name.json.' },
		],
		usage: [
			{
				header: 'swiftx update-build-config',
				content: 'Update the thing',
			},
			{
				header: 'Synopsis',
				content: '$ swiftx update-build-config <options>',
			},
		],
		validate: ({ options }) => {
			const { owner, configPath } = options;
			if (!owner) throw new Error('Must include the owner option.');
			if (!configPath) throw new Error('Must include the configPath option.');
			return true;
		},
		execute: ({ options }) => updateBuildConfig(options),
	},
	'trigger-downstream-builds': {
		definitions: [
			...globalOptions,
			{ name: 'owner', type: String, description: 'The github owner; Currently only supports single owners/orgs.' },
			{ name: 'configPath', type: String, description: 'The build config repo and subpath. Example: "builds/swift/config" will look for name.json in the builds repo at the path swift/config/name.json.' },
		],
		usage: [
			{
				header: 'swiftx trigger-downstream-builds',
				content: 'Trigger the builds',
			},
			{
				header: 'Synopsis',
				content: '$ swiftx trigger-downstream-builds <options>',
			},
		],
		validate: ({ options }) => {
			const { owner, configPath } = options;
			if (!owner) throw new Error('Must include the owner option.');
			if (!configPath) throw new Error('Must include the configPath option.');
			return true;
		},
		execute: ({ options }) => triggerDownstreamBuilds(options),
	},
};
