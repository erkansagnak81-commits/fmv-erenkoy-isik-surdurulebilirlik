import { ProjectEvent, CurriculumIntegration, CampusMetric, Department, AcademicYear } from '../types';

/**
 * Tarayıcı üzerinden dosya indirmeyi tetikler
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * CSV alanını Excel ile uyumlu şekilde tırnak içine alır ve kaçış karakterlerini düzenler
 */
function escapeCsv(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * 1. Proje & Etkinlik Listesini CSV (Excel uyumlu) Olarak Dışa Aktarır
 */
export function exportProjectsToCsv(projects: ProjectEvent[], departments: Department[]) {
  const deptMap = new Map(departments.map(d => [d.id, d.name]));

  const headers = [
    'Proje / Etkinlik Adı',
    'Akademik Zümre',
    'Danışman Öğretmen',
    'Ortak Öğretmenler',
    'Öğrenci Kulübü',
    'Öğrenci Temsilcileri',
    'Etkinlik Türü',
    'BM SKA Hedefleri',
    'Başlangıç Tarihi',
    'Bitiş Tarihi',
    'Mekan / Konum',
    'Hedef Kitle & Sınıflar',
    'Durum',
    'Katılımcı Sayısı',
    'Öğrenci Katılımcı',
    'Öğretmen Katılımcı',
    'Somut Etki Çıktısı',
    'Değerlendirme Notu',
    'Oluşturulma Tarihi'
  ];

  const statusLabels: Record<string, string> = {
    draft: 'Taslak',
    submitted: 'Bölüm Başkanı Onayında',
    dept_approved: 'Koordinatör Onayında',
    coordinator_approved: 'Okul Takviminde Yayında',
    revision_needed: 'Revizyon İstendi',
    completed: 'Tamamlandı (Etki Raporlu)',
  };

  const rows = projects.map(p => {
    const deptName = deptMap.get(p.departmentId) || p.departmentId;
    const collaborators = (p.collaboratingTeachers || []).join(', ');
    const studentReps = (p.studentRepresentatives || []).join(', ');
    const sdgs = (p.sdgGoals || []).map(g => `SKA ${g}`).join(', ');
    const targetGrades = (p.targetGrades || []).join(', ');
    const status = statusLabels[p.status] || p.status;
    const participants = p.impactReport?.actualParticipants ?? '';
    const studentParts = p.impactReport?.studentParticipants ?? '';
    const teacherParts = p.impactReport?.teacherParticipants ?? '';
    const impactOutput = p.impactReport?.impactMetricValue 
      ? `${p.impactReport.impactMetricValue} ${p.impactReport.impactMetricUnit || ''}` 
      : '';
    const evalNotes = p.impactReport?.evaluationNotes || '';

    return [
      escapeCsv(p.title),
      escapeCsv(deptName),
      escapeCsv(p.advisorName),
      escapeCsv(collaborators),
      escapeCsv(p.studentClub || '—'),
      escapeCsv(studentReps || '—'),
      escapeCsv(p.eventType),
      escapeCsv(sdgs),
      escapeCsv(p.startDate),
      escapeCsv(p.endDate || ''),
      escapeCsv(p.location),
      escapeCsv(targetGrades),
      escapeCsv(status),
      escapeCsv(participants),
      escapeCsv(studentParts),
      escapeCsv(teacherParts),
      escapeCsv(impactOutput),
      escapeCsv(evalNotes),
      escapeCsv(p.createdAt?.slice(0, 10) || '')
    ].join(';');
  });

  // UTF-8 BOM eklenerek Excel'in Türkçe karakterleri düzgün açması sağlanır
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(`FMV_Isik_Surdurulebilirlik_Projeleri_${dateStr}.csv`, csvContent, 'text/csv;charset=utf-8;');
}

/**
 * 2. Müfredat & SKA Entegrasyon Matrisini CSV Olarak Dışa Aktarır
 */
export function exportCurriculumsToCsv(curriculums: CurriculumIntegration[], departments: Department[]) {
  const deptMap = new Map(departments.map(d => [d.id, d.name]));

  const headers = [
    'Ders Adı',
    'Akademik Zümre',
    'Sınıf Düzeyi',
    'Öğretmen',
    'Öğrenme Kazanımı',
    'BM SKA Hedefleri',
    'Ulaşılan Öğrenci Sayısı',
    'Eğitim Dönemi',
    'Etkinlik & Uygulama Açıklaması'
  ];

  const rows = curriculums.map(c => {
    const deptName = deptMap.get(c.departmentId) || c.departmentId;
    const sdgs = (c.sdgGoals || []).map(g => `SKA ${g}`).join(', ');

    return [
      escapeCsv(c.courseName),
      escapeCsv(deptName),
      escapeCsv(c.gradeLevel),
      escapeCsv(c.teacherName),
      escapeCsv(c.learningOutcome),
      escapeCsv(sdgs),
      escapeCsv(c.studentCount),
      escapeCsv(c.academicTerm),
      escapeCsv(c.activityDescription)
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(`FMV_Isik_Mufredat_Matrisi_${dateStr}.csv`, csvContent, 'text/csv;charset=utf-8;');
}

/**
 * 3. Yeşil Kampüs Sayaç ve Sıfır Atık Verilerini CSV Olarak Dışa Aktarır
 */
export function exportCampusMetricsToCsv(metrics: CampusMetric[]) {
  const headers = [
    'Dönem (Yıl-Ay)',
    'Elektrik Tüketimi (kWh)',
    'Su Tüketimi (m³)',
    'Fotokopi / Kağıt (Koli)',
    'Geri Dönüşüm Kağıt (kg)',
    'Plastik Ambalaj (kg)',
    'Cam Şişe / Kavanoz (kg)',
    'Metal Kutu (kg)',
    'Organik Kompost (kg)',
    'E-Atık & Pil (kg)',
    'Toplam Ayrıştırılan Atık (kg)',
    'Dönem Notu'
  ];

  const sorted = [...metrics].sort((a, b) => a.period.localeCompare(b.period));

  const rows = sorted.map(m => {
    const totalRecycled = (m.recyclingPaperKg || 0) + (m.recyclingPlasticKg || 0) + 
      (m.recyclingGlassKg || 0) + (m.recyclingMetalKg || 0) + 
      (m.compostOrganicKg || 0) + (m.specialEwasteKg || 0);

    return [
      escapeCsv(m.period),
      escapeCsv(m.electricityKwh),
      escapeCsv(m.waterM3),
      escapeCsv(m.paperReams),
      escapeCsv(m.recyclingPaperKg),
      escapeCsv(m.recyclingPlasticKg),
      escapeCsv(m.recyclingGlassKg),
      escapeCsv(m.recyclingMetalKg),
      escapeCsv(m.compostOrganicKg),
      escapeCsv(m.specialEwasteKg),
      escapeCsv(totalRecycled),
      escapeCsv(m.notes || '')
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(`FMV_Isik_Yesil_Kampus_Sayac_Verileri_${dateStr}.csv`, csvContent, 'text/csv;charset=utf-8;');
}

/**
 * 4. Sistem Tam Veritabanı Yedeğini (JSON) Dışa Aktarır
 */
export function exportDatabaseBackupJson(data: {
  projects: ProjectEvent[];
  curriculums: CurriculumIntegration[];
  metrics?: CampusMetric[];
  campusMetrics?: CampusMetric[];
  profiles?: any[];
  academicYears?: AcademicYear[];
}) {
  const metricList = data.campusMetrics || data.metrics || [];
  const backupObject = {
    app: 'FMV Erenköy Işık Lisesi ve Fen Lisesi Sürdürülebilirlik Portalı',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    counts: {
      projects: data.projects.length,
      curriculums: data.curriculums.length,
      metrics: metricList.length,
      profiles: data.profiles?.length || 0,
      academicYears: data.academicYears?.length || 0,
    },
    projects: data.projects,
    curriculums: data.curriculums,
    campusMetrics: metricList,
    profiles: data.profiles || [],
    academicYears: data.academicYears || [],
  };

  const jsonStr = JSON.stringify(backupObject, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(`FMV_Isik_Surdurulebilirlik_Yedek_${dateStr}.json`, jsonStr, 'application/json');
}
