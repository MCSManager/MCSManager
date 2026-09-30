/**
 * Unsafe integration-test mode.
 *
 * When the panel process is started with `--Unsafe-Integration-Test-Mode=<key>`
 * (the parameter NAME is matched case-insensitively, e.g.
 * `--unsafe-integration-test-mode=<key>`), the permission middleware will let
 * through any request whose `x-request-api-key` header equals `<key>` WITHOUT
 * performing any permission check.
 *
 * This exists purely so automated integration tests can call privileged panel
 * APIs without going through a real login. The default is DISABLED (no argument
 * passed => the key is `null`). Never enable it on a production instance and
 * always use a long, random, secret key, because anyone who knows the key gets
 * full admin access.
 */

// Parameter name, compared case-insensitively. Keep this as the single source
// of truth for the flag spelling used across the codebase.
const UNSAFE_INTEGRATION_TEST_MODE_ARG = "--unsafe-integration-test-mode";

// The key parsed from the CLI argument, or null when the mode is disabled.
let unsafeIntegrationTestModeKey: string | null = null;

/**
 * Parse the `--Unsafe-Integration-Test-Mode=<key>` argument out of an argv array
 * (defaults to `process.argv`) and store the key in module state.
 *
 * The parameter name is case-insensitive; the key itself is case-sensitive.
 * A missing `=`, an empty key, or an absent argument all leave the mode
 * disabled. Passing `[]` explicitly resets the mode, which is handy in tests.
 */
export function parseUnsafeIntegrationTestModeArg(argv: readonly string[] = process.argv): void {
  unsafeIntegrationTestModeKey = null;
  for (const arg of argv) {
    if (typeof arg !== "string") continue;
    const separator = arg.indexOf("=");
    const name = separator === -1 ? arg : arg.slice(0, separator);
    if (name.toLowerCase() !== UNSAFE_INTEGRATION_TEST_MODE_ARG) continue;
    const value = separator === -1 ? "" : arg.slice(separator + 1);
    unsafeIntegrationTestModeKey = value.length > 0 ? value : null;
    return;
  }
}

/** The parsed key, or null when unsafe integration-test mode is disabled. */
export function getUnsafeIntegrationTestModeKey(): string | null {
  return unsafeIntegrationTestModeKey;
}

/**
 * Whether the given `x-request-api-key` value is the configured unsafe
 * integration-test key. Always false when the mode is disabled.
 */
export function isUnsafeIntegrationTestRequest(apiKey: unknown): boolean {
  if (!unsafeIntegrationTestModeKey) return false;
  if (apiKey === undefined || apiKey === null) return false;
  return String(apiKey) === unsafeIntegrationTestModeKey;
}
