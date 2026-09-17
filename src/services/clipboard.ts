import { ContentType, HapticSettings } from '../types';

/**
 * Cleanly copies content to the device clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Direct navigator.clipboard write failed, using fallback:', err);
  }

  // Fallback for iframe restrictions or older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}

/**
 * Attempts to read from user device clipboard with permission check
 */
export async function readFromClipboard(silent = false): Promise<string | null> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      return text;
    }
  } catch (err) {
    if (!silent) {
      console.warn('Cannot read clipboard directly (requires user gesture or permission):', err);
    }
  }
  return null;
}

/**
 * Heuristics to detect whether clipboard content is code, link, or plain text
 */
export function detectContentType(content: string): {
  type: ContentType;
  language?: string;
  title?: string;
} {
  const trimmed = content.trim();

  // Image data URL
  if (trimmed.startsWith('data:image/')) {
    return { type: 'image' };
  }

  // URL detection
  const urlPattern = /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i;
  if (urlPattern.test(trimmed) && !trimmed.includes('\n')) {
    let title = trimmed;
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      title = parsed.hostname + (parsed.pathname.length > 1 ? parsed.pathname.slice(0, 24) + '...' : '');
    } catch {
      // ignore
    }
    return { type: 'link', title };
  }

  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return { type: 'code', language: 'json' };
    } catch {
      // not strict JSON
    }
  }

  // Code syntax heuristics
  const codeIndicators = [
    /^(import|export)\s+.*\s+from\s+['"].*['"]/m,
    /function\s+\w+\s*\(.*\)\s*\{/m,
    /const\s+\w+\s*=\s*(\(|async|\w+)/m,
    /class\s+\w+(\s+extends\s+\w+)?\s*\{/m,
    /<[a-zA-Z][\s\S]*>[\s\S]*<\/[a-zA-Z]>/m,
    /def\s+\w+\(.*\):/m,
    /SELECT\s+.*\s+FROM\s+/im,
    /console\.(log|error|warn)\(/m,
    /\{[\s\S]*;[\s\S]*\}/m,
  ];

  const hasMultipleLines = trimmed.split('\n').length >= 2;
  const matchesIndicator = codeIndicators.some((regex) => regex.test(trimmed));

  if (hasMultipleLines && matchesIndicator) {
    let language = 'code';
    if (/import.*from|const |let |=>/m.test(trimmed)) language = 'typescript';
    else if (/<[a-z][\s\S]*>/i.test(trimmed)) language = 'html';
    else if (/def |import sys|print\(/m.test(trimmed)) language = 'python';
    else if (/SELECT |INSERT INTO|WHERE /im.test(trimmed)) language = 'sql';
    return { type: 'code', language };
  }

  return { type: 'text' };
}

export const DEFAULT_HAPTIC_SETTINGS: HapticSettings = {
  enabled: true,
  intensity: 'medium',
  durationMs: 35,
  vibrationMotor: true,
  audioTick: true,
};

let activeHapticSettings: HapticSettings = { ...DEFAULT_HAPTIC_SETTINGS };

export function getActiveHapticSettings(): HapticSettings {
  return { ...activeHapticSettings };
}

export function setActiveHapticSettings(settings: Partial<HapticSettings>): void {
  activeHapticSettings = {
    ...activeHapticSettings,
    ...settings,
  };
}

let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    } catch {
      return null;
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Fine-grained tactile feedback triggered per-device based on user preferences.
 * Coordinates both physical device vibration motor (via navigator.vibrate)
 * and ultra-crisp procedural Web Audio synthesis.
 */
export function playTactileTick(customSettings?: Partial<HapticSettings>): void {
  const settings: HapticSettings = {
    ...activeHapticSettings,
    ...(customSettings || {}),
  };

  if (!settings.enabled) return;

  const durationSec = Math.max(0.01, Math.min(settings.durationMs / 1000, 0.25));

  // Intensity multipliers
  const intensityMap: Record<string, { gain: number; pitch: number; motorVibe: number }> = {
    subtle: { gain: 0.02, pitch: 920, motorVibe: Math.max(10, Math.round(settings.durationMs * 0.6)) },
    medium: { gain: 0.05, pitch: 780, motorVibe: settings.durationMs },
    strong: { gain: 0.12, pitch: 620, motorVibe: Math.round(settings.durationMs * 1.5) },
  };

  const currentLevel = intensityMap[settings.intensity] || intensityMap.medium;

  // 1. Device hardware vibration motor
  if (settings.vibrationMotor && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(currentLevel.motorVibe);
    } catch {
      // Ignore vibration errors if blocked by browser policy
    }
  }

  // 2. Micro synthetic audio tick
  if (settings.audioTick) {
    try {
      const ctx = getSharedAudioContext();
      if (!ctx || ctx.state === 'closed') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = settings.intensity === 'strong' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(currentLevel.pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + durationSec);

      gain.gain.setValueAtTime(currentLevel.gain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec + 0.01);
    } catch {
      // AudioContext blocked or not allowed, ignore silently
    }
  }
}
