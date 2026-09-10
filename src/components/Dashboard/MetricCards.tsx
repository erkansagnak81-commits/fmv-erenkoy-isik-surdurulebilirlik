import React from 'react';
import { ProjectEvent, CurriculumIntegration, CampusMetric, AcademicYear } from '../../types';
import { DEPARTMENTS } from '../../constants';
import { calculateCarbonAnalysis } from '../../lib/carbonCalculator';
import { 
  FolderKanban, 
  Users, 
  Recycle, 
  BookOpenCheck,
  TrendingUp,
  TreePine,
  CloudSun,
  Droplet
} from 'lucide-react';

interface MetricCardsProps {
  projects: ProjectEvent[];
  curriculums: CurriculumIntegration[];
  metrics: CampusMetric[];
  activeAcademicYear?: AcademicYear;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  projects,
  curriculums,
  metrics,
  activeAcademicYear,
}) => {
  // Hesaplamalar
  const totalProjects = projects.length;
  const approvedOrCompleted = projects.filter(p => 
    p.status === 'coordinator_approved' || p.status === 'completed'
  ).length;

  const totalSchoolStudents = activeAcademicYear?.totalStudents || 850;

  const totalStudentsReached = curriculums.reduce((sum, c) => sum + c.studentCount, 0) +
    projects.reduce((sum, p) => sum + (p.impactReport?.actualParticipants || 0), 0);

  const coveragePercent = Math.min(100, Math.round((totalStudentsReached / totalSchoolStudents) * 100));
  const activeDeptsCount = DEPARTMENTS.filter(d => curriculums.some(c => c.departmentId === d.id)).length;

  // Son ay veya toplam geri dönüşüm
  const latestMetric = metrics[metrics.length - 1];
  const totalRecycledWasteKg = metrics.reduce((sum, m) => 
    sum + m.recyclingPaperKg + m.recyclingPlasticKg + m.recyclingGlassKg + m.recyclingMetalKg + m.compostOrganicKg + m.specialEwasteKg, 0
  );

  const carbon = calculateCarbonAnalysis(metrics, totalSchoolStudents);

  const stats = [
    {
      title: 'Toplam Proje & Çalışma',
      value: totalProjects,
      subtext: `${approvedOrCompleted} tanesi onaylandı/tamamlandı`,
      icon: FolderKanban,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100/80',
      trend: `${approvedOrCompleted} Yayında`,
    },
    {
      title: 'Dokunulan Öğrenci',
      value: totalStudentsReached.toLocaleString('tr-TR'),
      subtext: 'Ders içi ve etkinlik katılımları',
      icon: Users,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100/80',
      trend: `%${coveragePercent} Kapsama (${totalSchoolStudents} Mevcut)`,
    },
    {
      title: 'Geri Kazanılan Atık',
      value: `${totalRecycledWasteKg.toLocaleString('tr-TR')} kg`,
      subtext: latestMetric ? `Son ay: ${(latestMetric.recyclingPaperKg + latestMetric.recyclingPlasticKg + latestMetric.compostOrganicKg)} kg` : '',
      icon: Recycle,
      color: 'text-teal-700',
      bgColor: 'bg-teal-100/80',
      trend: `${metrics.length} Dönem Takipte`,
    },
    {
      title: 'Müfredat Entegrasyonu',
      value: curriculums.length,
      subtext: 'Ders ve kazanımla eşleşti',
      icon: BookOpenCheck,
      color: 'text-purple-700',
      bgColor: 'bg-purple-100/80',
      trend: `${activeDeptsCount}/${DEPARTMENTS.length} Zümre Aktif`,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card-soft hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
                    {stat.value}
                  </h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${stat.bgColor} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium truncate">
                  {stat.subtext}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hızlı Ekolojik Etki & Karbon Dengesi Özeti */}
      {metrics.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-emerald-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <CloudSun className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="font-bold text-emerald-200 block text-[11px] uppercase tracking-wider">
                Kampüs Ekolojik Ayak İzi ve Tasarruf Dengesi
              </span>
              <span className="text-white/85 text-xs">
                Sıfır Atık ve Kaynak Yönetimi Çıktıları ({carbon.recordedMonthsCount} Ay Kayıtlı)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
              <CloudSun className="w-3.5 h-3.5 text-teal-300" />
              <span>Net Salım: <strong className="text-white">{carbon.netEmissionsTons.toFixed(1)} tCO₂e</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
              <TreePine className="w-3.5 h-3.5 text-emerald-300" />
              <span>Kurtarılan: <strong className="text-white">{carbon.treesSavedCount} Ağaç</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
              <Droplet className="w-3.5 h-3.5 text-blue-300" />
              <span>Öğrenci Başı Günlük Su: <strong className="text-white">{carbon.perStudentDailyWaterLiters.toFixed(1)} L</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
