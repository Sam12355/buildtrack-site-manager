# Release runbook

The normal path. Read [HOTFIX.md](HOTFIX.md) if something is on fire and
[ROLLBACK.md](ROLLBACK.md) if something already shipped and should not have.

## Before you start

- [ ] `main` is green
- [ ] Every change intended for this release is merged
- [ ] Nothing is half-merged behind a flag that is about to be turned on
- [ ] The signing certificate has more than 30 days left. Check this **now**, not after
      the build. Certificate expiry discovered on release day costs a day

## 1. Decide the version

Nobody types it. The tools derive it:

```bash
cd tools
pnpm install
node -e "
const { parseVersion, parseCommit, bumpFor, bump, formatVersion, releaseNotes } = require('./dist/versioning');
const { execSync } = require('child_process');
const lastTag = execSync('git describe --tags --abbrev=0').toString().trim();
const log = execSync(\`git log \${lastTag}..HEAD --format=%h%x09%s\`).toString().trim().split('\n');
const commits = log.filter(Boolean).map(line => { const [sha, subject] = line.split('\t'); return parseCommit(sha, subject); });
const next = bump(parseVersion(lastTag), bumpFor(commits));
console.log('version:', formatVersion(next));
console.log('\n' + releaseNotes(commits));
"
```

Read the notes it produces. If a user-visible change is missing, the commit that made it
did not follow the convention, and the fix is the commit message, not the notes.

## 2. Cut the release branch

```bash
git checkout -b release/1.5.0 main
git tag -a v1.5.0 -m "Release 1.5.0"
```

Tag on the release branch, not on `main`. The tag is what the build derives from, and it
has to point at exactly the tree being shipped.

## 3. Let the pipeline run

Pushing the tag starts it. The gates run in this order and each one blocks the next:

1. Lint
2. Static analysis
3. Unit tests
4. UI tests
5. Signed build

Nothing is signed before the gates pass. A signed artifact is something that can be
submitted by accident, and the cheapest way to prevent that is to not produce one until it
has earned it.

`validateRelease` runs here too, and refuses the build if the version or build number does
not move ahead of what is already submitted. That check catches the hotfix-branched-from-
the-wrong-tag mistake, which is otherwise found by the store twenty minutes later.

## 4. Staging

The build goes to TestFlight and the Play internal track automatically.

- [ ] Install on a real device, not only a simulator
- [ ] Walk the primary journey: start a session, trigger the countdown, cancel it, trigger
      it again, let it fire, resolve
- [ ] Check the release notes render properly in both consoles
- [ ] Check the build number is what you expected

## 5. Approve production

The production job waits on a GitHub environment with a required reviewer. This is the one
gate a person can skip, which is why it is enforced by the platform rather than by this
checklist.

Approve only if step 4 was actually done on a device.

## 6. Staged rollout

| Stage | Share | Wait | Halt if |
|-------|-------|------|---------|
| 1 | 1 percent | 24 hours | Crash-free rate below the previous release |
| 2 | 10 percent | 24 hours | Same, or a spike in one-star reviews |
| 3 | 50 percent | 24 hours | Same |
| 4 | 100 percent | — | — |

Apple: enable phased release. It is **off by default**, and it is the only thing standing
between a bad build and every user at once.

Google: set the rollout percentage explicitly. The default is 100.

The percentages are conventional rather than derived. I do not have data that says 1, 10,
50 is better than 5, 25, 100; it is what most teams use and it has the right shape.

## 7. After 100 percent

- [ ] Merge the release branch back into `main`
- [ ] Push the tag
- [ ] Update `CHANGELOG.md`
- [ ] Note anything that was awkward, while it is still fresh

## What is verified about this runbook

**Nothing has been released.** No build has run, no artifact has been signed, no binary has
been uploaded, and no rollout has been staged. The version-derivation tools referenced in
step 1 are tested and executed; everything from step 3 onwards is structure that has never
run. That distinction is in the README table too.
