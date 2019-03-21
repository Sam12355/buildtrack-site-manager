# 0001 - Refusing a release that cannot be submitted

**Status:** implemented
**Date:** 2026-03

## Product request

> We lost a day last month. Somebody cut a hotfix from the wrong tag, the build ran, and
> App Store Connect rejected the upload because the version was lower than what was already
> live. Nobody noticed until the upload failed.

## Clarified requirement

The pipeline refuses to build a release whose version or build number does not move ahead of
what has already been submitted, and it refuses before spending twenty minutes on a build.

## Scope

**In scope:** parsing tags, comparing versions including prereleases, deriving the bump from
commits, deriving build numbers, and the validation that refuses a bad release.

**Out of scope:** talking to the stores to discover what was actually submitted. The caller
supplies the previous version and build number.

## Assumptions

- **The caller knows what was last submitted.** In the pipeline that comes from the last
  release tag and the stored build number. Querying the store APIs would be more reliable
  and needs credentials this repository must not have.
- **Build numbers come from commit count.** Monotonic on a branch that only moves forward,
  and reproducible, which a timestamp is not.
- **An offset exists for migration.** A project adopting this scheme with builds already
  submitted needs to start above them, or the first build goes backwards.

## Acceptance criteria

- [x] AC1: a tag parses with or without a `v` prefix, with a prerelease, ignoring build metadata
- [x] AC2: a malformed tag returns null rather than a partial version
- [x] AC3: comparison follows semver precedence, including a prerelease sorting below its release
- [x] AC4: the bump is major on a breaking change, minor on a feature, patch otherwise
- [x] AC5: an unrecognised set of commits produces patch, never none
- [x] AC6: a non-conforming commit is kept as type `other`, not dropped
- [x] AC7: release notes contain only user-visible categories and do not look like a commit dump
- [x] AC8: notes for a release with nothing user-visible still produce publishable text
- [x] AC9: a build number is monotonic and rejects a nonsensical commit count
- [x] AC10: validation refuses a backwards version, an unchanged version, and a reused build number
- [x] AC11: validation refuses the specific hotfix-branched-from-the-wrong-tag case

## Security and privacy analysis

- **New data collected:** none.
- **New attack surface:** release notes are generated from commit subjects and published to
  a store listing. A commit subject containing an internal service name or a ticket
  reference would be published. AC7 limits the categories included; review is the control
  for the content.
- **Secrets:** none touched. This tooling never sees a signing asset.

## Test plan

One test per criterion, plus an end-to-end case deriving a whole release from a tag and a
commit list.

AC11 gets its own test with concrete numbers, because it is the case from the product
request and the one a person will not catch by eye.

## Definition of Done

- [x] Criteria met, 44 tests
- [x] Tests written from this document before the implementation
- [x] Lint and type-check clean
- [x] `validateRelease` wired into the release workflow before the build step
