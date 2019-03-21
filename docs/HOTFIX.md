# Hotfix runbook

For a critical bug in production, read at an hour when nobody is at their best. Numbered
steps, no prose.

## First: is this actually a hotfix?

| Situation | Path |
|-----------|------|
| Crash on launch, data loss, privacy problem, core journey broken | Hotfix |
| Broken for a subset, workaround exists | Judgement. Usually the next scheduled release |
| Cosmetic, or annoying | Next release. Always |

A hotfix skips the accumulated confidence of a normal cycle. Spending that on something
cosmetic means you have less of it available when it matters.

## 1. Stop the spread first

Before writing any code:

- **Google Play**: Console, Production, select the release, **Halt rollout**. Effective in
  minutes.
- **App Store**: App Store Connect, the version, **Pause phased release**.

If the rollout is already at 100 percent this is not available and you go straight to
step 2. Two minutes spent here stops the problem getting bigger while you work.

## 2. Branch from the released tag

```bash
git checkout -b hotfix/1.4.3 v1.4.2
```

**From the tag, not from `main`.** Branching from `main` ships everything merged since the
release, which is how a fix for one bug introduces three others at the worst possible time.

## 3. Make the smallest change that fixes it

No refactoring. No dependency updates. No improvements you notice on the way past. If you
find a second bug, write it down and leave it.

## 4. Add the test that would have caught it

Not optional, and not deferred to "after the release". The test is the only thing stopping
this recurring, and after the release nobody writes it.

## 5. Version and validate

The patch number bumps. `validateRelease` will refuse the build if the version or the build
number does not move ahead of what has already been submitted, which is the check that
catches a hotfix branched from the wrong place:

```
previous released: 1.3.0, build 200
this hotfix:       1.2.4, build 201   ->  refused
```

Both stores would also refuse it, twenty minutes into a build, at the point where somebody
is already stressed.

## 6. Run every gate

The temptation to skip the UI tests is strongest exactly when the risk of a second mistake
is highest. Run them.

## 7. Submit

- **Apple**: request expedited review. One sentence on user impact. It is discretionary and
  it is not a queue you can join repeatedly, so save it for things that deserve it.
- **Google**: normal review, usually hours. There is no expedited path.

## 8. While waiting

Not every mitigation needs a binary:

- **Server-side.** If the server can reject or reshape the request that triggers the bug,
  do it there. A server fix ships in minutes and reaches every version, including the ones
  from six releases ago that people are still running.
- **Feature flag.** If the broken path is behind one, turn it off. This is the strongest
  practical argument for putting new features behind flags.
- **Say something.** Users who know a fix is coming leave fewer one-star reviews than users
  who think the app is broken and abandoned.

## 9. Roll out faster than normal, but still staged

10 percent, watch for an hour, then 100. Not straight to 100: a hotfix is written quickly,
under pressure, by someone who is worried, and that is not the moment to remove the last
safety net.

## 10. Merge back the same day

```bash
git checkout main
git merge hotfix/1.4.3
```

A fix that lives only on a release branch gets lost, and the bug returns in the next
release. This has happened to every team that has ever skipped this step.

## 11. Write it up within a few days

- What broke, one paragraph
- **Why the gates did not catch it.** This is the useful part
- The gate that would have caught it, and whether it is worth adding
- How long each step actually took, so the next estimate is based on something

No blame section. The question is what the pipeline let through.

## Verification status

**No hotfix has ever been performed.** Nothing in this repository has been built, signed,
submitted, rolled out or halted. This is a written procedure, not a record of one being
followed.
