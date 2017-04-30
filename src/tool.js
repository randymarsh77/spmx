import createUsage from 'command-line-usage';
import pkg from '../package.json';
import help from './commands/help';
import triggerDownstreamBuilds from './commands/trigger-downstream-builds';
import updateBuildConfig from './commands/update-build-config';
import updateDependencyGraph from './commands/update-dependency-graph';
import { globalOptions } from './commands/shared/options';

const commands = [
	help,
	updateBuildConfig,
	updateDependencyGraph,
	triggerDownstreamBuilds,
];

module.exports = {
	...commands.reduce((acc, v) => { acc[v.name] = v; return acc; }, {}),
	null: {
		definitions: [
			...globalOptions,
			{ name: 'version', alias: 'v', type: Boolean, description: 'Print the version number.' },
		],
		usage: [
			{
				header: 'swiftx',
				content: 'Extensions and infrastructure tooling for Swift development.',
			},
			{
				header: 'Synopsis',
				content: '$ swiftx <command> <options>',
			},
			{
				header: 'Command List',
				content: commands.map(({ name, summary }) => ({ name, summary })),
			},
		],
		execute: ({ options, tool }) => {
			console.log(options.version ? pkg.version : createUsage(tool.null.usage));
			return Promise.resolve({
				code: 0,
			});
		},
	},
};
