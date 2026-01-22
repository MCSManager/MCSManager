/**
 * Normalizes Docker platform architecture names to standard format
 * @param architecture The architecture string from Docker manifest
 * @returns Normalized architecture string (amd64, arm64, arm, or original if not recognized)
 */
export function normalizeDockerArchitecture(architecture: string | undefined): string {
  if (!architecture) {
    return "amd64"; // default fallback
  }

  // Return original if not one of the standard architectures
  return architecture;
}

/**
 * Normalizes Docker platform OS name
 * @param os The OS string from Docker manifest
 * @returns Normalized OS string (defaults to "linux" if not provided)
 */
export function normalizeDockerOS(os: string | undefined): string {
  return os || "linux";
}

/**
 * Normalizes a Docker platform from manifest format to standard platform string
 * @param platform Platform object from Docker manifest with os and architecture
 * @returns Normalized platform string in format "os/arch" (e.g., "linux/amd64")
 */
export function normalizeDockerPlatform(platform: { os?: string; architecture?: string }): string {
  const os = normalizeDockerOS(platform.os);
  const arch = normalizeDockerArchitecture(platform.architecture);
  return `${os}/${arch}`;
}
