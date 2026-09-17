import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ClipboardPaste,
  Send,
  Code,
  Link,
  Type,
  Image as ImageIcon,
  FileUp,
  X,
  Zap,
} from 'lucide-react';
import { ContentType } from '../types';
import { readFromClipboard, detectContentType } from '../services/clipboard';

interface NewClipInputProps {
  onSendItem: (content: string, type?: ContentType) => Promise<any>;
  isConnected: boolean;
  isLiveWatchActive?: boolean;
  onToggleLiveWatch?: (active: boolean) => void;
}

export const NewClipInput: React.FC<NewClipInputProps> = ({
  onSendItem,
  isConnected,
  isLiveWatchActive = false,
  onToggleLiveWatch,
}) => {
  const [content, setContent] = useState('');
  const [overrideType, setOverrideType] = useState<ContentType | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detected = detectContentType(content);
  const activeType: ContentType = imagePreview
    ? 'image'
    : overrideType || detected.type;

  const handleSystemPaste = async () => {
    const text = await readFromClipboard();
    if (text) {
      setContent(text);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else {
      // Focus textarea so user can press cmd+v
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.placeholder = 'Use Cmd/Ctrl + V to paste here directly...';
      }
    }
  };

  const handleSend = async () => {
    const payload = imagePreview || content;
    if (!payload.trim()) return;

    setIsSending(true);
    try {
      await onSendItem(payload, activeType);
      setContent('');
      setImagePreview(null);
      setOverrideType(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setOverrideType('image');
      };
      reader.readAsDataURL(file);
    } else {
      // Read as text
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setContent(result);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative w-full rounded-xl bg-[#171615] border transition-all duration-200 ${
        isDragging
          ? 'border-[#D97706] ring-1 ring-[#D97706]/30 bg-[#1D1C19]'
          : 'border-[#262522] hover:border-[#35332E]'
      }`}
    >
      <div className="p-3.5 sm:p-4">
        {imagePreview ? (
          <div className="relative inline-block mb-3 rounded-lg border border-[#34322D] overflow-hidden bg-[#121211]">
            <img
              src={imagePreview}
              alt="Attachment"
              className="max-h-52 max-w-full object-contain rounded"
            />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-2 right-2 p-1 rounded-full bg-[#121211]/90 text-[#FAF8F5] hover:bg-black transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="px-2.5 py-1 text-[11px] font-mono text-[#8C877D] border-t border-[#262522] flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3 text-[#D97706]" />
              Image attachment ready to sync
            </div>
          </div>
        ) : (
          <textarea
            id="new-clip-textarea"
            ref={textareaRef}
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type or paste to sync across devices... (⌘/Ctrl + Enter to send)"
            className={`w-full bg-transparent resize-y text-sm text-[#FAF8F5] placeholder-[#6A665E] focus:outline-none leading-relaxed min-h-[48px] ${
              activeType === 'code' ? 'font-mono text-xs' : ''
            }`}
          />
        )}

        {/* Minimal Actions Bar */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#22211F] mt-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick paste button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSystemPaste}
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#201F1D] hover:bg-[#2A2926] border border-[#2F2E2A] text-xs text-[#D6D3CD] hover:text-[#FAF8F5] transition-colors cursor-pointer"
              title="Paste from system clipboard"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-[#D97706]" />
              <span className="hidden sm:inline text-[11px]">Paste</span>
            </motion.button>

            {/* File attachment */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded text-[#8C877D] hover:text-[#FAF8F5] hover:bg-[#201F1D] border border-transparent hover:border-[#2F2E2A] transition-colors cursor-pointer"
              title="Attach image or text file"
            >
              <FileUp className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,text/*,.json,.ts,.js,.py,.md"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {/* Content Type tag / toggle */}
            {(['text', 'code', 'link'] as ContentType[]).map((t) => {
              const isSelected = activeType === t;
              const Icon = t === 'code' ? Code : t === 'link' ? Link : Type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOverrideType(t)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#262522] text-[#FAF8F5] border border-[#3A3833]'
                      : 'text-[#6E6A62] hover:text-[#A8A29E]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden md:inline">{t}</span>
                </button>
              );
            })}

            {/* Auto-sync background watch */}
            {onToggleLiveWatch && (
              <button
                type="button"
                onClick={() => onToggleLiveWatch(!isLiveWatchActive)}
                className={`hidden lg:flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] transition-colors cursor-pointer ${
                  isLiveWatchActive
                    ? 'bg-[#182618] border-[#2A4E2A] text-[#16A34A]'
                    : 'bg-[#191816] border-[#282724] text-[#716C62] hover:text-[#FAF8F5]'
                }`}
                title="Continuous auto-sync for background clipboard copies"
              >
                <Zap className={`w-2.5 h-2.5 ${isLiveWatchActive ? 'fill-[#16A34A] text-[#16A34A]' : ''}`} />
                <span>{isLiveWatchActive ? 'Auto-Sync' : 'Auto'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {content && (
              <span className="text-[11px] font-mono text-[#6A665E] hidden sm:inline">
                {content.length} chars
              </span>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={(!content.trim() && !imagePreview) || isSending}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                (content.trim() || imagePreview) && !isSending
                  ? 'bg-[#D97706] hover:bg-[#B45309] text-black font-semibold shadow-sm'
                  : 'bg-[#201F1D] text-[#55524B] cursor-not-allowed border border-[#282724]'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>Sync</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
