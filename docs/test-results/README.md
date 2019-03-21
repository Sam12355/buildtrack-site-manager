# Recorded output

Host: Windows 11, Node v24.11.1
Run at: 2026-07-31T08:15:22Z

## Derivation tool tests

```console
 RUN  v2.1.9 C:/Users/slaks/Documents/mygit/native-release-lab/tools
 ✓ src/versioning.spec.ts > parsing a tag > parses v1.2.3
 ✓ src/versioning.spec.ts > parsing a tag > parses 1.2.3
 ✓ src/versioning.spec.ts > parsing a tag > parses v0.0.1
 ✓ src/versioning.spec.ts > parsing a tag > parses v10.20.30
 ✓ src/versioning.spec.ts > parsing a tag > keeps a prerelease
 ✓ src/versioning.spec.ts > parsing a tag > ignores build metadata, which is not part of precedence
 ✓ src/versioning.spec.ts > parsing a tag > rejects not-a-tag
 ✓ src/versioning.spec.ts > parsing a tag > rejects v1.2
 ✓ src/versioning.spec.ts > parsing a tag > rejects v1.2.3.4
 ✓ src/versioning.spec.ts > parsing a tag > rejects 
 ✓ src/versioning.spec.ts > parsing a tag > rejects release-1.2.3
 ✓ src/versioning.spec.ts > parsing a tag > tolerates surrounding whitespace, which git output has
 ✓ src/versioning.spec.ts > comparing versions > orders by major, then minor, then patch
 ✓ src/versioning.spec.ts > comparing versions > sorts a prerelease below its release
 ✓ src/versioning.spec.ts > comparing versions > orders prereleases against each other
 ✓ src/versioning.spec.ts > bumping > resets everything below a major bump
 ✓ src/versioning.spec.ts > bumping > resets patch on a minor bump
 ✓ src/versioning.spec.ts > bumping > increments only patch
 ✓ src/versioning.spec.ts > bumping > leaves the version alone for none
 ✓ src/versioning.spec.ts > parsing commits > parses type, scope and subject
 ✓ src/versioning.spec.ts > parsing commits > parses a commit with no scope
 ✓ src/versioning.spec.ts > parsing commits > recognises the breaking marker
 ✓ src/versioning.spec.ts > parsing commits > keeps a non-conforming commit rather than dropping it
 ✓ src/versioning.spec.ts > parsing commits > lowercases the type so FEAT and feat group together
 ✓ src/versioning.spec.ts > deciding the bump > is none for no commits
 ✓ src/versioning.spec.ts > deciding the bump > is major when anything is breaking
 ✓ src/versioning.spec.ts > deciding the bump > is minor for a feature
 ✓ src/versioning.spec.ts > deciding the bump > is patch for fixes only
 ✓ src/versioning.spec.ts > deciding the bump > is patch, not none, for commits that fit no category
 ✓ src/versioning.spec.ts > release notes > groups by category under readable headings
 ✓ src/versioning.spec.ts > release notes > leaves out changes a user cannot perceive
 ✓ src/versioning.spec.ts > release notes > puts breaking changes first, under their own heading
 ✓ src/versioning.spec.ts > release notes > falls back to something publishable when nothing user-visible changed
 ✓ src/versioning.spec.ts > release notes > produces nothing that looks like a commit dump
 ✓ src/versioning.spec.ts > build numbers > is the commit count
 ✓ src/versioning.spec.ts > build numbers > applies an offset for a project migrating into this scheme
 ✓ src/versioning.spec.ts > build numbers > rejects a nonsensical count rather than producing a nonsensical build
 ✓ src/versioning.spec.ts > build numbers > is monotonic as commits accumulate
 ✓ src/versioning.spec.ts > release validation > accepts a release that moves forward on both counts
 ✓ src/versioning.spec.ts > release validation > refuses a version that goes backwards
 ✓ src/versioning.spec.ts > release validation > refuses an unchanged version
 ✓ src/versioning.spec.ts > release validation > refuses a reused build number, which both stores reject
 ✓ src/versioning.spec.ts > release validation > catches a hotfix branched from the wrong place
 ✓ src/versioning.spec.ts > a whole release, end to end > derives the next version, build number and notes from a tag and some commits
 Test Files  1 passed (1)
      Tests  44 passed (44)
   Start at  10:15:26
   Duration  1.23s (transform 275ms, setup 0ms, collect 308ms, tests 27ms, environment 0ms, prepare 291ms)
```

## The CLI, run against this repository's real git history

Not a fixture. These are the actual commits in this repository.

```console
$ node tools/dist/cli.js derive
0.1.0,4

$ node tools/dist/cli.js notes
New
- derive version, build number and release notes from git

$ PREVIOUS_BUILD_NUMBER=999 node tools/dist/cli.js validate
No tags found. Treating this as the first release.
No tags found. Treating this as the first release.
Release refused: Build number 4 is not ahead of the submitted 999. Both stores reject this.
exit code: 1
```

The last command is the guard doing its job: a build number that does not move ahead
of what was submitted is refused before the build rather than by the store afterwards.

## Not executed

| Item | Why |
|------|-----|
| Fastlane lanes | Need macOS and store credentials |
| GitHub workflows | Never pushed, so never triggered |
| iOS app build | No macOS, no Xcode on this machine |
| Android app build | No Gradle distribution on this machine |
| Signing | No assets exist, by design |
| Store upload | No credentials, and it would need approval |
