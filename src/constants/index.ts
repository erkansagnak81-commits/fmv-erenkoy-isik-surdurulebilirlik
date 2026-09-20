import { Department, SdgGoal } from '../types';

export const SDG_GOALS: SdgGoal[] = [
  { number: 1, name: 'Yoksulluğa Son', shortName: 'Yoksulluğa Son', color: '#E5243B', iconName: 'HandCoins', description: 'Her tür yoksulluğu her yerde sona erdirmek' },
  { number: 2, name: 'Açlığa Son', shortName: 'Açlığa Son', color: '#DDA63A', iconName: 'Utensils', description: 'Açlığı bitirmek, gıda güvenliğini sağlamak ve sürdürülebilir tarım' },
  { number: 3, name: 'Sağlıklı ve Kaliteli Yaşam', shortName: 'Sağlık & Yaşam', color: '#4C9F38', iconName: 'HeartPulse', description: 'Sağlıklı yaşamları güvence altına almak' },
  { number: 4, name: 'Nitelikli Eğitim', shortName: 'Nitelikli Eğitim', color: '#C5192D', iconName: 'GraduationCap', description: 'Kapsayıcı ve hakkaniyete dayanan nitelikli eğitimi sağlamak' },
  { number: 5, name: 'Toplumsal Cinsiyet Eşitliği', shortName: 'Cinsiyet Eşitliği', color: '#FF3A21', iconName: 'Scale', description: 'Tüm kadınların ve kız çocuklarının güçlenmesi' },
  { number: 6, name: 'Temiz Su ve Sanitasyon', shortName: 'Temiz Su', color: '#26BDE2', iconName: 'Droplets', description: 'Herkes için suyun ve sanitasyonun erişilebilirliği' },
  { number: 7, name: 'Erişilebilir ve Temiz Enerji', shortName: 'Temiz Enerji', color: '#FCC30B', iconName: 'Zap', description: 'Herkes için güvenilir ve modern enerjiye erişim' },
  { number: 8, name: 'İnsana Yakışır İş ve Ekonomik Büyüme', shortName: 'Ekonomik Büyüme', color: '#A21942', iconName: 'Briefcase', description: 'Sürdürülebilir ekonomik büyüme ve istihdam' },
  { number: 9, name: 'Sanayi, Yenilikçilik ve Altyapı', shortName: 'Sanayi & Yenilik', color: '#FD6925', iconName: 'Factory', description: 'Dayanıklı altyapılar inşa etmek, inovasyonu teşvik' },
  { number: 10, name: 'Eşitsizliklerin Azaltılması', shortName: 'Eşitsizlikleri Azalt', color: '#DD1367', iconName: 'EqualNot', description: 'Ülkeler içi ve arasındaki eşitsizlikleri azaltmak' },
  { number: 11, name: 'Sürdürülebilir Şehirler ve Topluluklar', shortName: 'Sürdürülebilir Şehir', color: '#FD9D24', iconName: 'Building2', description: 'Şehirleri kapsayıcı, güvenli ve dayanıklı kılmak' },
  { number: 12, name: 'Sorumlu Üretim ve Tüketim', shortName: 'Sorumlu Tüketim', color: '#BF8B2E', iconName: 'RefreshCw', description: 'Sürdürülebilir tüketim ve üretim kalıplarını sağlamak' },
  { number: 13, name: 'İklim Eylemi', shortName: 'İklim Eylemi', color: '#3F7E44', iconName: 'Flame', description: 'İklim değişikliği ve etkileriyle mücadele etmek' },
  { number: 14, name: 'Sudaki Yaşam', shortName: 'Sudaki Yaşam', color: '#0A97D9', iconName: 'Fish', description: 'Okyanusları, denizleri ve deniz kaynaklarını korumak' },
  { number: 15, name: 'Karasal Yaşam', shortName: 'Karasal Yaşam', color: '#56C02B', iconName: 'Trees', description: 'Karasal ekosistemleri korumak ve iyileştirmek' },
  { number: 16, name: 'Barış, Adalet ve Güçlü Kurumlar', shortName: 'Barış & Adalet', color: '#00689D', iconName: 'ShieldCheck', description: 'Barışçıl ve kapsayıcı toplumları teşvik etmek' },
  { number: 17, name: 'Amaçlar İçin Ortaklıklar', shortName: 'Ortaklıklar', color: '#19486A', iconName: 'Share2', description: 'Küresel ortaklığı canlandırmak' },
];

export const DEPARTMENTS: Department[] = [
  { id: 'dept-fen', name: 'Fen Bilimleri Bölümü', code: 'FEN', color: '#10b981', headName: 'Servet Battal' },
  { id: 'dept-mat', name: 'Matematik Bölümü', code: 'MAT', color: '#8b5cf6', headName: 'Funda Akbulut Demirel' },
  { id: 'dept-edb', name: 'Türk Dili ve Edebiyatı', code: 'EDB', color: '#eab308', headName: 'Pınar Usta Altıner' },
  { id: 'dept-sos', name: 'Sosyal Bilimler', code: 'SOS', color: '#3b82f6', headName: 'Kadir Can Tunay' },
  { id: 'dept-dil', name: 'Yabancı Diller Bölümü', code: 'DIL', color: '#ec4899', headName: 'Eda Nezihe Üçöz' },
  { id: 'dept-uyg', name: 'Uygulamalı Dersler', code: 'UYG', color: '#f97316', headName: 'Işıl Zaza Tozlu' },
  { id: 'dept-bil', name: 'Bilişim Teknolojileri', code: 'BİL', color: '#6366f1', headName: 'Ahmet Salih Taş' },
  { id: 'dept-pdr', name: 'Rehberlik ve Psikolojik Danışmanlık', code: 'PDR', color: '#06b6d4', headName: 'Özlem Sendan' },
];

export const SCHOOL_LEVELS = {
  LISE: {
    id: 'lise',
    name: 'Erenköy Işık Lisesi',
    shortName: 'Işık Lisesi',
    grades: ['Hazırlık', '9', '10', '11', '12'],
  },
  FEN: {
    id: 'fen',
    name: 'Erenköy Işık Fen Lisesi',
    shortName: 'Fen Lisesi',
    grades: ['9', '10', '11', '12'],
  }
} as const;

export interface ParsedTargetGrades {
  liseGrades: string[];
  fenGrades: string[];
  isAllSchool: boolean;
  others: string[];
}

export function parseTargetGrades(targetGrades: string[] = []): ParsedTargetGrades {
  const result: ParsedTargetGrades = {
    liseGrades: [],
    fenGrades: [],
    isAllSchool: false,
    others: [],
  };

  targetGrades.forEach(item => {
    if (item === 'Tüm Okul' || item === 'Kampüs Geneli') {
      result.isAllSchool = true;
    } else if (item.startsWith('Erenköy Işık Lisesi - ')) {
      const g = item.replace('Erenköy Işık Lisesi - ', '').trim();
      if (!result.liseGrades.includes(g)) result.liseGrades.push(g);
    } else if (item.startsWith('Erenköy Işık Fen Lisesi - ')) {
      const g = item.replace('Erenköy Işık Fen Lisesi - ', '').trim();
      if (!result.fenGrades.includes(g)) result.fenGrades.push(g);
    } else if (item === 'Fen Lisesi') {
      SCHOOL_LEVELS.FEN.grades.forEach(g => {
        if (!result.fenGrades.includes(g)) result.fenGrades.push(g);
      });
    } else if (item === 'Hazırlık') {
      if (!result.liseGrades.includes('Hazırlık')) result.liseGrades.push('Hazırlık');
    } else if (['9', '10', '11', '12'].includes(item)) {
      if (!result.liseGrades.includes(item)) result.liseGrades.push(item);
    } else if (item !== 'Veliler') {
      result.others.push(item);
    }
  });

  const hasAllLise = SCHOOL_LEVELS.LISE.grades.every(g => result.liseGrades.includes(g));
  const hasAllFen = SCHOOL_LEVELS.FEN.grades.every(g => result.fenGrades.includes(g));
  if (hasAllLise && hasAllFen) {
    result.isAllSchool = true;
  }

  return result;
}

export const SUPER_ADMIN_EMAILS = [
  'erkan.sagnak@fmvisik.k12.tr',
  'erkansagnak81@gmail.com'
];
export const SUPER_ADMIN_EMAIL = 'erkan.sagnak@fmvisik.k12.tr';
export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.includes(normalized);
};

export const GOOGLE_DRIVE_ARCHIVE_CONFIG = {
  rootFolderUrl: 'https://drive.google.com/drive/folders/1W0oLOb6t_OgIToO57C1OGeejEX1P8EG8?usp=sharing',
  rootFolderId: '1W0oLOb6t_OgIToO57C1OGeejEX1P8EG8',
  folderName: 'Sürdürülebilirlik Projeleri',
  ownerEmail: 'erkan.sagnak@fmvisik.k12.tr',
  scriptWebhookUrl: (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbztD_S6uEnmZR6_UppI6fKUVEjCBrF7RPIf63bdkFQWIeob68NYiLHzgVbIXXXosEvOkQ/exec',
} as const;

/**
 * Google Apps Script Webhook Kodu (script.google.com):
 * Bu kod erkan.sagnak@fmvisik.k12.tr hesabıyla yeni bir Google Apps Script projesi açılarak
 * yapıştırılır ve "Web Uygulaması" (Web App) olarak yayınlanır:
 * - Yürüten: Ben (erkan.sagnak@fmvisik.k12.tr)
 * - Erişebilen: Herkes (veya kurum içi)
 */
export const GOOGLE_APPS_SCRIPT_SAMPLE_CODE = `
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var parentFolderId = data.parentFolderId || "1W0oLOb6t_OgIToO57C1OGeejEX1P8EG8";
    var folderName = data.folderName || "Etkinlik Arşivi";
    
    // Ana klasörü al
    var parentFolder = DriveApp.getFolderById(parentFolderId);
    
    // Var olan klasörü bul veya yeni alt klasör oluştur
    var subFolder;
    if (data.folderId) {
      subFolder = DriveApp.getFolderById(data.folderId);
    } else {
      var existingFolders = parentFolder.getFoldersByName(folderName);
      if (existingFolders.hasNext()) {
        subFolder = existingFolders.next();
      } else {
        subFolder = parentFolder.createFolder(folderName);
      }
    }
    
    // 1. Resumable Upload Oturumu Başlatma (Videolar ve Yüksek Boyutlu Dosyalar İçin - Sınırsız Boyut)
    if (data.action === "createResumableSession") {
      var metadata = {
        name: data.fileName,
        mimeType: data.mimeType || "application/octet-stream",
        parents: [subFolder.getId()]
      };
      var token = ScriptApp.getOAuthToken();
      var res = UrlFetchApp.fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
        method: "POST",
        contentType: "application/json; charset=UTF-8",
        headers: { "Authorization": "Bearer " + token },
        payload: JSON.stringify(metadata),
        muteHttpExceptions: true
      });
      
      var headers = res.getAllHeaders();
      var uploadUrl = headers["Location"] || headers["location"];
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        folderId: subFolder.getId(),
        folderUrl: subFolder.getUrl(),
        uploadUrl: uploadUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. Standart Küçük Dosyalar / Fotoğraflar (Base64 Doğrudan Yükleme)
    var uploadedFiles = [];
    if (data.files && data.files.length > 0) {
      for (var i = 0; i < data.files.length; i++) {
        var fileData = data.files[i];
        var decoded = Utilities.base64Decode(fileData.base64);
        var blob = Utilities.newBlob(decoded, fileData.mimeType, fileData.name);
        var createdFile = subFolder.createFile(blob);
        uploadedFiles.push({
          id: createdFile.getId(),
          name: createdFile.getName(),
          url: createdFile.getUrl()
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      folderId: subFolder.getId(),
      folderUrl: subFolder.getUrl(),
      folderName: folderName,
      files: uploadedFiles
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// BİR KERELİK İZİN VERME FONKSİYONU:
// Apps Script editöründe bu fonksiyonu seçip "Çalıştır" (Run) butonuna basarak
// Google'ın istediği "UrlFetchApp (Dış İstek)" iznini 1 kez onaylamanız yeterlidir.
function testAuthorize() {
  DriveApp.getRootFolder();
  UrlFetchApp.fetch("https://www.google.com");
  Logger.log("İzinler başarıyla onaylandı!");
}
`.trim();

