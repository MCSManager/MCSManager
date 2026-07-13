<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useWindrosePlus } from "@/hooks/useWindrosePlus";
import type { LayoutCard } from "@/types";
import { computed, ref } from "vue";

const props = defineProps<{ card: LayoutCard }>();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId") ?? "";
const daemonId = getMetaOrRouteValue("daemonId") ?? "";
const { instanceInfo, enabled: windrosePlusEnabled, isLoading: isSaving, confirmToggle: confirmToggleWindrosePlus } =
  useWindrosePlus(instanceId, daemonId);

const storageKey = `windrose-plus-panel:${daemonId}:${instanceId}`;
const dashboardUrl = ref(localStorage.getItem(storageKey) ?? "");
const activeUrl = ref(dashboardUrl.value);
const frameKey = ref(0);
const isHttps = window.location.protocol === "https:";
const isDocker = computed(() => instanceInfo.value?.config?.processType === "docker");

const dashboardPort = computed(() => {
  const ports = instanceInfo.value?.config?.docker?.ports ?? [];
  const mapping = ports.find((port: string) => port.endsWith(":8780/tcp"));
  if (!mapping) return "";
  return mapping.split(":").at(-2) ?? "";
});

const detectedUrl = computed(() => {
  if (isDocker.value) {
    if (!dashboardPort.value) return "";
    return `http://${window.location.hostname}:${dashboardPort.value}`;
  }
  if (isHttps) return "";
  return `http://${window.location.hostname}:8780`;
});

const isValidUrl = computed(() => {
  if (!dashboardUrl.value) return false;
  try {
    return ["http:", "https:"].includes(new URL(dashboardUrl.value).protocol);
  } catch {
    return false;
  }
});

const saveAndLoad = () => {
  if (!isValidUrl.value) return;
  const normalized = dashboardUrl.value.replace(/\/$/, "");
  dashboardUrl.value = normalized;
  activeUrl.value = normalized;
  localStorage.setItem(storageKey, normalized);
  frameKey.value += 1;
};

const useDetectedUrl = () => {
  if (!detectedUrl.value) return;
  dashboardUrl.value = detectedUrl.value;
  saveAndLoad();
};
</script>

<template>
  <CardPanel style="height: 100%">
    <template #body>
      <a-space direction="vertical" style="width: 100%" size="middle">
        <a-card size="small">
          <a-space style="width: 100%; justify-content: space-between">
            <a-space>
              <a-badge :status="windrosePlusEnabled ? 'success' : 'default'" />
              <strong>Windrose+ is {{ windrosePlusEnabled ? "installed" : "not installed" }}</strong>
            </a-space>
            <a-button
              :type="windrosePlusEnabled ? 'default' : 'primary'"
              :danger="windrosePlusEnabled"
              :loading="isSaving"
              @click="confirmToggleWindrosePlus"
            >
              {{ windrosePlusEnabled ? "Uninstall Windrose+" : "Install Windrose+" }}
            </a-button>
          </a-space>
          <div class="mt-2 color-gray">
            Uninstalling disables the add-on but preserves its configuration and Lua mods for later use.
          </div>
        </a-card>
        <a-alert
          v-if="!windrosePlusEnabled"
          type="info"
          show-icon
          message="Install Windrose+ to use the live map and web RCON dashboard."
        />
        <a-alert
          v-else-if="isDocker && !dashboardPort"
          type="warning"
          show-icon
          message="Windrose+ dashboard port is not exposed"
          description="Use the Windrose+ marketplace template or add a TCP mapping for container port 8780, then restart the instance."
        />
        <a-alert
          v-else-if="!isDocker && !activeUrl"
          type="info"
          show-icon
          message="Connect the native Windrose+ dashboard"
          description="The dashboard starts with the Windows server on port 8780. For remote HTTPS access, publish that port through your reverse proxy or Cloudflare Tunnel, then enter its HTTPS URL below."
        />
        <a-alert
          v-else-if="isHttps && (!activeUrl || activeUrl.startsWith('http:'))"
          type="info"
          show-icon
          message="HTTPS address required for embedding"
          description="Browsers block an HTTP dashboard inside an HTTPS MCSManager page. Put the dashboard behind an HTTPS reverse proxy or Cloudflare Tunnel, then enter that public URL below."
        />

        <a-input-group v-if="windrosePlusEnabled" compact style="display: flex">
          <a-input
            v-model:value="dashboardUrl"
            placeholder="https://windrose-plus.example.com"
            style="flex: 1"
            @press-enter="saveAndLoad"
          />
          <a-button v-if="detectedUrl" @click="useDetectedUrl">Use detected local URL</a-button>
          <a-button type="primary" :disabled="!isValidUrl" @click="saveAndLoad">
            Save and load
          </a-button>
          <a-button v-if="activeUrl" :href="activeUrl" target="_blank">Open externally</a-button>
        </a-input-group>

        <a-alert
          v-if="windrosePlusEnabled && dashboardUrl && !isValidUrl"
          type="error"
          show-icon
          message="Enter a valid HTTP or HTTPS dashboard URL."
        />

        <iframe
          v-if="windrosePlusEnabled && activeUrl"
          :key="frameKey"
          :src="activeUrl"
          title="Windrose+ web panel"
          allow="clipboard-read; clipboard-write"
          style="width: 100%; height: 75vh; border: 0; border-radius: 6px"
        />
        <a-empty
          v-else-if="windrosePlusEnabled"
          description="Enter the Windrose+ dashboard URL to embed it here."
        />
      </a-space>
    </template>
  </CardPanel>
</template>
