import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Check,
  Edit2,
  Share2,
  ShieldCheck,
  Circle,
} from 'lucide-react';
import { Device } from '../types';

interface DeviceListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  currentDeviceId: string;
  onUpdateDeviceName: (name: string) => void;
  onOpenPairing: () => void;
}

export const DeviceListDrawer: React.FC<DeviceListDrawerProps> = ({
  isOpen,
  onClose,
  devices,
  currentDeviceId,
  onUpdateDeviceName,
  onOpenPairing,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const currentDev = devices.find((d) => d.id === currentDeviceId);
  const [nameInput, setNameInput] = useState(currentDev?.name || '');

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateDeviceName(nameInput.trim());
      setIsEditingName(false);
    }
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
      <div className="fixed inset-0 z-50 flex justify-end bg-[#0A0A09]/75 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-md h-full bg-[#161514] border-l border-[#292825] flex flex-col shadow-2xl text-[#EAE8E2]"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#262522]">
            <div>
              <h2 className="text-sm font-semibold text-[#FAF8F5] tracking-wide">
                Connected Devices
              </h2>
              <p className="text-xs text-[#8C877D]">
                {devices.length} active device{devices.length !== 1 ? 's' : ''} in sync mesh
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8C877D] hover:text-[#FAF8F5] hover:bg-[#22211E] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Device list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-xs font-mono text-[#8C877D] uppercase tracking-wider">
              Active Mesh Nodes
            </div>

            <div className="space-y-2.5">
              {devices.map((device) => {
                const isCurrent = device.id === currentDeviceId;
                return (
                  <div
                    key={device.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-[#1D1C19] border-[#443E2C]'
                        : 'bg-[#181715] border-[#262521]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#242320] border border-[#34322D] flex items-center justify-center">
                          {getDeviceIcon(device.type)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#FAF8F5]">
                              {device.name}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#2B2A24] border border-[#4D452B] text-[#D97706]">
                                This Device
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#8C877D] font-mono">
                            <Circle className="w-2 h-2 fill-[#16A34A] text-[#16A34A]" />
                            <span>Online</span>
                            <span>•</span>
                            <span className="capitalize">{device.type}</span>
                          </div>
                        </div>
                      </div>

                      {isCurrent && !isEditingName && (
                        <button
                          onClick={() => {
                            setNameInput(device.name);
                            setIsEditingName(true);
                          }}
                          className="p-1.5 rounded text-[#8C877D] hover:text-[#FAF8F5] hover:bg-[#2A2926] transition-colors"
                          title="Rename this device"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isCurrent && isEditingName && (
                      <form onSubmit={handleSaveName} className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-[#121211] border border-[#3A3833] rounded text-[#FAF8F5]"
                          placeholder="Device name..."
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-[#D97706] text-black font-medium text-xs rounded hover:bg-[#B45309]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(false)}
                          className="px-2.5 py-1 bg-[#242320] text-[#8C877D] text-xs rounded hover:text-[#FAF8F5]"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Zero-knowledge notice */}
            <div className="p-4 rounded-xl bg-[#191816] border border-[#2B2A27] space-y-2 mt-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#EAE8E2]">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                Zero-Knowledge Mesh
              </div>
              <p className="text-xs text-[#8C877D] leading-relaxed">
                When any device copies or pastes, the payload is encrypted locally with your room key before being broadcast over the WebSocket relay.
              </p>
            </div>
          </div>

          {/* Drawer footer */}
          <div className="p-6 border-t border-[#262522] bg-[#1A1918]">
            <button
              onClick={() => {
                onClose();
                onOpenPairing();
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-[#2B2A26] hover:bg-[#383632] border border-[#44423D] text-xs font-medium text-[#FAF8F5] transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-[#D97706]" />
              Connect Another Device (QR / Link)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
