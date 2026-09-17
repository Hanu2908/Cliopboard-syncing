import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList,
  Share2,
} from 'lucide-react';
import { Header } from './components/Header';
import { NewClipInput } from './components/NewClipInput';
import { ClipboardItemCard } from './components/ClipboardItemCard';
import { PairingModal } from './components/PairingModal';
import { DeviceListDrawer } from './components/DeviceListDrawer';
import { SettingsModal } from './components/SettingsModal';
import { FilterBar, FilterCategory } from './components/FilterBar';
import { LiveSyncToast } from './components/LiveSyncToast';
import { FloatingActionBar } from './components/FloatingActionBar';
import { SyncSparkline } from './components/SyncSparkline';
import { StealthHUD } from './components/StealthHUD';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ShortcutToast } from './components/ShortcutToast';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LandingPage } from './components/Landing/LandingPage';
import { useGlobalShortcuts, ShortcutToastInfo } from './hooks/useGlobalShortcuts';
import { syncManager, IncomingSyncEvent } from './services/syncManager';
import { getDeviceDetails, updateDeviceName } from './services/deviceInfo';
import { generateRoomCode, generateSecretKey } from './services/crypto';
import { getSavedConfig } from './services/storage';
import { ContentType, HapticSettings } from './types';

export default function App() {
  const [roomCode, setRoomCode] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [status, setStatus] = useState(syncManager.status);
  const [devices, setDevices] = useState(syncManager.devices);
  const [items, setItems] = useState(syncManager.items);
  const [pendingCount, setPendingCount] = useState(syncManager.pendingCount);
  const [autoCopyIncoming, setAutoCopyIncoming] = useState(syncManager.autoCopyIncoming);
  const [liveClipboardWatch, setLiveClipboardWatch] = useState(syncManager.liveClipboardWatch);
  const [hapticFeedback, setHapticFeedback] = useState(syncManager.hapticFeedback);
  const [hapticSettings, setHapticSettings] = useState<HapticSettings>(syncManager.hapticSettings);
  const [latestSyncEvent, setLatestSyncEvent] = useState<IncomingSyncEvent | null>(syncManager.latestSyncEvent);

  // View mode: 'landing' or 'app' (live sync workspace)
  const [viewMode, setViewMode] = useState<'landing' | 'app'>(() => {
    if (typeof window === 'undefined') return 'landing';
    const hash = window.location.hash;
    const search = window.location.search;
    if (
      hash.includes('room=') ||
      search.includes('room=') ||
      hash.includes('#app') ||
      search.includes('view=app')
    ) {
      return 'app';
    }
    return 'landing';
  });

  // Alt + L shortcut to toggle between Landing Page and App Workspace
  useEffect(() => {
    const handleAltL = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setViewMode((prev) => (prev === 'landing' ? 'app' : 'landing'));
      }
    };
    window.addEventListener('keydown', handleAltL);
    return () => window.removeEventListener('keydown', handleAltL);
  }, []);

  // Modals state
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [showDeviceDrawer, setShowDeviceDrawer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Stealth HUD & Global Shortcut Toast
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [shortcutToast, setShortcutToast] = useState<ShortcutToastInfo | null>(null);

  // Global Keyboard Shortcuts Hook
  const { handleManualClipboardSync } = useGlobalShortcuts({
    isStealthMode,
    onToggleStealthMode: () => setIsStealthMode((prev) => !prev),
    onFocusSearch: () => {
      document.getElementById('filter-search-input')?.focus();
    },
    onFocusNewClip: () => {
      document.getElementById('new-clip-textarea')?.focus();
    },
    onShowShortcutHelp: () => setShowShortcutsModal(true),
    onShortcutTriggered: (info) => setShortcutToast(info),
  });

  // Filter & Search
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Device Info
  const deviceDetails = useMemo(() => getDeviceDetails(), []);
  const [currentDeviceName, setCurrentDeviceName] = useState(deviceDetails.name);

  // Initialize room & sync manager
  useEffect(() => {
    // 1. Check if URL contains pairing info (hash or query params)
    let initialRoom = '';
    let initialKey = '';

    const hash = window.location.hash.substring(1);
    const search = window.location.search.substring(1);
    const queryParams = new URLSearchParams(hash || search);

    if (queryParams.get('room')) {
      initialRoom = queryParams.get('room')!.trim().toUpperCase();
      initialKey = queryParams.get('key') || '';
    }

    const saved = getSavedConfig();
    const finalRoom = initialRoom || saved.roomCode || generateRoomCode();
    const finalKey = initialKey || saved.secretKey || generateSecretKey();
    const finalDeviceName = saved.deviceName || deviceDetails.name;

    setRoomCode(finalRoom);
    setSecretKey(finalKey);
    setCurrentDeviceName(finalDeviceName);

    syncManager.init({
      roomCode: finalRoom,
      secretKey: finalKey,
      deviceName: finalDeviceName,
      deviceId: deviceDetails.id,
      autoCopyIncoming: !!saved.autoCopyIncoming,
      hapticFeedback: saved.hapticFeedback !== false,
    });

    // Subscribe to sync updates
    const unsubscribe = syncManager.subscribe(() => {
      setStatus(syncManager.status);
      setDevices([...syncManager.devices]);
      setItems([...syncManager.items]);
      setPendingCount(syncManager.pendingCount);
      setAutoCopyIncoming(syncManager.autoCopyIncoming);
      setLiveClipboardWatch(syncManager.liveClipboardWatch);
      setHapticFeedback(syncManager.hapticFeedback);
      setHapticSettings({ ...syncManager.hapticSettings });
      setLatestSyncEvent(syncManager.latestSyncEvent);
    });

    return () => {
      unsubscribe();
    };
  }, [deviceDetails]);

  // Handler for room switch
  const handleSwitchRoom = (newCode: string, newKey: string) => {
    setRoomCode(newCode);
    setSecretKey(newKey);
    syncManager.init({
      roomCode: newCode,
      secretKey: newKey,
      deviceName: currentDeviceName,
      deviceId: deviceDetails.id,
      autoCopyIncoming,
      hapticFeedback,
    });
  };

  const handleUpdateName = (name: string) => {
    setCurrentDeviceName(name);
    updateDeviceName(name);
    syncManager.updateCurrentDeviceName(name);
  };

  const handleSendItem = async (content: string, type?: ContentType) => {
    return await syncManager.pushItem(content, type);
  };

  const handleDeleteItem = async (id: string) => {
    await syncManager.deleteItem(id);
  };

  const handleTogglePin = async (id: string) => {
    await syncManager.togglePin(id);
  };

  const handleClearAll = async () => {
    await syncManager.clearAll();
  };

  // Toggle single item selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setIsMultiSelectMode(false);
  };

  // Bulk pin / unpin
  const handleBulkPin = async (pin: boolean) => {
    const ids = Array.from(selectedIds);
    await syncManager.pinItems(ids, pin);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await syncManager.deleteItems(ids);
    setSelectedIds(new Set());
    setIsMultiSelectMode(false);
  };

  // Keyboard shortcut: Escape clears selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIds.size > 0) {
        handleClearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds.size]);

  // Filter and search computation
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (filterCategory === 'pinned' && !item.pinned) return false;
      if (
        filterCategory !== 'all' &&
        filterCategory !== 'pinned' &&
        item.contentType !== filterCategory
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contentMatch = item.content.toLowerCase().includes(query);
        const titleMatch = item.title?.toLowerCase().includes(query);
        const senderMatch = item.senderName.toLowerCase().includes(query);
        return contentMatch || titleMatch || senderMatch;
      }

      return true;
    });
  }, [items, filterCategory, searchQuery]);

  const pinnedCount = useMemo(() => items.filter((i) => i.pinned).length, [items]);

  const analyticsSectionRef = useRef<HTMLDivElement>(null);

  const handleScrollToAnalytics = () => {
    if (analyticsSectionRef.current) {
      analyticsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const selectedItemsList = useMemo(() => {
    return items.filter((i) => selectedIds.has(i.id));
  }, [items, selectedIds]);

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredItems.map((i) => i.id)));
  };

  if (viewMode === 'landing') {
    return (
      <div className="min-h-screen bg-[#121211] text-[#EAE8E2] flex flex-col selection:bg-[#EAE8E2] selection:text-[#121211]">
        <LandingPage
          onLaunchApp={() => setViewMode('app')}
          roomCode={roomCode}
          isMeshConnected={status === 'connected'}
        />

        {/* Global Shortcut Event Notification Banner */}
        <ShortcutToast
          toast={shortcutToast}
          onDismiss={() => setShortcutToast(null)}
        />

        {/* PWA Offline Mode Indicator */}
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121211] text-[#EAE8E2] flex flex-col selection:bg-[#EAE8E2] selection:text-[#121211]">
      {/* Header Bar */}
      <Header
        roomCode={roomCode}
        status={status}
        devices={devices}
        pendingCount={pendingCount}
        items={items}
        onOpenPairing={() => setShowPairingModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenDevices={() => setShowDeviceDrawer(true)}
        onOpenLanding={() => setViewMode('landing')}
        onOpenAnalytics={handleScrollToAnalytics}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onToggleStealth={() => setIsStealthMode((prev) => !prev)}
        onManualSync={handleManualClipboardSync}
      />

      {/* Main Container (collapsible in Stealth HUD mode) */}
      <main
        className={`flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 transition-all duration-200 ${
          isStealthMode ? 'opacity-0 scale-98 pointer-events-none blur-xs' : 'opacity-100 scale-100'
        }`}
      >
        {/* Quick Sync Composer */}
        <section>
          <NewClipInput
            onSendItem={handleSendItem}
            isConnected={status === 'connected'}
            isLiveWatchActive={liveClipboardWatch}
            onToggleLiveWatch={(val) => syncManager.setLiveClipboardWatch(val)}
          />
        </section>

        {/* Dedicated 24h Sync Frequency & Sparkline Analytics Section */}
        <div ref={analyticsSectionRef}>
          <SyncSparkline
            items={items}
            isConnected={status === 'connected'}
          />
        </div>

        {/* Filter and Search Bar */}
        <section className="pt-2">
          <FilterBar
            selectedFilter={filterCategory}
            onSelectFilter={setFilterCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalCount={items.length}
            filteredCount={filteredItems.length}
            pinnedCount={pinnedCount}
            isMultiSelectMode={isMultiSelectMode || selectedIds.size > 0}
            onToggleSelectMode={() => {
              if (selectedIds.size > 0) {
                handleClearSelection();
              } else {
                setIsMultiSelectMode((prev) => !prev);
              }
            }}
            selectedCount={selectedIds.size}
          />
        </section>

        {/* Clipboard List */}
        <section className="space-y-3 pb-28">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 px-6 text-center rounded-2xl bg-[#161514] border border-[#242320] flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#201F1D] border border-[#2D2C28] flex items-center justify-center text-[#8C877D]">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-semibold text-[#FAF8F5]">
                  {searchQuery ? 'No matching items' : 'Clipboard is empty'}
                </h3>
                <p className="text-xs text-[#8C877D] leading-relaxed">
                  {searchQuery
                    ? 'Try searching with another keyword or reset the category filter.'
                    : 'Items copied or pasted here synchronize instantly across all paired devices.'}
                </p>
              </div>

              {!searchQuery && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <button
                    onClick={() => setShowPairingModal(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#262522] hover:bg-[#32302C] border border-[#3A3834] text-xs font-medium text-[#FAF8F5] transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Pair Device (QR / Code)</span>
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <ClipboardItemCard
                    key={item.id}
                    item={item}
                    onDelete={handleDeleteItem}
                    onTogglePin={handleTogglePin}
                    isSelected={selectedIds.has(item.id)}
                    onToggleSelect={handleToggleSelect}
                    hasAnySelected={selectedIds.size > 0 || isMultiSelectMode}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Bar for Selected Items */}
      <FloatingActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredItems.length}
        selectedItems={selectedItemsList}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBulkPin={handleBulkPin}
        onBulkDelete={handleBulkDelete}
      />

      {/* Modals & Drawers */}
      <PairingModal
        isOpen={showPairingModal}
        onClose={() => setShowPairingModal(false)}
        roomCode={roomCode}
        secretKey={secretKey}
        onSwitchRoom={handleSwitchRoom}
      />

      <DeviceListDrawer
        isOpen={showDeviceDrawer}
        onClose={() => setShowDeviceDrawer(false)}
        devices={devices}
        currentDeviceId={deviceDetails.id}
        onUpdateDeviceName={handleUpdateName}
        onOpenPairing={() => {
          setShowDeviceDrawer(false);
          setShowPairingModal(true);
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        deviceName={currentDeviceName}
        onUpdateDeviceName={handleUpdateName}
        autoCopyIncoming={autoCopyIncoming}
        onToggleAutoCopy={(val) => syncManager.setAutoCopy(val)}
        liveClipboardWatch={liveClipboardWatch}
        onToggleLiveWatch={(val) => syncManager.setLiveClipboardWatch(val)}
        hapticFeedback={hapticFeedback}
        onToggleHaptic={(val) => syncManager.setHapticFeedback(val)}
        hapticSettings={hapticSettings}
        onUpdateHapticSettings={(settings) => syncManager.updateHapticSettings(settings)}
        items={items}
        onClearAll={handleClearAll}
        onDisconnectRoom={() => {
          setShowSettingsModal(false);
          setShowPairingModal(true);
        }}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
      />

      {/* Global Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        onTriggerSync={handleManualClipboardSync}
        onToggleStealth={() => setIsStealthMode((prev) => !prev)}
      />

      {/* Stealth HUD Float (active when window visibility is collapsed) */}
      {isStealthMode && (
        <StealthHUD
          roomCode={roomCode}
          status={status}
          itemsCount={items.length}
          latestItem={items[0]}
          onRestore={() => setIsStealthMode(false)}
          onTriggerSync={handleManualClipboardSync}
        />
      )}

      {/* Global Shortcut Event Notification Banner */}
      <ShortcutToast
        toast={shortcutToast}
        onDismiss={() => setShortcutToast(null)}
      />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Real-time Incoming Sync Alert Toast */}
      <LiveSyncToast
        event={latestSyncEvent}
        onDismiss={() => syncManager.dismissLatestSyncEvent()}
      />
    </div>
  );
}
