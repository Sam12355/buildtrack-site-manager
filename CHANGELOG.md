# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning is
[semantic](https://semver.org/).

## [Unreleased]

### Planned
- A worked example of a staged rollout with real crash-rate thresholds
- Pinning GitHub Actions by digest rather than tag

## [0.1.0] - 2026-03

### Added
- Version derivation from git tags with full semver precedence, including prereleases
- Bump decision from Conventional Commits, conservative for anything unrecognised
- Release notes limited to user-visible categories, with a test that the output does not
  look like a commit dump
- Build numbers from commit count with a migration offset
- Release validation refusing a backwards version or a reused build number
- Runbooks for release, hotfix, rollback and secret compromise
- App Store and Google Play review checklists, filled in for this app

### Verification

44 tests on the derivation tools, executed, passing. **Nothing else in this repository has
run**: no workflow, no Fastlane lane, no build, no signing step, no upload. Recorded output
in `docs/test-results/`.
