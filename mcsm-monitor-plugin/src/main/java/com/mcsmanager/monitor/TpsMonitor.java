package com.mcsmanager.monitor;

final class TpsMonitor {
    private static final long NANOS_PER_SECOND = 1000000000L;
    private static final long ONE_MINUTE_NANOS = 60L * NANOS_PER_SECOND;
    private static final long FIVE_MINUTES_NANOS = 5L * ONE_MINUTE_NANOS;
    private static final long FIFTEEN_MINUTES_NANOS = 15L * ONE_MINUTE_NANOS;
    private static final int MAX_TICK_SAMPLES = 20 * 15 * 60 + 1200;

    private final long[] tickTimesNanos = new long[MAX_TICK_SAMPLES];
    private int nextIndex = 0;
    private int sampleCount = 0;
    private boolean hasTick = false;
    private long firstTickAtNanos = 0L;

    synchronized void reset() {
        nextIndex = 0;
        sampleCount = 0;
        hasTick = false;
        firstTickAtNanos = 0L;
        for (int index = 0; index < tickTimesNanos.length; index++) {
            tickTimesNanos[index] = 0L;
        }
    }

    void recordTick() {
        recordTick(System.nanoTime());
    }

    synchronized void recordTick(long nowNanos) {
        if (!hasTick) {
            hasTick = true;
            firstTickAtNanos = nowNanos;
        }

        tickTimesNanos[nextIndex] = nowNanos;
        nextIndex = (nextIndex + 1) % tickTimesNanos.length;
        if (sampleCount < tickTimesNanos.length) {
            sampleCount++;
        }
    }

    double[] getSnapshot() {
        return getSnapshot(System.nanoTime());
    }

    synchronized double[] getSnapshot(long nowNanos) {
        return new double[]{
                calculateTps(nowNanos, ONE_MINUTE_NANOS),
                calculateTps(nowNanos, FIVE_MINUTES_NANOS),
                calculateTps(nowNanos, FIFTEEN_MINUTES_NANOS)
        };
    }

    private double calculateTps(long nowNanos, long windowNanos) {
        if (sampleCount == 0 || !hasTick) {
            return 0D;
        }

        long cutoffNanos = nowNanos - windowNanos;
        int ticks = 0;
        for (int index = 0; index < sampleCount; index++) {
            long tickAtNanos = tickTimesNanos[index];
            if (tickAtNanos >= cutoffNanos && tickAtNanos <= nowNanos) {
                ticks++;
            }
        }

        long startNanos = Math.max(firstTickAtNanos, cutoffNanos);
        long elapsedNanos = Math.max(NANOS_PER_SECOND, nowNanos - startNanos);
        double tps = ticks * (double) NANOS_PER_SECOND / elapsedNanos;
        if (tps < 0D) {
            return 0D;
        }
        return Math.min(20D, tps);
    }
}
