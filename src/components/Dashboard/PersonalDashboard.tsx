import React, { useState } from 'react';
import { UserProfile, ProjectEvent, CurriculumIntegration, ProjectStatus, AcademicYear, CampusMetric } from '../../types';
import { DEPARTMENTS, parseTargetGrades } from '../../constants';
import { ProjectDetailModal } from '../Projects/ProjectDetailModal';
import { MetricCards } from './MetricCards';
import { SdgGrid } from './SdgGrid';
import { DeptLeaderboard } from './DeptLeaderboard';
import { 
  Sparkles, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Award, 
  BookOpen, 
  Plus, 
  FileEdit, 
  ShieldCheck, 
  FileCheck2, 
  GraduationCap, 
  Atom, 
  School,
  ArrowRight,
  FolderKanban,
  Users,
  Eye,
  Globe2
} from 'lucide-react';

interface PersonalDashboardProps {
  currentUser: UserProfile;
  projects: ProjectEvent[];
  curriculums: CurriculumIntegration[];
  metrics: CampusMetric[];
  profiles: UserProfile[];
  onOpenNewProject: () => void;
  onEditProject: (project: ProjectEvent) => void;
  onOpenReportModal: (project: ProjectEvent) => void;
  onUpdateProjectStatus: (projectId: string, status: ProjectStatus, feedback?: string) => void;
  onNavigateTab: (tab: string) => void;
  activeAcademicYear?: AcademicYear;
  onDeleteProject?: (projectId: string) => void;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  currentUser,
  projects,
  curriculums,
  metrics,
  profiles,
  onOpenNewProject,
  onEditProject,
  onOpenReportModal,
  onUpdateProjectStatus,
  onNavigateTab,
  activeAcademicYear,
  onDeleteProject,
}) => {
  const currentDept = DEPARTMENTS.find(d => d.id === currentUser.departmentId);
  const isTeacher = currentUser.role === 'teacher';
  const isDeptHead = currentUser.role === 'dept_head';

  // Görünüm Modu: 'personal' (Bireysel / Zümre Masası) vs 'school' (Okul Geneli Tablo)
  const [activeView, setActiveView] = useState<'personal' | 'school'>('personal');
  const [selectedSdg, setSelectedSdg] = useState<number | null>(null);

  // Detay Modal State
  const [selectedDetailProject, setSelectedDetailProject] = useState<ProjectEvent | null>(null);

  // Öğretmen için kişisel veriler
  const teacherProjects = projects.filter(p => 
    p.advisorId === currentUser.id || 
    p.advisorName?.toLowerCase() === currentUser.name?.toLowerCase() ||
    p.collaboratingTeachers?.some(t => t.toLowerCase().includes(currentUser.name?.toLowerCase() || ''))
  );
  const teacherDrafts = teacherProjects.filter(p => p.status === 'draft');
  const teacherActive = teacherProjects.filter(p => p.status !== 'draft');
  const teacherCurriculums = curriculums.filter(c => 
    c.teacherName?.toLowerCase() === currentUser.name?.toLowerCase() ||
    (c.departmentId === currentUser.departmentId && isTeacher)
  );
  const teacherTotalStudents = teacherProjects.reduce((sum, p) => sum + (p.impactReport?.actualParticipants || 0), 0) +
    teacherCurriculums.reduce((sum, c) => sum + (c.studentCount || 0), 0);

  // Bölüm Başkanı için zümre verileri
  const deptProjects = projects.filter(p => p.departmentId === currentUser.departmentId);
  const deptPendingProjects = deptProjects.filter(p => p.status === 'submitted');
  const deptCurriculums = curriculums.filter(c => c.departmentId === currentUser.departmentId);
  const deptTeachers = profiles.filter(p => p.departmentId === currentUser.departmentId && p.role === 'teacher');

  const getStatusBadge = (status: ProjectStatus, feedback?: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3 text-slate-500" />
            Taslak
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            Onay Bekliyor
          </span>
        );
      case 'dept_approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Koordinatör Onayında
          </span>
        );
      case 'coordinator_approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Yayında / Takvimde
          </span>
        );
      case 'revision_needed':
        return (
          <span 
            title={feedback}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200"
          >
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Revizyon Notu Var
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <Award className="w-3 h-3 text-teal-600" />
            Tamamlandı
          </span>
        );
    }
  };

  const revisionProjects = teacherProjects.filter(p => p.status === 'revision_needed');

  return (
    <div className="space-y-6">
      {/* Görünüm Geçişi: Kişisel / Zümre Masası vs Okul Geneli Sürdürülebilirlik Tablosu */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        <button
          onClick={() => setActiveView('personal')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeView === 'personal'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isTeacher ? 'Bireysel Çalışma Masam' : 'Zümre Yönetim Masam'}</span>
        </button>

        <button
          onClick={() => setActiveView('school')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeView === 'school'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Okul Geneli Sürdürülebilirlik Tablosu (17 SKA &amp; Liderlik)</span>
        </button>
      </div>

      {activeView === 'school' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <MetricCards 
            projects={projects}
            curriculums={curriculums}
            metrics={metrics}
            activeAcademicYear={activeAcademicYear}
          />
          <SdgGrid 
            projects={projects}
            curriculums={curriculums}
            selectedSdg={selectedSdg}
            onSelectSdg={setSelectedSdg}
          />
          <DeptLeaderboard 
            projects={projects}
            curriculums={curriculums}
            onSelectDepartment={() => onNavigateTab('projects')}
          />
        </div>
      ) : (
        <>
          {/* Koordinatörlük Revizyon Bildirimi */}
          {revisionProjects.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2.5 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-800 text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Koordinatörlük Revizyon Bildirimi ({revisionProjects.length} Proje)</span>
              </div>
              {revisionProjects.map(p => (
                <div key={p.id} className="p-3.5 bg-white rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{p.title}</p>
                    <p className="text-rose-700 mt-1">
                      <strong>İletilen Revizyon Gerekçesi:</strong> {p.rejectionFeedback || 'Lütfen proje hedeflerini veya ayrıntılarını güncelleyip tekrar onaya sununuz.'}
                    </p>
                  </div>
                  <button
                    onClick={() => onEditProject(p)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Düzenle &amp; Tekrar Gönder</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 1. BİREYSEL KARŞILAMA VE KİMLİK KARTI */}
          <div className={`text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border ${
            isTeacher 
              ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-emerald-900/40' 
              : 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-blue-900/40'
          }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 p-1 border-2 border-white/20 shadow-lg shrink-0 overflow-hidden backdrop-blur-xs">
              <img 
                src={currentUser.avatar || '/logo.png'} 
                alt={currentUser.name} 
                className="w-full h-full object-cover rounded-xl"
              />
              <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                isTeacher ? 'bg-emerald-400' : 'bg-blue-400'
              }`} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isTeacher ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {isTeacher ? '🌱 Danışman Öğretmen Bireysel Sayfası' : '🏛️ Bölüm Başkanlığı Yönetim Masası'}
                </span>
                <span className="text-xs text-slate-300">
                  {currentDept?.name}
                </span>
                {activeAcademicYear && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <GraduationCap className="w-3 h-3 text-amber-300" />
                    <span>{activeAcademicYear.name} ({activeAcademicYear.startDate.split('-').reverse().join('.')} – {activeAcademicYear.endDate.split('-').reverse().join('.')})</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                {currentUser.name}
              </h2>
              <p className="text-xs text-slate-300">
                {currentUser.title || (isTeacher ? 'Sürdürülebilirlik Danışman Öğretmeni' : `${currentDept?.name} Bölüm Başkanı`)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewProject}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isTeacher ? 'Yeni Proje / Etkinlik Öner' : 'Yeni Zümre Projesi Başlat'}</span>
            </button>

            {isDeptHead && (
              <button
                onClick={() => onNavigateTab('approvals')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors border border-white/20 flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Onay Masası ({deptPendingProjects.length})</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('curriculum')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Ders Kazanımı Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BİREYSEL / ZÜMRE BAŞARI GÖSTERGELERİ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isTeacher ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yürüttüğüm Projeler</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{teacherProjects.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{teacherActive.length} aktif veya tamamlanan</p>
            </div>

            <div className={`p-5 rounded-2xl border shadow-card-soft transition-all ${
              teacherDrafts.length > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Taslaklarım</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <FileEdit className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{teacherDrafts.length}</p>
              <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
                {teacherDrafts.length > 0 ? 'Kaldığınız yerden devam edebilirsiniz' : 'Kayıtlı taslak yok'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ders İçi Kazanımlarım</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{teacherCurriculums.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Müfredata işlenen sürdürülebilirlik</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Öğrenci Etkim</span>
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{teacherTotalStudents.toLocaleString('tr-TR')}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Doğrudan temas edilen öğrenci</p>
            </div>
          </>
        ) : (
          <>
            <div className={`p-5 rounded-2xl border shadow-card-soft transition-all ${
              deptPendingProjects.length > 0 ? 'bg-amber-50/80 border-amber-200 ring-1 ring-amber-300' : 'bg-white border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Onay Bekleyenler</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{deptPendingProjects.length}</p>
              <p className="text-[11px] text-amber-700 mt-0.5 font-medium">Zümrenize sunulan başvurular</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zümre Projeleri</span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{deptProjects.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{currentDept?.name} toplam faaliyeti</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Müfredat Kazanımları</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{deptCurriculums.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Zümre derslerine entegrasyon</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zümre Öğretmenleri</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{deptTeachers.length || 2}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Aktif danışman kadro</p>
            </div>
          </>
        )}
      </div>

      {/* 3. ÖĞRETMENİN KENDİ PROJELERİ & TASLAKLARI VEYA BÖLÜM BAŞKANININ ONAY BEKLEYENLERİ */}
      {isTeacher ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Yürüttüğüm Çalışmalar ve Taslaklarım
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Danışmanlığını üstlendiğiniz, taslak aşamasında olan veya onaylanmış tüm projeleriniz
              </p>
            </div>

            <button
              onClick={onOpenNewProject}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Proje Başlat</span>
            </button>
          </div>

          {teacherProjects.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Henüz adınıza kayıtlı bir çalışma bulunmuyor</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Yeni bir çevre veya sürdürülebilirlik projesi önerisinde bulunabilir veya taslak kaydedebilirsiniz.
              </p>
              <button
                onClick={onOpenNewProject}
                className="mt-3.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                İlk Projemi Öner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teacherProjects.map(project => {
                const parsed = parseTargetGrades(project.targetGrades);
                return (
                  <div 
                    key={project.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      project.status === 'draft' 
                        ? 'bg-amber-50/50 border-amber-200 shadow-xs' 
                        : project.status === 'revision_needed'
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-white border-slate-200/80 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {project.eventType}
                        </span>
                        {getStatusBadge(project.status, project.rejectionFeedback)}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {project.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      {project.status === 'revision_needed' && project.rejectionFeedback && (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span><strong>Bölüm Başkanı Notu:</strong> {project.rejectionFeedback}</span>
                        </div>
                      )}

                      {/* Hedef Kitle */}
                      {project.targetGrades && project.targetGrades.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {parsed.isAllSchool ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <School className="w-3 h-3 text-slate-500" />
                              <span>Tüm Okul</span>
                            </span>
                          ) : (
                            <>
                              {parsed.liseGrades.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  <GraduationCap className="w-3 h-3 text-indigo-600" />
                                  <span>Lise: {parsed.liseGrades.join(', ')}</span>
                                </span>
                              )}
                              {parsed.fenGrades.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                  <Atom className="w-3 h-3 text-teal-600" />
                                  <span>Fen: {parsed.fenGrades.join(', ')}</span>
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Öğrenci Kulübü ve Öğrenci Temsilcileri */}
                      {(project.studentClub || (project.studentRepresentatives && project.studentRepresentatives.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {project.studentClub && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              <span>🏛️ {project.studentClub}</span>
                            </span>
                          )}
                          {project.studentRepresentatives && project.studentRepresentatives.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span>👥 Öğrenci Temsilcileri: {project.studentRepresentatives.join(', ')}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Ortak Öğretmenler */}
                      {project.collaboratingTeachers && project.collaboratingTeachers.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-teal-700 font-medium pt-1">
                          <Users className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate">Ortak: {project.collaboratingTeachers.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {project.startDate}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedDetailProject(project)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>İncele</span>
                        </button>

                        {(project.status === 'draft' || project.status === 'revision_needed') && (
                          <button
                            onClick={() => onEditProject(project)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <FileEdit className="w-3 h-3" />
                            <span>{project.status === 'draft' ? 'Taslağı Düzenle' : 'Revizyonu Düzelt'}</span>
                          </button>
                        )}

                        {project.status === 'coordinator_approved' && (
                          <button
                            onClick={() => onOpenReportModal(project)}
                            className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <FileCheck2 className="w-3 h-3" />
                            <span>Sonuç Raporu Gir</span>
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
      ) : (
        /* BÖLÜM BAŞKANI: ZÜMRE ONAY MASASI KUTUSU */
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Zümrenizde Onayınızı Bekleyen Başvurular</span>
                  {deptPendingProjects.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {deptPendingProjects.length} Bekliyor
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentDept?.name} öğretmenleri tarafından onayınıza sunulan çalışmalar
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('approvals')}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Onay Masasına Git</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {deptPendingProjects.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">Harika! Zümrenizde bekleyen başvuru yok.</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Danışman öğretmenleriniz yeni bir çalışma sunduğunda burada listelenecektir.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deptPendingProjects.map(project => (
                  <div 
                    key={project.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                          {project.eventType}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          Danışman: {project.advisorName}
                        </span>
                        {project.collaboratingTeachers && project.collaboratingTeachers.length > 0 && (
                          <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                            <Users className="w-3 h-3 text-teal-600 shrink-0" />
                            Ortak: {project.collaboratingTeachers.join(', ')}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{project.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-1">{project.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onUpdateProjectStatus(project.id, 'dept_approved')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ön Onay Ver</span>
                      </button>

                      <button
                        onClick={() => onNavigateTab('approvals')}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        İncele / Revizyon
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zümre Projeleri Listesi */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {currentDept?.name} Proje ve Etkinlik Portföyü
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Zümrenize ait toplam {deptProjects.length} adet faaliyet yürütülmektedir
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('projects')}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Tüm Havuzu Gör</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {deptProjects.slice(0, 4).map(project => (
                <div 
                  key={project.id} 
                  onClick={() => setSelectedDetailProject(project)}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all cursor-pointer space-y-2 text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[200px] group-hover:text-emerald-800 transition-colors">
                      {project.title}
                    </span>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-slate-500 line-clamp-2 leading-relaxed">{project.description}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      <span>Öğretmen: {project.advisorName}</span>
                      {project.collaboratingTeachers && project.collaboratingTeachers.length > 0 && (
                        <span className="text-teal-700 font-medium truncate">• Ortak: {project.collaboratingTeachers.join(', ')}</span>
                      )}
                    </div>
                    <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5">
                      <Eye className="w-3 h-3" />
                      İncele
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Proje Detay Kartı & Etki Medya Galerisi */}
      <ProjectDetailModal
        project={selectedDetailProject}
        isOpen={!!selectedDetailProject}
        onClose={() => setSelectedDetailProject(null)}
        onOpenReportModal={onOpenReportModal}
        canEditReport={
          currentUser.role === 'coordinator' ||
          currentUser.role === 'admin' ||
          currentUser.id === selectedDetailProject?.advisorId ||
          currentUser.name === selectedDetailProject?.advisorName
        }
        onEditProject={onEditProject}
        onDeleteProject={onDeleteProject}
        currentUser={currentUser}
      />
    </div>
  );
};
