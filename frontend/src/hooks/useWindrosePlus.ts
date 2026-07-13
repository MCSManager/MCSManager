import managedScript from "@/assets/scripts/StartWindrosePlusManaged.ps1?raw";
import { useInstanceInfo } from "@/hooks/useInstance";
import {
  restartInstance,
  stopInstance,
  updateInstance,
  updateInstanceConfig
} from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import { Modal, message } from "ant-design-vue";
import { computed } from "vue";

const MANAGED_SCRIPT_BASE64 = btoa(managedScript);
const NATIVE_START_COMMAND =
  "powershell.exe -NoProfile -ExecutionPolicy Bypass -File StartWindrosePlusManaged.ps1";
const VANILLA_START_COMMAND = "R5\\Binaries\\Win64\\WindroseServer-Win64-Shipping.exe -log";
const STEAM_UPDATE_COMMAND =
  '"{mcsm_steamcmd}" +force_install_dir "{mcsm_workspace}" +login anonymous +app_update 4129620 validate +quit';
const INSTALL_COMMAND = `${STEAM_UPDATE_COMMAND} && powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; $release=Invoke-RestMethod -Uri 'https://api.github.com/repos/humangenome/WindrosePlus/releases/latest'; $asset=$release.assets | Where-Object { $_.name -eq 'WindrosePlus.zip' } | Select-Object -First 1; if(-not $asset){ throw 'WindrosePlus.zip was not found in the latest release.' }; $zip=Join-Path $env:TEMP ('WindrosePlus-'+[guid]::NewGuid().ToString('N')+'.zip'); try { Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zip -UseBasicParsing; $expected=([string]$asset.digest).Replace('sha256:','').ToLowerInvariant(); if($expected){ $actual=(Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant(); if($actual -ne $expected){ throw ('WindrosePlus.zip SHA-256 mismatch: '+$actual) } }; Expand-Archive -LiteralPath $zip -DestinationPath (Get-Location).Path -Force; & (Join-Path (Get-Location).Path 'install.ps1') -GameDir (Get-Location).Path; if($LASTEXITCODE -ne 0){ throw ('Windrose+ installer exited with code '+$LASTEXITCODE) }; $managed=[Convert]::FromBase64String('${MANAGED_SCRIPT_BASE64}'); [IO.File]::WriteAllBytes((Join-Path (Get-Location).Path 'StartWindrosePlusManaged.ps1'),$managed) } finally { Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue }"`;
const UNINSTALL_COMMAND = `${STEAM_UPDATE_COMMAND} && powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $game=(Get-Location).Path; $win64=Join-Path $game 'R5\\Binaries\\Win64'; $proxy=Join-Path $win64 'dwmapi.dll'; $disabled=Join-Path $win64 'dwmapi.windroseplus.disabled'; if(Test-Path -LiteralPath $proxy){ Move-Item -LiteralPath $proxy -Destination $disabled -Force }; @('WindrosePlus_Multipliers_P.pak','WindrosePlus_CurveTables_P.pak') | ForEach-Object { Remove-Item -LiteralPath (Join-Path $game ('R5\\Content\\Paks\\'+$_)) -Force -ErrorAction SilentlyContinue }; Remove-Item -LiteralPath (Join-Path $game 'windrose_plus_data\\.windroseplus_build.hash') -Force -ErrorAction SilentlyContinue; Remove-Item -LiteralPath (Join-Path $game 'StartWindrosePlusManaged.ps1') -Force -ErrorAction SilentlyContinue; Write-Host 'Windrose+ disabled. Configuration, data, and mods were preserved.'"`;

export function useWindrosePlus(instanceId: string, daemonId: string) {
  const { instanceInfo, isRunning, execute: refreshInstance } = useInstanceInfo({
    instanceId,
    daemonId,
    autoRefresh: true
  });
  const isDocker = computed(() => instanceInfo.value?.config?.processType === "docker");
  const enabled = computed(() => {
    const config = instanceInfo.value?.config;
    if (config?.processType === "docker") {
      return (config.docker?.env ?? []).some(
        (value: string) => value.toLowerCase() === "windrose_plus_enabled=true"
      );
    }
    const startCommand = (config?.startCommand ?? "").toLowerCase();
    return (
      startCommand.includes("startwindroseplusserver.bat") ||
      startCommand.includes("startwindroseplusmanaged.ps1")
    );
  });
  const { execute: saveInstance, isLoading } = updateInstanceConfig();

  const setDockerEnabled = async (nextEnabled: boolean) => {
    const config = instanceInfo.value?.config;
    if (!config) return;
    const env = (config.docker?.env ?? []).filter(
      (value: string) => !value.startsWith("WINDROSE_PLUS_ENABLED=")
    );
    env.push(`WINDROSE_PLUS_ENABLED=${nextEnabled}`);
    await saveInstance({
      params: { uuid: instanceId, daemonId },
      data: {
        processType: config.processType,
        startCommand: config.startCommand,
        updateCommand: config.updateCommand,
        docker: { env }
      }
    });
    if (isRunning.value) {
      await restartInstance().execute({ params: { uuid: instanceId, daemonId } });
    }
  };

  const setNativeEnabled = async (nextEnabled: boolean) => {
    if (isRunning.value) {
      await stopInstance().execute({ params: { uuid: instanceId, daemonId } });
    }
    await saveInstance({
      params: { uuid: instanceId, daemonId },
      data: {
        processType: "general",
        startCommand: nextEnabled ? NATIVE_START_COMMAND : VANILLA_START_COMMAND,
        updateCommand: nextEnabled ? INSTALL_COMMAND : UNINSTALL_COMMAND,
        terminalOption: { haveColor: false, pty: false }
      }
    });
    await updateInstance().execute({
      params: { uuid: instanceId, daemonId, task_name: "update" },
      data: { time: Date.now() }
    });
  };

  const setEnabled = async (nextEnabled: boolean) => {
    try {
      if (isDocker.value) await setDockerEnabled(nextEnabled);
      else await setNativeEnabled(nextEnabled);
      await refreshInstance({
        params: { uuid: instanceId, daemonId },
        forceRequest: true
      });
      message.success(
        isDocker.value
          ? nextEnabled
            ? "Windrose+ enabled. Its files will be installed during startup."
            : "Windrose+ disabled. Existing configuration and mods were preserved."
          : nextEnabled
            ? "Windrose+ installation started. Follow its progress in the terminal."
            : "Windrose+ disable task started. Configuration, data, and mods will be preserved."
      );
    } catch (error: any) {
      reportErrorMsg(error?.message ?? error);
      throw error;
    }
  };

  const confirmToggle = () => {
    const installing = !enabled.value;
    Modal.confirm({
      title: installing ? "Install Windrose+?" : "Uninstall Windrose+?",
      content: isDocker.value
        ? isRunning.value
          ? "The server will restart to apply this change. Existing worlds are preserved."
          : "This change will be applied the next time the server starts. Existing worlds are preserved."
        : isRunning.value
          ? "The server will stop, then Windrose+ will be installed or disabled. Existing worlds and Windrose+ user data are preserved."
          : "Windrose+ will be installed or disabled through the instance update task. Existing worlds and Windrose+ user data are preserved.",
      okText: installing ? "Install Windrose+" : "Uninstall Windrose+",
      okType: installing ? "primary" : "danger",
      onOk: () => setEnabled(installing)
    });
  };

  return { enabled, isLoading, instanceInfo, confirmToggle };
}
