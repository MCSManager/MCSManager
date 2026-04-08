import fs from "fs";
import path from "path";
import { ProcessConfig } from "../entity/instance/process_config";

export interface IMCDRRuntime {
    mcdrType: string;
    mcdrRoot: string;
}

interface IMCDRResolvable {
    config: { type: string };
    absoluteCwdPath(): string;
}

const MCDR_HANDLER_TYPE_MAP: Record<string, string> = {
    vanilla_handler: "minecraft/java",
    beta18_handler: "minecraft/java",
    bukkit_handler: "minecraft/java/bukkit",
    bukkit14_handler: "minecraft/java/bukkit",
    bungeecord_handler: "minecraft/java/bungeecord",
    cat_server_handler: "minecraft/java/forge",
    arclight_handler: "minecraft/java/forge",
    forge_handler: "minecraft/java/forge",
    fabric_handler: "minecraft/java/fabric",
    velocity_handler: "minecraft/java/velocity",
    waterfall_handler: "minecraft/java/bungeecord",
};

const MCDR_CONFIG_FILES = ["config.yml", "config.yaml"];

const cache = new Map<string, { mtime: number; result: IMCDRRuntime | null }>();
const MAX_CACHE_SIZE = 256;

function setCache(filePath: string, mtime: number, result: IMCDRRuntime | null) {
    cache.delete(filePath);
    cache.set(filePath, { mtime, result });
    const oldestKey = cache.size > MAX_CACHE_SIZE ? cache.keys().next().value : undefined;
    if (oldestKey) cache.delete(oldestKey);
}

export function resolveMCDRRuntime(instance: IMCDRResolvable): IMCDRRuntime | null {
    if (instance.config.type !== "universal/mcdr") return null;

    const instanceRoot = instance.absoluteCwdPath();

    for (const fileName of MCDR_CONFIG_FILES) {
        const filePath = path.join(instanceRoot, fileName);
        if (!fs.existsSync(filePath)) {
            cache.delete(filePath);
            continue;
        }

        try {
            const stat = fs.statSync(filePath);
            const mtime = stat.mtimeMs;
            const cached = cache.get(filePath);
            if (cached && cached.mtime === mtime) return cached.result;

            const processConfig = new ProcessConfig({
                fileName,
                redirect: fileName,
                path: filePath,
                type: "yml",
                info: null,
                fromLink: null
            });
            const config = processConfig.read();
            const handler = typeof config?.handler === "string" ? config.handler.trim().toLowerCase() : "";
            const workingDirectory =
                typeof config?.working_directory === "string" ? config.working_directory.trim() : "";
            const resolvedType = MCDR_HANDLER_TYPE_MAP[handler];

            if (!resolvedType || !workingDirectory) continue;

            const resolvedRoot = path.isAbsolute(workingDirectory)
                ? path.normalize(workingDirectory)
                : path.normalize(path.join(instanceRoot, workingDirectory));

            const relative = path.relative(instanceRoot, resolvedRoot);
            if (relative.startsWith("..") || path.isAbsolute(relative)) {
                setCache(filePath, mtime, null);
                return null;
            }

            const result: IMCDRRuntime = {
                mcdrType: resolvedType,
                mcdrRoot: resolvedRoot
            };
            setCache(filePath, mtime, result);
            return result;
        } catch (error) {
            continue;
        }
    }

    return null;
}
