# Threat model

Scoped to the release process. What can go wrong between a commit and a user's device.

## What is worth protecting

The signing keys, and the property that a binary reaching a user is one that passed the
gates.

## T1. Signing key compromise

**Vector:** a key committed, screenshotted, pasted into a chat, or read from a verbose
build log.

**Impact:** the worst outcome in this repository. Somebody else can ship an update that
devices accept. On Android without Play App Signing, it can also mean the app can never be
updated again.

**Mitigation:** no asset in the repository; gitignore plus gitleaks over full history;
secrets injected at build time only; no echo in any step that touches one; decoded material
deleted in an `always()` step so a cancelled job leaves nothing on a runner.

**Residual:** a runner is a machine somebody else operates. A compromised action in the
build could exfiltrate a decoded secret. Mitigated by minimal `permissions:`, and pinning
actions by digest rather than tag would harden it further and is not done.

## T2. An unreviewed binary reaching production

**Vector:** somebody promoting a build that skipped the gates, or approving without
checking.

**Mitigation:** signing happens only after lint, static analysis, unit tests and UI tests
pass, so an unsigned build cannot be submitted by accident. Production requires a GitHub
environment with a required reviewer, which is the one gate a person can skip and therefore
the one enforced by the platform.

**Residual:** a reviewer can approve without testing. No technical control fixes that; the
staged rollout is what limits the damage.

## T3. A version or build number that goes backwards

**Vector:** a hotfix branched from the wrong tag.

**Impact:** rejected by the store, twenty minutes into a build, when somebody is already
stressed.

**Mitigation:** `validateRelease` refuses it, with tests including the exact
hotfix-from-the-wrong-tag case.

## T4. Release notes leaking internal information

**Vector:** generated notes containing branch names, ticket identifiers, internal service
names, or a commit dump.

**Mitigation:** notes are built from `feat`, `fix`, `security` and `perf` subjects only,
and a test asserts the output does not look like a commit dump.

**Residual:** a `feat` subject describing something internal still gets through. The fix is
the commit message, and review is the control.

## T5. Supply chain in the build

**Vector:** a compromised action or a malicious dependency introduced during the build.

**Mitigation:** `permissions: contents: read` by default; `--frozen-lockfile`; Dependabot;
dependency audit as a gate.

**Residual:** actions pinned by tag, not digest.

## T6. Losing the ability to ship

**Vector:** a signing certificate expiring unnoticed.

**Impact:** not a compromise, but it costs a day at the worst moment.

**Mitigation:** a certificate-expiry check is the first item on the release checklist,
before the build rather than after. A calendar reminder 60 days out is in the rotation
table.

## Out of scope

Runtime security of the apps themselves, which belongs to the product repository, and the
security of the stores.
