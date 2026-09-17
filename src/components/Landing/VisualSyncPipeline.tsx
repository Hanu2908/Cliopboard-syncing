import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Laptop,
  Smartphone,
  Server,
  Lock,
  ArrowRight,
  Check,
  KeyRound,
  Code2,
  Globe,
  Terminal,
  ShieldCheck,
  Copy,
  Zap,
} from 'lucide-react';
import { playTactileTick, copyToClipboard } from '../../services/clipboard';

interface ClipPreset {
  id: string;
  label: string;
  type: 'token' | 'code' | 'url' | 'otp';
  icon: React.ElementType;
  sourceDevice: string;
  targetDevice: string;
  plaintext: string;
  cipherPreview: string;
}

const PRESETS: ClipPreset[] = [
  {
    id: 'token',
    label: 'API Key',
    type: 'token',
    icon: KeyRound,
    sourceDevice: 'MacBook Pro',
    targetDevice: 'iPhone 15',
    plaintext: 'ghp_live_9f83a00e84b2c7e19d',
    cipherPreview: 'AES-GCM[9f83a00...d4e2]',
  },
  {
    id: 'code',
    label: 'Command',
    type: 'code',
    icon: Terminal,
    sourceDevice: 'ThinkPad Linux',
    targetDevice: 'iPad Pro',
    plaintext: 'docker compose up -d --build',
    cipherPreview: 'AES-GCM[7a149c2...b901]',
  },
  {
    id: 'otp',
    label: '2FA Code',
    type: 'otp',
    icon: ShieldCheck,
    sourceDevice: 'iPhone 15',
    targetDevice: 'MacBook Pro',
    plaintext: '749 203',
    cipherPreview: 'AES-GCM[e1b99a0...33c2]',
  },
  {
    id: 'url',
    label: 'Deep Link',
    type: 'url',
    icon: Globe,
    sourceDevice: 'MacBook Pro',
    targetDevice: 'Android Tablet',
    plaintext: 'https://linear.app/issue/CS-409',
    cipherPreview: 'AES-GCM[34f0aa2...ff18]',
  },
];

export const VisualSyncPipeline: React.FC = () => {
  const [activePreset, setActivePreset] = useState<ClipPreset>(PRESETS[0]);
  const [animatingStep, setAnimatingStep] = useState<'idle' | 'encrypting' | 'relaying' | 'delivered'>('idle');
  const [copiedTarget, setCopiedTarget] = useState(false);

  const handleSelectPreset = (preset: ClipPreset) => {
    playTactileTick({ intensity: 'subtle' });
    setActivePreset(preset);
    setCopiedTarget(false);
    triggerPulse();
  };

  const triggerPulse = () => {
    setAnimatingStep('encrypting');
    setTimeout(() => {
      setAnimatingStep('relaying');
      playTactileTick({ intensity: 'subtle' });
      setTimeout(() => {
        setAnimatingStep('delivered');
        playTactileTick({ intensity: 'medium' });
        setTimeout(() => {
          setAnimatingStep('idle');
        }, 2200);
      }, 400);
    }, 350);
  };

  const handleCopyResult = async () => {
    const success = await copyToClipboard(activePreset.plaintext);
    if (success) {
      playTactileTick({ intensity: 'medium' });
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Preset Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-gothic uppercase tracking-widest text-[#8C877D]">
            Architecture In Action
          </h2>
          <p className="text-lg sm:text-xl font-newblack tracking-tight text-[#FAF8F5]">
            How data moves across your screens
          </p>
        </div>

        {/* Interactive Clip Presets */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#171614] border border-[#242320]">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            const isSelected = activePreset.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-gothic transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#262521] text-[#FAF8F5] border border-[#3A3832] font-semibold'
                    : 'text-[#8C877D] hover:text-[#FAF8F5]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D97706]' : 'text-[#8C877D]'}`} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Pipeline Stage Container */}
      <div className="p-5 sm:p-7 rounded-2xl bg-[#171614] border border-[#262521] space-y-6">
        {/* Three Stage Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* 1. Origin Device */}
          <div className="md:col-span-4 p-4 rounded-xl bg-[#1D1C1A] border border-[#2A2925] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-[#272522] text-[#D97706]">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-gothic text-[#8C877D] uppercase tracking-wider">
                    Source
                  </div>
                  <div className="text-xs font-semibold text-[#FAF8F5]">
                    {activePreset.sourceDevice}
                  </div>
                </div>
              </div>

              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#252420] text-[#D97706] border border-[#32312A]">
                Plaintext
              </span>
            </div>

            {/* Display the source payload */}
            <div className="p-2.5 rounded-lg bg-[#141312] border border-[#22211E] font-mono text-xs text-[#FAF8F5] break-all select-all flex items-center justify-between gap-2">
              <span className="truncate">{activePreset.plaintext}</span>
              <span className="text-[10px] font-gothic px-1.5 py-0.5 rounded bg-[#201F1C] text-[#8C877D] shrink-0">
                Copied
              </span>
            </div>

            <div className="text-[11px] font-after text-[#8C877D]">
              Captured from native OS clipboard without background battery drain.
            </div>
          </div>

          {/* Transfer Channel with Encryption Node */}
          <div className="md:col-span-3 flex flex-col items-center justify-center py-2 md:py-0 text-center space-y-2">
            <div className="relative flex items-center justify-center w-full">
              {/* Connector horizontal track */}
              <div className="hidden md:block absolute h-[2px] bg-[#2A2925] w-full" />

              {/* Encryption Node Badge */}
              <motion.div
                animate={
                  animatingStep === 'encrypting' || animatingStep === 'relaying'
                    ? { scale: [1, 1.08, 1], borderColor: '#D97706' }
                    : { scale: 1, borderColor: '#35342F' }
                }
                transition={{ duration: 0.3 }}
                className="relative z-10 px-3 py-1.5 rounded-lg bg-[#1C1B19] border border-[#2A2925] flex items-center gap-2 shadow-xs"
              >
                <Lock className={`w-3.5 h-3.5 ${animatingStep !== 'idle' ? 'text-[#D97706]' : 'text-[#8C877D]'}`} />
                <span className="text-[11px] font-gothic font-semibold text-[#FAF8F5]">
                  AES-256-GCM
                </span>
              </motion.div>
            </div>

            {/* Relay Status Indicator */}
            <div className="text-[10px] font-mono text-[#8C877D] space-y-0.5">
              <div className="text-[#D97706] font-medium truncate max-w-[180px]">
                {activePreset.cipherPreview}
              </div>
              <div>Opaque Relay • 0 Server Logs</div>
            </div>

            {/* Interactive Pulse Trigger */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerPulse}
              className="mt-1 px-2.5 py-1 rounded bg-[#24231F] hover:bg-[#2F2E28] border border-[#33322C] text-[11px] font-gothic text-[#FAF8F5] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-[#D97706]" />
              <span>Simulate Beam</span>
            </motion.button>
          </div>

          {/* 2. Destination Device */}
          <div className="md:col-span-4 p-4 rounded-xl bg-[#1D1C1A] border border-[#2A2925] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-[#272522] text-[#16A34A]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-gothic text-[#8C877D] uppercase tracking-wider">
                    Destination
                  </div>
                  <div className="text-xs font-semibold text-[#FAF8F5]">
                    {activePreset.targetDevice}
                  </div>
                </div>
              </div>

              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#192718] text-[#16A34A] border border-[#243B22]">
                Decrypted
              </span>
            </div>

            {/* Display Destination Payload */}
            <div className="p-2.5 rounded-lg bg-[#141312] border border-[#22211E] font-mono text-xs text-[#FAF8F5] break-all flex items-center justify-between gap-2">
              <span className="truncate">{activePreset.plaintext}</span>
              <button
                onClick={handleCopyResult}
                className="p-1 rounded bg-[#22211E] hover:bg-[#2B2925] text-[#8C877D] hover:text-[#FAF8F5] transition-colors cursor-pointer shrink-0"
                title="Copy to real clipboard"
              >
                {copiedTarget ? (
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="text-[11px] font-after text-[#8C877D]">
              Decrypted directly in recipient memory using the shared room secret.
            </div>
          </div>
        </div>

        {/* Technical Specs Footer of the Pipeline */}
        <div className="pt-4 border-t border-[#23221F] grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-3 rounded-lg bg-[#141312] border border-[#1E1D1A] space-y-1">
            <div className="text-[11px] font-gothic font-semibold text-[#FAF8F5]">
              Local Key Generation
            </div>
            <div className="text-[11px] font-after text-[#8C877D]">
              Keys never leave the browser runtime; derived from high-entropy PBKDF2 hash.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#141312] border border-[#1E1D1A] space-y-1">
            <div className="text-[11px] font-gothic font-semibold text-[#FAF8F5]">
              Ephemeral Relay Routing
            </div>
            <div className="text-[11px] font-after text-[#8C877D]">
              In-memory WebSocket routing buffers discard messages immediately upon dispatch.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#141312] border border-[#1E1D1A] space-y-1">
            <div className="text-[11px] font-gothic font-semibold text-[#FAF8F5]">
              Offline Outbox Queue
            </div>
            <div className="text-[11px] font-after text-[#8C877D]">
              Stores encrypted payloads in IndexedDB and flushes whenever connectivity restores.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
