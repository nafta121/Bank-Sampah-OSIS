import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ClassProfile, WasteTransaction } from '../types/index.ts';
import { WASTE_CATEGORIES } from '../constants/wasteData.ts';
import {
  History,
  Scale,
  Calendar,
  Filter,
  Search,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Shield,
  School,
  CheckCircle,
  PlusCircle,
  Receipt,
  Download,
  X,
  Award,
} from 'lucide-react';

interface DepositHistoryViewProps {
  classes: ClassProfile[];
  transactions: WasteTransaction[];
  onOpenWasteEntry?: () => void;
  onOpenRedemptions?: (classId: string) => void;
}

export const DepositHistoryView: React.FC<DepositHistoryViewProps> = ({
  classes,
  transactions,
  onOpenWasteEntry,
  onOpenRedemptions,
}) => {
  const { currentUser } = useAuth();
  const isClassRep = currentUser.role === 'class_rep';
  const myClassId = currentUser.classId;

  // Selected filters
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(
    isClassRep ? (myClassId || 'all') : 'all'
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<WasteTransaction | null>(null);

  // If class rep, enforce filtering to only their class
  const activeClassId = isClassRep ? myClassId : selectedClassFilter;

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Class filter
    if (activeClassId && activeClassId !== 'all' && tx.classId !== activeClassId) {
      return false;
    }
    // Category filter
    if (selectedCategoryFilter !== 'all' && tx.category !== selectedCategoryFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tx.className?.toLowerCase().includes(q);
      const matchId = tx.transactionId?.toLowerCase().includes(q);
      const matchCat = tx.category?.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchCat && !matchNotes) return false;
    }
    return true;
  });

  // Calculate statistics for filtered view
  const totalFilteredWeight = filteredTransactions.reduce((sum, t) => sum + t.weightKg, 0);
  const totalFilteredPoints = filteredTransactions.reduce((sum, t) => sum + t.pointsEarned, 0);
  const totalFilteredCash = filteredTransactions.reduce((sum, t) => sum + t.cashEarned, 0);

  // Find class profile for class rep
  const myClassProfile = classes.find((c) => c.classId === myClassId);

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden ${
          isClassRep
            ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 shadow-emerald-950/20'
            : 'bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 shadow-slate-900/30'
        }`}
      >
        <div className="absolute -right-8 -bottom-8 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100">
              {isClassRep ? (
                <>
                  <School className="w-3.5 h-3.5 text-amber-300" />
                  <span>Portal Khusus Kelas: {currentUser.className || currentUser.displayName}</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Master Administrator OSIS • Audit Log Transaksi</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isClassRep
                ? `Riwayat Setoran Sampah Kelas ${currentUser.className || ''}`
                : 'Master Log Riwayat Setoran Sampah Sekolah'}
            </h1>

            <p className="text-sm text-emerald-100/90 leading-relaxed">
              {isClassRep
                ? 'Seluruh catatan penimbangan dan kontribusi daur ulang kelas Anda tersimpan aman dan transparan di database cloud Firestore.'
                : 'Pantau dan audit seluruh transaksi setoran sampah dari semua kelas secara real-time. Anda dapat memfilter per kelas, kategori, dan mencetak slip tanda terima resmi.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isClassRep && onOpenWasteEntry && (
              <button
                onClick={onOpenWasteEntry}
                className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>+ Catat Setoran Baru</span>
              </button>
            )}

            {isClassRep && onOpenRedemptions && myClassId && (
              <button
                onClick={() => onOpenRedemptions(myClassId)}
                className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-2xl font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-5 h-5" />
                <span>Tukar Reward Kelas</span>
              </button>
            )}

            <button
              onClick={handlePrintSlip}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-semibold text-sm transition backdrop-blur-md text-white flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>

        {/* Summary Badges on Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block font-medium">Total Transaksi</span>
            <span className="text-xl font-extrabold text-white">
              {filteredTransactions.length} Setoran
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block font-medium">Volume Sampah</span>
            <span className="text-xl font-extrabold text-white">
              {totalFilteredWeight.toFixed(1)} kg
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block font-medium">Poin Terakumulasi</span>
            <span className="text-xl font-extrabold text-amber-300">
              +{totalFilteredPoints.toLocaleString('id-ID')} Pts
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block font-medium">Kas Terkumpul</span>
            <span className="text-xl font-extrabold text-emerald-300">
              Rp {totalFilteredCash.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Class (Only enabled for Master Admin OSIS) */}
            {!isClassRep && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Filter Kelas:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Kelas ({classes.length})</option>
                  {classes.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter by Waste Category */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Kategori:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Kategori</option>
                {WASTE_CATEGORIES.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari ID transaksi / catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Informational banner if class representative */}
        {isClassRep && (
          <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Menampilkan data khusus <strong>{currentUser.className}</strong>. Data setoran
                kelas lain dilindungi untuk privasi kas kelas masing-masing.
              </span>
            </div>
            {myClassProfile && (
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-xl shadow-xs">
                Saldo Aktif: Rp {myClassProfile.balance.toLocaleString('id-ID')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">Waktu & Tanggal</th>
                {!isClassRep && <th className="py-3.5 px-4">Kelas</th>}
                <th className="py-3.5 px-4">Jenis Sampah</th>
                <th className="py-3.5 px-4 text-right">Berat (kg)</th>
                <th className="py-3.5 px-4 text-right">Poin</th>
                <th className="py-3.5 px-4 text-right">Nilai Kas (Rp)</th>
                <th className="py-3.5 px-4">Petugas Verifikasi</th>
                <th className="py-3.5 px-4 text-center">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredTransactions.map((tx) => {
                const dateObj = new Date(tx.timestamp);
                const formattedDate = dateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={tx.transactionId} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{formattedDate}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedTime} WIB</span>
                      </div>
                    </td>

                    {!isClassRep && (
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                          {tx.className || tx.classId}
                        </span>
                      </td>
                    )}

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800">{tx.category}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-gray-400 truncate max-w-xs">
                          {tx.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 whitespace-nowrap">
                      {tx.weightKg.toFixed(1)} kg
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                        +{tx.pointsEarned} Pts
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-gray-900 whitespace-nowrap">
                      +Rp {tx.cashEarned.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Shield className="w-3 h-3 text-emerald-600" />
                        <span>{tx.recordedBy || 'Pengurus OSIS'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedReceiptTx(tx)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-700 font-bold rounded-lg transition text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        title="Lihat Bukti Tanda Terima Digital"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Bukti</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={isClassRep ? 7 : 8} className="py-12 text-center text-gray-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <History className="w-8 h-8 mx-auto text-gray-300" />
                      <p className="font-bold text-gray-600 text-sm">
                        {isClassRep
                          ? `Belum ada riwayat setoran untuk ${currentUser.className}`
                          : 'Tidak ada transaksi setoran sampah yang cocok dengan filter'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isClassRep
                          ? 'Bawa sampah terpilah (botol plastik, kertas tugas bekas, kardus, dll.) ke Bank Sampah OSIS untuk mulai mengumpulkan saldo kas kelas!'
                          : 'Gunakan tombol "+ Catat Setoran Baru" untuk memasukkan timbangan sampah dari kelas.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Receipt Modal */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden p-6 space-y-5">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Bukti Setoran Bank Sampah
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    ID Transaksi: {selectedReceiptTx.transactionId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceiptTx(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Kelas Penyetor</span>
                <span className="font-bold text-gray-900">
                  {selectedReceiptTx.className || selectedReceiptTx.classId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Waktu & Tanggal</span>
                <span className="font-medium text-gray-800">
                  {new Date(selectedReceiptTx.timestamp).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Kategori Sampah</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {selectedReceiptTx.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Berat Timbangan</span>
                <span className="font-bold text-gray-900">
                  {selectedReceiptTx.weightKg} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Poin Daur Ulang</span>
                <span className="font-extrabold text-emerald-600">
                  +{selectedReceiptTx.pointsEarned} Pts
                </span>
              </div>
              <div className="border-t border-gray-200/80 pt-2 flex justify-between text-sm">
                <span className="font-bold text-gray-800">Tambahan Kas Kelas</span>
                <span className="font-extrabold text-emerald-700">
                  +Rp {selectedReceiptTx.cashEarned.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60">
              <span className="font-semibold text-emerald-900 block mb-0.5">
                Status Verifikasi: Sah
              </span>
              Dicatat oleh petugas {selectedReceiptTx.recordedBy || 'Pengurus OSIS'}. Data tersimpan di cloud database Firestore.
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Bukti</span>
              </button>
              <button
                onClick={() => setSelectedReceiptTx(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
