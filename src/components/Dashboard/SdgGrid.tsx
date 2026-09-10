import React from 'react';
import { SDG_GOALS } from '../../constants';
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

      {/* Seçili SKA Detay & İlişkili Faaliyetler Kartı */}
      {selectedSdg && (() => {
        const activeSdg = SDG_GOALS.find(g => g.number === selectedSdg);
        if (!activeSdg) return null;

        const matchingProjects = projects.filter(p => p.sdgGoals.includes(selectedSdg));
        const matchingCurriculums = curriculums.filter(c => c.sdgGoals.includes(selectedSdg));
        const totalStudents = matchingProjects.reduce((sum, p) => sum + (p.impactReport?.actualParticipants || 0), 0) +
          matchingCurriculums.reduce((sum, c) => sum + (c.studentCount || 0), 0);

        const approvedCount = matchingProjects.filter(p => p.status === 'coordinator_approved' || p.status === 'completed').length;
        const pendingCount = matchingProjects.filter(p => p.status === 'submitted' || p.status === 'dept_approved').length;
        const draftCount = matchingProjects.filter(p => p.status === 'draft' || p.status === 'revision_needed').length;

        return (
          <div 
            className="mt-5 p-5 rounded-2xl border transition-all animate-in fade-in duration-200"
            style={{ 
              backgroundColor: `${activeSdg.color}08`, 
              borderColor: `${activeSdg.color}40` 
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl text-white font-black text-base flex items-center justify-center shadow-xs shrink-0"
                  style={{ backgroundColor: activeSdg.color }}
                >
                  {activeSdg.number}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {activeSdg.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Toplam <strong>{matchingProjects.length} Proje</strong> ({approvedCount} Onaylı Vitrinde{pendingCount > 0 ? `, ${pendingCount} Onay Sürecinde` : ''}{draftCount > 0 ? `, ${draftCount} Taslak` : ''}) • <strong>{matchingCurriculums.length} Ders Entegrasyonu</strong> • {totalStudents.toLocaleString('tr-TR')} Doğrudan Temas Edilen Öğrenci
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectSdg(null)}
                className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Kapat (×)
              </button>
            </div>

            {/* Projeler ve Kazanımlar Listesi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 text-xs">
              {/* Projeler */}
              <div className="space-y-2 bg-white/90 p-4 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-900 flex items-center justify-between uppercase tracking-wider text-[11px]">
                  <span>📋 İlişkili Projeler &amp; Faaliyetler ({matchingProjects.length})</span>
                  <span className="text-[10px] font-normal lowercase text-slate-400">
                    {approvedCount} vitrinde, {pendingCount + draftCount} hazırlıkta
                  </span>
                </span>
                {matchingProjects.length === 0 ? (
                  <p className="text-slate-400 italic">Bu hedefe yönelik kayıtlı proje henüz bulunmuyor.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {matchingProjects.map(p => {
                      const isApproved = p.status === 'coordinator_approved' || p.status === 'completed';
                      return (
                        <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                          <div className="truncate">
                            <p className="font-bold text-slate-800 truncate">{p.title}</p>
                            <p className="text-[11px] text-slate-500">{p.advisorName} • {p.startDate}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isApproved 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : p.status === 'draft' 
                                ? 'bg-slate-200 text-slate-700' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isApproved ? '✓ Onaylı Vitrin' : p.status === 'draft' ? 'Taslak' : 'Onay Bekliyor'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              {p.eventType}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ders İçi Kazanımlar */}
              <div className="space-y-2 bg-white/90 p-4 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span>📚 Müfredat &amp; Ders İçi Kazanımları ({matchingCurriculums.length})</span>
                </span>
                {matchingCurriculums.length === 0 ? (
                  <p className="text-slate-400 italic">Bu hedefe yönelik ders entegrasyonu henüz eklenmemiş.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {matchingCurriculums.map(c => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <p className="font-bold text-slate-800 truncate">{c.courseName}: {c.learningOutcome}</p>
                          <p className="text-[11px] text-slate-500">{c.gradeLevel} • {c.studentCount} Öğrenci • {c.teacherName}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 shrink-0">
                          {c.academicTerm || 'Müfredat'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
