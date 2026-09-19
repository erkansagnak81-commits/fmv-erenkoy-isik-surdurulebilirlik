import React from 'react';
import { DEPARTMENTS } from '../../constants';
import { ProjectEvent, CurriculumIntegration } from '../../types';
import { Award, ArrowRight } from 'lucide-react';

interface DeptLeaderboardProps {
  projects: ProjectEvent[];
  curriculums: CurriculumIntegration[];
  onSelectDepartment?: (deptId: string) => void;
}

export const DeptLeaderboard: React.FC<DeptLeaderboardProps> = ({
  projects,
  curriculums,
  onSelectDepartment,
}) => {
  // Her bölümün toplam aktivite sayısını hesapla
  const deptStats = React.useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const deptProjects = projects.filter(p => p.departmentId === dept.id);
      const deptCurriculums = curriculums.filter(c => c.departmentId === dept.id);
      const completedOrApprovedProjects = deptProjects.filter(p => 
        p.status === 'coordinator_approved' || p.status === 'completed'
      ).length;

      return {
        ...dept,
        projectCount: deptProjects.length,
        approvedProjectCount: completedOrApprovedProjects,
        curriculumCount: deptCurriculums.length,
        totalScore: (deptProjects.length * 2) + (deptCurriculums.length * 3),
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [projects, curriculums]);

  const maxScore = Math.max(...deptStats.map(d => d.totalScore), 1);
  const activeCount = deptStats.filter(d => d.totalScore > 0).length;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card-soft">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bölüm &amp; Zümre Katılım Karnesi
            </h3>
            <p className="text-xs text-slate-500">
              Bölüm başkanlıklarının proje ve müfredat katkı düzeyi
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {activeCount} / {DEPARTMENTS.length} Zümre Aktif
        </span>
      </div>

      <div className="space-y-3.5">
        {deptStats.map((dept, index) => {
          const percentage = Math.round((dept.totalScore / maxScore) * 100);

          return (
            <div 
              key={dept.id}
              onClick={() => onSelectDepartment?.(dept.id)}
              className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 
                      ? 'bg-amber-100 text-amber-800' 
                      : index === 1 
                        ? 'bg-slate-200 text-slate-700' 
                        : index === 2
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {dept.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Bölüm Bşk: <span className="text-slate-600 font-medium">{dept.headName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium">
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                    {dept.projectCount} Proje
                  </span>
                  <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
                    {dept.curriculumCount} Ders
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* İlerleme Çubuğu */}
              <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: dept.color 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
