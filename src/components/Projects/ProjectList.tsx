import React, { useState, useEffect, useRef } from 'react';
import { ProjectEvent, UserProfile, ProjectStatus, AcademicYear } from '../../types';
import { DEPARTMENTS, SDG_GOALS, parseTargetGrades, isSuperAdminEmail } from '../../constants';
import { exportProjectsToCsv } from '../../lib/exportUtils';
import { ProjectDetailModal } from './ProjectDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CalendarDays, 
  MapPin, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Award, 
  Sparkles,
  FileCheck2,
  FileEdit,
  GraduationCap,
  Atom,
  School,
  Users,
  Download,
  Eye,
  Globe2,
  Info,
  Trash2
} from 'lucide-react';

interface ProjectListProps {
  projects: ProjectEvent[];
  currentUser: UserProfile;
  onOpenNewModal: () => void;
  onEditProject: (project: ProjectEvent) => void;
  onOpenReportModal: (project: ProjectEvent) => void;
  onDeleteProject?: (projectId: string) => void;
  selectedSdgFilter: number | null;
  onClearSdgFilter: () => void;
  onNavigateTab?: (tab: string) => void;
  activeAcademicYear?: AcademicYear;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  currentUser,
  onOpenNewModal,
  onEditProject,
  onOpenReportModal,
  onDeleteProject,
  selectedSdgFilter,
  onClearSdgFilter,
  onNavigateTab,
  activeAcademicYear,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  // Başlangıçta aktif yılda proje varsa 'year', yoksa kullanıcıya boş ekran göstermemek için 'all' seçilsin
  const [yearFilter, setYearFilter] = useState<'year' | 'all'>(() => {
    if (!activeAcademicYear) return 'all';
    const hasProjectsInYear = projects.some(
      p => p.startDate >= activeAcademicYear.startDate && p.startDate <= activeAcademicYear.endDate
    );
    return hasProjectsInYear ? 'year' : 'all';
  });
  
  // Kapsam Sekmesi: 'my' (Bireysel/Zümre/Tüm Havuz) vs 'school' (Okul Geneli İlham Vitrini)
  // Koordinatör veya admin için vitrinde onaylı proje varsa vitrinle, yoksa doğrudan tüm havuzla başla
  const [scopeTab, setScopeTab] = useState<'my' | 'school'>(() => {
    if (currentUser.role === 'coordinator' || currentUser.role === 'admin') {
      const hasApproved = projects.some(p => p.status === 'coordinator_approved' || p.status === 'completed');
      return hasApproved ? 'school' : 'my';
    }
    return 'my';
  });

  // Projeler asenkron yüklendiğinde; koordinatör/admin için okul vitrininde onaylı proje yoksa boş ekran göstermemek adına 'my' (Tüm Proje Havuzu) sekmesine otomatik odaklan
  const hasAutoSelectedScopeRef = useRef(false);
  useEffect(() => {
    if (!hasAutoSelectedScopeRef.current && projects.length > 0) {
      hasAutoSelectedScopeRef.current = true;
      const hasApproved = projects.some(p => p.status === 'coordinator_approved' || p.status === 'completed');
      if (!hasApproved && (currentUser.role === 'coordinator' || currentUser.role === 'admin')) {
        setScopeTab('my');
      }
    }
  }, [projects, currentUser.role]);

  // Detay Modalı State
  const [detailProject, setDetailProject] = useState<ProjectEvent | null>(null);

  // Rol ve Kapsam Bazlı Filtreleme
  const filteredProjects = projects.filter(p => {
    // 1. Kapsam Kontrolü
    if (scopeTab === 'school') {
      // Okul geneli vitrin: Yalnızca koordinatör onaylı (takvimde yayında) veya tamamlanmış projeler gösterilir
      if (p.status !== 'coordinator_approved' && p.status !== 'completed') {
        return false;
      }
    } else {
      // 'my' kapsamı (Bireysel veya Zümre Odaklı)
      if (currentUser.role === 'teacher') {
        const isCollaborator = p.collaboratingTeachers?.some(t => 
          t.toLowerCase().includes(currentUser.name.toLowerCase())
        );
        const isMyProject = 
          p.advisorId === currentUser.id || 
          p.advisorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          isCollaborator;
        if (!isMyProject) return false;
      } else if (currentUser.role === 'dept_head') {
        const isDeptProject = p.departmentId === currentUser.departmentId;
        if (!isDeptProject) return false;
      }
    }

    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.advisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.studentClub && p.studentClub.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.collaboratingTeachers?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.studentRepresentatives?.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' || p.status === statusFilter;

    const matchesDept = 
      departmentFilter === 'all' || p.departmentId === departmentFilter;

    const matchesSdg = 
      selectedSdgFilter === null || p.sdgGoals.includes(selectedSdgFilter);

    const matchesYear = 
      yearFilter === 'all' || 
      !activeAcademicYear || 
      (p.startDate >= activeAcademicYear.startDate && p.startDate <= activeAcademicYear.endDate);

    return matchesSearch && matchesStatus && matchesDept && matchesSdg && matchesYear;
  });

  const canDeleteProject = (project: ProjectEvent) => {
    if (!onDeleteProject) return false;
    if (currentUser.role === 'coordinator' || currentUser.role === 'admin' || isSuperAdminEmail(currentUser.email)) {
      return true;
    }
    return project.advisorId === currentUser.id && (project.status === 'draft' || project.status === 'submitted');
  };

  const handleDelete = (project: ProjectEvent) => {
    if (!onDeleteProject) return;
    if (window.confirm(`"${project.title}" projesini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      onDeleteProject(project.id);
    }
  };

  // Yıl kapsamındaki projeler (aktif yıl filtresi 'year' ise sadece o yıl, 'all' ise tümü)
  const yearScopedProjects = projects.filter(p => 
    yearFilter === 'all' || 
    !activeAcademicYear || 
    (p.startDate >= activeAcademicYear.startDate && p.startDate <= activeAcademicYear.endDate)
  );

  // Sekme Sayaçları (Mevcut yıl filtresine tam senkron)
  const schoolScopeCount = yearScopedProjects.filter(p => 
    (selectedSdgFilter === null || p.sdgGoals.includes(selectedSdgFilter)) &&
    (p.status === 'coordinator_approved' || p.status === 'completed')
  ).length;

  const poolScopeCount = yearScopedProjects.filter(p => {
    if (selectedSdgFilter !== null && !p.sdgGoals.includes(selectedSdgFilter)) return false;
    if (currentUser.role === 'teacher') {
      const isCollaborator = p.collaboratingTeachers?.some(t => 
        t.toLowerCase().includes(currentUser.name.toLowerCase())
      );
      return p.advisorId === currentUser.id || 
        p.advisorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        isCollaborator;
    } else if (currentUser.role === 'dept_head') {
      return p.departmentId === currentUser.departmentId;
    }
    return true;
  }).length;

  // Tüm Zamanlar ve Aktif Yıl İstatistikleri (Filtre butonlarında ve boş durum uyarılarında kullanım için)
  const totalAllYearsPoolCount = projects.filter(p => {
    if (selectedSdgFilter !== null && !p.sdgGoals.includes(selectedSdgFilter)) return false;
    if (currentUser.role === 'teacher') {
      const isCollaborator = p.collaboratingTeachers?.some(t => 
        t.toLowerCase().includes(currentUser.name.toLowerCase())
      );
      return p.advisorId === currentUser.id || 
        p.advisorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        isCollaborator;
    } else if (currentUser.role === 'dept_head') {
      return p.departmentId === currentUser.departmentId;
    }
    return true;
  }).length;

  const activeYearPoolCount = activeAcademicYear ? projects.filter(p => {
    if (selectedSdgFilter !== null && !p.sdgGoals.includes(selectedSdgFilter)) return false;
    const inYear = p.startDate >= activeAcademicYear.startDate && p.startDate <= activeAcademicYear.endDate;
    if (!inYear) return false;
    if (currentUser.role === 'teacher') {
      const isCollaborator = p.collaboratingTeachers?.some(t => 
        t.toLowerCase().includes(currentUser.name.toLowerCase())
      );
      return p.advisorId === currentUser.id || 
        p.advisorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        isCollaborator;
    } else if (currentUser.role === 'dept_head') {
      return p.departmentId === currentUser.departmentId;
    }
    return true;
  }).length : totalAllYearsPoolCount;

  // Okul Vitrini Tüm Yıllar ve Aktif Yıl İstatistikleri
  const schoolAllYearsCount = projects.filter(p => 
    (selectedSdgFilter === null || p.sdgGoals.includes(selectedSdgFilter)) &&
    (p.status === 'coordinator_approved' || p.status === 'completed')
  ).length;

  const schoolActiveYearCount = activeAcademicYear ? projects.filter(p => 
    (selectedSdgFilter === null || p.sdgGoals.includes(selectedSdgFilter)) &&
    (p.status === 'coordinator_approved' || p.status === 'completed') &&
    p.startDate >= activeAcademicYear.startDate && p.startDate <= activeAcademicYear.endDate
  ).length : schoolAllYearsCount;

  // Aktif yılda hiç proje yoksa ama diğer yıllarda proje varsa, kullanıcının boş ekran görmemesi için otomatik olarak 'all' (Tüm Yıllar) seçilsin
  useEffect(() => {
    if (activeAcademicYear && yearFilter === 'year' && activeYearPoolCount === 0 && totalAllYearsPoolCount > 0) {
      setYearFilter('all');
    }
  }, [activeAcademicYear, activeYearPoolCount, totalAllYearsPoolCount, yearFilter]);

  // Buton sayaçları:
  // Okul vitrinindeyken onaylı proje varsa vitrin sayısını; vitrin boş ama havuzda proje varsa havuz sayısını yansıtır
  const activeYearDisplayCount = scopeTab === 'school' && schoolActiveYearCount > 0
    ? schoolActiveYearCount
    : (scopeTab === 'school' && schoolScopeCount === 0 ? activeYearPoolCount : (scopeTab === 'school' ? 0 : activeYearPoolCount));

  const allYearsDisplayCount = scopeTab === 'school' && schoolAllYearsCount > 0
    ? schoolAllYearsCount
    : (scopeTab === 'school' && schoolScopeCount === 0 ? totalAllYearsPoolCount : (scopeTab === 'school' ? 0 : totalAllYearsPoolCount));

  const canEditProject = (project: ProjectEvent) => {
    if (project.status !== 'draft' && project.status !== 'revision_needed') return false;
    if (currentUser.role === 'coordinator' || currentUser.role === 'admin') return true;
    if (currentUser.role === 'dept_head') return project.departmentId === currentUser.departmentId;
    if (currentUser.role === 'teacher') {
      const isCollaborator = project.collaboratingTeachers?.some(t => 
        t.toLowerCase().includes(currentUser.name.toLowerCase())
      );
      return project.advisorId === currentUser.id || 
        project.advisorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        !!isCollaborator;
    }
    return false;
  };

  const canReportProject = (project: ProjectEvent) => {
    if (project.status !== 'coordinator_approved') return false;
    if (currentUser.role === 'coordinator' || currentUser.role === 'admin') return true;
    if (currentUser.role === 'dept_head') return project.departmentId === currentUser.departmentId;
    if (currentUser.role === 'teacher') {
      const isCollaborator = project.collaboratingTeachers?.some(t => 
        t.toLowerCase().includes(currentUser.name.toLowerCase())
      );
      return project.advisorId === currentUser.id || 
        project.advisorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        !!isCollaborator;
    }
    return false;
  };

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
            Bölüm Başkanı Onayında
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

  const handleExportCsv = () => {
    exportProjectsToCsv(filteredProjects, DEPARTMENTS);
  };

  return (
    <div className="space-y-5">
      {/* Üst Bar: Başlık, Kapsam Sekmeleri ve Eylemler */}
      <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {scopeTab === 'school' 
                  ? 'Okul Geneli Proje Havuzu & İlham Vitrini'
                  : currentUser.role === 'teacher' 
                  ? 'Bireysel Proje ve Faaliyetlerim' 
                  : currentUser.role === 'dept_head' 
                  ? `${DEPARTMENTS.find(d => d.id === currentUser.departmentId)?.name || 'Zümre'} Faaliyetleri` 
                  : 'Proje ve Etkinlik Havuzu'}
              </h2>
              {scopeTab === 'school' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-emerald-700" />
                  <span>Tüm Zümreler (Onaylı Arşiv)</span>
                </span>
              ) : (
                currentUser.role === 'teacher' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Danışman Öğretmen: {currentUser.name}
                  </span>
                ) : currentUser.role === 'dept_head' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    Bölüm Başkanlığı: {DEPARTMENTS.find(d => d.id === currentUser.departmentId)?.code}
                  </span>
                ) : null
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {scopeTab === 'school'
                ? 'FMV Erenköy Işık Lisesi ve Fen Lisesi zümrelerimizin okul takvimine onaylanmış ve tamamlanmış tüm sürdürülebilirlik projeleri.'
                : currentUser.role === 'teacher'
                ? 'Yalnızca danışmanlığını yürüttüğünüz taslak, onay aşamasındaki veya tamamlanmış faaliyetleriniz listelenmektedir.'
                : currentUser.role === 'dept_head'
                ? 'Zümreniz bünyesindeki öğretmenlerin yürüttüğü ve onay bekleyen faaliyetler.'
                : 'Tüm zümreler ve danışman öğretmenlerin hazırlık, onay veya yayın aşamasındaki tüm faaliyet havuzu.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Filtrelenmiş projeleri Excel / CSV formatında indir"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Excel / CSV</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('calendar')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                title="Onaylı etkinlikleri aylık takvimde incele"
              >
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                <span>Takvimde Gör</span>
              </button>
            )}

            <button
              onClick={onOpenNewModal}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Proje Başlat</span>
            </button>
          </div>
        </div>

        {/* Sekme Geçişi: Okul Geneli Vitrin vs Bireysel / Zümre */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={() => {
              setScopeTab('school');
              setStatusFilter('all');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scopeTab === 'school'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Okul Geneli Vitrin (Onaylı Projeler)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              scopeTab === 'school' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {schoolScopeCount}
            </span>
          </button>

          <button
            onClick={() => {
              setScopeTab('my');
              setStatusFilter('all');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scopeTab === 'my'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>
              {currentUser.role === 'teacher' 
                ? 'Benim Faaliyetlerim' 
                : currentUser.role === 'dept_head' 
                ? 'Zümre Faaliyetleri' 
                : 'Tüm Proje Havuzu (Hazırlık & Onay Süreci Dahil)'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              scopeTab === 'my' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {poolScopeCount}
            </span>
          </button>
        </div>

        {/* Okul Vitrini Boşken Havuzda Proje Varsa Bilgilendirme Notu */}
        {scopeTab === 'school' && schoolScopeCount === 0 && (poolScopeCount > 0 || totalAllYearsPoolCount > 0) && (
          <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Okul vitrininde henüz koordinatör onaylı veya tamamlanmış bir faaliyet bulunmuyor.
                Hazırlık ve onay sürecindeki mevcut <strong>{poolScopeCount > 0 ? poolScopeCount : totalAllYearsPoolCount} faaliyeti</strong> incelemek için <strong>"Tüm Proje Havuzu"</strong> sekmesine geçebilirsiniz.
              </span>
            </div>
            <button
              onClick={() => {
                setScopeTab('my');
                setStatusFilter('all');
              }}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer text-xs"
            >
              Havuzdaki Faaliyetleri Göster ({poolScopeCount > 0 ? poolScopeCount : totalAllYearsPoolCount})
            </button>
          </div>
        )}

        {/* SKA Filtresi Aktifken Bilgilendirme Notu */}
        {selectedSdgFilter && scopeTab === 'school' && poolScopeCount > schoolScopeCount && schoolScopeCount > 0 && (
          <div className="flex items-center justify-between gap-3 p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-950 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>SKA {selectedSdgFilter}</strong> kapsamında onaylanıp vitrine çıkan <strong>{schoolScopeCount} proje</strong> listeleniyor. 
                Hazırlık ve onay sürecindeki diğer <strong>{poolScopeCount - schoolScopeCount} projeyi</strong> incelemek için <strong>"Tüm Proje Havuzu"</strong> sekmesine geçebilirsiniz.
              </span>
            </div>
            <button
              onClick={() => {
                setScopeTab('my');
                setStatusFilter('all');
              }}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
            >
              Tümünü Gör ({poolScopeCount})
            </button>
          </div>
        )}
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
              placeholder="Proje başlığı, açıklama, kulüp, öğretmen veya öğrenci temsilcisi ara..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Bölüm & Dönem Filtreleri */}
          <div className="flex items-center flex-wrap gap-2">
            {activeAcademicYear && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setYearFilter('year');
                    if (scopeTab === 'school' && schoolActiveYearCount === 0 && activeYearPoolCount > 0) {
                      setScopeTab('my');
                      setStatusFilter('all');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    yearFilter === 'year'
                      ? 'bg-white text-teal-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {activeAcademicYear.name} ({activeYearDisplayCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYearFilter('all');
                    if (scopeTab === 'school' && schoolAllYearsCount === 0 && totalAllYearsPoolCount > 0) {
                      setScopeTab('my');
                      setStatusFilter('all');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    yearFilter === 'all'
                      ? 'bg-white text-teal-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Tüm Yıllar ({allYearsDisplayCount})
                </button>
              </div>
            )}

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
            ...(scopeTab === 'my' ? [{ id: 'draft', label: 'Taslaklar' }] : []),
            ...(scopeTab === 'my' ? [{ id: 'submitted', label: 'Bölüm Onayında' }] : []),
            ...(scopeTab === 'my' ? [{ id: 'dept_approved', label: 'Koordinatörde' }] : []),
            { id: 'coordinator_approved', label: 'Onaylı / Takvimde' },
            { id: 'completed', label: 'Tamamlananlar' },
            ...(scopeTab === 'my' ? [{ id: 'revision_needed', label: 'Revizyonlu' }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === tab.id
                  ? 'bg-emerald-700 text-white font-semibold shadow-xs'
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
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-card-soft">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {yearFilter === 'year' && totalAllYearsPoolCount > 0
              ? `${activeAcademicYear?.name || 'Seçili Eğitim Yılı'} Kapsamında Faaliyet Bulunmuyor`
              : scopeTab === 'school' && (poolScopeCount > 0 || totalAllYearsPoolCount > 0)
              ? 'Okul Vitrininde Onaylı Faaliyet Bulunmuyor'
              : 'Henüz bu kriterde bir çalışma bulunmuyor'}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            {yearFilter === 'year' && totalAllYearsPoolCount > 0 ? (
              <>
                {activeAcademicYear?.name || 'Aktif eğitim-öğretim yılı'} için henüz bu filtreye uygun bir faaliyet bulunamadı. Ancak sistemde diğer dönemlere ait toplam <strong>{totalAllYearsPoolCount} adet</strong> faaliyet mevcuttur.
              </>
            ) : scopeTab === 'school' && (poolScopeCount > 0 || totalAllYearsPoolCount > 0) ? (
              <>
                Okul vitrininde yalnızca okul takvimine onaylanmış veya tamamlanmış faaliyetler sergilenir. Şu anda havuzda onay bekleyen veya hazırlık aşamasında <strong>{poolScopeCount > 0 ? poolScopeCount : totalAllYearsPoolCount} adet</strong> faaliyet bulunmaktadır.
              </>
            ) : (
              scopeTab === 'school' 
                ? 'Okul vitrininde görüntülenecek onaylı bir çalışma bulunamadı. Filtrelerinizi temizleyebilirsiniz.' 
                : 'Arama filtrenizi temizleyebilir veya yeni bir sürdürülebilirlik projesi önerisinde bulunabilirsiniz.'
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {scopeTab === 'school' && (poolScopeCount > 0 || totalAllYearsPoolCount > 0) && (
              <button
                onClick={() => {
                  setScopeTab('my');
                  setStatusFilter('all');
                  setYearFilter('all');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tüm Proje Havuzunu Listele ({poolScopeCount > 0 ? poolScopeCount : totalAllYearsPoolCount})</span>
              </button>
            )}

            {yearFilter === 'year' && totalAllYearsPoolCount > 0 && (
              <button
                onClick={() => {
                  setYearFilter('all');
                  if (scopeTab === 'school' && schoolAllYearsCount === 0 && totalAllYearsPoolCount > 0) {
                    setScopeTab('my');
                    setStatusFilter('all');
                  }
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Tüm Yıllardaki Projeleri Listele ({totalAllYearsPoolCount})</span>
              </button>
            )}

            {(searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' || selectedSdgFilter !== null) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDepartmentFilter('all');
                  if (onClearSdgFilter) onClearSdgFilter();
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Filtreleri Sıfırla
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const dept = DEPARTMENTS.find(d => d.id === project.departmentId);

            return (
              <div 
                key={project.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card-soft hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden"
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

                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(project.status, project.rejectionFeedback)}
                    </div>
                  </div>

                  {/* Başlık ve Açıklama (Tıklanabilir Başlık -> Detay Modalı) */}
                  <h3 
                    onClick={() => setDetailProject(project)}
                    className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug cursor-pointer flex items-start justify-between gap-2"
                  >
                    <span>{project.title}</span>
                    <Eye className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Kulüp & Öğrenci Temsilcileri Bilgisi */}
                  {(project.studentClub || (project.studentRepresentatives && project.studentRepresentatives.length > 0)) && (
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-50/60 border border-amber-200/60 flex flex-wrap items-center gap-2 text-[11px]">
                      {project.studentClub && (
                        <span className="font-semibold text-amber-900 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>{project.studentClub}</span>
                        </span>
                      )}
                      {project.studentRepresentatives && project.studentRepresentatives.length > 0 && (
                        <span className="text-slate-600 text-[10px]">
                          Temsilciler: {project.studentRepresentatives.join(', ')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Revizyon Uyarısı */}
                  {project.status === 'revision_needed' && project.rejectionFeedback && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Revizyon Talebi: </span>
                        <span>{project.rejectionFeedback}</span>
                      </div>
                    </div>
                  )}

                  {/* Hedef Kitle / Okul Düzeyleri */}
                  {project.targetGrades && project.targetGrades.length > 0 && (() => {
                    const parsed = parseTargetGrades(project.targetGrades);
                    return (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {parsed.isAllSchool ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <School className="w-3 h-3 text-slate-500" />
                            <span>Tüm Okul (Lise &amp; Fen)</span>
                          </span>
                        ) : (
                          <>
                            {parsed.liseGrades.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/80">
                                <GraduationCap className="w-3 h-3 text-indigo-600" />
                                <span>Işık: {parsed.liseGrades.join(', ')}</span>
                              </span>
                            )}
                            {parsed.fenGrades.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                                <Atom className="w-3 h-3 text-teal-600" />
                                <span>Fen: {parsed.fenGrades.join(', ')}</span>
                              </span>
                            )}
                            {parsed.others.map((other, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <span>{other}</span>
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* SKA Etiketleri */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
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

                {/* Alt Kısım: Danışman, Tarih ve Aksiyon Butonları */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-3 text-xs text-slate-500">
                  {/* Bilgiler: Danışman, Ortaklar, Tarih ve Mekan */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate min-w-0">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{project.advisorName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{project.startDate}</span>
                      </div>
                    </div>

                    {project.collaboratingTeachers && project.collaboratingTeachers.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-teal-700 font-medium min-w-0">
                        <Users className="w-3 h-3 text-teal-600 shrink-0" />
                        <span className="truncate" title={project.collaboratingTeachers.join(', ')}>
                          Ortak: {project.collaboratingTeachers.join(', ')}
                        </span>
                      </div>
                    )}

                    {project.location && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 min-w-0">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate" title={project.location}>{project.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className="flex items-center justify-end flex-wrap gap-2 pt-2 border-t border-slate-100/60">
                    <button
                      onClick={() => setDetailProject(project)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Proje detaylarını ve medya galerisini incele"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>İncele</span>
                    </button>

                    {canEditProject(project) && (
                      <button
                        onClick={() => onEditProject(project)}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                          project.status === 'draft'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>{project.status === 'draft' ? 'Taslağı Düzenle' : 'Revizyonu Düzenle'}</span>
                      </button>
                    )}

                    {canReportProject(project) && (
                      <button
                        onClick={() => onOpenReportModal(project)}
                        className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Sonuç Raporu Gir</span>
                      </button>
                    )}

                    {project.status === 'completed' && project.impactReport && (
                      <button
                        onClick={() => onOpenReportModal(project)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Raporu Güncelle</span>
                      </button>
                    )}

                    {canDeleteProject(project) && (
                      <button
                        onClick={() => handleDelete(project)}
                        className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
                        title="Projeyi Kalıcı Olarak Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proje Detay & Zengin Medya Galerisi Modalı */}
      {detailProject && (
        <ProjectDetailModal 
          project={detailProject}
          isOpen={!!detailProject}
          onClose={() => setDetailProject(null)}
          onOpenReportModal={onOpenReportModal}
          canEditReport={canReportProject(detailProject) || (detailProject.status === 'completed' && (currentUser.role === 'coordinator' || currentUser.role === 'admin' || detailProject.advisorId === currentUser.id))}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
