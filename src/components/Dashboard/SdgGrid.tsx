import React from 'react';
import { SDG_GOALS } from '../../data/mockData';
import { ProjectEvent, CurriculumIntegration } from '../../types';
import { Globe, Sparkles } from 'lucide-react';

interface SdgGridProps {
  projects: ProjectEvent[];
  curriculums: CurriculumIntegration[];
  selectedSdg: number | null;
  onSelectSdg: (sdgNumber: number | null) => void;
}

export const SdgGrid: React.FC<SdgGridProps> = ({
  projects,
  curriculums,
  selectedSdg,
  onSelectSdg,
}) => {
  // Her bir SKA için kaç proje ve kaç ders eşleşmiş hesapla
  const sdgCounts = React.useMemo(() => {
    const counts: Record<number, { projects: number; curriculums: number; total: number }> = {};
    
    SDG_GOALS.forEach(sdg => {
      counts[sdg.number] = { projects: 0, curriculums: 0, total: 0 };
    });

    projects.forEach(p => {
      p.sdgGoals.forEach(g => {
        if (counts[g]) {
          counts[g].projects += 1;
          counts[g].total += 1;
        }
      });
    });

    curriculums.forEach(c => {
      c.sdgGoals.forEach(g => {
        if (counts[g]) {
          counts[g].curriculums += 1;
          counts[g].total += 1;
        }
      });
    });

    return counts;
  }, [projects, curriculums]);

  // Aktif dokunulan hedef sayısı
  const coveredGoalsCount = Object.values(sdgCounts).filter(c => c.total > 0).length;
  const coveragePercentage = Math.round((coveredGoalsCount / 17) * 100);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card-soft">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              BM Sürdürülebilir Kalkınma Amaçları (SKA / SDGs) Dağılımı
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Okulumuzdaki projelerin ve ders içi kazanımların 17 küresel hedefle eşleşme haritası
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            17 Hedefin {coveredGoalsCount}'si Aktif (%{coveragePercentage})
          </span>
          {selectedSdg && (
            <button
              onClick={() => onSelectSdg(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Filtreyi Temizle
            </button>
          )}
        </div>
      </div>

      {/* 17 SKA Grid Kutuları */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-2.5">
        {SDG_GOALS.map((sdg) => {
          const stats = sdgCounts[sdg.number];
          const isSelected = selectedSdg === sdg.number;
          const hasActivity = stats.total > 0;

          return (
            <button
              key={sdg.number}
              onClick={() => onSelectSdg(isSelected ? null : sdg.number)}
              style={{
                borderColor: isSelected ? sdg.color : undefined,
              }}
              className={`p-2.5 rounded-xl border text-left transition-all relative group flex flex-col justify-between min-h-[90px] ${
                isSelected 
                  ? 'ring-2 ring-offset-1 ring-slate-800 shadow-md scale-[1.02] bg-slate-50' 
                  : hasActivity 
                    ? 'hover:border-slate-300 hover:shadow-sm bg-white' 
                    : 'opacity-55 hover:opacity-85 bg-slate-50/70'
              }`}
            >
              {/* Başlık ve Numara */}
              <div className="flex items-start justify-between">
                <span 
                  style={{ backgroundColor: sdg.color }}
                  className="w-5 h-5 rounded-md text-white text-[11px] font-black flex items-center justify-center shadow-xs shrink-0"
                >
                  {sdg.number}
                </span>
                {hasActivity && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {stats.total}
                  </span>
                )}
              </div>

              {/* İsim */}
              <p className="text-[11px] font-semibold text-slate-800 line-clamp-2 leading-tight mt-1">
                {sdg.shortName}
              </p>

              {/* Alt Bilgi: Proje / Ders ayrımı */}
              <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                {stats.projects > 0 && <span className="text-emerald-700 font-semibold">{stats.projects} Proje</span>}
                {stats.projects > 0 && stats.curriculums > 0 && <span>•</span>}
                {stats.curriculums > 0 && <span className="text-purple-700 font-semibold">{stats.curriculums} Ders</span>}
                {stats.total === 0 && <span>Çalışma yok</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
