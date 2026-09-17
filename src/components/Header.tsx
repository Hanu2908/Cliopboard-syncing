import React from 'react';
import { motion } from 'motion/react';
import {
  Share2,
  Laptop,
  Settings,
  Copy,
  Check,
  ClipboardCopy,
  BookOpen,
} from 'lucide-react';
import { Device, ConnectionStatus, DecryptedClipboardItem } from '../types';
import { copyToClipboard, playTactileTick } from '../services/clipboard';

interface HeaderProps {
  roomCode: string;
  status: ConnectionStatus;
  devices: Device[];
  pendingCount: number;
  items?: DecryptedClipboardItem[];
  onOpenPairing: () => void;
  onOpenSettings: () => void;
  onOpenDevices: () => void;
  onOpenLanding?: () => void;
  onOpenAnalytics?: () => void;
  onOpenShortcuts?: () => void;
  onToggleStealth?: () => void;
  onManualSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  status,
  devices,
  pendingCount,
  onOpenPairing,
  onOpenSettings,
  onOpenDevices,
  onOpenLanding,
  onManualSync,
}) => {
  const [copiedCode, setCopiedCode] = React.useState(false);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(roomCode);
    if (success) {
      playTactileTick();
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const isLive = status === 'connected';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#242321] bg-[#121211]/90 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Room info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isLive
                  ? 'bg-[#16A34A] shadow-[0_0_8px_rgba(22,163,74,0.6)]'
                  : 'bg-[#D97706]'
              }`}
              title={isLive ? 'Encrypted Mesh Active' : 'Connecting to Mesh'}
            />
            <h1 className="font-newblack text-sm tracking-tight text-[#FAF8F5]">
              ClipSync
            </h1>
          </div>

          {/* Room Pill */}
          {roomCode && (
            <button
              onClick={onOpenPairing}
              title="Click to view pairing QR and code"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#191816] hover:bg-[#22211F] border border-[#282724] hover:border-[#3A3833] rounded-md transition-colors text-xs font-mono text-[#D6D3CD]"
            >
              <span className="text-[#8C877D] text-[11px]">Room</span>
              <span className="font-semibold text-[#FAF8F5]">{roomCode}</span>
              <span
                onClick={handleCopyCode}
                className="ml-0.5 p-0.5 hover:text-[#FAF8F5] text-[#8C877D] transition-colors"
                title="Copy Room Code"
              >
                {copiedCode ? (
                  <Check className="w-3 h-3 text-[#16A34A]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </span>
            </button>
          )}

          {pendingCount > 0 && (
            <span className="text-[11px] font-mono text-[#D97706] bg-[#221C14] px-2 py-0.5 rounded border border-[#3E2E18]">
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Minimal Right side controls: Sync, Devices, Pair, Settings */}
        <div className="flex items-center gap-2">
          {/* Quick Manual System Clipboard Sync */}
          {onManualSync && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onManualSync}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#221F19] hover:bg-[#2C271E] border border-[#483B1E] text-xs font-medium text-[#D97706] transition-colors cursor-pointer"
              title="Sync current system clipboard (Ctrl+Shift+V)"
            >
              <ClipboardCopy className="w-3.5 h-3.5" />
              <span>Sync</span>
              <kbd className="hidden md:inline font-mono text-[9px] text-[#A8A29E] bg-[#171614] px-1 py-0.2 rounded border border-[#352D1C]">
                ^⇧V
              </kbd>
            </motion.button>
          )}

          {/* Connected Devices Indicator */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenDevices}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#191816] hover:bg-[#22211E] border border-[#282724] text-xs text-[#D6D3CD] transition-colors cursor-pointer"
            title="View connected devices in mesh"
          >
            <div className="relative flex items-center justify-center">
              <Laptop className="w-3.5 h-3.5 text-[#8C877D]" />
              {devices.length > 1 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]" />
                </span>
              )}
            </div>
            <motion.span
              key={devices.length}
              initial={{ scale: 1.2, color: '#FAF8F5' }}
              animate={{ scale: 1, color: '#D6D3CD' }}
              transition={{ duration: 0.2 }}
              className="font-mono text-xs"
            >
              {devices.length || 1} {devices.length === 1 ? 'device' : 'devices'}
            </motion.span>
          </motion.button>

          {/* Pair Device */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenPairing}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1D1C1A] hover:bg-[#262522] border border-[#2F2D29] text-xs text-[#FAF8F5] transition-colors cursor-pointer"
            title="Pair with phone or laptop"
          >
            <Share2 className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Pair</span>
          </motion.button>

          {/* Overview / Landing Page Switcher */}
          {onOpenLanding && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenLanding}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#191816] hover:bg-[#22211E] border border-[#282724] text-xs text-[#A8A29E] hover:text-[#FAF8F5] transition-colors cursor-pointer"
              title="View Landing Page, Sandbox & Specs"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#8C877D]" />
              <span>Overview</span>
            </motion.button>
          )}

          {/* Settings & More */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-[#191816] hover:bg-[#22211E] border border-[#282724] text-[#A8A29E] hover:text-[#FAF8F5] transition-colors cursor-pointer"
            title="Settings & Tools"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};
