# Rootless Docker and non-root MCSManager services

This support is opt-in deployment compatibility, not an automatic migration of
existing instances. Keep the Web service under its own unprivileged host account.
Use a separate account for the Rootless Docker engine and Daemon. Membership in
the host `docker` group grants root-equivalent access and is not a substitute for
Rootless Docker.

This does not establish a race-free filesystem sandbox for malicious instance
processes. Pathname-based file APIs still need separate security hardening before
claiming protection against concurrent cross-instance path-replacement attacks.

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
Docker instance update containers use the main instance identity, even when a
different update image is configured. With empty `runAs`, the main instance image
must be installed so its `USER` can be resolved. General process instances using
an update container instead resolve the actual update image. Prefer explicit
`runAs` for separate update images.

Engine checks are deduplicated and cached for 30 seconds. Image reads coalesce
concurrent requests (at most 32 distinct images in flight), but do not retain USER
metadata by mutable tag. Rootless container creation pins the inspected image ID.
File operations on an active instance use its labeled container's actual user,
not a changed tag or next-start configuration. Archive ownership is resolved once
per operation, not once per entry. Restart the Daemon after changing its engine
or namespace setup.
After containment validation, already-correct ownership is checked with `lstat`
without opening the file, including mode `000` or write-only files. Ownership
changes still require an inode-verified descriptor and `fstat` before `fchown`.
Permission errors are reported; modes are not widened to work around them.
`MCSM_ROOTLESS_DOCKER_CONTAINER` also explicitly enables Rootless file ownership.
Without this administrator-owned setting, Rootful file management keeps its
existing behavior, including while the engine is offline. Container startup still
verifies the actual engine and rejects an unconfigured Rootless engine. With the
setting enabled, file writes require successful Rootless verification and never
fall back to host IDs. Ordinary processes and Windows do not query Docker for
file ownership.

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
- The compatibility preflight requires cgroup v2, the systemd driver and the
  corresponding Engine memory/CPU capability. Explicit cpuset, device read/write
  BPS, swap and swappiness settings are rejected: their enforcement has not been
  verified by this layer. Undefined settings retain Engine defaults; this is not
  a claim that defaults provide a swap policy. Rootful limits are unchanged.
- Extra bind sources inside the instance workspace are physically validated before
  creating directories and synchronizing the source and its parents to the instance
  owner. Existing file binds are supported; their contents and modes are unchanged.
  This does not recursively change the contents of existing mounted directories.
  Symlinks escaping the workspace and ambiguous `..` source syntax are rejected.
  Outside-workspace sources are administrator-managed: they must already exist,
  be visible to the Daemon, and have suitable ownership and permissions. They are
  never created or chowned, even if an external alias points back into the workspace.
  Rootful Docker's existing bind-directory behavior is unchanged. As with other
  pathname-based operations, validation cannot atomically prevent concurrent parent
  replacement by an instance process.
- File copies and moves run one bounded batch at a time per reservation (up to 100 pairs).
  Copy, move and extraction share `maxFileTask` per instance and `maxGlobalFileTask`
  per Daemon (default 8, configure in `data/Config/global.json`). Busy requests
  fail rather than building an unbounded queue. Rootless recursive copying uses
  directory iterators, synchronizes each copied entry immediately and leaves
  destination-only entries alone. Directory depth is limited to 128.
- Rootless moves prepare owned destination parents and reject existing destinations.
  Cross-filesystem moves use the bounded ownership-aware copy before removing the
  source; failed copies leave the source intact and may leave partial destination files.
  Same-filesystem moves validate the tree before rename and reconcile ownership after
  rename. If that reconciliation fails, the moved tree remains at the destination and
  the operation reports an error; no automatic rollback is attempted.
  Relative symlinks must remain inside the workspace at their new location, including
  directory renames. Traversal and ownership passes retain bounded iterators and
  descriptors, not all entry paths. These pathname-based operations are not atomic against a tenant
  process concurrently replacing parent directories or destination entries.
  New copy directories use private writable permissions during creation and restore
  the source mode through an inode-verified descriptor, including read-only, sticky
  and setgid bits. If the filesystem cannot preserve these bits, copying reports
  an error rather than silently weakening the directory's permissions.
  Source removal failures are reported; source permissions are not automatically relaxed.
- Archives with backslash entry names are rejected when synchronizing Rootless ownership;
  the Go and 7-Zip extractors can interpret them differently. Repack with `/`
  separators. Failed extraction reconciles only known entry paths and parents,
  not the entire destination tree. Partial files may remain, but permission
  reconciliation failures are reported, not treated as successful extraction.
- Rootless edits, new files, chunked uploads and URL download destinations resolve
  internal symlinks and synchronize the actual target inode before truncating it.
  Linux directory descriptors and `O_NOFOLLOW` anchor creation and writing; a
  replaced symlink cannot redirect an already-open write outside the workspace.
  Ownership failures are reported before existing contents are truncated.
  Active owned writes reserve their workspace, resolved path and inode before
  opening or creating any entries. Different files may be written concurrently;
  aliases and hard links to the same file cannot start a second write. Rootless
  copy/move/delete/extract/compress/mkdir/chmod operations take exclusive workspace
  access for their entire lifetime, including traversal, mutation and ownership repair.
  This blocks conflicts in either start order, including writes through hard-link
  aliases elsewhere in the same workspace. Nested or symlink-aliased workspaces
  also conflict; unrelated workspaces can continue in parallel.
  Across separate workspaces, only explicitly reserved target inodes are compared;
  hard links to descendants of a reserved directory are not indexed or protected.
  Do not share writable files between tenant workspaces using hard links.
  This deliberately serializes mutations within one workspace during a long file
  operation instead of indexing every descendant inode. Reservations are acquired
  synchronously, conflicts are rejected without queueing or automatic retries,
  and `finally` releases them on success or failure. Descriptor-close cleanup
  releases write access, including failed initialization and cancellation.
  These are in-process API reservations, not OS locks on running game processes.
  Background copy replies mean the validated batch was accepted, not completed.
  Reservation conflicts are returned before acceptance. Later I/O failures are
  reported to the instance console and Daemon log; the API has no completion ID.
  Chunked uploads additionally retain their private Daemon inode lock.
  Legacy uploads stream the parser's temporary file in bounded chunks into an
  exclusive sibling staging file, validate its size and ownership, then replace
  the resolved target using the pinned parent directory. Failures leave the old
  inode and contents intact. Existing hard links retain the old inode, as with
  normal file replacement. This adds a data copy and temporary disk space rather
  than a same-filesystem move of the parser's file.
  Rootful uploads keep their existing replacement behavior.
  New Rootless uploads use owner-only mode `0600`; existing ordinary permission
  bits are preserved. Staged replacement does not carry setuid/setgid/sticky bits.
  Chunked uploads and URL downloads still write in place: interruption after
  truncation can leave their target truncated or removed.
  Failed ownership validation removes a newly created file only if its inode still
  matches, including lock/truncate failures and cancellation before truncation.
  Newly created parents are retained by descriptor (bounded by path depth) for
  reverse-order rollback; only matching, empty directories are removed. Existing,
  replaced or concurrently populated directories are never recursively deleted.
  Cancellation checks the pinned destination's
  inode before removing a partial file, and always releases its descriptors.
  This hardens these content-write paths, not every file API: copy, move,
  extraction, reads and deletion still have the pathname race limitations above.
  Do not treat this PR as a complete hostile-process filesystem sandbox; those
  APIs need a separate descriptor-relative/native implementation and security review.
- Rootless ZIP creation rejects a final symlink output, including dangling links,
  before starting the external compressor. Choose a regular output file path.
  The compressor writes to private Daemon staging, not to a tenant-controlled
  output path. A complete archive is then streamed and committed through the same
  descriptor-relative replacement helper as legacy uploads. Concurrent output
  symlink replacement cannot redirect the compressor's writes outside the workspace.
  This adds an archive-sized copy and temporary disk usage; file-task quotas still
  bound concurrent compression. Rootless ZIP holds its workspace reservation from
  compression through staged publication; publication acquires write access from
  that same operation, not a second independent operation. Compressor input paths
  remain pathname-based and retain the concurrent path replacement limitations
  described above.
- Host `tc` upload/download limits are rejected for Rootless instances. No sudo
  fallback or extra host capability is added.
- Rootless Docker instances reject `HOST` as the update environment. Set
  `docker.updateCommandImage` to the main image, another trusted update image,
  or an empty string to select the main image. Update scripts must run with only
  the instance workspace mounted, not with the Daemon's filesystem or socket.
- Host networking, port source-IP propagation and low-numbered ports depend on
  Docker/RootlessKit versions. Use bridge networking and explicitly published
  high ports first; public game-client behavior still needs separate testing.
- This compatibility layer targets Docker Engine. Rootless Podman has not been
  validated. Local UDP echo checks prove connectivity, not game-network
  performance; throughput, packet loss, latency percentiles and CPU under packet
  load require separate benchmarks before production migration.
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
extraction, copy/move ownership, game writes in moved directories, private-file access,
mode `000`/write-only file moves, sticky/setgid directory copies, nested extra-bind
write/rename/delete and unchanged external bind ownership/modes are checked, along
with updates, console I/O, restart, local UDP and actual cgroup limits. It checks
edits and both upload APIs through internal links to differently owned files,
including the target UID/GID, preservation of the link and subsequent game writes.
Symlink ZIP outputs are rejected without modifying their targets or leaking a task reservation.
Regular ZIP output is checked for ownership and a valid ZIP header. An active
chunked upload through a symlink must reject deletion/movement of its actual
target and still finish with a visible, game-writable file.
It also checks file writes after retagging an active instance's image and a general process
instance's update container without a main image. Unsupported native-host UID 1000 uploads must
fail before overwriting existing files, and `HOST` updates must not run.

This is not a public game-client or production migration test. The harness does
not restart the host Docker engine or read customer instances.

### File operation measurements

A single-pass Linux microbenchmark compared `055037e` with the ownership-check
optimization. The fixture contained 100 one-byte files per directory; both runs
used the current UID/GID, no symlinks and the same filesystem. Setup and cleanup
were excluded from elapsed time.

| Files   | Move before / after | Copy before / after |
| ------- | ------------------- | ------------------- |
| 1,000   | 218 / 156 ms        | 336 / 349 ms        |
| 10,000  | 1,987 / 1,155 ms    | 2,790 / 2,886 ms    |
| 100,000 | 18,571 / 13,131 ms  | 29,518 / 29,842 ms  |

For 100,000 files, move's instrumented `realpath` calls fell from 404,011 to
202,009. These are application-level calls, not OS syscall counts. Peak process
RSS was 115–139 MiB including the isolated TypeScript loader and fixture setup;
this is not an incremental Daemon-memory measurement. Move still visits the tree
before and after rename to validate relocated links and ownership. These timings
are not throughput guarantees or Rootless networking benchmarks.

A separate run exercised actual ownership changes inside the non-root account's
Rootless Engine (host UID 1005, container UID 0, target UID/GID 1000:1000). It used
the same small-file layout on a bind mount, Node 20, a one-CPU limit, 512 MiB memory
and no network. Every file started with a different owner; each operation also
changed its 100-files-per-directory parents and the destination root.

| Files   | Move / Copy elapsed | `fchown` calls per operation | Sampled RSS rise, Move / Copy |
| ------- | ------------------- | ---------------------------- | ----------------------------- |
| 1,000   | 429 / 718 ms        | 1,011                        | 1.7 / 4.5 MiB                 |
| 10,000  | 2,629 / 4,831 ms    | 10,101                       | 1.9 / 3.3 MiB                 |
| 100,000 | 26,835 / 43,094 ms  | 101,001                      | 3.6 / 5.1 MiB                 |

RSS rise was sampled every 10 ms relative to the post-setup process RSS, not the
memory footprint of a running Daemon. API counters wrap the real `fs-extra`
operations; they are not complete kernel syscall counts. For 100,000 files,
move/copy issued 507,018/508,012 `lstat`, 404,011/405,010 `realpath`, and
101,001/102,002 `open` calls. The single-CPU limit and different ownership workload
mean these numbers are not a like-for-like comparison with the earlier table.
This checks bounded memory under actual `fchown` work, not cancellation latency,
cross-filesystem moves, end-to-end HTTP throughput or game-network performance.
