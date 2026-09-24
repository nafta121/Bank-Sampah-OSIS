import React from 'react';
import { ClassProfile } from '../types/index.ts';
import {
  Trophy,
  Flame,
  Award,
  Sparkles,
  TrendingUp,
  Gift,
  ArrowUpRight,
  PlusCircle,
  Zap,
} from 'lucide-react';

interface LeaderboardProps {
  classes: ClassProfile[];
  onOpenRedemptions?: (classId: string) => void;
  onOpenWasteEntry?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  classes,
  onOpenRedemptions,
  onOpenWasteEntry,
}) => {
  // Sort classes by points in descending order and pick top 5
  const top5Classes = [...classes]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 5);

  const maxPoints = top5Classes[0]?.points || 1;

  // Rank styling helper
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: '🥇',
          bg: 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-400/40',
          gradient: 'from-amber-500/10 via-amber-100/40 to-transparent border-amber-200',
          titleColor: 'text-amber-900',
          badgeText: 'Eco Champion #1',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 2:
        return {
          icon: '🥈',
          bg: 'bg-slate-100 text-slate-700 border-slate-300 ring-1 ring-slate-300',
          gradient: 'from-slate-100/60 to-transparent border-slate-200',
          titleColor: 'text-slate-900',
          badgeText: 'Runner-up #2',
          badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      case 3:
        return {
          icon: '🥉',
          bg: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-200',
          gradient: 'from-amber-100/30 to-transparent border-amber-100',
          titleColor: 'text-amber-950',
          badgeText: 'Peringkat #3',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      default:
        return {
          icon: `${rank}`,
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          gradient: 'from-gray-50/50 to-transparent border-gray-100',
          titleColor: 'text-gray-900',
          badgeText: `Top 5`,
          badgeBg: 'bg-gray-100 text-gray-600 border-gray-200',
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-5 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-amber-200/20 via-emerald-100/20 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Header section with live indicator */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl text-white shadow-md shadow-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-gray-900 text-base tracking-tight">
                Top 5 Leaderboard
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Kelas Teraktif Pengumpul Poin Sampah
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>Kompetisi Sengit</span>
        </div>
      </div>

      {/* Top 5 list */}
      <div className="space-y-2.5 relative z-10">
        {top5Classes.map((cls, idx) => {
          const rank = idx + 1;
          const style = getRankBadge(rank);
          const percentOfLeader = Math.max(
            8,
            Math.round(((cls.points || 0) / maxPoints) * 100)
          );

          // Calculate point gap to the class right above it
          const higherClass = idx > 0 ? top5Classes[idx - 1] : null;
          const pointsToOvertake = higherClass
            ? (higherClass.points || 0) - (cls.points || 0) + 1
            : 0;

          return (
            <div
              key={cls.classId}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 hover:shadow-sm ${style.gradient} ${
                rank === 1 ? 'shadow-xs border-amber-200' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Rank Badge + Class Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl font-extrabold text-sm flex items-center justify-center shrink-0 border ${style.bg}`}
                  >
                    {style.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-bold text-xs sm:text-sm truncate ${style.titleColor}`}>
                        {cls.name}
                      </span>
                      {rank === 1 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                          Juara 1
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span>Sie: {cls.representative || 'Perwakilan'}</span>
                      <span>•</span>
                      <span className="font-semibold text-gray-700">
                        {cls.totalWeightKg.toFixed(1)} kg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Points & Action */}
                <div className="flex items-center gap-2 shrink-0 text-right">
                  <div>
                    <div className="font-extrabold text-sm text-emerald-600 flex items-center justify-end gap-1">
                      <span>{cls.points.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-500">
                        Pts
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Kas: Rp {(cls.balance || 0).toLocaleString('id-ID')}
                    </div>
                  </div>

                  {onOpenRedemptions && (
                    <button
                      onClick={() => onOpenRedemptions(cls.classId)}
                      title={`Tukar reward untuk ${cls.name}`}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                    >
                      <Gift className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar & Gap hint */}
              <div className="mt-2.5 pt-2 border-t border-gray-100/80">
                <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                  <span>
                    {rank === 1
                      ? '👑 Memimpin Puncak Klasemen'
                      : higherClass
                      ? `Selisih ${pointsToOvertake} poin dari ${higherClass.name}`
                      : 'Kompetisi Sehat'}
                  </span>
                  <span className="font-semibold text-gray-700">{percentOfLeader}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      rank === 1
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : rank === 2
                        ? 'bg-gradient-to-r from-slate-400 to-slate-500'
                        : rank === 3
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${percentOfLeader}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {top5Classes.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            Belum ada data poin kelas yang terdaftar.
          </div>
        )}
      </div>

      {/* Motivational call to action footer */}
      {onOpenWasteEntry && (
        <div className="pt-2 relative z-10">
          <button
            onClick={onOpenWasteEntry}
            className="w-full p-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Zap className="w-4 h-4 text-yellow-300 group-hover:scale-110 transition-transform" />
            <span>Setor Sampah & Dongkrak Poin Kelas</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      )}
    </div>
  );
};
