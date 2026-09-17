import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, ClipboardCopy, CheckCircle2, Wifi, Zap } from 'lucide-react';
import { ConnectionStatus, DecryptedClipboardItem } from '../types';

interface StealthHUDProps {
  roomCode: string;
  status: ConnectionStatus;
  itemsCount: number;
  latestItem?: DecryptedClipboardItem;
  onRestore: () => void;
  onTriggerSync: () => void;
}

export const StealthHUD: React.FC<StealthHUDProps> = ({
  roomCode,
  status,
  itemsCount,
  latestItem,
  onRestore,
  onTriggerSync,
}) => {
  const isMac = typeof window !== 'undefined' && /macintosh|mac os x/i.test(navigator.userAgent);
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#161513]/95 border border-[#3A362E] shadow-2xl backdrop-blur-md text-[#EAE8E2]"
    >
      {/* Stealth Status & Room */}
      <div className="flex items-center gap-2 pr-2 border-r border-[#2B2925]">
        <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C877D]">
            Stealth HUD
          </span>
          <span className="text-xs font-semibold font-mono text-[#FAF8F5]">
            {roomCode || 'ClipSync'}
          </span>
        </div>
      </div>

      {/* Latest Synced Snippet or Count */}
      <div className="hidden sm:flex items-center gap-2 max-w-[200px] truncate text-xs text-[#A8A29E]">
        {latestItem ? (
          <span className="truncate text-[#D6D3CD]">
            {latestItem.content.slice(0, 30)}...
          </span>
        ) : (
          <span>{itemsCount} item{itemsCount === 1 ? '' : 's'} in mesh</span>
        )}
      </div>

      {/* Manual Sync Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        onClick={onTriggerSync}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252119] hover:bg-[#322A1C] border border-[#59441D] text-[#D97706] text-xs font-medium transition-colors cursor-pointer"
        title={`Sync current system clipboard (${modKey}+Shift+V)`}
      >
        <ClipboardCopy className="w-3.5 h-3.5" />
        <span>Sync Clipboard</span>
        <kbd className="hidden md:inline-block px-1 py-0.5 rounded bg-[#161513] border border-[#44371F] text-[9px] font-mono text-[#D97706]">
          {modKey}+Shift+V
        </kbd>
      </motion.button>

      {/* Restore Full Window Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRestore}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22211E] hover:bg-[#2C2A26] border border-[#36342E] text-[#FAF8F5] text-xs font-medium transition-colors cursor-pointer"
        title={`Restore full window (${modKey}+Shift+H)`}
      >
        <Maximize2 className="w-3.5 h-3.5 text-[#D6D3CD]" />
        <span>Restore</span>
        <kbd className="hidden md:inline-block px-1 py-0.5 rounded bg-[#161513] border border-[#2E2C28] text-[9px] font-mono text-[#8C877D]">
          {modKey}+Shift+H
        </kbd>
      </motion.button>
    </motion.div>
  );
};
