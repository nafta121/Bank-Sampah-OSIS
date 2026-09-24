import React, { useState } from 'react';
import {
  ClassProfile,
  RewardItem,
  RewardRedemption,
  WasteTransaction,
} from '../types/index.ts';
import { REWARD_ITEMS } from '../constants/wasteData.ts';
import { redeemRewardInFirestore } from '../services/firebase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import confetti from 'canvas-confetti';
import {
  Award,
  Coins,
  Gift,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Trees,
  Trash2,
  Wallet,
  Coffee,
  Clock,
} from 'lucide-react';

interface ClassPointsViewProps {
  classes: ClassProfile[];
  redemptions: RewardRedemption[];
  transactions: WasteTransaction[];
  selectedClassId?: string;
  onClassUpdated: (updated: ClassProfile) => void;
}

export const ClassPointsView: React.FC<ClassPointsViewProps> = ({
  classes,
  redemptions,
  transactions,
  selectedClassId: propClassId,
  onClassUpdated,
}) => {
  const { currentUser } = useAuth();
  const [activeClassId, setActiveClassId] = useState<string>(
    propClassId || (currentUser.role === 'class_rep' && currentUser.classId) || classes[0]?.classId || ''
  );

  // Selected reward modal state
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [useBalanceMethod, setUseBalanceMethod] = useState<boolean>(false);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const currentClass = classes.find((c) => c.classId === activeClassId) || classes[0];

  const classTransactions = transactions.filter((t) => t.classId === activeClassId);
  const classRedemptions = redemptions.filter((r) => r.classId === activeClassId);

  const getRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'Trees':
        return <Trees className="w-5 h-5 text-emerald-500" />;
      case 'Trash2':
        return <Trash2 className="w-5 h-5 text-blue-500" />;
      case 'Wallet':
      case 'Banknote':
        return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-orange-500" />;
      default:
        return <Gift className="w-5 h-5 text-indigo-500" />;
    }
  };

  const handleConfirmRedemption = async () => {
    if (!currentClass || !selectedReward) return;
    setIsRedeeming(true);
    setRedeemError(null);

    // Validate balance or points
    if (useBalanceMethod) {
      if ((currentClass.balance || 0) < selectedReward.cashCost) {
        setRedeemError(`Saldo kas tidak mencukupi (Kurang Rp ${(selectedReward.cashCost - (currentClass.balance || 0)).toLocaleString('id-ID')})`);
        setIsRedeeming(false);
        return;
      }
    } else {
      if ((currentClass.points || 0) < selectedReward.pointsCost) {
        setRedeemError(`Poin daur ulang tidak mencukupi (Kurang ${selectedReward.pointsCost - (currentClass.points || 0)} Poin)`);
        setIsRedeeming(false);
        return;
      }
    }

    try {
      const updated = await redeemRewardInFirestore(currentClass, selectedReward, useBalanceMethod);
      onClassUpdated(updated);

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });

      setRedeemSuccess(`Selamat! Penukaran "${selectedReward.title}" berhasil dicatat untuk ${currentClass.name}.`);
      setTimeout(() => {
        setRedeemSuccess(null);
        setSelectedReward(null);
      }, 1800);
    } catch (err: any) {
      setRedeemError(err.message || 'Gagal memproses penukaran reward.');
    } finally {
      setIsRedeeming(false);
    }
  };

  if (!currentClass) {
    return <div className="p-10 text-center text-gray-400">Data kelas belum tersedia.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Class Selector & Overview Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Manajemen Poin & Reward
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
            {currentClass.name}
          </h2>
          <p className="text-xs text-gray-500">
            Perwakilan: {currentClass.representative || 'Koordinator Kelas'} • ID: {currentClass.classId}
          </p>
        </div>

        {/* Dropdown if admin or user wants to switch class */}
        {currentUser.role !== 'class_rep' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500 shrink-0">
              Pilih Kelas:
            </label>
            <select
              value={activeClassId}
              onChange={(e) => setActiveClassId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-gray-800 bg-gray-50"
            >
              {classes.map((cls) => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Class Balances Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Points */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl text-white shadow-md shadow-indigo-500/15 space-y-1">
          <div className="flex items-center justify-between text-indigo-100">
            <span className="text-xs font-bold uppercase tracking-wider">Poin Daur Ulang</span>
            <Award className="w-5 h-5 text-indigo-200" />
          </div>
          <div className="text-3xl font-extrabold">{currentClass.points} Pts</div>
          <p className="text-xs text-indigo-200">
            Dapat ditukar perlengkapan kebersihan & bibit tanaman
          </p>
        </div>

        {/* Cash Balance */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-md shadow-emerald-600/15 space-y-1">
          <div className="flex items-center justify-between text-emerald-100">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Kas Terkumpul</span>
            <Coins className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-3xl font-extrabold">
            Rp {(currentClass.balance || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-emerald-200">
            Dapat dicairkan langsung ke kas bendahara kelas
          </p>
        </div>

        {/* Total Weight */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl text-white shadow-md shadow-amber-500/15 space-y-1">
          <div className="flex items-center justify-between text-amber-100">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sampah Terkumpul</span>
            <Gift className="w-5 h-5 text-amber-200" />
          </div>
          <div className="text-3xl font-extrabold">{currentClass.totalWeightKg} Kg</div>
          <p className="text-xs text-amber-100">
            Jejak aksi peduli lingkungan nyata kelas
          </p>
        </div>
      </div>

      {/* Rewards Catalog */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Katalog Penukaran Reward Kelas</h3>
          <p className="text-xs text-gray-500">
            Pilih hadiah atau fasilitas yang ingin ditukarkan menggunakan poin daur ulang atau saldo kas kelas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REWARD_ITEMS.map((reward) => {
            const canAffordPoints = (currentClass.points || 0) >= reward.pointsCost;
            const canAffordCash = (currentClass.balance || 0) >= reward.cashCost;
            const canAffordAny = canAffordPoints || canAffordCash;

            return (
              <div
                key={reward.id}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                  canAffordAny
                    ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400 hover:shadow-md'
                    : 'border-gray-200 bg-gray-50/40 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-white rounded-xl shadow-xs border border-gray-100">
                      {getRewardIcon(reward.icon)}
                    </div>
                    {canAffordAny ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Siap Tukar
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-400">
                        Belum cukup
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-gray-900 leading-snug">
                      {reward.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {reward.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-indigo-700">
                      {reward.pointsCost} Poin
                    </div>
                    <div className="text-[11px] text-gray-500 font-semibold">
                      atau Rp {reward.cashCost.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedReward(reward);
                      setUseBalanceMethod(!canAffordPoints && canAffordCash);
                      setRedeemError(null);
                    }}
                    disabled={!canAffordAny}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                      canAffordAny
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Tukar Sekarang
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Tabs: Waste deposits vs Rewards redeemed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setoran Sampah Kelas */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-base">Riwayat Setoran Kelas</h3>
            <span className="text-xs text-gray-400 font-medium">
              {classTransactions.length} kali setor
            </span>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {classTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                Belum ada transaksi setor sampah untuk kelas ini.
              </div>
            ) : (
              classTransactions.map((tx) => (
                <div
                  key={tx.transactionId}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1"
                >
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>{tx.category}</span>
                    <span className="text-emerald-600">+{tx.pointsEarned} Poin</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>
                      {tx.weightKg} kg • Rp {tx.cashEarned.toLocaleString('id-ID')}
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
              ))
            )}
          </div>
        </div>

        {/* Riwayat Penukaran Reward */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-base">Riwayat Klaim Hadiah</h3>
            <span className="text-xs text-gray-400 font-medium">
              {classRedemptions.length} penukaran
            </span>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {classRedemptions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                Belum ada klaim hadiah yang ditukarkan kelas ini.
              </div>
            ) : (
              classRedemptions.map((red) => (
                <div
                  key={red.redemptionId}
                  className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs space-y-1"
                >
                  <div className="flex justify-between font-bold text-amber-950">
                    <span>{red.rewardTitle}</span>
                    <span className="text-emerald-700 font-extrabold">Disetujui</span>
                  </div>
                  <div className="flex justify-between text-amber-800 text-[11px]">
                    <span>
                      {red.pointsSpent > 0
                        ? `-${red.pointsSpent} Poin`
                        : `-Rp ${red.cashSpent.toLocaleString('id-ID')} Saldo Kas`}
                    </span>
                    <span>
                      {new Date(red.requestedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Redemption Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Konfirmasi Penukaran</h3>
                  <p className="text-xs text-gray-500">
                    Untuk {currentClass.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReward(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm space-y-1">
              <div className="font-bold text-gray-900">{selectedReward.title}</div>
              <p className="text-xs text-gray-600">{selectedReward.description}</p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUseBalanceMethod(false)}
                  className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                    !useBalanceMethod
                      ? 'border-indigo-600 bg-indigo-50/70 font-bold text-indigo-950'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <div>Pakai Poin</div>
                  <div className="font-extrabold text-indigo-600 mt-1">
                    {selectedReward.pointsCost} Poin
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Sisa: {currentClass.points} Pts
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUseBalanceMethod(true)}
                  className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                    useBalanceMethod
                      ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <div>Pakai Saldo Kas</div>
                  <div className="font-extrabold text-emerald-600 mt-1">
                    Rp {selectedReward.cashCost.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Sisa: Rp {(currentClass.balance || 0).toLocaleString('id-ID')}
                  </div>
                </button>
              </div>
            </div>

            {redeemError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{redeemError}</span>
              </div>
            )}

            {redeemSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{redeemSuccess}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRedemption}
                disabled={isRedeeming}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isRedeeming ? 'Memproses...' : 'Konfirmasi Penukaran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
