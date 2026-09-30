import supertest from "supertest";

// Build the daemon Koa app (http.ts:initKoa). Callers must vi.mock heavy deps first,
// because initKoa() reads globalConfiguration.config and mounts http_router which
// pulls FileManager/missionPassport/uploadManager.
export async function createHttpApp() {
  const { initKoa } = await import("../../src/service/http");
  return supertest(initKoa().callback());
}
