/**
 * Background Clipboard Watcher & Auto-Sync Engine
 * Monitors device clipboard mutations and auto-broadcasts them
 * while preventing sync feedback loops.
 */

import { syncManager } from './syncManager';
import { readFromClipboard } from './clipboard';

class ClipboardWatcher {
  private isWatching = false;
  private pollTimer: number | null = null;
  private lastKnownHash: string = '';
  private ignoredHashes: Set<string> = new Set();
  private hasPermission: boolean | null = null;

  // Simple string hash for fast comparison
  private computeHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `${hash}_${str.length}`;
  }

  /**
   * Registers a hash as received from a remote peer to prevent echo loops
   */
  public markAsRemotelyReceived(content: string): void {
    const hash = this.computeHash(content);
    this.ignoredHashes.add(hash);
    this.lastKnownHash = hash;

    // Prune old ignored hashes to prevent memory buildup
    if (this.ignoredHashes.size > 200) {
      const arr = Array.from(this.ignoredHashes);
      this.ignoredHashes = new Set(arr.slice(arr.length - 50));
    }
  }

  /**
   * Starts monitoring local clipboard
   */
  public start(): void {
    if (this.isWatching) return;
    this.isWatching = true;

    // 1. Listen for browser native copy/cut events
    window.addEventListener('copy', this.handleNativeCopy);
    window.addEventListener('cut', this.handleNativeCopy);

    // 2. Listen for window focus (user switches back from another app where they copied)
    window.addEventListener('focus', this.handleWindowFocus);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // 3. Periodic poll when document has active focus
    this.startPolling();
  }

  /**
   * Stops monitoring
   */
  public stop(): void {
    this.isWatching = false;
    window.removeEventListener('copy', this.handleNativeCopy);
    window.removeEventListener('cut', this.handleNativeCopy);
    window.removeEventListener('focus', this.handleWindowFocus);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private handleNativeCopy = () => {
    // Delay slightly to let clipboard update
    setTimeout(() => {
      this.checkAndBroadcastClipboard();
    }, 80);
  };

  private handleWindowFocus = () => {
    this.checkAndBroadcastClipboard();
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.checkAndBroadcastClipboard();
    }
  };

  private startPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    // Poll every 1.5 seconds when tab is active and visible
    this.pollTimer = window.setInterval(() => {
      if (document.hasFocus() && document.visibilityState === 'visible') {
        this.checkAndBroadcastClipboard();
      }
    }, 1500);
  }

  /**
   * Checks current clipboard; if new content found, encrypts and broadcasts
   */
  public async checkAndBroadcastClipboard(): Promise<boolean> {
    try {
      const text = await readFromClipboard(true);
      if (!text || !text.trim()) return false;

      const hash = this.computeHash(text);

      // If it matches last known hash or was an incoming item from another peer, skip
      if (hash === this.lastKnownHash || this.ignoredHashes.has(hash)) {
        return false;
      }

      this.lastKnownHash = hash;
      // Broadcast to all paired devices
      await syncManager.pushItem(text);
      return true;
    } catch {
      return false;
    }
  }

  public getIsWatching(): boolean {
    return this.isWatching;
  }
}

export const clipboardWatcher = new ClipboardWatcher();
