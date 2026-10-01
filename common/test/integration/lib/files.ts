import axios from "axios";
import fs from "node:fs";
import { requestPanel } from "./http";

// Panel-side file operations. Every wrapper takes the caller's session
// explicitly (admin or the instance owner) — no hidden global state.

export async function listFiles(
  daemonId: string,
  uuid: string,
  cookie: string,
  token: string,
  target = ".",
  page = 0,
  pageSize = 100
) {
  return requestPanel({
    method: "GET",
    path: "/files/list",
    cookie,
    token,
    query: { daemonId, uuid, target, page, page_size: pageSize, file_name: "" }
  });
}

export async function mkdirP(daemonId: string, uuid: string, cookie: string, token: string, target: string) {
  return requestPanel({
    method: "POST",
    path: "/files/mkdir",
    cookie,
    token,
    query: { daemonId, uuid },
    body: { target }
  });
}

export async function moveFile(daemonId: string, uuid: string, cookie: string, token: string, targets: string[][]) {
  return requestPanel({
    method: "PUT",
    path: "/files/move",
    cookie,
    token,
    query: { daemonId, uuid },
    body: { targets }
  });
}

export async function copyFile(daemonId: string, uuid: string, cookie: string, token: string, targets: string[][]) {
  return requestPanel({
    method: "POST",
    path: "/files/copy",
    cookie,
    token,
    query: { daemonId, uuid },
    body: { targets }
  });
}

export async function editFile(
  daemonId: string,
  uuid: string,
  cookie: string,
  token: string,
  target: string,
  text: string
) {
  return requestPanel({
    method: "PUT",
    path: "/files",
    cookie,
    token,
    query: { daemonId, uuid },
    body: { target, text },
    timeout: 120000
  });
}

// Reading: body {target} without `text` returns current content.
export async function readFileText(daemonId: string, uuid: string, cookie: string, token: string, target: string) {
  return requestPanel({
    method: "PUT",
    path: "/files",
    cookie,
    token,
    query: { daemonId, uuid },
    body: { target },
    timeout: 120000
  });
}

export async function deleteFiles(daemonId: string, uuid: string, cookie: string, token: string, targets: string[]) {
  return requestPanel({
    method: "DELETE",
    path: "/files",
    cookie,
    token,
    query: { daemonId, uuid },
    body: { targets }
  });
}

// decompress: POST /files/compress with type!=1 -> daemon fileManager.unzip(source, targets, code)
export async function decompress(
  daemonId: string,
  uuid: string,
  cookie: string,
  token: string,
  source: string,
  targets = "."
) {
  return requestPanel({
    method: "POST",
    path: "/files/compress",
    cookie,
    token,
    query: { daemonId, uuid },
    body: { type: 0, source, targets, code: "utf-8" },
    timeout: 120000
  });
}

// ---- daemon-direct upload/download (mission passport) ----

export interface Passport {
  password: string;
  addr: string; // ip:port(+prefix for files)
  remoteMappings: any[];
}

export async function getUploadPassport(
  daemonId: string,
  uuid: string,
  cookie: string,
  token: string,
  uploadDir = "."
): Promise<Passport> {
  const r = await requestPanel({
    method: "POST",
    path: "/files/upload",
    cookie,
    token,
    query: { daemonId, uuid, upload_dir: uploadDir }
  });
  return r.data as Passport;
}

export async function getDownloadPassport(
  daemonId: string,
  uuid: string,
  cookie: string,
  token: string,
  fileName: string
): Promise<Passport> {
  const r = await requestPanel({
    method: "POST",
    path: "/files/download",
    cookie,
    token,
    query: { daemonId, uuid, file_name: fileName }
  });
  return r.data as Passport;
}

function httpBase(addr: string): string {
  if (!addr) return "http://127.0.0.1:24444";
  if (addr.startsWith("http://") || addr.startsWith("https://")) return addr;
  if (addr.startsWith("ws://")) return "http://" + addr.slice(5);
  if (addr.startsWith("wss://")) return "https://" + addr.slice(4);
  return "http://" + addr;
}

// Old single-shot multipart upload to daemon: POST {addr}/upload/{key}?unzip=&overwrite=false
// formidable parses field name "file". unzip=0 keeps the archive; unzip=1 extracts on upload.
export async function uploadToDaemon(
  passport: Passport,
  localPath: string,
  remoteName: string,
  opts: { unzip?: boolean; code?: string; overwrite?: boolean } = {}
): Promise<{ httpStatus: number; data: any }> {
  const base = httpBase(passport.addr);
  const url = `${base}/upload/${encodeURIComponent(passport.password)}`;
  const buf = fs.readFileSync(localPath);
  const boundary = "----mcsmtest" + Math.random().toString(36).slice(2);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${remoteName}"\r\nContent-Type: application/octet-stream\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, buf, tail]);
  const params: any = { unzip: opts.unzip ? 1 : 0, overwrite: String(opts.overwrite ?? false) };
  if (opts.code) params.code = opts.code;
  const res = await axios.post(url, body, {
    params,
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    timeout: 120000,
    validateStatus: () => true
  });
  let data: any = res.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      /* keep string */
    }
  }
  return { httpStatus: res.status, data };
}

// Chunked upload path the frontend uses: POST /upload-new to start a resumable
// upload, then /upload-piece/{id}?offset=N for each chunk. Daemon reassembles
// the file from the pieces. Mirrors daemon/files_router.ts upload handlers.
export async function uploadFileChunked(o: {
  addr: string;
  password: string;
  name: string;
  content: Buffer;
  unzip?: boolean;
  overwrite?: boolean;
  pieceSize?: number;
}): Promise<any> {
  const base = httpBase(o.addr);
  const pieceSize = o.pieceSize ?? 2 * 1024 * 1024;
  const init = await axios.post(`${base}/upload-new/${encodeURIComponent(o.password)}`, null, {
    params: {
      filename: o.name,
      size: o.content.length,
      unzip: o.unzip ? 1 : 0,
      overwrite: String(o.overwrite ?? false)
    },
    validateStatus: () => true,
    maxRedirects: 0,
    timeout: 120000
  });
  const id = init.data?.data?.id;
  if (!id) throw new Error("upload-new gave no id");
  for (let off = 0; off < o.content.length; off += pieceSize) {
    const chunk = o.content.subarray(off, off + pieceSize);
    const boundary = "----mcsmtest" + Math.random().toString(36).slice(2);
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\nContent-Type: application/octet-stream\r\n\r\n`
      ),
      chunk,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);
    await axios.post(`${base}/upload-piece/${id}`, body, {
      params: { offset: off },
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
      validateStatus: () => true,
      maxRedirects: 0,
      timeout: 120000
    });
  }
  return init.data;
}

export async function downloadFromDaemon(
  passport: Passport,
  basename: string
): Promise<{ httpStatus: number; data: Buffer }> {
  const base = httpBase(passport.addr);
  const url = `${base}/download/${encodeURIComponent(passport.password)}/${encodeURIComponent(basename)}`;
  const res = await axios.get(url, { responseType: "arraybuffer", timeout: 120000, validateStatus: () => true });
  return { httpStatus: res.status, data: Buffer.from(res.data as ArrayBuffer) };
}
