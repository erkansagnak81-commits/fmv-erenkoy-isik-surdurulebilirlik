import React, { useState } from 'react';
import { UserRole, AppTab, RoleActionPermissions, SystemRolePermissions, UserProfile } from '../../types';
import { DEPARTMENTS } from '../../constants';
import { 
  APP_TABS_META, 
  PERMISSION_GROUPS, 
  DEFAULT_ROLE_PERMISSIONS 
} from '../../constants/permissions';
import { 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  Building2, 
  GraduationCap, 
  RotateCcw, 
  Save, 
  Check, 
  Info,
  CheckCircle2,
  FolderKanban,
  BookOpenCheck,
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  FileBadge,
  Users,
  CheckSquare,
  Lock,
  UserPlus,
  UserCheck,
  X,
  Search,
  School
} from 'lucide-react';

interface RolePermissionControlPanelProps {
  permissions: SystemRolePermissions;
  onSavePermissions: (updated: SystemRolePermissions) => Promise<void>;
  onResetToDefault: () => Promise<void>;
  currentUserRole: UserRole;
  isSuperAdmin: boolean;
  profiles?: UserProfile[];
}

export const RolePermissionControlPanel: React.FC<RolePermissionControlPanelProps> = ({
  permissions,
  onSavePermissions,
  onResetToDefault,
  isSuperAdmin,
  profiles = [],
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [localPermissions, setLocalPermissions] = useState<SystemRolePermissions>(() => JSON.parse(JSON.stringify(permissions)));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Kişi bazlı yetki seçim modalı state
  const [assigningPermKey, setAssigningPermKey] = useState<keyof RoleActionPermissions | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  // Dışarıdan gelen permissions prop'u güncellendiğinde senkronize et (eğer kaydedilmemiş değişiklik yoksa)
  React.useEffect(() => {
    if (!hasChanges) {
      setLocalPermissions(JSON.parse(JSON.stringify(permissions)));
    }
  }, [permissions, hasChanges]);

  const currentRoleConfig = localPermissions[selectedRole] || DEFAULT_ROLE_PERMISSIONS[selectedRole];

  // Sekme İznini Değiştir
  const handleToggleTab = (tabId: AppTab) => {
    // Admin rolünde sekmeler kilitli kalabilir veya süper yönetici koruması
    if (selectedRole === 'admin' && !isSuperAdmin) return;

    setLocalPermissions(prev => {
      const roleConfig = prev[selectedRole];
      const currentTabs = roleConfig.allowedTabs;
      const isAllowed = currentTabs.includes(tabId);
      
      const newTabs = isAllowed
        ? currentTabs.filter(t => t !== tabId)
        : [...currentTabs, tabId];

      setHasChanges(true);
      return {
        ...prev,
        [selectedRole]: {
          ...roleConfig,
          allowedTabs: newTabs
        }
      };
    });
  };

  // Eylem Yetkisini Değiştir
  const handleTogglePermission = (key: keyof RoleActionPermissions) => {
    if (selectedRole === 'admin' && !isSuperAdmin) return;

    setLocalPermissions(prev => {
      const roleConfig = prev[selectedRole];
      const currentVal = roleConfig.permissions[key];

      setHasChanges(true);
      return {
        ...prev,
        [selectedRole]: {
          ...roleConfig,
          permissions: {
            ...roleConfig.permissions,
            [key]: !currentVal
          }
        }
      };
    });
  };

  // Kişi Bazlı Özel Yetki Ekleme / Çıkarma
  const handleToggleAssignedUser = (permKey: keyof RoleActionPermissions, userId: string) => {
    setLocalPermissions(prev => {
      const currentAssigned = prev[selectedRole]?.assignedUsers?.[permKey] || [];
      const updated = currentAssigned.includes(userId)
        ? currentAssigned.filter(id => id !== userId)
        : [...currentAssigned, userId];

      return {
        ...prev,
        [selectedRole]: {
          ...prev[selectedRole],
          assignedUsers: {
            ...(prev[selectedRole]?.assignedUsers || {}),
            [permKey]: updated
          }
        }
      };
    });
    setHasChanges(true);
  };

  const handleRemoveAssignedUser = (permKey: keyof RoleActionPermissions, userId: string) => {
    setLocalPermissions(prev => {
      const currentAssigned = prev[selectedRole]?.assignedUsers?.[permKey] || [];
      const updated = currentAssigned.filter(id => id !== userId);

      return {
        ...prev,
        [selectedRole]: {
          ...prev[selectedRole],
          assignedUsers: {
            ...(prev[selectedRole]?.assignedUsers || {}),
            [permKey]: updated
          }
        }
      };
    });
    setHasChanges(true);
  };

  const findPermLabel = (key: keyof RoleActionPermissions) => {
    for (const group of PERMISSION_GROUPS) {
      const found = group.items.find(i => i.key === key);
      if (found) return found.label;
    }
    return key;
  };

  // Seçili role atanabilecek personeller
  const eligibleProfiles = profiles.filter(p => {
    if (selectedRole === 'teacher') return p.role === 'teacher';
    if (selectedRole === 'dept_head') return p.role === 'dept_head';
    return p.role === selectedRole;
  });

  const filteredEligible = eligibleProfiles.filter(p => 
    p.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
    p.email.toLowerCase().includes(assignSearch.toLowerCase())
  );

  // Kaydetme İşlemi
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSavePermissions(localPermissions);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Yetkiler kaydedilemedi:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Varsayılanlara Sıfırlama
  const handleReset = async () => {
    if (window.confirm('Tüm rollerin sekme ve işlem yetkilerini kurumsal varsayılan ayarlara geri döndürmek istediğinize emin misiniz?')) {
      try {
        setIsSaving(true);
        await onResetToDefault();
        setLocalPermissions(JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS)));
        setHasChanges(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        console.error('Varsayılanlara sıfırlanamadı:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const rolesList: { id: UserRole; title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'teacher',
      title: 'Danışman Öğretmen',
      subtitle: 'Branş öğretmenleri ve kulüp danışmanları',
      icon: GraduationCap
    },
    {
      id: 'dept_head',
      title: 'Bölüm Başkanı',
      subtitle: 'Zümre başkanları ve bölüm onay sorumluları',
      icon: Building2
    },
    {
      id: 'coordinator',
      title: 'Koordinatör',
      subtitle: 'Sürdürülebilirlik koordinatörlüğü ve takvim yöneticisi',
      icon: Sparkles
    },
    {
      id: 'principal',
      title: 'Okul Müdürü',
      subtitle: 'Okul yönetimi, stratejik denetim ve nihai onay',
      icon: School
    },
    {
      id: 'admin',
      title: 'Sistem Yöneticisi',
      subtitle: 'Tüm yetkilere tam erişimli teknik yönetim',
      icon: ShieldCheck
    }
  ];

  const getTabIcon = (tabId: AppTab) => {
    switch (tabId) {
      case 'dashboard': return LayoutDashboard;
      case 'calendar': return CalendarDays;
      case 'projects': return FolderKanban;
      case 'approvals': return CheckSquare;
      case 'curriculum': return BookOpenCheck;
      case 'campus': return BarChart3;
      case 'reports': return FileBadge;
      case 'users': return Users;
      case 'logs': return ShieldCheck;
      default: return LayoutDashboard;
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Bilgi ve Kaydetme Barı */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 sm:p-6 rounded-2xl text-white shadow-card-soft border border-slate-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Sliders className="w-3.5 h-3.5" />
            <span>Merkezi Yetki &amp; Sekme Denetimi</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
            Rol ve İzin Yapılandırma Paneli
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Hangi personelin hangi sekmeleri görebileceğini ve hangi eylemleri (ekleme, silme, onaylama vb.) yapabileceğini belirleyin.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Tüm rolleri varsayılan kurumsal izinlere döndür"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Varsayılana Sıfırla</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer ${
              hasChanges 
                ? 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 ring-2 ring-emerald-400/50 animate-pulse' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-950" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Kaydediliyor...' : saveSuccess ? 'Kaydedildi!' : hasChanges ? 'Değişiklikleri Kaydet' : 'Kayıtlı ve Güncel'}</span>
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Kaydedilmemiş yetki değişiklikleriniz var. Değişikliklerin personele yansıması için <strong>"Değişiklikleri Kaydet"</strong> butonuna basın.</span>
          </div>
        </div>
      )}

      {/* Rol Seçim Sekmeleri */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {rolesList.map(roleItem => {
          const Icon = roleItem.icon;
          const isSelected = selectedRole === roleItem.id;
          const config = localPermissions[roleItem.id];
          const activeTabCount = config?.allowedTabs.length || 0;

          return (
            <button
              key={roleItem.id}
              type="button"
              onClick={() => setSelectedRole(roleItem.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {activeTabCount} / 8 Sekme Açık
                </span>
              </div>
              <div>
                <h4 className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                  {roleItem.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {roleItem.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Seçili Rolün Başlığı ve Bilgilendirme Notu */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              <span className="text-emerald-700 font-extrabold">{currentRoleConfig.roleName}</span> Rolü İçin İzin Yapılandırması
            </h4>
            <p className="text-xs text-slate-500">
              {currentRoleConfig.description}
            </p>
          </div>
        </div>

        {selectedRole === 'admin' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Root / Süper Yönetici Korumalı</span>
          </span>
        )}
      </div>

      {/* BÖLÜM 1: GÖRÜNTÜLENEBİLİR MENÜ SEKMELELERİ */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              <span>Görüntülenebilir Menü Sekmeleri (Yan Menü Erişimi)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Bu role sahip personelin sol yan menüde hangi sayfaları görüp erişebileceğini belirleyin.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {currentRoleConfig.allowedTabs.length} / {APP_TABS_META.length} Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {APP_TABS_META.map(tab => {
            const Icon = getTabIcon(tab.id);
            const isAllowed = currentRoleConfig.allowedTabs.includes(tab.id);

            return (
              <div
                key={tab.id}
                onClick={() => handleToggleTab(tab.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isAllowed
                    ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isAllowed ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${isAllowed ? 'text-slate-900' : 'text-slate-600'}`}>
                      {tab.label}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                      {tab.description}
                    </p>
                  </div>
                </div>

                {/* Switch Butonu */}
                <div className="shrink-0 pl-2">
                  <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    isAllowed ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center ${
                      isAllowed ? 'translate-x-5' : 'translate-x-0'
                    }`}>
                      {isAllowed && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BÖLÜM 2: EYLEM & İŞLEM YETKİLERİ (GRUP BAZLI) */}
      <div className="space-y-4">
        {PERMISSION_GROUPS.map(group => {
          return (
            <div 
              key={group.id}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4"
            >
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{group.title}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {group.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {group.items.map(perm => {
                  const isEnabled = !!currentRoleConfig.permissions[perm.key];
                  const assignedUserIds = currentRoleConfig.assignedUsers?.[perm.key] || [];
                  const assignedProfiles = profiles.filter(p => assignedUserIds.includes(p.id));
                  const isSpecificAssignable = selectedRole === 'teacher' || selectedRole === 'dept_head';

                  return (
                    <div
                      key={perm.key}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isEnabled
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : assignedUserIds.length > 0
                          ? 'bg-teal-50/40 border-teal-200'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${isEnabled ? 'text-slate-900' : 'text-slate-700'}`}>
                            {perm.label}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                            {perm.description}
                          </p>
                        </div>

                        {/* Switch Butonu (Tüm Role Aç/Kapat) */}
                        <div 
                          onClick={() => handleTogglePermission(perm.key)}
                          className="shrink-0 pl-2 cursor-pointer"
                          title={`Tüm ${currentRoleConfig.roleName} için ${isEnabled ? 'kapat' : 'aç'}`}
                        >
                          <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                            isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}>
                              {isEnabled && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Kişi Bazlı Özel Yetkilendirme Alanı */}
                      {isSpecificAssignable && (
                        <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-500 font-medium">
                              {isEnabled ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Tüm {currentRoleConfig.roleName} için yetkili
                                </span>
                              ) : assignedProfiles.length > 0 ? (
                                <span className="text-teal-800 font-bold flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                                  {assignedProfiles.length} Kişiye Özel Yetki Verildi
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  Kişi bazlı yetki atanmadı
                                </span>
                              )}
                            </span>

                            {!isEnabled && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAssigningPermKey(perm.key);
                                  setAssignSearch('');
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <UserPlus className="w-3 h-3 text-teal-600" />
                                <span>{assignedProfiles.length > 0 ? 'Kişileri Düzenle' : 'Belirli Kişileri Yetkilendir'}</span>
                              </button>
                            )}
                          </div>

                          {/* Seçili Yetkili Kişilerin Çipleri */}
                          {!isEnabled && assignedProfiles.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {assignedProfiles.map(prof => (
                                <span 
                                  key={prof.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-teal-200 text-teal-950 shadow-2xs"
                                >
                                  <span>{prof.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAssignedUser(perm.key, prof.id)}
                                    className="hover:text-rose-600 text-slate-400 font-bold cursor-pointer ml-0.5"
                                    title="Yetkiyi Kaldır"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kişi Bazlı Yetkilendirme Modalı */}
      {assigningPermKey && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Başlığı */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  <span>Özel Yetkili Personel Seçimi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  <strong>{findPermLabel(assigningPermKey)}</strong> yetkisinin atanacağı {currentRoleConfig.roleName} personellerini seçiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningPermKey(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Arama ve Hızlı Seçim */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Personel adı veya branş ara..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{filteredEligible.length} personel listeleniyor</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = filteredEligible.map(p => p.id);
                      setLocalPermissions(prev => ({
                        ...prev,
                        [selectedRole]: {
                          ...prev[selectedRole],
                          assignedUsers: {
                            ...(prev[selectedRole]?.assignedUsers || {}),
                            [assigningPermKey]: Array.from(new Set([...(prev[selectedRole]?.assignedUsers?.[assigningPermKey] || []), ...allIds]))
                          }
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                  >
                    Tümünü Seç
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalPermissions(prev => ({
                        ...prev,
                        [selectedRole]: {
                          ...prev[selectedRole],
                          assignedUsers: {
                            ...(prev[selectedRole]?.assignedUsers || {}),
                            [assigningPermKey]: []
                          }
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="text-slate-600 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Temizle
                  </button>
                </div>
              </div>
            </div>

            {/* Personel Listesi */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1">
              {filteredEligible.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Aramanıza uygun personel bulunamadı.
                </div>
              ) : (
                filteredEligible.map(profile => {
                  const isAssigned = (currentRoleConfig.assignedUsers?.[assigningPermKey] || []).includes(profile.id);
                  const dept = DEPARTMENTS.find(d => d.id === profile.departmentId);

                  return (
                    <div
                      key={profile.id}
                      onClick={() => handleToggleAssignedUser(assigningPermKey, profile.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isAssigned
                          ? 'bg-teal-50/60 border-teal-300 ring-1 ring-teal-400/30'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">
                          {profile.avatar ? (
                            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                          ) : (
                            profile.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {profile.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400 truncate">
                              {profile.email}
                            </span>
                            {dept && (
                              <span 
                                style={{ backgroundColor: `${dept.color}15`, color: dept.color }}
                                className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                              >
                                {dept.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isAssigned ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isAssigned && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Altı */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                {(currentRoleConfig.assignedUsers?.[assigningPermKey] || []).length} personel seçildi
              </span>
              <button
                type="button"
                onClick={() => setAssigningPermKey(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
