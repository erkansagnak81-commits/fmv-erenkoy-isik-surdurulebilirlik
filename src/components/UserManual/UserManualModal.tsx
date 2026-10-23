import React, { useState, useMemo } from 'react';
import { MANUAL_METADATA, MANUAL_SECTIONS, ManualSection } from './manualData';
import { printUserManual } from './UserManualPrintable';
import { 
  Sparkles, 
  Users, 
  FolderKanban, 
  BarChart3, 
  Cpu, 
  ShieldCheck, 
  HelpCircle,
  Download, 
  Printer, 
  Search, 
  X, 
  ChevronRight, 
  ChevronLeft,
  BookOpen, 
  CheckCircle2,
  ExternalLink,
  Award,
  FileText
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSectionId?: string;
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  Sparkles,
  Users,
  FolderKanban,
  BarChart3,
  Cpu,
  ShieldCheck,
  HelpCircle,
};

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  initialSectionId = 'intro',
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(initialSectionId);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Arama filtrelemesi
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return MANUAL_SECTIONS;
    const query = searchQuery.toLowerCase();
    return MANUAL_SECTIONS.filter(
      (sec) =>
        sec.title.toLowerCase().includes(query) ||
        sec.summary.toLowerCase().includes(query) ||
        sec.content.toLowerCase().includes(query) ||
        sec.subsections?.some(
          (sub) => sub.title.toLowerCase().includes(query) || sub.content.toLowerCase().includes(query)
        )
    );
  }, [searchQuery]);

  const activeSection: ManualSection = useMemo(() => {
    const found = filteredSections.find((s) => s.id === activeSectionId);
    return found || filteredSections[0] || MANUAL_SECTIONS[0];
  }, [filteredSections, activeSectionId]);

  const currentIndex = MANUAL_SECTIONS.findIndex((s) => s.id === activeSection.id);
  const prevSection = currentIndex > 0 ? MANUAL_SECTIONS[currentIndex - 1] : null;
  const nextSection = currentIndex < MANUAL_SECTIONS.length - 1 ? MANUAL_SECTIONS[currentIndex + 1] : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in no-print">
      <div 
        className="bg-white w-full max-w-6xl h-[92vh] max-h-[900px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* 1. ÜST BAŞLIK VE EYLEM ÇUBUĞU */}
        <header className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  {MANUAL_METADATA.institution}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                  {MANUAL_METADATA.version}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {MANUAL_METADATA.docTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Tek Tuşla PDF İndir / Yazdır Butonu */}
            <button
              onClick={() => printUserManual()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Resmi kapak, içindekiler ve teknik formülleri içeren kapsamlı kılavuzu tek tıkla PDF olarak indirin veya yazdırın"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Tek Tuşla PDF İndir</span>
            </button>

            {/* Kapat Butonu */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Kılavuz penceresini kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2. ARAMA VE BİLGİ ŞERİDİ */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kılavuzda ara (örn: karbon, onay, firestore, cas, pwa, drive)..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 overflow-x-auto">
            <span className="flex items-center gap-1 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              7 Kapsamlı Bölüm
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-emerald-800">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              17 BM SKA &amp; Sıfır Atık
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-emerald-800">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              Offline-First &amp; PWA
            </span>
          </div>
        </div>

        {/* 3. ANA GÖVDE: SOL MENÜ + SAĞ İÇERİK */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Sol: Bölüm Listesi */}
          <aside className="w-full md:w-80 bg-slate-50/70 border-r border-slate-200 overflow-y-auto p-3 space-y-1.5 shrink-0">
            <p className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Bölümler ({filteredSections.length})
            </p>

            {filteredSections.map((sec) => {
              const IconComponent = SECTION_ICONS[sec.iconName] || BookOpen;
              const isActive = sec.id === activeSection.id;

              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-700'
                      : 'bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-extrabold uppercase ${isActive ? 'text-amber-300' : 'text-emerald-700'}`}>
                        Bölüm {sec.number}
                      </span>
                    </div>
                    <p className={`text-xs font-bold leading-tight line-clamp-1 mt-0.5 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {sec.shortTitle}
                    </p>
                    <p className={`text-[10px] line-clamp-2 mt-1 leading-snug ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {sec.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Sağ: Aktif Bölüm İçeriği */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white min-h-0">
            {/* Bölüm Başlık Alanı */}
            <div className="border-b border-slate-200 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs">
                  BÖLÜM {activeSection.number}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  EcoCampus Dokümantasyonu
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {activeSection.title}
              </h1>
            </div>

            {/* Özet Kartı */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-xs text-emerald-950 font-medium leading-relaxed">
              {activeSection.summary}
            </div>

            {/* Markdown benzeri Paragraflar ve Kod Blokları */}
            <div className="space-y-4 text-xs md:text-sm leading-relaxed text-slate-700">
              {activeSection.content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-sm md:text-base font-extrabold text-slate-900 pt-4 border-l-4 border-emerald-600 pl-3">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('```')) {
                  const code = paragraph.replace(/```[a-z]*\n?/g, '');
                  return (
                    <div key={idx} className="my-3 rounded-2xl bg-slate-900 text-slate-100 p-4 font-mono text-[11px] overflow-x-auto shadow-inner">
                      <pre>{code}</pre>
                    </div>
                  );
                }
                return (
                  <p key={idx} className="whitespace-pre-line leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Alt Bölümler / Tablolar / Formül Kutuları */}
            {activeSection.subsections && activeSection.subsections.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                {activeSection.subsections.map((sub, sIdx) => (
                  <div key={sIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        {sub.title}
                      </h4>
                      {sub.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {sub.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] sm:text-xs leading-relaxed text-slate-700 whitespace-pre-line font-mono bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
                      {sub.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* İleri / Geri Navigasyon & PDF İndir Banner'ı */}
            <div className="pt-8 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between gap-3">
                {prevSection ? (
                  <button
                    onClick={() => setActiveSectionId(prevSection.id)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Önceki: Bölüm {prevSection.number}</span>
                  </button>
                ) : <div />}

                {nextSection ? (
                  <button
                    onClick={() => setActiveSectionId(nextSection.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Sonraki: Bölüm {nextSection.number}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => printUserManual()}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tüm Kılavuzu PDF Olarak İndir</span>
                  </button>
                )}
              </div>

              {/* Alt Hızlı PDF İndir Çağrısı */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-300">
                    Resmi Akreditasyon ve Arşiv PDF Dokümanı
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Tüm bölümleri, tabloları, formülleri ve onay imza bloğunu içeren A4 baskı formatı hazırdır.
                  </p>
                </div>
                <button
                  onClick={() => printUserManual()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>Tek Tuşla PDF İndir</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
