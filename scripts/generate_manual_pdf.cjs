const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// 1. jsPDF Örneği Başlat (A4 Dikey, mm cinsinden: 210 x 297 mm)
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  compress: true,
});

// 2. Türkçe Karakterleri Destekleyen Arial ve Arial Bold Fontlarını Ekle
const arialPath = 'C:\\Windows\\Fonts\\arial.ttf';
const arialBoldPath = 'C:\\Windows\\Fonts\\arialbd.ttf';

if (fs.existsSync(arialPath)) {
  const arialBase64 = fs.readFileSync(arialPath).toString('base64');
  doc.addFileToVFS('arial.ttf', arialBase64);
  doc.addFont('arial.ttf', 'ArialCustom', 'normal');
}
if (fs.existsSync(arialBoldPath)) {
  const arialBoldBase64 = fs.readFileSync(arialBoldPath).toString('base64');
  doc.addFileToVFS('arialbd.ttf', arialBoldBase64);
  doc.addFont('arialbd.ttf', 'ArialCustom', 'bold');
}

doc.setFont('ArialCustom', 'normal');

// Renk Sabitleri
const COLORS = {
  emeraldDark: [6, 95, 70],      // #065f46
  emeraldMid: [16, 185, 129],    // #10b981
  emeraldLight: [236, 253, 245], // #ecfdf5
  navy: [15, 23, 42],            // #0f172a
  navyLight: [30, 41, 59],       // #1e293b
  amber: [217, 119, 6],          // #d97706
  amberLight: [254, 243, 199],   // #fef3c7
  slateText: [51, 65, 85],       // #334155
  slateMuted: [100, 116, 139],   // #64748b
  borderGray: [226, 232, 240],   // #e2e8f0
  bgLight: [248, 250, 252],      // #f8fafc
  white: [255, 255, 255],
};

let currentPage = 1;
const MARGIN_LEFT = 18;
const MARGIN_RIGHT = 18;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

let cursorY = 25;

// Başlık ve Altbilgi Ekleme Fonksiyonu (Sayfa 2'den itibaren)
function addHeaderFooter(doc, pageNum, totalPagesPlaceholder = false) {
  if (pageNum === 1) return; // Kapakta başlık/altbilgi yok

  // Üst Başlık
  doc.setFont('ArialCustom', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slateMuted);
  doc.text('FMV Erenköy Işık Lisesi ve Fen Lisesi • EcoCampus Portalı Kullanım Kılavuzu', MARGIN_LEFT, 12);
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, 14, PAGE_WIDTH - MARGIN_RIGHT, 14);

  // Altbilgi
  doc.line(MARGIN_LEFT, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 12);
  doc.text('Feyziye Mektepleri Vakfı (1885) • Sürdürülebilirlik & Çevre Yönetim Portalı', MARGIN_LEFT, PAGE_HEIGHT - 8);
  doc.text(`Sayfa ${pageNum}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 8, { align: 'right' });
}

function checkPageBreak(requiredHeight = 20) {
  if (cursorY + requiredHeight > PAGE_HEIGHT - 20) {
    doc.addPage();
    currentPage++;
    cursorY = 22;
  }
}

function addSectionTitle(number, title) {
  checkPageBreak(25);
  doc.setFillColor(...COLORS.emeraldDark);
  doc.roundedRect(MARGIN_LEFT, cursorY, 22, 7, 1.5, 1.5, 'F');
  doc.setFont('ArialCustom', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.white);
  doc.text(`BÖLÜM ${number}`, MARGIN_LEFT + 11, cursorY + 4.8, { align: 'center' });

  doc.setFont('ArialCustom', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.navy);
  doc.text(title, MARGIN_LEFT + 25, cursorY + 5.2);

  cursorY += 10;
  doc.setDrawColor(...COLORS.emeraldDark);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_LEFT, cursorY, PAGE_WIDTH - MARGIN_RIGHT, cursorY);
  cursorY += 6;
}

function addSubTitle(title) {
  checkPageBreak(15);
  doc.setFont('ArialCustom', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.emeraldDark);
  doc.text(title, MARGIN_LEFT, cursorY);
  cursorY += 5;
}

function addParagraph(text, fontSize = 9.5, spacing = 4.5) {
  doc.setFont('ArialCustom', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(...COLORS.slateText);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  for (const line of lines) {
    checkPageBreak(6);
    doc.text(line, MARGIN_LEFT, cursorY);
    cursorY += spacing;
  }
  cursorY += 2;
}

function addBullet(bulletTitle, bulletText) {
  checkPageBreak(10);
  doc.setFont('ArialCustom', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.navy);
  doc.text(`• ${bulletTitle}: `, MARGIN_LEFT + 2, cursorY);
  
  const titleWidth = doc.getTextWidth(`• ${bulletTitle}: `);
  doc.setFont('ArialCustom', 'normal');
  doc.setTextColor(...COLORS.slateText);
  
  const remainingWidth = CONTENT_WIDTH - (titleWidth + 2);
  const lines = doc.splitTextToSize(bulletText, remainingWidth);
  
  doc.text(lines[0], MARGIN_LEFT + 2 + titleWidth, cursorY);
  cursorY += 4.5;
  
  for (let i = 1; i < lines.length; i++) {
    checkPageBreak(6);
    doc.text(lines[i], MARGIN_LEFT + 6, cursorY);
    cursorY += 4.5;
  }
  cursorY += 1;
}

function addCalloutBox(title, text, type = 'emerald') {
  const bgColor = type === 'amber' ? COLORS.amberLight : COLORS.emeraldLight;
  const borderColor = type === 'amber' ? COLORS.amber : COLORS.emeraldMid;
  const titleColor = type === 'amber' ? COLORS.amber : COLORS.emeraldDark;

  doc.setFont('ArialCustom', 'bold');
  doc.setFontSize(9.5);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 8);
  const boxHeight = 10 + (lines.length * 4.5);

  checkPageBreak(boxHeight + 5);

  doc.setFillColor(...bgColor);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN_LEFT, cursorY, CONTENT_WIDTH, boxHeight, 2, 2, 'FD');

  doc.setTextColor(...titleColor);
  doc.text(title, MARGIN_LEFT + 4, cursorY + 5.5);

  doc.setFont('ArialCustom', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.slateText);
  let lineY = cursorY + 10;
  for (const line of lines) {
    doc.text(line, MARGIN_LEFT + 4, lineY);
    lineY += 4.5;
  }

  cursorY += boxHeight + 5;
}

function addTable(headers, rows, colWidths) {
  const rowHeight = 7;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  checkPageBreak(rowHeight * (rows.length + 1) + 8);

  // Header
  doc.setFillColor(...COLORS.emeraldDark);
  doc.rect(MARGIN_LEFT, cursorY, totalWidth, rowHeight, 'F');
  doc.setFont('ArialCustom', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.white);

  let curX = MARGIN_LEFT;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], curX + 2, cursorY + 4.8);
    curX += colWidths[i];
  }
  cursorY += rowHeight;

  // Rows
  doc.setFont('ArialCustom', 'normal');
  doc.setFontSize(8);
  for (let r = 0; r < rows.length; r++) {
    checkPageBreak(rowHeight + 2);
    const row = rows[r];
    const isAlt = r % 2 === 1;
    doc.setFillColor(...(isAlt ? COLORS.bgLight : COLORS.white));
    doc.rect(MARGIN_LEFT, cursorY, totalWidth, rowHeight, 'F');

    doc.setDrawColor(...COLORS.borderGray);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN_LEFT, cursorY, totalWidth, rowHeight, 'D');

    let cellX = MARGIN_LEFT;
    for (let c = 0; c < row.length; c++) {
      doc.setTextColor(...COLORS.slateText);
      const cellText = String(row[c]);
      doc.text(cellText, cellX + 2, cursorY + 4.6);
      cellX += colWidths[c];
    }
    cursorY += rowHeight;
  }
  cursorY += 5;
}

console.log('Generating PDF...');

// ==========================================
// 1. RESMİ KAPAK SAYFASI (PAGE 1)
// ==========================================
doc.setFillColor(...COLORS.emeraldDark);
doc.rect(0, 0, PAGE_WIDTH, 12, 'F'); // Üst şerit

// Dış Çerçeve
doc.setDrawColor(...COLORS.emeraldDark);
doc.setLineWidth(1);
doc.roundedRect(12, 18, PAGE_WIDTH - 24, PAGE_HEIGHT - 32, 4, 4, 'D');

doc.setDrawColor(...COLORS.amber);
doc.setLineWidth(0.4);
doc.roundedRect(14, 20, PAGE_WIDTH - 28, PAGE_HEIGHT - 36, 3, 3, 'D');

// Kurum Başlığı
doc.setFont('ArialCustom', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.amber);
doc.text('FEYZİYE MEKTEPLERİ VAKFI • KURULUŞ 1885', PAGE_WIDTH / 2, 38, { align: 'center' });

doc.setFontSize(18);
doc.setTextColor(...COLORS.navy);
doc.text('FMV ERENKÖY IŞIK LİSESİ VE FEN LİSESİ', PAGE_WIDTH / 2, 47, { align: 'center' });

doc.setFontSize(11);
doc.setTextColor(...COLORS.emeraldDark);
doc.text('EcoCampus Sürdürülebilirlik & Çevre Yönetim Portalı', PAGE_WIDTH / 2, 54, { align: 'center' });

// Dekoratif Çizgi
doc.setDrawColor(...COLORS.emeraldDark);
doc.setLineWidth(0.8);
doc.line(45, 62, PAGE_WIDTH - 45, 62);

// Büyük Başlık Kutusu
doc.setFillColor(...COLORS.emeraldDark);
doc.roundedRect(30, 85, PAGE_WIDTH - 60, 48, 3, 3, 'F');

doc.setFont('ArialCustom', 'bold');
doc.setFontSize(18);
doc.setTextColor(...COLORS.white);
doc.text('KAPSAMLI KULLANIM KILAVUZU', PAGE_WIDTH / 2, 102, { align: 'center' });
doc.text('& TEKNİK SİSTEM DOKÜMANTASYONU', PAGE_WIDTH / 2, 110, { align: 'center' });

doc.setFont('ArialCustom', 'normal');
doc.setFontSize(9.5);
doc.setTextColor(209, 250, 229);
doc.text('Tüm Akademik Zümreler, İdari Birimler ve Okul Yönetimi İçin', PAGE_WIDTH / 2, 120, { align: 'center' });
doc.text('İşlevsel Modül Rehberi, Sistem Mimarisi ve Karbon Emisyon Modeli', PAGE_WIDTH / 2, 125, { align: 'center' });

// Kapsanan Standartlar Rozetleri
doc.setFillColor(...COLORS.bgLight);
doc.setDrawColor(...COLORS.borderGray);
doc.roundedRect(30, 145, PAGE_WIDTH - 60, 50, 2, 2, 'FD');

doc.setFont('ArialCustom', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(...COLORS.emeraldDark);
doc.text('KAPSAM VE UYUMLULUK STANDARTLARI', PAGE_WIDTH / 2, 153, { align: 'center' });

doc.setFont('ArialCustom', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(...COLORS.slateText);
doc.text('• Birleşmiş Milletler 17 Sürdürülebilir Kalkınma Amacı (2030 Küresel Gündemi)', 35, 162);
doc.text('• T.C. Sıfır Atık Yönetmeliği & MEB Çevre ve İklim Değişikliği Yönergesi', 35, 169);
doc.text('• Uluslararası Yeşil Kampüs / Eko-Okullar Akreditasyonu 6 Temel Göstergesi', 35, 176);
doc.text('• GHG Protocol Kurumsal Karbon Ayak İzi Standardı & ISO 14064 Metodolojisi', 35, 183);

// Künye Bilgileri
doc.setFont('ArialCustom', 'bold');
doc.setFontSize(9);
doc.setTextColor(...COLORS.navy);
doc.text('Doküman Sürümü:', 30, 215);
doc.text('Yayın Tarihi:', 30, 222);
doc.text('Hazırlayan:', 30, 229);
doc.text('Onaylayan:', 30, 236);

doc.setFont('ArialCustom', 'normal');
doc.setTextColor(...COLORS.slateText);
doc.text('v2.4.0 (2026-2027 Eğitim-Öğretim Yılı)', 65, 215);
doc.text('Ekim 2026', 65, 222);
doc.text('Sürdürülebilirlik Koordinatörlüğü & Bilişim Zümresi', 65, 229);
doc.text('Okul Müdürlüğü (FMV Erenköy Işık Lisesi ve Fen Lisesi)', 65, 236);

doc.setFont('ArialCustom', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(...COLORS.slateMuted);
doc.text('FMV Erenköy Işık Lisesi ve Fen Lisesi • İstanbul • https://sdg-erenkoy.web.app', PAGE_WIDTH / 2, 265, { align: 'center' });

// ==========================================
// 2. İÇİNDEKİLER TABLOSU (PAGE 2)
// ==========================================
doc.addPage();
currentPage++;
cursorY = 25;

doc.setFont('ArialCustom', 'bold');
doc.setFontSize(16);
doc.setTextColor(...COLORS.emeraldDark);
doc.text('İÇİNDEKİLER DİZİNİ', MARGIN_LEFT, cursorY);
cursorY += 3;
doc.setDrawColor(...COLORS.emeraldDark);
doc.setLineWidth(0.6);
doc.line(MARGIN_LEFT, cursorY, PAGE_WIDTH - MARGIN_RIGHT, cursorY);
cursorY += 8;

const tocItems = [
  { num: '1', title: 'Giriş, Kurumsal Amaç ve Akreditasyon Çerçevesi', desc: 'FMV vizyonu, 17 BM SKA, Sıfır Atık mevzuatı ve 6 akreditasyon kriter karnesi.' },
  { num: '2', title: 'Kullanıcı Rolleri, Hiyerarşi ve Yetki Karşılaştırma Matrisi', desc: 'Danışman Öğretmen, Zümre Başkanı, CAS Koordinatörü, Müdür ve Süper Admin yetkileri.' },
  { num: '3', title: 'Menüler ve Arayüz İşlevleri (Detaylı Modül Kullanım Rehberi)', desc: 'Gösterge panelleri, Proje Havuzu, 2 Aşamalı Onay Masası, Takvim, Etki Raporu ve Drive arşivi.' },
  { num: '4', title: 'Yeşil Kampüs Metrikleri, Sıfır Atık ve Karbon Hesaplama Modeli', desc: 'Elektrik, su, kağıt tüketimi; 7 atık fraksiyonu; bilimsel katsayılar ve matematiksel formüller.' },
  { num: '5', title: 'Sistem Mimarisi, Veritabanı ve Teknik Altyapı', desc: 'React 19, TypeScript, Firestore şeması, sınırsız IndexedDB önbellek, PWA ve Google Apps Script.' },
  { num: '6', title: 'Güvenlik Mimarisi, Firestore Kuralları ve Denetim (Audit Trail)', desc: 'Domain bazlı Google doğrulaması, firestore.rules, ISO 8601 işlem ve oturum kayıtları.' },
  { num: '7', title: 'Sıkça Sorulan Sorular (SSS) ve Sorun Giderme', desc: 'Onay adımları, çevrimdışı senkronizasyon, revizyon düzeltmeleri ve iletişim kanalları.' },
  { num: '8', title: 'Resmi Onay, İmza ve Kurumsal Akreditasyon Taahhüdü', desc: 'Koordinatörlük, Bilişim Zümresi ve Okul Müdürlüğü 3\'lü onay ve mühür bloğu.' },
];

for (const item of tocItems) {
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(MARGIN_LEFT, cursorY, CONTENT_WIDTH, 14, 1.5, 1.5, 'F');

  doc.setFillColor(...COLORS.emeraldDark);
  doc.roundedRect(MARGIN_LEFT + 2, cursorY + 2, 10, 10, 1, 1, 'F');
  doc.setFont('ArialCustom', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.white);
  doc.text(item.num, MARGIN_LEFT + 7, cursorY + 8.5, { align: 'center' });

  doc.setFont('ArialCustom', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.navy);
  doc.text(item.title, MARGIN_LEFT + 15, cursorY + 6);

  doc.setFont('ArialCustom', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slateMuted);
  doc.text(item.desc, MARGIN_LEFT + 15, cursorY + 11);

  cursorY += 16;
}

addCalloutBox(
  'Kullanım ve Arşiv Kılavuzu',
  'İşbu dokümantasyon, FMV Erenköy Işık Lisesi ve Fen Lisesi Sürdürülebilirlik Komisyonu tarafından hem okul içi günlük operasyonların hatasız yürütülmesi hem de bağımsız akreditasyon denetimlerinde teknik kanıt olarak sunulmak üzere hazırlanmıştır.',
  'emerald'
);

// ==========================================
// BÖLÜM 1: GİRİŞ VE AKREDİTASYON
// ==========================================
doc.addPage();
currentPage++;
cursorY = 22;

addSectionTitle('1', 'Giriş, Kurumsal Amaç ve Akreditasyon Çerçevesi');

addSubTitle('1.1 Kurumsal Vizyon ve Amaç');
addParagraph(
  'Feyziye Mektepleri Vakfı\'nın 1885\'ten bu yana sürdürdüğü "Önce İyi İnsan Yetiştirmek" ilkesi gereğince, FMV Erenköy Işık Lisesi ve Fen Lisesi olarak öğrencilerimizin ekolojik okuryazarlığını artırmak, iklim krizine karşı somut çözümler geliştirmek ve okulumuzu sürdürülebilir bir yeşil kampüse dönüştürmek temel önceliğimizdir.'
);
addParagraph(
  'EcoCampus Portalı, kampüsümüzdeki tüm akademik disiplinlerin (Fen, Matematik, Edebiyat, Sosyal Bilimler, Yabancı Diller, Bilişim, Uygulamalı Dersler, PDR ve CAS) sürdürülebilirlik faaliyetlerini tek merkezde toplayan, tüketim verilerini ölçülebilir kılan ve kurumsal akreditasyon karnesini şeffaflıkla belgeleyen dijital yönetim sistemidir.'
);

addSubTitle('1.2 Entegre Edilen Yasal ve Uluslararası Standartlar');
addBullet('BM 17 Sürdürülebilir Kalkınma Amacı', '2030 Küresel Amaçlarının 17\'si de sisteme entegredir. Tüm proje ve müfredat kazanımları bu amaçlarla eşleştirilir.');
addBullet('T.C. Sıfır Atık Yönetmeliği', 'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı mevzuatına uygun 7 ayrı atık fraksiyonu ve yemekhane kompost tartımları izlenir.');
addBullet('MEB Çevre ve İklim Yönergesi', 'Öğrenci kulüpleri, çevre komiteleri ve eylem planı gereklilikleri dijital olarak arşivlenir.');
addBullet('Uluslararası Eko-Okullar / Yeşil Kampüs', '7 adımlı metodolojinin (Eko-Komite, Çevresel İnceleme, Eylem Planı, İzleme, Müfredat, Bilgilendirme, Eko-İlke) dijital karnesi tutulur.');
addBullet('GHG Protocol & ISO 14064', 'Elektrik, su ve kağıt tüketimlerinden doğan Kapsam 2 ve 3 emisyonları doğrulanmış bilimsel katsayılarla hesaplanır.');

addSubTitle('1.3 Akreditasyon Kriter Karnesi (6 Temel Gösterge)');
addParagraph(
  'Portal, Yıllık Akreditasyon Raporunda aşağıdaki 6 temel kriteri otomatik olarak denetler ve puanlar:'
);

const criteriaHeaders = ['Kriter No', 'Akreditasyon Göstergesi', 'Hedef ve Değerlendirme Ölçütü'];
const criteriaRows = [
  ['K1', 'Komite ve Eko-İlke', 'Sürdürülebilirlik kurulunun aktif olması ve onaylanmış projelerin bulunması.'],
  ['K2', 'Öğrenci & Kulüp Katılımı', 'Öğrenci kulüplerinin ve temsilcilerinin faaliyetlerde aktif görev alması.'],
  ['K3', '%100 Müfredat Entegrasyonu', 'Tüm akademik zümrelerin en az 1 dersinde sürdürülebilirlik kazanımı işlemesi.'],
  ['K4', 'Aylık Kaynak Takibi', 'Elektrik, su ve fotokopi kağıdı tüketim sayaçlarının düzenli kaydedilmesi.'],
  ['K5', 'Sıfır Atık & Kompost', 'Geri dönüşüm ve yemekhane organik kompost tartımlarının girilmesi.'],
  ['K6', 'Şeffaf Yıllık Raporlama', 'Dönem sonunda tüm verilerin konsolide edilerek resmi onaya sunulması.'],
];
addTable(criteriaHeaders, criteriaRows, [20, 55, 99]);

// ==========================================
// BÖLÜM 2: KULLANICI ROLLERİ VE YETKİLER
// ==========================================
doc.addPage();
currentPage++;
cursorY = 22;

addSectionTitle('2', 'Kullanıcı Rolleri, Hiyerarşi ve Yetki Matrisi');

addSubTitle('2.1 Sistem Rolleri ve Fonksiyonel Görev Dağılımı');
addBullet('Danışman Öğretmen (teacher)', 'Yeni sürdürülebilirlik projesi ve etkinlik teklifi hazırlar. Ders kazanım eşleştirmelerini sisteme işler. Gerçekleşen etkinliğin etki raporunu (öğrenci sayısı, çevresel çıktı, Drive medya arşivi) doldurur.');
addBullet('Bölüm / Zümre Başkanı (dept_head)', 'Kendi zümresindeki öğretmenlerin proje başvurularını inceler; onaylar veya revizyon notuyla iade eder. Zümresinin müfredat kazanımlarını ve hedeflerini denetler.');
addBullet('IB DP & CAS Koordinatörü (dept-cas)', 'CAS (Creativity, Activity, Service) bünyesinde yürütülen öğrenci projelerini denetler, CAS onaylarını yönetir.');
addBullet('Sürdürülebilirlik Koordinatörü (coordinator)', 'Okul genelindeki tüm projelerin nihai onayını verir ve okul takvimine yerleştirir. Yıllık raporu, akreditasyon karnesini, akademik yılları ve sayaç verilerini yönetir.');
addBullet('Okul Müdürü (principal)', 'Tüm okul projelerini, onay kuyruklarını, müfredat durumunu ve resmi akreditasyon karnesini üst yönetim düzeyinde denetler; yıllık raporu mühürler.');
addBullet('Sistem Yöneticisi / Süper Admin (admin)', 'Kullanıcı rolleri, dinamik yetki matrisi konfigürasyonu, ISO 8601 aktivite denetim logları ve sistem yedeklemesinden sorumludur.');

addSubTitle('2.2 Dinamik İşlem Yetkileri Karşılaştırma Tablosu');
addParagraph('Portalın RoleActionPermissions mimarisine göre rollerin varsayılan yetki dağılımı:');

const permHeaders = ['İşlem Yetkisi', 'Öğretmen', 'Zümre Bşk.', 'CAS Koord.', 'Koordinatör', 'Okul Müdürü', 'Süper Admin'];
const permRows = [
  ['Yeni Proje Önerisi Oluşturma', 'EVET', 'EVET', 'EVET', 'EVET', 'EVET', 'EVET'],
  ['Kendi Projesini Düzenleme', 'EVET', 'EVET', 'EVET', 'EVET', 'EVET', 'EVET'],
  ['Zümre Projelerini Düzenleme', 'HAYIR', 'EVET', 'EVET', 'EVET', 'EVET', 'EVET'],
  ['Tüm Okul Projelerini Düzenleme', 'HAYIR', 'HAYIR', 'HAYIR', 'EVET', 'EVET', 'EVET'],
  ['Zümre Onayı Verme (dept_approved)', 'HAYIR', 'EVET', 'EVET', 'EVET', 'EVET', 'EVET'],
  ['Koordinatör Nihai Onayı', 'HAYIR', 'HAYIR', 'HAYIR', 'EVET', 'EVET', 'EVET'],
  ['Sonuç Etki Raporu Girme', 'EVET', 'EVET', 'EVET', 'EVET', 'EVET', 'EVET'],
  ['Müfredat Kazanımı Ekleme', 'EVET', 'EVET', 'EVET', 'EVET', 'EVET', 'EVET'],
  ['Kampüs Tüketim/Sayaç Girişi', 'HAYIR', 'HAYIR', 'HAYIR', 'EVET', 'EVET', 'EVET'],
  ['Kullanıcı & Rol Yönetimi', 'HAYIR', 'HAYIR', 'HAYIR', 'HAYIR', 'HAYIR', 'EVET'],
  ['Akademik Yıl Yönetimi', 'HAYIR', 'HAYIR', 'HAYIR', 'EVET', 'EVET', 'EVET'],
  ['Aktivite & Denetim Günlüğü', 'HAYIR', 'HAYIR', 'HAYIR', 'HAYIR', 'HAYIR', 'EVET'],
];
addTable(permHeaders, permRows, [50, 18, 20, 20, 22, 22, 22]);

// ==========================================
// BÖLÜM 3: MENÜLER VE İŞLEVLER
// ==========================================
doc.addPage();
currentPage++;
cursorY = 22;

addSectionTitle('3', 'Menüler ve Arayüz İşlevleri (Detaylı Rehber)');

addSubTitle('3.1 Gösterge Panelleri (Dashboards)');
addParagraph(
  'Portal, kullanıcının rolüne göre özelleşen dinamik bir gösterge paneli yapısına sahiptir:'
);
addBullet('Bireysel Panelim (Danışman Öğretmen)', 'Öğretmenin bizzat yürüttüğü projeler, taslaklar, revizyon bekleyenler, sorumlu olduğu ders kazanımları ve ulaştığı toplam öğrenci sayısı.');
addBullet('Zümre Paneli (Bölüm Başkanı)', 'Zümreye ait projeler, zümre öğretmenlerinin performansları, zümrenin SKA katkısı ve onay bekleyen projeler listesi.');
addBullet('Genel Gösterge Paneli (Koordinatör / Müdür)', 'Okul genelindeki 4 temel metrik kartı, 17 SKA tıklanabilir filtreleme ısı haritası ve Zümre Liderlik Tablosu.');

addSubTitle('3.2 Proje ve Etkinlik Başvuru Süreci');
addParagraph(
  'Bir etkinlik veya proje başlatmak için "+ Yeni Proje Başlat" butonuna tıklanır. Açılan formda aşağıdaki alanlar eksiksiz doldurulmalıdır:'
);
addBullet('Temel Bilgiler', 'Proje adı, kapsamlı açıklama, sorumlu zümre ve işbirlikçi öğretmenler.');
addBullet('Öğrenci ve Kulüp', 'İlgili öğrenci kulübü (örn. Çevre Kulübü, CAS Kulübü) ve sorumlu öğrenci temsilcileri.');
addBullet('Etkinlik Türü', 'Atölye, Seminer / Konferans, Saha Gezisi, Farkındalık Kampanyası, Yarışma veya Müfredat İçi Proje.');
addBullet('Hedef Kademeler', 'Erenköy Işık Lisesi (Hazırlık, 9, 10, 11, 12) ve/veya Erenköy Işık Fen Lisesi (9, 10, 11, 12) sınıfları.');
addBullet('SKA Seçimi', '17 Birleşmiş Milletler Sürdürülebilir Kalkınma Amacından en az biri seçilir.');
addBullet('Planlama & Kaynak', 'Etkinlik başlangıç ve bitiş tarihleri, kampüs içi/dışı mekan, idari kaynak ihtiyaçları.');

addSubTitle('3.3 İki Aşamalı Onay Masası (Approval Workflow)');
addParagraph('Projelerin güvenliği ve koordinasyonu için iki kademeli hiyerarşik onay işletilir:');
addCalloutBox(
  'Onay Süreci İş Akış Şeması',
  '1. [Taslak / draft] ──► Öğretmen hazırlar ve zümre onayına gönderir.\n2. [Zümre Onayında / submitted] ──► Bölüm Başkanı inceler. Eksikse "Revizyon İsteği" ile iade eder, uygunsa zümre onayını verir.\n3. [Koordinatör Onayında / dept_approved] ──► Sürdürülebilirlik Koordinatörüne ulaşır.\n4. [Takvimde & Yayında / coordinator_approved] ──► Nihai onay verilir, proje okul takvimine otomatik yerleşir.\n5. [Tamamlandı / completed] ──► Etkinlik bitince sonuç etki raporu girilir ve akreditasyon arşivine alınır.',
  'emerald'
);

addSubTitle('3.4 Okul Takvimi (School Calendar)');
addParagraph(
  'Yalnızca Koordinatör tarafından onaylanmış resmi etkinlikler okul takviminde yayınlanır. Ay, Hafta ve Ajanda görünümleri sayesinde kampüsteki etkinlik çakışmaları önceden tespit edilir ve önlenir.'
);

addSubTitle('3.5 Etki ve Kapanış Raporu & Google Drive Arşivi');
addParagraph(
  'Gerçekleşen etkinlikler için danışman öğretmen "Sonuç Raporunu Gir" butonuna tıklar:'
);
addBullet('Katılımcı Sayısı', 'Gerçekleşen öğrenci ve öğretmen sayıları girilir.');
addBullet('Ölçülebilir Çevresel Çıktı', 'Sayısal etki ve birimi seçilir (Örn: 150 kg plastik toplandı, 30 fidan dikildi).');
addBullet('Google Drive Arşivi', 'Doğrudan tarayıcıdan Google Drive Resumable Upload ile yüksek çözünürlüklü fotoğraflar ve videolar otomatik oluşturulan "PROJE_ADI_TARIH" klasörüne yüklenir.');

addSubTitle('3.6 Müfredat & SKA Matrisi (Curriculum Tracker)');
addParagraph(
  'Her zümre ders bazında BM SKA kazanım eşleştirmesi kaydeder: Bölüm, ders adı, kademe, MEB/IB kazanımı ve derse katılan öğrenci mevcudu işlenir. Zümre dağılım grafikleri anlık üretilir ve Türkçe CSV olarak indirilebilir.'
);

// ==========================================
// BÖLÜM 4: METRİKLER VE KARBON MODELİ
// ==========================================
doc.addPage();
currentPage++;
cursorY = 22;

addSectionTitle('4', 'Yeşil Kampüs Metrikleri ve Karbon Modeli');

addSubTitle('4.1 Aylık Tüketim Sayaçları ve Atık Fraksiyonları');
addParagraph('Koordinatörlük tarafından her ay idari sayaç ve fatura verileri sisteme işlenir:');
addBullet('Elektrik Tüketimi (kWh)', 'Kampüs trafo ve sayaç okuma değeri.');
addBullet('Şebeke Suyu (m³)', 'Kampüs ana su sayacı tüketim miktarı.');
addBullet('Fotokopi Kağıdı (Top)', 'Birimlere dağıtılan A4 paket sayısı (1 Top = 500 yaprak ≈ 2.5 kg).');
addBullet('7 Atık Fraksiyonu (kg)', 'Kağıt/Karton, Plastik, Cam, Metal, Yemekhane Kompostu, Özel E-Atık.');

addSubTitle('4.2 Bilimsel Katsayılar ve Kaynaklar');
addBullet('Elektrik Emisyon Faktörü', '0.44 kg CO₂e / kWh (Türkiye Ulusal Elektrik Şebekesi Üretim Karması Ortalaması - TEİAŞ / IEA).');
addBullet('Su Emisyon Faktörü', '0.30 kg CO₂e / m³ (Şebeke suyu arıtma, dağıtım ve terfi pompaj emisyonu).');
addBullet('Kağıt & Ağaç Koruma', '1 Ton (1000 kg) geri dönüştürülmüş kağıt 17 yetişkin ağacın kesilmesini önler.');
addBullet('Atık Kaçınma Faktörü', 'Düzenli depolama yerine geri kazanılan her 1 kg atık 1.50 kg CO₂e emisyon önler.');

addSubTitle('4.3 Matematiksel Karbon Hesaplama Formülleri');

addCalloutBox(
  'Kurumsal Karbon Ayak İzi Matematiksel Formülasyonu',
  '1. Elektrik Emisyonu (Ton CO₂e):\n   Emisyon_elektrik = (Toplam kWh * 0.44) / 1000\n\n2. Su Emisyonu (Ton CO₂e):\n   Emisyon_su = (Toplam m³ * 0.30) / 1000\n\n3. Brüt Karbon Ayak İzi (Gross Emissions):\n   Emisyon_brut = Emisyon_elektrik + Emisyon_su\n\n4. Geri Dönüşümle Önlenen Emisyon (Avoided Emissions):\n   Emisyon_onlenen = (Toplam Geri Dönüştürülen kg * 1.50) / 1000\n\n5. Net Karbon Ayak İzi (Net Emissions):\n   Emisyon_net = max(0, Emisyon_brut - Emisyon_onlenen)\n\n6. Kurtarılan Ağaç Sayısı:\n   Kurtarilan_Agac = round((Geri Dönüştürülen Kağıt kg / 1000) * 17)\n\n7. Öğrenci Başına Aylık Elektrik ve Günlük Su:\n   Elektrik_(öğrenci/ay) = Toplam kWh / (Ay Sayısı * Öğrenci Sayısı) [kWh/ay]\n   Su_(öğrenci/gün) = (Toplam m³ * 1000) / (Ay Sayısı * 30 * Öğrenci Sayısı) [Litre/gün]',
  'amber'
);

// ==========================================
// BÖLÜM 5: SİSTEM MİMARİSİ VE TEKNİK ALTYAPI
// ==========================================
doc.addPage();
currentPage++;
cursorY = 22;

addSectionTitle('5', 'Sistem Mimarisi, Veritabanı ve Teknik Altyapı');

addSubTitle('5.1 Teknoloji Yığını (Technology Stack)');
addBullet('Frontend', 'React 19.2.8 (Modern Functional Components, Custom Hooks, Concurrent Mode)');
addBullet('Tip Sistemi', 'TypeScript ~6.0.2 (Strict Mode, tam tip güvenliği, sıfır "any")');
addBullet('Derleme & Bundler', 'Vite 8.2.2 (Rolldown/Rollup, Lightning Fast HMR, tree-shaking, chunk optimizasyonu)');
addBullet('Tasarım & Stil', 'Tailwind CSS 3.4.17 + PostCSS + Autoprefixer (Glassmorphism, responsive grid, A4 print kuralları)');
addBullet('İkonografi', 'Lucide React 1.40.0');
addBullet('Veritabanı', 'Google Cloud Firestore SDK v12.18.0');

addSubTitle('5.2 Sınırsız IndexedDB Yerel Önbelleği (Offline-First)');
addParagraph(
  'EcoCampus Portalı, Google Cloud Firestore üzerinde "persistentLocalCache" ve "persistentMultipleTabManager" mimarisini kullanır. Bu sayede:'
);
addBullet('Kota Tasarrufu', 'Yüzlerce öğretmen aynı anda bağlandığında Firestore okuma kotaları tüketilmez; veriler istemci IndexedDB önbelleğinden anında çekilir.');
addBullet('Çoklu Sekme Uyumu', 'Öğretmen tarayıcısında birden fazla sekme açtığında sekmeler kilitlenmez, yerel veriyi senkronize paylaşır.');
addBullet('Milisaniyelik Açılış', 'Ağ beklemesi olmaksızın paneller sıfır gecikmeyle açılır; arka planda onSnapshot ile canlı eşitleme sürer.');
addBullet('Otomatik İndeksleme', 'enablePersistentCacheIndexAutoCreation ile yerel sorgular otomatik indekslenerek sorgu hızı 10 kat artırılır.');

addSubTitle('5.3 Firestore Koleksiyon Şeması ve Veri Modelleri');
const dbHeaders = ['Koleksiyon', 'Açıklama', 'Anahtar Alanlar'];
const dbRows = [
  ['projects_events', 'Proje ve Etkinlikler', 'id, title, departmentId, advisorId, sdgGoals, status, targetGrades, impactReport'],
  ['curriculums', 'Müfredat SKA Eşleştirmeleri', 'id, departmentId, teacherName, courseName, gradeLevel, learningOutcome, sdgGoals'],
  ['campusMetrics', 'Yeşil Kampüs Tüketimleri', 'id, period (YYYY-MM), electricityKwh, waterM3, paperReams, recyclingPaperKg, audit'],
  ['profiles', 'Kullanıcı Profilleri', 'id, name, email, role, departmentId, title, avatar, customPermissions'],
  ['academicYears', 'Eğitim-Öğretim Yılları', 'id, name, startDate, endDate, isActive, totalStudents, description'],
  ['rolePermissions', 'Rol Yetki Yapılandırması', 'role, allowedTabs, permissions (RoleActionPermissions nesnesi)'],
  ['activityLogs', 'Aktivite & Denetim Günlüğü', 'id, userId, userName, actionType, category, timestamp, sessionDurationSeconds'],
];
addTable(dbHeaders, dbRows, [30, 48, 96]);

addSubTitle('5.4 Google Apps Script & E-posta Bildirim Webhook\'u');
addParagraph(
  'Onay masası süreçlerindeki bildirimler, Google Apps Script Web App üzerinden asenkron "fire-and-forget" fetch(url, { mode: "no-cors" }) yöntemiyle gönderilir. Ağ gecikmesi veya e-posta sunucusu yanıtı web arayüzünü asla bloke etmez.'
);

// ==========================================
// BÖLÜM 6: GÜVENLİK VE PWA
// ==========================================
doc.addPage();
currentPage++;
cursorY = 22;

addSectionTitle('6', 'Güvenlik Mimarisi, Firestore Kuralları ve PWA');

addSubTitle('6.1 Firestore Güvenlik Kuralları (firestore.rules)');
addParagraph(
  'Veritabanı güvenliği sunucu tarafında doğrulanmış Firebase Security Rules kurallarıyla sağlanır:'
);
addBullet('Okuma İzni (allow read: if true)', 'Okul panosu ve SDG projeleri kamuya, velilere ve öğrencilere açıktır (Şeffaf Eko-Okul İlkesi).');
addBullet('Yazma/Silme İzni (isSchoolStaff)', 'Yalnızca "@fmvisik.k12.tr" veya "@fmv.edu.tr" kurumsal Google Workspace hesabı ile giriş yapmış doğrulanmış personele açıktır.');

addSubTitle('6.2 Aktivite ve Denetim Günlüğü (Audit Trail - ISO 8601)');
addParagraph(
  'Sistemde gerçekleşen her türlü kritik eylem ISO 8601 zaman damgasıyla "activityLogs" koleksiyonuna yazılır: Kullanıcı giriş/çıkışları, oturum süreleri, proje onay/red işlemleri, müfredat güncellemeleri ve yetki değişiklikleri silinemez şekilde kayıt altına alınır.'
);

addSubTitle('6.3 PWA (Progressive Web App) Altyapısı');
addParagraph(
  'EcoCampus Portalı, Service Worker ve Web App Manifest altyapısı sayesinde masaüstü (Windows, macOS) ve mobil (Android, iOS) cihazlarda bağımsız yerel bir uygulama gibi kurulabilir. İnternet kesilse dahi kullanıcılar portala erişmeye ve kayıt oluşturmaya devam edebilir.'
);

// ==========================================
// BÖLÜM 7: SORUN GİDERME VE SSS
// ==========================================
doc.addPage();
currentPage++;
cursorY = 22;

addSectionTitle('7', 'Sıkça Sorulan Sorular ve Sorun Giderme');

addSubTitle('7.1 Sıkça Sorulan Sorular (SSS)');
addBullet('S: Projemi onaya gönderdim, takvimde neden göremiyorum?', 'C: Takvimde yalnızca Koordinatör nihai onayından geçmiş (coordinator_approved) etkinlikler yayınlanır. Projeniz henüz Zümre Başkanı veya Koordinatör onay kuyruğunda olabilir.');
addBullet('S: Projem revizyona gönderildi, ne yapmalıyım?', 'C: Proje kartınızda iletilen revizyon gerekçesini okuyup gerekli düzenlemeleri yaptıktan sonra "Güncelle ve Tekrar Onaya Gönder" butonuna basınız.');
addBullet('S: İnternetim kesilirse girdiğim veriler kaybolur mu?', 'C: Hayır. Sınırsız IndexedDB yerel önbellek altyapısı verilerinizi tarayıcınızda güvenceye alır; internet geldiğinde Cloud Firestore ile otomatik eşitlenir.');
addBullet('S: CAS projeleri nasıl değerlendirilir?', 'C: Zümre olarak "CAS (Creativity, Activity, Service)" seçildiğinde, başvuru doğrudan IB DP & CAS Koordinatörünün masasına düşer.');

addSubTitle('7.2 Destek ve İletişim');
addParagraph('Teknik sorunlar, zümre yetkilendirmeleri ve yeni özellik talepleri için:');
addBullet('Sürdürülebilirlik Koordinatörlüğü', 'FMV Erenköy Işık Lisesi ve Fen Lisesi');
addBullet('Kurumsal E-posta', 'surdurulebilirlik@fmvisik.k12.tr / erkansagnak81@gmail.com');
addBullet('Bilişim Teknolojileri Zümresi', 'Sistem Altyapı & Yazılım Destek Birimi');

// ==========================================
// BÖLÜM 8: RESMİ ONAY VE İMZA SAYFASI
// ==========================================
doc.addPage();
currentPage++;
cursorY = 22;

addSectionTitle('8', 'Resmi Onay, İmza ve Akreditasyon Taahhüdü');

addParagraph(
  'İşbu Kullanım Kılavuzu ve Teknik Sistem Dokümantasyonu, FMV Erenköy Işık Lisesi ve Fen Lisesi Sürdürülebilirlik Kurulu, Bilişim Teknolojileri Zümresi ve Okul Müdürlüğü tarafından kurumsal standart olarak onaylanmış ve yürürlüğe girmiştir.'
);

addCalloutBox(
  'Kurumsal Sürdürülebilirlik ve Sıfır Atık Taahhütnamesi',
  'FMV Erenköy Işık Lisesi ve Fen Lisesi olarak; Birleşmiş Milletler 17 Sürdürülebilir Kalkınma Amacı doğrultusunda, tüm akademik zümrelerimiz ve idari birimlerimizle birlikte doğaya saygılı, sıfır atık hedeflerini benimseyen ve kurumsal karbon ayak izini şeffaf şekilde yöneten bir eğitim ekosistemini kararlılıkla sürdüreceğimizi taahhüt ederiz.',
  'emerald'
);

cursorY += 15;
checkPageBreak(50);

// 3'lü İmza Alanı
const signBoxWidth = 53;
const signBoxHeight = 38;

// Kutu 1
doc.setFillColor(...COLORS.bgLight);
doc.setDrawColor(...COLORS.borderGray);
doc.roundedRect(MARGIN_LEFT, cursorY, signBoxWidth, signBoxHeight, 2, 2, 'FD');
doc.setFont('ArialCustom', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(...COLORS.navy);
doc.text('Sürdürülebilirlik Koordinatörlüğü', MARGIN_LEFT + signBoxWidth / 2, cursorY + 6, { align: 'center' });
doc.setFont('ArialCustom', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...COLORS.slateMuted);
doc.text('FMV Erenköy Işık Lisesi ve Fen Lisesi', MARGIN_LEFT + signBoxWidth / 2, cursorY + 11, { align: 'center' });
doc.text('İmza / Tarih: ___________________', MARGIN_LEFT + signBoxWidth / 2, cursorY + 32, { align: 'center' });

// Kutu 2
doc.roundedRect(MARGIN_LEFT + signBoxWidth + 7, cursorY, signBoxWidth, signBoxHeight, 2, 2, 'FD');
doc.setFont('ArialCustom', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(...COLORS.navy);
doc.text('Bilişim Teknolojileri Zümresi', MARGIN_LEFT + signBoxWidth + 7 + signBoxWidth / 2, cursorY + 6, { align: 'center' });
doc.setFont('ArialCustom', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...COLORS.slateMuted);
doc.text('Sistem Mimarisi & Altyapı', MARGIN_LEFT + signBoxWidth + 7 + signBoxWidth / 2, cursorY + 11, { align: 'center' });
doc.text('İmza / Tarih: ___________________', MARGIN_LEFT + signBoxWidth + 7 + signBoxWidth / 2, cursorY + 32, { align: 'center' });

// Kutu 3
doc.roundedRect(MARGIN_LEFT + (signBoxWidth + 7) * 2, cursorY, signBoxWidth, signBoxHeight, 2, 2, 'FD');
doc.setFont('ArialCustom', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(...COLORS.navy);
doc.text('Okul Müdürlüğü', MARGIN_LEFT + (signBoxWidth + 7) * 2 + signBoxWidth / 2, cursorY + 6, { align: 'center' });
doc.setFont('ArialCustom', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...COLORS.slateMuted);
doc.text('FMV Erenköy Işık Lisesi ve Fen Lisesi', MARGIN_LEFT + (signBoxWidth + 7) * 2 + signBoxWidth / 2, cursorY + 11, { align: 'center' });
doc.text('Mühür / İmza: ___________________', MARGIN_LEFT + (signBoxWidth + 7) * 2 + signBoxWidth / 2, cursorY + 32, { align: 'center' });

cursorY += signBoxHeight + 15;

doc.setFont('ArialCustom', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...COLORS.slateMuted);
doc.text('FMV Erenköy Işık Lisesi ve Fen Lisesi • Rıdvanpaşa Sok. No:16 34734 Erenköy - Kadıköy / İstanbul', PAGE_WIDTH / 2, cursorY, { align: 'center' });
doc.text('Telefon: (0216) 411 39 23 • E-posta: surdurulebilirlik@fmvisik.k12.tr • Web: https://sdg-erenkoy.web.app', PAGE_WIDTH / 2, cursorY + 4, { align: 'center' });

// ==========================================
// TÜM SAYFALARA HEADER VE FOOTER EKLE
// ==========================================
const totalPages = doc.getNumberOfPages();
for (let p = 1; p <= totalPages; p++) {
  doc.setPage(p);
  addHeaderFooter(doc, p);
}

// 4. Dosyayı public/ Klasörüne Kaydet
const outputDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'FMV_Erenkoy_Isik_Surdurulebilirlik_Kullanim_Kilavuzu.pdf');
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outputPath, pdfBuffer);

console.log(`✅ PDF başarıyla oluşturuldu!`);
console.log(`Boyut: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
console.log(`Sayfa Sayısı: ${totalPages}`);
console.log(`Hedef: ${outputPath}`);
