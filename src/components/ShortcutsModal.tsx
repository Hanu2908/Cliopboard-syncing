import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, ClipboardCopy, Eye, Search, PlusCircle } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSync: () => void;
  onToggleStealth: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  onTriggerSync,
  onToggleStealth,
}) => {
  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && /macintosh|mac os x/i.test(navigator.userAgent);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      keys: [`${modKey}`, 'Shift', 'V'],
      description: 'Quick Sync System Clipboard',
      detail: 'Reads OS clipboard text and immediately broadcasts encrypted snippet to all mesh devices.',
      icon: <ClipboardCopy className="w-4 h-4 text-[#D97706]" />,
      action: () => {
        onTriggerSync();
        onClose();
      },
      actionLabel: 'Test Sync',
    },
    {
      keys: [`${modKey}`, 'Shift', 'H'],
      description: 'Toggle App Visibility / Stealth HUD',
      detail: 'Minimizes application into an ultra-compact distraction-free floating HUD dock.',
      icon: <Eye className="w-4 h-4 text-[#FAF8F5]" />,
      action: () => {
        onToggleStealth();
        onClose();
      },
      actionLabel: 'Toggle',
    },
    {
      keys: ['/'],
      description: 'Focus Search Bar',
      detail: 'Instantly highlights search input to filter clips by title, body, or sender.',
      icon: <Search className="w-4 h-4 text-[#8C877D]" />,
    },
    {
      keys: [`${modKey}`, 'Shift', 'N'],
      description: 'New Clip Input',
      detail: 'Focuses manual entry text area to author an encrypted clip.',
      icon: <PlusCircle className="w-4 h-4 text-[#8C877D]" />,
    },
    {
      keys: ['Esc'],
      description: 'Dismiss / Restore / Clear',
      detail: 'Clears active multi-selections, restores full window from stealth, or dismisses dialogs.',
      icon: <Keyboard className="w-4 h-4 text-[#8C877D]" />,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg rounded-2xl bg-[#171614] border border-[#38352F] p-5 shadow-2xl text-[#EAE8E2]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#262420]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#24221D] border border-[#483B1E] flex items-center justify-center text-[#D97706]">
                <Keyboard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#FAF8F5]">
                  Global Keyboard Shortcuts
                </h3>
                <p className="text-[11px] text-[#8C877D]">
                  Operate ClipSync rapidly without touching your mouse
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#8C877D] hover:text-[#FAF8F5] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="py-4 space-y-3">
            {shortcuts.map((sc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1D1C19] border border-[#2B2925] hover:border-[#3E3B35] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{sc.icon}</div>
                  <div>
                    <div className="text-xs font-semibold text-[#FAF8F5]">
                      {sc.description}
                    </div>
                    <div className="text-[11px] text-[#8C877D] mt-0.5 leading-snug">
                      {sc.detail}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {sc.action && (
                    <button
                      onClick={sc.action}
                      className="px-2 py-1 rounded bg-[#27241E] hover:bg-[#342F25] text-[10px] font-medium text-[#D97706] border border-[#483B1E] transition-colors"
                    >
                      {sc.actionLabel}
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k, ki) => (
                      <kbd
                        key={ki}
                        className="px-2 py-1 rounded bg-[#121211] border border-[#3A3832] text-xs font-mono text-[#FAF8F5] shadow-xs"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-[#8C877D] border-t border-[#262420]">
            <span>Tip: Shortcuts function across all active sessions</span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#22201D] hover:bg-[#2C2924] text-xs text-[#FAF8F5] transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
