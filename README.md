# swiftx
An npm-installable CLI that provides some extra tooling and infrastructure for Swift dev.

# Features

## Travis-CI integrations for automatically triggering downstream builds.

Pushing and tagging starts a Travis build. The Travis build script calls to `swiftx` to update a dependency graph contained in the repo of your choosing, and then triggers any dependent builds if necessary.

### Usage

- Configure a repo that is not linked to a CI build (I mean, do what you do but...).
  - See [my example](https://github.com/randymarsh77/builds)
  - If you use a subpath (like `swift/config`), you'll need to push that tree to git before hand. `swiftx` can't (yet) create the tree.
- Configure a `GitHubToken` and `TravisToken` environment variable in your Travis build settings.
  - This is to enable pushing to the config repo and triggering builds.
- Make your `.travis.yml` look something like this:
```
language: objective-c
osx_image: xcode8.2
node_js:
  - "6"

before_script:
  - npm install -g swiftx

script:
  - swift build

after_success:
  - swiftx update-build-config --owner randymarsh77 --configPath builds/swift/config
  - swiftx update-dependency-graph --owner randymarsh77 --configPath builds/swift/config
  - swiftx trigger-downstream-builds --owner randymarsh77 --configPath builds/swift/config

after_failure:
  - swiftx trigger-downstream-builds --owner randymarsh77 --configPath builds/swift/config --force
```

### Notes

It's a little verbose at the moment,in terms of passing `--owner` and `--configPath` for each command, and for doing all three commands instead of just one or two. This might change in the future.

`update-build-config` saves the state (sha) of the package dependencies that were built, similar to a `yarn.lock` file (but, not really the same at all).

`update-dependency-graph` registers this package as a dependency of upstream builds. Or, removes the dependency if it's no longer valid.

`trigger-downstream-builds` ... ya.

`after_failure` uses `--force` because this failure might impact any downstream builds, so lets just make sure we build them.

### Caveats (Troubleshooting)

- `Package.swift` dependencies are required to be specified as `https://github.com/${owner}/...`.
  - This was just an easy regex to write, before I use actual `swift` interpreter to read and spit out json.
  - Note that the exclusion of `www` is intentional. `spm` doesn't have knowledge of the two domains pointing to the same place, so having a mix in your dependencies makes for bad news for consumers with shared dependencies. Just avoid it and prefer the shorter format. (Or, submit a PR, open an issue, etc)
- No version info is parsed. Conditional triggering is partially broken, but the resulting firehose isn't that detrimental.
  - Parsing versions and then resolving what code actually gets pulled is a next step. One that probably belongs when using `swift` to read the package file works, since the regex parsing would get exponentially more risky and fragile.
- The tool is still in infancy; If you're actually using it and come across problems or improvements, feel free to open issues. I might have work planned, but this can help prioritize.

# Future Features

Add `link` using a global-per-user `.swiftx` json registry. Xcode handles symlinked packages, `swift build` does not. `link` will need to operate in either `--soft` or `--hard` mode, relating to a simple symlink relation for Xcode development, or actual (automated) modifications to Package.swift files.

