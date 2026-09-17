import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  QrCode,
  Key,
  Shield,
  Smartphone,
  Laptop,
  CheckCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { playTactileTick } from '../../services/clipboard';

export const VisualPairingFlow: React.FC = () => {
  const [pairCode, setPairCode] = useState('784-219');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeMode, setActiveMode] = useState<'qr' | 'code'>('qr');

  const handleRegenerate = () => {
    playTactileTick({ intensity: 'subtle' });
    setIsRegenerating(true);
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(100 + Math.random() * 900);
    setTimeout(() => {
      setPairCode(`${part1}-${part2}`);
      setIsRegenerating(false);
    }, 250);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-gothic uppercase tracking-widest text-[#8C877D]">
            Zero-Friction Onboarding
          </h2>
          <p className="text-lg sm:text-xl font-newblack tracking-tight text-[#FAF8F5]">
            Link devices in under two seconds
          </p>
        </div>

        {/* Tab switch for pairing method */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#171614] border border-[#242320]">
          <button
            onClick={() => {
              playTactileTick({ intensity: 'subtle' });
              setActiveMode('qr');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-gothic transition-colors cursor-pointer ${
              activeMode === 'qr'
                ? 'bg-[#262521] text-[#FAF8F5] border border-[#3A3832] font-semibold'
                : 'text-[#8C877D] hover:text-[#FAF8F5]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Scan</span>
          </button>
          <button
            onClick={() => {
              playTactileTick({ intensity: 'subtle' });
              setActiveMode('code');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-gothic transition-colors cursor-pointer ${
              activeMode === 'code'
                ? 'bg-[#262521] text-[#FAF8F5] border border-[#3A3832] font-semibold'
                : 'text-[#8C877D] hover:text-[#FAF8F5]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>6-Digit Code</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-7 rounded-2xl bg-[#171614] border border-[#262521] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Side: Visual Interactive Pairing Terminal */}
        <div className="md:col-span-5 p-5 rounded-xl bg-[#1D1C1A] border border-[#2A2925] flex flex-col items-center text-center space-y-4">
          <div className="w-full flex items-center justify-between text-xs font-gothic text-[#8C877D]">
            <span>Ephemeral Pair Token</span>
            <button
              onClick={handleRegenerate}
              className="p-1 rounded hover:bg-[#252420] text-[#8C877D] hover:text-[#FAF8F5] transition-colors cursor-pointer"
              title="Generate new token"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-[#D97706]' : ''}`} />
            </button>
          </div>

          {activeMode === 'qr' ? (
            /* Visual Scalable SVG QR code representation */
            <div className="p-4 rounded-lg bg-[#FAF8F5] text-[#121211] shadow-inner flex flex-col items-center justify-center">
              <svg
                viewBox="0 0 80 80"
                className="w-32 h-32"
                fill="currentColor"
                aria-label="Encrypted pairing QR representation"
              >
                {/* 3 finder patterns */}
                <rect x="5" y="5" width="22" height="22" fill="#121211" />
                <rect x="8" y="8" width="16" height="16" fill="#FAF8F5" />
                <rect x="11" y="11" width="10" height="10" fill="#121211" />

                <rect x="53" y="5" width="22" height="22" fill="#121211" />
                <rect x="56" y="8" width="16" height="16" fill="#FAF8F5" />
                <rect x="59" y="11" width="10" height="10" fill="#121211" />

                <rect x="5" y="53" width="22" height="22" fill="#121211" />
                <rect x="8" y="56" width="16" height="16" fill="#FAF8F5" />
                <rect x="11" y="59" width="10" height="10" fill="#121211" />

                {/* Data modules */}
                <rect x="32" y="8" width="5" height="5" fill="#121211" />
                <rect x="42" y="14" width="5" height="5" fill="#121211" />
                <rect x="35" y="22" width="5" height="5" fill="#121211" />
                <rect x="8" y="34" width="5" height="5" fill="#121211" />
                <rect x="18" y="38" width="5" height="5" fill="#121211" />
                <rect x="25" y="30" width="5" height="5" fill="#121211" />
                <rect x="33" y="33" width="14" height="14" fill="#D97706" />
                <rect x="52" y="34" width="5" height="5" fill="#121211" />
                <rect x="62" y="40" width="5" height="5" fill="#121211" />
                <rect x="40" y="52" width="5" height="5" fill="#121211" />
                <rect x="32" y="60" width="5" height="5" fill="#121211" />
                <rect x="48" y="62" width="5" height="5" fill="#121211" />
                <rect x="60" y="55" width="5" height="5" fill="#121211" />
                <rect x="68" y="65" width="5" height="5" fill="#121211" />
              </svg>
            </div>
          ) : (
            /* Numeric 6-digit Code Representation */
            <div className="py-8 px-6 rounded-lg bg-[#141312] border border-[#23221F] w-full text-center space-y-2">
              <div className="font-mono text-3xl font-bold tracking-widest text-[#D97706]">
                {pairCode}
              </div>
              <div className="text-[11px] font-gothic text-[#8C877D]">
                Expires in 15 minutes • Single room scope
              </div>
            </div>
          )}

          <div className="text-xs font-mono text-[#8C877D] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span>Ready for peer scan</span>
          </div>
        </div>

        {/* Right Side: Step-by-Step Visual Explanation */}
        <div className="md:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-[#1D1C1A] border border-[#2A2925] space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-[#252420] text-[#D97706]">
                <Laptop className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-gothic font-semibold text-[#FAF8F5]">
                1. Open ClipSync on any computer
              </span>
            </div>
            <p className="text-xs font-after text-[#8C877D] leading-relaxed">
              Instantly provisions a random room code and an AES-256 cryptographic keypair inside your browser memory.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1D1C1A] border border-[#2A2925] space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-[#252420] text-[#D97706]">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-gothic font-semibold text-[#FAF8F5]">
                2. Scan with your phone or secondary browser
              </span>
            </div>
            <p className="text-xs font-after text-[#8C877D] leading-relaxed">
              No native apps required. The URL contains the room identifier and decryption hash fragment, so the server never learns your key.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1D1C1A] border border-[#2A2925] space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-[#252420] text-[#16A34A]">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-gothic font-semibold text-[#FAF8F5]">
                3. Continuous real-time synchronization
              </span>
            </div>
            <p className="text-xs font-after text-[#8C877D] leading-relaxed">
              Copy on any connected screen. It immediately appears on all others with full offline IndexedDB backup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
