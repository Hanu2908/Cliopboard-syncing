import { useEffect, useCallback } from 'react';
import { syncManager } from '../services/syncManager';
import { detectContentType, playTactileTick } from '../services/clipboard';

export interface ShortcutToastInfo {
  type: 'sync-success' | 'sync-empty' | 'sync-error' | 'visibility-toggled';
  message: string;
  detail?: string;
}

interface UseGlobalShortcutsOptions {
  isStealthMode: boolean;
  onToggleStealthMode: () => void;
  onFocusSearch?: () => void;
  onFocusNewClip?: () => void;
  onShowShortcutHelp?: () => void;
  onShortcutTriggered?: (info: ShortcutToastInfo) => void;
}

export function useGlobalShortcuts({
  isStealthMode,
  onToggleStealthMode,
  onFocusSearch,
  onFocusNewClip,
  onShowShortcutHelp,
  onShortcutTriggered,
}: UseGlobalShortcutsOptions) {
  // Manual sync of system clipboard
  const handleManualClipboardSync = useCallback(async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        onShortcutTriggered?.({
          type: 'sync-error',
          message: 'Clipboard API not supported in this browser',
        });
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        playTactileTick();
        onShortcutTriggered?.({
          type: 'sync-empty',
          message: 'System clipboard is empty',
          detail: 'Copy some text or code first, then press Ctrl+Shift+V',
        });
        return;
      }

      playTactileTick();
      const detectedType = detectContentType(text);
      await syncManager.pushItem(text, detectedType.type);

      onShortcutTriggered?.({
        type: 'sync-success',
        message: 'System clipboard synced to mesh',
        detail: text.length > 60 ? `${text.slice(0, 60)}...` : text,
      });
    } catch (err) {
      console.warn('Manual clipboard sync failed:', err);
      onShortcutTriggered?.({
        type: 'sync-error',
        message: 'Clipboard permission blocked',
        detail: 'Click anywhere inside the app to grant browser clipboard access.',
      });
    }
  }, [onShortcutTriggered]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;

      // Ctrl + Shift + V or Cmd + Shift + V -> Manual System Clipboard Sync
      if (isModifier && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        e.stopPropagation();
        handleManualClipboardSync();
        return;
      }

      // Ctrl + Shift + H or Cmd + Shift + H -> Toggle Stealth HUD / App Visibility
      if (isModifier && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        e.stopPropagation();
        onToggleStealthMode();
        onShortcutTriggered?.({
          type: 'visibility-toggled',
          message: isStealthMode ? 'App visibility restored' : 'Stealth HUD mode active',
          detail: 'Press Ctrl+Shift+H anytime to toggle',
        });
        return;
      }

      // Ctrl + Shift + ? or Ctrl + / -> Shortcuts guide
      if (isModifier && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        onShowShortcutHelp?.();
        return;
      }

      // / when not in input -> focus search
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      // Ctrl + Shift + N -> Focus new clip
      if (isModifier && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        onFocusNewClip?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    handleManualClipboardSync,
    isStealthMode,
    onToggleStealthMode,
    onFocusSearch,
    onFocusNewClip,
    onShowShortcutHelp,
    onShortcutTriggered,
  ]);

  return {
    handleManualClipboardSync,
  };
}
