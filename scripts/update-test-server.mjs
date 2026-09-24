// Local static HTTP server that serves the auto-update manifest + zip packages.
// Used to verify the daemon/panel self-update flow against a real download URL.
//
//   node scripts/build-update-packages.mjs   # (re)generate packages + manifest
//   node scripts/update-test-server.mjs        # serve on http://localhost:9999

import fs from "fs";
import http from "http";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "update-packages");
const PORT = 9999;

const MIME = {
  ".json": "application/json; charset=utf-8",
  ".zip": "application/zip",
  ".html": "text/html"
};

if (!fs.existsSync(ROOT) || !fs.existsSync(path.join(ROOT, "manifest.json"))) {
  console.error(
    `Missing ${ROOT}/manifest.json.\nRun: node scripts/build-update-packages.mjs first.`
  );
  process.exit(1);
}

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/manifest.json";
    const filePath = path.join(ROOT, path.normalize(urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("not found: " + urlPath);
        return;
      }
      res.writeHead(200, {
        "content-type": MIME[path.extname(filePath)] || "application/octet-stream",
        "content-length": stat.size,
        "access-control-allow-origin": "*"
      });
      fs.createReadStream(filePath).pipe(res);
      console.log(`[update-server] ${req.method} ${urlPath} -> ${stat.size} bytes`);
    });
  })
  .listen(PORT, () => {
    console.log(`[update-server] serving ${ROOT}`);
    console.log(`[update-server] manifest:  http://localhost:${PORT}/manifest.json`);
    console.log(`[update-server] daemon.zip: http://localhost:${PORT}/daemon.zip`);
    console.log(`[update-server] web.zip:    http://localhost:${PORT}/web.zip`);
  });
