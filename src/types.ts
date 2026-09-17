export type ContentType = 'text' | 'code' | 'link' | 'image';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'browser';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  joinedAt: number;
  lastSeen: number;
  isCurrentDevice?: boolean;
}

export interface EncryptedClipboardItem {
  id: string;
  encryptedPayload: string; // Base64 ciphertext
  iv: string; // Base64 IV (12 bytes)
  salt: string; // Base64 salt
  senderId: string;
  senderName: string;
  senderType: string;
  timestamp: number;
  contentType: ContentType;
  previewHint?: string;
  pinned?: boolean;
}

export interface DecryptedClipboardItem {
  id: string;
  content: string; // Plaintext content or data URL for image
  contentType: ContentType;
  language?: string;
  title?: string;
  timestamp: number;
  senderId: string;
  senderName: string;
  senderType: string;
  pinned?: boolean;
  sizeBytes: number;
  isLocalOnly?: boolean;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'offline';

export type HapticIntensity = 'subtle' | 'medium' | 'strong';

export interface HapticSettings {
  enabled: boolean;
  intensity: HapticIntensity; // subtle (light tick), medium (standard), strong (crisp punch)
  durationMs: number; // 10ms to 120ms duration for physical motor & audio tick
  vibrationMotor: boolean; // physical device motor via navigator.vibrate
  audioTick: boolean; // micro acoustic synth oscillator
}

export interface RoomConfig {
  roomCode: string;
  secretKey: string;
  deviceName: string;
  deviceId: string;
  autoCopyIncoming: boolean;
  hapticFeedback: boolean;
  hapticSettings?: HapticSettings;
}
