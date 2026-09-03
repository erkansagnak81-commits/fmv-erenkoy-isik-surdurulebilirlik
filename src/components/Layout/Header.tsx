import React from 'react';
import { UserProfile, UserRole, Department } from '../../types';
import { DEPARTMENTS } from '../../data/mockData';
import { Database, Sparkles, UserCheck, RefreshCw, ChevronDown } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface HeaderProps {
  currentUser: UserProfile;
  onRoleChange: (role: UserRole) => void;
  onDepartmentHeadChange?: (dept: Department) => void;
  pendingCount: number;
  onSyncSeedData?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onRoleChange,
  onDepartmentHeadChange,
  pendingCount,
  onSyncSeedData,
  isSyncing = false,
}) => {
  const currentDept = DEPARTMENTS.find(d => d.id === currentUser.departmentId);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Sol: FMV Işık Logosu ve Okul Adı */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
            <img 
              src="/logo.png" 
              alt="FMV Erenköy Işık Lisesi ve Fen Lisesi" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                FMV Erenköy Işık Lisesi ve Fen Lisesi
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                1885
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Sürdürülebilirlik &amp; Çevre Yönetim Portalı (EcoCampus)
            </p>
          </div>
        </div>

        {/* Sağ: Supabase Durumu ve Rol Değiştirici */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Supabase Bağlantı Rozeti */}
          <div 
            title={isSupabaseConfigured ? "Supabase bulut veritabanına canlı bağlı" : "Demo veri modu"}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isSupabaseConfigured 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold">
              {isSupabaseConfigured ? 'Supabase: Canlı Bağlı' : 'Demo Modu'}
            </span>
          </div>

          {/* Supabase Örnek Veri Yükleme Butonu */}
          {isSupabaseConfigured && onSyncSeedData && (
            <button
              onClick={onSyncSeedData}
              disabled={isSyncing}
              title="FMV Erenköy Işık zümrelerini ve projelerini Supabase tablolarına aktarır"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden md:inline">{isSyncing ? 'Aktarılıyor...' : 'Verileri Eşitle'}</span>
            </button>
          )}

          {/* Rol Seçici (Simülasyon Barı) */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 px-2 font-medium hidden lg:inline flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              Rol:
            </span>

            <button
              onClick={() => onRoleChange('teacher')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentUser.role === 'teacher'
                  ? 'bg-white text-emerald-800 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Danışman Öğretmen</span>
            </button>

            {/* Bölüm Başkanı Butonu / Seçici */}
            <div className="relative inline-flex items-center">
              <button
                onClick={() => onRoleChange('dept_head')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all relative flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                currentUser.role === 'coordinator'
                  ? 'bg-white text-emerald-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Koordinatör</span>
            </button>
          </div>

          {/* Aktif Profil Kartı */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src={currentUser.avatar || '/logo.png'} 
                alt={currentUser.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <p className="font-semibold text-slate-800">{currentUser.name}</p>
              <p className="text-slate-400 truncate max-w-[150px]">{currentUser.title}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
