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
  Sparkles,
  Trees,
  Trash2,
  Wallet,
  Coffee,
  Ticket,
  Copy,
  Check,
  Printer,
  Store,
  QrCode,
  User,
  ArrowRight,
  RotateCcw,
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
  const isClassRep = currentUser.role === 'class_rep';

  // If class representative, strictly lock to their own class
  const activeClassId = isClassRep && currentUser.classId
    ? currentUser.classId
    : propClassId || classes[0]?.classId || '';

  // Selected reward modal state
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [useBalanceMethod, setUseBalanceMethod] = useState<boolean>(false);
  const [studentPickerName, setStudentPickerName] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  // Completed voucher modal state (for Kopsis pickup)
  const [activeVoucher, setActiveVoucher] = useState<RewardRedemption | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

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

  const handleOpenRedeemModal = (reward: RewardItem) => {
    setSelectedReward(reward);
    setRedeemError(null);
    setStudentPickerName(currentClass?.representative || '');
    // Default to points if available, else balance
    const canAffordPoints = (currentClass?.points || 0) >= reward.pointsCost;
    setUseBalanceMethod(!canAffordPoints);
  };

  const handleConfirmRedemption = async () => {
    if (!currentClass || !selectedReward) return;
    setIsRedeeming(true);
    setRedeemError(null);

    // Validate balance or points
    if (useBalanceMethod) {
      if ((currentClass.balance || 0) < selectedReward.cashCost) {
        setRedeemError(
          `Saldo kas tidak mencukupi (Kurang Rp ${(
            selectedReward.cashCost - (currentClass.balance || 0)
          ).toLocaleString('id-ID')})`
        );
        setIsRedeeming(false);
        return;
      }
    } else {
      if ((currentClass.points || 0) < selectedReward.pointsCost) {
        setRedeemError(
          `Poin daur ulang tidak mencukupi (Kurang ${
            selectedReward.pointsCost - (currentClass.points || 0)
          } Poin)`
        );
        setIsRedeeming(false);
        return;
      }
    }

    try {
      const picker = studentPickerName.trim() || currentClass.representative || 'Perwakilan Siswa';
      const { updatedClass, redemptionDoc } = await redeemRewardInFirestore(
        currentClass,
        selectedReward,
        useBalanceMethod,
        picker
      );

      onClassUpdated(updatedClass);

      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });

      setSelectedReward(null);
      setActiveVoucher(redemptionDoc);
    } catch (err: any) {
      setRedeemError(err.message || 'Gagal memproses penukaran reward.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (!currentClass) {
    return <div className="p-10 text-center text-gray-400">Data kelas belum tersedia.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Class Selector & Overview Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 mb-2">
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Koperasi Siswa (Kopsis) • Penukaran Poin</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {currentClass.name}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Koordinator: <strong>{currentClass.representative || 'Seksi Lingkungan'}</strong> • Username: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{currentClass.username || currentClass.classId.toLowerCase()}</code>
          </p>
        </div>

        {/* Informative notice on automated points reset */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 max-w-md">
          <div className="flex items-center gap-2 font-bold mb-0.5">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Sistem Otomatisasi Reset Poin Kopsis</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            Setiap penukaran poin akan menghasilkan <strong>Kode Unik Kopsis</strong> untuk pengambilan barang. Setelah ditukarkan, poin kelas akan <strong>tereset otomatis ke 0 Pts</strong>.
          </p>
        </div>
      </div>

      {/* Class Balances Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Points */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-md shadow-indigo-600/15 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-100">
            <span className="text-xs font-bold uppercase tracking-wider">Poin Daur Ulang Aktif</span>
            <Award className="w-5 h-5 text-indigo-200" />
          </div>
          <div className="text-3xl font-black">{currentClass.points} Pts</div>
          <p className="text-xs text-indigo-200">
            Dapat ditukar perlengkapan kebersihan & bibit tanaman di Kopsis
          </p>
        </div>

        {/* Cash Balance */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-md shadow-emerald-600/15 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-100">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Kas Terkumpul</span>
            <Coins className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-3xl font-black">
            Rp {(currentClass.balance || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-emerald-200">
            Dapat dicairkan langsung ke kas bendahara kelas
          </p>
        </div>

        {/* Total Weight */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-md shadow-amber-500/15 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-100">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sampah Disetor</span>
            <Gift className="w-5 h-5 text-amber-200" />
          </div>
          <div className="text-3xl font-black">{currentClass.totalWeightKg} Kg</div>
          <p className="text-xs text-amber-100">
            Jejak aksi peduli lingkungan nyata kelas
          </p>
        </div>
      </div>

      {/* Rewards Catalog */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg">Katalog Penukaran Barang Kopsis</h3>
            <p className="text-xs text-gray-500">
              Pilih item yang ingin ditukarkan menggunakan poin kelas. Setelah ditukar, siswa mendapatkan kode unik pengambilan di Kopsis.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <Store className="w-4 h-4" />
            <span>Lokasi Ambil: Koperasi Siswa</span>
          </div>
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
                    onClick={() => handleOpenRedeemModal(reward)}
                    disabled={!canAffordAny}
                    className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      canAffordAny
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Tukar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Riwayat Penukaran Reward dengan Kode Unik Kopsis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setoran Sampah Kelas */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-base">Riwayat Setoran {currentClass.name}</h3>
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

        {/* Riwayat Klaim & Kode Unik Kopsis */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Voucher & Kode Unik Kopsis</h3>
              <p className="text-[11px] text-gray-400">
                Gunakan kode unik untuk mengambil barang di Koperasi Siswa
              </p>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {classRedemptions.length} penukaran
            </span>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {classRedemptions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                Belum ada penukaran reward oleh kelas ini. Tukarkan poin untuk mendapatkan kode unik Kopsis!
              </div>
            ) : (
              classRedemptions.map((red) => (
                <div
                  key={red.redemptionId}
                  className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-extrabold text-amber-950 text-sm">
                        {red.rewardTitle}
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        Pengambil: <strong>{red.studentName || 'Perwakilan Kelas'}</strong>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">
                      Siap Diambil di Kopsis
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase">Kode Kopsis:</span>
                      <code className="px-2 py-1 bg-white font-mono font-extrabold text-indigo-700 rounded-lg border border-amber-300 shadow-xs text-xs tracking-wider">
                        {red.uniqueCode || 'KOPS-PROMO'}
                      </code>
                    </div>

                    <button
                      onClick={() => setActiveVoucher(red)}
                      className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg transition text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Lihat Voucher</span>
                    </button>
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
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Konfirmasi Penukaran Kopsis</h3>
                  <p className="text-xs text-gray-500">
                    Untuk {currentClass.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReward(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Selected item details */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm space-y-1">
              <div className="font-bold text-gray-900">{selectedReward.title}</div>
              <p className="text-xs text-gray-600">{selectedReward.description}</p>
            </div>

            {/* Student Picker Name Input */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                Nama Siswa Pengambil di Kopsis
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Nama lengkap siswa yang mengambil"
                  value={studentPickerName}
                  onChange={(e) => setStudentPickerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Nama ini akan dicantumkan pada tiket voucher pengambilan Kopsis.
              </p>
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
                  className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                    !useBalanceMethod
                      ? 'border-indigo-600 bg-indigo-50/70 font-bold text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <div>Pakai Poin Kelas</div>
                  <div className="font-extrabold text-indigo-600 mt-1">
                    {selectedReward.pointsCost} Poin
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Poin aktif: {currentClass.points} Pts
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUseBalanceMethod(true)}
                  className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                    useBalanceMethod
                      ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <div>Pakai Saldo Kas</div>
                  <div className="font-extrabold text-emerald-600 mt-1">
                    Rp {selectedReward.cashCost.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Saldo kas: Rp {(currentClass.balance || 0).toLocaleString('id-ID')}
                  </div>
                </button>
              </div>
            </div>

            {/* Point Reset Alert */}
            {!useBalanceMethod && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Perhatian:</strong> Sesuai aturan penukaran, setelah voucher dikonfirmasi maka poin kelas akan <strong>di-reset otomatis menjadi 0 Pts</strong> dan diterbitkan kode unik Kopsis.
                </span>
              </div>
            )}

            {redeemError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{redeemError}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                className="w-1/2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRedemption}
                disabled={isRedeeming}
                className="w-1/2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isRedeeming ? 'Memproses...' : 'Konfirmasi & Terbitkan Kode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Kopsis Pickup Voucher Modal */}
      {activeVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-amber-200 w-full max-w-md overflow-hidden relative">
            {/* Voucher Header Ribbon */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white text-center relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2">
                <Store className="w-3.5 h-3.5" />
                <span>Koperasi Siswa (Kopsis) Voucher</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">
                Voucher Pengambilan Barang
              </h3>
              <p className="text-xs text-amber-100 mt-1">
                Tunjukkan bukti ini kepada pengurus Kopsis untuk serah terima barang
              </p>
            </div>

            {/* Voucher Code Box */}
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border-2 border-dashed border-amber-300 text-center space-y-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">
                  KODE UNIK PENGAMBILAN KOPSIS
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-900 tracking-widest bg-white py-2 px-3 rounded-xl border border-amber-200 shadow-xs inline-block">
                  {activeVoucher.uniqueCode || 'KOPS-PROMO'}
                </div>
                <div>
                  <button
                    onClick={() => copyToClipboard(activeVoucher.uniqueCode || 'KOPS-PROMO')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kode Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode Kopsis</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Reset Point Confirmation Pill */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Poin Kelas Tereset Otomatis:</strong> Poin kelas Anda kini direset menjadi 0 Pts.
                </span>
              </div>

              {/* Details List */}
              <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama Barang / Hadiah</span>
                  <span className="font-extrabold text-gray-900">{activeVoucher.rewardTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kelas Penukar</span>
                  <span className="font-bold text-gray-800">{activeVoucher.className || currentClass.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Siswa Pengambil</span>
                  <span className="font-bold text-gray-800">{activeVoucher.studentName || currentClass.representative}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Waktu Penukaran</span>
                  <span className="font-medium text-gray-700">
                    {new Date(activeVoucher.requestedAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200/80 pt-2">
                  <span className="text-gray-500">Lokasi Penukaran</span>
                  <span className="font-bold text-emerald-700">Koperasi Siswa (Kopsis) Sekolah</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Tiket Kopsis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVoucher(null)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
