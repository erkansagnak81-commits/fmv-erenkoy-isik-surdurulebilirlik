import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  UserRole, 
  ProjectEvent, 
  CurriculumIntegration, 
  CampusMetric, 
  ProjectStatus, 
  ImpactReport,
  Department 
} from './types';
import { 
  MOCK_USERS, 
  INITIAL_PROJECTS, 
  INITIAL_CURRICULUM, 
  INITIAL_CAMPUS_METRICS,
  DEPARTMENTS 
} from './data/mockData';
import { dbService } from './lib/dbService';
import { isSupabaseConfigured } from './lib/supabase';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MetricCards } from './components/Dashboard/MetricCards';
import { SdgGrid } from './components/Dashboard/SdgGrid';
import { DeptLeaderboard } from './components/Dashboard/DeptLeaderboard';
import { ProjectList } from './components/Projects/ProjectList';
import { ProjectFormModal } from './components/Projects/ProjectFormModal';
import { ImpactReportModal } from './components/Projects/ImpactReportModal';
import { ApprovalDesk } from './components/Approvals/ApprovalDesk';
import { CurriculumTracker } from './components/Curriculum/CurriculumTracker';
import { CampusMetricsView } from './components/CampusMetrics/CampusMetricsView';
import { AnnualReportView } from './components/Reports/AnnualReportView';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export function App() {
  // Aktif kullanıcı rolü (Varsayılan: Sürdürülebilirlik Koordinatörü)
  const [currentRole, setCurrentRole] = useState<UserRole>('coordinator');
  const [activeDeptHeadDeptId, setActiveDeptHeadDeptId] = useState<string>(DEPARTMENTS[0].id);

  // Aktif kullanıcı profilini hesapla
  const currentUser: UserProfile = React.useMemo(() => {
    if (currentRole === 'dept_head') {
      const targetDept = DEPARTMENTS.find(d => d.id === activeDeptHeadDeptId) || DEPARTMENTS[0];
      return {
        id: `user-head-${targetDept.code.toLowerCase()}`,
        name: targetDept.headName,
        email: `${targetDept.headName.toLowerCase().replace(/[^a-z]/g, '')}@erenkoyisik.k12.tr`,
        role: 'dept_head',
        departmentId: targetDept.id,
        title: `${targetDept.name} Bölüm Başkanı`,
        avatar: '/logo.png',
      };
    }
    return MOCK_USERS[currentRole];
  }, [currentRole, activeDeptHeadDeptId]);

  // Aktif sekme
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Veri Durumları
  const [projects, setProjects] = useState<ProjectEvent[]>(INITIAL_PROJECTS);
  const [curriculums, setCurriculums] = useState<CurriculumIntegration[]>(INITIAL_CURRICULUM);
  const [metrics, setMetrics] = useState<CampusMetric[]>(INITIAL_CAMPUS_METRICS);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filtreler & Modallar
  const [selectedSdgFilter, setSelectedSdgFilter] = useState<number | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState<ProjectEvent | null>(null);

  // Toast Bildirimi
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Supabase'den Canlı Verileri Çek
  useEffect(() => {
    const loadData = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: liveProjects, fromLive } = await dbService.getProjects();
          if (fromLive) {
            setProjects(liveProjects);
          }

          const liveCurr = await dbService.getCurriculums();
          if (liveCurr && liveCurr.length > 0) {
            setCurriculums(liveCurr);
          }

          const liveMet = await dbService.getCampusMetrics();
          if (liveMet && liveMet.length > 0) {
            setMetrics(liveMet);
          }

          if (fromLive) {
            showToast('FMV Erenköy Işık veritabanına bağlanıldı.');
          }
        } catch (e) {
          console.error('Veri yükleme hatası:', e);
        }
      }
    };

    loadData();
  }, []);

  // Onay Bekleyen Sayısı
  const pendingCount = projects.filter(p => {
    if (currentRole === 'dept_head') {
      return p.departmentId === currentUser.departmentId && p.status === 'submitted';
    }
    return p.status === 'dept_approved' || p.status === 'submitted';
  }).length;

  // 2. Yeni Proje Ekleme (Supabase'e Yazar)
  const handleAddProject = async (newProjectData: Omit<ProjectEvent, 'id' | 'createdAt'>) => {
    const tempId = `proj-${Date.now()}`;
    const newProject: ProjectEvent = {
      ...newProjectData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    setProjects(prev => [newProject, ...prev]);
    showToast(`"${newProject.title}" oluşturuldu ve ${currentUser.title}'na onaya sevk edildi.`);

    const realId = await dbService.createProject(newProjectData);
    if (realId !== tempId) {
      setProjects(prev => prev.map(p => p.id === tempId ? { ...p, id: realId } : p));
    }
  };

  // 3. Durum Güncelleme (Onay / Revizyon)
  const handleUpdateProjectStatus = async (
    projectId: string, 
    newStatus: ProjectStatus, 
    feedback?: string
  ) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          status: newStatus,
          rejectionFeedback: feedback,
        };
      }
      return p;
    }));

    await dbService.updateProjectStatus(projectId, newStatus, feedback);

    if (newStatus === 'dept_approved') {
      showToast(`${currentUser.name} tarafından onaylandı ve Koordinatöre iletildi.`);
    } else if (newStatus === 'coordinator_approved') {
      showToast('Proje okul takvimine onaylandı ve yayına alındı!');
    } else if (newStatus === 'revision_needed') {
      showToast('Revizyon notu danışman öğretmene iletildi.');
    }
  };

  // 4. Etkinlik Kapanış / Etki Raporu
  const handleSubmitImpactReport = async (
    projectId: string, 
    reportData: Omit<ImpactReport, 'id' | 'completedAt'>
  ) => {
    const fullReport: ImpactReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          status: 'completed',
          impactReport: fullReport,
        };
      }
      return p;
    }));

    await dbService.saveImpactReport(projectId, reportData);
    showToast('Etkinlik etki raporu kaydedildi ve arşive eklendi!');
  };

  // 5. Yeni Müfredat Ekleme
  const handleAddCurriculum = async (newItem: Omit<CurriculumIntegration, 'id'>) => {
    const newEntry: CurriculumIntegration = {
      ...newItem,
      id: `curr-${Date.now()}`,
    };
    setCurriculums(prev => [newEntry, ...prev]);
    await dbService.createCurriculum(newItem);
    showToast(`"${newEntry.courseName}" dersi sürdürülebilirlik matrisine eklendi.`);
  };

  // 6. Yeni Kampüs Metriği Ekleme
  const handleAddCampusMetric = async (newMetricData: Omit<CampusMetric, 'id'>) => {
    const newEntry: CampusMetric = {
      ...newMetricData,
      id: `met-${Date.now()}`,
    };
    setMetrics(prev => [...prev, newEntry]);
    await dbService.createCampusMetric(newMetricData);
    showToast(`${newEntry.period} dönemi tüketim verileri işlendi.`);
  };

  // 7. Supabase'e Veri Eşitleme
  const handleSyncSeedData = async () => {
    setIsSyncing(true);
    showToast('FMV Erenköy Işık zümreleri ve projeleri Supabase tablolarına aktarılıyor...');
    
    const result = await dbService.seedInitialData();
    setIsSyncing(false);
    showToast(result.message);

    const { data: refreshedProjects } = await dbService.getProjects();
    setProjects(refreshedProjects);

    const refreshedCurr = await dbService.getCurriculums();
    setCurriculums(refreshedCurr);

    const refreshedMet = await dbService.getCampusMetrics();
    setMetrics(refreshedMet);
  };

  const handleOpenReportModal = (project: ProjectEvent) => {
    setSelectedProjectForReport(project);
    setIsImpactModalOpen(true);
  };

  const handleSdgSelect = (sdgNum: number | null) => {
    setSelectedSdgFilter(sdgNum);
    if (sdgNum !== null) {
      setCurrentTab('projects');
    }
  };

  const handleDeptHeadSelect = (dept: Department) => {
    setActiveDeptHeadDeptId(dept.id);
    showToast(`Aktif Bölüm Başkanı: ${dept.headName} (${dept.name})`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Toast Bildirim Kutusu */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 text-xs font-medium max-w-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Üst Bar */}
      <Header 
        currentUser={currentUser}
        onRoleChange={(role) => {
          setCurrentRole(role);
          if (role !== 'dept_head') {
            showToast(`Rol değiştirildi: ${MOCK_USERS[role].title}`);
          }
        }}
        onDepartmentHeadChange={handleDeptHeadSelect}
        pendingCount={pendingCount}
        onSyncSeedData={handleSyncSeedData}
        isSyncing={isSyncing}
      />

      {/* Ana Gövde */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Yan Menü */}
        <Sidebar 
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          pendingCount={pendingCount}
          userRole={currentRole}
        />

        {/* Ana İçerik Alanı */}
        <main className="flex-1 p-4 lg:p-8 space-y-6 min-w-0 overflow-x-hidden">
          {/* SEKME 1: GENEL GÖSTERGE PANELİ */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Karşılama Başlığı */}
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-900/40">
                <div className="relative z-10 max-w-2xl space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>FMV Erenköy Işık Lisesi ve Fen Lisesi • Sürdürülebilirlik Vizyonu</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Hoş Geldiniz, {currentUser.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    Feyziye Mektepleri Vakfı'nın 1885'ten bu yana süregelen ışığını geleceğe taşıyor; 
                    7 akademik zümremiz ile çevre bilincini, sıfır atık hedeflerini ve BM Küresel Amaçlarını 
                    tek bir ekosistemde buluşturuyoruz.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setIsProjectModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>+ Yeni Proje Başlat</span>
                    </button>
                    <button
                      onClick={() => setCurrentTab('reports')}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors backdrop-blur-xs flex items-center gap-1.5"
                    >
                      <span>Yıllık Özeti İncele</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Arka Plan Dekorasyonu: Işık Meşalesi Silueti */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 w-64 h-64 pointer-events-none hidden md:block">
                  <img src="/logo.png" alt="Işık Meşalesi" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Temel Metrikler */}
              <MetricCards 
                projects={projects}
                curriculums={curriculums}
                metrics={metrics}
              />

              {/* 17 BM SKA Isı Haritası */}
              <SdgGrid 
                projects={projects}
                curriculums={curriculums}
                selectedSdg={selectedSdgFilter}
                onSelectSdg={handleSdgSelect}
              />

              {/* 7 Zümre Liderlik Tablosu */}
              <DeptLeaderboard 
                projects={projects}
                curriculums={curriculums}
                onSelectDepartment={() => setCurrentTab('projects')}
              />
            </div>
          )}

          {/* SEKME 2: PROJE VE ETKİNLİK HAVUZU */}
          {currentTab === 'projects' && (
            <ProjectList 
              projects={projects}
              currentUser={currentUser}
              onOpenNewModal={() => setIsProjectModalOpen(true)}
              onOpenReportModal={handleOpenReportModal}
              selectedSdgFilter={selectedSdgFilter}
              onClearSdgFilter={() => setSelectedSdgFilter(null)}
            />
          )}

          {/* SEKME 3: ONAY MASASI (BÖLÜM BAŞKANI & KOORDİNATÖR) */}
          {currentTab === 'approvals' && (
            <ApprovalDesk 
              projects={projects}
              currentUser={currentUser}
              onUpdateStatus={handleUpdateProjectStatus}
            />
          )}

          {/* SEKME 4: MÜFREDAT & SKA MATRİSİ */}
          {currentTab === 'curriculum' && (
            <CurriculumTracker 
              curriculums={curriculums}
              onAddCurriculum={handleAddCurriculum}
              currentUser={currentUser}
            />
          )}

          {/* SEKME 5: YEŞİL KAMPÜS METRİKLERİ */}
          {currentTab === 'campus' && (
            <CampusMetricsView 
              metrics={metrics}
              onAddMetric={handleAddCampusMetric}
              currentUser={currentUser}
            />
          )}

          {/* SEKME 6: ECO-SCHOOLS & YILLIK RAPOR */}
          {currentTab === 'reports' && (
            <AnnualReportView 
              projects={projects}
              curriculums={curriculums}
              metrics={metrics}
            />
          )}
        </main>
      </div>

      {/* Proje Başvuru Modalı */}
      <ProjectFormModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleAddProject}
        currentUser={currentUser}
      />

      {/* Etki / Kapanış Raporu Modalı */}
      {selectedProjectForReport && (
        <ImpactReportModal 
          project={selectedProjectForReport}
          isOpen={isImpactModalOpen}
          onClose={() => {
            setIsImpactModalOpen(false);
            setSelectedProjectForReport(null);
          }}
          onSubmit={handleSubmitImpactReport}
        />
      )}
    </div>
  );
}

export default App;
