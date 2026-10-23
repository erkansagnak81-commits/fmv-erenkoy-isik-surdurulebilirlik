export interface ManualSection {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  iconName: string;
  summary: string;
  content: string; // Markdown or rich HTML-like formatted content
  subsections?: Array<{
    id: string;
    title: string;
    content: string;
    badge?: string;
  }>;
}

export const MANUAL_METADATA = {
  institution: 'FMV Erenköy Işık Lisesi ve Fen Lisesi',
  parentFoundation: 'Feyziye Mektepleri Vakfı (Kuruluş: 1885)',
  portalTitle: 'EcoCampus Sürdürülebilirlik & Çevre Yönetim Portalı',
  docTitle: 'Kullanım Kılavuzu & Kapsamlı Teknik Sistem Dokümantasyonu',
  version: 'v2.4.0 (2026-2027 Dönemi)',
  lastUpdated: 'Ekim 2026',
  preparedBy: 'Sürdürülebilirlik Koordinatörlüğü & Bilişim Teknolojileri Zümresi',
  approvedBy: 'Okul Müdürlüğü (FMV Erenköy Işık Lisesi ve Fen Lisesi)',
  targetAudience: 'Tüm Akademik Zümreler, İdari Birimler, IB DP & CAS Koordinatörlüğü ve Okul Yönetimi',
};

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'intro',
    number: '1',
    title: 'Giriş, Kurumsal Vizyon ve Akreditasyon Çerçevesi',
    shortTitle: 'Vizyon & Akreditasyon',
    iconName: 'Sparkles',
    summary: 'FMV Erenköy Işık Lisesi ve Fen Lisesi sürdürülebilirlik vizyonu, BM 17 SKA, Sıfır Atık Yönetmeliği ve uluslararası akreditasyon standartları.',
    content: `
### 1.1 Kurumsal Vizyon ve Felsefe
Feyziye Mektepleri Vakfı'nın 1885'ten bu yana "Önce İyi İnsan Yetiştirmek" ilkesiyle yaktığı Işık meşalesi, 21. yüzyılda gezegenimizin karşı karşıya olduğu ekolojik krizler, iklim değişikliği ve doğal kaynakların tükenmesi tehditlerine karşı sürdürülebilirlik bilinciyle güçlendirilmektedir.

**FMV Erenköy Işık Lisesi ve Fen Lisesi EcoCampus Portalı**, kampüsümüzdeki tüm akademik disiplinlerin (Fen, Matematik, Edebiyat, Sosyal Bilimler, Yabancı Diller, Bilişim, Uygulamalı Dersler, PDR ve CAS) çevre ve sürdürülebilirlik çalışmalarını tek bir dijital platformda birleştirmek; tüketim ve atık verilerini ölçülebilir kılmak ve kurumsal akreditasyon süreçlerini şeffaflıkla belgelemek amacıyla geliştirilmiştir.

### 1.2 Entegre Edilen Ulusal ve Uluslararası Standartlar
Portal, çalışmalarımızı küresel ve ulusal çerçevelerle tam uyumlu hale getirmektedir:
1. **Birleşmiş Milletler 17 Sürdürülebilir Kalkınma Amacı (SKA / SDG):** 2030 Küresel Gündemi kapsamında belirlenen 17 amacın tamamı okul etkinlikleri ve ders müfredatlarıyla eşleştirilir.
2. **T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Sıfır Atık Yönetmeliği:** Kampüsteki geri dönüşüm, atık azaltımı ve yemekhane organik kompost tartımlarının yasal mevzuata uygun takibi.
3. **Millî Eğitim Bakanlığı (MEB) Çevre, İklim Değişikliği ve Sıfır Atık Yönergesi:** Okul içi çevre komiteleri, öğrenci kulüpleri ve yeşil bayrak hedefleri.
4. **Uluslararası Eko-Okullar (Eco-Schools) & Yeşil Kampüs Kriterleri:** Uluslararası çevre eğitimi akreditasyonunun gerektirdiği komite, eylem planı, izleme-değerlendirme ve eko-ilke adımlarının dijital arşivi.
5. **GHQ Protocol (Sera Gazı Protokolü) & ISO 14064 Standardı:** Kampüs elektrik, su ve kağıt tüketimlerinden kaynaklanan Kapsam 2 ve Kapsam 3 emisyonlarının bilimsel olarak hesaplanması.
    `,
    subsections: [
      {
        id: 'sdg-table',
        title: 'BM 17 Sürdürülebilir Kalkınma Amacı Entegrasyonu',
        badge: '17 Küresel Hedef',
        content: `
Platformda her proje ve müfredat kazanımı en az bir, en fazla 5 BM Sürdürülebilir Kalkınma Amacı ile ilişkilendirilir:
- **SKA 1:** Yoksulluğa Son • **SKA 2:** Açlığa Son • **SKA 3:** Sağlıklı ve Kaliteli Yaşam
- **SKA 4:** Nitelikli Eğitim • **SKA 5:** Toplumsal Cinsiyet Eşitliği • **SKA 6:** Temiz Su ve Sanitasyon
- **SKA 7:** Erişilebilir ve Temiz Enerji • **SKA 8:** İnsana Yakışır İş ve Ekonomik Büyüme
- **SKA 9:** Sanayi, Yenilikçilik ve Altyapı • **SKA 10:** Eşitsizliklerin Azaltılması
- **SKA 11:** Sürdürülebilir Şehirler ve Topluluklar • **SKA 12:** Sorumlu Üretim ve Tüketim
- **SKA 13:** İklim Eylemi • **SKA 14:** Sudaki Yaşam • **SKA 15:** Karasal Yaşam
- **SKA 16:** Barış, Adalet ve Güçlü Kurumlar • **SKA 17:** Amaçlar İçin Ortaklıklar
        `,
      },
      {
        id: 'accreditation-criteria',
        title: 'Yıllık Akreditasyon Karnesi (6 Temel Gösterge)',
        badge: 'Denetim Standardı',
        content: `
Yıllık Akreditasyon Raporunda sistem tarafından otomatik olarak denetlenen 6 temel gösterge:
1. **Kurul ve Çevre İlkesi:** Sürdürülebilirlik komitesinin aktif faaliyette bulunması ve onaylanmış projelerin varlığı.
2. **Öğrenci Katılımı & Kulüp Çalışmaları:** Etkinliklerde ve kulüplerde aktif öğrenci katılımının belgelenmesi.
3. **%100 Zümre Müfredat Entegrasyonu:** Tüm akademik bölümlerin (Fen, Mat, Edb, Sos, Dil, Uyg, Bil, PDR) en az bir dersinde sürdürülebilirlik kazanımı işlemesi.
4. **Kaynak Takibi:** Elektrik, su ve kağıt sayaç/fatura verilerinin aylık girilmesi.
5. **Sıfır Atık & Kompost Envanteri:** 7 ayrı atık fraksiyonu ve kompost tartımlarının kaydedilmesi.
6. **Şeffaf Yıllık Raporlama:** Verilerin konsolide edilerek resmi mühür ve imzaya hazır hale getirilmesi.
        `,
      }
    ]
  },
  {
    id: 'roles-permissions',
    number: '2',
    title: 'Kullanıcı Rolleri, Hiyerarşi ve Dinamik Yetki Matrisi',
    shortTitle: 'Roller & Yetki Matrisi',
    iconName: 'Users',
    summary: 'Öğretmen, Bölüm Başkanı, CAS Koordinatörü, Sürdürülebilirlik Koordinatörü, Okul Müdürü ve Süper Admin rolleri ve yetkileri.',
    content: `
### 2.1 Rol Tabanlı Erişim Denetimi (RBAC) Mimarisi
EcoCampus Portalı, hassas okul verilerini ve onay akışlarını korumak amacıyla çok katmanlı bir yetki modeli kullanır. Roller sabit kodlanmış kurallara bağlı kalmayıp, Süper Admin tarafından **Kullanıcı & Rol Yönetimi** panelinden gerçek zamanlı olarak özelleştirilebilir (\`customPermissions\`).

### 2.2 Sistem Rolleri ve Sorumluluk Dağılımı
- **Danışman Öğretmen (\`teacher\`):**
  Yeni proje ve etkinlik teklifi hazırlar, zümre onayına sunar. Kendi dersleri için müfredat kazanımlarını sisteme işler. Gerçekleşen faaliyetlerin etki raporunu (öğrenci sayısı, somut çevresel çıktı, Drive fotoğraf/video arşivi) tamamlar.
- **Bölüm / Zümre Başkanı (\`dept_head\`):**
  Kendi zümresindeki öğretmenler tarafından hazırlanan projeleri inceler; uygun bulursa onaylayarak Koordinatör onayına iletir (\`dept_approved\`), eksik görürse gerekçe belirterek revizyona gönderir (\`revision_needed\`). Zümresinin müfredat kazanımlarını ve hedeflerini denetler.
- **IB DP & CAS Koordinatörü (\`dept-cas\` / \`isCasCoordinator\`):**
  Uluslararası Bakalorya (IB DP) bünyesinde yürütülen Yaratıcılık, Etkinlik, Hizmet (CAS) projelerini denetler; CAS standartlarına uygun projelerin zümre onayını verir.
- **Sürdürülebilirlik Koordinatörü (\`coordinator\`):**
  Okul genelindeki tüm zümrelerin projelerinin nihai onayını verir (\`coordinator_approved\`) ve resmi okul takvimine yerleştirir. Yıllık raporu, akreditasyon karnesini, karbon analizini ve akademik yılları yönetir.
- **Okul Müdürü (\`principal\`):**
  Tüm okulun projelerini, onay kuyruklarını, müfredat matrisini, yeşil kampüs tüketimlerini ve resmi akreditasyon karnesini üst yönetim düzeyinde inceler; yıllık raporu onaylar.
- **Sistem Yöneticisi / Süper Admin (\`admin\`):**
  Kullanıcı hesapları, zümre atamaları, yetki matrisi konfigürasyonu, aktivite denetim logları (\`ActivityLogsView\`), sistem yedekleme ve bakımından sorumludur.
    `,
    subsections: [
      {
        id: 'permission-matrix-table',
        title: 'Detaylı Yetki Karşılaştırma Matrisi (RoleActionPermissions)',
        badge: 'Yetki Haritası',
        content: `
| İşlem Yetkisi | Öğretmen | Zümre Bşk. | CAS Koord. | Koordinatör | Okul Müdürü | Süper Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Yeni Proje Başlatma (\`canCreateProject\`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kendi Projesini Düzenleme (\`canEditOwnProject\`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Zümre Projelerini Düzenleme (\`canEditDeptProject\`) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tüm Okul Projelerini Düzenleme (\`canEditAllProjects\`) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Zümre Onayı Verme (\`canApproveDept\`) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Koordinatör Nihai Onayı (\`canApproveCoordinator\`) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Etki Raporu Girme (\`canSubmitReport\`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Müfredat Kazanımı Ekleme (\`canCreateCurriculum\`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kampüs Tüketim Girişi (\`canEditCampusMetrics\`) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Kullanıcı & Yetki Yönetimi (\`canManageUsers\`) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Akademik Yıl Tanımlama (\`canManageAcademicYears\`) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Aktivite Denetim Günlüğü (\`canViewLogs\`) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
        `,
      }
    ]
  },
  {
    id: 'functional-modules',
    number: '3',
    title: 'Adım Adım Modül Kullanım Rehberi',
    shortTitle: 'Modül Kullanım Rehberi',
    iconName: 'FolderKanban',
    summary: 'Proje oluşturma, iki aşamalı onay masası, takvim, sonuç etki raporu, Google Drive arşivi ve müfredat takibi.',
    content: `
### 3.1 Proje ve Etkinlik Başvurusu Oluşturma
1. Ana ekranda veya Proje Havuzunda **"+ Yeni Proje Başlat"** butonuna tıklayın.
2. **Temel Bilgiler:** Proje başlığını ve amacını açıklayan kapsamlı bir özet yazın.
3. **Zümre ve Danışman:** Sorumlu zümreyi seçin. İşbirlikçi öğretmenleri (varsa diğer zümrelerden) ekleyin.
4. **Öğrenci Katılımı:** Varsa ilgili öğrenci kulübünü (örn. Çevre ve Sıfır Atık Kulübü, CAS Kulübü) ve öğrenci temsilcilerini belirleyin.
5. **Etkinlik Türü:** Atölye, Seminer / Konferans, Saha Gezisi, Farkındalık Kampanyası, Yarışma veya Müfredat İçi Proje seçeneklerinden birini işaretleyin.
6. **BM SKA Eşleştirmesi:** Projenin hizmet ettiği 17 Küresel Hedef arasından ilgili olanları seçin (Örn: SKA 12, SKA 13, SKA 15).
7. **Hedef Kitle & Kademeler:** Erenköy Işık Lisesi ve/veya Erenköy Işık Fen Lisesi sınıf düzeylerini (Hazırlık, 9, 10, 11, 12 veya Kampüs Geneli) belirleyin.
8. **Tarih ve Kaynak:** Başlangıç ve bitiş tarihlerini, etkinlik mekanını ve gereken okul kaynaklarını (otobüs, konferans salonu, malzeme vb.) girin.
9. **Kayıt:** Formu **"Taslak Olarak Kaydet"** diyerek daha sonra tamamlamak üzere saklayabilir veya **"Zümre Onayına Gönder"** diyerek onay sürecini başlatabilirsiniz.

### 3.2 İki Aşamalı Hiyerarşik Onay Masası (Approval Workflow)
Proje gönderildiğinde iki aşamalı güvenlik ve koordinasyon akışı devreye girer:
\`\`\`
[Taslak: draft]
       │
       ▼ (Öğretmen Gönderir)
[Zümre Onayında: submitted] ──(Revizyon Gerekçesi)──► [Revizyon İstendi: revision_needed]
       │                                                         │
       ▼ (Zümre Başkanı Onayı)                                   ▼ (Öğretmen Günceller)
[Koordinatör Onayında: dept_approved] ◄──────────────────────────┘
       │
       ▼ (Koordinatör Nihai Onayı)
[Yayında & Takvimde: coordinator_approved]
       │
       ▼ (Faaliyet Gerçekleşir & Etki Raporu Girilir)
[Tamamlandı & Arşivlendi: completed]
\`\`\`
- **Revizyon Geri Bildirimi:** Bölüm Başkanı veya Koordinatör projeyi geri gönderdiğinde gerekçeli not yazar. Danışman öğretmene anında sistem ve e-posta bildirimi ulaşır.
- **Otomatik E-posta:** Google Apps Script altyapısı sayesinde onay veya revizyon durumunda ilgili öğretmen ve idarecilere anlık bildirim iletilir.

### 3.3 Okul Takvimi (School Calendar)
Yalnızca Koordinatör tarafından onaylanmış (\`coordinator_approved\`) ve tamamlanmış (\`completed\`) projeler okul takvimine otomatik işlenir. Takvim; Ay, Hafta ve Ajanda görünümleri sunar. Tarih çakışmaları engellenir, okul yönetimi ve öğretmenler aynı gün olan diğer etkinlikleri görerek planlama yapar.

### 3.4 Etki ve Kapanış Raporu (Impact Report)
Etkinlik tamamlandığında danışman öğretmen **"Sonuç Raporunu Gir"** butonuna basar:
- **Katılımcı Sayısı:** Gerçekleşen öğrenci ve öğretmen katılımı girilir.
- **Ölçülebilir Çevresel Çıktı:** Sayısal etki değeri ve birimi seçilir (Örn: 250 kg plastik atık toplandı, 45 fidan dikildi, 120 kWh enerji tasarrufu sağlandı).
- **Google Drive Arşivi:** Doğrudan tarayıcı üzerinden Google Drive API Resumable Upload ile yüksek çözünürlüklü fotoğraflar ve videolar arşiv klasörüne yüklenir.
- **Kapanış:** Rapor kaydedildiğinde proje \`completed\` statüsüne geçer ve Yıllık Akreditasyon Raporuna resmi kanıt olarak eklenir.

### 3.5 Müfredat & SKA Matrisi (Curriculum Tracker)
Sürdürülebilirliğin sadece kulüp etkinliği değil, ders kazanımı haline gelmesi için her zümre ders bazında entegrasyon kaydı açar:
- Bölüm, ders adı, kademe (9, 10, 11, 12), MEB/IB kazanım açıklaması, SKA hedefleri ve derse katılan öğrenci sayısı girilir.
- Zümre bazlı katılım grafikleri otomatik üretilir ve tek tuşla UTF-8 Türkçe CSV formatında indirilebilir.
    `,
    subsections: []
  },
  {
    id: 'campus-metrics-carbon',
    number: '4',
    title: 'Yeşil Kampüs Metrikleri, Sıfır Atık ve Karbon Hesaplama Modeli',
    shortTitle: 'Kampüs Metrikleri & Karbon',
    iconName: 'BarChart3',
    summary: 'Elektrik, su, kağıt tüketimi; 7 atık fraksiyonu; GHG Protocol karbon ayak izi matematiksel formülleri.',
    content: `
### 4.1 Tüketim Sayaçları ve Atık Fraksiyonları
Sürdürülebilirlik Koordinatörlüğü her ay idari sayaç ve fatura verilerini sisteme işler:
1. **Elektrik Tüketimi (kWh):** Kampüs trafo ve sayaç okuma değeri.
2. **Şebeke Suyu (m³):** Kampüs ana su sayacı tüketimi.
3. **Fotokopi Kağıdı (Top):** Zümrelere ve idari birimlere dağıtılan A4 kağıt paket sayısı (1 Top = 500 yaprak ≈ 2.5 kg).
4. **Sıfır Atık & Geri Dönüşüm (kg):**
   - Atık Kağıt & Karton (kg)
   - Atık Plastik (kg)
   - Atık Cam (kg)
   - Atık Metal (kg)
   - Yemekhane Organik Kompost (kg)
   - Özel E-Atık / Elektronik (kg)

### 4.2 Bilimsel Emisyon Katsayıları ve Standartlar
Karbon ayak izi hesaplamasında ulusal şebeke verileri ve uluslararası protokoller (IPCC, IEA, DEFRA, GHG Protocol) temel alınmıştır:
- **Elektrik Emisyon Faktörü:** Türkiye Ulusal Elektrik Şebekesi Üretim Karması ortalaması olan **0.44 kg CO₂e / kWh** kabul edilmiştir.
- **Su Emisyon Faktörü:** Şebeke suyu arıtma, terfi istasyonları ve dağıtım pompaları ortalaması **0.30 kg CO₂e / m³** olarak modellenmiştir.
- **Kağıt & Orman Koruma Katsayısı:** 1 ton (1000 kg) geri dönüştürülmüş kağıt **17 yetişkin ağacın** kesilmesini önler. 1 Top fotokopi kağıdı = 2.5 kg kağıt kütlesine karşılık gelir.
- **Geri Dönüşüm Emisyon Kaçınma Faktörü:** Düzenli depolama sahasına (landfill) gitmek yerine döngüsel ekonomiye kazandırılan her 1 kg ayrıştırılmış atık (veya kompost), metan oluşumunu ve hammadde üretimini engelleyerek **1.50 kg CO₂e** emisyon tasarrufu sağlar.
- **Öğrenci Nüfusu:** FMV Erenköy Işık Lisesi ve Fen Lisesi mevcudu baz alınarak (Varsayılan: 850 öğrenci) kişi başı metrikler normalize edilir.
    `,
    subsections: [
      {
        id: 'carbon-formulas-box',
        title: 'Karbon Ayak İzi Matematiksel Formülasyonu',
        badge: 'Matematiksel Model',
        content: `
1. **Elektrik Kaynaklı Emisyon (Ton CO₂e):**
   $$\\text{Emisyon}_{\\text{elektrik}} = \\frac{\\text{Toplam kWh} \\times 0.44}{1000}$$

2. **Su Kaynaklı Emisyon (Ton CO₂e):**
   $$\\text{Emisyon}_{\\text{su}} = \\frac{\\text{Toplam m}^3 \\times 0.30}{1000}$$

3. **Brüt Karbon Ayak İzi (Gross Emissions):**
   $$\\text{Emisyon}_{\\text{brüt}} = \\text{Emisyon}_{\\text{elektrik}} + \\text{Emisyon}_{\\text{su}}$$

4. **Geri Dönüşümle Önlenen Emisyon (Avoided Emissions):**
   $$\\text{Emisyon}_{\\text{önlenen}} = \\frac{\\sum (\\text{Kağıt} + \\text{Plastik} + \\text{Cam} + \\text{Metal} + \\text{Kompost} + \\text{E-Atık})_{kg} \\times 1.50}{1000}$$

5. **Net Kurumsal Karbon Ayak İzi:**
   $$\\text{Emisyon}_{\\text{net}} = \\max\\left(0, \\text{Emisyon}_{\\text{brüt}} - \\text{Emisyon}_{\\text{önlenen}}\\right)$$

6. **Kurtarılan Ağaç Sayısı:**
   $$\\text{Kurtarılan Ağaç} = \\text{round}\\left( \\frac{\\text{Geri Dönüştürülen Kağıt}_{kg}}{1000} \\times 17 \\right)$$

7. **Kişi Başına Aylık Elektrik ve Günlük Su:**
   $$\\text{Elektrik}_{\\text{öğrenci/ay}} = \\frac{\\text{Toplam kWh}}{\\text{Ay Sayısı} \\times \\text{Öğrenci Sayısı}} \\quad [\\text{kWh/ay}]$$
   $$\\text{Su}_{\\text{öğrenci/gün}} = \\frac{\\text{Toplam m}^3 \\times 1000}{\\text{Ay Sayısı} \\times 30 \\times \\text{Öğrenci Sayısı}} \\quad [\\text{Litre/gün}]$$
        `,
      }
    ]
  },
  {
    id: 'tech-architecture',
    number: '5',
    title: 'Sistem Mimarisi, Veritabanı ve Teknik Altyapı',
    shortTitle: 'Sistem Mimarisi & Altyapı',
    iconName: 'Cpu',
    summary: 'React 19, TypeScript, Vite, TailwindCSS, Cloud Firestore şeması, IndexedDB sınırsız önbellek ve PWA mimarisi.',
    content: `
### 5.1 Teknoloji Yığını (Tech Stack)
EcoCampus modern, performanslı ve geleceğe hazır bir kurumsal web teknolojileri mimarisiyle inşa edilmiştir:
- **Kütüphane & Çalışma Zamanı:** React 19.2.8 (Modern Functional Components, Custom Hooks, Concurrent Rendering)
- **Tip Güvenliği:** TypeScript ~6.0.2 (Strict Type Checking, kapsamlı interface ve enum tanımları)
- **Yapılandırma & Derleme Motoru:** Vite 8.2.2 (Rolldown / Rollup bundler, HMR, kod bölme ve minifikasyon)
- **Stil & Tasarım Sistemi:** Tailwind CSS 3.4.17 + PostCSS + Autoprefixer (Duyarlı ızgaralar, cam efekti glassmorphism, A4 baskı kuralları)
- **İkonografi:** Lucide React 1.40.0
- **Kutlama Efektleri:** Canvas Confetti (Proje tamamlama ve akreditasyon başarılarında)

### 5.2 Veritabanı ve Sınırsız IndexedDB Önbelleği (Offline-First)
Google Cloud Firestore SDK v12.18 altyapısı aşağıdaki kurumsal parametrelerle yapılandırılmıştır:
\`\`\`typescript
// src/lib/firebase.ts
const firestoreInstance = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }),
  ignoreUndefinedProperties: true,
});

// Otomatik yerel sorgu indeksleme
const indexManager = getPersistentCacheIndexManager(firestoreInstance);
if (indexManager) {
  enablePersistentCacheIndexAutoCreation(indexManager);
}
\`\`\`
**Neden Sınırsız IndexedDB Önbelleği?**
1. **Kota Tasarrufu:** Yüzlerce öğretmen aynı anda portala girdiğinde Firestore okuma kotalarını tüketmez. Veriler tarayıcının IndexedDB alanında saklanır.
2. **Çoklu Sekme Eşitlemesi (\`persistentMultipleTabManager\`):** Öğretmen tarayıcısında birden fazla sekme açtığında sekmeler birbirini kilitlemez, önbelleği paylaşır.
3. **Milisaniyelik Yanıt:** Ağ gecikmesi beklenmeksizin ekranlar anında açılır, arka planda Firestore ile canlı çift yönlü eşitleme (\`onSnapshot\`) sürdürülür.
4. **Çevrimdışı Çalışma (Offline Mode):** İnternet koptuğunda portal çalışmaya devam eder; yerel değişiklikler internet geldiğinde sunucuya yazılır.

### 5.3 Google Apps Script & E-posta Bildirim Webhook'u
- Proje akışlarındaki bildirimler Google Apps Script Web App üzerinden tetiklenir (\`VITE_EMAIL_NOTIFICATION_URL\`).
- İstekler **ateşle-unut (fire-and-forget)** prensibiyle \`fetch(url, { mode: 'no-cors' })\` şeklinde gönderilir; ağ yavaşlığı veya e-posta sunucusu gecikmesi kullanıcı arayüzünü kesinlikle yavaşlatmaz.
- E-postalar kurumsal HTML şablonuyla öğretmen ve idarecilerin gelen kutusuna teslim edilir.

### 5.4 Google Drive Resumable Upload Protokolü
Etki raporlarında büyük boyutlu video ve yüksek çözünürlüklü fotoğrafların sunucuyu yormadan saklanması için Google Drive API Resumable Upload mimarisi kullanılmıştır:
- Proje adına göre Drive'da otomatik klasör oluşturulur (\`PROJE_ADI_TARIH\`).
- Dosyalar tarayıcıda Base64 veya doğrudan parça parça (chunked streaming) Drive'a iletilir.
- \`imageUtils.ts\` ile tarayıcıda resim sıkıştırma uygulanarak depolama alanı optimize edilir.
    `,
    subsections: [
      {
        id: 'firestore-schema',
        title: 'Firestore Koleksiyon Şeması ve Veri Modeli',
        badge: 'Veri Modeli',
        content: `
| Koleksiyon Adı | Amaç | Anahtar Alanlar |
| :--- | :--- | :--- |
| \`projects_events\` | Proje & Etkinlik Havuzu | \`id\`, \`title\`, \`departmentId\`, \`advisorId\`, \`sdgGoals\` (array), \`status\`, \`targetGrades\`, \`startDate\`, \`impactReport\` |
| \`curriculums\` | Müfredat & SKA Entegrasyonu | \`id\`, \`departmentId\`, \`teacherName\`, \`courseName\`, \`gradeLevel\`, \`learningOutcome\`, \`sdgGoals\`, \`studentCount\` |
| \`campusMetrics\` | Yeşil Kampüs Tüketim & Atık | \`id\`, \`period\` (YYYY-MM), \`electricityKwh\`, \`waterM3\`, \`paperReams\`, \`recyclingPaperKg\`, \`compostOrganicKg\`, audit trail alanları |
| \`profiles\` | Kullanıcı ve Öğretmen Profilleri | \`id\`, \`name\`, \`email\`, \`role\`, \`departmentId\`, \`title\`, \`avatar\`, \`customPermissions\`, \`isCasCoordinator\` |
| \`academicYears\` | Akademik Yıl Takvimi | \`id\`, \`name\`, \`startDate\`, \`endDate\`, \`isActive\`, \`totalStudents\`, \`description\` |
| \`rolePermissions\` | Rol Yetki Yapılandırması | \`role\`, \`allowedTabs\`, \`permissions\` (\`RoleActionPermissions\`) |
| \`activityLogs\` | Güvenlik & Denetim Günlüğü | \`id\`, \`userId\`, \`userName\`, \`actionType\`, \`category\`, \`timestamp\`, \`sessionDurationSeconds\`, \`details\` |
        `,
      }
    ]
  },
  {
    id: 'security-pwa',
    number: '6',
    title: 'Güvenlik Mimarisi, Firestore Kuralları ve PWA Kurulumu',
    shortTitle: 'Güvenlik & PWA',
    iconName: 'ShieldCheck',
    summary: 'Kurumsal Google Authentication, Firestore Security Rules, PWA masaüstü/mobil kurulumu ve denetim logları.',
    content: `
### 6.1 Firestore Güvenlik Kuralları (\`firestore.rules\`)
Veritabanı güvenliği sunucu tarafında doğrulanmış Firebase Security Rules ile korunur:
\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSchoolStaff() {
      return request.auth != null && 
        (request.auth.token.email.matches('.*@fmvisik[.]k12[.]tr$') || 
         request.auth.token.email.matches('.*@fmv[.]edu[.]tr$') ||
         request.auth.token.email == 'erkansagnak81@gmail.com');
    }

    match /projects_events/{projectId} {
      allow read: if true; // Şeffaf okul panosu
      allow create, update: if projectId != 'proj-1790150021117' && isSchoolStaff();
      allow delete: if isSchoolStaff();
    }

    match /{collectionName}/{document=**} {
      allow read: if true;
      allow write: if collectionName != 'projects_events' && isSchoolStaff();
    }
  }
}
\`\`\`
- **Şeffaf Okuma:** Projeler ve gösterge panelleri veli, öğrenci ve denetçilere açıktır.
- **Doğrulanmış Yazma:** Veri girişi, güncelleme veya silme işlemleri yalnızca \`@fmvisik.k12.tr\` veya \`@fmv.edu.tr\` kurumsal Google Workspace hesabı ile doğrulanmış personele açıktır.

### 6.2 Aktivite & Denetim Günlüğü (Audit Trail - ISO 8601)
Sistemde gerçekleşen tüm kritik işlemler zaman damgasıyla kayıt altına alınır:
- Kullanıcı giriş/çıkışları ve oturum süreleri (\`sessionDurationSeconds\`)
- Proje oluşturma, durum değişiklikleri ve onay adımları
- Müfredat ve kampüs metriği güncellemeleri
- Yetki matrisi değişiklikleri
Bu loglar Süper Admin haricinde silinemez ve dış denetimlerde kanıt olarak sunulabilir.

### 6.3 PWA (Progressive Web App) Kurulumu
EcoCampus hem masaüstü (Windows, macOS) hem de mobil (Android, iOS) cihazlarda yerel bir uygulama gibi çalışır:
- **Tek Tıkla Kurulum:** Üst çubukta beliren **"Uygulamayı Yükle (PWA)"** butonuna tıklanarak masaüstü simgesi oluşturulabilir.
- **Tam Ekran Deneyimi:** Tarayıcı adres çubuğu olmaksızın bağımsız pencerede (\`display: standalone\`) açılır.
- **Service Worker Önbelleği:** Çevrimdışı durumlarda bile temel arayüz anında açılır.
    `,
    subsections: []
  },
  {
    id: 'faq-troubleshooting',
    number: '7',
    title: 'Sıkça Sorulan Sorular (SSS) ve Sorun Giderme',
    shortTitle: 'SSS & Sorun Giderme',
    iconName: 'HelpCircle',
    summary: 'Sık karşılaşılan sorular, şifre/giriş adımları, PDF yazdırma ipuçları ve koordinatörlük iletişim kanalları.',
    content: `
### 7.1 Sıkça Sorulan Sorular
**S: Projemi onaya gönderdim, neden takvimde görünmüyor?**  
C: Takvimde yalnızca Koordinatör nihai onayından geçmiş (\`coordinator_approved\`) projeler yer alır. Projeniz henüz Zümre Başkanı veya Koordinatör onay kuyruğunda olabilir. Durumunu *Proje Havuzu* sekmesinden takip edebilirsiniz.

**S: Projem revizyona gönderildi, ne yapmalıyım?**  
C: Proje detayında zümre başkanınızın veya koordinatörün ilettiği revizyon notunu görebilirsiniz. İstenen düzeltmeleri yaptıktan sonra *"Güncelle ve Tekrar Onaya Gönder"* butonuna basmanız yeterlidir.

**S: İnternetim kesilirse verilerim kaybolur mu?**  
C: Hayır. Sınırsız IndexedDB yerel önbellek altyapımız sayesinde yaptığınız değişiklikler tarayıcınızda güvenle saklanır ve internet bağlantısı kurulduğunda Cloud Firestore ile otomatik eşitlenir.

**S: PDF raporu yazdırırken sayfa kenarları veya renkler çıkmıyor, ne yapmalıyım?**  
C: Tarayıcınızın yazdırma penceresinde **"Diğer ayarlar"** bölümünden **"Arka plan grafikleri" (Background graphics)** seçeneğini işaretleyin ve kenar boşluklarını **"Varsayılan"** veya **"Yok"** olarak ayarlayın.

**S: CAS projeleri normal projelerden nasıl ayrılır?**  
C: Zümre olarak *CAS (Creativity, Activity, Service)* seçildiğinde, proje doğrudan IB DP & CAS Koordinatörünün onay kuyruğuna düşer ve CAS servis öğrenimi kriterlerine göre değerlendirilir.

### 7.2 Destek ve İletişim
Sistemle ilgili teknik sorularınız, yeni özellik önerileriniz veya yetki talepleriniz için:
- **Sürdürülebilirlik Koordinatörlüğü:** FMV Erenköy Işık Lisesi ve Fen Lisesi
- **Kurumsal E-posta:** erkansagnak81@gmail.com / surdurulebilirlik@fmvisik.k12.tr
- **Teknik Altyapı:** FMV Erenköy Işık Bilişim Teknolojileri Zümresi
    `,
    subsections: []
  }
];
