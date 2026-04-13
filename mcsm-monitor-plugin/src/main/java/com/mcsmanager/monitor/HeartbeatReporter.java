package com.mcsmanager.monitor;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.scheduler.BukkitTask;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;

public final class HeartbeatReporter {
    private final MinecraftMonitorPlugin plugin;
    private BukkitTask task;
    private boolean invalidConfigWarned = false;

    public HeartbeatReporter(MinecraftMonitorPlugin plugin) {
        this.plugin = plugin;
    }

    public void start() {
        long interval = Math.max(20L, plugin.getConfig().getLong("heartbeatIntervalTicks", 100L));
        task = Bukkit.getScheduler().runTaskTimerAsynchronously(plugin, new Runnable() {
            @Override
            public void run() {
                sendHeartbeat();
            }
        }, interval, interval);
    }

    public void stop() {
        if (task != null) {
            task.cancel();
            task = null;
        }
    }

    private void sendHeartbeat() {
        FileConfiguration config = plugin.getConfig();
        String agentUrl = trimTrailingSlash(config.getString("agentUrl", ""));
        String serverId = safeTrim(config.getString("serverId", ""));
        String instanceToken = safeTrim(config.getString("instanceToken", ""));

        if (agentUrl.isEmpty() || serverId.isEmpty() || instanceToken.isEmpty()) {
            if (isFailureLogEnabled(config) && !invalidConfigWarned) {
                invalidConfigWarned = true;
                plugin.getLogger().warning("Missing agentUrl/serverId/instanceToken, heartbeat reporter is idle.");
            }
            return;
        }

        invalidConfigWarned = false;

        HttpURLConnection connection = null;
        try {
            URL url = new URL(agentUrl + "/v1/plugin/heartbeat");
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setConnectTimeout(config.getInt("connectTimeoutMs", 3000));
            connection.setReadTimeout(config.getInt("readTimeoutMs", 3000));
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");

            byte[] body = buildHeartbeatPayload(serverId, instanceToken).getBytes(StandardCharsets.UTF_8);
            OutputStream outputStream = connection.getOutputStream();
            outputStream.write(body);
            outputStream.flush();
            outputStream.close();

            int statusCode = connection.getResponseCode();
            if (statusCode < 200 || statusCode >= 300) {
                if (isFailureLogEnabled(config)) {
                    plugin.getLogger().warning("Heartbeat failed, HTTP " + statusCode + ": " + readBody(connection));
                }
            }
        } catch (Exception exception) {
            if (isFailureLogEnabled(config)) {
                plugin.getLogger().warning("Heartbeat error: " + exception.getMessage());
            }
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private boolean isFailureLogEnabled(FileConfiguration config) {
        return config.getBoolean("logHeartbeatFailures", true);
    }

    private String buildHeartbeatPayload(String serverId, String instanceToken) {
        double[] tps = getTps();
        StringBuilder worlds = new StringBuilder();
        List<World> worldList = Bukkit.getWorlds();
        for (int index = 0; index < worldList.size(); index++) {
            if (index > 0) {
                worlds.append(",");
            }
            worlds.append("\"").append(escapeJson(worldList.get(index).getName())).append("\"");
        }

        return "{"
                + "\"serverId\":\"" + escapeJson(serverId) + "\","
                + "\"instanceToken\":\"" + escapeJson(instanceToken) + "\","
                + "\"timestamp\":" + System.currentTimeMillis() + ","
                + "\"tps\":{"
                + "\"oneMin\":" + toJsonNumber(tps[0]) + ","
                + "\"fiveMin\":" + toJsonNumber(tps[1]) + ","
                + "\"fifteenMin\":" + toJsonNumber(tps[2])
                + "},"
                + "\"onlinePlayers\":" + Bukkit.getOnlinePlayers().size() + ","
                + "\"maxPlayers\":" + Bukkit.getMaxPlayers() + ","
                + "\"worlds\":[" + worlds + "],"
                + "\"pluginVersion\":\"" + escapeJson(plugin.getDescription().getVersion()) + "\","
                + "\"serverVersion\":\"" + escapeJson(Bukkit.getVersion()) + "\","
                + "\"motd\":\"" + escapeJson(Bukkit.getMotd()) + "\","
                + "\"mainThreadBlocked\":" + plugin.isMainThreadBlocked()
                + "}";
    }

    private double[] getTps() {
        return plugin.getCalculatedTps();
    }

    private String readBody(HttpURLConnection connection) {
        try {
            InputStream stream = connection.getErrorStream() != null ? connection.getErrorStream() : connection.getInputStream();
            if (stream == null) {
                return "";
            }
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[512];
            int len;
            while ((len = stream.read(buffer)) != -1) {
                output.write(buffer, 0, len);
            }
            stream.close();
            return new String(output.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException ignored) {
            return "";
        }
    }

    private String trimTrailingSlash(String input) {
        String value = safeTrim(input);
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private String safeTrim(String input) {
        return input == null ? "" : input.trim();
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }

    private String toJsonNumber(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) {
            return "0";
        }
        return String.format(java.util.Locale.US, "%.2f", value);
    }
}
