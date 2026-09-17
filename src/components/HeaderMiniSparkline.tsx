import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity } from 'lucide-react';
import { DecryptedClipboardItem } from '../types';
import { analyticsService } from '../services/analytics';

interface HeaderMiniSparklineProps {
  items: DecryptedClipboardItem[];
  onOpenAnalytics?: () => void;
}

export const HeaderMiniSparkline: React.FC<HeaderMiniSparklineProps> = ({
  items,
  onOpenAnalytics,
}) => {
  const telemetry = useMemo(() => analyticsService.get24HourTelemetry(items), [items]);
  const sparklineRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  // Animate mini sparkline with GSAP on data change
  useEffect(() => {
    if (!sparklineRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sparklineRef.current,
        { opacity: 0.7, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }
      );

      if (countRef.current) {
        gsap.fromTo(
          countRef.current,
          { scale: 1.15 },
          { scale: 1, duration: 0.3, ease: 'back.out(2)' }
        );
      }
    }, sparklineRef);

    return () => ctx.revert();
  }, [telemetry.total24h]);

  const chartData = useMemo(() => {
    return telemetry.hourlyData.map((d) => ({ val: d.count }));
  }, [telemetry.hourlyData]);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onOpenAnalytics}
      title="View 24-hour sync frequency & telemetry"
      className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#191816] hover:bg-[#22211F] border border-[#2B2A27] text-xs transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#D6D3CD]">
        <Activity className="w-3 h-3 text-[#D97706]" />
        <span ref={countRef} className="font-semibold text-[#FAF8F5]">
          {telemetry.total24h}
        </span>
        <span className="text-[#8C877D] text-[10px]">24h</span>
      </div>

      {/* Mini 44px Recharts Sparkline */}
      <div ref={sparklineRef} className="w-11 h-4 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 1, right: 0, left: 0, bottom: 0 }}>
            <Area
              type="monotone"
              dataKey="val"
              stroke="#D97706"
              strokeWidth={1.5}
              fill="#D97706"
              fillOpacity={0.15}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.button>
  );
};
