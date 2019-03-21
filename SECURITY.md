# Security

For a release-engineering repository the security surface is almost entirely about
credentials: what they are, where they live, and what happens when one leaks.

The detail is in [docs/SECRETS.md](docs/SECRETS.md). This is the summary and the reporting
route.

## Reporting

Open an issue. If you believe a secret has leaked from this repository, say so in the title
and do not include the value.

## The core claim

**No signing asset exists in this repository and none ever will.** No certificate, no
private key, no keystore, no provisioning profile, no service-account JSON, and no example
realistic enough to be mistaken for one.

Verified by: a `.gitignore` covering `*.p12`, `*.p8`, `*.keystore`, `*.jks`,
`*.mobileprovision`, `*.cer`, `*.pem`, `google-services.json`, `GoogleService-Info.plist`
and `service-account*.json`; a gitleaks job over full history in CI; and a scan of the
working tree and history performed during the portfolio audit, which found nothing.

## Why signing keys are handled more strictly than API keys

A leaked API key is revocable. A leaked signing key lets somebody produce a binary that a
user's device accepts as an update to your app.

Android is the sharper case. Before Play App Signing, the upload key was the app identity,
and losing it meant the app could never be updated by anyone again. That asymmetry is why
`docs/SECRETS.md` recommends enrolling in Play App Signing before the first release: it is
a one-way decision, and the alternative is holding a key whose loss ends the app.

## Controls

| Control | State |
|---------|-------|
| Secrets injected from named GitHub secrets, never committed | Implemented in the workflows |
| Binary secrets base64 encoded, decoded to a temporary keychain, deleted in an `always()` step | Documented and written into the lanes |
| No `echo` or `set -x` in any step touching a secret | Convention, enforced by review |
| Store credentials only in the production environment, behind a required reviewer | Configured in the workflow |
| Least privilege on the Play service account | Documented |
| Rotation schedule with a create-verify-revoke order | Documented |
| Compromise response with an hour, day and week timeline | Documented |
| Nothing signed before the quality gates pass | Enforced by job ordering |

## Verification status

The tooling in `tools/` is tested and executed. **Nothing else in this repository has ever
run**: no workflow, no Fastlane lane, no build, no signing step, no upload. The controls
above are configured and reviewable, not demonstrated.

Saying that plainly matters more here than anywhere else in the portfolio, because a
release pipeline that has never run is exactly the kind of thing that looks finished.
