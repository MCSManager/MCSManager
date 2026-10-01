#!/usr/bin/env node
/**
 * Interactive stdio fixture application for the MCSManager daemon integration
 * suite (`src/routers/__test__/Instance_router.integration.test.ts`, describe
 * "General process instance interactive lifecycle (real)").
 *
 * Every instance of that suite is created with the start command `node test.mjs`
 * (this file is copied into the instance workspace first), so it must stay
 * dependency-free (Node builtins only) and speak a simple line protocol on
 * stdin/stdout:
 *
 *   (on start)    READY:<pid>
 *   help          HELP:echo <text>|pid|sum <a> <b>|sleep <ms>|exit
 *   echo <text>   ECHO:<text>
 *   pid           PID:<pid>
 *   sum <a> <b>   SUM:<a+b>          (or ERR:sum expects two numbers)
 *   sleep <ms>    SLEEPING:<ms> now, SLEPT:<ms> after the delay
 *   exit          BYE, then a clean exit(0)   (used as the instance stopCommand)
 *   anything else ERR:unknown command:<line>
 *
 * Every 200 ms it also appends `HEARTBEAT:<n>` to `heartbeat.txt` in its working
 * directory. The tests use that file as an out-of-band liveness probe: it keeps
 * growing while the process runs and freezes the moment a force kill lands,
 * independently of the buffered stdout capture.
 *
 * Run manually for a quick interactive check:  node test.mjs
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const MAX_SLEEP_MS = 60000;
const heartbeatFile = path.join(process.cwd(), "heartbeat.txt");

function reply(text) {
  process.stdout.write(`${text}\n`);
}

let beats = 0;
const heartbeat = setInterval(() => {
  beats += 1;
  fs.appendFileSync(heartbeatFile, `HEARTBEAT:${beats}\n`);
}, 200);

reply(`READY:${process.pid}`);

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", (line) => {
  // The daemon appends the configured CRLF ("\r\n" on Windows) after every
  // command; strip a trailing "\r" so parsing works on every platform.
  const text = String(line).replace(/\r$/, "");
  const trimmed = text.trim();
  if (!trimmed) return;
  const [cmd, ...rest] = trimmed.split(" ");
  const arg = rest.join(" ");

  switch (cmd.toLowerCase()) {
    case "help":
      reply("HELP:echo <text>|pid|sum <a> <b>|sleep <ms>|exit");
      break;
    case "echo":
      reply(`ECHO:${arg}`);
      break;
    case "pid":
      reply(`PID:${process.pid}`);
      break;
    case "sum": {
      const a = Number(rest[0]);
      const b = Number(rest[1]);
      if (rest.length !== 2 || !Number.isFinite(a) || !Number.isFinite(b)) {
        reply("ERR:sum expects two numbers");
      } else {
        reply(`SUM:${a + b}`);
      }
      break;
    }
    case "sleep": {
      const ms = Number(rest[0]);
      if (rest.length !== 1 || !Number.isFinite(ms) || ms < 0 || ms > MAX_SLEEP_MS) {
        reply(`ERR:sleep expects 0..${MAX_SLEEP_MS} ms`);
        break;
      }
      reply(`SLEEPING:${ms}`);
      setTimeout(() => reply(`SLEPT:${ms}`), ms);
      break;
    }
    case "exit":
      // Exit on the write callback so the BYE line is flushed before the
      // process goes away.
      clearInterval(heartbeat);
      process.stdout.write("BYE\n", () => process.exit(0));
      break;
    default:
      reply(`ERR:unknown command:${trimmed}`);
  }
});
