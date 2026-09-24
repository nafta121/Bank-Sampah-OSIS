import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar, NavTab } from './components/Navbar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { WasteEntryModal } from './components/WasteEntryModal.tsx';
import { ClassPointsView } from './components/ClassPointsView.tsx';
import { MonthlyReportView } from './components/MonthlyReportView.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { NotificationModal } from './components/NotificationModal.tsx';
import { OfflineSyncBanner } from './components/OfflineSyncBanner.tsx';
import {
  ClassProfile,
  WasteTransaction,
  NotificationItem,
  RewardRedemption,
} from './types/index.ts';
import { INITIAL_CLASSES } from './constants/wasteData.ts';
import {
  testConnection,
  seedInitialClasses,
  subscribeToClasses,
  subscribeToTransactions,
  subscribeToNotifications,
  subscribeToRedemptions,
} from './services/firebase.ts';
import {
  getOfflineQueue,
  getLocalClassesCache,
  setLocalClassesCache,
  processOfflineSync,
  OfflineQueueItem,
} from './services/offlineSync.ts';
import { Plus, Sparkles, Scale, Heart } from 'lucide-react';

function BankSampahApp() {
  const { currentUser } = useAuth();

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Network & Offline state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() => getOfflineQueue());

  // Firestore & Application Data
  const [classes, setClasses] = useState<ClassProfile[]>(() => {
    const cached = getLocalClassesCache();
    return cached && cached.length > 0 ? cached : INITIAL_CLASSES;
  });
  const [transactions, setTransactions] = useState<WasteTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);

  // Modals state
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [selectedClassForReward, setSelectedClassForReward] = useState<string | undefined>(undefined);

  // Sync toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Monitor network connectivity and auto-sync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      showToast('Koneksi terhubung kembali! Melakukan auto-sinkronisasi...');
      const { successCount } = await processOfflineSync();
      setOfflineQueue(getOfflineQueue());
      if (successCount > 0) {
        showToast(`Sinkronisasi sukses: ${successCount} transaksi offline tersimpan di cloud!`);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Koneksi offline: transaksi akan disimpan di perangkat.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Initialize Firestore listeners and bootstrap database
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initialize = async () => {
      const isConnected = await testConnection();
      if (isConnected) {
        await seedInitialClasses();
      }

      // Listen to classes
      const unsubClasses = subscribeToClasses(
        (updatedClasses) => {
          if (updatedClasses.length > 0) {
            setClasses(updatedClasses);
            setLocalClassesCache(updatedClasses);
          }
        },
        () => {
          // If offline or permissions error, fall back to cached
          const cached = getLocalClassesCache();
          if (cached) setClasses(cached);
        }
      );
      unsubs.push(unsubClasses);

      // Listen to transactions
      const unsubTxs = subscribeToTransactions((txs) => {
        setTransactions(txs);
      });
      unsubs.push(unsubTxs);

      // Listen to notifications
      const unsubNotifs = subscribeToNotifications((notifs) => {
        setNotifications(notifs);
      });
      unsubs.push(unsubNotifs);

      // Listen to redemptions
      const unsubReds = subscribeToRedemptions((reds) => {
        setRedemptions(reds);
      });
      unsubs.push(unsubReds);
    };

    initialize();

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Update offline queue whenever storage changes
  const refreshQueue = () => {
    setOfflineQueue(getOfflineQueue());
  };

  const handleTransactionSaved = (tx: WasteTransaction, updatedClass: ClassProfile) => {
    refreshQueue();

    // Update in-memory state
    setClasses((prev) =>
      prev.map((c) => (c.classId === updatedClass.classId ? updatedClass : c))
    );

    setTransactions((prev) => [tx, ...prev]);

    // If current tab was entry, switch back to dashboard or stay
    if (currentTab === 'entry') {
      setCurrentTab('dashboard');
    }
  };

  const handleClassUpdated = (updatedClass: ClassProfile) => {
    setClasses((prev) =>
      prev.map((c) => (c.classId === updatedClass.classId ? updatedClass : c))
    );
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50/60 text-gray-900 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-gray-800 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'entry') {
            setIsWasteModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        isOnline={isOnline}
        offlineQueueCount={offlineQueue.length}
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grow w-full space-y-6">
        {/* Offline & Queue Sync Banner */}
        <OfflineSyncBanner
          isOnline={isOnline}
          offlineQueue={offlineQueue}
          onSyncCompleted={(count) => {
            refreshQueue();
            showToast(`Sukses menyinkronkan ${count} transaksi offline!`);
          }}
        />

        {/* View Switcher */}
        {currentTab === 'dashboard' && (
          <Dashboard
            classes={classes}
            transactions={transactions}
            notifications={notifications}
            onOpenWasteEntry={() => setIsWasteModalOpen(true)}
            onOpenRedemptions={(classId) => {
              setSelectedClassForReward(classId);
              setCurrentTab('points');
            }}
            onOpenReports={() => setCurrentTab('reports')}
          />
        )}

        {currentTab === 'points' && (
          <ClassPointsView
            classes={classes}
            redemptions={redemptions}
            transactions={transactions}
            selectedClassId={selectedClassForReward}
            onClassUpdated={handleClassUpdated}
          />
        )}

        {currentTab === 'reports' && (
          <MonthlyReportView classes={classes} transactions={transactions} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Bank Sampah OSIS • Smart Eco School</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span>Sinkronisasi Firestore & Google Sheets</span>
            <span>•</span>
            <span>Didukung Analisis Lingkungan Gemini AI</span>
          </div>
        </div>
      </footer>

      {/* Floating Action Button (+ Setor Cepat) */}
      <button
        onClick={() => setIsWasteModalOpen(true)}
        className="fixed bottom-6 right-6 z-30 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 font-bold text-sm transition transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Catat Setoran Sampah Baru"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">Setor Sampah</span>
      </button>

      {/* Modals */}
      <WasteEntryModal
        isOpen={isWasteModalOpen}
        onClose={() => {
          setIsWasteModalOpen(false);
          refreshQueue();
        }}
        classes={classes}
        isOnline={isOnline}
        onTransactionSaved={handleTransactionSaved}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        classes={classes}
      />

      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onSelectRewardTab={(classId) => {
          setSelectedClassForReward(classId);
          setCurrentTab('points');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BankSampahApp />
    </AuthProvider>
  );
}
