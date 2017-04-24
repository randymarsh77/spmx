import createUsage from 'command-line-usage';
import pckg from '../package.json';
import updateBuildConfig from './commands/update-build-config';

module.exports = {
	null: {
		definitions: [
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
			console.log(options.version ? pckg.version : createUsage(tool.null.usage));
			return Promise.resolve({
				code: 0,
			});
		},
	},
	help: {
		definitions: [],
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
			{ name: 'repo', type: String, description: 'The build config repo' },
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
		execute: ({ options }) => updateBuildConfig(options),
	},
	'trigger-downstream-builds': {
		definitions: [
			{ name: 'provider', alias: 'p', type: String, description: 'Only accepts "travis" for now.' },
		],
		usage: [
			{
				header: 'swiftx trigger-downstream-builds',
				content: 'Trigger the builds',
			},
			{
				header: 'Synopsis',
				content: '$ swiftx trigger-downstream-builds <options> [--provider] <provider>',
			},
		],
		execute: () => Promise.resolve()
			.then(() => {
				throw new Error('"trigger-downstream-builds" is not implemented yet :(');
			}),
	},
};
