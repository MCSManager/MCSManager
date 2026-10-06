# Rootless Docker and non-root MCSManager services

This support is opt-in deployment compatibility, not an automatic migration of
existing instances. Keep the Web service under its own unprivileged host account.
Use a separate account for the Rootless Docker engine and Daemon. Membership in
the host `docker` group grants root-equivalent access and is not a substitute for
Rootless Docker.

## Supported deployments

| Daemon runtime                                                            | Instance user                                                   | File ownership                               |
| ------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Linux host, same non-root account as the local Rootless engine            | `0:0`                                                           | Engine account's host UID/GID                |
| Container managed by the same local Rootless engine, namespace user `0:0` | Numeric `UID:GID` within its kernel maps, including `1000:1000` | IDs as seen inside the shared user namespace |
| Rootful Docker, ordinary processes, Windows                               | Existing behavior                                               | Unchanged                                    |

Namespace root in a Rootless container is **not host root**. A host Daemon cannot
just translate container UID 1000 to a subordinate host UID and use `chown`: that
requires privileges it does not have and does not allow reading private files
owned by that UID. For nonzero game users, run the Daemon in the Rootless engine's
user namespace as shown below. Do not change games which reject UID 0 to run as
container root.

The Daemon checks Docker's `SecurityOptions`, the local Unix socket's owner, and
its actual `/proc/self/{uid,gid}_map`. A namespaced deployment must also set
`MCSM_ROOTLESS_DOCKER_CONTAINER` to its own container name. The Daemon executes a
fixed, bounded Node command in that container through the engine API and compares
both kernel maps. A different engine account, namespace or subordinate mapping
is rejected. The endpoint and this environment variable are administrator-owned
deployment settings, not instance settings.

A native host Daemon supporting only `0:0` also needs
`MCSM_ROOTLESS_DOCKER_CONTAINER`, pointing to a trusted, already-running container
in the local engine. It reads that container's actual kernel maps via the local
PID returned by Docker, and verifies the mapped root UID/GID against its own
account before using them. Missing/invisible mappings are rejected. The socket's
group is **not** assumed to be the engine account's primary group.

Remote Rootless engines and ambiguous users (`1000`, `user`, `user:group`) are not
supported. Specify numeric `UID:GID` in `runAs`, or use an image whose `USER` has
that format. An image with no `USER` defaults to `0:0`. An inaccessible engine or
unverifiable identity is an error, not permission to fall back to host IDs.
Update containers use the same instance identity, even when a different update
image is configured. With empty `runAs`, the main instance image must be installed
so its `USER` can be resolved. Prefer explicit `runAs` for separate update images.

Engine checks are deduplicated and cached for 30 seconds; image metadata uses a
30-second, 32-entry cache. Archive ownership is resolved once per operation, not
once per entry. Restart the Daemon after changing its engine or namespace setup.
Already-correct ownership is checked with `fstat` and does not call `fchown`.
Permission errors are reported; modes are not widened to work around them.
Docker-backed file writes require a reachable engine for initial verification;
ordinary processes and Windows do not query Docker for file ownership.

## Deployment

1. Install Rootless Docker for a dedicated non-root account following the
   [Docker instructions](https://docs.docker.com/engine/security/rootless/).
   Use its **user** systemd service. Do not give it `sudo` or host Docker access.
2. Build this version of MCSManager following [the build guide](build-production.md).
   Copy the bundled Daemon and native `lib` binaries to a release directory. An
   old installed Daemon does not include this support.
3. Prepare an empty, private data directory owned by the Rootless account. Keep
   instance workspaces below it and mount it at the **same absolute path** inside
   the Daemon; sibling game bind mounts are resolved by the engine, not by the
   Daemon container. Paths outside this mount are not available to the Daemon.
4. Set the three variables required by `example.rootless-docker-compose.yml`,
   then start it with that account's Docker context. Never mount the rootful
   `/var/run/docker.sock` by accident.
5. Pair the non-root Web service with the new test node. The example publishes
   only a localhost Daemon port; use an authenticated TLS reverse proxy if remote
   panel/browser access is required. Game ports belong to individual instances.

Before migrating real instances, test an isolated instance with `runAs=1000:1000`:
both upload APIs, archive extraction, a game-created `0600` file (read/edit/copy/
download/delete), update, restart, console input/output, and local TCP/UDP.
Verify the Daemon and game PIDs have nonzero **host** UIDs. Test CPU and memory
limits via actual cgroup files, not only Docker's requested configuration.

## Limits and security

- CPU/memory limits require Rootless Docker's cgroup v2/systemd delegation.
  Follow [Docker's resource-limit guidance](https://docs.docker.com/engine/security/rootless/tips/).
- Host `tc` upload/download limits are rejected for Rootless instances. No sudo
  fallback or extra host capability is added.
- Rootless Docker instances reject `HOST` as the update environment. Set
  `docker.updateCommandImage` to the main image, another trusted update image,
  or an empty string to select the main image. Update scripts must run with only
  the instance workspace mounted, not with the Daemon's filesystem or socket.
- Host networking, port source-IP propagation and low-numbered ports depend on
  Docker/RootlessKit versions. Use bridge networking and explicitly published
  high ports first; public game-client behavior still needs separate testing.
- Only the trusted Daemon receives the Rootless socket. Never mount it, the
  Daemon data, or another tenant's workspace in game containers. Restrict Docker
  mount/privilege configuration and node configuration to administrators.
- Native processes in the Daemon container are **not tenant isolation**. Use
  Docker instances for untrusted tenants, without extra binds or privileges.
- Existing workspace, symlink and descriptor/inode checks remain in place.
  These pathname-based operations do not claim to be fully race-free against a
  malicious process concurrently replacing ancestor directories.
- Existing root-owned or subordinate-owned host data requires an explicit,
  separately reviewed migration. This feature never recursively changes all
  instance data or touches other workspaces automatically.

For the UID model, see [Docker UID/GID mapping](https://docs.docker.com/engine/security/rootless/uid-gid-mapping/).

## Reproducible compatibility checks

Run module and backend integration tests using the repository's
[test skill](../.agents/skills/mcsmanager-test/SKILL.md). Docker service changes
also require the [Docker instance gate](../.agents/skills/mcsmanager-docker-instance-test/SKILL.md).
Confirm the Docker cases actually ran instead of being skipped.

The opt-in harness below requires Node 20+, a Linux Rootless account, cgroup v2
CPU/memory delegation, a newly bundled Daemon and matching native `daemon/lib`
binaries. Run it only in a test checkout accessible to that account:

```bash
cd daemon
BUNDLE=1 npm run build
DOCKER_HOST="unix://${XDG_RUNTIME_DIR}/docker.sock" node test/rootless/run.mjs
```

It refuses host UID 0 and non-Rootless engines. It creates only temporary test
workspaces, random instance/container names, random localhost ports and an
ephemeral test key, then removes its own resources. It tests namespace users
`0:0`, `1000:1000`, image `USER` inheritance with a different update image, and a
native non-root Daemon limited to `0:0`. Both upload APIs, manual/automatic
extraction, private-file access, updates, console I/O, restart, local UDP and
actual cgroup limits are checked. Unsupported native-host UID 1000 uploads must
fail before overwriting existing files, and `HOST` updates must not run.

This is not a public game-client or production migration test. The harness does
not restart the host Docker engine or read customer instances.
