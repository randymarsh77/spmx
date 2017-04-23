#!/usr/bin/env node

import commands from 'command-line-commands';
import createOptions from 'command-line-args';
import tool from './tool';

const { command, argv } = commands([ null, 'help', 'update-build-config', 'trigger-downstream-builds' ]);
const cmd = tool[command];
const options = createOptions(cmd.definitions, argv);

const context = { options, argv, tool };

if (cmd.validate && !cmd.validate(context)) {
	console.log('Invalid command, arguments, and/or options');
	process.exit(1);
}

cmd.execute(context);
