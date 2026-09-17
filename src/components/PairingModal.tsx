import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Key,
  ShieldCheck,
  ArrowRight,
  Plus,
  Lock,
} from 'lucide-react';
import { generateRoomCode, generateSecretKey, deriveDefaultSecretFromRoomCode } from '../services/crypto';
import { copyToClipboard, playTactileTick } from '../services/clipboard';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  secretKey: string;
  onSwitchRoom: (newCode: string, newSecret: string) => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  secretKey,
  onSwitchRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'pair' | 'join'>('pair');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // For join tab
  const [inputCode, setInputCode] = useState('');
  const [inputSecret, setInputSecret] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Build direct pair URL with query params (guaranteed preservation by all phone camera QR scanners)
  const pairUrl = useMemo(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomCode);
      if (secretKey) {
        url.searchParams.set('key', secretKey);
      }
      url.hash = 'app';
      return url.toString();
    } catch {
      return `${window.location.origin}/?room=${encodeURIComponent(roomCode)}&key=${encodeURIComponent(secretKey)}#app`;
    }
  }, [roomCode, secretKey]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(pairUrl);
    if (success) {
      playTactileTick();
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomCode);
    if (success) {
      playTactileTick();
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopySecret = async () => {
    const success = await copyToClipboard(secretKey);
    if (success) {
      playTactileTick();
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Please enter a room code (e.g. 742-891)');
      return;
    }
    const cleanSecret = inputSecret.trim() || deriveDefaultSecretFromRoomCode(cleanCode);
    onSwitchRoom(cleanCode, cleanSecret);
    onClose();
  };

  const handleCreateNewRoom = () => {
    const newCode = generateRoomCode();
    const newSecret = generateSecretKey(newCode);
    onSwitchRoom(newCode, newSecret);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A09]/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-lg bg-[#161514] border border-[#2D2C29] rounded-xl shadow-2xl overflow-hidden text-[#EAE8E2]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#262522]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#22211E] border border-[#34322E] text-[#D97706]">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#FAF8F5] tracking-wide">
                  Device Pairing
                </h2>
                <p className="text-xs text-[#8C877D]">Connect phone, tablet, or secondary PC</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8C877D] hover:text-[#FAF8F5] hover:bg-[#22211E] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation tabs */}
          <div className="flex border-b border-[#262522] bg-[#1A1917] px-6">
            <button
              onClick={() => setActiveTab('pair')}
              className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'pair'
                  ? 'border-[#D97706] text-[#FAF8F5]'
                  : 'border-transparent text-[#8C877D] hover:text-[#D6D3CD]'
              }`}
            >
              Pair Current Room
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'join'
                  ? 'border-[#D97706] text-[#FAF8F5]'
                  : 'border-transparent text-[#8C877D] hover:text-[#D6D3CD]'
              }`}
            >
              Join / Change Room
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'pair' ? (
              <div className="space-y-5">
                {/* QR Code and Code box */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-lg bg-[#1D1C1A] border border-[#2B2A27]">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={pairUrl}
                      size={130}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div className="flex-1 w-full text-center sm:text-left space-y-2">
                    <div className="text-[11px] uppercase tracking-wider font-mono text-[#8C877D]">
                      Scan with camera or enter code:
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-mono text-2xl font-bold tracking-widest text-[#FAF8F5] px-2 py-0.5 bg-[#262522] border border-[#383632] rounded">
                        {roomCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="p-2 rounded bg-[#262522] hover:bg-[#32302C] border border-[#383632] text-[#A8A29E] hover:text-[#FAF8F5] transition-colors"
                        title="Copy Code"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-[#D6D3CD]">
                      Scanning this QR automatically opens the app on your phone and connects it to Room <span className="font-mono text-[#FAF8F5] font-medium">{roomCode}</span>.
                    </p>
                    <div className="text-[11px] text-[#8C877D] bg-[#22211E] p-2 rounded border border-[#2D2C28]">
                      Note: Devices open with their own private room by default. Scanning the QR or entering the code brings them into this shared mesh.
                    </div>
                  </div>
                </div>

                {/* Direct pair link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#D6D3CD] flex items-center justify-between">
                    <span>Direct Share Link</span>
                    <span className="text-[11px] text-[#8C877D] font-mono">Includes encryption key</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pairUrl}
                      className="w-full px-3 py-2 text-xs bg-[#1A1917] border border-[#2B2A27] rounded-md font-mono text-[#A8A29E] truncate select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-[#2B2A26] hover:bg-[#383632] border border-[#44423D] text-xs font-medium text-[#FAF8F5] rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Security info */}
                <div className="p-3.5 rounded-lg bg-[#1A1917] border border-[#2B2A27] flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="font-medium text-[#EAE8E2]">End-to-End Encrypted Room</div>
                    <p className="text-[#8C877D] leading-relaxed">
                      Clipboard contents are encrypted client-side using AES-GCM 256. The relay server cannot read your text, code snippets, or media.
                    </p>
                    <div className="pt-1 flex items-center gap-2 font-mono text-[11px] text-[#A8A29E]">
                      <Key className="w-3 h-3 text-[#D97706]" />
                      <span className="truncate max-w-[220px]">Key: {secretKey.slice(0, 10)}...</span>
                      <button
                        onClick={handleCopySecret}
                        className="text-[#D97706] hover:underline"
                      >
                        {copiedSecret ? 'Copied' : 'Copy Key'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={handleCreateNewRoom}
                    className="flex items-center gap-1.5 text-xs text-[#A8A29E] hover:text-[#FAF8F5] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Fresh Room
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-[#262522] hover:bg-[#32302C] border border-[#3A3834] rounded-md text-xs font-medium text-[#FAF8F5] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <p className="text-xs text-[#A8A29E]">
                  Enter the 6-digit code displayed on another device to join their clipboard sync mesh.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#D6D3CD]">Room Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. 742-891"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full px-3 py-2 bg-[#1A1917] border border-[#2B2A27] rounded-md font-mono text-sm uppercase text-[#FAF8F5] placeholder-[#5A5852]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#D6D3CD] flex items-center justify-between">
                    <span>Encryption Passphrase / Secret Key</span>
                    <span className="text-[11px] text-[#8C877D]">Optional if default</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Paste secret key if required..."
                      value={inputSecret}
                      onChange={(e) => setInputSecret(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#1A1917] border border-[#2B2A27] rounded-md font-mono text-xs text-[#FAF8F5] placeholder-[#5A5852]"
                    />
                    <Lock className="w-4 h-4 text-[#8C877D] absolute left-3 top-2.5" />
                  </div>
                </div>

                {errorMsg && (
                  <div className="text-xs text-[#EA580C] bg-[#2A1810] border border-[#52291E] p-2 rounded">
                    {errorMsg}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pair')}
                    className="px-4 py-2 bg-[#1A1917] hover:bg-[#22211E] border border-[#2B2A27] rounded-md text-xs text-[#A8A29E]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-black font-medium text-xs rounded-md transition-colors"
                  >
                    Connect Room
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
