import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Shield,
  Lock,
  Wifi,
  CheckCircle2,
} from 'lucide-react';
import { LandingNavbar } from './LandingNavbar';
import { VisualSyncPipeline } from './VisualSyncPipeline';
import { VisualPairingFlow } from './VisualPairingFlow';
import { playTactileTick } from '../../services/clipboard';

interface LandingPageProps {
  onLaunchApp: () => void;
  roomCode?: string;
  isMeshConnected?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  roomCode,
  isMeshConnected = true,
}) => {
  const [activeGuarantee, setActiveGuarantee] = useState<number | null>(null);

  const handleLaunch = () => {
    playTactileTick({ intensity: 'medium' });
    onLaunchApp();
  };

  // Physical keyboard listener for interactive keycaps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        if (e.altKey) {
          playTactileTick({ intensity: 'medium' });
          onLaunchApp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onLaunchApp]);

  const guarantees = [
    {
      title: 'Zero-Knowledge Crypto',
      description:
        'Keys are generated and stored strictly in browser memory. The relay server never sees your plaintexts.',
      proof: 'PBKDF2 100,000 SHA-256 rounds • 12-byte IV per clip',
      icon: Lock,
    },
    {
      title: '0 Accounts or Tracking',
      description:
        'No email, no phone numbers, no cookies, and no tracking scripts. Rooms are ephemeral and auto-expire.',
      proof: 'Zero persistent cookies • Ephemeral RAM memory only',
      icon: Shield,
    },
    {
      title: 'Offline-First Resilience',
      description:
        'Installed as a standalone PWA. Clips sync locally to IndexedDB and automatically push once reconnected.',
      proof: 'W3C CacheStorage • Auto-replaying IndexedDB outbox',
      icon: Wifi,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-[#121211] text-[#EAE8E2] antialiased selection:bg-[#EAE8E2] selection:text-[#121211] flex flex-col font-sans"
    >
      {/* Minimal Header with Scroll Progress */}
      <LandingNavbar onLaunchApp={handleLaunch} isMeshConnected={isMeshConnected} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-12 md:py-20 space-y-16 md:space-y-24">
        {/* Focused Minimal Hero */}
        <section className="text-center space-y-6 max-w-2xl mx-auto">
          {/* Subtle Live Badge */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1917] border border-[#2B2A25] text-xs font-gothic text-[#D6D3CD]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            <span>Encrypted Cross-Device Clipboard</span>
            <span className="text-[#55524B]">•</span>
            <span className="text-[#FAF8F5]">Zero Accounts Required</span>
          </motion.div>

          {/* Main Headline in NewBlack */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-3xl sm:text-5xl md:text-6xl font-newblack tracking-tight text-[#FAF8F5] leading-[1.08]"
          >
            Instant clipboard sync between your machines.
          </motion.h1>

          {/* Calm Subhead in After */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="font-after text-sm sm:text-base text-[#A8A29E] leading-relaxed font-normal max-w-xl mx-auto"
          >
            Copy on your laptop. Paste on your phone or desktop.
            Zero accounts, zero logs, end-to-end encrypted with local AES-256-GCM keys.
          </motion.p>

          {/* Primary Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLaunch}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-gothic font-semibold shadow-md transition-colors cursor-pointer"
            >
              <span>Launch Sync Mesh</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Keyboard Shortcut Hint */}
          <div className="pt-1 flex items-center justify-center gap-2 text-xs font-gothic text-[#8C877D]">
            <span>Press</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                playTactileTick({ intensity: 'subtle' });
                onLaunchApp();
              }}
              className="px-2 py-0.5 rounded bg-[#1A1917] hover:bg-[#252420] border border-[#2B2A25] text-[#D6D3CD] cursor-pointer transition-colors"
              title="Click or press Alt + L on keyboard to open app"
            >
              <kbd className="font-semibold text-[#FAF8F5]">Alt</kbd> + <kbd className="font-semibold text-[#FAF8F5]">L</kbd>
            </motion.button>
            <span>to open workspace</span>
          </div>
        </section>

        {/* Visual Component 1: Interactive Cross-Screen Sync Pipeline */}
        <section>
          <VisualSyncPipeline />
        </section>

        {/* Visual Component 2: Interactive Zero-Friction Pairing Flow */}
        <section>
          <VisualPairingFlow />
        </section>

        {/* Core Guarantees */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-gothic uppercase tracking-widest text-[#8C877D]">
              Privacy & Performance
            </h2>
            <p className="text-lg sm:text-xl font-newblack tracking-tight text-[#FAF8F5]">
              Built for speed and complete confidentiality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guarantees.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = activeGuarantee === idx;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setActiveGuarantee(isSelected ? null : idx);
                    playTactileTick({ intensity: 'subtle' });
                  }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1917] border-[#D97706]/70 shadow-xs'
                      : 'bg-[#171614] border-[#242320] hover:border-[#35342F]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-[#201E1B] text-[#D97706] w-fit">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-gothic text-[#78746C] hover:text-[#D97706] transition-colors">
                      {isSelected ? 'Hide proof' : 'Verify'}
                    </span>
                  </div>

                  <h3 className="text-sm font-gothic font-semibold text-[#FAF8F5] pt-3">
                    {item.title}
                  </h3>

                  <p className="font-after text-xs text-[#8C877D] leading-relaxed pt-1">
                    {item.description}
                  </p>

                  {/* Interactive Proof Reveal */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-2.5 border-t border-[#252420] text-[11px] font-mono text-[#16A34A] flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        <span>{item.proof}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Minimal Bottom CTA Banner in NewBlack & Gothic */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#171614] border border-[#242320] text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-newblack tracking-tight text-[#FAF8F5]">
            Ready to link your screens?
          </h3>
          <p className="font-after text-xs sm:text-sm text-[#8C877D] max-w-md mx-auto">
            No installation required. Works across all modern desktop and mobile browsers.
          </p>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleLaunch}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-gothic font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <span>Open ClipSync Mesh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </section>
      </main>

      {/* Minimal Footer in Gothic & After */}
      <footer className="border-t border-[#201F1C] bg-[#121211] py-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-gothic text-[#78746C]">
          <div className="flex items-center gap-2">
            <span className="font-newblack text-[#FAF8F5] tracking-tight">ClipSync</span>
            <span>•</span>
            <span>Zero-Knowledge Relay</span>
            <span>•</span>
            <span>0 Logs</span>
          </div>

          <button
            onClick={handleLaunch}
            className="hover:text-[#FAF8F5] transition-colors cursor-pointer"
          >
            Launch Mesh Workspace →
          </button>
        </div>
      </footer>
    </motion.div>
  );
};
