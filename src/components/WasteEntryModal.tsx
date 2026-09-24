import React, { useState } from 'react';
import {
  ClassProfile,
  WasteCategory,
  WasteTransaction,
  AiWasteAnalysis,
} from '../types/index.ts';
import { WASTE_CATEGORIES } from '../constants/wasteData.ts';
import { requestAiWasteAnalysis } from '../services/gemini.ts';
import { saveTransactionToFirestore } from '../services/firebase.ts';
import { enqueueOfflineTransaction } from '../services/offlineSync.ts';
import { useAuth } from '../context/AuthContext.tsx';
import confetti from 'canvas-confetti';
import {
  Scale,
  Sparkles,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  X,
  Droplets,
  Wind,
  Lightbulb,
} from 'lucide-react';

interface WasteEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassProfile[];
  isOnline: boolean;
  onTransactionSaved: (tx: WasteTransaction, updatedClass: ClassProfile) => void;
}

export const WasteEntryModal: React.FC<WasteEntryModalProps> = ({
  isOpen,
  onClose,
  classes,
  isOnline,
  onTransactionSaved,
}) => {
  const { currentUser } = useAuth();

  // Form states
  const initialClassId =
    currentUser.role === 'class_rep' && currentUser.classId
      ? currentUser.classId
      : classes[0]?.classId || '';

  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>('Plastik & Botol');
  const [weightKg, setWeightKg] = useState<string>('1.5');
  const [notes, setNotes] = useState<string>('');

  // AI Analysis state
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiWasteAnalysis | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCategoryRate =
    WASTE_CATEGORIES.find((c) => c.category === selectedCategory) || WASTE_CATEGORIES[0];
  const parsedWeight = parseFloat(weightKg) || 0;
  const calculatedPoints = Math.round(parsedWeight * currentCategoryRate.pointsPerKg);
  const calculatedCash = Math.round(parsedWeight * currentCategoryRate.pricePerKg);

  const handleAiAnalyze = async () => {
    if (parsedWeight <= 0) {
      setSubmitError('Masukkan berat sampah terlebih dahulu untuk dianalisis.');
      return;
    }
    setSubmitError(null);
    setIsAiAnalyzing(true);
    try {
      const res = await requestAiWasteAnalysis(
        selectedCategory,
        parsedWeight,
        notes || undefined
      );
      setAiAnalysis(res);
      // Auto-update category if AI recommends a better category match
      const matchedCat = WASTE_CATEGORIES.find(
        (c) => c.category.toLowerCase() === res.categoryRecommended?.toLowerCase()
      );
      if (matchedCat) {
        setSelectedCategory(matchedCat.category);
      }
    } catch (err: any) {
      console.warn('AI analysis fallback:', err);
      // Local fallback calculation
      setAiAnalysis({
        categoryRecommended: selectedCategory,
        pointEstimate: calculatedPoints,
        cashEstimate: calculatedCash,
        ecoImpact: {
          co2SavedKg: Number((parsedWeight * 1.5).toFixed(1)),
          waterSavedLiter: Math.round(parsedWeight * 15),
          treeEquivalent: `Mencegah ${parsedWeight} kg sampah menumpuk di TPA sekolah`,
        },
        segregationTip: 'Pastikan sampah dalam keadaan kering dan telah dipadatkan agar hemat ruang.',
        upcycleIdea: 'Dapat diolah menjadi kerajinan ecobrick atau pot tanaman hias kelas.',
      });
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedWeight <= 0) {
      setSubmitError('Berat sampah harus lebih dari 0 kg');
      return;
    }

    const targetClass = classes.find((c) => c.classId === selectedClassId);
    if (!targetClass) {
      setSubmitError('Kelas tidak ditemukan');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const tx: WasteTransaction = {
      transactionId: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: targetClass.classId,
      className: targetClass.name,
      category: selectedCategory,
      weightKg: parsedWeight,
      pointsEarned: calculatedPoints,
      cashEarned: calculatedCash,
      recordedBy: currentUser.displayName || 'Petugas OSIS',
      timestamp: new Date().toISOString(),
      status: isOnline ? 'synced' : 'pending',
      notes: notes.trim() || undefined,
    };

    try {
      if (isOnline) {
        const updated = await saveTransactionToFirestore(tx, targetClass);
        onTransactionSaved(tx, updated);
      } else {
        // Enqueue offline
        enqueueOfflineTransaction(tx, targetClass);
        const updatedLocal: ClassProfile = {
          ...targetClass,
          points: (targetClass.points || 0) + tx.pointsEarned,
          balance: (targetClass.balance || 0) + tx.cashEarned,
          totalWeightKg: Number(((targetClass.totalWeightKg || 0) + tx.weightKg).toFixed(2)),
          updatedAt: new Date().toISOString(),
        };
        onTransactionSaved(tx, updatedLocal);
      }

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#F59E0B', '#3B82F6'],
      });

      setSubmitSuccess(
        isOnline
          ? `Berhasil! +${calculatedPoints} Poin & Rp ${calculatedCash.toLocaleString('id-ID')} dicatat ke ${targetClass.name}`
          : `Mode Offline: Transaksi tersimpan di perangkat (+${calculatedPoints} Poin). Akan otomatis sinkron saat online!`
      );

      setTimeout(() => {
        setSubmitSuccess(null);
        setWeightKg('1.0');
        setNotes('');
        setAiAnalysis(null);
        onClose();
      }, 1600);
    } catch (err: any) {
      console.error('Failed saving transaction:', err);
      // Fallback to offline queue
      enqueueOfflineTransaction(tx, targetClass);
      setSubmitSuccess('Disimpan secara offline karena kendala jaringan. Akan disinkronkan nanti.');
      setTimeout(() => {
        setSubmitSuccess(null);
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 w-full max-w-xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1 rounded-full hover:bg-emerald-800/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-xs">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Pendataan Setor Sampah Kelas</h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isOnline
                      ? 'bg-emerald-500/50 text-white border border-emerald-300/40'
                      : 'bg-amber-500/60 text-white border border-amber-300/40'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3" /> Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" /> Offline (Antrean)
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Konversi sampah terpilah menjadi poin reward dan kas kelas
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Class selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Kelas Penyetor
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={currentUser.role === 'class_rep'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-gray-800 bg-gray-50/50"
            >
              {classes.map((cls) => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.name} — Saldo: Rp {(cls.balance || 0).toLocaleString('id-ID')} ({cls.points || 0} Poin)
                </option>
              ))}
            </select>
            {currentUser.role === 'class_rep' && (
              <p className="text-[11px] text-gray-400 mt-1">
                Terkunci pada identitas kelas yang sedang aktif login.
              </p>
            )}
          </div>

          {/* Waste Category Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Kategori Sampah
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {WASTE_CATEGORIES.map((cat) => {
                const isSelected = cat.category === selectedCategory;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.category);
                      setAiAnalysis(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-900 leading-snug">
                        {cat.category}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                        +{cat.pointsPerKg} Poin/kg
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Rp {cat.pricePerKg.toLocaleString('id-ID')}/kg
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weight Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Berat Sampah (Kilogram)
              </label>
              <span className="text-xs font-semibold text-emerald-600">
                Poin: +{calculatedPoints} | Nilai Kas: Rp {calculatedCash.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="500"
                value={weightKg}
                onChange={(e) => {
                  setWeightKg(e.target.value);
                  setAiAnalysis(null);
                }}
                className="w-full pl-4 pr-14 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-lg font-bold text-gray-900"
                placeholder="Contoh: 2.5"
              />
              <span className="absolute right-4 top-3.5 text-sm font-bold text-gray-400">
                Kg
              </span>
            </div>

            {/* Quick weight presets */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-gray-400">Pintasan:</span>
              {[0.5, 1.0, 2.5, 5.0, 10.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setWeightKg(preset.toString());
                    setAiAnalysis(null);
                  }}
                  className="px-2 py-0.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
                >
                  +{preset} kg
                </button>
              ))}
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Catatan / Kondisi Sampah (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Botol PET bersih tanpa label, kardus terikat rapi"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
            />
          </div>

          {/* AI Advisor Button */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-emerald-50/50 to-teal-50/70 p-4 rounded-xl border border-indigo-100/80">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">
                    Eco-AI Smart Waste Advisor
                  </h4>
                  <p className="text-[11px] text-indigo-700">
                    Analisis dampak emisi karbon & liter air yang dihemat kelas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAiAnalyze}
                disabled={isAiAnalyzing}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAiAnalyzing ? 'Menganalisis...' : '✨ Analisis Cerdas'}
              </button>
            </div>

            {/* AI Result Card */}
            {aiAnalysis && (
              <div className="mt-3 pt-3 border-t border-indigo-100 space-y-2.5 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100">
                    <Wind className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-500">Mencegah Emisi</div>
                      <div className="font-bold text-emerald-700">
                        {aiAnalysis.ecoImpact.co2SavedKg} kg CO₂
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100">
                    <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-500">Air Dihemat</div>
                      <div className="font-bold text-blue-700">
                        {aiAnalysis.ecoImpact.waterSavedLiter} Liter
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-700 bg-white/80 p-2.5 rounded-lg border border-indigo-100 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-gray-900">Tips Pemilahan:</strong>{' '}
                      {aiAnalysis.segregationTip}
                    </span>
                  </div>
                  {aiAnalysis.upcycleIdea && (
                    <div className="flex items-start gap-1.5 pt-1 border-t border-gray-100">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-gray-900">Ide Daur Ulang:</strong>{' '}
                        {aiAnalysis.upcycleIdea}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan Transaksi...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    Simpan Setoran (+{calculatedPoints} Poin / Rp{' '}
                    {calculatedCash.toLocaleString('id-ID')})
                  </span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-gray-400 mt-2">
              Petugas pencatat: {currentUser.displayName || 'OSIS'}. Notifikasi reward akan
              otomatis aktif jika saldo kelas mencukupi.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
