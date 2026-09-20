import React, { useState } from 'react';
import { UserProfile, UserRole, SystemRolePermissions } from '../../types';
import { DEPARTMENTS, isSuperAdminEmail } from '../../constants';
import { hasUserActionPermission } from '../../constants/permissions';
import { RolePermissionControlPanel } from './RolePermissionControlPanel';
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
  Sliders,
  School
} from 'lucide-react';
import { processImageFile } from '../../lib/imageUtils';

interface UserManagementViewProps {
  profiles: UserProfile[];
  onAddProfile: (profile: Omit<UserProfile, 'id'>) => Promise<void>;
  onUpdateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
  currentUser: UserProfile;
  rolePermissions: SystemRolePermissions;
  onSaveRolePermissions: (updated: SystemRolePermissions) => Promise<void>;
  onResetRolePermissions: () => Promise<void>;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  profiles,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  currentUser,
  rolePermissions,
  onSaveRolePermissions,
  onResetRolePermissions,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'permissions'>('users');
  const isSuperAdmin = isSuperAdminEmail(currentUser.email) || currentUser.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

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
  const [formCanEditCampus, setFormCanEditCampus] = useState(false);
  const [formCanResetCampus, setFormCanResetCampus] = useState(false);
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
    setFormCanEditCampus(false);
    setFormCanResetCampus(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Modal Açma (Düzenle)
  const handleOpenEditModal = (profile: UserProfile) => {
    setEditingProfile(profile);
    setFormName(profile.name);
    setFormEmail(profile.email);
    setFormRole(profile.role);
    setFormDeptId(profile.role === 'coordinator' || profile.role === 'admin' || profile.role === 'principal' ? '' : (profile.departmentId || ''));
    setFormTitle(profile.title);
    setFormAvatar(profile.avatar || '');
    setIsUrlInputOpen(false);
    setCustomAvatarUrl('');
    setFormCanEditCampus(Boolean(profile.customPermissions?.canEditCampusMetrics));
    setFormCanResetCampus(Boolean(profile.customPermissions?.canResetCampusMetrics));
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
      const customPermissions = {
        ...(editingProfile?.customPermissions || {}),
        canEditCampusMetrics: formCanEditCampus,
        canResetCampusMetrics: formCanResetCampus,
      };

      if (editingProfile) {
        await onUpdateProfile(editingProfile.id, {
          name: formName.trim(),
          email,
          role: formRole,
          departmentId: (formRole === 'coordinator' || formRole === 'admin' || formRole === 'principal') ? '' : formDeptId,
          title: formTitle.trim() || (formRole === 'principal' ? 'Okul Müdürü' : formRole === 'dept_head' ? 'Bölüm Başkanı' : 'Danışman Öğretmen'),
          avatar: formAvatar.trim() || '',
          customPermissions,
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
          departmentId: (formRole === 'coordinator' || formRole === 'admin' || formRole === 'principal') ? '' : formDeptId,
          title: formTitle.trim() || (formRole === 'principal' ? 'Okul Müdürü' : formRole === 'dept_head' ? 'Bölüm Başkanı' : 'Danışman Öğretmen'),
          avatar: formAvatar.trim() || '',
          status: 'active',
          customPermissions,
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
  const principalCount = profiles.filter(p => p.role === 'principal').length;
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

        {activeSubTab === 'users' && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yeni Kullanıcı Tanımla</span>
          </button>
        )}
      </div>

      {/* Alt Sekmeler: Personel Listesi vs Rol & Yetki Kontrol Paneli */}
      <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-white text-emerald-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-700" />
          <span>Personel Listesi ({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('permissions')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'permissions'
              ? 'bg-white text-emerald-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-700" />
          <span>Rol &amp; Yetki Kontrol Paneli</span>
        </button>
      </div>

      {activeSubTab === 'permissions' ? (
        <RolePermissionControlPanel
          permissions={rolePermissions}
          onSavePermissions={onSaveRolePermissions}
          onResetToDefault={onResetRolePermissions}
          currentUserRole={currentUser.role}
          isSuperAdmin={isSuperAdmin}
          profiles={profiles}
        />
      ) : (
        <>

      {/* İstatistik Özet Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
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
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Okul Müdürü</p>
            <p className="text-xl font-black text-purple-900">{principalCount}</p>
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
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
          >
            <option value="all">Tüm Roller</option>
            <option value="principal">Okul Müdürü</option>
            <option value="coordinator">Koordinatörler</option>
            <option value="dept_head">Bölüm Başkanları</option>
            <option value="teacher">Danışman Öğretmenler</option>
          </select>

          {/* Zümre Filtresi */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
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
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-2.5 sm:px-3">Personel</th>
                <th className="py-3 px-2.5 sm:px-3">Kurumsal E-Posta</th>
                <th className="py-3 px-2.5 sm:px-3">Rol / Yetki</th>
                <th className="py-3 px-2.5 sm:px-3">Zümre / Bölüm</th>
                <th className="py-3 px-2.5 sm:px-3">Unvan</th>
                <th className="py-3 px-2 text-center w-20 shrink-0 sticky right-0 z-10 bg-slate-50/95 backdrop-blur-xs border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                  İşlemler
                </th>
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
                    <tr key={profile.id} className="group hover:bg-slate-50/70 transition-colors">
                      {/* İsim ve Avatar */}
                      <td className="py-2.5 px-2.5 sm:px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(profile)}
                            title="Fotoğrafı ve Bilgileri Düzenle"
                            className="relative group w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-700 text-xs shadow-2xs hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer"
                          >
                            {profile.avatar ? (
                              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                              profile.name.charAt(0)
                            )}
                            <div className="absolute inset-0 bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-3 h-3" />
                            </div>
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(profile)}
                                className="font-bold text-slate-900 hover:text-emerald-700 transition-colors text-left truncate max-w-[130px] sm:max-w-[160px] cursor-pointer"
                                title={profile.name}
                              >
                                {profile.name}
                              </button>
                              {isSuperAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                                  Yönetici
                                </span>
                              )}
                              {!isSuperAdmin && isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 text-slate-700 shrink-0">
                                  Siz
                                </span>
                              )}
                              {hasUserActionPermission(profile, 'canEditCampusMetrics', rolePermissions) && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 shrink-0" title="Yeşil Kampüs Metriklerini Güncelleme Yetkisi Var">
                                  🌱
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* E-posta */}
                      <td className="py-2.5 px-2.5 sm:px-3">
                        <div className="font-mono text-xs text-slate-600 truncate max-w-[140px] sm:max-w-[170px]" title={profile.email}>
                          {profile.email}
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-2.5 px-2.5 sm:px-3 whitespace-nowrap">
                        {profile.role === 'principal' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            <School className="w-3 h-3 text-purple-700 shrink-0" />
                            Okul Müdürü
                          </span>
                        ) : profile.role === 'coordinator' || profile.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                            Koordinatör
                          </span>
                        ) : profile.role === 'dept_head' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                            Bölüm Başkanı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <GraduationCap className="w-3 h-3 text-amber-600 shrink-0" />
                            Öğretmen
                          </span>
                        )}
                      </td>

                      {/* Zümre */}
                      <td className="py-2.5 px-2.5 sm:px-3 whitespace-nowrap">
                        {profile.role === 'principal' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-purple-900 bg-purple-50 border border-purple-200">
                            Okul Yönetimi
                          </span>
                        ) : profile.role === 'coordinator' || profile.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                            Okul Geneli
                          </span>
                        ) : dept ? (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 max-w-[130px] truncate"
                            style={{ borderLeftColor: dept.color, borderLeftWidth: '3px' }}
                            title={dept.name}
                          >
                            <span className="truncate">{dept.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Unvan */}
                      <td className="py-2.5 px-2.5 sm:px-3 text-xs text-slate-600 font-medium">
                        <div className="max-w-[120px] sm:max-w-[140px] truncate" title={profile.title || '-'}>
                          {profile.title || '-'}
                        </div>
                      </td>

                      {/* İşlemler - Sabit (Sticky Right) */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap w-20 shrink-0 sticky right-0 z-10 bg-white group-hover:bg-slate-50 border-l border-slate-100 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(profile)}
                            title="Düzenle"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {!isCurrent && !isSuperAdmin ? (
                            <button
                              onClick={() => setDeletingId(profile.id)}
                              title="Sil"
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="w-7 h-7 inline-block" />
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
      </>
      )}

      {/* Kullanıcı Ekleme / Düzenleme Modalı */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Sabit Modal Başlığı */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  {editingProfile ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    {editingProfile ? 'Personel & Rol Düzenle' : 'Yeni Personel Tanımla'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingProfile ? `${editingProfile.name} profil detayları` : 'Sisteme yeni bir kullanıcı ekleyin'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form ve Butonlar (Sabit alt bar ile) */}
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Kaydırılabilir Form Gövdesi */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                          formAvatar === '/logo.png'
                            ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>Işık Logosu</span>
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
                    if (newRole === 'coordinator' || newRole === 'admin' || newRole === 'principal') {
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
                  <option value="principal">Okul Müdürü</option>
                </select>
              </div>

              {/* Zümre / Bölüm (Koordinatör ve Okul Müdürü hariç) */}
              {formRole === 'principal' ? (
                <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
                  <School className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-purple-950">Yetki Kapsamı: Okul Yönetimi</span>
                    <span className="text-[11px] text-purple-800 leading-relaxed">
                      Okul Müdürlüğü tüm okul yönetimini ve akademik kadroyu temsil ettiği için tekil bir zümre seçimi gerekmemektedir.
                    </span>
                  </div>
                </div>
              ) : formRole === 'coordinator' || formRole === 'admin' ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-950">Yetki Kapsamı: Okul Geneli</span>
                    <span className="text-[11px] text-emerald-800 leading-relaxed">
                      Sürdürülebilirlik Koordinatörlüğü tüm okulu ve akademik zümreleri kapsadığı için tekil bir zümre seçimi gerekmemektedir.
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

              {/* Özel İzinler & Ek Sorumluluklar */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Kişiye Özel Ek Yetkiler (Yeşil Kampüs &amp; Metrikler)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Bu personele genel rolünden bağımsız olarak Yeşil Kampüs verisi girme veya sıfırlama yetkisi verebilirsiniz.
                </p>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formCanEditCampus}
                      onChange={(e) => setFormCanEditCampus(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">🌱 Metrik Değerlerini Ekleme ve Güncelleme Yetkisi</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formCanResetCampus}
                      onChange={(e) => setFormCanResetCampus(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">⚠️ Tüm Kampüs Metriklerini Sıfırlama Yetkisi</span>
                  </label>
                </div>
              </div>
            </div>

              {/* Sabit Alt Buton Barı */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
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
