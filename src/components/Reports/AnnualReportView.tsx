import React, { useState } from 'react';
import { ProjectEvent, CurriculumIntegration, CampusMetric, AcademicYear } from '../../types';
import { DEPARTMENTS } from '../../constants';
import { calculateCarbonAnalysis } from '../../lib/carbonCalculator';
import { exportProjectsToCsv, exportCurriculumsToCsv, exportCampusMetricsToCsv } from '../../lib/exportUtils';
import { 
  Printer, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle,
  Clock,
  Award,
  Download,
  Flame,
  TreePine
} from 'lucide-react';

interface AnnualReportViewProps {
  projects: ProjectEvent[];
  curriculums: CurriculumIntegration[];
  metrics: CampusMetric[];
  activeAcademicYear?: AcademicYear;
}

export const AnnualReportView: React.FC<AnnualReportViewProps> = ({
  projects,
  curriculums,
  metrics,
  activeAcademicYear,
}) => {
  // Rapor Kapsamı: 'year' (Aktif Eğitim-Öğretim Yılı) veya 'all' (Tüm Yıllar / Kümülatif)
  const [scopeMode, setScopeMode] = useState<'year' | 'all'>('year');

  // Dönemsel Filtrelenmiş Veriler
  const scopedProjects = React.useMemo(() => {
    if (scopeMode === 'year' && activeAcademicYear) {
      return projects.filter(p => 
        p.startDate >= activeAcademicYear.startDate && p.startDate <= activeAcademicYear.endDate
      );
    }
    return projects;
  }, [projects, scopeMode, activeAcademicYear]);

  const scopedMetrics = React.useMemo(() => {
    if (scopeMode === 'year' && activeAcademicYear) {
      const startMonth = activeAcademicYear.startDate.slice(0, 7);
      const endMonth = activeAcademicYear.endDate.slice(0, 7);
      return metrics.filter(m => m.period >= startMonth && m.period <= endMonth);
    }
    return metrics;
  }, [metrics, scopeMode, activeAcademicYear]);

  const scopedCurriculums = React.useMemo(() => {
    if (scopeMode === 'year' && activeAcademicYear) {
      return curriculums.filter(c => 
        !c.academicTerm || 
        c.academicTerm.includes(activeAcademicYear.id) || 
        c.academicTerm.includes(activeAcademicYear.name)
      );
    }
    return curriculums;
  }, [curriculums, scopeMode, activeAcademicYear]);

  const completedProjects = scopedProjects.filter(p => p.status === 'completed' || p.status === 'coordinator_approved');
  const totalStudents = scopedCurriculums.reduce((s, c) => s + c.studentCount, 0) +
    scopedProjects.reduce((s, p) => s + (p.impactReport?.actualParticipants || 0), 0);

  const totalRecycledKg = scopedMetrics.reduce((s, m) => 
    s + m.recyclingPaperKg + m.recyclingPlasticKg + m.recyclingGlassKg + m.recyclingMetalKg + m.compostOrganicKg + m.specialEwasteKg, 0
  );
  const totalCompostKg = scopedMetrics.reduce((s, m) => s + m.compostOrganicKg, 0);
  const totalElectricityKwh = scopedMetrics.reduce((s, m) => s + m.electricityKwh, 0);
  const totalWaterM3 = scopedMetrics.reduce((s, m) => s + m.waterM3, 0);
  const totalPaperReams = scopedMetrics.reduce((s, m) => s + m.paperReams, 0);

  // Karbon Ayak İzi Analizi
  const carbonAnalysis = calculateCarbonAnalysis(scopedMetrics, activeAcademicYear?.totalStudents || 850);

  const deptsWithCurriculum = DEPARTMENTS.filter(dept => scopedCurriculums.some(c => c.departmentId === dept.id));
  const currDeptsCount = deptsWithCurriculum.length;
  const missingCurriculumDepts = DEPARTMENTS.filter(d => !scopedCurriculums.some(c => c.departmentId === d.id));

  const totalActiveDepts = DEPARTMENTS.filter(dept =>
    scopedProjects.some(p => p.departmentId === dept.id) || scopedCurriculums.some(c => c.departmentId === dept.id)
  ).length;

  const isEcoCommitteeOk = completedProjects.length > 0 || scopedProjects.length > 0;
  const isStudentEngagementOk = totalStudents > 0;
  const isCurriculumOk = currDeptsCount === DEPARTMENTS.length;
  const isResourceTrackingOk = scopedMetrics.length > 0 && (totalElectricityKwh > 0 || totalWaterM3 > 0);
  const isZeroWasteOk = totalRecycledKg > 0;
  const isAnnualReportingOk = (activeAcademicYear !== undefined || scopedProjects.length > 0) && (completedProjects.length > 0 || scopedCurriculums.length > 0);

  const criteria = [
    {
      title: 'FMV Erenköy Işık Sürdürülebilirlik Kurulu ve Çevre İlkesi',
      ok: isEcoCommitteeOk,
      statusText: isEcoCommitteeOk ? 'Kurul Aktif' : 'Faaliyet Bekleniyor',
      detail: isEcoCommitteeOk
        ? `${completedProjects.length} onaylı faaliyet yürütüldü, koordinatörlük ve kurul onay akışı devrede.`
        : 'Sürdürülebilirlik kurulu karar mekanizmasında onaylanmış proje girişi bekleniyor.',
    },
    {
      title: '7 Akademik Bölümün Müfredat Entegrasyonu',
      ok: isCurriculumOk,
      statusText: isCurriculumOk ? `${currDeptsCount}/${DEPARTMENTS.length} Zümre Tamam` : `${currDeptsCount}/${DEPARTMENTS.length} Zümre`,
      detail: isCurriculumOk
        ? `Tüm zümrelerin ders planlarına toplam ${scopedCurriculums.length} sürdürülebilirlik kazanımı entegre edildi.`
        : `${currDeptsCount} zümre giriş yaptı. Kalan ${missingCurriculumDepts.length} zümrenin (${missingCurriculumDepts.map(d => d.code).join(', ')}) kazanım girişi bekleniyor.`,
    },
    {
      title: 'Öğrenci Temsilciliği ve Gençlik Sürdürülebilirlik Çalışmaları',
      ok: isStudentEngagementOk,
      statusText: isStudentEngagementOk ? `${totalStudents.toLocaleString('tr-TR')} Öğrenci` : 'Veri Bekleniyor',
      detail: isStudentEngagementOk
        ? `Öğrenci temsilcileri ve öğrenci kulüpleri öncülüğünde ${totalStudents.toLocaleString('tr-TR')} öğrenciye temas edildi.`
        : 'Proje ve ders içi çalışmalarda öğrenci katılım verisi girilmelidir.',
    },
    {
      title: 'Aylık Kampüs Elektrik, Su ve Kağıt Tüketim Takibi',
      ok: isResourceTrackingOk,
      statusText: isResourceTrackingOk ? `${scopedMetrics.length} Aylık Kayıt` : 'Sayaç Verisi Yok',
      detail: isResourceTrackingOk
        ? `${scopedMetrics.length} aylık dönemde ${totalElectricityKwh.toLocaleString('tr-TR')} kWh elektrik, ${totalWaterM3.toLocaleString('tr-TR')} m³ su, ${totalPaperReams.toLocaleString('tr-TR')} top kağıt izlendi.`
        : 'Yeşil Kampüs Metrikleri sekmesinden dönemsel sayaç ve fatura verileri girilmelidir.',
    },
    {
      title: 'Sıfır Atık, Yemekhane Kompostu ve Geri Dönüşüm Envanteri',
      ok: isZeroWasteOk,
      statusText: isZeroWasteOk ? `${totalRecycledKg.toLocaleString('tr-TR')} kg Ayrıştırıldı` : 'Kayıt Bekleniyor',
      detail: isZeroWasteOk
        ? `Toplam ${totalRecycledKg.toLocaleString('tr-TR')} kg atık ayrıştırıldı (${totalCompostKg > 0 ? `${totalCompostKg.toLocaleString('tr-TR')} kg kompost dahil` : 'organik kompost tartımı bekleniyor'}).`
        : 'Geri dönüşüm ve yemekhane kompost envanter tartımları girilmelidir.',
    },
    {
      title: 'Yıllık Şeffaf Raporlama ve Paydaş Katılımı',
      ok: isAnnualReportingOk,
      statusText: isAnnualReportingOk ? 'Denetime Hazır' : 'Veri Toplanıyor',
      detail: isAnnualReportingOk
        ? `${scopeMode === 'year' ? (activeAcademicYear?.name || 'Seçili Yıl') : 'Tüm Dönemler'} verileri konsolide edildi, okul idaresi ve denetim onayına sunuldu.`
        : 'Yıllık raporlama için yeterli dönemsel proje ve müfredat verisi toplanıyor.',
    },
  ];

  const fulfilledCount = criteria.filter(c => c.ok).length;
  const totalCriteria = criteria.length;
  const compliancePercentage = Math.round((fulfilledCount / totalCriteria) * 100);
  const isAccreditationReady = fulfilledCount === totalCriteria;

  const handlePrint = () => {
    window.print();
  };

  const handleExportAllReports = () => {
    exportProjectsToCsv(scopedProjects, DEPARTMENTS);
    setTimeout(() => exportCurriculumsToCsv(scopedCurriculums, DEPARTMENTS), 300);
    setTimeout(() => exportCampusMetricsToCsv(scopedMetrics), 600);
  };

  return (
    <div className="space-y-6">
      {/* Yazdırma CSS Kuralı */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-break-avoid { break-inside: avoid; page-break-inside: avoid; }
          body { background: white !important; }
        }
      `}</style>

      {/* Üst Eylem Çubuğu (Yazdırırken Gizlenir) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Yıllık Sürdürülebilirlik &amp; Akreditasyon Raporu
            </h2>
            {activeAcademicYear && scopeMode === 'year' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {activeAcademicYear.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            T.C. Sıfır Atık Belgesi, MEB ve Uluslararası Yeşil Kampüs Akreditasyonları resmi rapor çıktısı
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Kapsam Değiştirici */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setScopeMode('year')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scopeMode === 'year'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif Eğitim Yılı
            </button>
            <button
              onClick={() => setScopeMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scopeMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tüm Yıllar
            </button>
          </div>

          <button
            onClick={handleExportAllReports}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Tüm rapor tablolarını Excel / CSV olarak indir"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Excel Dökümü</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır / PDF Kaydet</span>
          </button>
        </div>
      </div>

      {/* Resmi Rapor Belgesi (A4 Görünümü) */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-lg space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Rapor Başlığı */}
        <div className="flex flex-col items-center text-center pb-6 border-b-2 border-slate-200 space-y-3">
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
              {scopeMode === 'year' && activeAcademicYear ? activeAcademicYear.name : 'Tüm Dönemler Kümülatif'} Değerlendirmesi
              {scopeMode === 'year' && activeAcademicYear && ` (${activeAcademicYear.startDate.split('-').reverse().join('.')} – ${activeAcademicYear.endDate.split('-').reverse().join('.')})`}
            </p>
          </div>
        </div>

        {/* 1. Yönetici Özeti & Ekolojik Vizyon */}
        <div className="space-y-3 page-break-avoid">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-l-4 border-emerald-600 pl-3">
            1. Yönetici Özeti &amp; Ekolojik Vizyon
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            FMV Erenköy Işık Lisesi ve Fen Lisesi olarak, 1885'ten bu yana süregelen köklü eğitim geleneğimizi 
            Birleşmiş Milletler Sürdürülebilir Kalkınma Amaçları (SKA) ve Sıfır Atık ilkeleriyle harmanlayarak 
            7 akademik zümremizin katılımıyla sürdürülebilir bir ekosistem oluşturduk. 
            Bu dönem içerisinde okulumuzda toplam <strong>{scopedProjects.length} adet proje ve atölye</strong> yürütülmüş, 
            <strong> {scopedCurriculums.length} farklı derste</strong> sürdürülebilirlik kazanımları müfredata işlenmiş ve 
            kampüs genelinde <strong>{totalStudents.toLocaleString('tr-TR')} öğrenciye</strong> aktif olarak temas edilmiştir.
            {scopedMetrics.length > 0 && (
              <> Kampüs sıfır atık ve geri dönüşüm uygulamalarımız sayesinde <strong>{carbonAnalysis.avoidedEmissionsTons} tCO₂e karbon salımı önlenmiş</strong> ve <strong>~{carbonAnalysis.treesSavedCount} yetişkin ağacın kesilmesi engellenmiştir.</strong></>
            )}
          </p>
        </div>

        {/* Temel Başarı Göstergeleri */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 page-break-avoid">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Aktif Proje</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{completedProjects.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Müfredat Eşleşmesi</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{scopedCurriculums.length} Ders</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Geri Dönüştürülen</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">{totalRecycledKg.toLocaleString('tr-TR')} kg</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Aktif Zümre</span>
            <p className="text-2xl font-black text-blue-800 mt-1">{totalActiveDepts} / {DEPARTMENTS.length} Zümre</p>
          </div>
        </div>

        {/* YENİ: Karbon & Kaynak Verimliliği Göstergesi */}
        {scopedMetrics.length > 0 && (
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2 page-break-avoid">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-700" />
                <span>Dönemsel Karbon Dengesi &amp; Ağaç Koruma Bilançosu</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-800">
                {carbonAnalysis.recordedMonthsCount} Aylık Tüketim Analizi
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-slate-400 text-[10px]">Brüt Emisyon</span>
                <p className="font-black text-slate-800 text-base">{carbonAnalysis.grossEmissionsTons} tCO₂e</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-emerald-700 text-[10px] font-bold">Önlenen Emisyon</span>
                <p className="font-black text-emerald-700 text-base">-{carbonAnalysis.avoidedEmissionsTons} tCO₂e</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-slate-500 text-[10px]">Net Karbon Yükü</span>
                <p className="font-black text-slate-900 text-base">{carbonAnalysis.netEmissionsTons} tCO₂e</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-emerald-800 text-[10px] font-bold flex items-center justify-center gap-1">
                  <TreePine className="w-3 h-3 text-emerald-600" />
                  <span>Kurtarılan Ağaç</span>
                </span>
                <p className="font-black text-emerald-800 text-base">~{carbonAnalysis.treesSavedCount} Adet</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Zümrelerin ve Bölüm Başkanlarının Katkısı */}
        <div className="space-y-3 page-break-avoid">
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
                  const deptProj = scopedProjects.filter(p => p.departmentId === dept.id).length;
                  const deptCurr = scopedCurriculums.filter(c => c.departmentId === dept.id).length;
                  const isDeptActive = deptProj > 0 || deptCurr > 0;
                  return (
                    <tr key={dept.id}>
                      <td className="p-3 font-semibold text-slate-900">{dept.name}</td>
                      <td className="p-3 text-slate-600 font-medium">{dept.headName}</td>
                      <td className="p-3">{deptProj} Proje</td>
                      <td className="p-3">{deptCurr} Kazanım</td>
                      <td className="p-3 text-right">
                        {isDeptActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            Giriş Bekleniyor
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Öne Çıkan Çalışmalar ve Öğrenci Katılımı */}
        <div className="space-y-3 page-break-avoid">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-l-4 border-emerald-600 pl-3">
            3. Örnek Saha Çalışmaları, Kulüpler ve Etki Çıktıları
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedProjects.slice(0, 4).map(project => (
              <div key={project.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{project.title}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold shrink-0">
                    {project.eventType}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{project.description}</p>
                {project.studentClub && (
                  <p className="text-[11px] font-semibold text-amber-800">
                    Sorumlu Kulüp: {project.studentClub}
                  </p>
                )}
                {project.impactReport && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <p className="font-semibold text-emerald-800">
                      Sonuç: {project.impactReport.actualParticipants} Katılımcı • {project.impactReport.impactMetricValue} {project.impactReport.impactMetricUnit}
                    </p>
                    {project.impactReport.evaluationNotes && (
                      <p className="text-slate-500 text-[11px] italic">"{project.impactReport.evaluationNotes}"</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Yeşil Kampüs ve Kurumsal Akreditasyon Kriter Karnesi */}
        <div className="space-y-4 page-break-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-l-4 border-emerald-600 pl-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
                4. Yeşil Kampüs &amp; Kurumsal Akreditasyon Kriter Karnesi
              </h3>
              <p className="text-[11px] text-slate-500">
                T.C. Sıfır Atık Yönetmeliği, MEB ve Uluslararası Yeşil Kampüs (Green Campus) standartları uygunluk değerlendirmesi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isAccreditationReady 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {isAccreditationReady ? (
                  <>
                    <Award className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Kurumsal Akreditasyona Hazır (%100 - {fulfilledCount}/{totalCriteria})</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Hazırlık Devam Ediyor (%{compliancePercentage} - {fulfilledCount}/{totalCriteria} Karşılandı)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {criteria.map((crit, idx) => (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                  crit.ok 
                    ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950 shadow-sm' 
                    : 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    {crit.ok ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{crit.title}</span>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                    crit.ok 
                      ? 'bg-emerald-200/70 text-emerald-800' 
                      : 'bg-amber-200/80 text-amber-900'
                  }`}>
                    {crit.statusText}
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed pl-6 ${
                  crit.ok ? 'text-slate-600' : 'text-amber-800 font-medium'
                }`}>
                  {crit.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Onay ve İmza Bloğu */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs page-break-avoid">
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
