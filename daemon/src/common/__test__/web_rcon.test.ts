import { describe, expect, it } from "vitest";
import { validateWebRconTarget, WebRconError } from "../web_rcon";

describe("WebRCON target validation", () => {
  it.each([
    ["127.0.0.1", "127.0.0.1"],
    [" rust.internal ", "rust.internal"],
    ["localhost", "localhost"],
    ["::1", "[::1]"],
    ["[2001:db8::1]", "[2001:db8::1]"]
  ])("accepts host %s without resolving it", (host, authority) => {
    expect(validateWebRconTarget(host, 28016, "p/a#b?c%")).toBe(
      `ws://${authority}:28016/p%2Fa%23b%3Fc%25`
    );
  });

  it.each([1, 65535])("accepts boundary port %s", (port) => {
    expect(validateWebRconTarget("localhost", port, "secret")).toBe(
      `ws://localhost:${port}/secret`
    );
  });

  it.each([
    undefined,
    null,
    123,
    {},
    "",
    "   ",
    "http://127.0.0.1",
    "server/path",
    "user@server",
    "server?query",
    "server#fragment",
    "server\\path",
    "two hosts",
    "local\nhost",
    "[localhost]",
    "[::1",
    "::1]",
    "999.999.999.999",
    "a".repeat(254)
  ])("rejects invalid host %#", (host) => {
    expect(() => validateWebRconTarget(host, 28016, "secret")).toThrowError(
      new WebRconError("invalidTarget")
    );
  });

  it.each([undefined, null, "28016", 0, -1, 65536, 1.5, NaN, Infinity])(
    "rejects invalid port %#",
    (port) => {
      expect(() => validateWebRconTarget("localhost", port, "secret")).toThrowError(
        new WebRconError("invalidTarget")
      );
    }
  );

  it.each([undefined, null, "", false, 123, {}])("requires a string password %#", (password) => {
    expect(() => validateWebRconTarget("localhost", 28016, password)).toThrowError(
      new WebRconError("missingPassword")
    );
  });

  it("sanitizes URL parsing and password encoding failures", () => {
    for (const [host, password] of [
      ["999.999.999.999", "private-secret"],
      ["localhost", "private-secret\ud800"]
    ]) {
      try {
        validateWebRconTarget(host, 28016, password);
        expect.fail("target must be rejected");
      } catch (error) {
        expect(error).toBeInstanceOf(WebRconError);
        expect((error as Error).message).toBe("invalidTarget");
        expect((error as Error).message).not.toContain(host);
        expect((error as Error).message).not.toContain("private-secret");
      }
    }
  });
});
