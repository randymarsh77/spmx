import { globalOptions, configPathOption, ownerOption, repoOption } from './shared/options';
import { getUpstreamState } from './utility/swift';
import { parsePackage } from './utility/swift-package-parser';
import { createConfig, getConfig, publishNewConfig, isConfigContentEquivalent } from './utility/config';

function getOrCreateConfig({ owner, repo, configPath, pkg, upstream }) {
	const getSpecific = () => getConfig({ name: pkg.name, owner, configPath });
	return getSpecific()
		.then(config => (config ?
			Promise.resolve(config) :
			publishNewConfig({
				owner,
				configPath,
				content: createConfig({
					owner,
					repo,
					name: pkg.name,
					upstream,
					downstream: [],
				}),
			}).then(getSpecific)));
}

function updateConfig({ config, pkg, upstream }) {
	return config.getContent()
		.then(content => {
			const updatedContent = {
				...content,
				upstream,
			};
			console.log('updated: ', updatedContent);
			return (true && isConfigContentEquivalent(content, updatedContent)) ?
				Promise.resolve() :
				config.updateContent(updatedContent, `[SWIFTX-BOT] Updating upstream for ${pkg.name}`);
		});
}

function updateBuildConfig({ owner, repo, configPath }) {
	return parsePackage()
		.then(pkg => getUpstreamState({ pkg }).then(upstream => {
			console.log(`Package has ${upstream.length} pulled dependencies`);
			return { upstream, pkg };
		}))
		.then(({ upstream, pkg }) => getOrCreateConfig({ pkg, owner, repo, configPath, upstream })
			.then(config => ({ upstream, pkg, config })))
		.then(updateConfig)
		.then(() => ({
			code: 0,
		}));
}

const name = 'update-build-config';
const summary = 'Updates the state of upstream dependencies registered for this repository based on the local filesystem.';

module.exports = {
	name,
	summary,
	definitions: [
		...globalOptions.options,
		...configPathOption.options,
		...repoOption.options,
		...ownerOption.options,
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
		...repoOption.populateOptions(),
		...ownerOption.populateOptions(),
	}),
	validate: (x) => repoOption.validate(x)
		&& ownerOption.validate(x)
		&& configPathOption.validate(x),
	execute: ({ options }) => updateBuildConfig(options),
};
