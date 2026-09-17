import { DecryptedClipboardItem } from '../types';

export interface SyncLogEvent {
  id: string;
  timestamp: number;
  direction: 'inbound' | 'outbound';
  senderName?: string;
  latencyMs?: number;
}

export interface HourlyBucket {
  hourIndex: number;
  timeLabel: string;
  count: number;
  inboundCount: number;
  outboundCount: number;
  isCurrent: boolean;
  timestamp: number;
}

export interface TelemetrySummary {
  total24h: number;
  peakHour: string;
  peakCount: number;
  avgLatencyMs: number;
  hourlyData: HourlyBucket[];
  recentCadencePerMin: number;
}

const STORAGE_KEY = 'clipsync_telemetry_v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

class AnalyticsService {
  private events: SyncLogEvent[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SyncLogEvent[] = JSON.parse(raw);
        const cutoff = Date.now() - MAX_AGE_MS;
        this.events = parsed.filter((e) => e.timestamp >= cutoff);
      }
    } catch {
      this.events = [];
    }
  }

  private saveToStorage(): void {
    try {
      const cutoff = Date.now() - MAX_AGE_MS;
      this.events = this.events.filter((e) => e.timestamp >= cutoff);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch {
      // Storage full or unavailable
    }
  }

  public recordSync(direction: 'inbound' | 'outbound', senderName?: string, latencyMs?: number): void {
    const event: SyncLogEvent = {
      id: Math.random().toString(36).slice(2, 9),
      timestamp: Date.now(),
      direction,
      senderName,
      latencyMs,
    };
    this.events.push(event);
    this.saveToStorage();
  }

  /**
   * Generates 24 hourly buckets for the past 24 hours combining
   * both explicitly logged sync events and known item timestamps.
   */
  public get24HourTelemetry(items: DecryptedClipboardItem[]): TelemetrySummary {
    const now = Date.now();
    const cutoff = now - MAX_AGE_MS;

    // Combine logged events with item timestamps (deduplicating by timestamp proximity if needed)
    const allTimestamps: { timestamp: number; direction: 'inbound' | 'outbound'; latency?: number }[] = [];

    // From event logs
    for (const ev of this.events) {
      if (ev.timestamp >= cutoff) {
        allTimestamps.push({
          timestamp: ev.timestamp,
          direction: ev.direction,
          latency: ev.latencyMs,
        });
      }
    }

    // From items (if item timestamp is within 24h and not already closely recorded)
    for (const it of items) {
      if (it.timestamp >= cutoff) {
        const alreadyCounted = allTimestamps.some(
          (t) => Math.abs(t.timestamp - it.timestamp) < 2000
        );
        if (!alreadyCounted) {
          allTimestamps.push({
            timestamp: it.timestamp,
            direction: it.isLocalOnly ? 'outbound' : 'inbound',
          });
        }
      }
    }

    // Prepare 24 buckets of 1 hour each, starting 23 hours ago up to the current hour
    const buckets: HourlyBucket[] = [];
    const oneHourMs = 60 * 60 * 1000;
    const currentHourStart = Math.floor(now / oneHourMs) * oneHourMs;

    for (let i = 23; i >= 0; i--) {
      const bucketStart = currentHourStart - i * oneHourMs;
      const bucketEnd = bucketStart + oneHourMs;
      const date = new Date(bucketStart);
      const hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
      const timeLabel = `${formattedHour}${ampm}`;

      const matchingEvents = allTimestamps.filter(
        (t) => t.timestamp >= bucketStart && t.timestamp < bucketEnd
      );

      const inboundCount = matchingEvents.filter((e) => e.direction === 'inbound').length;
      const outboundCount = matchingEvents.filter((e) => e.direction === 'outbound').length;

      buckets.push({
        hourIndex: 23 - i,
        timeLabel,
        count: matchingEvents.length,
        inboundCount,
        outboundCount,
        isCurrent: i === 0,
        timestamp: bucketStart,
      });
    }

    const total24h = allTimestamps.length;

    let peakCount = 0;
    let peakHour = 'N/A';
    for (const b of buckets) {
      if (b.count >= peakCount) {
        peakCount = b.count;
        peakHour = b.timeLabel;
      }
    }

    // Latency calculation
    const latencies = allTimestamps
      .map((t) => t.latency)
      .filter((l): l is number => typeof l === 'number' && l > 0);
    const avgLatencyMs = latencies.length
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 18;

    // Recent cadence (events in last 10 minutes)
    const tenMinsAgo = now - 10 * 60 * 1000;
    const recentEvents = allTimestamps.filter((t) => t.timestamp >= tenMinsAgo);
    const recentCadencePerMin = Number((recentEvents.length / 10).toFixed(1));

    return {
      total24h,
      peakHour,
      peakCount,
      avgLatencyMs,
      hourlyData: buckets,
      recentCadencePerMin,
    };
  }
}

export const analyticsService = new AnalyticsService();
