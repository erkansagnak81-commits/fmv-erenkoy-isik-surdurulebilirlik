import React, { useState, useRef } from 'react';
import { UserProfile, UserRole } from '../../types';
import { DEPARTMENTS, isSuperAdminEmail } from '../../constants';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Sparkles, 
  Building2, 
  GraduationCap, 
  X, 
  AlertCircle,
  Camera,
  Upload,
  Link2,
  Download,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileJson
} from 'lucide-react';
import { parseDatabaseBackupJson, ParsedDatabaseBackup } from '../../lib/exportUtils';
import { processImageFile } from '../../lib/imageUtils';

interface UserManagementViewProps {
  profiles: UserProfile[];
  onAddProfile: (profile: Omit<UserProfile, 'id'>) => Promise<void>;
  onUpdateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
  currentUser: UserProfile;
  onExportBackup?: () => void;
  onRestoreBackup?: (backupData: ParsedDatabaseBackup) => Promise<void>;
  onSyncSeedData?: () => Promise<void>;
  onClearTestData?: () => Promise<void>;
  isSyncing?: boolean;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  profiles,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  currentUser,
  onExportBackup,
  onRestoreBackup,
  onSyncSeedData,
  onClearTestData,
  isSyncing = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Yedek ve Veritabanı Yönetim Durumları
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestoreData, setPendingRestoreData] = useState<ParsedDatabaseBackup | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmSeedModal, setConfirmSeedModal] = useState(false);
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  // Modal Durumları
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  // Form Değerleri
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('teacher');
  const [formDeptId, setFormDeptId] = useState(DEPARTMENTS[0].id);
  const [formTitle, setFormTitle] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Silme Onay Modalı
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal Açma (Yeni Kullanıcı)
  const handleOpenAddModal = () => {
    setEditingProfile(null);
    setFormName('');
    setFormEmail('');
    setFormRole('teacher');
    setFormDeptId(DEPARTMENTS[0].id);
    setFormTitle('');
    setFormAvatar('');
    setIsUrlInputOpen(false);
    setCustomAvatarUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Modal Açma (Düzenle)
  const handleOpenEditModal = (profile: UserProfile) => {
    setEditingProfile(profile);
    setFormName(profile.name);
    setFormEmail(profile.email);
    setFormRole(profile.role);
    setFormDeptId(profile.role === 'coordinator' || profile.role === 'admin' ? '' : (profile.departmentId || ''));
    setFormTitle(profile.title);
    setFormAvatar(profile.avatar || '');
    setIsUrlInputOpen(false);
    setCustomAvatarUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Bilgisayardan Fotoğraf Yükleme
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    setFormError(null);
    try {
      const processed = await processImageFile(file);
      setFormAvatar(processed);
    } catch (err: any) {
      setFormError(err.message || 'Fotoğraf işlenirken bir hata oluştu.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // URL ile Fotoğraf Uygulama
  const handleApplyUrl = () => {
    if (!customAvatarUrl.trim()) return;
    setFormAvatar(customAvatarUrl.trim());
    setIsUrlInputOpen(false);
  };

  // Form Gönderme (Kaydet / Güncelle)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Lütfen ad ve soyad giriniz.');
      return;
    }

    let email = formEmail.trim().toLowerCase();
    if (!email) {
      setFormError('Lütfen kurumsal e-posta adresi giriniz.');
      return;
    }

    if (!email.includes('@')) {
      email = `${email}@fmvisik.k12.tr`;
    }

    const isValidDomain = email.endsWith('@fmvisik.k12.tr') || email.endsWith('@fmv.edu.tr');
    if (!isValidDomain) {
      setFormError('E-posta adresi @fmvisik.k12.tr veya @fmv.edu.tr uzantılı olmalıdır.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProfile) {
        await onUpdateProfile(editingProfile.id, {
          name: formName.trim(),
          email,
          role: formRole,
          departmentId: (formRole === 'coordinator' || formRole === 'admin') ? '' : formDeptId,
          title: formTitle.trim() || (formRole === 'dept_head' ? 'Bölüm Başkanı' : 'Danışman Öğretmen'),
          avatar: formAvatar.trim() || undefined,
        });
      } else {
        // E-posta mükerrer kontrolü
        const duplicate = profiles.find(p => p.email.toLowerCase() === email);
        if (duplicate) {
          setFormError('Bu e-posta adresi ile zaten bir kullanıcı mevcut.');
          setIsSubmitting(false);
          return;
        }

        await onAddProfile({
          name: formName.trim(),
          email,
          role: formRole,
          departmentId: (formRole === 'coordinator' || formRole === 'admin') ? '' : formDeptId,
          title: formTitle.trim() || (formRole === 'dept_head' ? 'Bölüm Başkanı' : 'Danışman Öğretmen'),
          avatar: formAvatar.trim() || undefined,
          status: 'active',
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'İşlem sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kullanıcı Silme İşlemi
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDeleteProfile(deletingId);
      setDeletingId(null);
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  };

  // Yedek Dosyası Seçildiğinde
  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseDatabaseBackupJson(content);
      if (!result.success || !result.data) {
        setRestoreError(result.error || 'Yedek dosyası doğrulanamadı.');
        return;
      }
      setRestoreError(null);
      setPendingRestoreData(result.data);
    };
    reader.onerror = () => {
      setRestoreError('Dosya okunamadı. Lütfen geçerli bir JSON dosyası seçiniz.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Yedek Geri Yükleme Onayı
  const handleConfirmRestore = async () => {
    if (!pendingRestoreData || !onRestoreBackup) return;
    setIsRestoring(true);
    try {
      await onRestoreBackup(pendingRestoreData);
      setPendingRestoreData(null);
    } catch (err: any) {
      setRestoreError(`Geri yükleme hatası: ${err.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsRestoring(false);
    }
  };


  // Filtreleme
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
    const matchesDept = deptFilter === 'all' || profile.departmentId === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  // İstatistikler
  const totalCount = profiles.length;
  const coordinatorCount = profiles.filter(p => p.role === 'coordinator' || p.role === 'admin').length;
  const deptHeadCount = profiles.filter(p => p.role === 'dept_head').length;
  const teacherCount = profiles.filter(p => p.role === 'teacher').length;

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Eylem Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Kullanıcı &amp; Rol Yönetimi
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Okul personellerinin rolleri, zümreleri ve yetki tanımları
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yeni Kullanıcı Tanımla</span>
        </button>
      </div>

      {/* İstatistik Özet Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Toplam Personel</p>
            <p className="text-xl font-black text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Koordinatörler</p>
            <p className="text-xl font-black text-emerald-800">{coordinatorCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Bölüm Başkanları</p>
            <p className="text-xl font-black text-blue-800">{deptHeadCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Danışman Öğretmenler</p>
            <p className="text-xl font-black text-amber-800">{teacherCount}</p>
          </div>
        </div>
      </div>

      {/* Arama ve Filtreleme Barı */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="İsim, e-posta veya unvan ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtreler:</span>
          </div>

          {/* Rol Filtresi */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Tüm Roller</option>
            <option value="coordinator">Koordinatörler</option>
            <option value="dept_head">Bölüm Başkanları</option>
            <option value="teacher">Danışman Öğretmenler</option>
          </select>

          {/* Zümre Filtresi */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Tüm Zümreler</option>
            {DEPARTMENTS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kullanıcı Listesi Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Personel</th>
                <th className="py-3.5 px-4">Kurumsal E-Posta</th>
                <th className="py-3.5 px-4">Rol / Yetki</th>
                <th className="py-3.5 px-4">Zümre / Bölüm</th>
                <th className="py-3.5 px-4">Unvan</th>
                <th className="py-3.5 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Kriterlere uygun kullanıcı bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile) => {
                  const dept = DEPARTMENTS.find(d => d.id === profile.departmentId);
                  const isCurrent = currentUser.email.toLowerCase() === profile.email.toLowerCase();
                  const isSuperAdmin = isSuperAdminEmail(profile.email);

                  return (
                    <tr key={profile.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* İsim ve Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(profile)}
                            title="Fotoğrafı ve Bilgileri Düzenle"
                            className="relative group w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-700 shadow-xs hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer"
                          >
                            {profile.avatar ? (
                              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                              profile.name.charAt(0)
                            )}
                            <div className="absolute inset-0 bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-4 h-4" />
                            </div>
                          </button>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(profile)}
                                className="font-bold text-slate-900 hover:text-emerald-700 transition-colors text-left cursor-pointer"
                              >
                                {profile.name}
                              </button>
                              {isSuperAdmin && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                  Ana Yönetici
                                </span>
                              )}
                              {!isSuperAdmin && isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                                  Siz
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* E-posta */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {profile.email}
                      </td>

                      {/* Rol */}
                      <td className="py-3.5 px-4">
                        {profile.role === 'coordinator' || profile.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Koordinatör
                          </span>
                        ) : profile.role === 'dept_head' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            Bölüm Başkanı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <GraduationCap className="w-3 h-3 text-amber-600" />
                            Danışman Öğretmen
                          </span>
                        )}
                      </td>

                      {/* Zümre */}
                      <td className="py-3.5 px-4">
                        {profile.role === 'coordinator' || profile.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                            Okul Geneli
                          </span>
                        ) : dept ? (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200"
                            style={{ borderLeftColor: dept.color, borderLeftWidth: '3px' }}
                          >
                            <span>{dept.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Unvan */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                        {profile.title || '-'}
                      </td>

                      {/* İşlemler */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(profile)}
                            title="Rol ve Bilgileri Düzenle"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {!isCurrent && !isSuperAdmin && (
                            <button
                              onClick={() => setDeletingId(profile.id)}
                              title="Kullanıcıyı Sil"
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SİSTEM VE VERİTABANI YÖNETİMİ (YALNIZCA ERKAN SAĞNAK) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Gizli JSON Dosya Seçici */}
        <input 
          type="file" 
          ref={backupFileInputRef} 
          accept=".json,application/json" 
          onChange={handleBackupFileSelect} 
          className="hidden" 
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                Sistem &amp; Veritabanı Yönetimi
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tüm okul verilerini JSON olarak yedekleyin, geri yükleyin veya bulut veritabanını yönetin (Yalnızca Ana Yönetici).
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shrink-0 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Süper Yönetici Yetkisi</span>
          </span>
        </div>

        {/* Hata Bildirimi */}
        {restoreError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Yedek İşleme Hatası</p>
                <p className="mt-0.5 text-rose-700">{restoreError}</p>
              </div>
            </div>
            <button 
              onClick={() => setRestoreError(null)} 
              className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 text-xs font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Ana İşlem Kartı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kart 1: JSON Yedek İndir */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Veritabanı Yedeği İndir (JSON)
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Tüm onaylı ve taslak projeler, müfredat kazanımları, aylık tüketim sayaçları ve aktif eğitim yılı ayarlarını tek tıkla güvenli JSON formatında bilgisayarınıza indirin.
              </p>
            </div>
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tam JSON Yedeğini İndir</span>
            </button>
          </div>

          {/* Kart 2: JSON Yedeğinden Geri Yükle */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <FileJson className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Yedekten Geri Yükle (JSON)
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Önceden bilgisayarınıza indirdiğiniz JSON yedek dosyasını yükleyin. Veriler güvenle taranır ve özet onayınız alındıktan sonra Cloud Firestore ve yerel belleğe işlenir.
              </p>
            </div>
            <button
              type="button"
              onClick={() => backupFileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer w-full sm:w-auto"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>JSON Dosyası Seç &amp; Yükle</span>
            </button>
          </div>

          {/* Kart 3: Örnek Verileri Tohumla (Seed) */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Örnek FMV Erenköy Işık Verileri
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                7 akademik zümrenin örnek sürdürülebilirlik projelerini, müfredat kazanımlarını ve 2026-2027 tüketim sayaçlarını veritabanına aktarır.
              </p>
            </div>
            <button
              type="button"
              disabled={isSyncing}
              onClick={() => setConfirmSeedModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-all cursor-pointer w-full sm:w-auto disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isSyncing ? 'Senkronize Ediliyor...' : 'Örnek Verileri Tohumla'}</span>
            </button>
          </div>

          {/* Kart 4: Deneme Verilerini Temizle */}
          <div className="p-5 rounded-2xl border border-rose-200/70 bg-rose-50/30 hover:bg-rose-50/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-rose-900 text-sm">
                  Deneme Verilerini Sıfırla
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Kullanıcı profilleri ve yetkilerine dokunmadan; girilmiş olan tüm test projelerini, müfredat planlarını ve kampüs sayaçlarını sıfırlar.
              </p>
            </div>
            <button
              type="button"
              disabled={isSyncing}
              onClick={() => setConfirmClearModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition-all cursor-pointer w-full sm:w-auto disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{isSyncing ? 'Temizleniyor...' : 'Deneme Verilerini Temizle'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* YEDEK GERİ YÜKLEME ONAY MODALI */}
      {pendingRestoreData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  JSON Yedek Dosyası Doğrulandı
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {pendingRestoreData.exportedAt ? `Yedek Tarihi: ${new Date(pendingRestoreData.exportedAt).toLocaleString('tr-TR')}` : 'Geçerli Sistem Yedeği'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs text-slate-700">
              <p className="font-bold text-slate-900">Yedek Dosyası İçeriği:</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li><strong className="text-emerald-700 font-semibold">{pendingRestoreData.projects.length}</strong> adet Proje ve Etkinlik</li>
                <li><strong className="text-blue-700 font-semibold">{pendingRestoreData.curriculums.length}</strong> adet Müfredat Kazanım Eşleştirmesi</li>
                <li><strong className="text-teal-700 font-semibold">{pendingRestoreData.campusMetrics.length}</strong> adet Kampüs Tüketim &amp; Sayaç Verisi</li>
                {pendingRestoreData.academicYears && pendingRestoreData.academicYears.length > 0 && (
                  <li><strong className="text-amber-700 font-semibold">{pendingRestoreData.academicYears.length}</strong> adet Eğitim-Öğretim Yılı Tanımı</li>
                )}
                {pendingRestoreData.profiles && pendingRestoreData.profiles.length > 0 && (
                  <li><strong className="text-slate-700 font-semibold">{pendingRestoreData.profiles.length}</strong> adet Kullanıcı Profili</li>
                )}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Dikkat:</strong> Geri yükleme işlemi, mevcut veritabanınızı yedek dosyasındaki kayıtlarla güncelleyecektir. Bu işlemi onaylıyor musunuz?
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setPendingRestoreData(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Geri Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Evet, Yedeği Geri Yükle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÖRNEK VERİLERİ TOHUMLA ONAY MODALI */}
      {confirmSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Örnek Verileri Tohumla (Seed)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              FMV Erenköy Işık Lisesi ve Fen Lisesi'ne ait 7 zümre projeleri, müfredat kazanımları ve aylık sayaç verileri veritabanına aktarılacaktır. Devam etmek istiyor musunuz?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSeedModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmSeedModal(false);
                  if (onSyncSeedData) await onSyncSeedData();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer shadow-xs"
              >
                Evet, Tohumla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DENEME VERİLERİNİ TEMİZLE ONAY MODALI */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Deneme Verilerini Sıfırla
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Uyarı:</strong> Kullanıcı profilleri korunacak; tüm deneme projeleri, müfredat kayıtları ve sayaç verileri kalıcı olarak sıfırlanacaktır. Bu işlem geri alınamaz!
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmClearModal(false);
                  if (onClearTestData) await onClearTestData();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
              >
                Evet, Tüm Verileri Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kullanıcı Ekleme / Düzenleme Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  {editingProfile ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingProfile ? 'Personel & Rol Düzenle' : 'Yeni Personel Tanımla'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Profil Fotoğrafı Düzenleme & Yükleme Alanı */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center font-bold text-slate-700 text-lg">
                      {formAvatar ? (
                        <img src={formAvatar} alt="Profil Önizleme" className="w-full h-full object-cover" />
                      ) : (
                        <span>{formName ? formName.charAt(0).toUpperCase() : '👤'}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Bilgisayardan Fotoğraf Seç"
                      className="absolute inset-0 bg-slate-900/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Profil Fotoğrafı
                      </span>
                      {formAvatar && (
                        <button
                          type="button"
                          onClick={() => setFormAvatar('')}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                        >
                          Fotoğrafı Kaldır
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isUploadingPhoto ? 'İşleniyor...' : 'Fotoğraf Yükle'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsUrlInputOpen(!isUrlInputOpen)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Web URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormAvatar('/logo.png')}
                        className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition cursor-pointer"
                      >
                        Işık Logosu
                      </button>
                    </div>
                  </div>
                </div>

                {isUrlInputOpen && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center gap-2 animate-in fade-in">
                    <input
                      type="url"
                      placeholder="https://.../fotograf.jpg"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                    >
                      Uygula
                    </button>
                  </div>
                )}
              </div>

              {/* Ad Soyad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ad ve Soyad *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Dr. Ahmet Kaya"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Kurumsal E-posta */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kurumsal E-Posta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ad.soyad@fmvisik.k12.tr"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Kullanıcı sisteme bu Google e-postası ile giriş yapacaktır.
                </p>
              </div>

              {/* Rol Seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yetki Rolü *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    setFormRole(newRole);
                    if (newRole === 'coordinator' || newRole === 'admin') {
                      setFormDeptId('');
                    } else if (!formDeptId) {
                      setFormDeptId(DEPARTMENTS[0].id);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                >
                  <option value="teacher">Danışman Öğretmen</option>
                  <option value="dept_head">Bölüm Başkanı</option>
                  <option value="coordinator">Koordinatör</option>
                </select>
              </div>

              {/* Zümre / Bölüm (Koordinatör hariç) */}
              {formRole === 'coordinator' || formRole === 'admin' ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-950">Yetki Kapsamı: Okul Geneli</span>
                    <span className="text-[11px] text-emerald-800 leading-relaxed">
                      Sürdürülebilirlik Koordinatörlüğü tüm okulu ve 7 akademik zümreyi kapsadığı için tekil bir zümre seçimi gerekmemektedir.
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bağlı Olduğu Zümre / Bölüm *
                  </label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Unvan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unvan / Görev Tanımı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Kimya Zümre Başkanı, Sürdürülebilirlik Kulübü Rehberi"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydediliyor...' : editingProfile ? 'Güncelle' : 'Kullanıcıyı Ekle'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Silme Onay Modalı */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Kullanıcıyı Kaldır
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Bu personeli sistemden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
