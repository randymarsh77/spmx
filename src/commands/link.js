import { readLinkRegistry, writeLinkRegistry } from './shared/link-registry';
import { globalOptions } from './shared/options';
import { parsePackage, PackageParseMode } from './utility/swift-package-parser';

async function createExportProfile() {
	const pkg = await parsePackage({ mode: PackageParseMode.Package });
	const { name, path } = pkg;
	return {
		name,
		path,
	};
}

async function exportLink() {
	const profile = await createExportProfile();
	const registry = await readLinkRegistry();
	const existing = registry.exports.find(x => x.name === profile.name);
	if (existing) {
		console.log(`There is already a registered package for ${existing.name}`);
		return;
	}

	registry.exports.push(profile);
	await writeLinkRegistry(registry);
}

function importLink() {
	throw new Error('import not implemented');
	// if not exists:
	//   mkdir ~/.swiftx-links/packageName
	//   cd; git init; cd ..
	// cp Package.swift .swiftx-links/packageName/Package.swift
	// cd; git commit -m "${Add: link}"
	// gen new Package.swift with file url and any version
	// gen xcode if --gen-xcode
}

// remove link
// find commit that added from most recent, revert.
// create fresh branch, replace with current Package.swift, commit
// merge something
// cp reverted and merged Package.swift to Package.swift.
// update registry

function runLink({ source }) {
	return (source ? importLink() : exportLink())
		.then(() => ({
			code: 0,
		}));
}

const name = 'link';
const summary = 'Either exports this package as a possible local import, or imports the specified local source.';

module.exports = {
	name,
	summary,
	definitions: [
		...globalOptions.options,
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
	execute: ({ options }) => runLink(options),
};
