import createUsage from 'command-line-usage';
import { globalOptions } from './shared/options';

const name = 'help';
const summary = 'Get some help for a command';

module.exports = {
	name,
	summary,
	definitions: [...globalOptions],
	usage: [
		{
			header: `swiftx ${name}`,
			content: summary,
		},
		{
			header: 'Synopsis',
			content: `$ swiftx ${name} <command>`,
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
};
