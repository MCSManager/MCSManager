/**
 * Tracks whether the terminal is currently replaying historical output
 * (the backlog written into a freshly mounted terminal on reconnect)
 * rather than processing live data.
 *
 * While replaying, xterm.js can synthesize escape-sequence auto-replies
 * (e.g. a cursor-position-report response to a stale, already-unanswered
 * `ESC[6n` query sitting in the backlog) and emit them through the same
 * onData channel used for real keystrokes. Those synthesized replies must
 * not be forwarded to the daemon as user input.
 */
export function createTerminalHistoryReplayGate() {
  let isReplaying = false;

  return {
    isReplaying: () => isReplaying,
    begin: () => {
      isReplaying = true;
    },
    end: () => {
      isReplaying = false;
    }
  };
}

export type TerminalHistoryReplayGate = ReturnType<typeof createTerminalHistoryReplayGate>;
