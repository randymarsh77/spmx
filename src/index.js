#!/usr/bin/env node

import commands from 'command-line-commands';
import createOptions from 'command-line-args';
import tool from './tool';

Promise.resolve()
	.then(() => {
		const { command, argv } = commands([null, 'help', 'update-build-config', 'trigger-downstream-builds']);
		const cmd = tool[command];
		const options = createOptions(cmd.definitions, argv);
		const context = { options, argv, tool };
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
		process.exit(1);
	});
