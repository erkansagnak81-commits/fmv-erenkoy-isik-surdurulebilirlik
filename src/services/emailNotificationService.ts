/**
 * E-posta Bildirim Servisi
 * 
 * Google Apps Script Web App üzerinden proje iş akışı bildirimlerini gönderir.
 * Tüm çağrılar ateşle-unut (fire-and-forget) prensibiyle çalışır:
 * başarısız olursa uygulama akışını bozmaz, yalnızca konsola log yazar.
 */

import { DEPARTMENTS } from '../constants';
import type { ProjectEvent, UserProfile } from '../types';

const EMAIL_NOTIFICATION_URL = import.meta.env.VITE_EMAIL_NOTIFICATION_URL || '';
const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://sdg-erenkoy.web.app';

interface EmailPayload {
  action: 'project_submitted' | 'project_approved' | 'project_revision_needed' | 'impact_report_submitted';
  recipientEmail: string;
  recipientName: string;
  projectTitle: string;
  senderName: string;
  departmentName?: string;
  status?: string;
  feedback?: string;
  appUrl: string;
  recipientRole?: 'advisor' | 'dept_head' | 'coordinator';
  advisorName?: string;
}

/**
 * GAS Web App'e POST isteği gönderir (ateşle-unut)
 */
async function sendEmailNotification(payload: EmailPayload): Promise<void> {
  if (!EMAIL_NOTIFICATION_URL) {
    console.warn('[EmailNotification] VITE_EMAIL_NOTIFICATION_URL tanımlanmamış — e-posta gönderilmedi.');
    return;
  }

  try {
    const response = await fetch(EMAIL_NOTIFICATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // GAS CORS uyumu için text/plain
      body: JSON.stringify(payload),
      mode: 'no-cors', // GAS cross-origin kısıtlaması
    });

    // no-cors modunda response.ok her zaman false döner, bu normal
    console.log(`[EmailNotification] E-posta isteği gönderildi → ${payload.recipientEmail} (${payload.action})`);
  } catch (error) {
    console.error('[EmailNotification] E-posta gönderim hatası:', error);
  }
}

/**
 * Bölüm adını döndürür
 */
function getDepartmentName(departmentId: string): string {
  return DEPARTMENTS.find(d => d.id === departmentId)?.name || '';
}

// ═══════════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR — App.tsx'den çağrılacak
// ═══════════════════════════════════════════════════════════════

/**
 * 1. Proje onaya gönderildiğinde → Bölüm Başkanına / IB DP Koordinatörüne bildirim
 */
export function notifyProjectSubmitted(
  project: Pick<ProjectEvent, 'title' | 'departmentId' | 'advisorName'>,
  profiles: UserProfile[]
): void {
  let targetReviewer: UserProfile | undefined;

  if (project.departmentId === 'dept-cas') {
    // CAS projeleri için: Önce dept-cas bölüm başkanı veya isCasCoordinator işaretli profil, yoksa genel koordinatör
    targetReviewer = profiles.find(p => p.role === 'dept_head' && p.departmentId === 'dept-cas')
      || profiles.find(p => Boolean(p.isCasCoordinator))
      || profiles.find(p => p.role === 'coordinator');
  } else {
    // Normal zümre projeleri için: İlgili bölüm başkanı, bulunamazsa genel koordinatör
    targetReviewer = profiles.find(
      p => p.role === 'dept_head' && p.departmentId === project.departmentId
    ) || profiles.find(p => p.role === 'coordinator');
  }

  if (!targetReviewer) {
    console.warn('[EmailNotification] Onaylayıcı yetkili profili bulunamadı:', project.departmentId);
    return;
  }

  sendEmailNotification({
    action: 'project_submitted',
    recipientEmail: targetReviewer.email,
    recipientName: targetReviewer.name,
    projectTitle: project.title,
    senderName: project.advisorName,
    departmentName: getDepartmentName(project.departmentId),
    appUrl: APP_URL,
  });
}

/**
 * 2. Proje onaylandığında bildirim gönder
 * - Bölüm Başkanı onayladığında (dept_approved) -> Danışman Öğretmene + Genel Koordinatöre bildir
 * - Genel Koordinatör onayladığında (coordinator_approved) ->
 *     1. Projeyi oluşturan Danışman Öğretmene (Sonuç raporu hatırlatmasıyla)
 *     2. Projenin bağlı olduğu Bölüm Başkanına / IB DP Koordinatörüne (Sonuç raporu takip hatırlatmasıyla)
 */
export function notifyProjectApproved(
  project: Pick<ProjectEvent, 'title' | 'advisorId' | 'advisorName' | 'departmentId'>,
  approverName: string,
  newStatus: 'dept_approved' | 'coordinator_approved',
  profiles: UserProfile[]
): void {
  const departmentName = getDepartmentName(project.departmentId);

  // Danışman öğretmeni ID ile ara, bulunamazsa isimle eşleştir (fallback güvencesi)
  const advisor = profiles.find(p => p.id === project.advisorId)
    || profiles.find(p => p.name.trim().toLowerCase() === project.advisorName?.trim().toLowerCase());

  // Projenin bağlı olduğu Bölüm Başkanı veya CAS Koordinatörü
  const deptReviewer = project.departmentId === 'dept-cas'
    ? (profiles.find(p => p.role === 'dept_head' && p.departmentId === 'dept-cas') || profiles.find(p => Boolean(p.isCasCoordinator)))
    : profiles.find(p => p.role === 'dept_head' && p.departmentId === project.departmentId);

  // 1. DANIŞMAN ÖĞRETMENE BİLDİRİM (Sonuç Raporu Giriş Hatırlatması)
  if (advisor) {
    sendEmailNotification({
      action: 'project_approved',
      recipientEmail: advisor.email,
      recipientName: advisor.name,
      projectTitle: project.title,
      senderName: approverName,
      departmentName: departmentName,
      status: newStatus,
      recipientRole: 'advisor',
      advisorName: advisor.name,
      appUrl: APP_URL,
    });
  } else {
    console.warn('[EmailNotification] Danışman öğretmen profili bulunamadı:', project.advisorId || project.advisorName);
  }

  // 2. KOORDİNATÖR ONAYINDA -> BÖLÜM BAŞKANINA / IB DP KOORDİNATÖRÜNE BİLDİRİM (Sonuç Raporu Takip Hatırlatması)
  if (newStatus === 'coordinator_approved' && deptReviewer) {
    // Mükerrer gönderim önleme: Danışman öğretmen zaten bölüm başkanıysa veya onaylayan kişi kendisiyse tekrar gönderme
    const isSameAsAdvisor = advisor && deptReviewer.email.toLowerCase() === advisor.email.toLowerCase();
    const isSameAsApprover = deptReviewer.email.toLowerCase() === 'erkan.sagnak@fmvisik.k12.tr';

    if (!isSameAsAdvisor && !isSameAsApprover) {
      sendEmailNotification({
        action: 'project_approved',
        recipientEmail: deptReviewer.email,
        recipientName: deptReviewer.name,
        projectTitle: project.title,
        senderName: approverName,
        departmentName: departmentName,
        status: newStatus,
        recipientRole: 'dept_head',
        advisorName: project.advisorName || advisor?.name || 'Zümre Öğretmeni',
        appUrl: APP_URL,
      });
    }
  }

  // 3. BÖLÜM BAŞKANI ONAYINDA -> GENEL KOORDİNATÖRE BİLDİRİM (Nihai Takvim Onayı Bekleniyor)
  if (newStatus === 'dept_approved') {
    const coordinator = profiles.find(p => p.role === 'coordinator');
    if (coordinator && coordinator.email.toLowerCase() !== deptReviewer?.email.toLowerCase()) {
      sendEmailNotification({
        action: 'project_submitted', // Onay masasında bekleyen proje bildirimi
        recipientEmail: coordinator.email,
        recipientName: coordinator.name,
        projectTitle: project.title,
        senderName: `${approverName} (${departmentName} Bölüm Başkanı Onayladı)`,
        departmentName: departmentName,
        appUrl: APP_URL,
      });
    }
  }
}

/**
 * 3. Revizyon istendiğinde → Danışman öğretmene bildirim
 */
export function notifyProjectRevisionNeeded(
  project: Pick<ProjectEvent, 'title' | 'advisorId' | 'advisorName'>,
  reviewerName: string,
  feedback: string,
  profiles: UserProfile[]
): void {
  // Danışman öğretmeni ID ile ara, bulunamazsa isimle eşleştir
  const advisor = profiles.find(p => p.id === project.advisorId)
    || profiles.find(p => p.name.trim().toLowerCase() === project.advisorName?.trim().toLowerCase());

  if (!advisor) {
    console.warn('[EmailNotification] Danışman öğretmen profili bulunamadı:', project.advisorId || project.advisorName);
    return;
  }

  sendEmailNotification({
    action: 'project_revision_needed',
    recipientEmail: advisor.email,
    recipientName: advisor.name,
    projectTitle: project.title,
    senderName: reviewerName,
    feedback: feedback || '',
    appUrl: APP_URL,
  });
}

/**
 * 4. Sonuç raporu girildiğinde → Koordinatör + Bölüm Başkanına / IB DP Koordinatörüne bildirim
 */
export function notifyImpactReportSubmitted(
  project: Pick<ProjectEvent, 'title' | 'departmentId' | 'advisorName'>,
  senderName: string,
  profiles: UserProfile[]
): void {
  const departmentName = getDepartmentName(project.departmentId);

  // Koordinatöre bildirim
  const coordinator = profiles.find(p => p.role === 'coordinator');
  if (coordinator) {
    sendEmailNotification({
      action: 'impact_report_submitted',
      recipientEmail: coordinator.email,
      recipientName: coordinator.name,
      projectTitle: project.title,
      senderName: senderName,
      departmentName: departmentName,
      appUrl: APP_URL,
    });
  }

  // İlgili bölüm başkanı / IB DP Koordinatörüne bildirim
  const deptReviewer = project.departmentId === 'dept-cas'
    ? (profiles.find(p => p.role === 'dept_head' && p.departmentId === 'dept-cas') || profiles.find(p => Boolean(p.isCasCoordinator)))
    : profiles.find(p => p.role === 'dept_head' && p.departmentId === project.departmentId);

  // Eğer koordinatör ile bölüm başkanı aynı kişi/e-posta değilse gönder (mükerrer e-posta önleme)
  if (deptReviewer && deptReviewer.email.toLowerCase() !== coordinator?.email.toLowerCase()) {
    sendEmailNotification({
      action: 'impact_report_submitted',
      recipientEmail: deptReviewer.email,
      recipientName: deptReviewer.name,
      projectTitle: project.title,
      senderName: senderName,
      departmentName: departmentName,
      appUrl: APP_URL,
    });
  }
}
