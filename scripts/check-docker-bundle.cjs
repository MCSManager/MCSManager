// Run inside a disposable final image, without a Docker socket or persistent data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

async function main() {
  assert.equal(fs.existsSync('node_modules'), false, 'Runtime dependency tree must be absent');
  assert.equal(fs.existsSync('app.js'), true);
  const child = spawn(process.execPath, ['app.js'], { stdio: 'ignore' });
  const port = process.cwd().endsWith('/web') ? 23333 : 24444;
  let accepted = false;
  try {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Application exited: ${child.exitCode}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1000) });
        await response.arrayBuffer();
        if (response.status === 200) {
          accepted = true;
          break;
        }
      } catch (error) {
        if (!(error instanceof TypeError) && error.name !== 'TimeoutError') throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.equal(accepted, true, 'HTTP startup did not reach 200');
    console.log(`PASS bundled runtime, no node_modules, HTTP 200, Node ${process.version}`);
  } finally {
    if (child.exitCode === null) {
      const exit = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGTERM');
      const killer = setTimeout(() => child.kill('SIGKILL'), 5000);
      await exit;
      clearTimeout(killer);
    }
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
