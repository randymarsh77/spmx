import createUsage from 'command-line-usage';
import updateBuildConfig from './commands/update-build-config';

module.exports = {
	null: {
		definitions: [
			{ name: 'version', alias: 'v', type: Boolean, description: 'Print the version number.' }
		],
		usage: [
			{
				header: 'spmx',
				content: 'Extensions for Swift Package Manager',
			},
			{
				header: 'synopsis',
				content: '$ spmx <options> <command>'
			},
			{
				header: 'Command List',
				content: [
					{ name: 'update-build-config', summary: 'Configure a build repo to automtically track downstream builds for CI' },
					{ name: 'trigger-downstream-builds', summary: 'Trigger configured downstream builds for CI' },
				],
			}
		],
		execute: ({ options, tool }) => console.log(options.version ? '0.0.1' : createUsage(tool[null].usage))
	},
	'help': {
		definitions: [],
		usage: [
			{
				header: 'spmx help',
				content: 'Get some help for a command',
			},
			{
				header: 'synopsis',
				content: '$ spmx help <command>'
			},
		],
		validate: ({ argv, tool }) => argv && ((argv.length === 1 && argv[0] && tool[argv[0]]) || argv.length == 0),
		execute: ({ argv, tool }) => console.log(createUsage(tool[(argv && argv.length === 1 && argv[0]) || 'help'].usage)),
	},
	'update-build-config': {
		definitions: [
			{ name: 'repo', type: String, description: 'The build config repo' }
		],
		usage: [
			{
				header: 'spmx update-build-config',
				content: 'Update the thing'
			},
			{
				header: 'synopsis',
				content: '$ spmx update-build-config <options>'
			}
		],
		execute: (options) => updateBuildConfig(),
	},
	'trigger-downstream-builds': {
		definitions: [
			{ name: 'provider', alias: 'p', type: String, description: 'Only accepts "travis" for now.' }
		],
		usage: [
			{
				header: 'spmx trigger-downstream-builds',
				content: 'Trigger the builds'
			},
			{
				header: 'synopsis',
				content: '$ spmx trigger-downstream-builds <options> [--provider] <provider>'
			}
		]
	}
}
