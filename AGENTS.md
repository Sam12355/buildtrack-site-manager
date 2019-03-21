# Agent instructions

Agent-agnostic version of [CLAUDE.md](CLAUDE.md). Applies to any coding agent pointed at
this repository. The portfolio-wide process is in [docs/ai/WORKFLOW.md](docs/ai/WORKFLOW.md).

## Setup

```bash
pnpm install
pnpm verify
```

If that is not green on a clean checkout, stop and report it. Do not build on a broken
baseline.

## What this repository is

Release tooling and runbooks for native apps. The tools derive versions, build numbers and
release notes from git. The apps exist to give the pipeline something real to build.

## Order of operations

1. Read the spec in `docs/specs/`. If there is none, write it and stop for review
2. Say which files you intend to change
3. Write the tests from the acceptance criteria, before the implementation
4. Implement
5. Run lint, type-check and tests, and paste the real output
6. Self-review against [docs/ai/REVIEW_CHECKLIST.md](docs/ai/REVIEW_CHECKLIST.md)

## Boundaries

| Action | Allowed |
|--------|---------|
| Add or fix tests | Yes |
| Refactor within a module | Yes |
| Add behaviour with a spec | Yes |
| Add a runtime dependency | Only with explicit approval |
| Change a public function signature | Only with explicit approval |
| Commit a secret | Never |
| `git push` | Never without being asked |
| Weaken a check to make a test pass | Never |
| Delete a failing test | Never |

## Repository-specific rules

**Version and build numbers are derived, never typed.** Any change to
`tools/src/versioning.ts` needs a test, because the mistakes it prevents are only ever
caught by a machine.

**No signing asset ever enters this repository.** Not a certificate, not a key, not a
keystore, and not an example realistic enough to be mistaken for one.

**Never echo a secret, and never `set -x` in a step that touches one.** GitHub masks
known values, not transformations of them.

**Runbooks are numbered steps.** They are read at 2am by somebody who is worried, and prose
is the wrong format for that.

## Definition of done

- The spec exists and predates the implementation in the history
- Lint, type-check and tests pass, with real output pasted
- The failure path is tested, not only the happy path
- The diff is small enough that a human can actually review it
