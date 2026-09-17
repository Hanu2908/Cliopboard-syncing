import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  YAxis,
} from 'recharts';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { DecryptedClipboardItem } from '../types';
import { analyticsService, TelemetrySummary, HourlyBucket } from '../services/analytics';

interface SyncSparklineProps {
  items: DecryptedClipboardItem[];
  isConnected: boolean;
  className?: string;
  defaultExpanded?: boolean;
}

export const SyncSparkline: React.FC<SyncSparklineProps> = ({
  items,
  isConnected,
  className = '',
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [telemetry, setTelemetry] = useState<TelemetrySummary>(() =>
    analyticsService.get24HourTelemetry(items)
  );

  // GSAP animation references
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const totalCounterRef = useRef<HTMLSpanElement>(null);
  const peakCounterRef = useRef<HTMLSpanElement>(null);
  const latencyCounterRef = useRef<HTMLSpanElement>(null);

  // Update telemetry whenever items change
  useEffect(() => {
    const updated = analyticsService.get24HourTelemetry(items);
    setTelemetry(updated);
  }, [items]);

  // GSAP Animated numeric counters & staggered entry
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Numerical counter roll-up for Total Syncs
      if (totalCounterRef.current) {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: telemetry.total24h,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => {
            if (totalCounterRef.current) {
              totalCounterRef.current.textContent = Math.round(obj.val).toString();
            }
          },
        });
      }

      // Numerical counter roll-up for Peak count
      if (peakCounterRef.current) {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: telemetry.peakCount,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => {
            if (peakCounterRef.current) {
              peakCounterRef.current.textContent = Math.round(obj.val).toString();
            }
          },
        });
      }

      // Numerical counter for Latency
      if (latencyCounterRef.current) {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: telemetry.avgLatencyMs,
          duration: 0.7,
          ease: 'power1.out',
          onUpdate: () => {
            if (latencyCounterRef.current) {
              latencyCounterRef.current.textContent = Math.round(obj.val).toString();
            }
          },
        });
      }

      // Subtle GSAP entrance for telemetry metric badges if present
      const badges = containerRef.current?.querySelectorAll('.telemetry-metric-badge');
      if (badges && badges.length > 0) {
        gsap.from(badges, {
          opacity: 0,
          y: 8,
          stagger: 0.08,
          duration: 0.45,
          ease: 'power3.out',
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [telemetry.total24h, telemetry.peakCount, telemetry.avgLatencyMs]);

  // When expanding, run a brief GSAP spring on the chart SVG wrapper
  useEffect(() => {
    if (isExpanded && chartWrapperRef.current) {
      gsap.fromTo(
        chartWrapperRef.current,
        { opacity: 0, scaleY: 0.94 },
        { opacity: 1, scaleY: 1, duration: 0.35, ease: 'back.out(1.2)' }
      );
      const badges = containerRef.current?.querySelectorAll('.telemetry-metric-badge');
      if (badges && badges.length > 0) {
        gsap.fromTo(
          badges,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power3.out' }
        );
      }
    }
  }, [isExpanded]);

  // Transform data for recharts sparkline
  const chartData = useMemo(() => {
    return telemetry.hourlyData.map((d, index) => ({
      hour: d.timeLabel,
      syncs: d.count,
      inbound: d.inboundCount,
      outbound: d.outboundCount,
      isCurrent: d.isCurrent,
      index,
    }));
  }, [telemetry.hourlyData]);

  // Calculate max for YAxis scaling with headroom
  const maxY = Math.max(4, Math.ceil((telemetry.peakCount + 1) * 1.25));

  // Custom Recharts Dark Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as {
        hour: string;
        syncs: number;
        inbound: number;
        outbound: number;
        isCurrent: boolean;
      };
      return (
        <div className="bg-[#181715] border border-[#383632] px-3 py-2 rounded-lg shadow-xl text-xs font-mono text-[#EAE8E2] space-y-1">
          <div className="flex items-center justify-between gap-3 text-[11px] text-[#A8A29E] border-b border-[#282723] pb-1">
            <span>{data.hour} {data.isCurrent ? '(current)' : ''}</span>
            <span className="font-semibold text-[#D97706]">{data.syncs} sync{data.syncs === 1 ? '' : 's'}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[10px] text-[#8C877D]">
            <span>Inbound: {data.inbound}</span>
            <span>Outbound: {data.outbound}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.section
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`rounded-xl border border-[#242320] bg-[#151413] overflow-hidden ${className}`}
    >
      {/* Telemetry Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3.5 py-2.5 bg-[#171614] flex items-center justify-between cursor-pointer select-none hover:bg-[#1D1C1A] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#D97706]" />
          <span className="text-xs font-medium text-[#FAF8F5]">
            24h Activity
          </span>
          <span className="text-[11px] font-mono text-[#8C877D]">
            • {telemetry.total24h} {telemetry.total24h === 1 ? 'sync' : 'syncs'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#8C877D]">
          <span className="hidden sm:inline text-[11px]">
            {isExpanded ? 'Hide graph' : 'Show stats'}
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-0.5 rounded text-[#8C877D] hover:text-[#FAF8F5] transition-colors"
            title={isExpanded ? 'Collapse telemetry' : 'Expand telemetry'}
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Expanded Chart & Stats Area */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Telemetry Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="telemetry-metric-badge p-2.5 rounded-lg bg-[#191816] border border-[#242320]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C877D] mb-1">
                    <TrendingUp className="w-3 h-3 text-[#D97706]" />
                    <span>24h Volume</span>
                  </div>
                  <div className="text-base font-semibold font-mono text-[#FAF8F5]">
                    {telemetry.total24h} <span className="text-[11px] font-normal text-[#8C877D]">syncs</span>
                  </div>
                </div>

                <div className="telemetry-metric-badge p-2.5 rounded-lg bg-[#191816] border border-[#242320]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C877D] mb-1">
                    <Clock className="w-3 h-3 text-[#8C877D]" />
                    <span>Peak Time</span>
                  </div>
                  <div className="text-base font-semibold font-mono text-[#FAF8F5]">
                    {telemetry.peakHour}{' '}
                    <span className="text-[11px] font-normal text-[#8C877D]">
                      (<span ref={peakCounterRef}>{telemetry.peakCount}</span>/h)
                    </span>
                  </div>
                </div>

                <div className="telemetry-metric-badge p-2.5 rounded-lg bg-[#191816] border border-[#242320]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C877D] mb-1">
                    <Zap className="w-3 h-3 text-[#16A34A]" />
                    <span>Avg Latency</span>
                  </div>
                  <div className="text-base font-semibold font-mono text-[#FAF8F5]">
                    ~<span ref={latencyCounterRef}>{telemetry.avgLatencyMs}</span>{' '}
                    <span className="text-[11px] font-normal text-[#8C877D]">ms</span>
                  </div>
                </div>

                <div className="telemetry-metric-badge p-2.5 rounded-lg bg-[#191816] border border-[#242320]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C877D] mb-1">
                    <Cpu className="w-3 h-3 text-[#D6D3CD]" />
                    <span>Mesh Status</span>
                  </div>
                  <div className="text-base font-semibold font-mono text-[#FAF8F5] flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-[#16A34A]' : 'bg-[#D97706]'
                      }`}
                    />
                    <span className="text-xs">
                      {isConnected ? 'Active Relay' : 'Standby'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recharts Area Sparkline Chart (Strictly No Gradients, Solid Warm Palette) */}
              <div ref={chartWrapperRef} className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-[#8C877D] mb-2 px-1">
                  <span>24 hours ago</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#A8A29E]">
                    Hourly Transfer Density
                  </span>
                  <span>Now</span>
                </div>

                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="hour"
                        stroke="#545149"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval={3}
                        tick={{ fill: '#8C877D' }}
                      />
                      <YAxis domain={[0, maxY]} hide />
                      <Tooltip content={<CustomTooltip />} />
                      {/* Area with solid fill color and 12% opacity without gradient */}
                      <Area
                        type="monotone"
                        dataKey="syncs"
                        stroke="#D97706"
                        strokeWidth={2}
                        fill="#D97706"
                        fillOpacity={0.12}
                        isAnimationActive={true}
                        animationDuration={750}
                        activeDot={{
                          r: 4,
                          fill: '#FAF8F5',
                          stroke: '#D97706',
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
