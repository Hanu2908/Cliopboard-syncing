import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, EyeOff, Eye, Command } from 'lucide-react';
import { ShortcutToastInfo } from '../hooks/useGlobalShortcuts';

interface ShortcutToastProps {
  toast: ShortcutToastInfo | null;
  onDismiss: () => void;
}

export const ShortcutToast: React.FC<ShortcutToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isSuccess = toast.type === 'sync-success';
  const isError = toast.type === 'sync-error';
  const isVisibility = toast.type === 'visibility-toggled';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#181715] border border-[#3D3A33] shadow-2xl text-[#EAE8E2] max-w-md pointer-events-auto select-none"
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isSuccess
              ? 'bg-[#1C2519] border border-[#2E4226] text-[#16A34A]'
              : isError
              ? 'bg-[#2B1B19] border border-[#482823] text-[#DC2626]'
              : 'bg-[#24221D] border border-[#483B1E] text-[#D97706]'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Command className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-[#FAF8F5] truncate">
            {toast.message}
          </div>
          {toast.detail && (
            <div className="text-[11px] text-[#8C877D] truncate mt-0.5 font-mono">
              {toast.detail}
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#201F1D] text-[#8C877D] hover:text-[#FAF8F5] transition-colors"
        >
          ESC
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
