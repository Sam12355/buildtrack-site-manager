# Testing

## What is actually tested

```bash
cd tools
pnpm install
pnpm test          # 44 tests
```

**This is the only part of this repository that has ever been executed.** The Fastlane
lanes, the GitHub Actions workflows and both app builds have never run. That distinction is
the most important thing on this page, because a release pipeline that has never run is
exactly the kind of thing that looks finished.

## Coverage of the derivation tools

| Area | Cases |
|------|-------|
| Tag parsing | Prefixed and bare, prerelease, build metadata ignored, five malformed inputs rejected, whitespace tolerated |
| Comparison | Major, minor and patch precedence; a prerelease below its release; prereleases against each other |
| Bumping | Major resets minor and patch, minor resets patch, patch, none |
| Commit parsing | Type, scope, subject, breaking marker, non-conforming kept, case normalised |
| Bump decision | None, major on breaking, minor on feat, patch on fix, patch rather than none for anything unrecognised |
| Release notes | Grouping, internal changes excluded, breaking first, fallback text, output is not a commit dump |
| Build numbers | Commit count, migration offset, invalid input rejected, monotonic |
| Validation | A forward release accepted; backwards version, unchanged version, reused build number and the hotfix-from-the-wrong-tag case all refused |
| End to end | A whole release derived from a tag and a commit list |

## The three that matter most

**"catches a hotfix branched from the wrong place".** Version 1.2.4 branched from 1.2.3
after 1.3.0 shipped. Both stores reject it, twenty minutes into a build, at the point where
somebody is already stressed. A person comparing version strings at the end of a checklist
will let this through. A machine will not, and that is the entire argument for deriving
versions rather than typing them.

**"leaves out changes a user cannot perceive".** Store reviewers reject release notes that
are obviously a commit dump, and a user does not care that a module was extracted.

**"keeps a non-conforming commit rather than dropping it".** Dropping it silently leaves a
genuine change out of the notes, and nobody notices until a user asks where the fix they
were promised went.

## What cannot be tested here, and how to check it

| Item | Why not | Command |
|------|---------|---------|
| Fastlane lanes | Need macOS and store credentials | `fastlane ios beta --dry-run` on a Mac |
| GitHub Actions workflows | Never executed; the repository has not been pushed | They run on first push |
| iOS build | No macOS and no Xcode on the build machine | `xcodegen generate && xcodebuild test` |
| Android build | No Gradle distribution on the build machine | `gradle testDebugUnitTest` |
| Signing | No assets exist, by design | Never, in this repository |
| Store upload | No credentials, and it would need approval | Never attempted |

Recorded output for the part that did run: [docs/test-results/](docs/test-results/).

## Why the tools are tested and the pipeline is not

The tools contain the decisions. Which version comes next, whether a release is valid, what
goes in the notes. Those are pure functions over strings, so they are cheap to test and
expensive to get wrong.

The pipeline contains the orchestration, and the only honest way to test orchestration is
to run it. It has not been run, and no claim is made that it works.
