import { beforeEach, describe, expect, it } from "vitest";
import {
  getUnsafeIntegrationTestModeKey,
  isUnsafeIntegrationTestRequest,
  parseUnsafeIntegrationTestModeArg
} from "../integration_test_mode";

beforeEach(() => {
  // Module state is global; start every test from a clean, disabled mode.
  parseUnsafeIntegrationTestModeArg([]);
});

describe("parseUnsafeIntegrationTestModeArg", () => {
  it("is disabled by default", () => {
    expect(getUnsafeIntegrationTestModeKey()).toBeNull();
    expect(isUnsafeIntegrationTestRequest("anything")).toBe(false);
  });

  it("parses the exact flag", () => {
    parseUnsafeIntegrationTestModeArg(["--Unsafe-Integration-Test-Mode=s3cret"]);
    expect(getUnsafeIntegrationTestModeKey()).toBe("s3cret");
  });

  it("matches the parameter name case-insensitively but keeps the key case-sensitive", () => {
    parseUnsafeIntegrationTestModeArg(["--UNSAFE-INTEGRATION-TEST-MODE=SecretKey"]);
    expect(getUnsafeIntegrationTestModeKey()).toBe("SecretKey");
    expect(isUnsafeIntegrationTestRequest("SecretKey")).toBe(true);
    expect(isUnsafeIntegrationTestRequest("secretkey")).toBe(false);
  });

  it("ignores unrelated arguments and finds the flag among them", () => {
    parseUnsafeIntegrationTestModeArg(["--open", "--Unsafe-Integration-Test-Mode=abc", "--foo"]);
    expect(getUnsafeIntegrationTestModeKey()).toBe("abc");
  });

  it("stays disabled without an '=', with an empty value, or without the flag", () => {
    parseUnsafeIntegrationTestModeArg(["--Unsafe-Integration-Test-Mode"]);
    expect(getUnsafeIntegrationTestModeKey()).toBeNull();

    parseUnsafeIntegrationTestModeArg(["--Unsafe-Integration-Test-Mode="]);
    expect(getUnsafeIntegrationTestModeKey()).toBeNull();

    parseUnsafeIntegrationTestModeArg(["--open"]);
    expect(getUnsafeIntegrationTestModeKey()).toBeNull();
  });

  it("resets a previously parsed key when reparsed without the flag", () => {
    parseUnsafeIntegrationTestModeArg(["--Unsafe-Integration-Test-Mode=abc"]);
    expect(getUnsafeIntegrationTestModeKey()).toBe("abc");
    parseUnsafeIntegrationTestModeArg([]);
    expect(getUnsafeIntegrationTestModeKey()).toBeNull();
  });
});

describe("isUnsafeIntegrationTestRequest", () => {
  it("is false for missing keys while enabled", () => {
    parseUnsafeIntegrationTestModeArg(["--Unsafe-Integration-Test-Mode=abc"]);
    expect(isUnsafeIntegrationTestRequest(undefined)).toBe(false);
    expect(isUnsafeIntegrationTestRequest(null)).toBe(false);
    expect(isUnsafeIntegrationTestRequest("")).toBe(false);
    expect(isUnsafeIntegrationTestRequest("other")).toBe(false);
  });

  it("is true only for an exact key match", () => {
    parseUnsafeIntegrationTestModeArg(["--Unsafe-Integration-Test-Mode=abc"]);
    expect(isUnsafeIntegrationTestRequest("abc")).toBe(true);
  });
});
