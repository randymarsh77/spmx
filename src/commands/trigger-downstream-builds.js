import { globalOptions, repoOptions } from './shared/options';
import getRevision from './utility/git';
import triggerBuild from './utility/travis';
import { parsePackage } from './utility/swift';
import { getConfig } from './utility/config';

const travisSha = process.env.TRAVIS_COMMIT;

function trigger({ name, build }, owner, configPath, source, force) {
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
				.then(content => (travisSha ?
					Promise.resolve({ content, sha: travisSha }) :
					getRevision('.').then(sha => ({ content, sha }))))
				.then(({ content, sha }) => {
					const lastBuiltSha = (content.upstream.find(x => x.name === source) || {}).sha;
					if (sha !== lastBuiltSha) {
						console.log(`  ... Current: ${sha} != Last Built: ${lastBuiltSha}`);
						console.log('  ... Out of date; Triggering...');
						return triggerBuild(travis);
					}
					if (force) {
						console.log('  ... Force option set; Triggering...');
						return triggerBuild(travis);
					}
					console.log('  ... Up to date; Skipping trigger.');
					return Promise.resolve();
				});
		});
}

function triggerDownstreamBuilds({ owner, configPath, force }) {
	return parsePackage()
		.then(pkg => getConfig({ name: pkg.name, owner, configPath }))
		.then(config => config.getContent())
		.then(content => {
			const downstream = content.downstream || [];
			console.log(`Package has ${downstream.length} registered dependencies`);
			return { downstream, name: content.name };
		})
		.then(({ downstream, name }) =>
			downstream.reduce((acc, v) =>
				acc.then(() => trigger(v, owner, configPath, name, force)), Promise.resolve()))
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
		{ name: 'force', type: Boolean, description: 'Force triggering of all downstream builds, instead of looking at state.' },
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
