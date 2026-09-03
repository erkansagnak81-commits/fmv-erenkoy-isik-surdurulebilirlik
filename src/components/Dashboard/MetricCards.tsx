import React from 'react';
import { ProjectEvent, CurriculumIntegration, CampusMetric } from '../../types';
import { 
  FolderKanban, 
  Users, 
  Recycle, 
  BookOpenCheck,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

interface MetricCardsProps {
  projects: ProjectEvent[];
  curriculums: CurriculumIntegration[];
  metrics: CampusMetric[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  projects,
  curriculums,
  metrics,
}) => {
  // Hesaplamalar
  const totalProjects = projects.length;
  const approvedOrCompleted = projects.filter(p => 
    p.status === 'coordinator_approved' || p.status === 'completed'
  ).length;

  const totalStudentsReached = curriculums.reduce((sum, c) => sum + c.studentCount, 0) +
    projects.reduce((sum, p) => sum + (p.impactReport?.actualParticipants || 0), 0);

  // Son ay veya toplam geri dönüşüm
  const latestMetric = metrics[metrics.length - 1];
  const totalRecycledWasteKg = metrics.reduce((sum, m) => 
    sum + m.recyclingPaperKg + m.recyclingPlasticKg + m.recyclingGlassKg + m.recyclingMetalKg + m.compostOrganicKg + m.specialEwasteKg, 0
  );

  const stats = [
    {
      title: 'Toplam Proje & Çalışma',
      value: totalProjects,
      subtext: `${approvedOrCompleted} tanesi onaylandı/tamamlandı`,
      icon: FolderKanban,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100/80',
      trend: '+2 bu ay',
    },
    {
      title: 'Dokunulan Öğrenci',
      value: totalStudentsReached.toLocaleString('tr-TR'),
      subtext: 'Ders içi ve etkinlik katılımları',
      icon: Users,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100/80',
      trend: 'Okulun %84ü',
    },
    {
      title: 'Geri Kazanılan Atık',
      value: `${totalRecycledWasteKg.toLocaleString('tr-TR')} kg`,
      subtext: latestMetric ? `Son ay: ${(latestMetric.recyclingPaperKg + latestMetric.recyclingPlasticKg + latestMetric.compostOrganicKg)} kg` : '',
      icon: Recycle,
      color: 'text-teal-700',
      bgColor: 'bg-teal-100/80',
      trend: '%18 artış',
    },
    {
      title: 'Müfredat Entegrasyonu',
      value: curriculums.length,
      subtext: 'Ders ve kazanımla eşleşti',
      icon: BookOpenCheck,
      color: 'text-purple-700',
      bgColor: 'bg-purple-100/80',
      trend: '6 Zümre aktif',
    },
  ];

  return (
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
  );
};
