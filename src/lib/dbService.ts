import { db, auth, googleProvider, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';
import { 
  ProjectEvent, 
  CurriculumIntegration, 
  CampusMetric, 
  ProjectStatus, 
  ImpactReport, 
  UserProfile,
  AcademicYear 
} from '../types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_CURRICULUM, 
  INITIAL_CAMPUS_METRICS, 
  INITIAL_PROFILES 
} from '../data/initialData';

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
          if (p.role === 'coordinator' || p.role === 'admin') {
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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Eski yerel verideki başlangıç projelerinin tarihlerini 2026-2027 eğitim yılına güncelle ve eksik projeleri ekle
        let needsSave = false;
        const initialMap = new Map(INITIAL_PROJECTS.map(p => [p.id, p]));
        
        const updatedList = parsed.map((p: ProjectEvent) => {
          const initP = initialMap.get(p.id);
          // Eğer başlangıç projelerinden biriyse ve tarihi aktif eğitim yılı (2026-09-08) öncesinde kalmışsa güncelle
          if (initP && p.startDate < '2026-09-08') {
            needsSave = true;
            return {
              ...p,
              startDate: initP.startDate,
              endDate: initP.endDate || initP.startDate,
              createdAt: initP.createdAt,
            };
          }
          return p;
        });

        // Başlangıç listesindeki yeni/eksik projeleri ekle
        const existingIds = new Set(updatedList.map((p: ProjectEvent) => p.id));
        for (const initP of INITIAL_PROJECTS) {
          if (!existingIds.has(initP.id)) {
            updatedList.push(initP);
            needsSave = true;
          }
        }

        if (needsSave) {
          saveLocalProjects(updatedList);
        }
        return updatedList;
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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

  // 1. PROJELERİ GETİR
  async getProjects(): Promise<{ data: ProjectEvent[]; fromLive: boolean }> {
    const locals = getLocalProjects();

    if (!isFirebaseConfigured || !db) {
      return { data: locals, fromLive: false };
    }

    try {
      const q = query(collection(db, 'projects_events'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Firestore koleksiyonu boş ise başlangıç/yerel projeleri Firestore'a tohumlayalım
        for (const p of locals) {
          try {
            await setDoc(doc(db, 'projects_events', p.id), p);
          } catch {}
        }
        return { data: locals, fromLive: true };
      }

      const remoteProjects: ProjectEvent[] = snapshot.docs.map(docSnap => ({
        ...(docSnap.data() as ProjectEvent),
        id: docSnap.id,
      }));

      // Canlı Firestore veritabanı aktif ve veri mevcut ise uzak liste esas alınır
      saveLocalProjects(remoteProjects);
      return { data: remoteProjects, fromLive: true };
    } catch (err) {
      console.warn('Firebase getProjects fallback to local data:', err);
      return { data: locals, fromLive: false };
    }
  },

  // 2. YENİ PROJE KAYDET
  async createProject(project: Omit<ProjectEvent, 'id' | 'createdAt'>): Promise<string> {
    const tempId = `proj-${Date.now()}`;
    const newProject: ProjectEvent = {
      ...project,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    // 1. Derhal yerel belleğe ve localStorage'a kaydet (Asla kaybolmaz)
    const locals = getLocalProjects();
    const updated = [newProject, ...locals.filter(p => p.id !== tempId)];
    saveLocalProjects(updated);

    // 2. Firebase Firestore ile arka planda eşitle
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'projects_events', tempId), newProject);
        return tempId;
      } catch (e) {
        console.error('Firebase createProject error:', e);
      }
    }

    return tempId;
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
        const docRef = doc(db, 'projects_events', projectId);
        await setDoc(docRef, updates, { merge: true });
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
        await setDoc(docRef, updates, { merge: true });
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
        await setDoc(docRef, {
          status: 'completed',
          impactReport: fullReport,
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
        for (const c of locals) {
          try {
            await setDoc(doc(db, 'curriculum_integrations', c.id), c);
          } catch {}
        }
        return locals;
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
        await setDoc(doc(db, 'curriculum_integrations', tempId), newCurr);
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
        const docRef = doc(db, 'curriculum_integrations', curriculumId);
        await setDoc(docRef, updates, { merge: true });
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

      const profiles: UserProfile[] = snapshot.docs.map(docSnap => ({
        ...(docSnap.data() as UserProfile),
        id: docSnap.id,
      }));

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
      const q = query(collection(db, 'projects_events'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const list: ProjectEvent[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as ProjectEvent);
        });
        if (list.length > 0) {
          saveLocalProjects(list);
        }
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
        if (list.length > 0) {
          saveLocalCampusMetrics(list);
        }
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
        if (list.length > 0) {
          saveLocalCurriculums(list);
        }
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
  }
};


