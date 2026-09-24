import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { processOfflineSync, OfflineQueueItem } from '../services/offlineSync.ts';

interface OfflineSyncBannerProps {
  isOnline: boolean;
  offlineQueue: OfflineQueueItem[];
  onSyncCompleted: (count: number) => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  isOnline,
  offlineQueue,
  onSyncCompleted,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleManualSync = async () => {
    if (!isOnline || offlineQueue.length === 0) return;
    setIsSyncing(true);
    setSyncStatusMsg(null);

    try {
      const { successCount, errors } = await processOfflineSync();
      if (successCount > 0) {
        onSyncCompleted(successCount);
        setSyncStatusMsg(`Berhasil menyinkronkan ${successCount} transaksi ke cloud!`);
        setTimeout(() => setSyncStatusMsg(null), 3000);
      } else if (errors.length > 0) {
        setSyncStatusMsg(`Gagal menyinkronkan beberapa item. Periksa koneksi.`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && offlineQueue.length === 0 && !syncStatusMsg) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        !isOnline
          ? 'bg-amber-500/10 border-amber-300 text-amber-900'
          : offlineQueue.length > 0
          ? 'bg-blue-50 border-blue-200 text-blue-900'
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl text-white shrink-0 ${
            !isOnline ? 'bg-amber-500' : offlineQueue.length > 0 ? 'bg-blue-600' : 'bg-emerald-600'
          }`}
        >
          {!isOnline ? (
            <WifiOff className="w-4 h-4" />
          ) : offlineQueue.length > 0 ? (
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
        </div>

        <div>
          {!isOnline ? (
            <>
              <span className="font-bold block">
                Mode Offline Aktif
              </span>
              <span>
                Koneksi internet terputus. Anda tetap dapat mencatat sampah baru; data tersimpan aman di perangkat dan akan disinkronkan otomatis saat online.
                {offlineQueue.length > 0 && ` (${offlineQueue.length} transaksi dalam antrean)`}
              </span>
            </>
          ) : offlineQueue.length > 0 ? (
            <>
              <span className="font-bold block">
                Koneksi Tersedia Kembali!
              </span>
              <span>
                Terdapat {offlineQueue.length} transaksi yang dicatat saat offline siap disinkronkan ke server cloud.
              </span>
            </>
          ) : (
            <span className="font-semibold">{syncStatusMsg}</span>
          )}
        </div>
      </div>

      {isOnline && offlineQueue.length > 0 && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
        </button>
      )}
    </div>
  );
};
