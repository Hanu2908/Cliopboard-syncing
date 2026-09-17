import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#1D1B17] border border-[#59441D] text-[#D97706] shadow-xl text-xs font-mono"
        >
          <WifiOff className="w-4 h-4 text-[#D97706] shrink-0" />
          <span className="text-[#FAF8F5]">Offline Mode</span>
          <span className="text-[#8C877D] text-[11px]">— Changes will resync automatically</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
