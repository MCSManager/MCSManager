<script setup lang="ts">
import { io, type Socket } from "socket.io-client";
import { onMounted, onUnmounted, ref } from "vue";
import { message } from "ant-design-vue";

interface Alert {
  id: string;
  type: "instance_offline" | "plugin_offline" | "tps_low" | "abnormal_stop";
  instanceName: string;
  instanceUuid: string;
  daemonId: string;
  message: string;
  timestamp: number;
}

const socket = ref<Socket | null>(null);
const isConnected = ref(false);

function getAlertTypeName(type: Alert["type"]): string {
  switch (type) {
    case "instance_offline":
      return "Instance Offline";
    case "plugin_offline":
      return "Plugin Offline";
    case "tps_low":
      return "TPS Low";
    case "abnormal_stop":
      return "Abnormal Stop";
    default:
      return "Alert";
  }
}

function showNotification(alert: Alert): void {
  const typeName = getAlertTypeName(alert.type);
  message.warning({
    content: `[${typeName}] ${alert.message}`,
    duration: 10,
    style: {
      marginTop: "60px"
    }
  });
}

function connectSocket(): void {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;

  socket.value = io(`${protocol}//${host}`, {
    path: "/socket.io",
    multiplex: false,
    reconnectionDelayMax: 10000,
    timeout: 30000,
    reconnection: true,
    reconnectionAttempts: 5,
    rejectUnauthorized: false
  });

  socket.value.on("connect", () => {
    isConnected.value = true;
    socket.value?.emit("subscribe_alerts");
  });

  socket.value.on("disconnect", () => {
    isConnected.value = false;
  });

  socket.value.on("alert", (alert: Alert) => {
    showNotification(alert);
  });

  socket.value.on("connect_error", () => {
    isConnected.value = false;
  });
}

function disconnectSocket(): void {
  if (socket.value) {
    socket.value.emit("unsubscribe_alerts");
    socket.value.disconnect();
    socket.value = null;
    isConnected.value = false;
  }
}

onMounted(() => {
  connectSocket();
});

onUnmounted(() => {
  disconnectSocket();
});
</script>

<template>
  <div />
</template>
