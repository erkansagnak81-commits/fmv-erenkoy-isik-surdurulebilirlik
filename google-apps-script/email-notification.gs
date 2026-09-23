/**
 * FMV Erenköy Işık — Sürdürülebilirlik Proje Yönetim Sistemi
 * E-posta Bildirim Google Apps Script Backend
 * 
 * Bu dosyayı Google Apps Script editörüne yapıştırın ve Web App olarak deploy edin.
 * Deploy ayarları:
 *   - Execute as: Me (erkan.sagnak@fmvisik.k12.tr)
 *   - Who has access: Anyone
 * 
 * Deploy sonrası verilen URL'yi .env dosyasına VITE_EMAIL_NOTIFICATION_URL olarak ekleyin.
 */

/**
 * HTTP POST isteklerini karşılar — Frontend'den gelen e-posta bildirim istekleri
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'İstek gövdesi (postData) bulunamadı.' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    
    var action = payload.action; // 'project_submitted' | 'project_approved' | 'project_revision_needed' | 'impact_report_submitted'
    var recipientEmail = payload.recipientEmail;
    var recipientName = payload.recipientName || '';
    var projectTitle = payload.projectTitle || 'Proje';
    var senderName = payload.senderName || '';
    var departmentName = payload.departmentName || '';
    var status = payload.status || '';
    var feedback = payload.feedback || '';
    var appUrl = payload.appUrl || 'https://sdg-erenkoy.web.app';
    var recipientRole = payload.recipientRole || 'advisor';
    var advisorName = payload.advisorName || '';
    
    if (!recipientEmail || !action) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'recipientEmail ve action zorunlu alanlardır.' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    var subject = '';
    var htmlBody = '';
    
    switch (action) {
      case 'project_submitted':
        subject = '🔔 Yeni Proje Onay Bekliyor — ' + projectTitle;
        htmlBody = buildSubmittedEmail(recipientName, senderName, projectTitle, departmentName, appUrl);
        break;
        
      case 'project_approved':
        var approvalLabel = status === 'coordinator_approved' 
          ? 'Koordinatör Onayı (Resmi Takvime Alındı)' 
          : 'Bölüm Başkanı Onayı';
        if (status === 'coordinator_approved') {
          subject = (recipientRole === 'dept_head')
            ? '📌 Zümre Projesi Takvime Alındı: ' + projectTitle + ' (Sonuç Raporu Takibi)'
            : '🎉 Projeniz Onaylandı ve Takvime Alındı — ' + projectTitle;
        } else {
          subject = '✅ Projeniz Onaylandı — ' + projectTitle;
        }
        htmlBody = buildApprovedEmail(recipientName, senderName, projectTitle, approvalLabel, appUrl, recipientRole, advisorName, departmentName);
        break;
        
      case 'project_revision_needed':
        subject = '🔄 Projenizde Revizyon İstendi — ' + projectTitle;
        htmlBody = buildRevisionEmail(recipientName, senderName, projectTitle, feedback, appUrl);
        break;
        
      case 'impact_report_submitted':
        subject = '📊 Sonuç Raporu Girildi — ' + projectTitle;
        htmlBody = buildImpactReportEmail(recipientName, senderName, projectTitle, departmentName, appUrl);
        break;
        
      default:
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, error: 'Geçersiz action: ' + action })
        ).setMimeType(ContentService.MimeType.JSON);
    }
    
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: 'FMV Erenköy Işık — Sürdürülebilirlik Sistemi'
    });
    
    Logger.log('E-posta gönderildi: ' + recipientEmail + ' — ' + action);
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'E-posta başarıyla gönderildi.' })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('E-posta gönderim hatası: ' + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * CORS preflight OPTIONS istekleri için
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', service: 'FMV Erenköy Işık — E-posta Bildirim Servisi' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════
// E-POSTA ŞABLONLARI
// ═══════════════════════════════════════════════════════════════

function getEmailWrapper(content) {
  return '<!DOCTYPE html>' +
    '<html lang="tr">' +
    '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
    '<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:\'Segoe UI\',Tahoma,Geneva,Verdana,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;">' +
    '<tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">' +
    
    // Header
    '<tr><td style="background:linear-gradient(135deg,#065f46,#0d9488);padding:28px 32px;text-align:center;">' +
    '<h1 style="color:#ffffff;font-size:18px;margin:0 0 4px 0;">🌱 FMV Erenköy Işık Okulları</h1>' +
    '<p style="color:#a7f3d0;font-size:13px;margin:0;">Sürdürülebilirlik Proje Yönetim Sistemi</p>' +
    '</td></tr>' +
    
    // Content
    '<tr><td style="padding:32px;">' + content + '</td></tr>' +
    
    // Footer
    '<tr><td style="background-color:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">' +
    '<p style="color:#94a3b8;font-size:11px;margin:0;">Bu e-posta FMV Erenköy Işık Sürdürülebilirlik Sistemi tarafından otomatik olarak gönderilmiştir.</p>' +
    '<p style="color:#94a3b8;font-size:11px;margin:4px 0 0 0;">Yanıtlamayınız — sistem bildirimidir.</p>' +
    '</td></tr>' +
    
    '</table>' +
    '</td></tr></table>' +
    '</body></html>';
}

/**
 * 1. Proje Onaya Gönderildi — Bölüm Başkanına Bildirim
 */
function buildSubmittedEmail(recipientName, senderName, projectTitle, departmentName, appUrl) {
  var content = 
    '<p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px 0;">Sayın <strong>' + recipientName + '</strong>,</p>' +
    '<p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px 0;">' +
    'Aşağıdaki proje önerisi <strong>onayınızı beklemektedir</strong>:</p>' +
    
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;margin:0 0 24px 0;">' +
    '<tr><td style="padding:20px;">' +
    '<p style="color:#065f46;font-size:16px;font-weight:700;margin:0 0 8px 0;">📋 ' + projectTitle + '</p>' +
    '<p style="color:#475569;font-size:13px;margin:0 0 4px 0;"><strong>Danışman Öğretmen:</strong> ' + senderName + '</p>' +
    (departmentName ? '<p style="color:#475569;font-size:13px;margin:0;"><strong>Bölüm:</strong> ' + departmentName + '</p>' : '') +
    '</td></tr></table>' +
    
    '<p style="text-align:center;margin:0 0 16px 0;">' +
    '<a href="' + appUrl + '" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#065f46,#0d9488);color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Onay Masasına Git →</a>' +
    '</p>';
    
  return getEmailWrapper(content);
}

/**
 * 2. Proje Onaylandı — Danışman Öğretmen ve Bölüm Başkanına Bildirim
 */
function buildApprovedEmail(recipientName, approverName, projectTitle, approvalLabel, appUrl, recipientRole, advisorName, departmentName) {
  var isCoordinatorApproval = approvalLabel.indexOf('Koordinatör') !== -1;
  var isDeptHead = recipientRole === 'dept_head';

  var headerGreeting = isDeptHead 
    ? 'Sayın <strong>' + recipientName + '</strong> (Bölüm Başkanı / Koordinatör),'
    : 'Sayın <strong>' + recipientName + '</strong>,';

  var introText = '';
  if (isCoordinatorApproval) {
    if (isDeptHead) {
      introText = 'Zümreniz danışman öğretmenlerinden <strong>' + (advisorName || 'ilgili öğretmenimiz') + '</strong> tarafından yürütülen <strong>' + projectTitle + '</strong> başlıklı proje, Sürdürülebilirlik Genel Koordinatörlüğü (' + approverName + ') tarafından incelenmiş ve <strong>resmi olarak onaylanarak okul takvimine / yayına alınmıştır</strong>. 🌿';
    } else {
      introText = 'Tebrikler! <strong>' + projectTitle + '</strong> başlıklı projeniz/etkinliğiniz Sürdürülebilirlik Genel Koordinatörlüğü (' + approverName + ') tarafından incelenmiş ve <strong>resmi olarak onaylanarak okul takvimine / yayına alınmıştır</strong>. 🎉';
    }
  } else {
    introText = 'Projeniz bölüm başkanınız (<strong>' + approverName + '</strong>) tarafından onaylanmış ve nihai takvim onayı için Genel Koordinatörlüğe sevk edilmiştir. ✅';
  }

  // Sonuç Raporu Vurgu Kutusu (Koordinatör Onayı Sonrasında Gösterilir)
  var reminderBox = '';
  if (isCoordinatorApproval) {
    if (isDeptHead) {
      reminderBox = 
        '<div style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;padding:20px;margin:20px 0;">' +
        '<p style="color:#1e40af;font-size:15px;font-weight:700;margin:0 0 8px 0;">📊 Süreç Takibi &amp; Sonuç Raporu Hatırlatması</p>' +
        '<p style="color:#334155;font-size:13px;line-height:1.6;margin:0 0 8px 0;">' +
        'Etkinlik/proje gerçekleştirildikten sonra, zümrenizin sürdürülebilirlik kazanımlarının okul raporlarına yansıması için danışman öğretmenimiz (<strong>' + (advisorName || 'Danışman Öğretmen') + '</strong>) tarafından platform üzerinden <strong>"Sonuç Raporu"</strong> girilmesi gerekmektedir.' +
        '</p>' +
        '<p style="color:#64748b;font-size:12px;margin:0;">Zümre başkanlığı olarak etkinlik sonrası raporlama sürecini takip etmeniz ve öğretmenimize rehberlik etmeniz önemle rica olunur.</p>' +
        '</div>';
    } else {
      reminderBox = 
        '<div style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;padding:20px;margin:20px 0;">' +
        '<p style="color:#1e40af;font-size:15px;font-weight:700;margin:0 0 8px 0;">📊 Önemli Hatırlatma: Sonuç ve Etki Raporu Girişi</p>' +
        '<p style="color:#334155;font-size:13px;line-height:1.6;margin:0 0 10px 0;">' +
        'Projeniz/etkinliğiniz tamamlandığında, okul geneli yeşil kampüs ve akreditasyon metriklerine dahil edilebilmesi için <strong>platform üzerinden "Sonuç Raporu Gir" butonuna tıklayarak sonuç raporunu sisteme girmeniz gerekmektedir:</strong>' +
        '</p>' +
        '<ul style="color:#475569;font-size:13px;line-height:1.6;margin:0 0 10px 0;padding-left:20px;">' +
        '<li>Etkinliğe fiilen katılan gerçek öğrenci ve öğretmen sayısı</li>' +
        '<li>Elde edilen SKA / Sürdürülebilirlik çıktıları ve kazanımlar</li>' +
        '<li>Varsa etkinlik fotoğrafları veya belgeleri</li>' +
        '</ul>' +
        '<p style="color:#0369a1;font-size:12px;font-weight:600;margin:0;">💡 Sonuç raporu tamamlandığında projeniz "Tamamlanan Projeler Vitrini"nde yerini alacaktır.</p>' +
        '</div>';
    }
  }

  var content = 
    '<p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px 0;">' + headerGreeting + '</p>' +
    '<p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px 0;">' + introText + '</p>' +
    reminderBox +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ecfdf5;border-radius:12px;border:1px solid #a7f3d0;margin:0 0 24px 0;">' +
    '<tr><td style="padding:20px;">' +
    '<p style="color:#065f46;font-size:16px;font-weight:700;margin:0 0 8px 0;">🌱 ' + projectTitle + '</p>' +
    '<p style="color:#475569;font-size:13px;margin:0 0 4px 0;"><strong>Onay Aşaması:</strong> ' + approvalLabel + '</p>' +
    '<p style="color:#475569;font-size:13px;margin:0 0 4px 0;"><strong>Onaylayan:</strong> ' + approverName + '</p>' +
    (advisorName ? '<p style="color:#475569;font-size:13px;margin:0 0 4px 0;"><strong>Danışman Öğretmen:</strong> ' + advisorName + '</p>' : '') +
    (departmentName ? '<p style="color:#475569;font-size:13px;margin:0;"><strong>Bölüm / Zümre:</strong> ' + departmentName + '</p>' : '') +
    '</td></tr></table>' +
    
    '<p style="text-align:center;margin:0 0 16px 0;">' +
    '<a href="' + appUrl + '" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#065f46,#0d9488);color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Projeyi ve Detayları Görüntüle →</a>' +
    '</p>';
    
  return getEmailWrapper(content);
}

/**
 * 3. Revizyon İstendi — Danışman Öğretmene Bildirim
 */
function buildRevisionEmail(recipientName, reviewerName, projectTitle, feedback, appUrl) {
  var content = 
    '<p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px 0;">Sayın <strong>' + recipientName + '</strong>,</p>' +
    '<p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px 0;">' +
    'Projeniz için <strong style="color:#d97706;">revizyon istenmiştir</strong>. Lütfen aşağıdaki geri bildirimi inceleyiniz:</p>' +
    
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border-radius:12px;border:1px solid #fde68a;margin:0 0 24px 0;">' +
    '<tr><td style="padding:20px;">' +
    '<p style="color:#92400e;font-size:16px;font-weight:700;margin:0 0 8px 0;">🔄 ' + projectTitle + '</p>' +
    '<p style="color:#475569;font-size:13px;margin:0 0 8px 0;"><strong>Revizyon İsteyen:</strong> ' + reviewerName + '</p>' +
    (feedback ? '<div style="background-color:#ffffff;border-radius:8px;padding:12px 16px;border-left:4px solid #f59e0b;">' +
    '<p style="color:#78716c;font-size:12px;margin:0 0 4px 0;font-weight:600;">Revizyon Notu:</p>' +
    '<p style="color:#334155;font-size:14px;margin:0;line-height:1.5;white-space:pre-wrap;word-break:break-word;">' + feedback + '</p>' +
    '</div>' : '') +
    '</td></tr></table>' +
    
    '<p style="text-align:center;margin:0 0 16px 0;">' +
    '<a href="' + appUrl + '" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#92400e,#d97706);color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Projeyi Düzenle →</a>' +
    '</p>';
    
  return getEmailWrapper(content);
}

/**
 * 4. Sonuç Raporu Girildi — Koordinatör ve Bölüm Başkanına Bildirim
 */
function buildImpactReportEmail(recipientName, senderName, projectTitle, departmentName, appUrl) {
  var content = 
    '<p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px 0;">Sayın <strong>' + recipientName + '</strong>,</p>' +
    '<p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px 0;">' +
    'Aşağıdaki projenin <strong style="color:#7c3aed;">sonuç ve etki değerlendirme raporu</strong> girilmiştir:</p>' +
    
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ff;border-radius:12px;border:1px solid #c4b5fd;margin:0 0 24px 0;">' +
    '<tr><td style="padding:20px;">' +
    '<p style="color:#5b21b6;font-size:16px;font-weight:700;margin:0 0 8px 0;">📊 ' + projectTitle + '</p>' +
    '<p style="color:#475569;font-size:13px;margin:0 0 4px 0;"><strong>Raporu Giren:</strong> ' + senderName + '</p>' +
    (departmentName ? '<p style="color:#475569;font-size:13px;margin:0;"><strong>Bölüm:</strong> ' + departmentName + '</p>' : '') +
    '</td></tr></table>' +
    
    '<p style="text-align:center;margin:0 0 16px 0;">' +
    '<a href="' + appUrl + '" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#5b21b6,#7c3aed);color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Raporu İncele →</a>' +
    '</p>';
    
  return getEmailWrapper(content);
}
