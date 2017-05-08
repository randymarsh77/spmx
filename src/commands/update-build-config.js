import { globalOptions, configPathOption, ownerOption } from './shared/options';
import { getRemoteUrl } from './utility/git';
import { getUpstreamState } from './utility/swift';
import { parsePackage } from './utility/swift-package-parser';
import { createConfig, getConfig, publishNewConfig, isConfigContentEquivalent } from './utility/config';

function getOrCreateConfig({ owner, source, configPath, pkg, upstream }) {
	const getSpecific = () => getConfig({ name: pkg.name, owner, configPath });
	return getSpecific()
		.then(config => (config ?
			Promise.resolve(config) :
			publishNewConfig({
				owner,
				configPath,
				content: createConfig({
					name: pkg.name,
					source,
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
				name: pkg.name,
				upstream,
			};
			return (true && isConfigContentEquivalent(content, updatedContent)) ?
				Promise.resolve() :
				config.updateContent(updatedContent, `[SWIFTX-BOT] Updating upstream for ${pkg.name}`);
		});
}

function updateBuildConfig({ owner, configPath }) {
	return parsePackage()
		.then(pkg => getUpstreamState({ pkg }).then(upstream => {
			console.log(`Package has ${upstream.length} pulled dependenc${upstream.length === 1 ? 'y' : 'ies'}`);
			return getRemoteUrl()
				.then(source => ({ upstream, pkg, source }));
		}))
		.then(({ upstream, pkg, source }) =>
			getOrCreateConfig({ pkg, owner, source, configPath, upstream })
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
		...ownerOption.populateOptions(),
		...configPathOption.populateOptions(),
	}),
	validate: (x) => ownerOption.validate(x) && configPathOption.validate(x),
	execute: ({ options }) => updateBuildConfig(options),
};
