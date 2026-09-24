import React, { useState } from 'react';
import {
  ClassProfile,
  WasteTransaction,
  NotificationItem,
} from '../types/index.ts';
import { WASTE_CATEGORIES, REWARD_ITEMS } from '../constants/wasteData.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Leaderboard } from './Leaderboard.tsx';
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
  School,
  Shield,
  Store,
  History,
  CheckCircle,
  ArrowRight,
  RotateCcw,
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
  const { currentUser } = useAuth();
  const isClassRep = currentUser.role === 'class_rep';

  const [levelFilter, setLevelFilter] = useState<'all' | 'X' | 'XI' | 'XII'>('all');

  // Compute school-wide metrics
  const totalKg = classes.reduce((sum, c) => sum + (c.totalWeightKg || 0), 0);
  const totalBalance = classes.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalPoints = classes.reduce((sum, c) => sum + (c.points || 0), 0);

  // Sort classes for ranking
  const sortedClasses = [...classes].sort((a, b) => (b.points || 0) - (a.points || 0));

  // Find class profile for class rep
  const myClassId = currentUser.classId;
  const myClass = classes.find((c) => c.classId === myClassId) || sortedClasses[0];
  const myRank = sortedClasses.findIndex((c) => c.classId === myClass?.classId) + 1;
  const myClassTransactions = transactions.filter((t) => t.classId === myClass?.classId);

  // Monthly target for school
  const MONTHLY_TARGET_KG = 500;
  const targetPercent = Math.min(100, Math.round((totalKg / MONTHLY_TARGET_KG) * 100));

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

  // ==========================================
  // VIEW UNTUK PERWAKILAN KELAS
  // ==========================================
  if (isClassRep && myClass) {
    const canRedeemAny = REWARD_ITEMS.some(
      (r) => (myClass.points || 0) >= r.pointsCost || (myClass.balance || 0) >= r.cashCost
    );

    return (
      <div className="space-y-6">
        {/* Class Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100">
                <School className="w-3.5 h-3.5 text-amber-300" />
                <span>Portal Resmi Kelas {myClass.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Tabungan Sampah & Poin {myClass.name}
              </h1>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                Pantau poin daur ulang, saldo kas kelas, dan tukarkan poin dengan perlengkapan di Koperasi Siswa (Kopsis) dengan kode unik resmi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenRedemptions(myClass.classId)}
                className="px-5 py-3.5 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-2xl font-extrabold text-sm shadow-lg shadow-amber-400/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Tukar Poin di Kopsis</span>
              </button>
            </div>
          </div>

          {/* Quick Notice about Class Permissions */}
          <div className="mt-6 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>
                Sie Lingkungan: <strong>{myClass.representative || '-'}</strong> • Username: <code className="bg-white/15 px-1.5 py-0.5 rounded font-mono text-white">{myClass.username || myClass.classId.toLowerCase()}</code>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Poin otomatis direset menjadi 0 setelah ditukarkan di Kopsis</span>
            </div>
          </div>
        </div>

        {/* Class Specific KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Poin Kelas */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2 hover:shadow-md transition">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Poin Kelas Saya</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-indigo-700">
              {myClass.points}{' '}
              <span className="text-xs font-bold text-indigo-500">Pts</span>
            </div>
            <p className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{canRedeemAny ? 'Siap ditukar hadiah di Kopsis' : 'Kumpulkan lebih banyak sampah'}</span>
            </p>
          </div>

          {/* Card 2: Saldo Kas Kelas */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2 hover:shadow-md transition">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Saldo Kas Kelas</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700">
              Rp {(myClass.balance || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">
              Kas murni hasil daur ulang kelas
            </p>
          </div>

          {/* Card 3: Total Sampah */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2 hover:shadow-md transition">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Volume Sampah Disetor</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">
              {myClass.totalWeightKg.toFixed(1)}{' '}
              <span className="text-sm font-semibold text-gray-500">Kg</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Mengurangi ~{(myClass.totalWeightKg * 1.6).toFixed(1)} kg emisi CO2</span>
            </p>
          </div>

          {/* Card 4: Posisi Leaderboard */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2 hover:shadow-md transition">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Peringkat Sekolah</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 flex items-center gap-2">
              <span>#{myRank}</span>
              <span className="text-xs font-semibold text-gray-400">dari {classes.length} kelas</span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium">
              {myRank <= 3 ? '🎉 Masuk 3 Besar Eco Champion!' : 'Pertahankan aksi pilah sampah!'}
            </p>
          </div>
        </div>

        {/* Main Content Grid: Leaderboard (Left) & Riwayat Setoran Kelas Sendiri (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard Top 5 Real-Time */}
          <div>
            <Leaderboard
              classes={classes}
              onOpenRedemptions={(clsId) => onOpenRedemptions(clsId)}
              onOpenWasteEntry={undefined}
            />
          </div>

          {/* Riwayat Setoran Kelas Sendiri */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Riwayat Setoran {myClass.name}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Data setoran sampah resmi yang telah diverifikasi oleh OSIS
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                {myClassTransactions.length} Setoran
              </span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {myClassTransactions.slice(0, 8).map((tx) => (
                <div
                  key={tx.transactionId}
                  className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-gray-900">{tx.category}</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold">
                      +{tx.pointsEarned} Poin
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>
                      {tx.weightKg} kg • Tambahan Kas: <strong>Rp {tx.cashEarned.toLocaleString('id-ID')}</strong>
                    </span>
                    <span>
                      {new Date(tx.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {myClassTransactions.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-xs space-y-2">
                  <History className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="font-semibold text-gray-600">Belum ada riwayat setoran</p>
                  <p>Bawa sampah kelasmu yang sudah terpilah ke bank sampah OSIS untuk ditimbang!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kopsis Reward Highlight Card */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              <Store className="w-3.5 h-3.5" />
              <span>Pengambilan Barang di Kopsis</span>
            </div>
            <h4 className="text-xl font-black">Siap Menukarkan Poin Kelas?</h4>
            <p className="text-xs text-amber-100 max-w-xl">
              Tukarkan poin kelas Anda dengan paket kebersihan, bibit tanaman, atau voucher kantin. Kode unik akan diterbitkan untuk ditunjukkan ke petugas Kopsis, dan poin kelas akan direset secara otomatis.
            </p>
          </div>
          <button
            onClick={() => onOpenRedemptions(myClass.classId)}
            className="px-5 py-3 bg-white hover:bg-amber-50 text-amber-900 rounded-2xl text-xs font-extrabold shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Buka Katalog Kopsis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW UNTUK MASTER ADMIN OSIS
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Hero OSIS Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Master Admin OSIS • Portal Pengurus</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pusat Manajemen Bank Sampah Sekolah
            </h1>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Catat setoran sampah setiap kelas, pantau leaderboard real-time, kelola penukaran kopsis, dan ekspor laporan berkala ke Google Sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenWasteEntry}
              className="px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-emerald-950 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-emerald-950" />
              <span>+ Catat Setoran Sampah</span>
            </button>
            <button
              onClick={onOpenReports}
              className="px-4 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-semibold text-sm transition backdrop-blur-md text-white cursor-pointer"
            >
              Laporan Bulanan
            </button>
          </div>
        </div>

        {/* School Target Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/15">
          <div className="flex justify-between items-center text-xs font-medium mb-2">
            <span>
              Target Bulan Ini:{' '}
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
            Tersimpan aman untuk masing-masing kelas
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
            Siap ditukar reward di Kopsis
          </p>
        </div>

        {/* Card 4: Top Class */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Peringkat 1 Saat Ini</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-gray-900 truncate">
            {sortedClasses[0]?.name || '-'}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold">
            {sortedClasses[0]?.points || 0} Pts • {sortedClasses[0]?.totalWeightKg || 0} kg
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Leaderboard Top 5 Component */}
        <div className="lg:col-span-1">
          <Leaderboard
            classes={classes}
            onOpenRedemptions={onOpenRedemptions}
            onOpenWasteEntry={onOpenWasteEntry}
          />
        </div>

        {/* Middle & Right Column: Master School Breakdown & Live Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Distribution */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-base">
              Distribusi Kategori Sampah Sekolah
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryStats.map((cat) => {
                const percent = Math.round((cat.weight / totalCatWeight) * 100);
                return (
                  <div key={cat.category} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-800">{cat.category}</span>
                      <span className="text-gray-500">
                        {cat.weight} kg ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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

          {/* Master Recent Transactions Feed */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-base">Audit Log Transaksi Terkini</h3>
              <span className="text-[11px] text-gray-400">Real-Time Firestore</span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {transactions.slice(0, 8).map((tx) => (
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
                      +{tx.pointsEarned} Pts • +Rp {tx.cashEarned.toLocaleString('id-ID')}
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
