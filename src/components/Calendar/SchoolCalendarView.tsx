import React, { useState, useMemo } from 'react';
import { ProjectEvent, UserProfile, AcademicYear } from '../../types';
import { DEPARTMENTS, SDG_GOALS, parseTargetGrades } from '../../constants';
import { ProjectDetailModal } from '../Projects/ProjectDetailModal';
import { 
  CalendarDays, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  MapPin, 
  User, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  School, 
  GraduationCap, 
  Atom, 
  List, 
  Grid3X3, 
  X, 
  Eye, 
  Printer, 
  Award,
  FileText
} from 'lucide-react';

interface SchoolCalendarViewProps {
  projects: ProjectEvent[];
  currentUser: UserProfile;
  onOpenReportModal?: (project: ProjectEvent) => void;
  activeAcademicYear?: AcademicYear;
}

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const WEEK_DAYS = [
  { short: 'Pzt', full: 'Pazartesi' },
  { short: 'Sal', full: 'Salı' },
  { short: 'Çar', full: 'Çarşamba' },
  { short: 'Per', full: 'Perşembe' },
  { short: 'Cum', full: 'Cuma' },
  { short: 'Cmt', full: 'Cumartesi' },
  { short: 'Paz', full: 'Pazar' },
];

export const SchoolCalendarView: React.FC<SchoolCalendarViewProps> = ({
  projects,
  currentUser,
  onOpenReportModal,
  activeAcademicYear,
}) => {
  // Sadece Koordinatör Onayı almış (resmi takvimde yayında) ve tamamlanmış projeler takvimde herkese açık gösterilir
  const approvedProjects = useMemo(() => {
    return projects.filter(p => 
      p.status === 'coordinator_approved' || p.status === 'completed'
    );
  }, [projects]);

  // Takvim ayı ve yılı durumu
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<ProjectEvent | null>(null);

  // Yazdırma Kapsamı: 'month' (Seçili Ay) veya 'all' (Tüm Dönem)
  const [printScope, setPrintScope] = useState<'month' | 'all'>('month');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Ay değiştirme fonksiyonları
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAcademicYearStart = () => {
    if (activeAcademicYear?.startDate) {
      const parts = activeAcademicYear.startDate.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        setCurrentDate(new Date(y, m, 1));
        return;
      }
    }
    setCurrentDate(new Date(currentYear, 8, 1));
  };

  // Filtrelenmiş onaylı etkinlikler
  const filteredProjects = useMemo(() => {
    return approvedProjects.filter(project => {
      const matchesDept = departmentFilter === 'all' || project.departmentId === departmentFilter;
      const matchesType = eventTypeFilter === 'all' || project.eventType === eventTypeFilter;
      const matchesSearch = 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.advisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.collaboratingTeachers?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesDept && matchesType && matchesSearch;
    });
  }, [approvedProjects, departmentFilter, eventTypeFilter, searchTerm]);

  // Mevcut ay içindeki onaylı etkinlikler
  const currentMonthProjects = useMemo(() => {
    return filteredProjects.filter(p => {
      if (!p.startDate) return false;
      const d = new Date(p.startDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [filteredProjects, currentYear, currentMonth]);

  // Çıktıda yer alacak etkinlikler (Seçili ay veya tüm dönem)
  const printableProjects = useMemo(() => {
    const list = printScope === 'month' ? currentMonthProjects : filteredProjects;
    return [...list].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [printScope, currentMonthProjects, filteredProjects]);

  // Aylık takvim günleri hesaplama
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Pazar günü ise

    const totalDaysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const days = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
      });
    }

    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, i),
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth + 1, i),
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredProjects.filter(p => {
      if (!p.startDate) return false;
      const start = p.startDate;
      const end = p.endDate || p.startDate;
      return dateStr >= start && dateStr <= end;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDepartmentColor = (deptId: string) => {
    switch (deptId) {
      case 'dept-fen': return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500' };
      case 'dept-mat': return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' };
      case 'dept-turk': return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' };
      case 'dept-sos': return { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' };
      case 'dept-dil': return { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300', dot: 'bg-teal-500' };
      case 'dept-uyg': return { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300', dot: 'bg-rose-500' };
      case 'dept-pdr': return { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300', dot: 'bg-cyan-500' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-300', dot: 'bg-slate-500' };
    }
  };

  const agendaProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateA - dateB;
    });
  }, [filteredProjects]);

  const handlePrint = () => {
    window.print();
  };

  // Tarih biçimlendirme yardımcısı (Örn: 18.09.2026 Cuma)
  const formatTurkishDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const dayName = WEEK_DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]?.full || '';
      return `${day}.${month}.${year} ${dayName}`;
    } catch {
      return dateStr;
    }
  };

  // Profesyonel Resmi Çıktı Belgesi Bileşeni
  const renderOfficialPrintDocument = () => (
    <div className="w-full bg-white text-slate-900 print:text-black font-sans text-xs space-y-4">
      {/* Kurumsal Üst Bilgi / Başlık */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
        <div>
          <span className="text-[10px] tracking-widest text-slate-500 uppercase block font-bold">
            T.C. MİLLÎ EĞİTİM BAKANLIĞI
          </span>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
            FMV ERENKÖY IŞIK LİSESİ VE FEN LİSESİ
          </h1>
          <p className="text-xs font-semibold text-emerald-800">
            Sürdürülebilirlik Koordinatörlüğü ve Çevre Yönetim Kurulu
          </p>
        </div>

        <div className="text-right space-y-0.5 text-[11px]">
          <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded text-[10px] border border-emerald-300">
            RESMİ ONAYLI TAKVİM
          </span>
          <div className="text-slate-600 font-medium">Doküman No: <strong>FMV-EY-SRD-{activeAcademicYear?.id || '2026-2027'}</strong></div>
          <div className="text-slate-500">Çıktı Tarihi: {new Date().toLocaleDateString('tr-TR')}</div>
        </div>
      </div>

      {/* Belge Başlığı & Kapsam Bilgileri */}
      <div className="bg-slate-100/90 p-3 rounded-lg border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <h2 className="font-extrabold text-sm uppercase text-slate-900">
            {printScope === 'month' 
              ? `${MONTH_NAMES[currentMonth].toUpperCase()} ${currentYear} SÜRDÜRÜLEBİLİRLİK FAALİYET TAKVİMİ`
              : `${activeAcademicYear?.name ? activeAcademicYear.name.toUpperCase() : '2026-2027'} EĞİTİM ÖĞRETİM YILI FAALİYET VE ETKİNLİK ÇİZELGESİ`}
          </h2>
          <span className="text-slate-600 font-medium">
            Kapsam: {departmentFilter === 'all' ? 'Tüm Akademik Zümreler (Okul Geneli)' : `${DEPARTMENTS.find(d => d.id === departmentFilter)?.name} Zümresi`}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-700 shrink-0">
          <div>
            Toplam Faaliyet: <span className="text-emerald-800 font-black">{printableProjects.length} Adet</span>
          </div>
          <div>
            Durum: <span className="text-slate-900 font-bold">Resmi Yayında</span>
          </div>
        </div>
      </div>

      {/* Resmi Çizelge Tablosu */}
      {printableProjects.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
          Seçilen dönem ve filtre kriterlerinde onaylı etkinlik bulunmamaktadır.
        </div>
      ) : (
        <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
          <thead>
            <tr className="bg-slate-200/80 text-slate-900 font-bold border-b border-slate-300">
              <th className="p-2 border border-slate-300 w-8 text-center">No</th>
              <th className="p-2 border border-slate-300 w-28">Tarih &amp; Gün</th>
              <th className="p-2 border border-slate-300">Faaliyet / Proje Başlığı &amp; Amacı</th>
              <th className="p-2 border border-slate-300 w-20">Tür</th>
              <th className="p-2 border border-slate-300 w-24">Zümre</th>
              <th className="p-2 border border-slate-300 w-40">Danışman &amp; Ortak Görevliler</th>
              <th className="p-2 border border-slate-300 w-28">Hedef Kitle</th>
              <th className="p-2 border border-slate-300 w-28">Uygulama Yeri</th>
              <th className="p-2 border border-slate-300 w-16 text-center">BM SKA</th>
            </tr>
          </thead>
          <tbody>
            {printableProjects.map((project, idx) => {
              const dept = DEPARTMENTS.find(d => d.id === project.departmentId);
              const parsedGrades = parseTargetGrades(project.targetGrades || []);

              return (
                <tr 
                  key={project.id} 
                  className={`border-b border-slate-300 print-break-inside-avoid ${idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}`}
                >
                  <td className="p-2 border border-slate-300 text-center font-bold text-slate-600">
                    {idx + 1}
                  </td>
                  <td className="p-2 border border-slate-300 font-semibold text-slate-900 whitespace-nowrap">
                    {formatTurkishDate(project.startDate)}
                    {project.endDate && project.endDate !== project.startDate && (
                      <div className="text-[10px] text-slate-500 font-normal">
                        Bitiş: {formatTurkishDate(project.endDate)}
                      </div>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300">
                    <div className="font-bold text-slate-900 text-xs">{project.title}</div>
                    <div className="text-slate-600 text-[10px] line-clamp-2 mt-0.5 leading-snug">
                      {project.description}
                    </div>
                  </td>
                  <td className="p-2 border border-slate-300 font-medium">
                    {project.eventType}
                  </td>
                  <td className="p-2 border border-slate-300 font-semibold text-slate-800">
                    {dept?.code || dept?.name}
                  </td>
                  <td className="p-2 border border-slate-300">
                    <div className="font-bold text-slate-900">
                      {project.advisorName}
                    </div>
                    {project.collaboratingTeachers && project.collaboratingTeachers.length > 0 && (
                      <div className="text-teal-800 text-[10px] font-medium mt-0.5">
                        Ortak: {project.collaboratingTeachers.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300">
                    {parsedGrades.isAllSchool ? (
                      <span className="font-semibold text-slate-800">Tüm Okul</span>
                    ) : (
                      <div className="space-y-0.5 text-[10px]">
                        {parsedGrades.liseGrades.length > 0 && (
                          <div>Lise: {parsedGrades.liseGrades.join(', ')}</div>
                        )}
                        {parsedGrades.fenGrades.length > 0 && (
                          <div>Fen: {parsedGrades.fenGrades.join(', ')}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300 text-slate-700">
                    {project.location}
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-emerald-800">
                    {project.sdgGoals?.map(n => `SKA ${n}`).join(', ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Resmi Onay ve İmza Blokları (Çıktının En Altında Yer Alır) */}
      <div className="pt-6 mt-4 border-t border-slate-300 print-break-inside-avoid">
        <div className="grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-8">
            <div>
              <span className="font-bold text-slate-800 block">Hazırlayan</span>
              <span className="text-slate-500 text-[11px]">Danışman / Zümre Temsilcisi</span>
            </div>
            <div className="text-slate-400 text-[10px]">İmza: .......................................</div>
          </div>

          <div className="space-y-8">
            <div>
              <span className="font-bold text-slate-800 block">İnceleyen ve Onaylayan</span>
              <span className="text-emerald-800 font-bold text-[11px]">Erkan SAĞNAK</span>
              <span className="text-slate-500 text-[10px] block">Sürdürülebilirlik Koordinatörü</span>
            </div>
            <div className="text-slate-400 text-[10px]">İmza / Mühür: .......................................</div>
          </div>

          <div className="space-y-8">
            <div>
              <span className="font-bold text-slate-800 block">Tasdik Eden</span>
              <span className="text-slate-800 font-bold text-[11px]">Okul Yönetimi</span>
              <span className="text-slate-500 text-[10px] block">Okul Müdürü</span>
            </div>
            <div className="text-slate-400 text-[10px]">Onay / Mühür: .......................................</div>
          </div>
        </div>

        <div className="mt-6 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span>Bu resmi çizelge FMV Erenköy Işık Lisesi ve Fen Lisesi Sürdürülebilirlik Yönetim Sistemi üzerinden koordinatör onayıyla üretilmiştir.</span>
          <span>© 1885 Feyziye Mektepleri Vakfı</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. SADECE YAZDIRIRKEN GÖRÜNEN RESMİ DOKÜMAN (Tüm ekran karmaşasından izole, A4 Formatı) */}
      <div className="hidden print:block print-only w-full">
        {renderOfficialPrintDocument()}
      </div>

      {/* 2. EKRANDA KULLANICININ GÖRDÜĞÜ İNTERAKTİF TAKVİM ARAYÜZÜ (Yazdırırken Gizlenir: no-print) */}
      <div className="no-print space-y-6 animate-in fade-in duration-200">
        {/* Üst Bilgi Başlığı */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Resmi Onaylı Okul Etkinlik Takvimi • Herkese Açık</span>
                </div>
                {activeAcademicYear && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/20 text-xs font-semibold backdrop-blur-xs">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{activeAcademicYear.name}</span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Okul Sürdürülebilirlik Takvimi
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Bölüm başkanlığı ve koordinatör onayından geçen tüm atölyeler, saha gezileri, seminerler ve 
                farkındalık kampanyaları bu takvimde yayınlanır. Okul genelinde çakışmaları önlemek ve 
                etkinlikleri takip etmek için güncel programı inceleyebilirsiniz.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <span className="block text-2xl font-black text-emerald-400">
                  {approvedProjects.length}
                </span>
                <span className="text-[11px] text-slate-300 font-medium">
                  Resmi Yayında Etkinlik
                </span>
              </div>

              {/* Baskı Önizleme ve Yazdır Butonları */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-white/15"
                  title="Resmi Çıktıyı Önizle"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Çıktı Önizleme</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-lg"
                  title="Profesyonel A4 Çıktı / PDF Al"
                >
                  <Printer className="w-4 h-4" />
                  <span>Takvimi Yazdır</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Kontrol & Filtre Çubuğu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Ay & Yıl Navigasyonu */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                  title="Önceki Ay"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-4 py-1 font-bold text-slate-900 text-sm min-w-[140px] text-center">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>

                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                  title="Sonraki Ay"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleToday}
                className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Bugün
              </button>

              {activeAcademicYear && (
                <button
                  onClick={handleAcademicYearStart}
                  className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  title={`${activeAcademicYear.name} başlangıç dönemine git`}
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dönem Başı ({activeAcademicYear.startDate ? MONTH_NAMES[parseInt(activeAcademicYear.startDate.split('-')[1], 10) - 1] : 'Eylül'})</span>
                </button>
              )}

              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Bu ay <strong className="text-slate-900">{currentMonthProjects.length}</strong> onaylı etkinlik bulunuyor
              </span>
            </div>

            {/* Görünüm Modu Değiştirici: Takvim vs Ajanda */}
            <div className="flex items-center gap-3 self-start lg:self-auto">
              {/* Çıktı Kapsamı Seçimi (Ay veya Tüm Dönem) */}
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700">Yazdırma Kapsamı:</span>
                <select
                  value={printScope}
                  onChange={(e) => setPrintScope(e.target.value as any)}
                  className="bg-transparent font-bold text-emerald-800 focus:outline-none cursor-pointer"
                >
                  <option value="month">Sadece {MONTH_NAMES[currentMonth]} Ayı</option>
                  <option value="all">Tüm Yıl ({approvedProjects.length} Etkinlik)</option>
                </select>
              </div>

              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'calendar'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Aylık Takvim</span>
                </button>
                <button
                  onClick={() => setViewMode('agenda')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'agenda'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Ajanda / Akış</span>
                </button>
              </div>
            </div>
          </div>

          {/* Detaylı Filtreleme Alanı */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
            {/* Arama */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Etkinlik, danışman veya ortak öğretmen ara..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Zümre Filtresi */}
            <div className="w-full sm:w-auto">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">Tüm Zümreler</option>
                {DEPARTMENTS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Etkinlik Türü Filtresi */}
            <div className="w-full sm:w-auto">
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">Tüm Etkinlik Türleri</option>
                <option value="Atölye">Atölye</option>
                <option value="Seminer / Konferans">Seminer / Konferans</option>
                <option value="Saha Gezisi">Saha Gezisi</option>
                <option value="Farkındalık Kampanyası">Farkındalık Kampanyası</option>
                <option value="Yarışma">Yarışma</option>
                <option value="Müfredat İçi Proje">Müfredat İçi Proje</option>
              </select>
            </div>

            {(departmentFilter !== 'all' || eventTypeFilter !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setDepartmentFilter('all');
                  setEventTypeFilter('all');
                  setSearchTerm('');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Filtreleri Sıfırla</span>
              </button>
            )}
          </div>
        </div>

        {/* GÖRÜNÜM 1: AYLIK TAKVİM IZGARASI */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card-soft overflow-hidden">
            {/* Gün Başlıkları (Pzt - Paz) */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold text-slate-700 py-3">
              {WEEK_DAYS.map((wd, i) => (
                <div key={wd.short} className={`${i >= 5 ? 'text-amber-700' : ''}`}>
                  <span className="hidden sm:inline">{wd.full}</span>
                  <span className="sm:hidden">{wd.short}</span>
                </div>
              ))}
            </div>

            {/* Gün Hücreleri (6 Hafta x 7 Gün = 42 Hücre) */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day.date);
                const isCurrentDay = isToday(day.date);

                return (
                  <div
                    key={index}
                    className={`min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2 transition-colors flex flex-col justify-between ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-slate-50/40 text-slate-400'
                    } ${isCurrentDay ? 'bg-emerald-50/20 ring-2 ring-emerald-500 ring-inset z-10' : ''}`}
                  >
                    {/* Gün Başlığı */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                          isCurrentDay
                            ? 'bg-emerald-700 text-white font-black'
                            : day.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200 hidden sm:inline">
                          {dayEvents.length} Etkinlik
                        </span>
                      )}
                    </div>

                    {/* Günün Etkinlik Rozetleri */}
                    <div className="space-y-1 flex-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event) => {
                        const color = getDepartmentColor(event.departmentId);
                        const dept = DEPARTMENTS.find(d => d.id === event.departmentId);

                        return (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`w-full text-left p-1 rounded-md text-[11px] font-semibold transition-all border ${color.bg} ${color.border} ${color.text} hover:scale-[1.02] hover:shadow-xs truncate flex items-center gap-1 cursor-pointer`}
                            title={`${event.title} - ${dept?.name} (${event.advisorName})`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${color.dot} shrink-0`} />
                            <span className="truncate">{event.title}</span>
                          </button>
                        );
                      })}

                      {dayEvents.length > 3 && (
                        <button
                          onClick={() => setSelectedEvent(dayEvents[3])}
                          className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          +{dayEvents.length - 3} daha...
                        </button>
                      )}
                    </div>

                    {dayEvents.length === 0 && day.isCurrentMonth && (
                      <div className="h-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GÖRÜNÜM 2: AJANDA / KRONOLOJİK AKIŞ */}
        {viewMode === 'agenda' && (
          <div className="space-y-4">
            {agendaProjects.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-card-soft">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Seçili kriterlerde onaylı etkinlik bulunamadı</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Filtreleri sıfırlayarak okul genelindeki tüm onaylı faaliyetleri inceleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agendaProjects.map((project) => {
                  const dept = DEPARTMENTS.find(d => d.id === project.departmentId);
                  const color = getDepartmentColor(project.departmentId);
                  const parsedGrades = parseTargetGrades(project.targetGrades || []);
                  const projectDate = new Date(project.startDate);
                  const isPast = projectDate < new Date();

                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedEvent(project)}
                      className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card-soft hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                    >
                      {/* Sol Tarih Rozeti */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex flex-col items-center justify-center shrink-0 shadow-2xs group-hover:bg-emerald-100 transition-colors">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                            {MONTH_NAMES[projectDate.getMonth()]?.slice(0, 3)}
                          </span>
                          <span className="text-xl font-black text-emerald-950 leading-none mt-0.5">
                            {projectDate.getDate()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {projectDate.getFullYear()}
                          </span>
                        </div>

                        {/* Orta Başlık & Detaylar */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${color.bg} ${color.border} ${color.text}`}>
                              {dept?.name}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                              {project.eventType}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Okul Takviminde Yayında
                            </span>
                            {isPast && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                Tamamlandı
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                            {project.title}
                          </h3>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              Danışman: {project.advisorName}
                            </span>

                            {project.collaboratingTeachers && project.collaboratingTeachers.length > 0 && (
                              <span className="flex items-center gap-1 text-teal-700 font-medium">
                                <Users className="w-3.5 h-3.5 text-teal-600" />
                                Ortak: {project.collaboratingTeachers.join(', ')}
                              </span>
                            )}

                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {project.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sağ: Hedef Kitle & İncele Butonu */}
                      <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="flex flex-wrap gap-1">
                          {parsedGrades.isAllSchool ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                              <School className="w-3 h-3 text-slate-500" />
                              Tüm Okul
                            </span>
                          ) : (
                            <>
                              {parsedGrades.liseGrades.length > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  Lise: {parsedGrades.liseGrades.join(', ')}
                                </span>
                              )}
                              {parsedGrades.fenGrades.length > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                  Fen: {parsedGrades.fenGrades.join(', ')}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(project);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detayları Gör</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ETKİNLİK DETAY MODALI (Zengin Bilgi Kartı ve Medya Galerisi) */}
        <ProjectDetailModal
          project={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onOpenReportModal={onOpenReportModal}
          canEditReport={
            currentUser.role === 'coordinator' ||
            currentUser.role === 'admin' ||
            currentUser.id === selectedEvent?.advisorId ||
            currentUser.name === selectedEvent?.advisorName
          }
        />

        {/* 3. BASKI ÖNİZLEME MODALI (Ekranda A4 Formatını Birebir Görme ve Kontrol Etme) */}
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-100 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-300 overflow-hidden my-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
              {/* Önizleme Başlığı */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold">Resmi Çıktı Baskı Önizlemesi (A4 Yatay Format)</h3>
                    <p className="text-[11px] text-slate-400">
                      Yazıcıya gönderildiğinde veya PDF olarak kaydedildiğinde tam olarak bu şablon basılacaktır.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Hemen Yazdır / PDF</span>
                  </button>

                  <button
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* A4 Kağıdı Görünümü */}
              <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-200">
                <div className="bg-white p-8 rounded-xl shadow-md border border-slate-300 w-full max-w-4xl text-slate-900">
                  {renderOfficialPrintDocument()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
