import React, { useState } from 'react';
import {
  ClassProfile,
  WasteTransaction,
  NotificationItem,
} from '../types/index.ts';
import { WASTE_CATEGORIES, REWARD_ITEMS } from '../constants/wasteData.ts';
import {
  Trophy,
  Scale,
  Coins,
  TrendingUp,
  Gift,
  PlusCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface DashboardProps {
  classes: ClassProfile[];
  transactions: WasteTransaction[];
  notifications: NotificationItem[];
  onOpenWasteEntry: () => void;
  onOpenRedemptions: (classId?: string) => void;
  onOpenReports: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  classes,
  transactions,
  notifications,
  onOpenWasteEntry,
  onOpenRedemptions,
  onOpenReports,
}) => {
  const [levelFilter, setLevelFilter] = useState<'all' | 'X' | 'XI' | 'XII'>('all');

  // Compute school-wide metrics
  const totalKg = classes.reduce((sum, c) => sum + (c.totalWeightKg || 0), 0);
  const totalBalance = classes.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalPoints = classes.reduce((sum, c) => sum + (c.points || 0), 0);
  const totalTxCount = transactions.length;

  // Monthly target
  const MONTHLY_TARGET_KG = 500;
  const targetPercent = Math.min(100, Math.round((totalKg / MONTHLY_TARGET_KG) * 100));

  // Sort classes for ranking
  const sortedClasses = [...classes].sort((a, b) => (b.points || 0) - (a.points || 0));

  const filteredClasses = sortedClasses.filter((c) => {
    if (levelFilter === 'all') return true;
    return c.classId.startsWith(levelFilter);
  });

  // Calculate waste category breakdown
  const categoryStats = WASTE_CATEGORIES.map((cat) => {
    const catTxs = transactions.filter((t) => t.category === cat.category);
    const weight = catTxs.reduce((sum, t) => sum + t.weightKg, 0);
    return {
      category: cat.category,
      weight: Number(weight.toFixed(1)),
      color: cat.color,
    };
  });

  const totalCatWeight = categoryStats.reduce((sum, c) => sum + c.weight, 0) || 1;

  // Find classes ready for reward redemption
  const classesReadyForReward = classes.filter((cls) =>
    REWARD_ITEMS.some((r) => cls.points >= r.pointsCost || cls.balance >= r.cashCost)
  );

  return (
    <div className="space-y-6">
      {/* Hero OSIS Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Program Adiwiyata & Bank Sampah OSIS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pilah Sampahmu, Kumpulkan Kas Kelasmu!
            </h1>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Pantau performa daur ulang setiap kelas secara real-time. Setiap gram sampah
              terpilah mengurangi jejak karbon dan memberikan reward bernilai nyata untuk kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenWasteEntry}
              className="px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Catat Sampah Baru</span>
            </button>
            <button
              onClick={onOpenReports}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-semibold text-sm transition backdrop-blur-md text-white cursor-pointer"
            >
              Laporan Bulanan
            </button>
          </div>
        </div>

        {/* School Target Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/15">
          <div className="flex justify-between items-center text-xs font-medium mb-2">
            <span>
              Target Pengumpulan Bulan Ini:{' '}
              <strong className="text-white">{totalKg.toFixed(1)} kg</strong> / {MONTHLY_TARGET_KG} kg
            </span>
            <span className="font-bold text-amber-300">{targetPercent}% Tercapai</span>
          </div>
          <div className="w-full bg-black/25 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-300 h-full rounded-full transition-all duration-700"
              style={{ width: `${targetPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Reward Ready Notification Banner */}
      {classesReadyForReward.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Pemberitahuan Reward Siap Ditukarkan!
              </h4>
              <p className="text-xs text-amber-800">
                Ada <strong className="font-bold">{classesReadyForReward.length} kelas</strong>{' '}
                yang saldonya sudah mencukupi untuk ditukarkan paket kebersihan atau kas tunai kelas.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenRedemptions()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Tukar Reward Kelas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Weight */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sampah Terkumpul</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {totalKg.toFixed(1)}{' '}
            <span className="text-sm font-semibold text-gray-500">Kg</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Mencegah ~{(totalKg * 1.6).toFixed(1)} kg emisi karbon</span>
          </p>
        </div>

        {/* Card 2: Total Balance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Kas Kelas</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            Rp {totalBalance.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-amber-600 font-medium">
            Tersimpan aman untuk kas masing-masing kelas
          </p>
        </div>

        {/* Card 3: Total Points */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Poin Terdistribusi</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {totalPoints.toLocaleString('id-ID')}{' '}
            <span className="text-sm font-semibold text-gray-500">Pts</span>
          </div>
          <p className="text-[11px] text-indigo-600 font-medium">
            Dapat ditukar perlengkapan & fasilitas kelas
          </p>
        </div>

        {/* Card 4: Total Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Setoran</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {totalTxCount}{' '}
            <span className="text-sm font-semibold text-gray-500">Kali Setor</span>
          </div>
          <p className="text-[11px] text-blue-600 font-medium">
            Aktivitas setor sampah siswa & wali kelas
          </p>
        </div>
      </div>

      {/* Main Grid: Podium & Leaderboard on left, Categories & Activity on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Podium & Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 3 Podium Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900 text-base">
                  Klasemen Juara Bank Sampah Sekolah
                </h3>
              </div>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                Real-Time Live
              </span>
            </div>

            {/* Podium Visual */}
            <div className="grid grid-cols-3 gap-3 items-end pt-4 pb-2 border-b border-gray-100 text-center">
              {/* Silver: Rank 2 */}
              <div className="space-y-2">
                {sortedClasses[1] ? (
                  <>
                    <div className="inline-block p-2 bg-slate-100 text-slate-700 rounded-full font-extrabold text-sm border-2 border-slate-300">
                      🥈 2
                    </div>
                    <div className="font-bold text-xs text-gray-800 truncate px-1">
                      {sortedClasses[1].name}
                    </div>
                    <div className="text-xs font-extrabold text-slate-700">
                      {sortedClasses[1].points} Pts
                    </div>
                    <div className="h-16 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-xl flex items-center justify-center text-xs font-bold text-slate-600">
                      {sortedClasses[1].totalWeightKg} kg
                    </div>
                  </>
                ) : (
                  <div className="h-16 bg-gray-50 rounded-t-xl" />
                )}
              </div>

              {/* Gold: Rank 1 */}
              <div className="space-y-2">
                {sortedClasses[0] ? (
                  <>
                    <div className="inline-block p-2.5 bg-amber-100 text-amber-700 rounded-full font-extrabold text-base border-2 border-amber-400 shadow-sm animate-bounce">
                      🥇 1
                    </div>
                    <div className="font-bold text-xs text-gray-900 truncate px-1">
                      {sortedClasses[0].name}
                    </div>
                    <div className="text-xs font-extrabold text-amber-600">
                      {sortedClasses[0].points} Pts
                    </div>
                    <div className="h-24 bg-gradient-to-t from-amber-300 to-amber-100 rounded-t-xl flex items-center justify-center text-xs font-bold text-amber-800">
                      {sortedClasses[0].totalWeightKg} kg
                    </div>
                  </>
                ) : (
                  <div className="h-24 bg-gray-50 rounded-t-xl" />
                )}
              </div>

              {/* Bronze: Rank 3 */}
              <div className="space-y-2">
                {sortedClasses[2] ? (
                  <>
                    <div className="inline-block p-2 bg-amber-50 text-amber-800 rounded-full font-extrabold text-sm border-2 border-amber-200">
                      🥉 3
                    </div>
                    <div className="font-bold text-xs text-gray-800 truncate px-1">
                      {sortedClasses[2].name}
                    </div>
                    <div className="text-xs font-extrabold text-amber-800">
                      {sortedClasses[2].points} Pts
                    </div>
                    <div className="h-12 bg-gradient-to-t from-amber-200/60 to-amber-100/60 rounded-t-xl flex items-center justify-center text-xs font-bold text-amber-900">
                      {sortedClasses[2].totalWeightKg} kg
                    </div>
                  </>
                ) : (
                  <div className="h-12 bg-gray-50 rounded-t-xl" />
                )}
              </div>
            </div>

            {/* Level Filter Tabs */}
            <div className="flex items-center justify-between mt-4 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-medium">Filter Jenjang:</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                {(['all', 'X', 'XI', 'XII'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      levelFilter === lvl
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {lvl === 'all' ? 'Semua' : `Kelas ${lvl}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Nama Kelas</th>
                    <th className="py-2.5 px-3 text-right">Total Setor</th>
                    <th className="py-2.5 px-3 text-right">Poin</th>
                    <th className="py-2.5 px-3 text-right">Kas Kelas</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredClasses.map((cls, idx) => (
                    <tr key={cls.classId} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-3 font-bold text-gray-500">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{cls.name}</div>
                        <div className="text-[11px] text-gray-400">
                          Sie Lingkungan: {cls.representative || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-700">
                        {cls.totalWeightKg} kg
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {cls.points} Pts
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">
                        Rp {(cls.balance || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenRedemptions(cls.classId)}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                        >
                          Tukar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Waste Categories & Live Stream */}
        <div className="space-y-6">
          {/* Category Distribution */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-base">
              Distribusi Kategori Sampah
            </h3>

            <div className="space-y-3">
              {categoryStats.map((cat) => {
                const percent = Math.round((cat.weight / totalCatWeight) * 100);
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-800">{cat.category}</span>
                      <span className="text-gray-500">
                        {cat.weight} kg ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${cat.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Waste Transactions Feed */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-base">Aktivitas Terkini</h3>
              <span className="text-[11px] text-gray-400">Live Updates</span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {transactions.slice(0, 7).map((tx) => (
                <div
                  key={tx.transactionId}
                  className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-gray-200 transition space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-gray-900">
                      {tx.className || tx.classId}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(tx.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">
                      {tx.category} ({tx.weightKg} kg)
                    </span>
                    <span className="font-bold text-emerald-600">
                      +{tx.pointsEarned} Pts
                    </span>
                  </div>
                  {tx.isOfflineQueue && (
                    <div className="text-[10px] text-amber-600 font-semibold">
                      ⏳ Pending Sinkronisasi
                    </div>
                  )}
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs">
                  Belum ada transaksi setor sampah hari ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
