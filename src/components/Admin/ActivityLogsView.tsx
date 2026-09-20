import React, { useState, useMemo } from 'react';
import { ActivityLog, UserProfile, Department, LogCategory } from '../../types';
import { DEPARTMENTS } from '../../constants';
import { exportLogsToCsv } from '../../lib/exportUtils';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Download, 
  Users, 
  Activity, 
  LogIn, 
  LogOut, 
  FolderKanban, 
  BookOpenCheck, 
  BarChart3, 
  Settings, 
  UserCheck, 
  RefreshCw,
  Sparkles,
  AlertCircle,
  Timer,
  Trash2
} from 'lucide-react';

interface ActivityLogsViewProps {
  logs: ActivityLog[];
  currentUser: UserProfile;
  onRefresh?: () => void;
  onClearLogs?: () => void;
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({
  logs = [],
  currentUser,
  onRefresh,
  onClearLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | '7days' | 'month' | 'all'>('all');

  const deptMap = useMemo(() => new Map(DEPARTMENTS.map(d => [d.id, d.name])), []);

  // Tarih Filtresi Fonksiyonu
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return logs.filter(log => {
      // Arama Filtresi
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = log.userName.toLowerCase().includes(q);
        const matchEmail = log.userEmail.toLowerCase().includes(q);
        const matchDesc = log.description.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchDesc) return false;
      }

      // Kategori Filtresi
      if (categoryFilter !== 'all' && log.category !== categoryFilter) {
        return false;
      }

      // Zümre Filtresi
      if (departmentFilter !== 'all' && log.departmentId !== departmentFilter) {
        return false;
      }

      // Tarih Filtresi
      const logDate = new Date(log.timestamp);
      if (dateRangeFilter === 'today') {
        if (log.timestamp.slice(0, 10) !== todayStr) return false;
      } else if (dateRangeFilter === '7days') {
        if (logDate < sevenDaysAgo) return false;
      } else if (dateRangeFilter === 'month') {
        if (logDate < thirtyDaysAgo) return false;
      }

      return true;
    });
  }, [logs, searchTerm, categoryFilter, departmentFilter, dateRangeFilter]);

  // İstatistikler
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLogins = logs.filter(l => l.actionType === 'login' && l.timestamp.slice(0, 10) === todayStr);
    const uniqueUsersToday = new Set(todayLogins.map(l => l.userEmail.toLowerCase())).size;

    // Toplam Oturum Süresi (Saniye)
    const logsWithDuration = logs.filter(l => l.sessionDurationSeconds !== undefined && l.sessionDurationSeconds > 0);
    const totalDurationSeconds = logsWithDuration.reduce((acc, l) => acc + (l.sessionDurationSeconds || 0), 0);
    const avgDurationSeconds = logsWithDuration.length > 0 
      ? Math.round(totalDurationSeconds / logsWithDuration.length) 
      : 0;

    // En Aktif Zümre
    const deptCounts: Record<string, number> = {};
    logs.forEach(l => {
      if (l.departmentId) {
        deptCounts[l.departmentId] = (deptCounts[l.departmentId] || 0) + 1;
      }
    });
    let topDeptId = '';
    let maxDeptCount = 0;
    Object.entries(deptCounts).forEach(([dId, count]) => {
      if (count > maxDeptCount) {
        maxDeptCount = count;
        topDeptId = dId;
      }
    });

    return {
      totalLogs: logs.length,
      todayUsers: uniqueUsersToday,
      totalDurationSeconds,
      avgDurationSeconds,
      topDeptName: topDeptId ? (deptMap.get(topDeptId) || topDeptId) : '—',
      topDeptCount: maxDeptCount
    };
  }, [logs, deptMap]);

  const handleExport = () => {
    exportLogsToCsv(filteredLogs, DEPARTMENTS);
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds <= 0) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours} sa ${minutes} dk`;
    }
    if (minutes > 0) {
      return `${minutes} dk ${remainingSeconds} sn`;
    }
    return `${remainingSeconds} sn`;
  };

  const getActionBadge = (category: LogCategory, actionType: string) => {
    switch (category) {
      case 'auth':
        return actionType === 'login' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <LogIn className="w-3 h-3 text-emerald-600" />
            <span>Giriş Yaptı</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <LogOut className="w-3 h-3 text-slate-500" />
            <span>Çıkış Yaptı</span>
          </span>
        );
      case 'project':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <FolderKanban className="w-3 h-3 text-blue-600" />
            <span>Proje İşlemi</span>
          </span>
        );
      case 'curriculum':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <BookOpenCheck className="w-3 h-3 text-purple-600" />
            <span>Ders Kazanımı</span>
          </span>
        );
      case 'metrics':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
            <BarChart3 className="w-3 h-3 text-teal-600" />
            <span>Yeşil Kampüs</span>
          </span>
        );
      case 'system':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Settings className="w-3 h-3 text-amber-700" />
            <span>Yönetim</span>
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'teacher':
        return <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Öğretmen</span>;
      case 'dept_head':
        return <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">Bölüm Bşk.</span>;
      case 'coordinator':
        return <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200">Koordinatör</span>;
      case 'principal':
        return <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-300">Okul Müdürü</span>;
      case 'admin':
        return <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200">Yönetici</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Gizlilik Mührü */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white tracking-wider uppercase shadow-xs">
                Süper Yönetici Masası
              </span>
              <span className="text-xs text-indigo-200 font-medium">
                Yalnızca Erkan Sağnak Erişebilir
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Aktivite &amp; Güvenlik Günlüğü (Audit Trail)
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Öğretmen ve bölüm başkanlarının sisteme giriş zamanları, çevrimiçi kalma süreleri ve gerçekleştirdikleri tüm işlemler (proje ekleme, onay, revizyon, müfredat) anlık olarak denetlenir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Kayıtları Canlı Yenile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onClearLogs && (
            <button
              onClick={() => {
                if (window.confirm('Tüm aktivite ve güvenlik kayıtlarını temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                  onClearLogs();
                }
              }}
              className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 transition-colors cursor-pointer"
              title="Tüm Log Kayıtlarını Temizle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            title="Tüm log dökümünü Excel/CSV formatında indir"
          >
            <Download className="w-4 h-4" />
            <span>Excel / CSV Dışa Aktar</span>
          </button>
        </div>
      </div>

      {/* Yönetici KPI İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam İşlem */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kayıtlı İşlem</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {stats.totalLogs.toLocaleString('tr-TR')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Sistem başladığından beri</p>
        </div>

        {/* Bugün Aktif Kullanıcı */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bugün Giriş Yapan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-800 mt-2">
            {stats.todayUsers} <span className="text-xs font-semibold text-slate-400">Öğretmen</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Tekil kullanıcı oturumu</p>
        </div>

        {/* Ortalama Online Süre */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ortalama Oturum</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-800 mt-2">
            {stats.avgDurationSeconds > 0 ? formatDuration(stats.avgDurationSeconds) : '—'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Toplam: {formatDuration(stats.totalDurationSeconds)}
          </p>
        </div>

        {/* En Aktif Zümre */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Aktif Zümre</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-base font-black text-purple-950 mt-2 truncate" title={stats.topDeptName}>
            {stats.topDeptName}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.topDeptCount > 0 ? `${stats.topDeptCount} işlem kaydı` : 'Henüz işlem yok'}
          </p>
        </div>
      </div>

      {/* Arama & Filtreleme Çubuğu */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Arama */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Öğretmen adı, e-posta veya işlem detayında ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Tarih Aralığı */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start md:self-auto">
            <button
              onClick={() => setDateRangeFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                dateRangeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setDateRangeFilter('today')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                dateRangeFilter === 'today' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bugün
            </button>
            <button
              onClick={() => setDateRangeFilter('7days')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                dateRangeFilter === '7days' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Son 7 Gün
            </button>
            <button
              onClick={() => setDateRangeFilter('month')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                dateRangeFilter === 'month' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bu Ay
            </button>
          </div>

          {/* Zümre Filtresi */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Tüm Branşlar / Zümreler</option>
            {DEPARTMENTS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Kategori Hapları */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Kategori:</span>
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'auth', label: 'Oturum & Giriş/Çıkış' },
            { id: 'project', label: 'Proje & Faaliyetler' },
            { id: 'curriculum', label: 'Müfredat & SKA' },
            { id: 'metrics', label: 'Yeşil Kampüs' },
            { id: 'system', label: 'Yönetim & Yetkiler' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Tablosu */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900">İşlem &amp; Erişim Zaman Çizelgesi</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filteredLogs.length} Kayıt Gösteriliyor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10.5px]">
              <tr>
                <th className="py-3 px-4 w-44">Tarih &amp; Saat</th>
                <th className="py-3 px-4 w-64">Öğretmen / Kullanıcı</th>
                <th className="py-3 px-4 w-36">İşlem Türü</th>
                <th className="py-3 px-4">Açıklama &amp; Detay</th>
                <th className="py-3 px-4 w-36 text-right">Oturum Süresi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">Henüz Kayıt Bulunamadı</p>
                    <p className="text-xs text-slate-400 mt-0.5">Seçilen filtrelere uyan herhangi bir aktivite logu bulunmuyor.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const logDate = new Date(log.timestamp);
                  const dateStr = logDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const timeStr = logDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const deptName = log.departmentId ? deptMap.get(log.departmentId) : undefined;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Tarih & Saat */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{timeStr}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{dateStr}</div>
                      </td>

                      {/* Kullanıcı */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {log.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 truncate max-w-[140px]" title={log.userName}>
                                {log.userName}
                              </span>
                              {getRoleBadge(log.userRole)}
                            </div>
                            <div className="text-[10.5px] text-slate-400 font-mono truncate max-w-[180px]" title={log.userEmail}>
                                {log.userEmail}
                            </div>
                            {deptName && (
                              <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                {deptName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* İşlem Türü */}
                      <td className="py-3 px-4">
                        {getActionBadge(log.category, log.actionType)}
                      </td>

                      {/* Açıklama & Detay */}
                      <td className="py-3 px-4 text-slate-800">
                        <div className="font-medium leading-relaxed">{log.description}</div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-[10.5px] text-slate-500 mt-0.5 font-mono">
                            {Object.entries(log.details).map(([k, v]) => (
                              <span key={k} className="mr-2 inline-block">
                                <strong className="text-slate-600">{k}:</strong> {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Oturum Süresi */}
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {log.sessionDurationSeconds !== undefined && log.sessionDurationSeconds > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            <Clock className="w-3 h-3 text-indigo-600" />
                            <span>{formatDuration(log.sessionDurationSeconds)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
