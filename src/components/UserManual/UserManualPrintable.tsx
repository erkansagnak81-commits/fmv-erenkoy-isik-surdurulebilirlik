import React from 'react';
import ReactDOM from 'react-dom';
import { MANUAL_METADATA, MANUAL_SECTIONS } from './manualData';
import { 
  Sparkles, 
  Users, 
  FolderKanban, 
  BarChart3, 
  Cpu, 
  ShieldCheck, 
  HelpCircle,
  TreePine,
  Flame,
  Award,
  CheckCircle2
} from 'lucide-react';

/**
 * Tek Tuşla Kullanım Kılavuzunu ve Teknik Dokümantasyonu PDF Olarak Yazdırma / İndirme Yardımcısı
 */
export const printUserManual = () => {
  document.body.classList.add('printing-manual');
  
  const handleAfterPrint = () => {
    document.body.classList.remove('printing-manual');
    window.removeEventListener('afterprint', handleAfterPrint);
  };
  
  window.addEventListener('afterprint', handleAfterPrint);
  
  // Desteklemeyen tarayıcılar için zaman aşımı emniyeti
  setTimeout(() => {
    document.body.classList.remove('printing-manual');
  }, 4000);

  window.print();
};

export const UserManualPrintable: React.FC = () => {
  if (typeof document === 'undefined') return null;

  const portalTarget = document.body;

  const content = (
    <div id="user-manual-print-portal" className="text-slate-900 bg-white leading-relaxed text-[11pt]">
      {/* 1. RESMİ KAPAK SAYFASI */}
      <div className="min-h-[270mm] flex flex-col justify-between p-12 border-4 border-emerald-800 rounded-3xl relative page-break">
        {/* Üst Logo ve Kurum Bilgisi */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-emerald-800/40 pb-6">
            <div>
              <p className="text-sm font-bold tracking-widest text-emerald-900 uppercase">
                {MANUAL_METADATA.parentFoundation}
              </p>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                {MANUAL_METADATA.institution}
              </h1>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md">
              1885
            </div>
          </div>

          <div className="pt-4">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs uppercase tracking-wider border border-emerald-300">
              {MANUAL_METADATA.portalTitle}
            </span>
          </div>
        </div>

        {/* Orta: Büyük Başlık ve İkon */}
        <div className="my-auto py-12 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-800 to-teal-700 text-white flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-amber-300" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">
              {MANUAL_METADATA.docTitle}
            </h2>
            <p className="text-base text-slate-600 font-medium max-w-xl">
              Tüm Akademik Zümreler, İdari Birimler, IB DP &amp; CAS Koordinatörlüğü ve Okul Yönetimi İçin Kapsamlı İşlevsel ve Teknik Sistem Rehberi
            </p>
          </div>

          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
            <p className="font-bold">Kapsanan Standartlar &amp; Yönetmelikler:</p>
            <p>• BM 17 Sürdürülebilir Kalkınma Amacı (2030 Küresel Gündemi)</p>
            <p>• T.C. Sıfır Atık Yönetmeliği &amp; MEB Çevre ve İklim Değişikliği Yönergesi</p>
            <p>• Uluslararası Yeşil Kampüs / Eko-Okullar Akreditasyonu &amp; GHG Protocol</p>
          </div>
        </div>

        {/* Alt: Versiyon, Tarih ve İmza Künyesi */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-slate-500 font-semibold">Doküman Sürümü:</p>
            <p className="font-bold text-slate-800">{MANUAL_METADATA.version}</p>
            <p className="text-slate-500 font-semibold mt-2">Yayın Tarihi:</p>
            <p className="font-bold text-slate-800">{MANUAL_METADATA.lastUpdated}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-slate-500 font-semibold">Hazırlayan &amp; Onaylayan:</p>
            <p className="font-bold text-emerald-900">{MANUAL_METADATA.preparedBy}</p>
            <p className="font-bold text-slate-800">{MANUAL_METADATA.approvedBy}</p>
          </div>
        </div>
      </div>

      {/* 2. İÇİNDEKİLER TABLOSU */}
      <div className="p-10 page-break">
        <div className="border-b-2 border-emerald-800 pb-4 mb-8">
          <h2 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">
            İçindekiler Tablosu
          </h2>
          <p className="text-xs text-slate-500 mt-1">Kullanım Kılavuzu &amp; Teknik Dokümantasyon Bölüm Dizini</p>
        </div>

        <div className="space-y-4">
          {MANUAL_SECTIONS.map((sec) => (
            <div key={sec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                  {sec.number}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{sec.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{sec.summary}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 shrink-0">Bölüm {sec.number}</span>
            </div>
          ))}
        </div>

        {/* Hızlı Bilgi Notu */}
        <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-700" />
            <span>Kullanıcı ve Denetçi Notu:</span>
          </p>
          <p className="leading-relaxed">
            Bu doküman, FMV Erenköy Işık Lisesi ve Fen Lisesi bünyesinde yürütülen EcoCampus portalının hem günlük operasyonel süreçlerini (öğretmen ve bölüm başkanları için) hem de teknik mimarisini, veri tabanı kurallarını ve karbon hesaplama yöntemlerini (denetçiler ve yöneticiler için) eksiksiz olarak içermektedir.
          </p>
        </div>
      </div>

      {/* 3. TÜM BÖLÜMLERİN DETAYLI İÇERİĞİ */}
      {MANUAL_SECTIONS.map((section) => (
        <div key={section.id} className="p-10 page-break space-y-6">
          {/* Bölüm Başlığı */}
          <div className="border-b-2 border-emerald-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-emerald-800 text-white font-black text-sm">
                BÖLÜM {section.number}
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {section.title}
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest hidden sm:inline">
              FMV Erenköy Işık EcoCampus
            </span>
          </div>

          {/* Özet Kartı */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs font-medium text-emerald-950">
            {section.summary}
          </div>

          {/* Ana Metin */}
          <div className="space-y-4 text-xs leading-relaxed text-slate-700">
            {section.content.split('\n\n').map((paragraph, pIdx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={pIdx} className="text-sm font-bold text-slate-900 pt-3 border-l-4 border-emerald-600 pl-2.5">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('```')) {
                const code = paragraph.replace(/```[a-z]*\n?/g, '');
                return (
                  <pre key={pIdx} className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px] overflow-x-auto leading-normal">
                    {code}
                  </pre>
                );
              }
              return (
                <p key={pIdx} className="whitespace-pre-line">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Varsa Alt Bölümler */}
          {section.subsections && section.subsections.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              {section.subsections.map((sub, sIdx) => (
                <div key={sIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      {sub.title}
                    </h4>
                    {sub.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {sub.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-line font-mono bg-white p-3 rounded-lg border border-slate-200">
                    {sub.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* 4. RESMİ İMZA VE AKREDİTASYON DENETİM SAYFASI */}
      <div className="p-10 page-break space-y-8">
        <div className="border-b-2 border-emerald-800 pb-4">
          <h2 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">
            Resmi Onay, İmza ve Akreditasyon Taahhüdü
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            İşbu dokümantasyon, FMV Erenköy Işık Lisesi ve Fen Lisesi Sürdürülebilirlik Komisyonu ve Okul Müdürlüğü tarafından resmi standart olarak kabul edilmiştir.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-3 leading-relaxed">
          <h3 className="font-extrabold text-sm text-emerald-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-700" />
            <span>Kurumsal Sürdürülebilirlik ve Sıfır Atık Taahhütnamesi</span>
          </h3>
          <p>
            FMV Erenköy Işık Lisesi ve Fen Lisesi olarak; Birleşmiş Milletler Sürdürülebilir Kalkınma Amaçları doğrultusunda, öğrencilerimize doğaya saygılı, küresel sorunlara duyarlı ve çözüm üreten bir çevre bilinci kazandırmayı taahhüt ederiz.
          </p>
          <p>
            EcoCampus platformunda toplanan enerji, su, kağıt ve geri dönüşüm verileri ile zümre projelerimiz şeffaf olarak izlenmekte, her eğitim-öğretim yılı sonunda bağımsız denetime hazır hale getirilmektedir.
          </p>
        </div>

        {/* 3'lü İmza Bloğu */}
        <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
            <p className="font-bold text-slate-900">Sürdürülebilirlik Koordinatörlüğü</p>
            <p className="text-slate-500 text-[11px]">FMV Erenköy Işık Lisesi ve Fen Lisesi</p>
            <div className="h-16 flex items-end justify-center">
              <span className="text-slate-400 text-[10px]">İmza / Tarih</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
            <p className="font-bold text-slate-900">Bilişim Teknolojileri Zümresi</p>
            <p className="text-slate-500 text-[11px]">Sistem Mimarı &amp; Altyapı</p>
            <div className="h-16 flex items-end justify-center">
              <span className="text-slate-400 text-[10px]">İmza / Tarih</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
            <p className="font-bold text-slate-900">Okul Müdürlüğü</p>
            <p className="text-slate-500 text-[11px]">FMV Erenköy Işık Lisesi ve Fen Lisesi</p>
            <div className="h-16 flex items-end justify-center">
              <span className="text-slate-400 text-[10px]">Mühür / İmza</span>
            </div>
          </div>
        </div>

        {/* Belge Alt Bilgisi */}
        <div className="pt-10 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
          <p>FMV Erenköy Işık Lisesi ve Fen Lisesi • Rıdvanpaşa Sok. No:16 34734 Erenköy - Kadıköy / İstanbul</p>
          <p>Telefon: (0216) 411 39 23 • E-posta: surdurulebilirlik@fmvisik.k12.tr • Web: https://sdg-erenkoy.web.app</p>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, portalTarget);
};
