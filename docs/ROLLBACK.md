# Rollback and failed-release recovery

## Read this first

**You cannot roll back a binary that a user has already installed.**

A server rollback is a task-definition change and it is done in three minutes. A mobile
rollback is two separate things: stopping any further users from getting the bad version,
and shipping a fix forward to the ones who already have it. Only the first is fast.

Every procedure below is shaped by that fact.

## Decide first: halt or forward-fix

| Situation | Do this |
|-----------|---------|
| Rollout under 100 percent, serious bug | **Halt the rollout.** Stops the spread in minutes |
| Rollout at 100 percent, serious bug | Halt is not available. **Forward-fix**, expedited |
| Data corruption or a privacy problem | Halt, then forward-fix, then work out who is affected |
| Cosmetic issue | Neither. Fold the fix into the next scheduled release |

The mistake to avoid is starting a forward-fix while the rollout is still spreading. Halt
first. It takes two minutes and it stops the problem getting bigger while you work.

## Halting a rollout

### Google Play

1. Play Console, Release, Production
2. Select the in-progress release
3. **Halt rollout**
4. Confirm

Effective within minutes. Users who already have the version keep it; nobody new receives
it. The halted release can later be resumed or replaced.

### App Store

1. App Store Connect, the app, the version
2. If phased release is on: **Pause phased release**
3. If already at 100 percent: **Remove from sale** is the only lever, and it is a large one

Pausing stops the automatic daily expansion. It does not remove the version from anyone who
has it, and it does not stop a user searching for the app and installing the current
version. Removing from sale does, at the cost of the app being unavailable to everyone.

**Use phased release.** It is the only thing between a bad build and every user, and it is
off by default.

## Forward-fix, expedited

1. **Branch from the released tag**, not from `main`.
   ```bash
   git checkout -b hotfix/1.4.3 v1.4.2
   ```
   Branching from `main` ships everything merged since the release, which is how a fix for
   one bug introduces three more.

2. **Make the smallest change that fixes it.** No refactoring, no dependency updates, no
   improvements noticed along the way.

3. **Bump the patch version.** `validateRelease` in `tools/` will refuse the build if the
   version or the build number does not move forward, which is the check that catches a
   hotfix branched from the wrong place.

4. **Run every gate.** The temptation to skip UI tests on a hotfix is strongest exactly
   when the risk of a second mistake is highest.

5. **Request expedited review.**
   - Apple: request expedited review in App Store Connect. Explain the user impact in one
     sentence. It is discretionary and it is not a queue you can join repeatedly.
   - Google: normal review, usually hours. There is no expedited path.

6. **Merge the hotfix branch back into `main`** the same day. A fix that lives only on a
   release branch gets lost, and the bug returns in the next release.

## While waiting for review

Not all mitigations need a binary:

- **Server-side.** If the bug is in a request the server can reject or reshape, do it
  there. A server fix ships in minutes and reaches every version.
- **Feature flag.** If the broken path is behind a flag, turn it off. This is the single
  strongest argument for putting new features behind flags.
- **Communicate.** A status note is better than silence. Users who know a fix is coming
  leave fewer one-star reviews than users who think the app is broken and abandoned.

## Migration constraints

The property that makes any of this possible: **migrations must be additive and
backward-compatible for at least one release**.

Add a column, backfill it, switch the reads, and drop the old column two releases later. If
version 1.4.2 wrote data that 1.4.1 cannot read, rolling back is not an option and neither
is a user who declined the update.

Mobile makes this stricter than server work, because old versions stay in use for months.
Somebody is always still on the version from six releases ago.

## After it is over

Within a few days, write down:

- What broke, in one paragraph
- Why the gates did not catch it. This is the useful part
- The gate that would have caught it, and whether it is worth adding
- How long each step took, so the next estimate is based on something

No blame section. The question is what the pipeline let through, not who wrote it.

## What this repository can demonstrate

The workflows, the version guards and the runbooks are here and reviewable. **No release
has been performed, no rollout has been halted, and no store submission has been made**, so
nothing below the level of "the code that decides the version is tested" has been
exercised. The version-derivation tests are the part that actually runs; everything else is
structure.
