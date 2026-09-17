import mqtt, { MqttClient } from 'mqtt';
import {
  DecryptedClipboardItem,
  EncryptedClipboardItem,
  Device,
  ConnectionStatus,
  RoomConfig,
  HapticSettings,
} from '../types';
import { encryptData, decryptData } from './crypto';
import {
  saveLocalItem,
  getLocalItems,
  deleteLocalItem,
  clearLocalItems,
  queuePendingSync,
  getPendingSyncQueue,
  removePendingSync,
  saveConfig,
} from './storage';
import {
  copyToClipboard,
  detectContentType,
  playTactileTick,
  DEFAULT_HAPTIC_SETTINGS,
  getActiveHapticSettings,
  setActiveHapticSettings,
} from './clipboard';
import { clipboardWatcher } from './clipboardWatcher';
import { analyticsService } from './analytics';

export interface IncomingSyncEvent {
  item: DecryptedClipboardItem;
  latencyMs: number;
  autoCopied: boolean;
  receivedAt: number;
}

type Listener = () => void;

class SyncManager {
  private ws: WebSocket | null = null;
  private mqttClient: MqttClient | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private mqttBrokerIndex: number = 0;
  private listeners: Set<Listener> = new Set();

  public status: ConnectionStatus = 'disconnected';
  public roomCode: string = '';
  public secretKey: string = '';
  public currentDevice: Device = {
    id: '',
    name: '',
    type: 'desktop',
    joinedAt: Date.now(),
    lastSeen: Date.now(),
    isCurrentDevice: true,
  };
  public devices: Device[] = [];
  public items: DecryptedClipboardItem[] = [];
  public pendingCount: number = 0;
  public autoCopyIncoming: boolean = true; // Default to true for instant paste availability!
  public liveClipboardWatch: boolean = false;
  public hapticFeedback: boolean = true;
  public hapticSettings: HapticSettings = { ...DEFAULT_HAPTIC_SETTINGS };
  public latestSyncEvent: IncomingSyncEvent | null = null;
  public latestDeviceEvent: { type: 'joined' | 'left'; device: Device } | null = null;

  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private isOffline = !navigator.onLine;

  constructor() {
    // Monitor online/offline state
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.handleNetworkOnline();
    });
    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.status = 'offline';
      this.notify();
    });

    window.addEventListener('beforeunload', () => {
      this.transmitMessage({
        type: 'device:left',
        deviceId: this.currentDevice.id,
      });
    });
  }

  public subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  public isConnected(): boolean {
    const wsConnected = !!(this.ws && this.ws.readyState === WebSocket.OPEN);
    const mqttConnected = !!(this.mqttClient && this.mqttClient.connected);
    return wsConnected || mqttConnected;
  }

  private isServerlessStaticHost(): boolean {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname;
    return (
      h.endsWith('.vercel.app') ||
      h.includes('netlify') ||
      h.endsWith('.pages.dev') ||
      h.endsWith('.github.io')
    );
  }

  /**
   * Initializes or connects to a sync room
   */
  public async init(config: RoomConfig & { liveClipboardWatch?: boolean }): Promise<void> {
    const previousRoom = this.roomCode;
    this.roomCode = config.roomCode.trim().toUpperCase();
    this.secretKey = config.secretKey;
    this.autoCopyIncoming = config.autoCopyIncoming !== false; // Default true for instant cross-device copy & paste
    this.liveClipboardWatch = !!config.liveClipboardWatch;
    this.hapticFeedback = config.hapticFeedback !== false;
    this.hapticSettings = {
      ...DEFAULT_HAPTIC_SETTINGS,
      ...(config.hapticSettings || {}),
      enabled: this.hapticFeedback,
    };
    setActiveHapticSettings(this.hapticSettings);

    this.currentDevice = {
      id: config.deviceId,
      name: config.deviceName,
      type: 'desktop',
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      isCurrentDevice: true,
    };

    saveConfig({
      roomCode: this.roomCode,
      secretKey: this.secretKey,
      deviceName: config.deviceName,
      deviceId: config.deviceId,
      autoCopyIncoming: this.autoCopyIncoming,
      hapticFeedback: this.hapticFeedback,
      hapticSettings: this.hapticSettings,
    });

    if (this.liveClipboardWatch) {
      clipboardWatcher.start();
    } else {
      clipboardWatcher.stop();
    }

    const roomChanged = previousRoom && previousRoom !== this.roomCode;
    if (roomChanged) {
      this.items = [];
      this.devices = [this.currentDevice];
      this.notify();
    } else if (this.devices.length === 0) {
      this.devices = [this.currentDevice];
    }

    // Setup inter-tab synchronization
    this.setupBroadcastChannel();

    // 1. Load local cached items first (offline-first!)
    const local = await getLocalItems();
    this.items = local;
    const pending = await getPendingSyncQueue();
    this.pendingCount = pending.length;
    this.notify();

    // 2. Multi-Transport Connection Selection
    if (this.isServerlessStaticHost()) {
      // Vercel / Netlify / Static hosting: Connect directly to zero-knowledge MQTT cloud mesh!
      // This eliminates 404 / connection failed errors to /ws on Vercel
      this.connectMqttMesh();
    } else {
      // Container / VPS / Cloud Run / Localhost: Try dedicated WebSocket server
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.transmitMessage({
          type: 'join-room',
          deviceId: this.currentDevice.id,
          deviceName: this.currentDevice.name,
          deviceType: this.currentDevice.type,
        });
      } else {
        this.connectWebSocket();
      }
    }
  }

  private setupBroadcastChannel(): void {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {
        // ignore
      }
      this.broadcastChannel = null;
    }
    try {
      this.broadcastChannel = new BroadcastChannel(`clipsync_${this.roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.senderId !== this.currentDevice.id) {
          this.handleSocketMessage(event.data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }

  private connectWebSocket(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (!navigator.onLine) {
      this.status = 'offline';
      this.notify();
      return;
    }

    this.status = 'connecting';
    this.notify();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.notify();

        // Join room with zero-knowledge ID
        this.ws?.send(
          JSON.stringify({
            type: 'join-room',
            roomCode: this.roomCode,
            deviceId: this.currentDevice.id,
            deviceName: this.currentDevice.name,
            deviceType: this.currentDevice.type,
          })
        );

        this.startHeartbeat();
        this.flushPendingQueue();
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          await this.handleSocketMessage(data);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.ws = null;
        if (this.status !== 'offline') {
          this.status = 'disconnected';
          this.notify();
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Local WS unavailable; activating zero-knowledge cloud mesh:', err);
        // Seamless fallback to cloud mesh on hosts where local WS is not available
        this.connectMqttMesh();
        this.fallbackRestSync();
      };
    } catch (e) {
      console.warn('WS connect failed, activating cloud mesh:', e);
      this.connectMqttMesh();
      this.scheduleReconnect();
    }
  }

  private connectMqttMesh(): void {
    if (this.mqttClient && (this.mqttClient.connected || this.mqttClient.reconnecting)) {
      return;
    }

    if (!navigator.onLine) {
      this.status = 'offline';
      this.notify();
      return;
    }

    this.status = 'connecting';
    this.notify();

    const brokers = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt',
    ];
    const brokerUrl = brokers[this.mqttBrokerIndex % brokers.length];
    const clientId = `clipsync_${this.currentDevice.id.slice(0, 8)}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 7000,
        reconnectPeriod: 4000,
      });

      const topic = `clipsync/room/${this.roomCode}`;

      this.mqttClient.on('connect', () => {
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.notify();

        this.mqttClient?.subscribe(topic, (err) => {
          if (!err) {
            // Announce presence immediately
            this.transmitMessage({
              type: 'device:joined',
              device: this.currentDevice,
            });
          }
        });

        this.startHeartbeat();
        this.flushPendingQueue();
      });

      this.mqttClient.on('message', (_t: string, payload: Buffer) => {
        try {
          const data = JSON.parse(payload.toString());
          if (data && data.senderId !== this.currentDevice.id) {
            this.handleSocketMessage(data);
          }
        } catch (e) {
          console.error('MQTT message parse error:', e);
        }
      });

      this.mqttClient.on('error', (err) => {
        console.warn('MQTT mesh broker error, switching broker:', err);
        this.mqttBrokerIndex++;
      });

      this.mqttClient.on('close', () => {
        if (this.status !== 'offline' && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
          this.status = 'disconnected';
          this.notify();
        }
      });
    } catch (e) {
      console.warn('Failed initializing MQTT cloud mesh:', e);
      this.fallbackRestSync();
    }
  }

  public transmitMessage(payload: any): void {
    const fullPayload = {
      ...payload,
      roomCode: this.roomCode,
      senderId: this.currentDevice.id,
      timestamp: payload.timestamp || Date.now(),
    };
    const json = JSON.stringify(fullPayload);

    // 1. Primary WebSocket if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(json);
      } catch (err) {
        console.warn('WS send failed:', err);
      }
    }

    // 2. MQTT Cloud Mesh if connected
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        const topic = `clipsync/room/${this.roomCode}`;
        this.mqttClient.publish(topic, json);
      } catch (err) {
        console.warn('MQTT publish failed:', err);
      }
    }

    // 3. Local BroadcastChannel for other tabs on same machine
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(fullPayload);
      } catch (err) {
        console.warn('BroadcastChannel send failed:', err);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    this.reconnectTimer = window.setTimeout(() => {
      if (this.roomCode) {
        if (this.isServerlessStaticHost()) {
          this.connectMqttMesh();
        } else {
          this.connectWebSocket();
        }
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = window.setInterval(() => {
      // 1. WebSocket heartbeat
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
      // 2. Mesh presence ping
      this.transmitMessage({
        type: 'presence:ping',
        device: this.currentDevice,
      });

      // 3. Clean up stale peers not seen for > 60 seconds
      const now = Date.now();
      const active = this.devices.filter(
        (d) => d.isCurrentDevice || (now - d.lastSeen < 60000)
      );
      if (active.length !== this.devices.length) {
        this.devices = active;
        this.notify();
      }
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private async handleSocketMessage(msg: any): Promise<void> {
    if (!msg || msg.senderId === this.currentDevice.id) return;
    const { type } = msg;

    if (type === 'room:joined') {
      const rawItems: EncryptedClipboardItem[] = msg.items || [];
      const remoteDevices: Device[] = msg.devices || [];

      const devMap = new Map<string, Device>();
      devMap.set(this.currentDevice.id, this.currentDevice);
      for (const d of remoteDevices) {
        devMap.set(d.id, {
          ...d,
          isCurrentDevice: d.id === this.currentDevice.id,
        });
      }
      this.devices = Array.from(devMap.values());

      // Decrypt items in parallel
      for (const enc of rawItems) {
        await this.processIncomingEncryptedItem(enc, false);
      }
      this.notify();
    } else if (type === 'presence:ping' || type === 'device:presence_ack') {
      if (msg.device && msg.device.id !== this.currentDevice.id) {
        const devMap = new Map<string, Device>();
        devMap.set(this.currentDevice.id, this.currentDevice);
        for (const d of this.devices) devMap.set(d.id, d);
        const existing = devMap.get(msg.device.id);
        devMap.set(msg.device.id, {
          ...msg.device,
          lastSeen: Date.now(),
          isCurrentDevice: false,
        });
        this.devices = Array.from(devMap.values());

        if (!existing) {
          this.latestDeviceEvent = { type: 'joined', device: msg.device };
          if (this.hapticFeedback) {
            playTactileTick({ intensity: 'medium' });
          }
          // Acknowledge presence so new peer gets this device immediately
          this.transmitMessage({
            type: 'device:presence_ack',
            device: this.currentDevice,
          });
        }
        this.notify();
      }
    } else if (type === 'device:joined' || type === 'device:left') {
      if (type === 'device:joined' && msg.device && msg.device.id !== this.currentDevice.id) {
        const devMap = new Map<string, Device>();
        devMap.set(this.currentDevice.id, this.currentDevice);
        for (const d of this.devices) devMap.set(d.id, d);
        devMap.set(msg.device.id, {
          ...msg.device,
          lastSeen: Date.now(),
          isCurrentDevice: false,
        });
        this.devices = Array.from(devMap.values());

        this.latestDeviceEvent = { type: 'joined', device: msg.device };
        if (this.hapticFeedback) {
          playTactileTick({ intensity: 'medium' });
        }
        // Respond with presence ack so newcomer discovers us immediately!
        this.transmitMessage({
          type: 'device:presence_ack',
          device: this.currentDevice,
        });
      } else if (type === 'device:left' && msg.deviceId && msg.deviceId !== this.currentDevice.id) {
        this.devices = this.devices.filter((d) => d.id !== msg.deviceId);
        const leftDev: Device = {
          id: msg.deviceId,
          name: 'Device',
          type: 'desktop',
          joinedAt: 0,
          lastSeen: 0,
        };
        this.latestDeviceEvent = { type: 'left', device: leftDev };
      }
      this.notify();
    } else if (type === 'item:new' || type === 'item:send') {
      const encItem: EncryptedClipboardItem = msg.item;
      if (encItem) {
        const isFromOtherDevice = encItem.senderId !== this.currentDevice.id;
        await this.processIncomingEncryptedItem(encItem, isFromOtherDevice);
      }
    } else if (type === 'item:deleted') {
      const { itemId } = msg;
      this.items = this.items.filter((i) => i.id !== itemId);
      await deleteLocalItem(itemId);
      this.notify();
    } else if (type === 'items:deleted_batch') {
      const { itemIds } = msg;
      if (Array.isArray(itemIds)) {
        const set = new Set(itemIds);
        this.items = this.items.filter((i) => !set.has(i.id));
        for (const id of itemIds) {
          await deleteLocalItem(id);
        }
        this.notify();
      }
    } else if (type === 'item:pinned') {
      const { itemId, pinned } = msg;
      const it = this.items.find((i) => i.id === itemId);
      if (it) {
        it.pinned = pinned;
        await saveLocalItem(it);
        this.notify();
      }
    } else if (type === 'items:pinned_batch') {
      const { itemIds, pinned } = msg;
      if (Array.isArray(itemIds)) {
        const set = new Set(itemIds);
        for (const it of this.items) {
          if (set.has(it.id)) {
            it.pinned = pinned;
            await saveLocalItem(it);
          }
        }
        this.notify();
      }
    } else if (type === 'items:cleared') {
      this.items = this.items.filter((i) => i.pinned);
      await clearLocalItems(true);
      this.notify();
    }
  }

  private async processIncomingEncryptedItem(
    enc: EncryptedClipboardItem,
    shouldAutoCopy: boolean
  ): Promise<void> {
    try {
      // Check if already in items
      const existingIdx = this.items.findIndex((i) => i.id === enc.id);

      // Decrypt using Web Crypto
      const decryptedPlain = await decryptData(
        enc.encryptedPayload,
        enc.iv,
        enc.salt,
        this.secretKey
      );

      // Mark in watcher to prevent echo / ping-pong loop!
      clipboardWatcher.markAsRemotelyReceived(decryptedPlain);

      const detected = detectContentType(decryptedPlain);

      const decryptedItem: DecryptedClipboardItem = {
        id: enc.id,
        content: decryptedPlain,
        contentType: enc.contentType || detected.type,
        language: detected.language,
        title: detected.title,
        timestamp: enc.timestamp,
        senderId: enc.senderId,
        senderName: enc.senderName,
        senderType: enc.senderType,
        pinned: !!enc.pinned,
        sizeBytes: new Blob([decryptedPlain]).size,
        syncStatus: 'synced',
      };

      if (existingIdx >= 0) {
        this.items[existingIdx] = decryptedItem;
      } else {
        this.items.unshift(decryptedItem);
        // Sort descending
        this.items.sort((a, b) => b.timestamp - a.timestamp);
      }

      await saveLocalItem(decryptedItem);

      let wasAutoCopied = false;
      if (shouldAutoCopy) {
        if (this.hapticFeedback) {
          playTactileTick();
        }
        if (this.autoCopyIncoming) {
          wasAutoCopied = await copyToClipboard(decryptedPlain);
        }

        // Set real-time incoming notification alert
        const latencyMs = Math.max(1, Date.now() - enc.timestamp);
        analyticsService.recordSync('inbound', enc.senderName, latencyMs);
        this.latestSyncEvent = {
          item: decryptedItem,
          latencyMs,
          autoCopied: wasAutoCopied,
          receivedAt: Date.now(),
        };
      } else {
        analyticsService.recordSync('inbound', enc.senderName);
      }

      this.notify();
    } catch (e) {
      console.warn('Could not decrypt clipboard item:', enc.id, e);
    }
  }

  /**
   * Pushes a new clipboard item across all paired devices
   */
  public async pushItem(rawContent: string, explicitType?: 'text' | 'code' | 'link' | 'image'): Promise<DecryptedClipboardItem> {
    const trimmed = rawContent;
    clipboardWatcher.markAsRemotelyReceived(trimmed);
    const detected = detectContentType(trimmed);
    const contentType = explicitType || detected.type;

    const id = 'clip_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const timestamp = Date.now();

    const localItem: DecryptedClipboardItem = {
      id,
      content: trimmed,
      contentType,
      language: detected.language,
      title: detected.title,
      timestamp,
      senderId: this.currentDevice.id,
      senderName: this.currentDevice.name,
      senderType: this.currentDevice.type,
      pinned: false,
      sizeBytes: new Blob([trimmed]).size,
      syncStatus: this.status === 'connected' ? 'synced' : 'pending',
    };

    // Optimistic local update
    this.items.unshift(localItem);
    await saveLocalItem(localItem);
    if (this.hapticFeedback) {
      playTactileTick();
    }
    this.notify();

    // Encrypt payload locally
    try {
      const encrypted = await encryptData(trimmed, this.secretKey);
      const encryptedItem: EncryptedClipboardItem = {
        id,
        encryptedPayload: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        senderId: this.currentDevice.id,
        senderName: this.currentDevice.name,
        senderType: this.currentDevice.type,
        timestamp,
        contentType,
        previewHint: `${contentType.toUpperCase()} • ${trimmed.length} chars`,
      };

      if (this.isConnected()) {
        analyticsService.recordSync('outbound', this.currentDevice.name);
        this.transmitMessage({
          type: 'item:send',
          item: encryptedItem,
        });
        localItem.syncStatus = 'synced';
        this.notify();
      } else {
        analyticsService.recordSync('outbound', this.currentDevice.name);
        // Offline or disconnected: queue in outbox
        await queuePendingSync(localItem);
        const pending = await getPendingSyncQueue();
        this.pendingCount = pending.length;
        localItem.syncStatus = 'pending';
        this.notify();
      }
    } catch (err) {
      console.error('Failed to encrypt or send clipboard item:', err);
    }

    return localItem;
  }

  /**
   * Delete item locally and across paired devices
   */
  public async deleteItem(itemId: string): Promise<void> {
    await this.deleteItems([itemId]);
  }

  /**
   * Delete multiple items locally and across paired devices
   */
  public async deleteItems(itemIds: string[]): Promise<void> {
    if (itemIds.length === 0) return;
    const idSet = new Set(itemIds);
    this.items = this.items.filter((i) => !idSet.has(i.id));
    for (const id of itemIds) {
      await deleteLocalItem(id);
    }
    this.notify();

    this.transmitMessage({
      type: 'items:deleted_batch',
      itemIds,
    });
  }

  /**
   * Toggle pinned state
   */
  public async togglePin(itemId: string): Promise<void> {
    const it = this.items.find((i) => i.id === itemId);
    if (!it) return;
    await this.pinItems([itemId], !it.pinned);
  }

  /**
   * Pin or unpin multiple items locally and across devices
   */
  public async pinItems(itemIds: string[], pinned: boolean): Promise<void> {
    if (itemIds.length === 0) return;
    const idSet = new Set(itemIds);
    for (const it of this.items) {
      if (idSet.has(it.id)) {
        it.pinned = pinned;
        await saveLocalItem(it);
      }
    }
    this.notify();

    this.transmitMessage({
      type: 'items:pinned_batch',
      itemIds,
      pinned,
    });
  }

  /**
   * Clear unpinned items across room
   */
  public async clearAll(): Promise<void> {
    this.items = this.items.filter((i) => i.pinned);
    await clearLocalItems(true);
    this.notify();

    this.transmitMessage({
      type: 'items:cleared',
    });
  }

  /**
   * Flushes offline pending items when connection returns
   */
  private async flushPendingQueue(): Promise<void> {
    const queue = await getPendingSyncQueue();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        const encrypted = await encryptData(item.content, this.secretKey);
        const encryptedItem: EncryptedClipboardItem = {
          id: item.id,
          encryptedPayload: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
          senderId: item.senderId,
          senderName: item.senderName,
          senderType: item.senderType,
          timestamp: item.timestamp,
          contentType: item.contentType,
        };

        if (this.isConnected()) {
          this.transmitMessage({
            type: 'item:send',
            item: encryptedItem,
          });
          await removePendingSync(item.id);
          const found = this.items.find((i) => i.id === item.id);
          if (found) found.syncStatus = 'synced';
        }
      } catch (err) {
        console.warn('Failed flushing pending item:', item.id, err);
      }
    }

    const remaining = await getPendingSyncQueue();
    this.pendingCount = remaining.length;
    this.notify();
  }

  private handleNetworkOnline(): void {
    if (this.status === 'offline') {
      if (this.isServerlessStaticHost()) {
        this.connectMqttMesh();
      } else {
        this.connectWebSocket();
      }
    }
  }

  /**
   * Fallback REST sync in case WebSockets are blocked
   */
  private async fallbackRestSync(): Promise<void> {
    if (!this.roomCode) return;
    try {
      const res = await fetch(`/api/rooms/${this.roomCode}/items`);
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          for (const enc of data.items) {
            await this.processIncomingEncryptedItem(enc, false);
          }
        }
        if (data.devices) {
          this.devices = data.devices.map((d: any) => ({
            ...d,
            isCurrentDevice: d.id === this.currentDevice.id,
          }));
        }
        this.notify();
      }
    } catch {
      // offline
    }
  }

  public setAutoCopy(enabled: boolean): void {
    this.autoCopyIncoming = enabled;
    saveConfig({ autoCopyIncoming: enabled });
    this.notify();
  }

  public setHapticFeedback(enabled: boolean): void {
    this.hapticFeedback = enabled;
    this.hapticSettings = {
      ...this.hapticSettings,
      enabled,
    };
    setActiveHapticSettings(this.hapticSettings);
    saveConfig({
      hapticFeedback: enabled,
      hapticSettings: this.hapticSettings,
    });
    this.notify();
  }

  public updateHapticSettings(newSettings: Partial<HapticSettings>): void {
    this.hapticSettings = {
      ...this.hapticSettings,
      ...newSettings,
    };
    if (newSettings.enabled !== undefined) {
      this.hapticFeedback = newSettings.enabled;
    }
    setActiveHapticSettings(this.hapticSettings);
    saveConfig({
      hapticFeedback: this.hapticSettings.enabled,
      hapticSettings: this.hapticSettings,
    });
    this.notify();
  }

  public setLiveClipboardWatch(enabled: boolean): void {
    this.liveClipboardWatch = enabled;
    if (enabled) {
      clipboardWatcher.start();
    } else {
      clipboardWatcher.stop();
    }
    this.notify();
  }

  public dismissLatestSyncEvent(): void {
    this.latestSyncEvent = null;
    this.notify();
  }

  public updateCurrentDeviceName(name: string): void {
    this.currentDevice.name = name;
    saveConfig({ deviceName: name });
    this.notify();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'join-room',
          roomCode: this.roomCode,
          deviceId: this.currentDevice.id,
          deviceName: name,
          deviceType: this.currentDevice.type,
        })
      );
    }
  }
}

export const syncManager = new SyncManager();
