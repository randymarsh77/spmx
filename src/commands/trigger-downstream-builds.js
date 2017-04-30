import { globalOptions, repoOptions } from './shared/options';
import triggerBuild from './utility/travis';
import { parsePackage } from './utility/swift';
import { getConfig } from './utility/config';

function trigger({ name, build }, owner, configPath, source) {
	const { travis } = build;
	if (!travis) {
		console.log(`Skipping trigger for ${name}; No travis slug.`);
		return Promise.resolve();
	}
	console.log(`Evaluating status of ${name}`);
	return getConfig({ owner, configPath, name })
		.then(config => {
			if (!config) {
				console.log('  ... No existing config; Triggering...');
				return triggerBuild(travis);
			}
			return config.getContent()
				.then(content => {
					const lastBuiltSha = (content.upstream.find(x => x.name === source) || {}).sha;
					const currentSha = 'fromTravisBuild?';
					if (currentSha !== lastBuiltSha) {
						console.log('  ... Out of date; Triggering...');
						return triggerBuild(travis);
					}
					console.log('  ... Up to date; Skipping trigger.');
					return Promise.resolve();
				});
		});
}

function triggerDownstreamBuilds({ owner, configPath }) {
	return parsePackage()
		.then(pkg => getConfig({ name: pkg.name, owner, configPath }))
		.then(config => config.getContent())
		.then(content =>
			(content.downstream || []).reduce((acc, v) =>
				acc.then(() => trigger(v, owner, configPath, content.name), Promise.resolve())))
		.then(() => ({
			code: 0,
		}));
}

const name = 'trigger-downstream-builds';
const summary = 'Triggers builds for registered downstream dependencies if the state of the source repository would result in a different state from that which has been registered in the downstream repository configuration in a new build of the dependency.';

module.exports = {
	name,
	summary,
	definitions: [
		...globalOptions.options,
		...repoOptions.options,
	],
	usage: [
		{
			header: `swiftx ${name}`,
			content: summary,
		},
		{
			header: 'Synopsis',
			content: `$ swiftx ${name} <options>`,
		},
	],
	validate: repoOptions.validate,
	execute: ({ options }) => triggerDownstreamBuilds(options),
};
