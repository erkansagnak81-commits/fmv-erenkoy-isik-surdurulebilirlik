import React, { useState } from 'react';
import { UserProfile, UserRole, Department, AcademicYear } from '../../types';
import { DEPARTMENTS } from '../../constants';
import { Sparkles, UserCheck, LogOut, Camera, GraduationCap } from 'lucide-react';
import { ProfileModal } from '../Auth/ProfileModal';
import { AcademicYearModal } from '../Admin/AcademicYearModal';

interface HeaderProps {
  currentUser: UserProfile;
  authUser?: UserProfile | null;
  profiles?: UserProfile[];
  activeTeacherId?: string;
  onRoleChange: (role: UserRole) => void;
  onDepartmentHeadChange?: (dept: Department) => void;
  onTeacherChange?: (teacherId: string) => void;
  pendingCount: number;
  onSyncSeedData?: () => void;
  onClearTestData?: () => Promise<void> | void;
  isSyncing?: boolean;
  onLogout?: () => void;
  onUpdateAvatar?: (newAvatar: string) => Promise<void>;
  activeAcademicYear?: AcademicYear;
  academicYears?: AcademicYear[];
  onSaveAcademicYear?: (year: AcademicYear) => Promise<void>;
  onSetActiveAcademicYear?: (yearId: string) => Promise<void>;
  onExportBackup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  authUser,
  profiles = [],
  activeTeacherId,
  onRoleChange,
  onDepartmentHeadChange,
  onTeacherChange,
  pendingCount,
  onLogout,
  onUpdateAvatar,
  activeAcademicYear,
  academicYears = [],
  onSaveAcademicYear,
  onSetActiveAcademicYear,
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAcademicYearModalOpen, setIsAcademicYearModalOpen] = useState(false);

  // Oturum açmış gerçek kullanıcı
  const realUser = authUser || currentUser;
  const isSuperAdmin = (authUser?.email || currentUser.email).toLowerCase() === 'erkan.sagnak@fmvisik.k12.tr';
  const isSimulating = isSuperAdmin && currentUser.role !== 'coordinator';

  // Seçilen kişinin kimliğini göster (Simülasyon modunda o kişinin sayfası ve bilgisi gösterilir)
  const displayUser = isSimulating ? currentUser : realUser;
  const canManageAcademicYear = currentUser.role === 'coordinator' || isSuperAdmin;

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Sol: Okul Adı ve Portal Başlığı */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              FMV Erenköy Işık Lisesi ve Fen Lisesi
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Sürdürülebilirlik &amp; Çevre Yönetim Portalı (EcoCampus)
          </p>
        </div>

        {/* Sağ: Aktif Eğitim Yılı ve Rol Değiştirici */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Aktif Eğitim-Öğretim Yılı Rozeti (Tüm Kullanıcılar Görür, Koordinatör Düzenleyebilir) */}
          {activeAcademicYear && (
            <div 
              onClick={() => {
                if (canManageAcademicYear && onSaveAcademicYear && onSetActiveAcademicYear) {
                  setIsAcademicYearModalOpen(true);
                }
              }}
              title={canManageAcademicYear 
                ? `Aktif Dönem: ${activeAcademicYear.startDate.split('-').reverse().join('.')} – ${activeAcademicYear.endDate.split('-').reverse().join('.')} (Tarihleri ve Yılı Düzenlemek İçin Tıklayın)` 
                : `Aktif Eğitim-Öğretim Yılı: ${activeAcademicYear.startDate.split('-').reverse().join('.')} – ${activeAcademicYear.endDate.split('-').reverse().join('.')}`
              }
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                canManageAcademicYear
                  ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer shadow-2xs group'
                  : 'bg-slate-100 text-slate-800 border-slate-200 cursor-default'
              }`}
            >
              <div className="w-5 h-5 rounded-lg bg-emerald-600/15 text-emerald-800 flex items-center justify-center shrink-0">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold tracking-tight text-emerald-950">{activeAcademicYear.id}</span>
                <span className="hidden sm:inline text-slate-400">|</span>
                <span className="hidden sm:inline text-slate-600 text-[11px] font-mono font-medium">
                  {activeAcademicYear.startDate.split('-').reverse().join('.')} – {activeAcademicYear.endDate.split('-').reverse().join('.')}
                </span>
              </div>
              {canManageAcademicYear && (
                <span className="hidden md:inline-block text-[10px] bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded-md group-hover:bg-emerald-800 transition shadow-2xs">
                  Yılı Yönet
                </span>
              )}
            </div>
          )}

          {/* Rol Seçici (Yalnızca Erkan Sağnak için Yönetici Önizleme Modu, Diğer Kullanıcılar İçin Sabit Yetki Rozeti) */}
          {isSuperAdmin ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs">
                <span 
                  title="Yönetici Önizleme Modu: Farklı zümre başkanları veya danışman öğretmenlerin ekranını inceleyebilirsiniz."
                  className="text-amber-800 bg-amber-100/80 px-2 py-1 rounded-md font-bold hidden lg:inline-flex items-center gap-1 mr-1"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                  Önizleme Modu:
                </span>

                {/* Danışman Öğretmen Butonu & Kişi Seçici */}
                <div className="relative inline-flex items-center">
                  <button
                    onClick={() => onRoleChange('teacher')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      currentUser.role === 'teacher'
                        ? 'bg-white text-emerald-800 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Danışman Öğretmen</span>
                  </button>

                  {currentUser.role === 'teacher' && onTeacherChange && (
                    <select
                      value={activeTeacherId || currentUser.id}
                      onChange={(e) => onTeacherChange(e.target.value)}
                      className="ml-1 px-1.5 py-1 text-[11px] font-semibold bg-white border border-emerald-300 text-emerald-900 rounded-md focus:outline-none cursor-pointer"
                      title="Hangi Danışman Öğretmen olarak incelemek istediğinizi seçin"
                    >
                      {profiles.filter(p => p.role === 'teacher').map(t => {
                        const dept = DEPARTMENTS.find(d => d.id === t.departmentId);
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} ({dept?.code || t.title || 'Öğretmen'})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Bölüm Başkanı Butonu / Seçici */}
                <div className="relative inline-flex items-center">
                  <button
                    onClick={() => onRoleChange('dept_head')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all relative flex items-center gap-1.5 cursor-pointer ${
                      currentUser.role === 'dept_head'
                        ? 'bg-white text-blue-800 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Bölüm Başkanı</span>
                    {pendingCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    )}
                  </button>

                  {currentUser.role === 'dept_head' && onDepartmentHeadChange && (
                    <select
                      value={currentUser.departmentId}
                      onChange={(e) => {
                        const d = DEPARTMENTS.find(dept => dept.id === e.target.value);
                        if (d) onDepartmentHeadChange(d);
                      }}
                      className="ml-1 px-1.5 py-1 text-[11px] font-semibold bg-white border border-blue-200 text-blue-900 rounded-md focus:outline-none cursor-pointer"
                      title="Hangi Bölüm Başkanı olarak incelemek istediğinizi seçin"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.headName} ({d.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  onClick={() => onRoleChange('coordinator')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentUser.role === 'coordinator'
                      ? 'bg-white text-emerald-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Koordinatör</span>
                </button>
              </div>

              {/* Hızlı Rolüme Dön Butonu */}
              {isSimulating && (
                <button
                  onClick={() => onRoleChange('coordinator')}
                  title="Kendi Koordinatör rolünüze geri dönün"
                  className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 animate-pulse"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>Kendi Rolüme Dön</span>
                </button>
              )}
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {currentUser.role === 'dept_head'
                  ? `${DEPARTMENTS.find(d => d.id === currentUser.departmentId)?.name || 'Bölüm Başkanı'}`
                  : currentUser.role === 'coordinator'
                  ? 'Koordinatör'
                  : 'Danışman Öğretmen'}
              </span>
            </div>
          )}

          {/* Aktif Profil Kartı & Çıkış Yap */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              title={isSimulating ? `${displayUser.name} profili görüntüleniyor (Profil Fotoğrafını Güncellemek İçin Tıklayın)` : "Profil Fotoğrafını Güncellemek İçin Tıklayın"}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-all text-left group cursor-pointer"
            >
              <div className="relative w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs group-hover:ring-2 group-hover:ring-emerald-500 transition-all">
                <img 
                  src={displayUser.avatar || '/logo.png'} 
                  alt={displayUser.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="hidden lg:block text-left text-xs leading-tight">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate max-w-[150px]">
                    {displayUser.name}
                  </p>
                  {isSimulating && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                      {currentUser.role === 'dept_head' ? 'Bölüm Başkanı' : 'Danışman Öğretmen'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">
                  {displayUser.email.toLowerCase() === 'erkan.sagnak@fmvisik.k12.tr'
                    ? 'Sürdürülebilirlik Koordinatörlüğü'
                    : displayUser.email}
                </p>
              </div>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Oturumu Kapat (Başka hesapla giriş yap)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kullanıcının Kendi Profilini Düzenleme Modalı */}
      {onUpdateAvatar && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={realUser}
          onUpdateAvatar={onUpdateAvatar}
        />
      )}

      {/* Eğitim-Öğretim Yılı Yönetim Modalı */}
      {canManageAcademicYear && activeAcademicYear && onSaveAcademicYear && onSetActiveAcademicYear && (
        <AcademicYearModal
          isOpen={isAcademicYearModalOpen}
          onClose={() => setIsAcademicYearModalOpen(false)}
          academicYears={academicYears}
          activeYear={activeAcademicYear}
          onSaveYear={onSaveAcademicYear}
          onSetActiveYear={onSetActiveAcademicYear}
        />
      )}
    </header>
  );
};
