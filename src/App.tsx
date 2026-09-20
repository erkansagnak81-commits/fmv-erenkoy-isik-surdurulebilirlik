import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  UserRole, 
  ProjectEvent, 
  CurriculumIntegration, 
  CampusMetric, 
  ProjectStatus, 
  ImpactReport,
  Department,
  AcademicYear,
  SystemRolePermissions,
  ActivityLog,
  LogCategory
} from './types';
import { DEPARTMENTS, isSuperAdminEmail } from './constants';
import { 
  DEFAULT_SIMULATION_USERS as MOCK_USERS, 
  INITIAL_PROFILES
} from './data/initialData';
import { dbService } from './lib/dbService';
import { isFirebaseConfigured, auth } from './lib/firebase';
import { pwaManager } from './lib/pwa';
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
import { UserManagementView } from './components/Admin/UserManagementView';
import { ActivityLogsView } from './components/Admin/ActivityLogsView';
import { LoginModal } from './components/Auth/LoginModal';
import { PersonalDashboard } from './components/Dashboard/PersonalDashboard';
import { SchoolCalendarView } from './components/Calendar/SchoolCalendarView';
import { Sparkles, CheckCircle2, ArrowRight, GraduationCap } from 'lucide-react';

export function App() {
  // Kayıtlı profiller
  const [profiles, setProfiles] = useState<UserProfile[]>(INITIAL_PROFILES);

  // Giriş yapmış kullanıcı (Oturum)
  const [authUser, setAuthUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('ecocampus_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Aktif rol ve zümre
  const [currentRole, setCurrentRole] = useState<UserRole>(authUser?.role || 'coordinator');
  const [activeDeptHeadDeptId, setActiveDeptHeadDeptId] = useState<string>(
    authUser?.departmentId || DEPARTMENTS[0].id
  );
  const [activeTeacherId, setActiveTeacherId] = useState<string>(() => {
    const firstTeacher = INITIAL_PROFILES.find(p => p.role === 'teacher');
    return firstTeacher ? firstTeacher.id : 'user-teacher-isik';
  });

  // Aktif kullanıcı profilini hesapla
  const currentUser: UserProfile = React.useMemo(() => {
    if (!authUser) return INITIAL_PROFILES[0];

    // Koordinatör veya Admin ise önizleme için rol değiştirebilir
    if (authUser.role === 'coordinator' || authUser.role === 'admin') {
      if (currentRole === 'dept_head') {
        const targetDept = DEPARTMENTS.find(d => d.id === activeDeptHeadDeptId) || DEPARTMENTS[0];
        const match = profiles.find(p => p.departmentId === targetDept.id && p.role === 'dept_head');
        return match || {
          id: `user-head-${targetDept.code.toLowerCase()}`,
          name: targetDept.headName,
          email: `${targetDept.headName.toLowerCase().replace(/[^a-z]/g, '')}@fmvisik.k12.tr`,
          role: 'dept_head',
          departmentId: targetDept.id,
          title: `${targetDept.name} Bölüm Başkanı`,
          avatar: '/logo.png',
        };
      }
      if (currentRole === 'teacher') {
        const match = profiles.find(p => p.id === activeTeacherId) || profiles.find(p => p.role === 'teacher');
        return match || MOCK_USERS.teacher;
      }
      if (currentRole === 'principal') {
        const match = profiles.find(p => p.role === 'principal');
        return match || MOCK_USERS.principal;
      }
      return authUser;
    }

    return authUser;
  }, [authUser, currentRole, activeDeptHeadDeptId, activeTeacherId, profiles]);

  // Aktif sekme
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Veri Durumları (Kalıcı Yerel Depolama + Bulut Eşitleme)
  const [projects, setProjects] = useState<ProjectEvent[]>(() => dbService.getLocalProjects());
  const [curriculums, setCurriculums] = useState<CurriculumIntegration[]>(() => dbService.getLocalCurriculums());
  const [metrics, setMetrics] = useState<CampusMetric[]>(() => dbService.getLocalCampusMetrics());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => dbService.getLocalActivityLogs());
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState<AcademicYear | undefined>(undefined);
  const [rolePermissions, setRolePermissions] = useState<SystemRolePermissions>(() => dbService.getLocalRolePermissions());

  // Oturum Süresi Takibi
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Filtreler & Modallar
  const [selectedSdgFilter, setSelectedSdgFilter] = useState<number | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectEvent | null>(null);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState<ProjectEvent | null>(null);

  // PWA & Çevrimiçi / Çevrimdışı Durumu
  const [isOnline, setIsOnline] = useState<boolean>(() => pwaManager.getIsOnline());
  const [isPwaInstallable, setIsPwaInstallable] = useState<boolean>(() => pwaManager.getIsInstallable());

  useEffect(() => {
    const unsubOnline = pwaManager.subscribeOnline(setIsOnline);
    const unsubInstall = pwaManager.subscribeInstall(setIsPwaInstallable);
    return () => {
      unsubOnline();
      unsubInstall();
    };
  }, []);

  // Toast Bildirimi
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Aktivite Kaydetme Yardımcısı
  const trackActivity = async (
    actionType: string,
    category: LogCategory,
    description: string,
    details?: Record<string, any>,
    sessionDurationSeconds?: number
  ) => {
    try {
      const logUser = authUser || currentUser;
      const created = await dbService.logActivity({
        userId: logUser.id,
        userName: logUser.name,
        userEmail: logUser.email,
        userRole: logUser.role,
        departmentId: logUser.departmentId,
        actionType,
        category,
        description,
        details,
        sessionDurationSeconds
      });
      setActivityLogs(prev => [created, ...prev.filter(l => l.id !== created.id)]);
    } catch (err) {
      console.warn('Aktivite logu kaydedilemedi:', err);
    }
  };

  // Sekme kapatma / sayfadan ayrılma durumunda oturum süresini kaydet
  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeUser = authUser || currentUser;
      if (activeUser && activeUser.email) {
        const durationSec = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
        const logEntry: Omit<ActivityLog, 'id' | 'timestamp'> = {
          userId: activeUser.id,
          userName: activeUser.name,
          userEmail: activeUser.email,
          userRole: activeUser.role,
          departmentId: activeUser.departmentId,
          actionType: 'logout',
          category: 'auth',
          description: `${activeUser.name} oturumu kapattı (Süre: ${Math.floor(durationSec / 60)} dk ${durationSec % 60} sn)`,
          sessionDurationSeconds: durationSec,
        };
        try {
          const stored = localStorage.getItem('ecocampus_activity_logs_v1');
          const list = stored ? JSON.parse(stored) : [];
          const fullEntry = { ...logEntry, id: `log-${Date.now()}`, timestamp: new Date().toISOString() };
          localStorage.setItem('ecocampus_activity_logs_v1', JSON.stringify([fullEntry, ...list].slice(0, 500)));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [authUser, currentUser]);

  // Gerçek Zamanlı Canlı Güncelleme Rozet Durumu
  const [hasLiveUpdate, setHasLiveUpdate] = useState(false);
  const liveUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerLiveUpdateNotice = (msg?: string) => {
    setHasLiveUpdate(true);
    if (liveUpdateTimerRef.current) {
      clearTimeout(liveUpdateTimerRef.current);
    }
    liveUpdateTimerRef.current = setTimeout(() => {
      setHasLiveUpdate(false);
    }, 6000);
    if (msg) {
      showToast(msg);
    }
  };

  // Oturum Yönetimi
  const handleLogin = (user: UserProfile) => {
    setAuthUser(user);
    setCurrentRole(user.role);
    sessionStartTimeRef.current = Date.now();
    if (user.departmentId) setActiveDeptHeadDeptId(user.departmentId);
    try {
      localStorage.setItem('ecocampus_auth_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    showToast(`Hoş geldiniz, ${user.name} (${user.title || user.email})`);
    trackActivity('login', 'auth', `${user.name} sisteme giriş yaptı.`);
  };

  const handleLogout = () => {
    const logUser = authUser || currentUser;
    const durationSec = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    trackActivity('logout', 'auth', `${logUser.name} sistemden çıkış yaptı. (Oturum: ${Math.floor(durationSec / 60)} dk ${durationSec % 60} sn)`, undefined, durationSec);
    setAuthUser(null);
    try {
      localStorage.removeItem('ecocampus_auth_user');
    } catch {
      // ignore
    }
    showToast('Oturum kapatıldı.');
  };

  // Kullanıcı & Profil Yönetimi
  const handleAddProfile = async (profileData: Omit<UserProfile, 'id'>) => {
    const created = await dbService.createProfile(profileData);
    setProfiles(prev => [created, ...prev]);
    trackActivity('create_user', 'system', `Yeni kullanıcı profili oluşturuldu: ${created.name} (${created.email})`);
    showToast(`${created.name} (@fmvisik.k12.tr) sisteme başarıyla tanımlandı.`);
  };

  const handleUpdateProfile = async (id: string, updates: Partial<UserProfile>) => {
    const target = profiles.find(p => p.id === id);
    const success = await dbService.updateProfile(id, updates);
    if (success) {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      if (authUser && authUser.id === id) {
        const updated = { ...authUser, ...updates };
        setAuthUser(updated);
        try {
          localStorage.setItem('ecocampus_auth_user', JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      trackActivity('update_user', 'system', `Kullanıcı profili güncellendi: ${target?.name || id}`);
      showToast('Kullanıcı bilgileri ve yetkileri güncellendi.');
    } else {
      showToast('Kullanıcı güncellenirken bir sorun oluştu.');
    }
  };

  const handleDeleteProfile = async (id: string) => {
    const target = profiles.find(p => p.id === id);
    const success = await dbService.deleteProfile(id);
    if (success) {
      setProfiles(prev => prev.filter(p => p.id !== id));
      trackActivity('delete_user', 'system', `Kullanıcı sistemden silindi: ${target?.name || id}`);
      showToast('Kullanıcı sistemden kaldırıldı.');
    }
  };

  // Eğitim-Öğretim Yılı Yönetimi Handlers
  const handleSaveAcademicYear = async (year: AcademicYear) => {
    const updated = await dbService.saveAcademicYear(year);
    setAcademicYears(updated);
    const active = updated.find(y => y.isActive) || updated[0];
    setActiveAcademicYear(active);
    trackActivity('update_academic_year', 'system', `Eğitim-öğretim yılı kaydedildi: ${year.name}`);
    showToast(`Eğitim-Öğretim Yılı Güncellendi: ${year.name}`);
  };

  const handleSetActiveAcademicYear = async (yearId: string) => {
    const updated = await dbService.setActiveAcademicYear(yearId);
    setAcademicYears(updated);
    const active = updated.find(y => y.id === yearId);
    if (active) {
      setActiveAcademicYear(active);
      trackActivity('change_active_year', 'system', `Aktif eğitim-öğretim yılı değiştirildi: ${active.name}`);
      showToast(`Aktif Eğitim-Öğretim Yılı: ${active.name}`);
    }
  };

  // Rol & Yetki Yönetimi Handlers
  const handleSaveRolePermissions = async (updated: SystemRolePermissions) => {
    const saved = await dbService.saveRolePermissions(updated);
    setRolePermissions(saved);
    trackActivity('update_permissions', 'system', 'Rol yetki matrisi güncellendi.');
    showToast('Rol ve yetki yapılandırması başarıyla kaydedildi.');
  };

  const handleResetRolePermissions = async () => {
    const reset = await dbService.resetRolePermissionsToDefault();
    setRolePermissions(reset);
    trackActivity('update_permissions', 'system', 'Rol yetkileri kurumsal varsayılan ayarlara sıfırlandı.');
    showToast('Rol yetkileri kurumsal varsayılan ayarlara sıfırlandı.');
  };

  // 1. Canlı ve Yerel Verileri Senkronize Et (Gerçek Zamanlı Dinleyiciler & Firestore Önbellek)
  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeProjects: (() => void) | undefined;
    let unsubscribeCurr: (() => void) | undefined;
    let unsubscribeMetrics: (() => void) | undefined;
    let unsubscribePerms: (() => void) | undefined;

    const loadData = async () => {
      // Profilleri çek (Yerel IndexedDB önbelleği veya Firestore)
      try {
        const liveProfiles = await dbService.getProfiles();
        if (liveProfiles && liveProfiles.length > 0) {
          setProfiles(liveProfiles);
          setAuthUser(prev => {
            if (!prev) return null;
            const fresh = liveProfiles.find(p => p.email.toLowerCase() === prev.email.toLowerCase());
            return fresh || prev;
          });
        }
      } catch (err) {
        console.warn('Profiller yüklenemedi:', err);
      }

      // Eğitim-Öğretim Yıllarını Çek
      try {
        const liveYears = await dbService.getAcademicYears();
        if (liveYears && liveYears.length > 0) {
          setAcademicYears(liveYears);
          const activeYear = liveYears.find(y => y.isActive) || liveYears[0];
          setActiveAcademicYear(activeYear);
        }
      } catch (err) {
        console.warn('Eğitim yılları yüklenemedi:', err);
      }

      // Rol & Yetki Matrisini Çek
      try {
        const livePerms = await dbService.getRolePermissions();
        if (livePerms) {
          setRolePermissions(livePerms);
        }
      } catch (err) {
        console.warn('Rol yetkileri yüklenemedi:', err);
      }

      if (isFirebaseConfigured) {
        try {
          if (auth) {
            // Firebase Google Auth Oturum Dinleyicisi
            unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
              if (firebaseUser?.email) {
                const email = firebaseUser.email.toLowerCase();
                const liveProfiles = await dbService.getProfiles();
                const matched = liveProfiles.find(p => p.email.toLowerCase() === email);
                if (matched) {
                  handleLogin(matched);
                } else {
                  showToast('Yetkisiz Erişim: Bu Google hesabı için atanmış bir rol bulunamadı.');
                  await dbService.logOut();
                }
              }
            });
          }

          // Gerçek Zamanlı Dinleyiciler (Firestore persistentLocalCache sayesinde ilk tick IndexedDB'den anında gelir)
          // Çift okuma (getDocs + onSnapshot) kaldırıldı; okuma tasarrufu sağlandı.
          unsubscribeProjects = dbService.subscribeToProjects((liveList, isRemote) => {
            if (liveList) {
              setProjects(liveList);
              if (isRemote) {
                triggerLiveUpdateNotice('Canlı Senkronizasyon: Proje listesi güncellendi.');
              }
            }
          });

          unsubscribeCurr = dbService.subscribeToCurriculums((liveCurrList, isRemote) => {
            if (liveCurrList) {
              setCurriculums(liveCurrList);
              if (isRemote) {
                triggerLiveUpdateNotice('Canlı Senkronizasyon: Müfredat kazanımları güncellendi.');
              }
            }
          });

          unsubscribeMetrics = dbService.subscribeToCampusMetrics((liveMetrics, isRemote) => {
            if (liveMetrics) {
              setMetrics(liveMetrics);
              if (isRemote) {
                triggerLiveUpdateNotice('Canlı Senkronizasyon: Sayaç ve tüketim verileri güncellendi.');
              }
            }
          });

          unsubscribePerms = dbService.subscribeToRolePermissions((livePerms) => {
            if (livePerms) {
              setRolePermissions(livePerms);
            }
          });

        } catch (e) {
          console.error('Veri dinleyici hatası:', e);
        }
      }
    };

    loadData();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeProjects) unsubscribeProjects();
      if (unsubscribeCurr) unsubscribeCurr();
      if (unsubscribeMetrics) unsubscribeMetrics();
      if (unsubscribePerms) unsubscribePerms();
      if (liveUpdateTimerRef.current) clearTimeout(liveUpdateTimerRef.current);
    };
  }, []);

  // Aktivite Günlükleri Dinleyicisi - SADECE Süper Admin Erkan Sağnak için çalışır (Öğretmenler için 0 okuma tasarrufu)
  useEffect(() => {
    if (!isSuperAdminEmail(authUser?.email)) {
      return;
    }

    let unsubLogs: (() => void) | undefined;
    const fetchAdminLogs = async () => {
      try {
        const liveLogs = await dbService.getActivityLogs();
        if (liveLogs && liveLogs.length > 0) {
          setActivityLogs(liveLogs);
        }
      } catch (err) {
        console.warn('Aktivite logları yüklenemedi:', err);
      }

      if (isFirebaseConfigured) {
        unsubLogs = dbService.subscribeToActivityLogs((liveLogs) => {
          if (liveLogs) {
            setActivityLogs(liveLogs);
          }
        });
      }
    };

    fetchAdminLogs();

    return () => {
      if (unsubLogs) unsubLogs();
    };
  }, [authUser?.email]);

  // Rol Yetkisi Değiştiğinde Güvenli Sekme Doğrulaması
  useEffect(() => {
    const isSimulating = (isSuperAdminEmail(authUser?.email) || authUser?.role === 'admin') && currentRole !== 'coordinator';
    const effectiveEmail = isSimulating ? currentUser.email : (authUser?.email || currentUser.email);
    const effectiveIsAdmin = isSuperAdminEmail(effectiveEmail) || currentUser.role === 'admin';

    // Güvenlik: Aktivite Günlüğü SADECE Süper Admin Erkan Sağnak'a açıktır
    if (currentTab === 'logs') {
      if (!isSuperAdminEmail(effectiveEmail)) {
        setCurrentTab('dashboard');
        return;
      }
    }

    const roleConfig = rolePermissions[currentRole];
    if (roleConfig && !roleConfig.allowedTabs.includes(currentTab as any)) {
      if (currentTab === 'users' && effectiveIsAdmin) {
        return;
      }
      if (currentTab === 'logs' && isSuperAdminEmail(effectiveEmail)) {
        return;
      }
      const fallbackTab = roleConfig.allowedTabs[0] || 'dashboard';
      setCurrentTab(fallbackTab);
    }
  }, [currentRole, currentTab, rolePermissions, authUser, currentUser]);

  // Onay Bekleyen Sayısı
  const pendingCount = projects.filter(p => {
    if (currentRole === 'dept_head') {
      return p.departmentId === currentUser.departmentId && p.status === 'submitted';
    }
    return p.status === 'dept_approved' || p.status === 'submitted';
  }).length;

  // 2. Yeni Proje Ekleme (Yerel Depolama ve Bulut Senkronu)
  const handleAddProject = async (newProjectData: Omit<ProjectEvent, 'id' | 'createdAt'>) => {
    const tempId = `proj-${Date.now()}`;
    const newProject: ProjectEvent = {
      ...newProjectData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    setProjects(prev => [newProject, ...prev]);
    showToast(`"${newProject.title}" oluşturuldu ve ${currentUser.title}'na onaya sevk edildi.`);
    trackActivity('create_project', 'projects', `Yeni proje önerildi: "${newProject.title}"`, { projectId: tempId, title: newProject.title, dept: newProject.departmentId });

    await dbService.createProject({
      ...newProjectData,
      id: tempId
    } as any);
  };

  // 2.1 Proje Düzenleme / Taslaktan Devam Etme
  const handleOpenEditProject = (project: ProjectEvent) => {
    if (currentUser.role === 'teacher') {
      const isOwner = project.advisorId === currentUser.id || 
        project.advisorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        project.collaboratingTeachers?.some(t => t.toLowerCase().includes(currentUser.name.toLowerCase()));
      if (!isOwner) {
        showToast('Yalnızca kendi danışmanı veya ortağı olduğunuz projeleri düzenleyebilirsiniz.');
        return;
      }
    } else if (currentUser.role === 'dept_head') {
      if (project.departmentId !== currentUser.departmentId) {
        showToast('Yalnızca kendi zümrenize ait projeleri düzenleyebilirsiniz.');
        return;
      }
    }
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleOpenNewProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleUpdateProject = async (
    projectId: string, 
    updates: Partial<ProjectEvent>
  ) => {
    const target = projects.find(p => p.id === projectId);
    if (target) {
      if (currentUser.role === 'teacher') {
        const isOwner = target.advisorId === currentUser.id || 
          target.advisorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          target.collaboratingTeachers?.some(t => t.toLowerCase().includes(currentUser.name.toLowerCase()));
        if (!isOwner) {
          showToast('Yetkisiz işlem: Sadece kendi danışmanı veya ortağı olduğunuz projeyi güncelleyebilirsiniz.');
          return;
        }
      } else if (currentUser.role === 'dept_head') {
        if (target.departmentId !== currentUser.departmentId) {
          showToast('Yetkisiz işlem: Sadece kendi zümrenizdeki projeleri güncelleyebilirsiniz.');
          return;
        }
      }
    }

    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    if (updates.status === 'submitted') {
      showToast('Proje başvurusu güncellendi ve bölüm başkanına onaya gönderildi.');
      trackActivity('submit_project', 'projects', `Proje onaya sevk edildi: "${target?.title || projectId}"`, { projectId });
    } else {
      showToast('Proje taslağı başarıyla güncellendi.');
      trackActivity('update_project', 'projects', `Proje taslağı güncellendi: "${target?.title || projectId}"`, { projectId });
    }
    await dbService.updateProject(projectId, updates);
  };

  // 2.2 Proje Silme
  const handleDeleteProject = async (projectId: string) => {
    const target = projects.find(p => p.id === projectId);
    const title = target?.title || 'Proje';

    const canDelete = 
      currentUser.role === 'coordinator' || 
      currentUser.role === 'admin' || 
      currentUser.role === 'principal' ||
      isSuperAdminEmail(currentUser.email) ||
      (target?.advisorId === currentUser.id && (target?.status === 'draft' || target?.status === 'submitted'));

    if (!canDelete) {
      showToast('Bu projeyi silme yetkiniz bulunmamaktadır.');
      return;
    }

    setProjects(prev => prev.filter(p => p.id !== projectId));
    showToast(`"${title}" başarıyla silindi.`);
    trackActivity('delete_project', 'projects', `Proje sistemden silindi: "${title}"`, { projectId, title });
    await dbService.deleteProject(projectId);
  };

  // 3. Durum Güncelleme (Onay / Revizyon)
  const handleUpdateProjectStatus = async (
    projectId: string, 
    newStatus: ProjectStatus, 
    feedback?: string
  ) => {
    const target = projects.find(p => p.id === projectId);
    if (target) {
      if (currentUser.role === 'teacher') {
        showToast('Öğretmen rolünün onaylama veya durum değiştirme yetkisi bulunmamaktadır.');
        return;
      }
      if (currentUser.role === 'dept_head' && target.departmentId !== currentUser.departmentId) {
        showToast('Yetkisiz işlem: Yalnızca kendi zümrenizdeki öğretmenlerin projelerini onaylayabilirsiniz.');
        return;
      }
    }

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const item: ProjectEvent = {
          ...p,
          status: newStatus,
          rejectionFeedback: feedback,
        };
        if (newStatus === 'coordinator_approved' || newStatus === 'dept_approved') {
          delete item.rejectionFeedback;
        }
        return item;
      }
      return p;
    }));

    await dbService.updateProjectStatus(projectId, newStatus, feedback);

    const statusLabels: Record<string, string> = {
      dept_approved: 'Bölüm Başkanı Onayladı',
      coordinator_approved: 'Koordinatör Onayladı (Resmi Yayında)',
      revision_needed: 'Revizyon İstendi',
      submitted: 'Onaya Gönderildi',
    };
    trackActivity('approve_project', 'projects', `Proje onay durumu değiştirildi: "${target?.title || projectId}" (${statusLabels[newStatus] || newStatus})`, { projectId, newStatus, feedback });

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
    const target = projects.find(p => p.id === projectId);
    if (target) {
      if (currentUser.role === 'teacher') {
        const isOwner = target.advisorId === currentUser.id || 
          target.advisorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          target.collaboratingTeachers?.some(t => t.toLowerCase().includes(currentUser.name.toLowerCase()));
        if (!isOwner) {
          showToast('Yetkisiz işlem: Yalnızca kendi projenizin veya ortağı olduğunuz projenin sonuç raporunu kaydedebilirsiniz.');
          return;
        }
      } else if (currentUser.role === 'dept_head') {
        if (target.departmentId !== currentUser.departmentId) {
          showToast('Yetkisiz işlem: Yalnızca kendi zümrenizdeki projelerin sonuç raporunu kaydedebilirsiniz.');
          return;
        }
      }
    }

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
    trackActivity('submit_impact_report', 'projects', `Etkinlik etki ve kapanış raporu tamamlandı: "${target?.title || projectId}"`, { projectId });
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
    trackActivity('create_curriculum', 'curriculum', `Müfredat kazanımı eklendi: ${newEntry.courseName} - ${newEntry.gradeLevel || 'Genel'} (${newEntry.learningOutcome || ''})`, { courseName: newEntry.courseName });
    showToast(`"${newEntry.courseName}" dersi sürdürülebilirlik matrisine eklendi.`);
  };

  // 5.1 Müfredat Güncelleme
  const handleUpdateCurriculum = async (
    curriculumId: string, 
    updates: Partial<CurriculumIntegration>
  ) => {
    const target = curriculums.find(c => c.id === curriculumId);
    if (target) {
      if (currentUser.role === 'teacher') {
        const isOwner = target.teacherName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          target.departmentId === currentUser.departmentId;
        if (!isOwner) {
          showToast('Yetkisiz işlem: Yalnızca kendi dersinizi veya zümrenizdeki kazanımı güncelleyebilirsiniz.');
          return;
        }
      } else if (currentUser.role === 'dept_head') {
        if (target.departmentId !== currentUser.departmentId) {
          showToast('Yetkisiz işlem: Yalnızca kendi zümrenizdeki kazanımları güncelleyebilirsiniz.');
          return;
        }
      }
    }

    setCurriculums(prev => prev.map(c => c.id === curriculumId ? { ...c, ...updates } : c));
    await dbService.updateCurriculum(curriculumId, updates);
    trackActivity('update_curriculum', 'curriculum', `Ders kazanım eşleştirmesi güncellendi: "${target?.courseName || curriculumId}"`, { curriculumId });
    showToast('Ders kazanım eşleştirmesi güncellendi.');
  };

  // 5.2 Müfredat Silme
  const handleDeleteCurriculum = async (curriculumId: string) => {
    const target = curriculums.find(c => c.id === curriculumId);
    if (target) {
      if (currentUser.role === 'teacher') {
        const isOwner = target.teacherName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          target.departmentId === currentUser.departmentId;
        if (!isOwner) {
          showToast('Yetkisiz işlem: Yalnızca kendi dersinizi veya zümrenizdeki kazanımı silebilirsiniz.');
          return;
        }
      } else if (currentUser.role === 'dept_head') {
        if (target.departmentId !== currentUser.departmentId) {
          showToast('Yetkisiz işlem: Yalnızca kendi zümrenizdeki kazanımları silebilirsiniz.');
          return;
        }
      }
    }

    setCurriculums(prev => prev.filter(c => c.id !== curriculumId));
    await dbService.deleteCurriculum(curriculumId);
    trackActivity('delete_curriculum', 'curriculum', `Ders kazanım eşleştirmesi silindi: "${target?.courseName || curriculumId}"`, { curriculumId });
    showToast('Ders kazanım eşleştirmesi silindi.');
  };

  // 6. Yeni Kampüs Metriği Ekleme
  const handleAddCampusMetric = async (newMetricData: Omit<CampusMetric, 'id'>) => {
    const newId = `met-${Date.now()}`;
    const newEntry: CampusMetric = {
      ...newMetricData,
      id: newId,
      notes: newMetricData.notes || '',
      createdByName: currentUser.name,
      createdByEmail: currentUser.email,
      createdAt: new Date().toISOString(),
    };
    setMetrics(prev => {
      const idx = prev.findIndex(m => m.period === newEntry.period);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = newEntry;
        return updated;
      }
      return [...prev, newEntry];
    });
    await dbService.createCampusMetric(newEntry, newId);
    trackActivity('create_metric', 'metrics', `Yeni kampüs göstergesi girildi: ${newEntry.period} Dönemi`, { period: newEntry.period });
    showToast(`${newEntry.period} dönemi tüketim verileri işlendi.`);
  };

  // 6b. Kampüs Metriği Güncelleme
  const handleUpdateCampusMetric = async (updatedMetric: CampusMetric) => {
    const metricWithAudit: CampusMetric = {
      ...updatedMetric,
      notes: updatedMetric.notes || '',
      updatedByName: currentUser.name,
      updatedByEmail: currentUser.email,
      updatedAt: new Date().toISOString(),
    };
    setMetrics(prev => prev.map(m => (m.id === metricWithAudit.id || m.period === metricWithAudit.period) ? metricWithAudit : m));
    await dbService.updateCampusMetric(metricWithAudit);
    trackActivity('update_metric', 'metrics', `Kampüs göstergesi güncellendi: ${metricWithAudit.period} Dönemi`, { period: metricWithAudit.period });
    showToast(`${metricWithAudit.period} dönemi tüketim verileri güncellendi.`);
  };

  // 6c. Kampüs Metriği Silme
  const handleDeleteCampusMetric = async (metricId: string) => {
    setMetrics(prev => prev.filter(m => m.id !== metricId));
    await dbService.deleteCampusMetric(metricId);
    trackActivity('delete_metric', 'metrics', `Kampüs göstergesi kaydı silindi: ${metricId}`, { metricId });
    showToast('Dönem tüketim verisi silindi.');
  };

  // 6c. Kampüs Metriklerini Temizleme
  const handleClearCampusMetrics = async () => {
    setMetrics([]);
    await dbService.clearCampusMetrics();
    trackActivity('clear_metrics', 'metrics', 'Tüm kampüs göstergeleri ve atık verileri sıfırlandı.');
    showToast('Tüm kampüs tüketim ve atık verileri temizlendi.');
  };

  const handleOpenReportModal = (project: ProjectEvent) => {
    if (currentUser.role === 'teacher') {
      const isOwner = project.advisorId === currentUser.id || 
        project.advisorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        project.collaboratingTeachers?.some(t => t.toLowerCase().includes(currentUser.name.toLowerCase()));
      if (!isOwner && project.status !== 'completed') {
        showToast('Yalnızca danışmanı veya ortağı olduğunuz projelerin sonuç raporunu girebilirsiniz.');
        return;
      }
    } else if (currentUser.role === 'dept_head') {
      if (project.departmentId !== currentUser.departmentId && project.status !== 'completed') {
        showToast('Yalnızca kendi zümrenizdeki projelerin sonuç raporunu girebilirsiniz.');
        return;
      }
    }
    setSelectedProjectForReport(project);
    setIsImpactModalOpen(true);
  };

  const handleSdgSelect = (sdgNum: number | null) => {
    setSelectedSdgFilter(sdgNum);
  };

  const handleDeptHeadSelect = (dept: Department) => {
    setActiveDeptHeadDeptId(dept.id);
    showToast(`Aktif Bölüm Başkanı: ${dept.headName} (${dept.name})`);
  };

  const handleTeacherSelect = (teacherId: string) => {
    setActiveTeacherId(teacherId);
    const found = profiles.find(p => p.id === teacherId);
    if (found) {
      showToast(`Aktif Danışman Öğretmen: ${found.name} (${found.title || ''})`);
    }
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

      {/* Kurumsal Giriş Modalı */}
      {!authUser && (
        <LoginModal 
          onLogin={handleLogin}
          profiles={profiles}
        />
      )}

      {/* Üst Bar */}
      <Header 
        currentUser={currentUser}
        authUser={authUser}
        profiles={profiles}
        activeTeacherId={activeTeacherId}
        onRoleChange={(role) => {
          setCurrentRole(role);
          if (role !== 'dept_head' && role !== 'teacher') {
            showToast(`Rol değiştirildi: ${MOCK_USERS[role]?.title || role}`);
          } else if (role === 'teacher') {
            const currentT = profiles.find(p => p.id === activeTeacherId) || profiles.find(p => p.role === 'teacher');
            if (currentT) showToast(`Danışman Öğretmen: ${currentT.name}`);
          } else if (role === 'dept_head') {
            const currentD = DEPARTMENTS.find(d => d.id === activeDeptHeadDeptId);
            if (currentD) showToast(`Bölüm Başkanı: ${currentD.headName} (${currentD.name})`);
          }
        }}
        onDepartmentHeadChange={handleDeptHeadSelect}
        onTeacherChange={handleTeacherSelect}
        pendingCount={pendingCount}
        onLogout={handleLogout}
        onUpdateAvatar={async (newAvatar, targetUserId) => {
          const targetId = targetUserId || currentUser.id || authUser?.id;
          if (targetId) {
            await handleUpdateProfile(targetId, { avatar: newAvatar });
            const targetP = profiles.find(p => p.id === targetId);
            const name = targetP?.name || currentUser.name || 'Profil';
            showToast(`${name} fotoğrafı başarıyla güncellendi.`);
          }
        }}
        activeAcademicYear={activeAcademicYear}
        academicYears={academicYears}
        onSaveAcademicYear={handleSaveAcademicYear}
        onSetActiveAcademicYear={handleSetActiveAcademicYear}
        hasLiveUpdate={hasLiveUpdate}
        isOnline={isOnline}
        isPwaInstallable={isPwaInstallable}
        onPromptInstall={() => pwaManager.promptInstall()}
      />

      {/* Ana Gövde */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto px-2 sm:px-4 lg:px-6">
        {/* Yan Menü */}
        <Sidebar 
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          pendingCount={pendingCount}
          userRole={currentRole}
          currentUserEmail={currentUser.email}
          currentUser={currentUser}
          rolePermissions={rolePermissions}
        />

        {/* Ana İçerik Alanı */}
        <main className="flex-1 p-4 lg:p-6 space-y-6 min-w-0 overflow-x-hidden">
          {/* SEKME 1: BİREYSEL VEYA GENEL GÖSTERGE PANELİ */}
          {currentTab === 'dashboard' && (
            currentUser.role === 'teacher' || currentUser.role === 'dept_head' ? (
              <PersonalDashboard 
                currentUser={currentUser}
                projects={projects}
                curriculums={curriculums}
                metrics={metrics}
                profiles={profiles}
                onOpenNewProject={handleOpenNewProject}
                onEditProject={handleOpenEditProject}
                onOpenReportModal={handleOpenReportModal}
                onDeleteProject={handleDeleteProject}
                onUpdateProjectStatus={handleUpdateProjectStatus}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                activeAcademicYear={activeAcademicYear}
              />
            ) : (
              <div className="space-y-6">
              {/* Karşılama Başlığı */}
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-900/40">
                <div className="relative z-10 max-w-2xl space-y-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>FMV Erenköy Işık Lisesi ve Fen Lisesi • Sürdürülebilirlik Vizyonu</span>
                    </div>
                    {activeAcademicYear && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold backdrop-blur-xs">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                        <span>{activeAcademicYear.name} ({activeAcademicYear.startDate.split('-').reverse().join('.')} – {activeAcademicYear.endDate.split('-').reverse().join('.')})</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Hoş Geldiniz, {currentUser.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    Feyziye Mektepleri Vakfı'nın 1885'ten bu yana süregelen ışığını geleceğe taşıyor; 
                    tüm akademik zümrelerimiz ile çevre bilincini, sıfır atık hedeflerini ve BM Küresel Amaçlarını 
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
              </div>

              {/* Temel Metrikler */}
              <MetricCards 
                projects={projects}
                curriculums={curriculums}
                metrics={metrics}
                activeAcademicYear={activeAcademicYear}
              />

              {/* 17 BM SKA Isı Haritası */}
              <SdgGrid 
                projects={projects}
                curriculums={curriculums}
                selectedSdg={selectedSdgFilter}
                onSelectSdg={handleSdgSelect}
              />

              {/* Zümre Liderlik Tablosu */}
              <DeptLeaderboard 
                projects={projects}
                curriculums={curriculums}
                onSelectDepartment={() => setCurrentTab('projects')}
              />
            </div>
            )
          )}

          {/* SEKME 2: OKUL TAKVİMİ (RESMİ ONAYLI ETKİNLİKLER) */}
          {currentTab === 'calendar' && (
            <SchoolCalendarView 
              projects={projects}
              currentUser={currentUser}
              onOpenReportModal={handleOpenReportModal}
              activeAcademicYear={activeAcademicYear}
            />
          )}

          {/* SEKME 3: PROJE & ETKİNLİK HAVUZU */}
          {currentTab === 'projects' && (
            <ProjectList 
              projects={projects}
              currentUser={currentUser}
              onOpenNewModal={handleOpenNewProject}
              onEditProject={handleOpenEditProject}
              onOpenReportModal={handleOpenReportModal}
              onDeleteProject={handleDeleteProject}
              selectedSdgFilter={selectedSdgFilter}
              onClearSdgFilter={() => setSelectedSdgFilter(null)}
              onNavigateTab={setCurrentTab}
              activeAcademicYear={activeAcademicYear}
              rolePermissions={rolePermissions}
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
              onUpdateCurriculum={handleUpdateCurriculum}
              onDeleteCurriculum={handleDeleteCurriculum}
              currentUser={currentUser}
              activeAcademicYear={activeAcademicYear}
              academicYears={academicYears}
              rolePermissions={rolePermissions}
            />
          )}

          {/* SEKME 5: YEŞİL KAMPÜS METRİKLERİ */}
          {currentTab === 'campus' && (
            <CampusMetricsView 
              metrics={metrics}
              onAddMetric={handleAddCampusMetric}
              onUpdateMetric={handleUpdateCampusMetric}
              onDeleteMetric={handleDeleteCampusMetric}
              onClearMetrics={handleClearCampusMetrics}
              currentUser={currentUser}
              activeAcademicYear={activeAcademicYear}
              rolePermissions={rolePermissions}
            />
          )}

          {/* SEKME 6: SÜRDÜRÜLEBİLİRLİK & AKREDİTASYON RAPORU */}
          {currentTab === 'reports' && (
            <AnnualReportView 
              projects={projects}
              curriculums={curriculums}
              metrics={metrics}
              activeAcademicYear={activeAcademicYear}
            />
          )}

          {/* SEKME 7: KULLANICI & ROL YÖNETİMİ */}
          {currentTab === 'users' && (isSuperAdminEmail(currentUser.email) || currentUser.role === 'admin' || rolePermissions[currentRole]?.allowedTabs.includes('users')) && (
            <UserManagementView 
              profiles={profiles}
              onAddProfile={handleAddProfile}
              onUpdateProfile={handleUpdateProfile}
              onDeleteProfile={handleDeleteProfile}
              currentUser={currentUser}
              rolePermissions={rolePermissions}
              onSaveRolePermissions={handleSaveRolePermissions}
              onResetRolePermissions={handleResetRolePermissions}
            />
          )}

          {/* SEKME 8: AKTİVİTE & DENETİM GÜNLÜĞÜ (SADECE SÜPER ADMİN - ERKAN SAĞNAK) */}
          {currentTab === 'logs' && isSuperAdminEmail(currentUser.email) && (
            <ActivityLogsView 
              logs={activityLogs}
              currentUser={currentUser}
              onClearLogs={async () => {
                await dbService.clearActivityLogs();
                setActivityLogs([]);
                showToast('Aktivite ve denetim günlüğü temizlendi.');
                trackActivity('clear_logs', 'system', 'Tüm denetim logları süper admin tarafından temizlendi.');
              }}
            />
          )}
        </main>
      </div>

      {/* Proje Başvuru Modalı */}
      <ProjectFormModal 
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleAddProject}
        onUpdate={handleUpdateProject}
        initialProject={editingProject}
        currentUser={currentUser}
        activeAcademicYear={activeAcademicYear}
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
