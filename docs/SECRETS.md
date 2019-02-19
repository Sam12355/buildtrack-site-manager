# Secrets: names, handling, rotation, compromise

**No secret value appears in this repository, and none ever will.** This file lists names
and procedures only.

## Why signing secrets are different

A leaked API key is bad and revocable. A leaked signing key is worse: whoever holds it can
produce a binary that a user's device will accept as an update to your app. Android is the
sharper case, because before Play App Signing the upload key was the app identity, and
losing it meant the app could never be updated again by anyone.

That asymmetry is why the handling below is stricter than it would be for a service
credential.

## Names

Set as repository or environment secrets. Never as workflow inputs, never echoed, never
written to a file that any step could print.

### Apple

| Name | What it is |
|------|-----------|
| `APPLE_APP_STORE_CONNECT_KEY_ID` | API key identifier |
| `APPLE_APP_STORE_CONNECT_ISSUER_ID` | Issuer identifier |
| `APPLE_APP_STORE_CONNECT_PRIVATE_KEY` | The `.p8`, base64 encoded |
| `APPLE_SIGNING_CERTIFICATE_P12` | Distribution certificate, base64 encoded |
| `APPLE_SIGNING_CERTIFICATE_PASSWORD` | Password for the above |
| `APPLE_PROVISIONING_PROFILE` | Profile, base64 encoded |
| `APPLE_TEAM_ID` | Not secret, but kept alongside |

### Google

| Name | What it is |
|------|-----------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Publishing service account |
| `ANDROID_KEYSTORE_BASE64` | Upload keystore, base64 encoded |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |

## Handling rules

1. **Base64 for anything binary.** A `.p8` or a keystore pasted raw into a secret field
   gets mangled and fails in a way that looks like an authentication error.
2. **Decode to a temporary keychain or file, and delete it in an `always()` step.** A
   cancelled job must not leave a decoded key on a runner.
3. **Never `echo` a secret, and never `set -x` in a step that touches one.** GitHub masks
   known values in logs, but not a transformation of one. `base64 -d | head -c 20` is not
   masked.
4. **Store credentials only in the production environment**, behind a required reviewer, so
   a pull request from a fork cannot reach them.
5. **Least privilege on the service account.** The Play service account needs release
   management, not full account access.
6. **Read the workflow permissions.** `permissions: contents: read` by default; grant more
   per job, never globally.

## Local signing

For a local release build, which should be rare:

```bash
# macOS keychain, not the login keychain, so it can be deleted afterwards
security create-keychain -p "$TEMP_PASSWORD" build.keychain
security import Certificates.p12 -k build.keychain -P "$CERT_PASSWORD" -T /usr/bin/codesign
security set-key-partition-list -S apple-tool:,apple: -s -k "$TEMP_PASSWORD" build.keychain

# afterwards, always
security delete-keychain build.keychain
```

Android keystores live outside the repository, referenced by an absolute path in
`~/.gradle/gradle.properties`, which is itself outside any working tree. A keystore in a
project directory ends up committed sooner or later, whatever the `.gitignore` says.

## Rotation

| Secret | Cadence | Notes |
|--------|---------|-------|
| App Store Connect API key | 12 months | Create the new one, update the secret, verify a build, then revoke the old one. In that order |
| Apple distribution certificate | On expiry, roughly 12 months | Calendar reminder 60 days out. Certificate expiry discovered on release day is a lost day |
| Provisioning profiles | With the certificate | Regenerate after any certificate change |
| Play service account | 12 months | Rotate the key, not the account |
| Android upload keystore | Not routinely | Rotating it needs Play App Signing enrolment and Google's involvement. Rotate only after a compromise |

Rotation order is always: create new, update the secret, run a build to prove it works,
then revoke the old one. Revoking first turns a routine task into an outage.

## If a secret is compromised

### Immediately, within the hour

1. Revoke the credential at the source. App Store Connect keys and Play service accounts
   can both be revoked from their consoles.
2. Delete the secret from GitHub.
3. Disable the workflows that use it, so no run picks up a half-rotated state.

### Within the day

4. Read the audit logs. App Store Connect and Play both record API activity. Establish
   whether anything was uploaded or promoted that should not have been.
5. If a binary was uploaded, halt any rollout and check what is live.
6. If it was in git, rewrite history **and** treat it as compromised anyway. It has been
   cloned, cached and possibly indexed. History rewriting removes it from the repository,
   not from the world.

### Within the week

7. Issue a replacement, verify a build with it, and restore the workflows.
8. Work out how it leaked. Almost always one of: a screenshot of a terminal, a secret
   pasted into a chat, a `.env` committed before the `.gitignore` was written, or a
   verbose build log.
9. Add whatever check would have caught it. A gitleaks rule, a pre-commit hook, a masked
   variable.

### Android upload key specifically

If the upload key is compromised and the app is enrolled in Play App Signing, Google can
reset the upload key. That is a support request, and it takes days. If the app is **not**
enrolled, the app signing key is the app identity and there is no recovery: existing users
cannot receive an update from a differently signed binary.

That is the reason to enrol in Play App Signing before the first release. Enrolling is a
one-way decision and it is the right one, because the alternative is holding a key whose
loss ends the app.

## What is in this repository

Nothing. Not a certificate, not a key, not a keystore, not a profile, not a
service-account JSON, and no example that looks real enough to be mistaken for one.

`.gitignore` covers `*.p12`, `*.p8`, `*.keystore`, `*.jks`, `*.mobileprovision`, `*.cer`,
`*.pem`, `google-services.json`, `GoogleService-Info.plist` and `service-account*.json`.
CI runs gitleaks over full history, because a `.gitignore` added after the fact does not
retroactively protect anything.
