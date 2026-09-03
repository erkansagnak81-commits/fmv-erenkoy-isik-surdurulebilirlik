import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  BookOpenCheck, 
  BarChart3, 
  FileBadge,
  Sparkles,
  TreePine
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
  userRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  pendingCount,
  userRole,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Genel Gösterge Paneli',
      icon: LayoutDashboard,
      roles: ['teacher', 'dept_head', 'coordinator'],
    },
    {
      id: 'projects',
      label: 'Proje & Etkinlik Havuzu',
      icon: CalendarDays,
      roles: ['teacher', 'dept_head', 'coordinator'],
    },
    {
      id: 'approvals',
      label: 'Onay Masası',
      icon: CheckSquare,
      badge: pendingCount,
      roles: ['dept_head', 'coordinator'], // Teachers don't need approval queue
    },
    {
      id: 'curriculum',
      label: 'Müfredat & SKA Matrisi',
      icon: BookOpenCheck,
      roles: ['teacher', 'dept_head', 'coordinator'],
    },
    {
      id: 'campus',
      label: 'Yeşil Kampüs Metrikleri',
      icon: BarChart3,
      roles: ['teacher', 'dept_head', 'coordinator'],
    },
    {
      id: 'reports',
      label: 'Eco-Schools & Yıllık Rapor',
      icon: FileBadge,
      roles: ['teacher', 'dept_head', 'coordinator'],
    },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 shrink-0">
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
              {userRole === 'dept_head' && 'Bölüm Başkanı Yetkisi'}
              {userRole === 'coordinator' && 'Koordinatör / Genel Yönetici'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {userRole === 'teacher' && 'Yeni projeler önerin, onaylanan etkinliklerinizi gerçekleştirip etki raporlarını sisteme işleyin.'}
            {userRole === 'dept_head' && 'Zümrenizden gelen projeleri değerlendirin, revizyon isteyin veya koordinatör onayına sevk edin.'}
            {userRole === 'coordinator' && 'Okul genelindeki tüm sürdürülebilirlik faaliyetlerini, SKA dağılımını ve tüketim verilerini kontrol edin.'}
          </p>
        </div>
      </div>

      {/* Alt Kısım: Çevre Mottosu */}
      <div className="pt-4 border-t border-slate-100 flex items-center gap-3 text-slate-500">
        <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
          <TreePine className="w-4 h-4" />
        </div>
        <div className="text-[11px] leading-tight">
          <p className="font-semibold text-slate-700">Gelecek İçin Sürdürülebilirlik</p>
          <p className="text-slate-400">Hedef: 2026-2027 Yeşil Bayrak</p>
        </div>
      </div>
    </aside>
  );
};
