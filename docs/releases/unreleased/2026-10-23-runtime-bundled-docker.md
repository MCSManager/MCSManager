---
type: fix
scope: runtime
audience: developer
summary: Run the self-contained Docker bundles without reinstalling production dependencies
breaking: false
demo_ready: false
tests:
  - "docker buildx build --check -f dockerfile/web.dockerfile .: passed"
  - "docker buildx build --check -f dockerfile/daemon.dockerfile .: passed"
  - "node --check scripts/check-docker-bundle.cjs: passed"
  - "Full image build and unit/integration/startup checks: blocked by npm registry TLS resets and idle timeouts"
artifacts:
  - dockerfile/daemon.dockerfile
  - dockerfile/web.dockerfile
  - scripts/check-docker-bundle.cjs
  - docs/build-production.md
---

## What changed

Both final Docker stages now assert that `app.js` exists and `node_modules` is absent, instead of running `npm install --production`. The existing `build.sh` already enables `BUNDLE=1`, and its bundled dependency and optional native-acceleration behavior remains the source of truth. A disposable-image smoke command checks the actual application startup without a runtime dependency tree.

## Why it matters

Reinstalling dependencies after the bundle is built adds a second dependency tree and executes registry installation scripts in the final image, even though the documented release artifact only needs Node and the platform helper binaries. The change aligns the Docker path with the existing release packaging contract. It does not change the Node major version, dependency lockfiles, application code, platform helper list, data paths, or authentication behavior.

## Demo posture / limitations

This is a draft candidate. Dockerfile checks and the smoke harness syntax check passed, but the full build could not finish: downloads from `registry.npmjs.org` repeatedly failed with `ECONNRESET` and `EIDLETIMEOUT`, including after bounding npm connection concurrency and fetch timeouts. The build was stopped after repeated network failures. Unit, integration, final-image startup and multi-architecture acceptance remain required before merge; no production service was changed. Removing the duplicate dependency tree does not remediate vulnerabilities still bundled into `app.js`, in Node, or in native helpers.
