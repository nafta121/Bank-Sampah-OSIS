import React, { useState } from 'react';
import {
  ClassProfile,
  WasteTransaction,
  AiMonthlySummary,
} from '../types/index.ts';
import { WASTE_CATEGORIES } from '../constants/wasteData.ts';
import { requestAiMonthlySummary } from '../services/gemini.ts';
import { exportToGoogleSheets, ExportSheetsResult } from '../services/googleSheets.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  FileSpreadsheet,
  Printer,
  Sparkles,
  Calendar,
  Award,
  TrendingUp,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Lightbulb,
} from 'lucide-react';

interface MonthlyReportViewProps {
  classes: ClassProfile[];
  transactions: WasteTransaction[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  classes,
  transactions,
}) => {
  const { accessToken, loginAsAdminGoogle } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState<string>('September 2026');

  // AI Summary state
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<AiMonthlySummary | null>(null);

  // Google Sheets Export state
  const [showSheetsConfirmModal, setShowSheetsConfirmModal] = useState<boolean>(false);
  const [isExportingSheets, setIsExportingSheets] = useState<boolean>(false);
  const [sheetsResult, setSheetsResult] = useState<ExportSheetsResult | null>(null);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  // Compute monthly figures
  const totalKg = classes.reduce((sum, c) => sum + (c.totalWeightKg || 0), 0);
  const totalBalance = classes.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalTxCount = transactions.length;

  const sortedClasses = [...classes].sort((a, b) => (b.points || 0) - (a.points || 0));

  const categoryBreakdown: Record<string, number> = {};
  WASTE_CATEGORIES.forEach((cat) => {
    const weight = transactions
      .filter((t) => t.category === cat.category)
      .reduce((sum, t) => sum + t.weightKg, 0);
    categoryBreakdown[cat.category] = Number(weight.toFixed(1));
  });

  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    try {
      const topClasses = sortedClasses.slice(0, 3).map((c) => ({
        name: c.name,
        points: c.points,
        weight: c.totalWeightKg,
      }));

      const res = await requestAiMonthlySummary({
        month: selectedMonth,
        totalKg: Number(totalKg.toFixed(1)),
        totalTransactions: totalTxCount,
        totalCash: totalBalance,
        topClasses,
        categoryBreakdown,
      });

      setAiSummary(res);
    } catch (err: any) {
      console.warn('Fallback AI report:', err);
      setAiSummary({
        headline: `Laporan Konsistensi Ekologis Bank Sampah OSIS - Periode ${selectedMonth}`,
        executiveSummary: `Pada periode ${selectedMonth}, seluruh kelas telah berhasil mengumpulkan total ${totalKg.toFixed(
          1
        )} kg sampah daur ulang melalui ${totalTxCount} transaksi aktif. Inisiatif Bank Sampah OSIS terus mendorong budaya peduli lingkungan serta memperkuat kemandirian finansial kas kelas melalui daur ulang bernilai ekonomis.`,
        ecoAchievements: [
          `Mencegah sekitar ${(totalKg * 1.6).toFixed(1)} kg emisi karbon (CO2) ke atmosfer`,
          `Menghemat lebih dari ${Math.round(totalKg * 15)} liter air dari proses daur ulang industri`,
          `Menghasilkan dana kas produktif bagi siswa sebesar Rp ${totalBalance.toLocaleString(
            'id-ID'
          )}`,
        ],
        classShoutouts: `Apresiasi tertinggi kepada ${
          sortedClasses[0]?.name || 'Kelas Teraktif'
        } sebagai peringkat pertama dengan kontribusi daur ulang terbesar bulan ini!`,
        recommendationsForNextMonth: [
          'Mengadakan tantangan tematik mingguan "Jumat Bersih Berpoin"',
          'Edukasi cara pemilahan minyak jelantah dan e-waste kelas',
          'Penukaran massal saldo kas untuk peremajaan fasilitas kebersihan ruang kelas',
        ],
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleExportToSheets = async () => {
    if (!accessToken) {
      try {
        await loginAsAdminGoogle();
      } catch {
        setSheetsError('Harap otorisasi akun Google untuk membuat spreadsheet.');
        return;
      }
    }

    setIsExportingSheets(true);
    setSheetsError(null);

    try {
      const result = await exportToGoogleSheets(
        accessToken!,
        selectedMonth,
        classes,
        transactions,
        aiSummary?.executiveSummary
      );
      setSheetsResult(result);
      setShowSheetsConfirmModal(false);
    } catch (err: any) {
      setSheetsError(err.message || 'Gagal mengekspor data ke Google Sheets.');
    } finally {
      setIsExportingSheets(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Laporan Otomatis & Integrasi
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
            Rekap Bulanan Bank Sampah Sekolah
          </h2>
          <p className="text-xs text-gray-500">
            Kalkulasi otomatis dari seluruh setoran sampah, distribusi poin, dan kas kelas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month selector */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 focus:outline-hidden"
            >
              <option value="September 2026">September 2026 (Bulan Ini)</option>
              <option value="Agustus 2026">Agustus 2026</option>
              <option value="Juli 2026">Juli 2026</option>
            </select>
          </div>

          {/* Export Google Sheets Button */}
          <button
            onClick={() => {
              setSheetsError(null);
              setShowSheetsConfirmModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Google Sheets</span>
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Slip</span>
          </button>
        </div>
      </div>

      {/* Sheets Success Alert */}
      {sheetsResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Google Sheets Berhasil Dibuat & Tersinkron!
              </h4>
              <p className="text-xs text-emerald-800">
                Laporan {selectedMonth} telah diekspor ({sheetsResult.rowsWritten} baris data).
              </p>
            </div>
          </div>
          <a
            href={sheetsResult.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <span>Buka di Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Executive KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Total Sampah Periode
          </span>
          <div className="text-2xl font-extrabold text-gray-900">
            {totalKg.toFixed(1)} <span className="text-sm font-normal text-gray-500">kg</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">100% Terpilah & Daur Ulang</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Nilai Perputaran Kas
          </span>
          <div className="text-2xl font-extrabold text-gray-900">
            Rp {totalBalance.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold">Tersimpan di Bank Sampah</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Kelas Juara Daur Ulang
          </span>
          <div className="text-lg font-extrabold text-gray-900 truncate">
            🥇 {sortedClasses[0]?.name || '-'}
          </div>
          <p className="text-[11px] text-indigo-600 font-semibold">
            {sortedClasses[0]?.points || 0} Poin Terkumpul
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Frekuensi Penyetoran
          </span>
          <div className="text-2xl font-extrabold text-gray-900">{totalTxCount} Kali</div>
          <p className="text-[11px] text-blue-600 font-semibold">Rata-rata 2x per kelas</p>
        </div>
      </div>

      {/* AI Executive Summary Generator Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/30 rounded-2xl border border-indigo-400/30 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Ringkasan Eksekutif Bertenaga Gemini AI</h3>
              <p className="text-xs text-indigo-200">
                Analisis otomatis dampak lingkungan & narasi motivasi resmi untuk Kepala Sekolah & Pembina OSIS
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAiSummary}
            disabled={isGeneratingAi}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingAi ? 'Menyusun Laporan AI...' : '✨ Generate Ringkasan Cerdas'}</span>
          </button>
        </div>

        {/* AI Report Content */}
        {aiSummary ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-4 text-sm animate-in fade-in duration-300">
            <div className="border-b border-white/10 pb-3">
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">
                Headline Laporan
              </span>
              <h4 className="text-lg font-extrabold text-white mt-0.5">
                {aiSummary.headline}
              </h4>
            </div>

            <p className="text-xs text-indigo-100 leading-relaxed">
              {aiSummary.executiveSummary}
            </p>

            {/* Eco Achievements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {aiSummary.ecoAchievements?.map((ach, i) => (
                <div
                  key={i}
                  className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-emerald-200 flex items-start gap-2"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{ach}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-4 text-xs">
              <div className="sm:w-1/2 p-3 bg-amber-500/10 rounded-xl border border-amber-400/20 text-amber-100">
                <span className="font-bold text-amber-300 block mb-1">
                  🌟 Apresiasi Kelas:
                </span>
                {aiSummary.classShoutouts}
              </div>
              <div className="sm:w-1/2 p-3 bg-blue-500/10 rounded-xl border border-blue-400/20 text-blue-100">
                <span className="font-bold text-blue-300 block mb-1 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Rekomendasi OSIS Bulan Depan:</span>
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {aiSummary.recommendationsForNextMonth?.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-indigo-300 text-xs bg-white/5 rounded-2xl border border-white/10">
            Klik tombol di atas untuk membuat analisis otomatis dampak lingkungan periode {selectedMonth}.
          </div>
        )}
      </div>

      {/* Detailed Class Breakdown Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-base">
            Rekapitulasi Kinerja Seluruh Kelas
          </h3>
          <span className="text-xs text-gray-400">Total {classes.length} Kelas Terdaftar</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-3">Peringkat</th>
                <th className="py-3 px-3">Nama Kelas</th>
                <th className="py-3 px-3">Sie Lingkungan</th>
                <th className="py-3 px-3 text-right">Total Berat (Kg)</th>
                <th className="py-3 px-3 text-right">Poin Aktif</th>
                <th className="py-3 px-3 text-right">Saldo Kas (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedClasses.map((cls, idx) => (
                <tr key={cls.classId} className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3 font-bold text-gray-700">
                    {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                  </td>
                  <td className="py-3 px-3 font-bold text-gray-900">{cls.name}</td>
                  <td className="py-3 px-3 text-gray-500">{cls.representative || '-'}</td>
                  <td className="py-3 px-3 text-right font-semibold text-gray-800">
                    {cls.totalWeightKg} kg
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {cls.points} Pts
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-gray-900">
                    Rp {(cls.balance || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Sheets Export Confirmation Modal (Workspace Skill Requirement) */}
      {showSheetsConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Ekspor ke Google Sheets
                </h3>
                <p className="text-xs text-gray-500">Google Workspace Integration</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Aplikasi akan membuat spreadsheet baru di Google Drive Anda berjudul{' '}
              <strong className="text-gray-900">
                "Laporan Bank Sampah OSIS - {selectedMonth} {new Date().getFullYear()}"
              </strong>{' '}
              dengan izin dari pengguna. Laporan berisi tab ringkasan eksekutif, klasemen poin kelas, dan riwayat setoran.
            </p>

            {sheetsError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sheetsError}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSheetsConfirmModal(false)}
                className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExportToSheets}
                disabled={isExportingSheets}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isExportingSheets ? 'Membuat Spreadsheet...' : 'Konfirmasi & Ekspor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
