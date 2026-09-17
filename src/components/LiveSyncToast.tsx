import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Copy,
  Zap,
  X,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
} from 'lucide-react';
import { IncomingSyncEvent } from '../services/syncManager';
import { copyToClipboard, playTactileTick } from '../services/clipboard';

interface LiveSyncToastProps {
  event: IncomingSyncEvent | null;
  onDismiss: () => void;
}

export const LiveSyncToast: React.FC<LiveSyncToastProps> = ({ event, onDismiss }) => {
  useEffect(() => {
    if (!event) return;

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);

    // Keyboard shortcut: Spacebar copies the item immediately if not yet auto-copied
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        copyToClipboard(event.item.content);
        playTactileTick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [event, onDismiss]);

  if (!event) return null;

  const { item, latencyMs, autoCopied } = event;

  const handleManualCopy = async () => {
    await copyToClipboard(item.content);
    playTactileTick();
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-[#D97706]" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-[#D97706]" />;
      case 'desktop':
        return <Laptop className="w-4 h-4 text-[#D97706]" />;
      default:
        return <Monitor className="w-4 h-4 text-[#D97706]" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="p-4 rounded-xl bg-[#181715] border border-[#3A3833] shadow-2xl text-[#EAE8E2] space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#242320] border border-[#34322D]">
                {getDeviceIcon(item.senderType)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#FAF8F5]">
                    {item.senderName}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#252420] border border-[#3D3A33] text-[#16A34A]">
                    <Zap className="w-2.5 h-2.5 fill-[#16A34A]" />
                    {latencyMs}ms
                  </span>
                </div>
                <div className="text-[11px] text-[#8C877D]">
                  {autoCopied ? 'Copied to your clipboard!' : 'New clipboard item ready'}
                </div>
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="p-1 rounded text-[#8C877D] hover:text-[#FAF8F5] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Snippet Preview */}
          <div className="p-2.5 rounded-lg bg-[#111010] border border-[#262521] text-xs font-mono text-[#D6D3CD] truncate select-all max-h-16 overflow-hidden">
            {item.content.startsWith('data:image/') ? '[Image Asset]' : item.content}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-[#A8A29E] font-mono flex items-center gap-1.5">
              {autoCopied ? (
                <span className="flex items-center gap-1 text-[#16A34A]">
                  <Check className="w-3.5 h-3.5" />
                  Ready to paste (⌘V / Ctrl+V)
                </span>
              ) : (
                <span className="text-[#8C877D]">
                  Press <kbd className="px-1 py-0.5 rounded bg-[#242320] border border-[#383632] text-[#EAE8E2]">Space</kbd> to copy
                </span>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleManualCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-black font-semibold rounded-md text-xs transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{autoCopied ? 'Copy Again' : 'Copy to Clipboard'}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
