import { db, auth, googleProvider, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';
import { 
  ProjectEvent, 
  CurriculumIntegration, 
  CampusMetric, 
  ProjectStatus, 
  ImpactReport, 
  UserProfile,
  AcademicYear,
  SystemRolePermissions,
  ActivityLog
} from '../types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_CURRICULUM, 
  INITIAL_CAMPUS_METRICS, 
  INITIAL_PROFILES 
} from '../data/initialData';
import { DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions';

export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: '2025-2026',
    name: '2025-2026 Eğitim-Öğretim Yılı',
    startDate: '2025-09-08',
    endDate: '2026-06-19',
    isActive: false,
    totalStudents: 820,
    description: 'Geçmiş Eğitim-Öğretim Yılı'
  },
  {
    id: '2026-2027',
    name: '2026-2027 Eğitim-Öğretim Yılı',
    startDate: '2026-09-08',
    endDate: '2027-06-18',
    isActive: true,
    totalStudents: 850,
    description: 'Aktif Eğitim-Öğretim Yılı'
  },
  {
    id: '2027-2028',
    name: '2027-2028 Eğitim-Öğretim Yılı',
    startDate: '2027-09-06',
    endDate: '2028-06-16',
    isActive: false,
    totalStudents: 880,
    description: 'Gelecek Eğitim-Öğretim Yılı'
  }
];

const PROFILES_STORAGE_KEY = 'ecocampus_profiles_v1';
const PROJECTS_STORAGE_KEY = 'ecocampus_projects_v2';
const CURRICULUM_STORAGE_KEY = 'ecocampus_curriculums_v2';
const METRICS_STORAGE_KEY = 'ecocampus_metrics_v2';
const ACADEMIC_YEARS_STORAGE_KEY = 'ecocampus_academic_years_v1';
const ROLE_PERMISSIONS_STORAGE_KEY = 'ecocampus_role_permissions_v1';
const ACTIVITY_LOGS_STORAGE_KEY = 'ecocampus_activity_logs_v1';

function getLocalActivityLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local activity logs', e);
  }
  return [];
}

function saveLocalActivityLogs(logs: ActivityLog[]): void {
  try {
    // Son 1000 logu sakla
    const trimmed = logs.slice(0, 1000);
    localStorage.setItem(ACTIVITY_LOGS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving local activity logs', e);
  }
}

function getLocalRolePermissions(): SystemRolePermissions {
  try {
    const raw = localStorage.getItem(ROLE_PERMISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.coordinator && parsed.teacher) {
        return {
          ...DEFAULT_ROLE_PERMISSIONS,
          ...parsed,
          principal: parsed.principal || DEFAULT_ROLE_PERMISSIONS.principal,
        };
      }
    }
  } catch (e) {
    console.error('Error reading local role permissions', e);
  }
  saveLocalRolePermissions(DEFAULT_ROLE_PERMISSIONS);
  return DEFAULT_ROLE_PERMISSIONS;
}

function saveLocalRolePermissions(perms: SystemRolePermissions): void {
  try {
    localStorage.setItem(ROLE_PERMISSIONS_STORAGE_KEY, JSON.stringify(perms));
  } catch (e) {
    console.error('Error saving local role permissions', e);
  }
}

function getLocalAcademicYears(): AcademicYear[] {
  try {
    const raw = localStorage.getItem(ACADEMIC_YEARS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading local academic years', e);
  }
  saveLocalAcademicYears(INITIAL_ACADEMIC_YEARS);
  return INITIAL_ACADEMIC_YEARS;
}

function saveLocalAcademicYears(years: AcademicYear[]): void {
  try {
    localStorage.setItem(ACADEMIC_YEARS_STORAGE_KEY, JSON.stringify(years));
  } catch (e) {
    console.error('Error saving local academic years', e);
  }
}

function getLocalProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: UserProfile) => {
          if (p.role === 'coordinator' || p.role === 'admin' || p.role === 'principal') {
            return { ...p, departmentId: '' };
          }
          return p;
        });
      }
    }
  } catch (e) {
    console.error('Error reading local profiles', e);
  }
  saveLocalProfiles(INITIAL_PROFILES);
  return INITIAL_PROFILES;
}

function saveLocalProfiles(profiles: UserProfile[]): void {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Error saving local profiles', e);
  }
}

function getLocalProjects(): ProjectEvent[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local projects', e);
  }
  saveLocalProjects(INITIAL_PROJECTS);
  return INITIAL_PROJECTS;
}

function saveLocalProjects(projects: ProjectEvent[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving local projects', e);
  }
}

function getLocalCurriculums(): CurriculumIntegration[] {
  try {
    const raw = localStorage.getItem(CURRICULUM_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading local curriculums', e);
  }
  saveLocalCurriculums(INITIAL_CURRICULUM);
  return INITIAL_CURRICULUM;
}

function saveLocalCurriculums(curriculums: CurriculumIntegration[]): void {
  try {
    localStorage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify(curriculums));
  } catch (e) {
    console.error('Error saving local curriculums', e);
  }
}

function getLocalCampusMetrics(): CampusMetric[] {
  try {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local campus metrics', e);
  }
  saveLocalCampusMetrics([]);
  return [];
}

function saveLocalCampusMetrics(metrics: CampusMetric[]): void {
  try {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
  } catch (e) {
    console.error('Error saving local campus metrics', e);
  }
}

/**
 * Firestore'a yazılacak nesnelerdeki 'undefined' alanları özyinelemeli olarak temizler.
 * Firebase Firestore'un 'Unsupported field value: undefined' hatasını engeller.
 */
export function sanitizeFirestoreData<T>(data: T): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map(item => (typeof item === 'object' && item !== null ? sanitizeFirestoreData(item) : item));
  }
  if (typeof data === 'object') {
    const clean: any = {};
    for (const [k, v] of Object.entries(data as Record<string, any>)) {
      if (v !== undefined) {
        clean[k] = typeof v === 'object' && v !== null ? sanitizeFirestoreData(v) : v;
      }
    }
    return clean;
  }
  return data;
}

export const dbService = {
  // Yerel Depolama Senkron Erişimcileri
  getLocalProjects,
  saveLocalProjects,
  getLocalCurriculums,
  saveLocalCurriculums,
  getLocalCampusMetrics,
  saveLocalCampusMetrics,
  getLocalProfiles,
  saveLocalProfiles,
  getLocalActivityLogs,
  saveLocalActivityLogs,

  // 1. PROJELERİ GETİR
  async getProjects(): Promise<{ data: ProjectEvent[]; fromLive: boolean }> {
    const locals = getLocalProjects();

    if (!isFirebaseConfigured || !db) {
      return { data: locals, fromLive: false };
    }

    try {
      // orderBy kaldırıldı: createdAt alanı eksik veya farklı formatta olan projeler de güvenle okunur
      const snapshot = await getDocs(collection(db, 'projects_events'));

      const remoteProjects: ProjectEvent[] = [];
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as ProjectEvent;
        // Yalnızca geçerli bir başlığı veya bölümü olan gerçek projeleri al (başlıksız boş dokümanları ele)
        if (data && (data.title || data.departmentId)) {
          remoteProjects.push({
            ...data,
            id: docSnap.id,
          });
        }
      });

      // Yerelde olup henüz Firestore'a yansımamış geçerli projeleri koru ve otomatik buluta eşitle
      const remoteIds = new Set(remoteProjects.map(p => p.id));
      for (const localP of locals) {
        if (localP.title && !remoteIds.has(localP.id)) {
          remoteProjects.unshift(localP);
          const clean = sanitizeFirestoreData(localP);
          setDoc(doc(db, 'projects_events', localP.id), clean).catch(err => {
            console.warn('[dbService] Yerel proje buluta aktarılamadı:', err);
          });
        }
      }

      // Tarihe göre sırala (en yeni en üstte)
      remoteProjects.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      saveLocalProjects(remoteProjects);
      return { data: remoteProjects, fromLive: true };
    } catch (err) {
      console.warn('Firebase getProjects fallback to local data:', err);
      return { data: locals, fromLive: false };
    }
  },

  // 2. YENİ PROJE KAYDET
  async createProject(project: Omit<ProjectEvent, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<string> {
    const projectId = project.id || `proj-${Date.now()}`;
    const createdAt = project.createdAt || new Date().toISOString();
    const newProject: ProjectEvent = {
      ...project,
      id: projectId,
      createdAt,
    };

    // 1. Derhal yerel belleğe ve localStorage'a kaydet (Asla kaybolmaz)
    const locals = getLocalProjects();
    const updated = [newProject, ...locals.filter(p => p.id !== projectId)];
    saveLocalProjects(updated);

    // 2. Firebase Firestore ile arka planda eşitle (undefined alanlar sanitize edilir)
    if (isFirebaseConfigured && db) {
      try {
        const cleanProject = sanitizeFirestoreData(newProject);
        await setDoc(doc(db, 'projects_events', projectId), cleanProject);
        return projectId;
      } catch (e) {
        console.error('Firebase createProject error:', e);
      }
    }

    return projectId;
  },

  // 3. PROJE BİLGİLERİNİ GÜNCELLE (TASLAK DÜZENLEME / REVİZYON)
  async updateProject(
    projectId: string, 
    updates: Partial<ProjectEvent>
  ): Promise<boolean> {
    // 1. Derhal yerel belleği ve localStorage'ı güncelle
    const locals = getLocalProjects();
    const updated = locals.map(p => p.id === projectId ? { ...p, ...updates } : p);
    saveLocalProjects(updated);

    // 2. Firebase Firestore ile güvenli (merge: true) eşitle
    if (isFirebaseConfigured && db) {
      try {
        const cleanUpdates = sanitizeFirestoreData(updates);
        const docRef = doc(db, 'projects_events', projectId);
        await setDoc(docRef, cleanUpdates, { merge: true });
        return true;
      } catch (e) {
        console.error('Firebase updateProject error:', e);
      }
    }
    return true;
  },

  // 4. PROJE DURUMU GÜNCELLE (ONAY / REVİZYON / TAKVİME ALMA)
  async updateProjectStatus(
    projectId: string, 
    status: ProjectStatus, 
    feedback?: string
  ): Promise<boolean> {
    // 1. Derhal yerel belleği ve localStorage'ı güncelle
    const locals = getLocalProjects();
    const updated = locals.map(p => {
      if (p.id === projectId) {
        const item: ProjectEvent = { ...p, status };
        if (feedback !== undefined) {
          item.rejectionFeedback = feedback;
        } else if (status === 'coordinator_approved' || status === 'dept_approved') {
          delete item.rejectionFeedback;
        }
        return item;
      }
      return p;
    });
    saveLocalProjects(updated);

    // 2. Firebase Firestore ile eşitle (merge: true ile doküman yoksa da oluşturur)
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'projects_events', projectId);
        const updates: any = { status };
        if (feedback !== undefined) {
          updates.rejectionFeedback = feedback;
        }
        const cleanUpdates = sanitizeFirestoreData(updates);
        await setDoc(docRef, cleanUpdates, { merge: true });
        return true;
      } catch (e) {
        console.error('Firebase updateProjectStatus error:', e);
      }
    }
    return true;
  },

  // 4. ETKİ DEĞERLENDİRME RAPORU KAYDET
  async saveImpactReport(projectId: string, report: Omit<ImpactReport, 'id' | 'projectId' | 'completedAt'>): Promise<boolean> {
    const fullReport: ImpactReport = {
      ...report,
      id: `rep-${Date.now()}`,
      projectId,
      completedAt: new Date().toISOString(),
    };

    // 1. Derhal yerel belleği güncelle
    const locals = getLocalProjects();
    const updated = locals.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          status: 'completed' as ProjectStatus,
          impactReport: fullReport,
        };
      }
      return p;
    });
    saveLocalProjects(updated);

    // 2. Firebase Firestore ile eşitle
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'projects_events', projectId);
        const cleanReport = sanitizeFirestoreData(fullReport);
        await setDoc(docRef, {
          status: 'completed',
          impactReport: cleanReport,
        }, { merge: true });
        return true;
      } catch (e) {
        console.error('Firebase saveImpactReport error:', e);
      }
    }
    return true;
  },

  // 4.1 PROJE SİL
  async deleteProject(projectId: string): Promise<boolean> {
    const locals = getLocalProjects();
    const filtered = locals.filter(p => p.id !== projectId);
    saveLocalProjects(filtered);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'projects_events', projectId));
      } catch (e) {
        console.error('Firebase deleteProject error:', e);
      }
    }
    return true;
  },

  // 5. MÜFREDAT ENTEGRASYONLARI
  async getCurriculums(): Promise<CurriculumIntegration[]> {
    const locals = getLocalCurriculums();
    if (!isFirebaseConfigured || !db) {
      return locals;
    }

    try {
      const snapshot = await getDocs(collection(db, 'curriculum_integrations'));
      if (snapshot.empty) {
        saveLocalCurriculums([]);
        return [];
      }

      const remoteCurr: CurriculumIntegration[] = snapshot.docs.map(docSnap => ({
        ...(docSnap.data() as CurriculumIntegration),
        id: docSnap.id,
      }));
      saveLocalCurriculums(remoteCurr);
      return remoteCurr;
    } catch (err) {
      console.warn('Firebase getCurriculums fallback to local:', err);
      return locals;
    }
  },

  async createCurriculum(curriculum: Omit<CurriculumIntegration, 'id'>): Promise<string> {
    const tempId = `curr-${Date.now()}`;
    const newCurr: CurriculumIntegration = {
      ...curriculum,
      id: tempId,
    };
    const locals = getLocalCurriculums();
    saveLocalCurriculums([newCurr, ...locals]);

    if (isFirebaseConfigured && db) {
      try {
        const cleanCurr = sanitizeFirestoreData(newCurr);
        await setDoc(doc(db, 'curriculum_integrations', tempId), cleanCurr);
      } catch (e) {
        console.error('Firebase createCurriculum error:', e);
      }
    }
    return tempId;
  },

  async updateCurriculum(curriculumId: string, updates: Partial<CurriculumIntegration>): Promise<boolean> {
    const locals = getLocalCurriculums();
    const updated = locals.map(c => {
      if (c.id === curriculumId) {
        return { ...c, ...updates };
      }
      return c;
    });
    saveLocalCurriculums(updated);

    if (isFirebaseConfigured && db) {
      try {
        const cleanUpdates = sanitizeFirestoreData(updates);
        const docRef = doc(db, 'curriculum_integrations', curriculumId);
        await setDoc(docRef, cleanUpdates, { merge: true });
        return true;
      } catch (e) {
        console.error('Firebase updateCurriculum error:', e);
      }
    }
    return true;
  },

  async deleteCurriculum(curriculumId: string): Promise<boolean> {
    const locals = getLocalCurriculums();
    const filtered = locals.filter(c => c.id !== curriculumId);
    saveLocalCurriculums(filtered);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'curriculum_integrations', curriculumId));
        return true;
      } catch (e) {
        console.error('Firebase deleteCurriculum error:', e);
      }
    }
    return true;
  },

  // 6. KAMPÜS METRİKLERİ
  async getCampusMetrics(): Promise<CampusMetric[]> {
    const locals = getLocalCampusMetrics();
    if (!isFirebaseConfigured || !db) {
      return locals;
    }

    try {
      const snapshot = await getDocs(collection(db, 'campus_metrics'));
      if (snapshot.empty) {
        saveLocalCampusMetrics([]);
        return [];
      }

      const remoteMetrics: CampusMetric[] = snapshot.docs.map(docSnap => ({
        ...(docSnap.data() as CampusMetric),
        id: docSnap.id,
      }));

      saveLocalCampusMetrics(remoteMetrics);
      return remoteMetrics;
    } catch (err) {
      console.warn('Firebase getCampusMetrics fallback to local:', err);
      return locals;
    }
  },

  async createCampusMetric(metric: Omit<CampusMetric, 'id'>, customId?: string): Promise<string> {
    const tempId = customId || (metric.period ? `met-${metric.period}` : `met-${Date.now()}`);
    const newMet: CampusMetric = {
      ...metric,
      id: tempId,
      notes: metric.notes || '',
    };
    const locals = getLocalCampusMetrics();
    const existIdx = locals.findIndex(m => m.id === tempId || m.period === newMet.period);
    if (existIdx !== -1) {
      locals[existIdx] = newMet;
      saveLocalCampusMetrics(locals);
    } else {
      saveLocalCampusMetrics([...locals, newMet]);
    }

    if (isFirebaseConfigured && db) {
      try {
        const firestoreData: any = {};
        for (const [k, v] of Object.entries(newMet)) {
          if (v !== undefined) firestoreData[k] = v;
        }
        await setDoc(doc(db, 'campus_metrics', tempId), firestoreData);
      } catch (e) {
        console.error('Firebase createCampusMetric error:', e);
      }
    }
    return tempId;
  },

  async updateCampusMetric(metric: CampusMetric): Promise<boolean> {
    const cleanMetric: CampusMetric = {
      ...metric,
      notes: metric.notes || '',
    };
    const locals = getLocalCampusMetrics();
    const index = locals.findIndex(m => m.id === metric.id || m.period === metric.period);
    if (index !== -1) {
      locals[index] = cleanMetric;
    } else {
      locals.push(cleanMetric);
    }
    saveLocalCampusMetrics(locals);

    if (isFirebaseConfigured && db) {
      try {
        const firestoreData: any = {};
        for (const [k, v] of Object.entries(cleanMetric)) {
          if (v !== undefined) firestoreData[k] = v;
        }
        await setDoc(doc(db, 'campus_metrics', metric.id), firestoreData, { merge: true });
      } catch (e) {
        console.error('Firebase updateCampusMetric error:', e);
      }
    }
    return true;
  },

  async deleteCampusMetric(metricId: string): Promise<boolean> {
    const locals = getLocalCampusMetrics();
    const filtered = locals.filter(m => m.id !== metricId);
    saveLocalCampusMetrics(filtered);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'campus_metrics', metricId));
      } catch (e) {
        console.error('Firebase deleteCampusMetric error:', e);
      }
    }
    return true;
  },

  async clearCampusMetrics(): Promise<boolean> {
    saveLocalCampusMetrics([]);
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'campus_metrics'));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      } catch (e) {
        console.error('Firebase clearCampusMetrics error:', e);
      }
    }
    return true;
  },

  // 7. KULLANICI & PROFİL YÖNETİMİ (CLOUDFIRESTORE)
  async getProfiles(): Promise<UserProfile[]> {
    if (!isFirebaseConfigured || !db) {
      return getLocalProfiles();
    }

    try {
      const snapshot = await getDocs(collection(db, 'profiles'));
      if (snapshot.empty) {
        // İlk açılışta yerel profilleri Firestore'a tohumlayalım
        const locals = getLocalProfiles();
        for (const p of locals) {
          const clean: any = {};
          for (const [k, v] of Object.entries(p)) {
            if (v !== undefined) clean[k] = v;
          }
          await setDoc(doc(db, 'profiles', p.id), clean, { merge: true });
        }
        return locals;
      }

      const profiles: UserProfile[] = snapshot.docs.map(docSnap => {
        const p = docSnap.data() as UserProfile;
        const isSchoolWide = p.role === 'coordinator' || p.role === 'admin' || p.role === 'principal';
        return {
          ...p,
          id: docSnap.id,
          departmentId: isSchoolWide ? '' : (p.departmentId || ''),
        };
      });

      // Yerelde olup henüz Firestore'a yansımamış kullanıcıları koru ve Firestore'a senkronize et
      const locals = getLocalProfiles();
      const profileMap = new Map<string, UserProfile>();
      profiles.forEach(p => profileMap.set(p.id, p));

      for (const localUser of locals) {
        if (!profileMap.has(localUser.id)) {
          profileMap.set(localUser.id, localUser);
          const cleanLocal: any = {};
          for (const [k, v] of Object.entries(localUser)) {
            if (v !== undefined) cleanLocal[k] = v;
          }
          setDoc(doc(db, 'profiles', localUser.id), cleanLocal, { merge: true }).catch(() => {});
        }
      }

      const merged = Array.from(profileMap.values());
      saveLocalProfiles(merged);
      return merged;
    } catch (e) {
      console.warn('Firebase getProfiles hatası, yerel listeye dönülüyor:', e);
      return getLocalProfiles();
    }
  },

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    const cleanEmail = email.trim().toLowerCase();
    const all = await this.getProfiles();
    return all.find(p => p.email.toLowerCase() === cleanEmail) || null;
  },

  async createProfile(profileData: Omit<UserProfile, 'id'>): Promise<UserProfile> {
    const tempId = `user-${Date.now()}`;
    const newProfile: UserProfile = {
      ...profileData,
      id: tempId,
      email: profileData.email.trim().toLowerCase(),
      avatar: profileData.avatar || '',
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    const locals = getLocalProfiles();
    saveLocalProfiles([newProfile, ...locals]);

    if (isFirebaseConfigured && db) {
      try {
        const firestoreData: any = {};
        for (const [k, v] of Object.entries(newProfile)) {
          if (v !== undefined) firestoreData[k] = v;
        }
        await setDoc(doc(db, 'profiles', tempId), firestoreData, { merge: true });
      } catch (e) {
        console.error('Firebase createProfile error:', e);
      }
    }

    return newProfile;
  },

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<boolean> {
    const locals = getLocalProfiles();
    const existing = locals.find(p => p.id === id);
    const updatedLocals = locals.map(p => p.id === id ? { ...p, ...updates } : p);
    saveLocalProfiles(updatedLocals);

    if (isFirebaseConfigured && db) {
      try {
        const firestoreData: any = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) firestoreData[k] = v;
        }

        if (existing) {
          const merged: any = {};
          for (const [k, v] of Object.entries({ ...existing, ...updates })) {
            if (v !== undefined) merged[k] = v;
          }
          await setDoc(doc(db, 'profiles', id), merged, { merge: true });
        } else {
          await setDoc(doc(db, 'profiles', id), firestoreData, { merge: true });
        }
      } catch (e) {
        console.error('Firebase updateProfile error:', e);
        return false;
      }
    }
    return true;
  },

  async deleteProfile(id: string): Promise<boolean> {
    const locals = getLocalProfiles();
    const filtered = locals.filter(p => p.id !== id);
    saveLocalProfiles(filtered);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'profiles', id));
      } catch (e) {
        console.error('Firebase deleteProfile error:', e);
        return false;
      }
    }
    return true;
  },

  // 8. GOOGLE OAUTH KİMLİK DOĞRULAMA (FIREBASE AUTH POPUP)
  async signInWithGoogle(): Promise<{ user?: any; error?: any }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { user: result.user };
    } catch (error: any) {
      console.error('Firebase signInWithGoogle hatası:', error);
      return { error };
    }
  },

  async logOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase signOut error:', e);
    }
  },

  // 9. VERİTABANI İLK VERİLERİ YÜKLEME (SEED)
  async seedInitialData(): Promise<{ success: boolean; message: string }> {
    // 1. Yerel depolamayı temiz ve tam başlangıç verisiyle güncelle
    saveLocalProjects(INITIAL_PROJECTS);
    saveLocalCurriculums(INITIAL_CURRICULUM);
    saveLocalCampusMetrics(INITIAL_CAMPUS_METRICS);
    saveLocalProfiles(INITIAL_PROFILES);

    if (!isFirebaseConfigured || !db) {
      return { success: true, message: 'Örnek veriler yerel güvenli belleğe başarıyla yüklendi.' };
    }

    try {
      // 1. Projeleri Ekle
      for (const p of INITIAL_PROJECTS) {
        await setDoc(doc(db, 'projects_events', p.id), p);
      }

      // 2. Müfredatı Ekle
      for (const c of INITIAL_CURRICULUM) {
        await setDoc(doc(db, 'curriculum_integrations', c.id), c);
      }

      // 3. Metrikleri Ekle
      for (const m of INITIAL_CAMPUS_METRICS) {
        await setDoc(doc(db, 'campus_metrics', m.id), m);
      }

      // 4. Profilleri Ekle
      for (const prof of INITIAL_PROFILES) {
        await setDoc(doc(db, 'profiles', prof.id), prof);
      }

      return { success: true, message: 'Örnek veriler Cloud Firestore veritabanına ve yerel depolamaya başarıyla aktarıldı!' };
    } catch (e: any) {
      console.error('Firebase seed exception:', e);
      return { success: true, message: `Yerel depolama güncellendi (Bulut senkronizasyonu uyarısı: ${e.message || 'Bilinmeyen hata'})` };
    }
  },

  // 10. DENEME VERİLERİNİ TEMİZLE (YALNIZCA KULLANICI PROFİLLERİ KORUNUR)
  async clearTestData(): Promise<{ success: boolean; message: string }> {
    saveLocalProjects([]);
    saveLocalCurriculums([]);
    saveLocalCampusMetrics([]);

    if (!isFirebaseConfigured || !db) {
      return { success: true, message: 'Yerel deneme verileri temizlendi.' };
    }

    try {
      // 1. Projeleri Sil
      const projSnap = await getDocs(collection(db, 'projects_events'));
      for (const d of projSnap.docs) {
        await deleteDoc(d.ref);
      }

      // 2. Müfredat Entegrasyonlarını Sil
      const currSnap = await getDocs(collection(db, 'curriculum_integrations'));
      for (const d of currSnap.docs) {
        await deleteDoc(d.ref);
      }

      // 3. Kampüs Metriklerini Sil
      const metSnap = await getDocs(collection(db, 'campus_metrics'));
      for (const d of metSnap.docs) {
        await deleteDoc(d.ref);
      }

      return { 
        success: true, 
        message: 'Deneme projeleri, müfredat planları ve kampüs metrikleri veritabanından ve yerel bellekten temizlendi.' 
      };
    } catch (e: any) {
      console.error('Firebase clearTestData error:', e);
      return { 
        success: true, 
        message: `Yerel veriler temizlendi, bulut temizliği uyarısı: ${e.message || 'Bilinmeyen hata'}` 
      };
    }
  },

  // 11. EĞİTİM-ÖĞRETİM YILLARI (ACADEMIC YEARS) YÖNETİMİ
  async getAcademicYears(): Promise<AcademicYear[]> {
    if (!isFirebaseConfigured || !db) {
      return getLocalAcademicYears();
    }
    try {
      const snapshot = await getDocs(collection(db, 'academic_years'));
      if (snapshot.empty) {
        const local = getLocalAcademicYears();
        for (const y of local) {
          await setDoc(doc(db, 'academic_years', y.id), y);
        }
        return local;
      }
      const years = snapshot.docs.map(doc => doc.data() as AcademicYear);
      // Aktif yıla göre veya başlangıç tarihine göre sırala
      years.sort((a, b) => a.startDate.localeCompare(b.startDate));
      saveLocalAcademicYears(years);
      return years;
    } catch (e) {
      console.warn('Firebase getAcademicYears failed, using local storage:', e);
      return getLocalAcademicYears();
    }
  },

  async getActiveAcademicYear(): Promise<AcademicYear> {
    const years = await this.getAcademicYears();
    const active = years.find(y => y.isActive) || years.find(y => y.id === '2026-2027') || years[0] || INITIAL_ACADEMIC_YEARS[1];
    return active;
  },

  async saveAcademicYear(updatedYear: AcademicYear): Promise<AcademicYear[]> {
    const currentYears = getLocalAcademicYears();
    const idx = currentYears.findIndex(y => y.id === updatedYear.id);
    let newYears: AcademicYear[];
    if (idx >= 0) {
      newYears = currentYears.map(y => y.id === updatedYear.id ? updatedYear : (updatedYear.isActive ? { ...y, isActive: false } : y));
    } else {
      newYears = [...currentYears, updatedYear];
      if (updatedYear.isActive) {
        newYears = newYears.map(y => y.id === updatedYear.id ? y : { ...y, isActive: false });
      }
    }
    newYears.sort((a, b) => a.startDate.localeCompare(b.startDate));
    saveLocalAcademicYears(newYears);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'academic_years', updatedYear.id), updatedYear);
        if (updatedYear.isActive) {
          for (const y of newYears.filter(y => y.id !== updatedYear.id)) {
            await setDoc(doc(db, 'academic_years', y.id), y);
          }
        }
      } catch (e) {
        console.error('Firebase saveAcademicYear error:', e);
      }
    }
    return newYears;
  },

  async setActiveAcademicYear(yearId: string): Promise<AcademicYear[]> {
    const currentYears = getLocalAcademicYears();
    const updated = currentYears.map(y => ({
      ...y,
      isActive: y.id === yearId
    }));
    saveLocalAcademicYears(updated);

    if (isFirebaseConfigured && db) {
      try {
        for (const y of updated) {
          await setDoc(doc(db, 'academic_years', y.id), y);
        }
      } catch (e) {
        console.error('Firebase setActiveAcademicYear error:', e);
      }
    }
    return updated;
  },

  // 12. JSON YEDEK GERİ YÜKLEME (RESTORE)
  async restoreDatabaseBackup(backup: {
    projects?: ProjectEvent[];
    curriculums?: CurriculumIntegration[];
    campusMetrics?: CampusMetric[];
    academicYears?: AcademicYear[];
    profiles?: UserProfile[];
  }): Promise<{ 
    success: boolean; 
    message: string; 
    counts: { projects: number; curriculums: number; metrics: number } 
  }> {
    const projects = backup.projects || [];
    const curriculums = backup.curriculums || [];
    const metrics = backup.campusMetrics || [];
    const academicYears = backup.academicYears || [];
    const profiles = backup.profiles || [];

    // 1. Yerel Depolamayı Güncelle
    saveLocalProjects(projects);
    saveLocalCurriculums(curriculums);
    saveLocalCampusMetrics(metrics);
    if (academicYears.length > 0) {
      saveLocalAcademicYears(academicYears);
    }
    if (profiles.length > 0) {
      saveLocalProfiles(profiles);
    }

    // 2. Firebase Varsa Eşitle
    if (isFirebaseConfigured && db) {
      try {
        for (const p of projects) {
          await setDoc(doc(db, 'projects_events', p.id), p);
        }
        for (const c of curriculums) {
          await setDoc(doc(db, 'curriculum_integrations', c.id), c);
        }
        for (const m of metrics) {
          await setDoc(doc(db, 'campus_metrics', m.id), m);
        }
        for (const y of academicYears) {
          await setDoc(doc(db, 'academic_years', y.id), y);
        }
        for (const prof of profiles) {
          await setDoc(doc(db, 'profiles', prof.id), prof);
        }
      } catch (e: any) {
        console.warn('Firebase restoreDatabaseBackup sync warning:', e);
      }
    }

    return {
      success: true,
      message: `Veritabanı yedeği başarıyla geri yüklendi: ${projects.length} proje, ${curriculums.length} müfredat entegrasyonu, ${metrics.length} tüketim metriği.`,
      counts: {
        projects: projects.length,
        curriculums: curriculums.length,
        metrics: metrics.length
      }
    };
  },

  // 13. GERÇEK ZAMANLI VERİTABANI DİNLEYİCİLERİ (REAL-TIME SNAPSHOTS)
  subscribeToProjects(callback: (projects: ProjectEvent[], isRemoteUpdate: boolean) => void): () => void {
    if (!isFirebaseConfigured || !db) return () => {};
    let isInitial = true;
    try {
      // orderBy kaldırıldı: eksik/farklı alan yapısına sahip dokümanlar da dahil tüm liste güvenle gelir
      return onSnapshot(collection(db, 'projects_events'), (snapshot) => {
        const list: ProjectEvent[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as ProjectEvent;
          // Yalnızca geçerli bir başlığı veya bölümü olan projeleri al
          if (data && (data.title || data.departmentId)) {
            list.push({
              ...data,
              id: docSnap.id,
            });
          }
        });

        // Yerelde olup henüz Firestore'a yansımamış geçerli projeleri koru ve otomatik buluta eşitle
        const locals = getLocalProjects();
        const remoteIds = new Set(list.map(p => p.id));
        for (const localP of locals) {
          if (localP.title && !remoteIds.has(localP.id)) {
            list.unshift(localP);
            const clean = sanitizeFirestoreData(localP);
            setDoc(doc(db, 'projects_events', localP.id), clean).catch(err => {
              console.warn('[dbService] Yerel proje buluta senkronize edilemedi:', err);
            });
          }
        }

        // Tarihe göre sırala (en yeni en üstte)
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        saveLocalProjects(list);
        const isRemote = !isInitial && !snapshot.metadata.hasPendingWrites;
        isInitial = false;
        callback(list, isRemote);
      }, (err) => {
        console.warn('Projects snapshot subscription error:', err);
      });
    } catch (e) {
      console.warn('Could not subscribe to projects:', e);
      return () => {};
    }
  },

  subscribeToCampusMetrics(callback: (metrics: CampusMetric[], isRemoteUpdate: boolean) => void): () => void {
    if (!isFirebaseConfigured || !db) return () => {};
    let isInitial = true;
    try {
      const q = query(collection(db, 'campus_metrics'), orderBy('period', 'asc'));
      return onSnapshot(q, (snapshot) => {
        const list: CampusMetric[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as CampusMetric);
        });
        saveLocalCampusMetrics(list);
        const isRemote = !isInitial && !snapshot.metadata.hasPendingWrites;
        isInitial = false;
        callback(list, isRemote);
      }, (err) => {
        console.warn('Campus metrics snapshot subscription error:', err);
      });
    } catch (e) {
      console.warn('Could not subscribe to campus metrics:', e);
      return () => {};
    }
  },

  subscribeToCurriculums(callback: (curriculums: CurriculumIntegration[], isRemoteUpdate: boolean) => void): () => void {
    if (!isFirebaseConfigured || !db) return () => {};
    let isInitial = true;
    try {
      return onSnapshot(collection(db, 'curriculum_integrations'), (snapshot) => {
        const list: CurriculumIntegration[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as CurriculumIntegration);
        });
        saveLocalCurriculums(list);
        const isRemote = !isInitial && !snapshot.metadata.hasPendingWrites;
        isInitial = false;
        callback(list, isRemote);
      }, (err) => {
        console.warn('Curriculum snapshot subscription error:', err);
      });
    } catch (e) {
      console.warn('Could not subscribe to curriculums:', e);
      return () => {};
    }
  },

  // 14. ROL & YETKİ KONTROL PANELİ İZİNLERİ
  getLocalRolePermissions(): SystemRolePermissions {
    return getLocalRolePermissions();
  },

  async getRolePermissions(): Promise<SystemRolePermissions> {
    if (!isFirebaseConfigured || !db) {
      return getLocalRolePermissions();
    }
    try {
      const docSnap = await getDoc(doc(db, 'system_settings', 'role_permissions'));
      if (docSnap.exists()) {
        const data = docSnap.data() as SystemRolePermissions;
        const merged: SystemRolePermissions = {
          ...DEFAULT_ROLE_PERMISSIONS,
          ...data
        };
        saveLocalRolePermissions(merged);
        return merged;
      }
    } catch (e) {
      console.warn('Firebase getRolePermissions failed, using local storage:', e);
    }
    return getLocalRolePermissions();
  },

  async saveRolePermissions(perms: SystemRolePermissions): Promise<SystemRolePermissions> {
    saveLocalRolePermissions(perms);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'system_settings', 'role_permissions'), perms);
      } catch (e) {
        console.error('Firebase saveRolePermissions error:', e);
      }
    }
    return perms;
  },

  async resetRolePermissionsToDefault(): Promise<SystemRolePermissions> {
    return this.saveRolePermissions(DEFAULT_ROLE_PERMISSIONS);
  },

  subscribeToRolePermissions(callback: (perms: SystemRolePermissions) => void): () => void {
    if (!isFirebaseConfigured || !db) return () => {};
    try {
      return onSnapshot(doc(db, 'system_settings', 'role_permissions'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SystemRolePermissions;
          const merged: SystemRolePermissions = {
            ...DEFAULT_ROLE_PERMISSIONS,
            ...data
          };
          saveLocalRolePermissions(merged);
          callback(merged);
        }
      }, (err) => {
        console.warn('Role permissions snapshot subscription error:', err);
      });
    } catch (e) {
      console.warn('Could not subscribe to role permissions:', e);
      return () => {};
    }
  },

  // ----------------- AKTİVİTE & GÜVENLİK GÜNLÜĞÜ (AUDIT LOGS) -----------------
  async logActivity(entry: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog> {
    const timestamp = new Date().toISOString();
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullLog: ActivityLog = {
      ...entry,
      id,
      timestamp,
    };

    // 1. Yerel Depolamaya Kaydet
    const local = getLocalActivityLogs();
    saveLocalActivityLogs([fullLog, ...local]);

    // 2. Firebase Firestore'a Kaydet
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'activity_logs', id), fullLog);
      } catch (e) {
        console.warn('Firebase logActivity error (saved to localStorage):', e);
      }
    }

    return fullLog;
  },

  async getActivityLogs(limitCount: number = 200): Promise<ActivityLog[]> {
    if (!isFirebaseConfigured || !db) {
      return getLocalActivityLogs().slice(0, limitCount);
    }
    try {
      const q = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreLogs = snapshot.docs.map(d => d.data() as ActivityLog);
        saveLocalActivityLogs(firestoreLogs);
        return firestoreLogs;
      }
    } catch (e) {
      console.warn('Firebase getActivityLogs failed, using local logs:', e);
    }
    return getLocalActivityLogs().slice(0, limitCount);
  },

  subscribeToActivityLogs(callback: (logs: ActivityLog[]) => void, limitCount: number = 200): () => void {
    if (!isFirebaseConfigured || !db) {
      callback(getLocalActivityLogs().slice(0, limitCount));
      return () => {};
    }
    try {
      const q = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const liveLogs = snapshot.docs.map(d => d.data() as ActivityLog);
          saveLocalActivityLogs(liveLogs);
          callback(liveLogs);
        } else {
          callback(getLocalActivityLogs().slice(0, limitCount));
        }
      }, (err) => {
        console.warn('Activity logs snapshot subscription error:', err);
        callback(getLocalActivityLogs().slice(0, limitCount));
      });
    } catch (e) {
      console.warn('Could not subscribe to activity logs:', e);
      callback(getLocalActivityLogs().slice(0, limitCount));
      return () => {};
    }
  },

  async clearActivityLogs(): Promise<boolean> {
    saveLocalActivityLogs([]);
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'activity_logs'), limit(300));
        const snapshot = await getDocs(q);
        const batchDeletes = snapshot.docs.map(d => deleteDoc(doc(db, 'activity_logs', d.id)));
        await Promise.all(batchDeletes);
        return true;
      } catch (e) {
        console.error('Firebase clearActivityLogs error:', e);
      }
    }
    return true;
  }
};


