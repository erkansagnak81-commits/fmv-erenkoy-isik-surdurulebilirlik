import React, { useState } from 'react';
import { ProjectEvent, UserProfile, ProjectStatus } from '../../types';
import { DEPARTMENTS, SDG_GOALS } from '../../data/mockData';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Award,
  Sparkles,
  FileCheck2
} from 'lucide-react';

interface ProjectListProps {
  projects: ProjectEvent[];
  currentUser: UserProfile;
  onOpenNewModal: () => void;
  onOpenReportModal: (project: ProjectEvent) => void;
  selectedSdgFilter: number | null;
  onClearSdgFilter: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  currentUser,
  onOpenNewModal,
  onOpenReportModal,
  selectedSdgFilter,
  onClearSdgFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Filtreleme
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.advisorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || p.status === statusFilter;

    const matchesDept = 
      departmentFilter === 'all' || p.departmentId === departmentFilter;

    const matchesSdg = 
      selectedSdgFilter === null || p.sdgGoals.includes(selectedSdgFilter);

    return matchesSearch && matchesStatus && matchesDept && matchesSdg;
  });

  const getStatusBadge = (status: ProjectStatus, feedback?: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3 text-slate-500" />
            Taslak
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            Bölüm Başkanı Onayı Bekliyor
          </span>
        );
      case 'dept_approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle className="w-3 h-3 text-blue-600" />
            Bölüm Onayladı (Koordinatörde)
          </span>
        );
      case 'coordinator_approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Okul Takviminde / Yayında
          </span>
        );
      case 'revision_needed':
        return (
          <span 
            title={feedback}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
          >
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Revizyon Notu Var
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <Award className="w-3 h-3 text-teal-600" />
            Tamamlandı &amp; Raporlandı
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Üst Bar: Başlık ve Ekle Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Proje ve Etkinlik Havuzu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lisemizde planlanan, onay aşamasındaki ve tamamlanan tüm sürdürülebilirlik faaliyetleri
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Proje / Etkinlik Öner</span>
        </button>
      </div>

      {/* Arama ve Filtre Çubuğu */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Arama Kutusu */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Proje adı, açıklama veya öğretmen ara..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Bölüm Filtresi */}
          <div className="flex items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Tüm Zümreler</option>
              {DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Durum Sekmeleri */}
        <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Durum:
          </span>

          {[
            { id: 'all', label: 'Tümü' },
            { id: 'submitted', label: 'Bölüm Onayı Bekleyenler' },
            { id: 'dept_approved', label: 'Koordinatörde' },
            { id: 'coordinator_approved', label: 'Onaylı / Yayında' },
            { id: 'completed', label: 'Tamamlananlar' },
            { id: 'revision_needed', label: 'Revizyonlu' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {selectedSdgFilter && (
            <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span>SKA {selectedSdgFilter} Filtresi Aktif</span>
              <button 
                onClick={onClearSdgFilter}
                className="hover:text-emerald-950 font-bold ml-1"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Proje Kartları Listesi */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-card-soft">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Henüz bu kriterde bir çalışma bulunmuyor</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Arama filtrenizi temizleyebilir veya yeni bir sürdürülebilirlik projesi önerisinde bulunabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const dept = DEPARTMENTS.find(d => d.id === project.departmentId);

            return (
              <div 
                key={project.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card-soft hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Kart Üst Bilgisi: Zümre & Durum */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span 
                      style={{ backgroundColor: `${dept?.color}15`, color: dept?.color }}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border border-current/20"
                    >
                      {dept?.code} • {dept?.name.split(' ')[0]}
                    </span>

                    {getStatusBadge(project.status, project.rejectionFeedback)}
                  </div>

                  {/* Başlık ve Açıklama */}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Revizyon Uyarısı */}
                  {project.status === 'revision_needed' && project.rejectionFeedback && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Bölüm Başkanı Notu: </span>
                        <span>{project.rejectionFeedback}</span>
                      </div>
                    </div>
                  )}

                  {/* SKA Etiketleri */}
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {project.sdgGoals.map(sdgNum => {
                      const sdg = SDG_GOALS.find(g => g.number === sdgNum);
                      return (
                        <span
                          key={sdgNum}
                          style={{ backgroundColor: `${sdg?.color}20`, color: sdg?.color }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                          title={sdg?.name}
                        >
                          <span>SKA {sdgNum}</span>
                          <span className="hidden sm:inline font-normal">• {sdg?.shortName}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Alt Kısım: Danışman, Tarih ve Aksiyon Butonu */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{project.advisorName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {project.startDate}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                      </span>
                    </div>
                  </div>

                  {/* Aksiyon Butonu */}
                  <div className="shrink-0">
                    {project.status === 'coordinator_approved' && (
                      <button
                        onClick={() => onOpenReportModal(project)}
                        className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Sonuç Raporu Gir</span>
                      </button>
                    )}

                    {project.status === 'completed' && project.impactReport && (
                      <button
                        onClick={() => onOpenReportModal(project)}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-teal-600" />
                        <span>Raporu Gör ({project.impactReport.actualParticipants} Katılımcı)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
