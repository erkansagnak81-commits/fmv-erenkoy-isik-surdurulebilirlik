/**
 * FMV Erenköy Işık Lisesi ve Fen Lisesi
 * EcoCampus Sürdürülebilirlik Portalı - Resmi Kullanım Kılavuzu ve Teknik Dokümantasyon PDF İndiricisi
 */

export const MANUAL_PDF_URL = '/FMV_Erenkoy_Isik_Surdurulebilirlik_Kullanim_Kilavuzu.pdf';
export const MANUAL_PDF_FILENAME = 'FMV_Erenkoy_Isik_Surdurulebilirlik_Kullanim_Kilavuzu.pdf';

export function downloadManualPdf(): void {
  const link = document.createElement('a');
  link.href = MANUAL_PDF_URL;
  link.download = MANUAL_PDF_FILENAME;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
