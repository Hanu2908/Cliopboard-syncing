import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { playTactileTick } from '../../services/clipboard';

interface LandingNavbarProps {
  onLaunchApp: () => void;
  isMeshConnected?: boolean;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLaunchApp,
  isMeshConnected = true,
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const handleLaunch = () => {
    playTactileTick({ intensity: 'subtle' });
    onLaunchApp();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#22211E] bg-[#121211]/95 backdrop-blur-md transition-colors">
      {/* Scroll Progress Bar (Strictly solid amber, no gradients) */}
      <motion.div
        className="h-[2px] bg-[#D97706] origin-left w-full"
        style={{ scaleX }}
      />

      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-8 py-3">
        {/* Brand & Minimal Status */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.92 }}
            className="w-7 h-7 rounded-md bg-[#1B1A18] border border-[#2B2A26] flex items-center justify-center text-[#D97706] cursor-pointer"
            onClick={handleLaunch}
          >
            <ShieldCheck className="w-4 h-4 text-[#D97706]" />
          </motion.div>

          <div className="flex items-center gap-2">
            <span className="font-newblack text-base tracking-tight text-[#FAF8F5]">
              ClipSync
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#181715] border border-[#252420] text-[10px] font-gothic text-[#8C877D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              Relay Online
            </span>
          </div>
        </div>

        {/* Single Primary Action with Micro-Interactions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleLaunch}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-gothic font-medium transition-colors cursor-pointer shadow-xs"
          >
            <span>Open Mesh</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};
