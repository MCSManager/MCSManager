# Rust WebRCON

MCSManager can send console commands through Rust WebRCON when the instance's RCON protocol is set to **WebRCON (Rust)**. Existing instances continue to use Source RCON unless the protocol is changed.

Rust must be started with `+rcon.web 1`, a dedicated `+rcon.port`, and `+rcon.password`. MCSManager's RCON host, port, and password must match those values. The RCON host is resolved by the **daemon**, not by the browser or the game container.

## Console logs and command responses

WebRCON sends commands and returns their responses. Each command uses a separate connection that is closed after the response; this implementation does not subscribe to unsolicited WebRCON log messages. MCSManager continues to display the managed process's standard output and standard error, including output attached from Docker containers.

Established connections use a normal WebSocket close handshake when the command completes or fails. The command result does not wait for that handshake. If the peer does not finish closing within one second, MCSManager forcibly releases the connection. This avoids abruptly resetting healthy Rust connections while keeping cleanup bounded; commands are never retried during cleanup.

For a Linux Rust server managed by MCSManager, add the following options to the Rust executable's startup command, alongside the existing game and RCON settings:

```text
-batchmode -nographics -noconsole -logfile -
```

`-noconsole` disables Rust's interactive console display, not its log output. Without it, Rust can emit cursor-positioning and line-clearing sequences that redraw a status dashboard over earlier messages in the MCSManager terminal. `-logfile -` directs Rust's log output to standard output so MCSManager can display an append-only log alongside WebRCON command responses. If the startup command uses a wrapper, verify that it forwards these options to the Rust executable and does not override the log destination.

Keep WebRCON enabled for command input: Linux Rust does not process the panel's standard input as an interactive command console. These startup options require a Rust restart; refreshing the browser alone does not apply them. MCSManager does not automatically rewrite game startup commands. Plugins may also write separate log files, and this setup does not guarantee that every game event is logged or that historical logs are available through WebRCON.

After restarting, verify that startup messages reach the panel, that `status` returns a WebRCON response, and that an `echo` command with a unique test marker appears in the process log without dashboard redraw sequences. Use `quit` to verify graceful shutdown in an isolated test instance. A remote RCON-only server without a managed process output stream would require separate support for persistent WebRCON log subscriptions.

See [Rust console verification](rust-webrcon-console-verification.md) for the isolated real-server procedure and its scope.

## Configuration and security

Only administrators can select Rust WebRCON or change its RCON settings. Assigned users can still send commands through the instance console and view their own RCON credentials in the read-only settings dialog. They may use an external RCON client if the administrator provides a reachable endpoint. Instance details intentionally include the assigned instance's password; the normal user's instance list does not include the dedicated RCON fields (credentials may still appear in owner-controlled startup commands or environment variables). Revoke or rotate the Rust-side password when direct RCON access must end: removing a panel assignment alone does not revoke external clients.

The authenticated panel sends RCON updates through `instance/update_rcon`, with `allowWebRconConfiguration: true` only for administrators. The daemon rejects WebRCON changes through generic `instance/update`, even if a caller supplies an authorization flag. The permission check and update run synchronously against the current protocol. A WebSocket handshake is an HTTP request, so allowing tenants to choose its destination would expose internal HTTP services to requests from the daemon. Existing Source RCON permissions are unchanged when both components are updated. Older panels cannot configure WebRCON on the new daemon; older daemons do not support the new RCON update RPC, and the panel never retries it through the generic RPC. Other instance settings remain compatible.

When switching from Source RCON to Rust WebRCON, explicitly submit a nonempty host and password and a port in the range 1-65535. Selecting WebRCON in the settings dialog clears the Source connection details and requires the administrator to re-enter a trusted target. Opening an existing WebRCON configuration does not clear its credentials. The daemon also rejects incomplete targets rather than promoting previously tenant-controlled Source settings by inheritance. This also applies when creating a new WebRCON instance.

RCON fields are defined centrally in `common/src/rcon_config.ts` and inherited by the instance configuration type. Its exhaustive field map ensures that adding a field requires updating the authorization classification. Runtime input remains untrusted and is validated separately by the daemon.

The daemon uses the same local target validation before saving WebRCON settings and before connecting. This covers both protocol transitions and partial updates to an existing WebRCON target, without DNS lookups or network requests. Invalid targets are rejected before any instance settings are changed. Disabling RCON or changing unrelated settings remains possible for an invalid legacy target; enabling it requires a valid target.

Preset installation is a separate administrator-delegated operation: the configured marketplace source, package URLs and archive configuration are trusted administrative inputs. Assigned owners with preset-install permission can select those packages, but cannot supply arbitrary package configuration or URLs through that route. Preset maintainers can set commands, credentials and WebRCON destinations, so only trusted sources and packages should be enabled. Making these inputs tenant-controlled would require a new authorization boundary; it must not bypass the privileged RCON update RPC.

For a Docker instance on the same host as the daemon, map the RCON TCP port only to the host loopback address, for example `127.0.0.1:28016:28016/tcp`. Do not forward the RCON port on the router or expose it publicly: Rust WebRCON uses unencrypted WebSocket (`ws://`) and authenticates using the password in the URL path.

Use a long, randomly generated alphanumeric password. URL encoding of special characters is covered by client tests, but authentication with such passwords has not been verified against a real Rust server.

Stop the instance before enabling RCON or switching its protocol in MCSManager. Changing Rust's startup options or Docker port mapping also requires a Rust restart. A close before a reply or a response timeout does **not** prove that a command failed, so MCSManager does not retry commands automatically. An explicit send failure is always reported, including during shutdown. A close during shutdown is ignored only after the local write succeeds; this does not confirm Rust executed the command. Set the instance stop command to a Rust command such as `quit` to send it over WebRCON; `^c` retains MCSManager's special process-interrupt behavior.
