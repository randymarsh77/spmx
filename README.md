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
  - export SWIFTX_CONFIG_PATH=builds/swift/config

script:
  - swift build

after_success:
  - swiftx update-build-config
  - swiftx update-dependency-graph
  - swiftx trigger-downstream-builds

after_failure:
  - swiftx trigger-downstream-builds --force
```

### Notes

`update-build-config` saves the state (sha) of the package dependencies that were built, similar to a `yarn.lock` file except used for a different purpose.

`update-dependency-graph` registers this package as a dependency of upstream builds. Or, removes the dependency if it's no longer valid.

`trigger-downstream-builds` ... ya. The trigger occurs if `swift build` will resolve the dependency to a newer version than that which has been built.

`after_failure` uses `--force` because this failure might impact any downstream builds, so lets just make sure we build them.

### Caveats (Troubleshooting)

- The tool has not yet hit 1.0, but it is stabilizing.
- No deduplication of multiple versions of pulled packages. IE, if `Packages` is not cleaned before script execution and `pack1-1.0.0` and `pack1-1.0.1` exist, behavior is undefined. This shouldn't be a problem for CI builds.

# Future Features

- Add `link` using a global-per-user `.swiftx` json registry. Xcode handles symlinked packages, `swift build` does not. `link` will need to operate in either `--soft` or `--hard` mode, relating to a simple symlink relation for Xcode development, or actual (automated) modifications to Package.swift files.
- Add shrinkwrapping for when you need to lock in state.
