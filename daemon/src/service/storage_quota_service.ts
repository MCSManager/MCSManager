import fs from "fs-extra";
import { toText } from "mcsmanager-common";
import { execFile, spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import StorageSubsystem from "../common/system_storage";
import Instance from "../entity/instance/instance";
import { $t } from "../i18n";

const execFilePromise = promisify(execFile);

const PROJECTS_PATH = "/etc/projects";
const PROJID_PATH = "/etc/projid";
const MIN_PROJECT_ID = 200000;
const COMMAND_TIMEOUT_MS = 10000;
const HARD_QUOTA_HEADROOM_RATIO = 1.1;
const COMMAND_ENV = {
  ...process.env,
  LC_ALL: "C",
  LANG: "C",
  LANGUAGE: "C"
};

interface IXfsMountInfo {
  mountPoint: string;
  fstype: string;
  options: string[];
}

interface IProjectFiles {
  projectsText: string;
  projidText: string;
  projects: Map<number, string>;
  projids: Map<string, number>;
}

async function runFile(
  command: string,
  args: string[] = []
): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFilePromise(command, args, {
    timeout: COMMAND_TIMEOUT_MS,
    env: COMMAND_ENV
  });
  return { stdout: String(stdout || ""), stderr: String(stderr || "") };
}

function getErrorText(error: any) {
  return `${error?.stderr || ""}\n${error?.stdout || ""}\n${error?.message || ""}`;
}

function isPermissionError(error: any) {
  const errorText = getErrorText(error).toLowerCase();
  return (
    error?.code === "EACCES" ||
    error?.code === "EPERM" ||
    errorText.includes("permission denied") ||
    errorText.includes("operation not permitted") ||
    errorText.includes("not permitted") ||
    errorText.includes("不允许") ||
    errorText.includes("权限")
  );
}

async function execWithSudo(command: string, args: string[] = []) {
  try {
    return await runFile(command, args);
  } catch (error: any) {
    if (!isPermissionError(error)) throw error;
    try {
      return await runFile("sudo", ["-n", command, ...args]);
    } catch (sudoError: any) {
      throw new Error($t("TXT_CODE_storage_quota_sudo_required", { error: getErrorText(sudoError).trim() }));
    }
  }
}

async function readFileWithSudo(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error: any) {
    if (!isPermissionError(error)) {
      if (error?.code === "ENOENT") return "";
      throw error;
    }
    try {
      const { stdout } = await runFile("sudo", ["-n", "cat", filePath]);
      return stdout;
    } catch (sudoError: any) {
      throw new Error($t("TXT_CODE_storage_quota_sudo_required", { error: getErrorText(sudoError).trim() }));
    }
  }
}

async function writeFileWithSudo(filePath: string, content: string) {
  try {
    await fs.writeFile(filePath, content);
  } catch (error: any) {
    if (!isPermissionError(error)) throw error;
    try {
      await writeFileWithSudoTee(filePath, content);
    } catch (sudoError: any) {
      throw new Error($t("TXT_CODE_storage_quota_sudo_required", { error: sudoError.message }));
    }
  }
}

async function writeFileWithSudoTee(filePath: string, content: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("sudo", ["-n", "tee", filePath], {
      env: COMMAND_ENV,
      stdio: ["pipe", "ignore", "pipe"]
    });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`sudo tee timed out: ${filePath}`));
    }, COMMAND_TIMEOUT_MS);

    child.stderr.on("data", (data) => {
      stderr += String(data);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr.trim() || `sudo tee exited with code ${code}`));
      }
    });
    child.stdin.end(content);
  });
}

class StorageQuotaService {
  private quotaOperation = Promise.resolve();

  public resolveDockerLocalWorkspace(instance: Instance) {
    return instance.absoluteCwdPath();
  }

  public resolveDockerHostWorkspace(instance: Instance, defaultInstanceDir: string) {
    const cwd = path.normalize(instance.absoluteCwdPath());
    const normalizedDefaultInstanceDir = path.normalize(defaultInstanceDir);
    const hostRealPath = toText(process.env.MCSM_DOCKER_WORKSPACE_PATH);
    if (hostRealPath && this.#isPathInside(cwd, normalizedDefaultInstanceDir)) {
      return path.normalize(path.join(hostRealPath, instance.instanceUuid));
    }
    return cwd;
  }

  public async ensureDockerHardQuota(instance: Instance, workspace: string, maxSpaceGb: number) {
    if (!Number.isFinite(maxSpaceGb) || maxSpaceGb <= 0) return;
    return this.#withQuotaOperationLock(async () => {
      await this.#ensureDockerHardQuota(instance, workspace, maxSpaceGb);
    });
  }

  public async clearDockerHardQuotaIfManaged(instance: Instance, workspace: string) {
    return this.#withQuotaOperationLock(async () => {
      await this.#clearDockerHardQuotaIfManaged(instance, workspace, false);
    });
  }

  public async deleteDockerHardQuotaIfManaged(instance: Instance, workspace: string) {
    return this.#withQuotaOperationLock(async () => {
      await this.#clearDockerHardQuotaIfManaged(instance, workspace, true);
    });
  }

  async #ensureDockerHardQuota(instance: Instance, workspace: string, maxSpaceGb: number) {
    await this.#assertWorkspaceVisible(workspace);
    const mountInfo = await this.#getXfsProjectQuotaMount(workspace);
    await this.#assertXfsQuotaCommand();

    const projectName = this.#getProjectName(instance);
    const projectFiles = await this.#readProjectFiles();
    const projectId = this.#resolveProjectId(instance, workspace, projectName, projectFiles);

    await this.#writeProjectFiles(projectFiles, projectName, projectId, workspace);
    try {
      await execWithSudo("xfs_quota", ["-x", "-c", `project -s ${projectName}`, mountInfo.mountPoint]);
      await execWithSudo("xfs_quota", [
        "-x",
        "-c",
        `limit -p bhard=${this.#toQuotaKiB(maxSpaceGb)} ${projectName}`,
        mountInfo.mountPoint
      ]);
    } catch (error: any) {
      throw new Error($t("TXT_CODE_storage_quota_apply_failed", { error: error.message }));
    }

    if (instance.config.docker.storageQuotaProjectId !== projectId) {
      instance.config.docker.storageQuotaProjectId = projectId;
      StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
    }
  }

  async #clearDockerHardQuotaIfManaged(instance: Instance, workspace: string, removeProject: boolean) {
    const projectName = this.#getProjectName(instance);
    const projectFiles = await this.#readProjectFiles();
    const projectId = instance.config.docker.storageQuotaProjectId ?? projectFiles.projids.get(projectName);
    if (!projectId || projectFiles.projids.get(projectName) !== projectId) return;

    const projectWorkspace = projectFiles.projects.get(projectId) ?? workspace;
    if (await fs.pathExists(projectWorkspace)) {
      const mountInfo = await this.#getXfsProjectQuotaMount(projectWorkspace);
      await this.#assertXfsQuotaCommand();
      await execWithSudo("xfs_quota", [
        "-x",
        "-c",
        `limit -p bhard=0 ${projectName}`,
        mountInfo.mountPoint
      ]);
    } else {
      throw new Error(
        $t("TXT_CODE_storage_quota_workspace_not_visible", {
          path: projectWorkspace
        })
      );
    }

    if (removeProject) {
      await this.#removeProjectFiles(projectFiles, projectName, projectId);
      instance.config.docker.storageQuotaProjectId = undefined;
      StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
    }
  }

  async #withQuotaOperationLock<T>(operation: () => Promise<T>) {
    const previous = this.quotaOperation;
    let release!: () => void;
    this.quotaOperation = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  async #getXfsProjectQuotaMount(workspace: string): Promise<IXfsMountInfo> {
    if (os.platform() !== "linux") {
      throw new Error($t("TXT_CODE_storage_quota_linux_only"));
    }
    try {
      const { stdout } = await runFile("findmnt", [
        "--target",
        workspace,
        "--json",
        "--output",
        "TARGET,FSTYPE,OPTIONS"
      ]);
      const data = JSON.parse(String(stdout));
      const filesystem = data?.filesystems?.[0];
      if (!filesystem?.target) {
        throw new Error($t("TXT_CODE_storage_quota_mount_not_found", { path: workspace }));
      }
      const fstype = String(filesystem.fstype || "").toLowerCase();
      const options = String(filesystem.options || "")
        .toLowerCase()
        .split(",")
        .filter(Boolean);
      if (fstype !== "xfs") {
        throw new Error($t("TXT_CODE_storage_quota_requires_xfs", { path: workspace }));
      }
      if (!options.includes("prjquota") && !options.includes("pquota")) {
        throw new Error($t("TXT_CODE_storage_quota_requires_prjquota", { path: workspace }));
      }
      return {
        mountPoint: String(filesystem.target),
        fstype,
        options
      };
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        throw new Error($t("TXT_CODE_storage_quota_findmnt_missing"));
      }
      throw error;
    }
  }

  async #assertXfsQuotaCommand() {
    try {
      await runFile("xfs_quota", ["-V"]);
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        throw new Error($t("TXT_CODE_storage_quota_xfs_quota_missing"));
      }
      throw error;
    }
  }

  async #assertWorkspaceVisible(workspace: string) {
    if (!(await fs.pathExists(workspace))) {
      throw new Error(
        $t("TXT_CODE_storage_quota_workspace_not_visible", {
          path: workspace
        })
      );
    }
  }

  #getProjectName(instance: Instance) {
    return `mcsm_${instance.instanceUuid.replace(/[^a-zA-Z0-9]/g, "")}`;
  }

  #isPathInside(targetPath: string, parentPath: string) {
    const relativePath = path.relative(parentPath, targetPath);
    return (
      relativePath === "" ||
      (!!relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath))
    );
  }

  #toQuotaKiB(maxSpaceGb: number) {
    return `${Math.ceil(maxSpaceGb * HARD_QUOTA_HEADROOM_RATIO * 1024 * 1024)}k`;
  }

  async #readProjectFiles(): Promise<IProjectFiles> {
    const [projectsText, projidText] = await Promise.all([
      this.#readTextFile(PROJECTS_PATH),
      this.#readTextFile(PROJID_PATH)
    ]);
    return {
      projectsText,
      projidText,
      projects: this.#parseProjects(projectsText),
      projids: this.#parseProjids(projidText)
    };
  }

  async #readTextFile(filePath: string) {
    return await readFileWithSudo(filePath);
  }

  #parseProjects(text: string) {
    const projects = new Map<number, string>();
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf(":");
      if (index === -1) continue;
      const id = Number(trimmed.slice(0, index));
      const projectPath = trimmed.slice(index + 1);
      if (Number.isInteger(id) && id > 0) projects.set(id, path.normalize(projectPath));
    }
    return projects;
  }

  #parseProjids(text: string) {
    const projids = new Map<string, number>();
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf(":");
      if (index === -1) continue;
      const name = trimmed.slice(0, index);
      const id = Number(trimmed.slice(index + 1));
      if (name && Number.isInteger(id) && id > 0) projids.set(name, id);
    }
    return projids;
  }

  #resolveProjectId(
    instance: Instance,
    workspace: string,
    projectName: string,
    projectFiles: IProjectFiles
  ) {
    const normalizedWorkspace = path.normalize(workspace);
    const existingNameId = projectFiles.projids.get(projectName);
    const configuredId = Number(instance.config.docker.storageQuotaProjectId || 0);
    const existingPathId = Array.from(projectFiles.projects.entries()).find(
      ([, projectPath]) => path.normalize(projectPath) === normalizedWorkspace
    )?.[0];
    const projectId = existingNameId || configuredId || existingPathId || this.#allocateProjectId(projectFiles);

    const conflictingName = Array.from(projectFiles.projids.entries()).find(
      ([name, id]) => id === projectId && name !== projectName
    )?.[0];
    if (conflictingName) {
      throw new Error(
        $t("TXT_CODE_storage_quota_project_id_conflict", {
          id: projectId,
          name: conflictingName
        })
      );
    }

    const conflictingPath = projectFiles.projects.get(projectId);
    if (conflictingPath && path.normalize(conflictingPath) !== normalizedWorkspace) {
      throw new Error(
        $t("TXT_CODE_storage_quota_project_path_conflict", {
          id: projectId,
          path: conflictingPath
        })
      );
    }

    if (existingPathId && existingPathId !== projectId) {
      throw new Error(
        $t("TXT_CODE_storage_quota_workspace_conflict", {
          path: normalizedWorkspace,
          id: existingPathId
        })
      );
    }

    return projectId;
  }

  #allocateProjectId(projectFiles: IProjectFiles) {
    const usedIds = new Set<number>([
      ...Array.from(projectFiles.projects.keys()),
      ...Array.from(projectFiles.projids.values())
    ]);
    let id = MIN_PROJECT_ID;
    while (usedIds.has(id)) id++;
    return id;
  }

  async #writeProjectFiles(
    projectFiles: IProjectFiles,
    projectName: string,
    projectId: number,
    workspace: string
  ) {
    try {
      await Promise.all([
        writeFileWithSudo(
          PROJID_PATH,
          this.#upsertLine(projectFiles.projidText, `${projectName}:${projectId}`, (line) => {
            const index = line.indexOf(":");
            return index !== -1 && line.slice(0, index) === projectName;
          })
        ),
        writeFileWithSudo(
          PROJECTS_PATH,
          this.#upsertLine(projectFiles.projectsText, `${projectId}:${path.normalize(workspace)}`, (line) => {
            const index = line.indexOf(":");
            return index !== -1 && Number(line.slice(0, index)) === projectId;
          })
        )
      ]);
    } catch (error: any) {
      throw new Error($t("TXT_CODE_storage_quota_project_file_write_failed", { error: error.message }));
    }
  }

  async #removeProjectFiles(projectFiles: IProjectFiles, projectName: string, projectId: number) {
    const removeLines = (text: string, shouldRemove: (line: string) => boolean) => {
      const lines = text.replace(/\r\n/g, "\n").split("\n");
      if (lines.length && lines[lines.length - 1] === "") lines.pop();
      const nextLines = lines.filter((line) => !shouldRemove(line.trim()));
      return nextLines.length ? `${nextLines.join("\n")}\n` : "";
    };

    try {
      await Promise.all([
        writeFileWithSudo(
          PROJID_PATH,
          removeLines(projectFiles.projidText, (line) => {
            const index = line.indexOf(":");
            return index !== -1 && line.slice(0, index) === projectName;
          })
        ),
        writeFileWithSudo(
          PROJECTS_PATH,
          removeLines(projectFiles.projectsText, (line) => {
            const index = line.indexOf(":");
            return index !== -1 && Number(line.slice(0, index)) === projectId;
          })
        )
      ]);
    } catch (error: any) {
      throw new Error($t("TXT_CODE_storage_quota_project_file_write_failed", { error: error.message }));
    }
  }

  #upsertLine(text: string, newLine: string, shouldReplace: (line: string) => boolean) {
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    if (lines.length && lines[lines.length - 1] === "") lines.pop();
    let replaced = false;
    const nextLines: string[] = [];
    for (const line of lines) {
      if (shouldReplace(line.trim())) {
        if (!replaced) nextLines.push(newLine);
        replaced = true;
      } else {
        nextLines.push(line);
      }
    }
    if (!replaced) nextLines.push(newLine);
    return `${nextLines.join("\n")}\n`;
  }
}

export default new StorageQuotaService();
