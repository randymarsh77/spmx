import { globalOptions, repoOptions } from './shared/options';
import { parsePackage, getResolvedPackageShas } from './utility/swift';
import { createConfig, getConfig, publishNewConfig, isConfigContentEquivalent } from './utility/config';

function getOrCreateConfig({ owner, configPath, pkg, shas }) {
	const getSpecific = () => getConfig({ name: pkg.name, owner, configPath });
	return getSpecific()
		.then(config => (config ?
			Promise.resolve(config) :
			publishNewConfig({
				owner,
				configPath,
				content: createConfig({
					owner,
					name: pkg.name,
					upstream: shas,
					downstream: [],
				}),
			}).then(getSpecific)));
}

function updateConfig({ config, pkg, shas }) {
	return config.getContent()
		.then(content => {
			const updatedContent = {
				...content,
				upstream: shas,
			};
			return isConfigContentEquivalent(content, updatedContent) ?
				Promise.resolve() :
				config.updateContent(updatedContent, `[SWIFTX-BOT] Updating upstream for ${pkg.name}`);
		});
}

function updateBuildConfig({ owner, configPath }) {
	return parsePackage(owner)
		.then(pkg => getResolvedPackageShas(pkg).then(shas => ({ shas, pkg })))
		.then(({ shas, pkg }) => getOrCreateConfig({ pkg, owner, configPath, shas })
			.then(config => ({ shas, pkg, config })))
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
	execute: ({ options }) => updateBuildConfig(options),
};
