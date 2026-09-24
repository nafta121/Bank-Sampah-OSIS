import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ClassProfile } from '../types/index.ts';
import {
  Recycle,
  Shield,
  KeyRound,
  School,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Award,
  Users,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  Lock,
} from 'lucide-react';

interface LoginPageProps {
  classes: ClassProfile[];
  isOnline: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ classes, isOnline }) => {
  const { loginAsClass, loginWithUsernameAndPin, loginAsAdminPin, loginAsAdminGoogle, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'class' | 'admin'>('class');

  // Class login state
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.classId || 'X-MIPA-1');
  const [usernameInput, setUsernameInput] = useState<string>(
    classes[0]?.username || classes[0]?.classId.toLowerCase() || 'x-mipa-1'
  );
  const [classPin, setClassPin] = useState<string>('123456');
  const [classError, setClassError] = useState<string>('');
  const [classSuccess, setClassSuccess] = useState<string>('');

  // Admin login state
  const [adminPin, setAdminPin] = useState<string>('1234');
  const [adminError, setAdminError] = useState<string>('');
  const [adminSuccess, setAdminSuccess] = useState<string>('');

  const selectedClass = classes.find(
    (c) =>
      c.classId === selectedClassId ||
      (c.username && c.username.toLowerCase() === usernameInput.toLowerCase()) ||
      c.classId.toLowerCase() === usernameInput.toLowerCase()
  ) || classes[0];

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClassError('');
    setClassSuccess('');

    // Try authenticating with username & pin
    const res = loginWithUsernameAndPin(usernameInput, classPin, classes);
    if (res.success) {
      setClassSuccess(`Berhasil masuk! Selamat datang ${selectedClass?.name || usernameInput}`);
    } else {
      setClassError(res.error || 'Autentikasi gagal. Periksa username dan PIN 123456');
    }
  };

  const handleQuickClassLogin = (cls: ClassProfile) => {
    setSelectedClassId(cls.classId);
    setUsernameInput(cls.username || cls.classId.toLowerCase());
    setClassPin('123456');
    const success = loginAsClass(cls, '123456');
    if (success) {
      setClassSuccess(`Berhasil masuk sebagai ${cls.name}`);
    }
  };

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    const success = loginAsAdminPin(adminPin);
    if (success) {
      setAdminSuccess('Verifikasi berhasil! Mengalihkan ke Portal Master Admin OSIS...');
    } else {
      setAdminError('Master PIN OSIS salah! Gunakan PIN default: 1234');
    }
  };

  const handleGoogleLogin = async () => {
    setAdminError('');
    try {
      await loginAsAdminGoogle();
    } catch (err: any) {
      setAdminError(err.message || 'Gagal masuk dengan Google');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-950 flex flex-col justify-between text-white selection:bg-emerald-500 selection:text-white p-4 sm:p-6 lg:p-8">
      {/* Top Bar with Live Indicator */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
            <Recycle className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
              Bank Sampah OSIS
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                Smart Eco School
              </span>
            </h1>
            <p className="text-xs text-emerald-200/80 hidden sm:block">
              Sistem Otomatisasi Kas Kelas & Daur Ulang Lingkungan Sekolah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-emerald-100">
            {isOnline ? 'Firestore Live Synced' : 'Mode Offline Aktif'}
          </span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-xl w-full mx-auto my-8">
        <div className="bg-white text-gray-900 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header of Card */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Portal Masuk Terverifikasi</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Selamat Datang di Bank Sampah
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Silakan masuk sebagai perwakilan kelas untuk memantau saldo & riwayat setoran,
                atau sebagai Pengurus OSIS untuk manajemen operasional master.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="grid grid-cols-2 gap-2 mt-6 p-1.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('class');
                  setClassError('');
                  setAdminError('');
                }}
                className={`py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'class'
                    ? 'bg-white text-emerald-900 shadow-md'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <School className="w-4 h-4" />
                <span>Perwakilan Kelas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setClassError('');
                  setAdminError('');
                }}
                className={`py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-white text-emerald-900 shadow-md'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Pengurus OSIS</span>
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8">
            {activeTab === 'class' ? (
              <form onSubmit={handleClassSubmit} className="space-y-4">
                {/* Standard Username Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Username Standar Kelas
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-md">
                      Format: x-mipa-1, xi-mipa-1, dll.
                    </span>
                  </div>
                  <div className="relative">
                    <School className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Masukkan username kelas (contoh: x-mipa-1)"
                      value={usernameInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUsernameInput(val);
                        const match = classes.find(
                          (c) =>
                            (c.username && c.username.toLowerCase() === val.toLowerCase()) ||
                            c.classId.toLowerCase() === val.toLowerCase()
                        );
                        if (match) setSelectedClassId(match.classId);
                        setClassError('');
                      }}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-gray-800 bg-gray-50/50"
                      required
                    />
                  </div>
                </div>

                {/* Class Quick Selector Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Atau Pilih Dari Daftar Kelas
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      const target = classes.find((c) => c.classId === e.target.value);
                      if (target) {
                        setUsernameInput(target.username || target.classId.toLowerCase());
                      }
                      setClassPin('123456');
                      setClassError('');
                    }}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-gray-800 bg-gray-50/80 cursor-pointer"
                  >
                    {classes.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.name} — user: {cls.username || cls.classId.toLowerCase()} • {cls.points || 0} Pts
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Preview Card */}
                {selectedClass && (
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-sm text-emerald-950">
                        {selectedClass.name}
                      </div>
                      <div className="text-emerald-700 text-[11px] mt-0.5">
                        Username: <code className="bg-emerald-200/60 px-1 py-0.5 rounded font-mono">{selectedClass.username || selectedClass.classId.toLowerCase()}</code> • PIC: <strong>{selectedClass.representative || '-'}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-700">
                        {selectedClass.points} Pts
                      </div>
                      <div className="text-[11px] font-bold text-gray-600">
                        Rp {(selectedClass.balance || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                )}

                {/* PIN Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      PIN Keamanan Kelas (6 Digit)
                    </label>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                      PIN Standar: 123456
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Masukkan PIN (123456)"
                      value={classPin}
                      onChange={(e) => setClassPin(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-semibold tracking-widest bg-gray-50/50"
                      required
                    />
                  </div>
                </div>

                {classError && (
                  <div className="flex items-center gap-2 p-3.5 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{classError}</span>
                  </div>
                )}

                {classSuccess && (
                  <div className="flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{classSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Masuk ke Portal Kelas {selectedClass?.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick 1-click test class buttons */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Akses Cepat Pengujian Kelas (PIN 123456):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {classes.map((c) => (
                      <button
                        key={c.classId}
                        type="button"
                        onClick={() => handleQuickClassLogin(c)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        {c.name.split(' (')[0]} ({c.username || c.classId.toLowerCase()})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                  <strong>Hak Akses Kelas:</strong> Melihat poin & riwayat setoran kelas sendiri, melihat leaderboard sekolah, serta melakukan penukaran reward dengan kode unik Kopsis (setelah ditukar, poin otomatis tereset ke 0). Kelas tidak dapat menginput setoran sampah.
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Google Sign In option */}
                <div className="space-y-3">
                  <div className="text-xs text-gray-600">
                    Masuk menggunakan akun Google pengurus OSIS resmi untuk sinkronisasi Google Sheets & Firebase Auth:
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-2xl shadow-xs text-sm font-bold text-gray-700 transition cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span>{isLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="grow border-t border-gray-200"></div>
                  <span className="shrink mx-3 text-gray-400 text-xs uppercase tracking-wider font-bold">
                    atau Master PIN OSIS
                  </span>
                  <div className="grow border-t border-gray-200"></div>
                </div>

                {/* Master PIN form */}
                <form onSubmit={handleAdminPinSubmit} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Master PIN Pengurus OSIS
                      </label>
                      <span className="text-[11px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-md">
                        Default: 1234
                      </span>
                    </div>
                    <div className="relative">
                      <Shield className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        placeholder="Masukkan Master PIN (1234)"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-semibold tracking-wider bg-gray-50/50"
                        required
                      />
                    </div>
                  </div>

                  {adminError && (
                    <div className="flex items-center gap-2 p-3.5 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{adminError}</span>
                    </div>
                  )}

                  {adminSuccess && (
                    <div className="flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 animate-in fade-in">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{adminSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl text-sm font-extrabold transition shadow-lg shadow-gray-900/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Masuk sebagai Master Admin OSIS</span>
                  </button>

                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                    <strong>Hak Akses Master Admin:</strong> Pengurus OSIS dapat mencatat setoran untuk semua kelas, melihat log audit riwayat transaksi global, mengekspor laporan bulanan ke Google Sheets, dan mengelola target sekolah.
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-emerald-200/60 py-2">
        <span>Bank Sampah OSIS • Didukung Cloud Database Firestore & Google Workspace API</span>
      </div>
    </div>
  );
};
