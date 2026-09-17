import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Settings,
  Download,
  Trash2,
  Bell,
  Volume2,
  LogOut,
  Laptop,
  Zap,
  Keyboard,
  Vibrate,
  Sliders,
  Play,
  Check,
} from 'lucide-react';
import { DecryptedClipboardItem, HapticSettings, HapticIntensity } from '../types';
import { playTactileTick, DEFAULT_HAPTIC_SETTINGS } from '../services/clipboard';
import { SettingToggle } from './SettingToggle';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceName: string;
  onUpdateDeviceName: (name: string) => void;
  autoCopyIncoming: boolean;
  onToggleAutoCopy: (val: boolean) => void;
  liveClipboardWatch?: boolean;
  onToggleLiveWatch?: (val: boolean) => void;
  hapticFeedback: boolean;
  onToggleHaptic: (val: boolean) => void;
  hapticSettings?: HapticSettings;
  onUpdateHapticSettings?: (settings: Partial<HapticSettings>) => void;
  items: DecryptedClipboardItem[];
  onClearAll: () => void;
  onDisconnectRoom: () => void;
  onOpenShortcuts?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  deviceName,
  onUpdateDeviceName,
  autoCopyIncoming,
  onToggleAutoCopy,
  liveClipboardWatch = false,
  onToggleLiveWatch,
  hapticFeedback,
  onToggleHaptic,
  hapticSettings = DEFAULT_HAPTIC_SETTINGS,
  onUpdateHapticSettings,
  items,
  onClearAll,
  onDisconnectRoom,
  onOpenShortcuts,
}) => {
  const [name, setName] = useState(deviceName);
  const [nameSaved, setNameSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [testPlaying, setTestPlaying] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUpdateDeviceName(name.trim());
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 1800);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `clipsync-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleTestHaptic = () => {
    setTestPlaying(true);
    playTactileTick({
      enabled: true,
      intensity: hapticSettings.intensity,
      durationMs: hapticSettings.durationMs,
      vibrationMotor: hapticSettings.vibrationMotor,
      audioTick: hapticSettings.audioTick,
    });
    setTimeout(() => setTestPlaying(false), 300);
  };

  const intensityOptions: { label: string; value: HapticIntensity; desc: string }[] = [
    { label: 'Subtle', value: 'subtle', desc: 'Soft pulse (light tap)' },
    { label: 'Medium', value: 'medium', desc: 'Balanced tactile bump' },
    { label: 'Strong', value: 'strong', desc: 'Crisp, high-impact click' },
  ];

  return (
    <AnimatePresence>
      <div
        id="settings-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="settings-modal-card"
          initial={{ opacity: 0, scale: 0.97, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={{ duration: 0.16 }}
          className="w-full max-w-lg bg-[#151413] border border-[#272622] rounded-xl shadow-2xl overflow-hidden text-[#FAF8F5] flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#23221F] bg-[#181715]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#201F1D] border border-[#2B2A26] text-[#D97706]">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#FAF8F5]">
                  Preferences & Settings
                </h2>
                <p className="text-[11px] text-[#7C776F]">Per-device sync & tactile configuration</p>
              </div>
            </div>
            <button
              id="settings-close-button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#7C776F] hover:text-[#FAF8F5] hover:bg-[#22211E] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 space-y-5 overflow-y-auto divide-y divide-[#21201D] text-xs">
            {/* Device Identity */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#D6D3CD] flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-[#D97706]" />
                Device Identification
              </label>
              <form onSubmit={handleSaveName} className="flex gap-2">
                <input
                  id="setting-device-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#191816] border border-[#282723] rounded-md text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D97706]/60 transition-colors"
                  placeholder="e.g. MacBook Pro, Studio Workstation"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#242320] hover:bg-[#2E2C28] border border-[#35342F] text-xs font-medium text-[#FAF8F5] rounded-md transition-colors cursor-pointer"
                >
                  {nameSaved ? (
                    <>
                      <Check className="w-3 h-3 text-[#16A34A]" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Rename</span>
                  )}
                </motion.button>
              </form>
              <p className="text-[11px] text-[#716C63]">
                Visible to all other paired devices in this zero-knowledge room.
              </p>
            </div>

            {/* Sync Behaviors */}
            <div className="pt-4 space-y-3">
              <div className="text-[11px] font-mono text-[#716C63] uppercase tracking-wider">
                Sync Behaviors
              </div>

              {/* Auto-copy incoming */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#191816] border border-[#242320]">
                <div className="space-y-0.5">
                  <div className="font-medium text-[#FAF8F5] flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#D97706]" />
                    Auto-Copy Incoming Clips
                  </div>
                  <p className="text-[11px] text-[#7C776F] leading-relaxed">
                    Instantly writes items received from other devices directly into this machine's local clipboard.
                  </p>
                </div>
                <SettingToggle
                  id="toggle-auto-copy-incoming"
                  checked={autoCopyIncoming}
                  onChange={(val) => onToggleAutoCopy(val)}
                  activeColor="#D97706"
                />
              </div>

              {/* Live continuous watcher */}
              {onToggleLiveWatch && (
                <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#191816] border border-[#242320]">
                  <div className="space-y-0.5">
                    <div className="font-medium text-[#FAF8F5] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#16A34A]" />
                      Continuous Clipboard Sentinel
                    </div>
                    <p className="text-[11px] text-[#7C776F] leading-relaxed">
                      Auto-broadcasts clipboard copy operations performed within this browser window without manually opening the app.
                    </p>
                  </div>
                  <SettingToggle
                    id="toggle-live-sentinel"
                    checked={liveClipboardWatch}
                    onChange={(val) => onToggleLiveWatch(val)}
                    activeColor="#16A34A"
                  />
                </div>
              )}
            </div>

            {/* Fine-Grained Tactile & Haptic Feedback */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono text-[#716C63] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#D97706]" />
                  Tactile & Haptic Feedback
                </div>
                <button
                  type="button"
                  onClick={handleTestHaptic}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-[#D97706] hover:text-[#FAF8F5] bg-[#221B13] hover:bg-[#2F2417] border border-[#44301B] transition-colors cursor-pointer"
                  title="Test current haptic vibration and audio tick"
                >
                  <Play className={`w-2.5 h-2.5 ${testPlaying ? 'animate-spin' : ''}`} />
                  <span>Test Feel</span>
                </button>
              </div>

              {/* Master Haptic Toggle */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#191816] border border-[#242320]">
                <div className="space-y-0.5">
                  <div className="font-medium text-[#FAF8F5] flex items-center gap-1.5">
                    <Vibrate className="w-3.5 h-3.5 text-[#D97706]" />
                    Tactile Confirmations
                  </div>
                  <p className="text-[11px] text-[#7C776F] leading-relaxed">
                    Provides sensory feedback upon clipboard copy, paste broadcast, and item sync events.
                  </p>
                </div>
                <SettingToggle
                  id="toggle-master-haptic"
                  checked={hapticFeedback}
                  onChange={(val) => {
                    onToggleHaptic(val);
                    if (onUpdateHapticSettings) {
                      onUpdateHapticSettings({ enabled: val });
                    }
                  }}
                  activeColor="#D97706"
                />
              </div>

              {/* Detailed controls nested when enabled */}
              {hapticFeedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-lg bg-[#181715] border border-[#262522] space-y-3.5"
                >
                  {/* Intensity Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[#D6D3CD]">Vibration Intensity</span>
                      <span className="font-mono text-[#8C877D] capitalize">
                        {hapticSettings.intensity}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {intensityOptions.map((opt) => {
                        const isCurrent = hapticSettings.intensity === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              if (onUpdateHapticSettings) {
                                onUpdateHapticSettings({ intensity: opt.value });
                              }
                              playTactileTick({
                                enabled: true,
                                intensity: opt.value,
                                durationMs: hapticSettings.durationMs,
                                vibrationMotor: hapticSettings.vibrationMotor,
                                audioTick: hapticSettings.audioTick,
                              });
                            }}
                            className={`px-2.5 py-1.5 rounded-md border text-left transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-[#262522] border-[#D97706] text-[#FAF8F5] shadow-xs'
                                : 'bg-[#191816] border-[#252420] text-[#7C776F] hover:text-[#D6D3CD]'
                            }`}
                          >
                            <div className="font-medium text-xs text-[#FAF8F5]">{opt.label}</div>
                            <div className="text-[10px] text-[#716C63] truncate">{opt.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration Slider (10ms to 120ms) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[#D6D3CD]">Pulse Duration</span>
                      <span className="font-mono text-[#D97706] font-semibold">
                        {hapticSettings.durationMs} ms
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-[#716C63]">10ms</span>
                      <input
                        id="haptic-duration-slider"
                        type="range"
                        min="10"
                        max="120"
                        step="5"
                        value={hapticSettings.durationMs}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (onUpdateHapticSettings) {
                            onUpdateHapticSettings({ durationMs: val });
                          }
                        }}
                        onMouseUp={() => {
                          playTactileTick({
                            enabled: true,
                            intensity: hapticSettings.intensity,
                            durationMs: hapticSettings.durationMs,
                            vibrationMotor: hapticSettings.vibrationMotor,
                            audioTick: hapticSettings.audioTick,
                          });
                        }}
                        onTouchEnd={() => {
                          playTactileTick({
                            enabled: true,
                            intensity: hapticSettings.intensity,
                            durationMs: hapticSettings.durationMs,
                            vibrationMotor: hapticSettings.vibrationMotor,
                            audioTick: hapticSettings.audioTick,
                          });
                        }}
                        className="w-full accent-[#D97706] cursor-pointer bg-[#262522] h-1.5 rounded-lg appearance-none"
                      />
                      <span className="text-[10px] font-mono text-[#716C63]">120ms</span>
                    </div>
                  </div>

                  {/* Individual Output Channel Toggles */}
                  <div className="pt-2 border-t border-[#23221F] space-y-2">
                    {/* Physical Motor */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#D6D3CD]">
                        <Vibrate className="w-3 h-3 text-[#7C776F]" />
                        <span>Hardware Vibration Motor (Mobile & PWA)</span>
                      </div>
                      <SettingToggle
                        id="toggle-hardware-vibration"
                        checked={hapticSettings.vibrationMotor}
                        onChange={(val) => {
                          if (onUpdateHapticSettings) {
                            onUpdateHapticSettings({ vibrationMotor: val });
                          }
                        }}
                        activeColor="#D97706"
                      />
                    </div>

                    {/* Synthetic Audio Tick */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#D6D3CD]">
                        <Volume2 className="w-3 h-3 text-[#7C776F]" />
                        <span>Micro Acoustic Oscillator (Desktop & Laptops)</span>
                      </div>
                      <SettingToggle
                        id="toggle-audio-tick"
                        checked={hapticSettings.audioTick}
                        onChange={(val) => {
                          if (onUpdateHapticSettings) {
                            onUpdateHapticSettings({ audioTick: val });
                          }
                        }}
                        activeColor="#D97706"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick Tools: Shortcuts & PWA */}
            <div className="pt-4 space-y-2">
              <div className="text-[11px] font-mono text-[#716C63] uppercase tracking-wider">
                System & Workflow
              </div>

              {onOpenShortcuts && (
                <button
                  id="settings-open-shortcuts"
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenShortcuts();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#191816] hover:bg-[#201F1D] border border-[#242320] text-[#D6D3CD] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Global Keyboard Shortcuts</span>
                  </div>
                  <kbd className="font-mono text-[10px] text-[#7C776F] px-1.5 py-0.5 rounded bg-[#121211] border border-[#272622]">
                    Ctrl+Shift+V
                  </kbd>
                </button>
              )}

              <div className="pt-1">
                <PWAInstallButton variant="settings" />
              </div>
            </div>

            {/* Data Management & Session Disconnect */}
            <div className="pt-4 space-y-2">
              <div className="text-[11px] font-mono text-[#716C63] uppercase tracking-wider">
                Data & Storage
              </div>

              {/* Export JSON */}
              <button
                id="settings-export-json"
                type="button"
                onClick={handleExportJSON}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#191816] hover:bg-[#201F1D] border border-[#242320] text-[#D6D3CD] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-[#8C877D]" />
                  <span>Export Clipboard Archive (JSON)</span>
                </div>
                <span className="font-mono text-[11px] text-[#716C63]">
                  {items.length} clips
                </span>
              </button>

              {/* Clear unpinned */}
              {confirmClear ? (
                <div className="p-2.5 rounded-lg bg-[#241512] border border-[#47221A] flex items-center justify-between">
                  <span className="text-xs text-[#EA580C]">Clear unpinned clips?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                      }}
                      className="px-2.5 py-1 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 bg-[#181715] text-[#8C877D] text-xs rounded hover:text-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  id="settings-clear-unpinned"
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#191816] hover:bg-[#211715] border border-[#242320] text-xs text-[#EA580C] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Unpinned History</span>
                </button>
              )}

              {/* Disconnect & Switch Room */}
              <button
                id="settings-disconnect-room"
                type="button"
                onClick={onDisconnectRoom}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#191816] hover:bg-[#201F1D] border border-[#242320] text-xs text-[#8C877D] hover:text-[#FAF8F5] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect & Switch Room</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-[#23221F] bg-[#171614] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#5C5952]">
              Config saved automatically
            </span>
            <button
              id="settings-done-button"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#262522] hover:bg-[#32302B] border border-[#3A3833] rounded-md text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
