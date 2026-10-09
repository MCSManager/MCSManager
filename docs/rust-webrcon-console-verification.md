# Rust console verification

This is an opt-in real-server check for the setup described in [Rust WebRCON](rust-webrcon.md). It verifies two independent output paths: Rust process logs attached through Docker, and command responses delivered through WebRCON. It is not a persistent WebRCON log-subscription test.

## Reproduction

Use a separate test panel and daemon built from the feature branch. Bind their HTTP listeners to loopback and use a disposable Rust world, test accounts and a randomly generated RCON password. Do not mount customer saves, configuration, plugin scripts or the Docker socket into the game container.

1. Prepare a separate Linux Rust dedicated-server installation and a small test world. Limit the container to two CPU cores and 6 GiB RAM. Publish no game, query or RCON ports; for a local rootful Docker bridge, the test daemon can reach the container's bridge IP directly.
2. As an administrator, create a Docker instance with `-batchmode -nographics -noconsole -logfile -`, `+rcon.web 1`, a dedicated RCON port and the test password. Enable WebRCON in MCSManager before starting Rust, with a valid target. Assign the instance to a normal test user and attach that user's console before starting the instance.
3. Wait for `Server startup complete` in both the live console stream and the panel output-log API. The file-backed output-log API can lag behind the live stream because log writes are buffered; use a bounded wait rather than requiring immediate persistence.
4. If the container receives a dynamic bridge IP, have the administrator update the already-enabled WebRCON target to that IP. Send `status` through the normal user's console and verify a real Rust response. Send `echo` with a unique marker and verify both its WebRCON response and the independent process-log line in Docker output and the live console stream. Inspect the raw process output for cursor-positioning and erase-line dashboard sequences.
5. Stop the instance through the panel using `quit`, wait for the stopped state, and remove the test instance, container and temporary services. Confirm that pre-existing production containers retain their IDs and start times.

Do not include passwords, startup commands containing passwords, session tokens or raw test-service logs in public verification artifacts. Use a generated test map and test account for any demonstration recording.

## Scope

This check covers startup output, a runtime log marker, WebRCON command responses, authenticated console streaming, file-backed log retrieval and graceful shutdown. It does not establish public game connectivity, plugin-specific event logging, complete historical-log retention, Rootless Docker network compatibility or packet-load performance.

## Recorded result

On 2026-10-07, the procedure passed against feature code at `b1ae3ee90785032865348341cc93c943e1cfa2e7` on Linux with Node.js 20.19.5 and rootful Docker. The test used separate real panel and daemon processes, a normal assigned user's authenticated console stream, and a Rust container with a 1000-size generated map. Executable/resource files were copied into the isolated installation; no customer world, configuration or plugin scripts were used.

All 12 checks passed:

| Check                                                                 | Result |
| --------------------------------------------------------------------- | ------ |
| Startup logs in the authenticated live console stream                 | Passed |
| Startup logs in the file-backed panel output-log API                  | Passed |
| No Docker ports published                                             | Passed |
| Only the isolated game directory mounted                              | Passed |
| Two-core CPU quota and 6 GiB memory limit configured                  | Passed |
| Real Rust `status` response through the normal user's console         | Passed |
| Independent runtime `echo` log in Docker stdout and the console       | Passed |
| No cursor-position or erase-line dashboard sequences                  | Passed |
| Runtime marker and WebRCON response retained in the output-log API    | Passed |
| Graceful shutdown through the panel's WebRCON `quit` command          | Passed |
| All four pre-existing running containers retained IDs and start times | Passed |
| Isolated Rust container removed after the check                       | Passed |

The four related daemon regression suites also passed: target validation, WebSocket transport, protocol configuration and command dispatch (82 tests total). No production implementation was changed for this documentation follow-up. These are local verification results, not a claim that the entire project suite or GitHub CI was rerun for this follow-up.

## Close-handshake regression

A subsequent browser recording exposed Rust-side `SocketException` and `ObjectDisposedException` messages after abruptly terminating otherwise successful WebRCON connections. The client now sends a normal close frame on an established connection, with a one-second forced-cleanup fallback. A regression test first reproduced abnormal close code `1006` with the previous implementation, then passed with normal close code `1000`. Tests also verify that an unresponsive peer cannot delay the command result or retain the connection indefinitely, and that response timeouts still report failure without retrying the command.

On 2026-10-07, a rebuilt isolated daemon passed the procedure above plus 20 alternating `status` and unique `echo` commands. No connection-reset, disposed-object or Fleck read/write teardown exceptions appeared in the Rust process log. No established or `CLOSE_WAIT` connections remained on the test RCON port. Panel shutdown and test cleanup passed, and the four pre-existing containers retained their IDs and start times at the final verification snapshot.

The repeated-command check allows background startup work to finish and spaces requests to respect Rust's same-address RCON connection cooldown. Earlier faster attempts encountered connection failures from that cooldown; the client does not disable it or retry commands. This is a functional cleanup regression check, not a packet-load or concurrency benchmark.

The full daemon suite passed (143 tests), and the daemon webpack build and relevant Prettier checks passed. The opt-in host Docker restart test was not enabled because it would interrupt production containers. These are local results, not GitHub CI results. The tested client source was an uncommitted change based on `b1ae3ee90785032865348341cc93c943e1cfa2e7`, with SHA-256 `a08a5fa67f1af987093e14729198683c52e2a901b5319589665a3dd9bbd116ef`. No production deployment was performed.
