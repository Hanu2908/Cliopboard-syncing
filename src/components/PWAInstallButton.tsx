import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running standalone
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E1D1B] border border-[#2B2A27] text-xs text-[#8C877D]">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>Application is installed and running in Standalone mode</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback for browsers without beforeinstallprompt or desktop
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Install ClipSync as a Progressive Web App"
        className={`flex items-center gap-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
          variant === 'header'
            ? 'px-2.5 py-1.5 text-xs bg-[#24221D] hover:bg-[#2F2C24] text-[#D97706] border border-[#483B1E]'
            : variant === 'settings'
            ? 'w-full justify-center px-4 py-2.5 text-xs bg-[#24221D] hover:bg-[#2F2C24] text-[#D97706] border border-[#483B1E]'
            : 'px-3 py-1.5 text-xs bg-[#1E1D1B] hover:bg-[#282622] text-[#FAF8F5] border border-[#35332E]'
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </motion.button>

      {/* iOS & Manual Desktop Installation Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-xl bg-[#181715] border border-[#383632] p-5 shadow-2xl text-[#EAE8E2]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#282622]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#24221D] border border-[#483B1E] flex items-center justify-center text-[#D97706]">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#FAF8F5]">
                    Install ClipSync PWA
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded text-[#8C877D] hover:text-[#FAF8F5] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-[#A8A29E] leading-relaxed">
                {isIOS ? (
                  <>
                    <p className="text-[#FAF8F5] font-medium">To install on iPhone or iPad:</p>
                    <div className="space-y-2 pl-1">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#24221D] text-[#D97706] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          1
                        </span>
                        <span>
                          Tap the <strong className="text-[#FAF8F5]">Share</strong> button <Share className="w-3.5 h-3.5 inline text-[#D97706]" /> in Safari's bottom toolbar.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#24221D] text-[#D97706] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          2
                        </span>
                        <span>
                          Scroll down and select <strong className="text-[#FAF8F5]">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#D97706]" />.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#24221D] text-[#D97706] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          3
                        </span>
                        <span>
                          Tap <strong className="text-[#FAF8F5]">Add</strong> at the top right to launch ClipSync in standalone fullscreen.
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[#FAF8F5] font-medium">To install on your desktop / laptop:</p>
                    <div className="space-y-2 pl-1">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#24221D] text-[#D97706] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          1
                        </span>
                        <span>
                          Click the <strong className="text-[#FAF8F5]">Install</strong> icon in your browser's address bar (top right).
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#24221D] text-[#D97706] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          2
                        </span>
                        <span>
                          Alternatively open browser menu <strong className="text-[#FAF8F5]">⋮</strong> → <strong className="text-[#FAF8F5]">Install ClipSync</strong> or <strong className="text-[#FAF8F5]">Save and Share</strong>.
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full py-2 px-3 rounded-lg bg-[#24221D] hover:bg-[#2F2C24] border border-[#483B1E] text-xs font-medium text-[#D97706] transition-colors"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
