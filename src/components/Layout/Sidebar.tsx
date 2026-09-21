import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  BookOpenCheck, 
  BarChart3, 
  FileBadge,
  Sparkles,
  Users,
  FolderKanban,
  Activity
} from 'lucide-react';
import { UserRole, AppTab, SystemRolePermissions, UserProfile } from '../../types';
import { isSuperAdminEmail } from '../../constants';
import { hasUserActionPermission } from '../../constants/permissions';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
  userRole: UserRole;
  currentUserEmail?: string;
  currentUser?: UserProfile;
  rolePermissions?: SystemRolePermissions;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  pendingCount,
  userRole,
  currentUserEmail,
  currentUser,
  rolePermissions,
}) => {
  const isSuperAdmin = isSuperAdminEmail(currentUser?.email || currentUserEmail) || userRole === 'admin';

  const getDashboardLabel = () => {
    if (userRole === 'teacher') return 'Bireysel Panelim';
    if (userRole === 'dept_head') return currentUser?.departmentId === 'dept-cas' ? 'IB DP & CAS Paneli' : 'Zümre Paneli';
    if (userRole === 'principal') return 'Okul Yönetim Paneli';
    return 'Genel Gösterge Paneli';
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: getDashboardLabel(),
      icon: LayoutDashboard,
      roles: ['teacher', 'dept_head', 'coordinator', 'principal', 'admin'],
    },
    {
      id: 'calendar',
      label: 'Okul Takvimi',
      icon: CalendarDays,
      roles: ['teacher', 'dept_head', 'coordinator', 'principal', 'admin'],
    },
    {
      id: 'projects',
      label: 'Proje & Etkinlik Havuzu',
      icon: FolderKanban,
      roles: ['teacher', 'dept_head', 'coordinator', 'principal', 'admin'],
    },
    {
      id: 'approvals',
      label: 'Onay Masası',
      icon: CheckSquare,
      badge: pendingCount,
      roles: ['dept_head', 'coordinator', 'principal', 'admin'], // Teachers don't need approval queue
    },
    {
      id: 'curriculum',
      label: 'Müfredat & SKA Matrisi',
      icon: BookOpenCheck,
      roles: ['teacher', 'dept_head', 'coordinator', 'principal', 'admin'],
    },
    {
      id: 'campus',
      label: 'Yeşil Kampüs Metrikleri',
      icon: BarChart3,
      roles: ['teacher', 'dept_head', 'coordinator', 'principal', 'admin'],
    },
    {
      id: 'reports',
      label: 'Sürdürülebilirlik & Akreditasyon',
      icon: FileBadge,
      roles: ['teacher', 'dept_head', 'coordinator', 'principal', 'admin'],
    },
    {
      id: 'users',
      label: 'Kullanıcı & Rol Yönetimi',
      icon: Users,
      roles: ['coordinator', 'principal', 'admin'],
      superAdminOnly: true,
    },
    {
      id: 'logs',
      label: 'Aktivite & Denetim Günlüğü',
      icon: Activity,
      roles: ['coordinator', 'admin'],
      superAdminOnly: true,
    },
  ];

  const roleConfig = rolePermissions ? rolePermissions[userRole] : null;

  const filteredItems = menuItems.filter(item => {
    if (item.id === 'logs') {
      return Boolean(isSuperAdminEmail(currentUser?.email || currentUserEmail));
    }

    if (item.id === 'users') {
      if (isSuperAdmin) return true;
      return roleConfig ? roleConfig.allowedTabs.includes('users') : false;
    }

    if (item.id === 'campus' && currentUser && rolePermissions) {
      if (hasUserActionPermission(currentUser, 'canEditCampusMetrics', rolePermissions)) {
        return true;
      }
    }

    if (roleConfig) {
      return roleConfig.allowedTabs.includes(item.id as AppTab);
    }

    return item.roles.includes(userRole);
  });

  return (
    <aside className="no-print w-full lg:w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Yönetim Menüsü
          </p>
          <nav className="space-y-1 mt-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 font-semibold shadow-sm border border-emerald-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rol Odaklı Bilgi Notu */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/60">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {userRole === 'teacher' && 'Öğretmen / Danışman Yetkisi'}
              {userRole === 'dept_head' && (currentUser?.departmentId === 'dept-cas' ? 'IB DP Koordinatörü Yetkisi' : 'Bölüm Başkanı Yetkisi')}
              {userRole === 'coordinator' && 'Koordinatör / Genel Yönetici'}
              {userRole === 'principal' && 'Okul Müdürü / Üst Yönetim'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {userRole === 'teacher' && 'Yeni projeler önerin, onaylanan etkinliklerinizi gerçekleştirip etki raporlarını sisteme işleyin.'}
            {userRole === 'dept_head' && (
              currentUser?.departmentId === 'dept-cas'
                ? 'CAS bünyesinde açılan projeleri değerlendirin, revizyon isteyin veya koordinatör onayına sevk edin.'
                : 'Zümrenizden gelen projeleri değerlendirin, revizyon isteyin veya koordinatör onayına sevk edin.'
            )}
            {userRole === 'coordinator' && 'Okul genelindeki tüm sürdürülebilirlik faaliyetlerini, SKA dağılımını ve tüketim verilerini kontrol edin.'}
            {userRole === 'principal' && 'Okul genelindeki tüm sürdürülebilirlik projelerini, onay bekleyen etkinlikleri, müfredat çalışmalarını ve resmi raporları üst düzey yönetici olarak denetleyin.'}
          </p>
        </div>
      </div>
    </aside>
  );
};
