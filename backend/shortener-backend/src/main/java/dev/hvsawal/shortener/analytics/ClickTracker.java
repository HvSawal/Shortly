package dev.hvsawal.shortener.analytics;

public interface ClickTracker {
    void record(long id);
}