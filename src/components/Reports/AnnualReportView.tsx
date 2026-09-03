import React from 'react';
import { ProjectEvent, CurriculumIntegration, CampusMetric } from '../../types';
import { DEPARTMENTS } from '../../data/mockData';
import { 
  Printer, 
  Leaf, 
  CheckCircle2, 
  ShieldCheck
} from 'lucide-react';

interface AnnualReportViewProps {
  projects: ProjectEvent[];
  curriculums: CurriculumIntegration[];
  metrics: CampusMetric[];
}

export const AnnualReportView: React.FC<AnnualReportViewProps> = ({
  projects,
  curriculums,
  metrics,
}) => {
  const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'coordinator_approved');
  const totalStudents = curriculums.reduce((s, c) => s + c.studentCount, 0) +
    projects.reduce((s, p) => s + (p.impactReport?.actualParticipants || 0), 0);

  const totalRecycledKg = metrics.reduce((s, m) => 
    s + m.recyclingPaperKg + m.recyclingPlasticKg + m.recyclingGlassKg + m.recyclingMetalKg + m.compostOrganicKg + m.specialEwasteKg, 0
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Üst Eylem Çubuğu (Yazdırırken Gizlenir) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Yıllık Sürdürülebilirlik &amp; Akreditasyon Raporu
          </h2>
          <p className="text-xs text-slate-500">
            Eco-Schools (Yeşil Bayrak), Sıfır Atık Belgesi ve MEB denetimleri için FMV Erenköy Işık Lisesi resmi rapor çıktısı
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Yazdır / PDF Olarak Kaydet</span>
        </button>
      </div>

      {/* Resmi Rapor Belgesi (A4 Görünümü) */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-lg space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Rapor Başlığı & Logo */}
        <div className="flex flex-col items-center text-center pb-6 border-b-2 border-slate-200 space-y-3">
          <img 
            src="/logo.png" 
            alt="FMV Erenköy Işık Lisesi ve Fen Lisesi" 
            className="w-20 h-20 object-contain"
          />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              FEYZİYE MEKTEPLERİ VAKFI • KURULUŞ 1885
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              FMV ERENKÖY IŞIK LİSESİ VE FEN LİSESİ
            </h1>
            <h2 className="text-base sm:text-lg font-bold text-emerald-800">
              YILLIK SÜRDÜRÜLEBİLİRLİK VE ÇEVRE RAPORU
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              2026 - 2027 Eğitim ve Öğretim Yılı Dönemsel Değerlendirmesi
            </p>
          </div>
        </div>

        {/* 1. Yönetici Özeti */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-l-4 border-emerald-600 pl-3">
            1. Yönetici Özeti &amp; Ekolojik Vizyon
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            FMV Erenköy Işık Lisesi ve Fen Lisesi olarak, 130 yılı aşkın köklü eğitim geleneğimizi 
            Birleşmiş Milletler Sürdürülebilir Kalkınma Amaçları (SKA) ve Sıfır Atık ilkeleriyle harmanlayarak 
            tüm zümrelerimizin katılımıyla kapsamlı bir sürdürülebilirlik ekosistemi oluşturduk. 
            Bu dönem içerisinde okulumuzda toplam <strong>{projects.length} adet proje ve atölye</strong> yürütülmüş, 
            <strong> {curriculums.length} farklı derste</strong> sürdürülebilirlik kazanımları doğrudan müfredata işlenmiş ve 
            kampüs genelinde <strong>{totalStudents.toLocaleString('tr-TR')} öğrenciye</strong> aktif olarak temas edilmiştir.
          </p>
        </div>

        {/* Temel Başarı Göstergeleri */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Aktif Proje</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{completedProjects.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Müfredat Eşleşmesi</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{curriculums.length} Ders</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Geri Dönüştürülen</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">{totalRecycledKg.toLocaleString('tr-TR')} kg</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Aktif Zümre</span>
            <p className="text-2xl font-black text-blue-800 mt-1">7 / 7 Zümre</p>
          </div>
        </div>

        {/* 2. Zümrelerin ve Bölüm Başkanlarının Katkısı */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-l-4 border-emerald-600 pl-3">
            2. Bölüm Başkanlıkları ve Zümre Katkıları
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">Bölüm / Zümre</th>
                  <th className="p-3">Bölüm Başkanı</th>
                  <th className="p-3">Proje Sayısı</th>
                  <th className="p-3">Ders Kazanımı</th>
                  <th className="p-3 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DEPARTMENTS.map(dept => {
                  const deptProj = projects.filter(p => p.departmentId === dept.id).length;
                  const deptCurr = curriculums.filter(c => c.departmentId === dept.id).length;
                  return (
                    <tr key={dept.id}>
                      <td className="p-3 font-semibold text-slate-900">{dept.name}</td>
                      <td className="p-3 text-slate-600 font-medium">{dept.headName}</td>
                      <td className="p-3">{deptProj} Proje</td>
                      <td className="p-3">{deptCurr} Kazanım</td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aktif
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Öne Çıkan Çalışmalar */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-l-4 border-emerald-600 pl-3">
            3. Örnek Saha Çalışmaları ve Etki Çıktıları
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedProjects.slice(0, 2).map(project => (
              <div key={project.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{project.title}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    {project.eventType}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{project.description}</p>
                {project.impactReport && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <p className="font-semibold text-emerald-800">
                      Sonuç: {project.impactReport.actualParticipants} Katılımcı • {project.impactReport.impactMetricValue} {project.impactReport.impactMetricUnit}
                    </p>
                    <p className="text-slate-500 text-[11px] italic">"{project.impactReport.evaluationNotes}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Eco-Schools ve Yeşil Bayrak Kriter Karnesi */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-l-4 border-emerald-600 pl-3">
            4. Uluslararası Eco-Schools &amp; Yeşil Bayrak Kriter Karnesi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { title: 'FMV Erenköy Işık Çevre Komitesi ve Eko-İlke', ok: true },
              { title: '7 Akademik Bölümün Müfredat Entegrasyonu', ok: true },
              { title: 'Öğrenci Temsilciliği ve Eko-Tim Çalışmaları', ok: true },
              { title: 'Aylık Kampüs Elektrik, Su ve Kağıt Tüketim Takibi', ok: true },
              { title: 'Sıfır Atık, Yemekhane Kompostu ve Geri Dönüşüm Envanteri', ok: true },
              { title: 'Yıllık Şeffaf Raporlama ve Paydaş Katılımı', ok: true },
            ].map((crit, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{crit.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Onay ve İmza Bloğu */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
          <div className="space-y-1">
            <p className="font-bold text-slate-800">Sürdürülebilirlik Koordinatörlüğü</p>
            <p className="text-slate-500">FMV Erenköy Işık Lisesi ve Fen Lisesi</p>
            <p className="text-[11px] text-slate-400 mt-5">İmza / Mühür: ___________________</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-800">Okul Müdürlüğü</p>
            <p className="text-slate-500">FMV Erenköy Işık Lisesi ve Fen Lisesi</p>
            <p className="text-[11px] text-slate-400 mt-5">İmza / Mühür: ___________________</p>
          </div>
        </div>
      </div>
    </div>
  );
};
