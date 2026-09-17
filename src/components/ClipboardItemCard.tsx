import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Copy,
  Check,
  Star,
  Trash2,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Code,
  Link as LinkIcon,
  Type,
  Image as ImageIcon,
  Clock,
  CloudUpload,
} from 'lucide-react';
import { DecryptedClipboardItem } from '../types';
import { copyToClipboard, playTactileTick } from '../services/clipboard';

interface ClipboardItemCardProps {
  item: DecryptedClipboardItem;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  hasAnySelected?: boolean;
}

export const ClipboardItemCard: React.FC<ClipboardItemCardProps> = ({
  item,
  onDelete,
  onTogglePin,
  isSelected = false,
  onToggleSelect,
  hasAnySelected = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(item.content);
    if (success) {
      playTactileTick();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDeviceIcon = () => {
    switch (item.senderType) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5 text-[#D97706]" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-[#D97706]" />;
      case 'desktop':
        return <Laptop className="w-3.5 h-3.5 text-[#D97706]" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-[#D97706]" />;
    }
  };

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / (60 * 1000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isLong = item.content.length > 360 && !item.content.startsWith('data:image/');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className={`group relative rounded-xl border transition-all duration-200 ${
        isSelected
          ? 'bg-[#191816] border-[#D97706] ring-1 ring-[#D97706]/30 shadow-md'
          : item.pinned
          ? 'bg-[#171614] border-[#4A3B18] shadow-sm'
          : 'bg-[#161514] border-[#262522] hover:border-[#35332E]'
      }`}
    >
      {/* Top Header metadata */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Multi-select checkbox */}
          {onToggleSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(item.id);
              }}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#D97706] border-[#D97706] text-black shadow-sm'
                  : hasAnySelected
                  ? 'border-[#4A4740] bg-[#22211E] hover:border-[#D97706]'
                  : 'opacity-0 group-hover:opacity-100 border-[#44413A] bg-[#201F1D] hover:border-[#D97706]'
              }`}
              title={isSelected ? 'Deselect item' : 'Select item'}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[#D6D3CD] font-medium text-xs">
            {getDeviceIcon()}
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{item.senderName}</span>
          </div>

          <span className="text-[#4E4A43]">•</span>

          <span className="text-[#7E7A72] font-mono text-[11px]">
            {formatTimestamp(item.timestamp)}
          </span>

          {item.syncStatus === 'pending' && (
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#2D2114] border border-[#523A1B] text-[10px] text-[#D97706] font-mono">
              <CloudUpload className="w-2.5 h-2.5 animate-pulse" />
              Queued
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Content Type badge */}
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#201F1D] text-[#8C877D] border border-[#2B2A27] flex items-center gap-1">
            {item.contentType === 'code' ? (
              <>
                <Code className="w-2.5 h-2.5 text-[#D97706]" />
                {item.language || 'code'}
              </>
            ) : item.contentType === 'link' ? (
              <>
                <LinkIcon className="w-2.5 h-2.5 text-[#D97706]" />
                link
              </>
            ) : item.contentType === 'image' ? (
              <>
                <ImageIcon className="w-2.5 h-2.5 text-[#D97706]" />
                img
              </>
            ) : (
              'text'
            )}
          </span>

          {/* Pin button */}
          <button
            onClick={() => onTogglePin(item.id)}
            className={`p-1 rounded transition-colors cursor-pointer ${
              item.pinned
                ? 'text-[#D97706]'
                : 'text-[#635F57] hover:text-[#A8A29E]'
            }`}
            title={item.pinned ? 'Unpin item' : 'Pin to top'}
          >
            <Star className={`w-3.5 h-3.5 ${item.pinned ? 'fill-[#D97706]' : ''}`} />
          </button>

          {/* Delete button */}
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 rounded text-[#635F57] hover:text-[#EA580C] hover:bg-[#2A1814] transition-colors cursor-pointer"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="px-3.5 pb-3 pt-1">
        {item.contentType === 'image' || item.content.startsWith('data:image/') ? (
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#111010] border border-[#22211E]">
            <img
              src={item.content}
              alt="Shared asset"
              className="max-h-64 max-w-full rounded object-contain"
            />
          </div>
        ) : item.contentType === 'code' ? (
          <div className="relative rounded-lg bg-[#111010] border border-[#242320] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1 bg-[#171614] border-b border-[#22211F] text-[10px] font-mono text-[#7E7A72]">
              <span>{item.language ? item.language.toUpperCase() : 'SNIPPET'}</span>
              <span>{item.content.split('\n').length} lines</span>
            </div>
            <pre className="p-3 text-xs font-mono text-[#E6E4DE] overflow-x-auto whitespace-pre leading-relaxed">
              <code>
                {expanded || !isLong
                  ? item.content
                  : item.content.slice(0, 360) + '\n...'}
              </code>
            </pre>
          </div>
        ) : item.contentType === 'link' ? (
          <div className="p-2.5 rounded-lg bg-[#191816] border border-[#272622] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-[#D97706] truncate">
                {item.title || item.content}
              </span>
              <a
                href={item.content.startsWith('http') ? item.content : `https://${item.content}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#A8A29E] hover:text-[#FAF8F5] underline whitespace-nowrap"
              >
                <span>Open</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-[#8C877D] truncate font-mono select-all">
              {item.content}
            </p>
          </div>
        ) : (
          <div className="text-sm text-[#E2E0D8] leading-relaxed whitespace-pre-wrap break-words select-text font-normal">
            {expanded || !isLong
              ? item.content
              : item.content.slice(0, 360) + '...'}
          </div>
        )}

        {isLong && item.contentType !== 'image' && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 text-xs text-[#D97706] hover:underline font-mono cursor-pointer"
          >
            {expanded ? 'Show less' : 'Show full content'}
          </button>
        )}
      </div>

      {/* Subtle Bottom Action Strip */}
      <div className="flex items-center justify-between px-3.5 py-2 border-t border-[#201F1D] text-xs">
        <span className="text-[10px] font-mono text-[#5C5952]">
          {item.sizeBytes < 1024
            ? `${item.sizeBytes} B`
            : `${(item.sizeBytes / 1024).toFixed(1)} KB`}
        </span>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
            copied
              ? 'bg-[#16A34A] text-white'
              : 'bg-[#22211F] hover:bg-[#2C2B27] text-[#FAF8F5] border border-[#33312C]'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-white" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-[#D97706]" />
              <span>Copy</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};
