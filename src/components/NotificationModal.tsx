import React from 'react';
import { NotificationItem } from '../types/index.ts';
import { Bell, Gift, Award, Info, X, Check, ArrowRight } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onSelectRewardTab: (classId?: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectRewardTab,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Notifikasi & Pengingat Hadiah</h3>
              <p className="text-xs text-gray-500">
                Pemberitahuan saldo siap tukar & pencapaian kelas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of notifications */}
        <div className="p-5 overflow-y-auto space-y-3 divide-y divide-gray-50">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-400 space-y-2">
              <Bell className="w-10 h-10 mx-auto text-gray-300 stroke-1" />
              <p className="text-sm font-medium">Belum ada notifikasi baru</p>
              <p className="text-xs text-gray-400">
                Notifikasi akan muncul saat kelas mengumpulkan cukup saldo/poin untuk ditukarkan hadiah!
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isReward = notif.type === 'reward_ready';
              return (
                <div
                  key={notif.notificationId}
                  className={`pt-3 first:pt-0 p-3.5 rounded-xl border transition ${
                    isReward
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-gray-50/80 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isReward
                          ? 'bg-amber-500 text-white shadow-xs'
                          : notif.type === 'milestone'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {isReward ? (
                        <Gift className="w-4 h-4" />
                      ) : notif.type === 'milestone' ? (
                        <Award className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>
                    <div className="grow">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm font-bold ${
                            isReward ? 'text-amber-950' : 'text-gray-900'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {isReward && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => {
                              onSelectRewardTab(notif.classId);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                          >
                            <span>Lihat Katalog Reward</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
