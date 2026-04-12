package com.mcsmanager.monitor;

import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;

public final class MinecraftMonitorPlugin extends JavaPlugin {
    private volatile long lastMainThreadTickAt = System.currentTimeMillis();
    private HeartbeatReporter heartbeatReporter;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        startMainThreadProbe();
        heartbeatReporter = new HeartbeatReporter(this);
        heartbeatReporter.start();
        getLogger().info("MCSM monitor plugin enabled.");
    }

    @Override
    public void onDisable() {
        if (heartbeatReporter != null) {
            heartbeatReporter.stop();
            heartbeatReporter = null;
        }
    }

    public boolean isMainThreadBlocked() {
        long threshold = Math.max(500L, getConfig().getLong("mainThreadBlockedThresholdMs", 3000L));
        return System.currentTimeMillis() - lastMainThreadTickAt > threshold;
    }

    private void startMainThreadProbe() {
        Bukkit.getScheduler().runTaskTimer(this, new Runnable() {
            @Override
            public void run() {
                lastMainThreadTickAt = System.currentTimeMillis();
            }
        }, 1L, 1L);
    }
}
