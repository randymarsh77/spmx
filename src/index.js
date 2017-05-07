#!/usr/bin/env node

import commands from 'command-line-commands';
import createOptions from 'command-line-args';
import tool from './tool';

let isDebug = false;

Promise.resolve()
	.then(() => {
		const { command, argv } = commands([null, ...Object.keys(tool)]);
		const cmd = tool[command];
		const options = {
			...((cmd.populateOptions && cmd.populateOptions()) || {}),
			...createOptions(cmd.definitions, argv),
		};
		const context = { argv, tool, options };
		isDebug = options.debug;
		return { cmd, context };
	})
	.then(({ cmd, context }) => (!cmd.validate || cmd.validate(context)) && { cmd, context })
	.then(({ cmd, context }) => cmd.execute(context))
	.then(result => {
		const { code, error } = result;
		if (error) {
			console.error(error);
		}
		process.exit(code);
	})
	.catch(error => {
		console.error(error.message);
		if (isDebug) {
			console.error(error);
		}
		process.exit(1);
	});
