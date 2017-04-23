# swiftx
An npm-installable CLI that provides some extra tooling and infrastructure for Swift dev.

# Status

Nothing yet. Working on Travis-CI integrations for automatically triggering downstream builds.

# Roadmap

- Build configuration and management for downstream/upstream relationships
- Add `link` using a global-per-user `.swiftx` json registry
  - Xcode handles symlinked pacakges, `swift build` does not. Might have to get trixy with this one.
