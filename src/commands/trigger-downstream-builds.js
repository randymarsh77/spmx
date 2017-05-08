import { globalOptions, ownerOption, configPathOption } from './shared/options';
import { getRevision, getTags } from './utility/git';
import triggerBuild from './utility/travis';
import { resolveTag } from './utility/swift';
import { parsePackage } from './utility/swift-package-parser';
import { getConfig } from './utility/config';

const travisSha = process.env.TRAVIS_COMMIT;

function trigger({ name, build }, owner, configPath, source, force) {
	const { travis } = build;
	if (!travis) {
		console.log(`Skipping trigger for ${name}; No travis slug.`);
		return Promise.resolve();
	}
	if (force) {
		console.log('  ... Force option set; Triggering...');
		return triggerBuild(travis);
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
					getRevision().then(sha => ({ content, sha }))))
				.then(({ content, sha }) => {
					const state = (content.upstream.find(x => x.name === source) || {});
					const lastBuiltSha = state.sha;
					if (sha === lastBuiltSha) {
						console.log('  ... Up to date; Skipping trigger.');
						return Promise.resolve();
					}

					const { version } = state;
					if (!version) {
						console.log(`  ... No version data and Current: ${sha} != Last Built: ${lastBuiltSha}`);
						console.log('  ... Status unknown; Triggering...');
						return Promise.resolve();
						// return triggerBuild(travis);
					}

					console.log('get tags');

					return getTags()
						.then(tags => resolveTag(version, tags))
						.then(tag => {
							console.log(`  ... Resolved version to ${tag.tag}`);
							if (tag.sha !== lastBuiltSha) {
								console.log(`  ... Resolved tag: ${tag.tag} at ${tag.sha} != Last Built: ${lastBuiltSha}`);
								console.log('  ... Out of date; Triggering...');
								return triggerBuild(travis);
							}

							console.log('  ... Up to date; Skipping trigger.');
							return Promise.resolve();
						});
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
		...ownerOption.options,
		...configPathOption.options,
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
	populateOptions: () => ({
		...ownerOption.populateOptions(),
		...configPathOption.populateOptions(),
	}),
	validate: (x) => ownerOption.validate(x) && configPathOption.validate(x),
	execute: ({ options }) => triggerDownstreamBuilds(options),
};
