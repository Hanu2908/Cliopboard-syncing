import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  Trash2,
  Download,
  Copy,
  Check,
  X,
  FileJson,
  FileText,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { DecryptedClipboardItem } from '../types';
import { copyToClipboard, playTactileTick } from '../services/clipboard';

interface FloatingActionBarProps {
  selectedCount: number;
  totalCount: number;
  selectedItems: DecryptedClipboardItem[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkPin: (pin: boolean) => void;
  onBulkDelete: () => void;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  selectedCount,
  totalCount,
  selectedItems,
  onSelectAll,
  onClearSelection,
  onBulkPin,
  onBulkDelete,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedBatch, setCopiedBatch] = useState(false);

  if (selectedCount === 0) return null;

  // Determine if all selected are pinned
  const areAllPinned = selectedItems.length > 0 && selectedItems.every((i) => i.pinned);

  // Bulk copy
  const handleBulkCopy = async () => {
    const text = selectedItems
      .map((item, idx) => {
        const header = `// --- Item ${idx + 1} (${item.contentType}) from ${item.senderName} ---`;
        return `${header}\n${item.content}`;
      })
      .join('\n\n');

    const ok = await copyToClipboard(text);
    if (ok) {
      playTactileTick();
      setCopiedBatch(true);
      setTimeout(() => setCopiedBatch(false), 2000);
    }
  };

  // Bulk export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        count: selectedItems.length,
        items: selectedItems.map((i) => ({
          id: i.id,
          content: i.content,
          contentType: i.contentType,
          language: i.language,
          senderName: i.senderName,
          timestamp: i.timestamp,
          pinned: i.pinned,
        })),
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clipsync-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    playTactileTick();
  };

  // Bulk export Text / Markdown
  const handleExportMarkdown = () => {
    const text = selectedItems
      .map((item, idx) => {
        const dateStr = new Date(item.timestamp).toLocaleString();
        const tag = item.contentType.toUpperCase();
        if (item.contentType === 'code') {
          return `### Clip ${idx + 1} • ${tag} (${item.senderName} - ${dateStr})\n\`\`\`${item.language || ''}\n${item.content}\n\`\`\``;
        }
        return `### Clip ${idx + 1} • ${tag} (${item.senderName} - ${dateStr})\n${item.content}`;
      })
      .join('\n\n---\n\n');

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clipsync-export-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    playTactileTick();
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="pointer-events-auto max-w-2xl w-full bg-[#181715] border border-[#383632] rounded-2xl shadow-2xl p-2.5 sm:p-3 text-[#EAE8E2] flex items-center justify-between gap-2 sm:gap-3 backdrop-blur-lg"
        >
          {/* Left: Selection Count & Select All */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#242320] border border-[#34322D] text-xs font-mono font-semibold text-[#FAF8F5]">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              <span>
                {selectedCount} <span className="hidden sm:inline">selected</span>
              </span>
            </div>

            <button
              onClick={selectedCount === totalCount ? onClearSelection : onSelectAll}
              className="text-xs text-[#A8A29E] hover:text-[#FAF8F5] underline underline-offset-4 px-1.5 py-1 transition-colors whitespace-nowrap"
            >
              {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 relative">
            {/* Pin / Unpin */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onBulkPin(!areAllPinned)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                areAllPinned
                  ? 'bg-[#2A2416] border-[#4A3B18] text-[#D97706]'
                  : 'bg-[#22211E] hover:bg-[#2C2B27] border-[#34322D] text-[#D6D3CD]'
              }`}
              title={areAllPinned ? 'Unpin all selected' : 'Pin all selected'}
            >
              <Star className={`w-3.5 h-3.5 ${areAllPinned ? 'fill-[#D97706]' : ''}`} />
              <span className="hidden md:inline">{areAllPinned ? 'Unpin' : 'Pin'}</span>
            </motion.button>

            {/* Bulk Copy */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkCopy}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#22211E] hover:bg-[#2C2B27] border border-[#34322D] text-xs font-medium text-[#D6D3CD] transition-colors"
              title="Copy all selected items joined together"
            >
              {copiedBatch ? (
                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#D97706]" />
              )}
              <span className="hidden md:inline">{copiedBatch ? 'Copied!' : 'Copy All'}</span>
            </motion.button>

            {/* Export Dropdown */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#22211E] hover:bg-[#2C2B27] border border-[#34322D] text-xs font-medium text-[#D6D3CD] transition-colors"
                title="Export selected items"
              >
                <Download className="w-3.5 h-3.5 text-[#A8A29E]" />
                <span className="hidden md:inline">Export</span>
                <ChevronDown className="w-3 h-3 text-[#7E7A71]" />
              </motion.button>

              {showExportMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-44 rounded-xl bg-[#1C1B19] border border-[#34322D] shadow-2xl p-1.5 z-50 text-xs">
                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#282723] text-left text-[#FAF8F5] transition-colors"
                  >
                    <FileJson className="w-4 h-4 text-[#D97706]" />
                    <span>Export as JSON</span>
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#282723] text-left text-[#FAF8F5] transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#D97706]" />
                    <span>Export Markdown (.md)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Delete Button / Inline Confirmation */}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5 bg-[#2B1714] border border-[#52221B] px-2 py-1 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                <span className="text-[11px] text-[#FAF8F5] font-medium hidden sm:inline">
                  Delete {selectedCount}?
                </span>
                <button
                  onClick={() => {
                    onBulkDelete();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-2 py-0.5 rounded bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] font-semibold"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-1.5 py-0.5 rounded text-[#A8A29E] hover:text-white text-[11px]"
                >
                  No
                </button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#261816] hover:bg-[#341C1A] border border-[#44221D] text-xs font-medium text-[#EA580C] hover:text-[#DC2626] transition-colors"
                title="Delete selected items from all devices"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Delete</span>
              </motion.button>
            )}

            {/* Dismiss Selection */}
            <button
              onClick={onClearSelection}
              className="p-1.5 rounded-lg text-[#8C877D] hover:text-[#FAF8F5] hover:bg-[#242320] transition-colors ml-1"
              title="Clear selection (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
