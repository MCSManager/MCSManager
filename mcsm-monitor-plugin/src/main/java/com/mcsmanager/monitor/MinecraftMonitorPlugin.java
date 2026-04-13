package com.mcsmanager.monitor;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

public final class MinecraftMonitorPlugin extends JavaPlugin {
    private volatile long lastMainThreadTickAt = System.currentTimeMillis();
    private final TpsMonitor tpsMonitor = new TpsMonitor();
    private BukkitTask mainThreadProbeTask;
    private HeartbeatReporter heartbeatReporter;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        tpsMonitor.reset();
        startMainThreadProbe();
        startHeartbeatReporter();
        getLogger().info("MCSM monitor plugin enabled.");
    }

    @Override
    public void onDisable() {
        if (mainThreadProbeTask != null) {
            mainThreadProbeTask.cancel();
            mainThreadProbeTask = null;
        }
        if (heartbeatReporter != null) {
            heartbeatReporter.stop();
            heartbeatReporter = null;
        }
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!command.getName().equalsIgnoreCase("mcsmmonitor")) {
            return false;
        }

        if (args.length == 1 && args[0].equalsIgnoreCase("reload")) {
            if (!sender.hasPermission("mcsmmonitor.reload")) {
                sender.sendMessage("You do not have permission to reload MCSMMonitor.");
                return true;
            }
            reloadConfig();
            startHeartbeatReporter();
            sender.sendMessage("MCSMMonitor config reloaded.");
            return true;
        }

        sender.sendMessage("Usage: /" + label + " reload");
        return true;
    }

    public boolean isMainThreadBlocked() {
        long threshold = Math.max(500L, getConfig().getLong("mainThreadBlockedThresholdMs", 3000L));
        return System.currentTimeMillis() - lastMainThreadTickAt > threshold;
    }

    public double[] getCalculatedTps() {
        return tpsMonitor.getSnapshot();
    }

    private void startMainThreadProbe() {
        if (mainThreadProbeTask != null) {
            mainThreadProbeTask.cancel();
        }
        mainThreadProbeTask = Bukkit.getScheduler().runTaskTimer(this, new Runnable() {
            @Override
            public void run() {
                lastMainThreadTickAt = System.currentTimeMillis();
                tpsMonitor.recordTick();
            }
        }, 1L, 1L);
    }

    private void startHeartbeatReporter() {
        if (heartbeatReporter != null) {
            heartbeatReporter.stop();
        }
        heartbeatReporter = new HeartbeatReporter(this);
        heartbeatReporter.start();
    }
}
