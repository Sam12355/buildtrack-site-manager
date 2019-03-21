# Deployment

**This repository is not deployed anywhere, and it is not a service.**

It is release tooling and runbooks. The tools are a local dev dependency; the pipelines
run on GitHub Actions.

## Consuming it

```bash
pnpm install
pnpm build      # emits dist/ with type declarations
```

There is no server to start, no container to run, no infrastructure to provision. That is
deliberate: see ARCHITECTURE.md for why the transport and persistence live in the flagship
rather than here.

## If it were published

It is not published to any registry, and no version has ever been released. Were that to
change, the release would be: tag, CI runs the full verify, `pnpm publish --access public`
behind a manual approval. The versioning tooling in `native-release-lab/tools` derives
the version from git rather than having anyone type it.

## Verification status

| Item | State |
|------|-------|
| Build | Runs, clean |
| Tests | Run, passing. Output in `docs/test-results/` |
| Published to a registry | Never |
| Deployed | Never. There is nothing to deploy |
