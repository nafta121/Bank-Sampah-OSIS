import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ClassProfile } from '../types/index.ts';
import { Shield, KeyRound, School, X, CheckCircle, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassProfile[];
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, classes }) => {
  const { loginAsClass, loginAsAdminPin, loginAsAdminGoogle, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'class' | 'admin'>('class');

  // Class login form
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.classId || '');
  const [classPin, setClassPin] = useState<string>('');
  const [classError, setClassError] = useState<string>('');
  const [classSuccess, setClassSuccess] = useState<string>('');

  // Admin login form
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');

  if (!isOpen) return null;

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClassError('');
    const targetClass = classes.find((c) => c.classId === selectedClassId);
    if (!targetClass) {
      setClassError('Silakan pilih kelas');
      return;
    }

    const success = loginAsClass(targetClass, classPin);
    if (success) {
      setClassSuccess(`Berhasil login sebagai ${targetClass.name}!`);
      setTimeout(() => {
        setClassSuccess('');
        setClassPin('');
        onClose();
      }, 1000);
    } else {
      setClassError(`PIN salah! (PIN default kelas: ${targetClass.pin || '1234'})`);
    }
  };

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const success = loginAsAdminPin(adminPin);
    if (success) {
      setAdminPin('');
      onClose();
    } else {
      setAdminError('PIN Admin OSIS salah! Gunakan PIN default: 1234');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginAsAdminGoogle();
      onClose();
    } catch (err: any) {
      setAdminError(err.message || 'Gagal masuk dengan Google');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1 rounded-full hover:bg-emerald-800/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Verifikasi Identitas</h2>
              <p className="text-xs text-emerald-100">
                Pilih akses Kelas atau Pengurus OSIS Bank Sampah
              </p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-emerald-800/50 rounded-xl">
            <button
              onClick={() => setActiveTab('class')}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'class'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              Perwakilan Kelas
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'admin'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              Pengurus OSIS / Admin
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'class' ? (
            <form onSubmit={handleClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Pilih Kelas
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setClassPin('');
                    setClassError('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-800 bg-gray-50/50"
                >
                  {classes.map((cls) => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.name} ({cls.points || 0} Poin - Rp {(cls.balance || 0).toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    PIN Keamanan Kelas (4 Digit)
                  </label>
                  {selectedClassId && (
                    <span className="text-[11px] text-emerald-600 font-medium">
                      Default:{' '}
                      {classes.find((c) => c.classId === selectedClassId)?.pin || '1234'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Masukkan 4 digit PIN kelas"
                    value={classPin}
                    onChange={(e) => setClassPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-medium tracking-widest"
                  />
                </div>
              </div>

              {classError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{classError}</span>
                </div>
              )}

              {classSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{classSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                Masuk ke Dasbor Kelas
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Google Sign In option */}
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-3">
                  Akses penuh operasional Bank Sampah & ekspor otomatis Google Sheets:
                </p>

                {/* Google Sign In Button conforming to Workspace guidelines */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl shadow-xs text-sm font-medium text-gray-700 transition cursor-pointer"
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
                <span className="shrink mx-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                  atau PIN Cepat Offline
                </span>
                <div className="grow border-t border-gray-200"></div>
              </div>

              {/* Offline OSIS PIN */}
              <form onSubmit={handleAdminPinSubmit} className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Master PIN OSIS
                    </label>
                    <span className="text-[11px] text-gray-500">Default: 1234</span>
                  </div>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      placeholder="Masukkan Master PIN (1234)"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    />
                  </div>
                </div>

                {adminError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Masuk Mode Pengurus OSIS
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
