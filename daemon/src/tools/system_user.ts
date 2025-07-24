import { promisify } from "util";
import { exec } from "child_process";
import Instance from "../entity/instance/instance";
import { chown } from "fs/promises";
import { $t } from "../i18n";

// Promisify the exec function to use async/await
const execAsync = promisify(exec);

/**
 * Retrieves the Linux system UID and GID for a given username
 */
export async function getLinuxSystemId(username: string): Promise<{ uid: number; gid: number }> {
  // Validate input: ensure username is a non-empty string
  if (!username || typeof username !== "string" || username.trim() === "") {
    throw new Error('"Run As User" Error: Username must be a non-empty string');
  }

  // Sanitize username to prevent command injection (allow only alphanumeric, underscore, and hyphen)
  const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, "");
  if (sanitizedUsername !== username) {
    throw new Error('"Run As User" Error: Username contains unsafe characters');
  }

  try {
    // Execute `id -u` and `id -g` commands in parallel with a 5-second timeout
    const [uidResult, gidResult] = await Promise.all([
      execAsync(`id -u ${sanitizedUsername}`, { timeout: 5000 }),
      execAsync(`id -g ${sanitizedUsername}`, { timeout: 5000 })
    ]);

    // Check for errors in stderr
    if (uidResult.stderr || gidResult.stderr) {
      throw new Error(`Command error: ${uidResult.stderr || gidResult.stderr}`);
    }

    // Parse UID and GID from command output
    const uid = parseInt(uidResult.stdout.trim());
    const gid = parseInt(gidResult.stdout.trim());

    // Validate parsed UID and GID
    if (isNaN(uid) || isNaN(gid)) {
      throw new Error("Failed to parse UID or GID: Invalid output from id command");
    }

    return { uid, gid };
  } catch (error: any) {
    throw new Error(`Unable to retrieve UID/GID for user "${sanitizedUsername}": ${error.message}`);
  }
}

export async function getRunAsUserParams(instance: Instance) {
  // Get user info for the target user (Linux/macOS only)
  let uid: number | undefined = undefined;
  let gid: number | undefined = undefined;
  let isEnableRunAs = false;
  const name = instance.config.runAs;
  if (name && String(name).trim() && process.platform !== "win32") {
    const result = await getLinuxSystemId(name);
    uid = result.uid;
    gid = result.gid;
    // Do not consider forcibly changing the ownership of instance files,
    // as this may cause unexpected situations for users.
    // try {
    //   await execAsync(`chown -R ${uid}:${gid} "${instance.absoluteCwdPath()}"`);
    // } catch (error) {
    //   instance.println("WARN", $t("TXT_CODE_fcdc758"));
    //   instance.println("WARN", String(error));
    // }
    isEnableRunAs = true;
  }
  return { uid, gid, isEnableRunAs, runAsName: name };
}
