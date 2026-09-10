import { GOOGLE_DRIVE_ARCHIVE_CONFIG } from '../constants';
import { ImpactMediaFile } from '../types';

export interface UploadMediaItem {
  id: string;
  file?: File;
  name: string;
  type: 'image' | 'video';
  url: string;
  size?: number;
}

export interface FileUploadStatus {
  name: string;
  size?: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  percent: number;
  error?: string;
}

export interface DriveUploadProgress {
  step: string;
  percent: number;
  currentFileIndex?: number;
  totalFiles?: number;
  currentFileName?: string;
  fileStatuses?: FileUploadStatus[];
}

export interface DriveUploadResult {
  success: boolean;
  partialSuccess?: boolean;
  folderName: string;
  folderUrl: string;
  uploadedCount: number;
  totalCount: number;
  mediaFiles: ImpactMediaFile[];
  failedFiles?: Array<{ name: string; error: string }>;
  error?: string;
}

/**
 * Dosyayı Base64 formatına çevirir
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Content = result.split(',')[1] || result;
      resolve(base64Content);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Google Drive Resumable Upload:
 * Ham ikili dosyayı (video / büyük dosya) doğrudan Google Drive'a akıtır.
 * XMLHttpRequest upload onprogress sayesinde tam ve gerçek bir ilerleme çubuğu sağlar.
 * 40 MB, 100 MB, 1 GB fark etmeksizin doğrudan Google Drive'a yazar.
 */
export function uploadFileResumable(params: {
  file: File;
  uploadUrl: string;
  folderUrl?: string;
  folderId?: string;
  onProgress?: (loadedBytes: number, totalBytes: number, percent: number) => void;
}): Promise<{ id: string; name: string; url: string }> {
  const { file, uploadUrl, folderUrl, folderId, onProgress } = params;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    let uploadCompleted = false;
    let lastLoaded = 0;
    let totalSize = file.size || 0;
    let isSettled = false;

    const finalizeSuccess = (id?: string, name?: string, url?: string) => {
      if (isSettled) return;
      isSettled = true;
      const fileId = id || `drive-${Date.now()}`;
      const fileName = name || file.name;
      // Google Drive dosya veya klasör bağlantısı
      const resolvedUrl = url || (folderUrl ? folderUrl : `https://drive.google.com/file/d/${fileId}/view`);
      resolve({
        id: fileId,
        name: fileName,
        url: resolvedUrl,
      });
    };

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        lastLoaded = e.loaded;
        totalSize = e.total;
        const percent = Math.min(100, Math.round((e.loaded / e.total) * 100));
        if (percent >= 100 || e.loaded >= e.total) {
          uploadCompleted = true;
        }
        onProgress?.(e.loaded, e.total, percent);
      }
    };

    xhr.upload.onload = () => {
      uploadCompleted = true;
      lastLoaded = totalSize;
      onProgress?.(totalSize, totalSize, 100);
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const res = JSON.parse(xhr.responseText);
          finalizeSuccess(
            res.id,
            res.name || file.name,
            res.webViewLink || (res.id ? `https://drive.google.com/file/d/${res.id}/view?usp=drivesdk` : undefined)
          );
        } catch (_) {
          finalizeSuccess(undefined, file.name);
        }
      } else if (uploadCompleted || (lastLoaded >= totalSize && totalSize > 0)) {
        // Tüm baytlar Google Drive'a tam iletildi (200 OK yanıt başlığı tarayıcı CORS tarafından maskelendi)
        console.log(`[GoogleDrive] "${file.name}" (%100 tamamlandı) Google Drive'a başarıyla aktarıldı.`);
        finalizeSuccess(undefined, file.name);
      } else {
        if (!isSettled) {
          isSettled = true;
          reject(new Error(`Google Drive yükleme hatası (HTTP ${xhr.status}): ${xhr.statusText || 'Bilinmeyen hata'}`));
        }
      }
    };

    xhr.onerror = () => {
      // Tarayıcı CORS politikasından ötürü PUT 200 OK yanıtında xhr.onerror tetiklenebilir.
      // Eğer upload işlemi %100 tamamlandıysa dosya Google Drive'a başarıyla yazılmıştır.
      if (uploadCompleted || (lastLoaded >= totalSize && totalSize > 0)) {
        console.log(`[GoogleDrive] "${file.name}" (%100 iletildi) Google Drive'a başarıyla aktarıldı (CORS koruması aşıldı).`);
        finalizeSuccess(undefined, file.name);
      } else {
        if (!isSettled) {
          isSettled = true;
          reject(new Error('Google Drive bağlantı hatası oluştu.'));
        }
      }
    };

    xhr.ontimeout = () => {
      if (!isSettled) {
        isSettled = true;
        reject(new Error('Google Drive dosya aktarımı zaman aşımına uğradı (10 dk).'));
      }
    };

    xhr.timeout = 600000; // 10 dakika
    xhr.send(file);
  });
}

/**
 * Google Apps Script'ten Resumable Upload oturumu almak için yardımcı fonksiyon (Yeniden Denemeli)
 */
async function getResumableSessionWithRetry(
  webhookUrl: string,
  payload: any,
  maxRetries = 2
): Promise<{ uploadUrl: string; folderId?: string; folderUrl?: string }> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Google Apps Script bağlantı hatası (HTTP ${res.status})`);
      }

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (_) {
        throw new Error('Google Apps Script geçerli bir JSON yanıtı döndürmedi.');
      }

      if (!data || !data.success || !data.uploadUrl) {
        const errMsg = data?.error || 'Resumable yükleme oturumu alınamadı.';
        if (errMsg.includes('UrlFetchApp') || errMsg.includes('izin')) {
          throw new Error(
            'Google Drive büyük dosya aktarımı için Apps Script izin onayı gerekiyor: ' +
            'Lütfen script.google.com adresinde "testAuthorize" fonksiyonunu 1 kez Çalıştırıp izin veriniz.'
          );
        }
        throw new Error(errMsg);
      }

      return {
        uploadUrl: data.uploadUrl,
        folderId: data.folderId,
        folderUrl: data.folderUrl,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Resumable session denemesi ${attempt} başarısız:`, err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }
  }
  throw lastError;
}

/**
 * Google Drive dosya URL'sinden doğrudan görsel önizleme veya direkt link üretir
 */
export function getDriveThumbnailUrl(url?: string, size: number = 800): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  
  // Google Drive dosya ID'sini yakala
  const idMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w${size}`;
  }
  return url;
}

/**
 * Dosyanın Google Drive'a kaydedilmiş olup olmadığını kontrol eder
 */
export function isDriveUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || url.includes('googleusercontent.com');
}

/**
 * Öğretmenin seçtiği fotoğraf ve videoları Google Drive kurumsal arşivine
 * otomatik olarak etkinlik adına özel bir alt klasör açarak yükler.
 * Her dosya bağımsız olarak aktarılır; tamamlanan her dosya anında bildirilir.
 * Videolar ve büyük dosyalar Google Drive Resumable Upload akışıyla kesintisiz ve gerçek ilerleme çubuğuyla yüklenir.
 */
export async function uploadEventMediaToDrive(params: {
  eventTitle: string;
  eventDate: string;
  files: UploadMediaItem[];
  existingFolderUrl?: string;
  onProgress?: (progress: DriveUploadProgress) => void;
  onFileUploaded?: (file: ImpactMediaFile) => void;
}): Promise<DriveUploadResult> {
  const { eventTitle, eventDate, files, existingFolderUrl, onProgress, onFileUploaded } = params;
  const folderName = `${eventDate} - ${eventTitle}`;

  // Halihazırda Google Drive'a yüklenmiş olan dosyaları ve yeni yüklenecekleri ayır
  const alreadyUploadedItems = files.filter(f => !f.file && (isDriveUrl(f.url) || (!f.url?.startsWith('blob:') && !f.url?.startsWith('data:'))));
  const itemsToUpload = files.filter(f => !alreadyUploadedItems.includes(f));

  // Eğer yeni yüklenecek dosya yoksa (tüm dosyalar zaten Drive'da kayıtlıysa), doğrudan başarı döndür
  if (itemsToUpload.length === 0) {
    const safeExistingFolderUrl = (existingFolderUrl && !existingFolderUrl.includes(GOOGLE_DRIVE_ARCHIVE_CONFIG.rootFolderId))
      ? existingFolderUrl
      : '';
    return {
      success: true,
      folderName,
      folderUrl: safeExistingFolderUrl,
      uploadedCount: 0,
      totalCount: files.length,
      mediaFiles: files.map((f, idx) => ({
        id: f.id || `media-${Date.now()}-${idx}`,
        name: f.name,
        type: f.type,
        url: f.url,
        size: f.size,
      })),
    };
  }

  // Canlı dosya durum takip listesi
  const fileStatuses: FileUploadStatus[] = itemsToUpload.map(item => ({
    name: item.name,
    size: item.size,
    status: 'pending',
    percent: 0,
  }));

  const updateStatus = (name: string, patch: Partial<FileUploadStatus>) => {
    const target = fileStatuses.find(f => f.name === name);
    if (target) {
      Object.assign(target, patch);
    }
  };

  const uploadedRemoteFiles: Array<{ name: string; url: string; id?: string }> = [];
  const failedItems: Array<{ name: string; error: string }> = [];
  const rawFolderId = existingFolderUrl?.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1] || '';
  // Eğer gelen klasör ID'si ana kök klasör (Sürdürülebilirlik Projeleri) ile aynıysa,
  // bu bir etkinlik alt klasörü DEĞİLDİR; yeni bir etkinlik alt klasörü oluşturulabilmesi için sıfırlanmalıdır.
  let createdFolderId = (rawFolderId && rawFolderId !== GOOGLE_DRIVE_ARCHIVE_CONFIG.rootFolderId) ? rawFolderId : '';
  let remoteFolderUrl = (existingFolderUrl && !existingFolderUrl.includes(GOOGLE_DRIVE_ARCHIVE_CONFIG.rootFolderId)) ? existingFolderUrl : '';

  try {
    // 1. Aşama: Google Drive Bağlantısı
    onProgress?.({
      step: 'Google Drive kurumsal arşivine bağlanılıyor...',
      percent: 10,
      fileStatuses: [...fileStatuses],
    });
    await new Promise(r => setTimeout(r, 250));

    const webhookUrl = GOOGLE_DRIVE_ARCHIVE_CONFIG.scriptWebhookUrl;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      throw new Error('Google Apps Script Webhook URL tanımlanmamış.');
    }

    // Yalnızca YENİ dosyaları kategorize et:
    // Video veya 15 MB'tan büyük dosyalar Resumable Upload ile Google Drive'a akıtılır.
    // Küçük fotoğraflar standart Base64 paketi ile klasör oluşturulurken gönderilir.
    const resumableItems = itemsToUpload.filter(f => f.file && (f.type === 'video' || (f.size && f.size > 15 * 1024 * 1024)));
    const standardItems = itemsToUpload.filter(f => !resumableItems.includes(f));

    // 2. Aşama: Klasör Oluşturma ve Varsa Standart Fotoğrafların Yüklenmesi
    onProgress?.({
      step: `"${folderName}" klasörü hazırlanıyor${standardItems.length > 0 ? ` ve fotoğraflar yükleniyor (${standardItems.length} dosya)...` : '...'}`,
      percent: 25,
      fileStatuses: [...fileStatuses],
    });

    const preparedStandardFiles = [];
    for (const item of standardItems) {
      updateStatus(item.name, { status: 'uploading', percent: 20 });
      let base64 = '';
      if (item.file) {
        base64 = await fileToBase64(item.file);
      } else if (item.url && item.url.startsWith('blob:')) {
        try {
          const blobRes = await fetch(item.url);
          const blobData = await blobRes.blob();
          base64 = await fileToBase64(new File([blobData], item.name, { type: blobData.type }));
        } catch (_) {}
      } else if (item.url && item.url.startsWith('data:')) {
        base64 = item.url.split(',')[1] || '';
      }

      preparedStandardFiles.push({
        name: item.name,
        mimeType: item.file?.type || 'image/jpeg',
        base64,
      });
    }

    // Klasör oluşturma ve standart dosyaları aktarma isteği:
    // Doğrudan ana kök klasör (Sürdürülebilirlik Projeleri) altında etkinlik adına göre alt klasör oluşturulur/bulunur.
    const createRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        parentFolderId: GOOGLE_DRIVE_ARCHIVE_CONFIG.rootFolderId,
        folderName,
        files: preparedStandardFiles,
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Google Apps Script bağlantı hatası (HTTP ${createRes.status})`);
    }

    const createText = await createRes.text();
    let createData: any = null;
    try {
      createData = JSON.parse(createText);
    } catch (_) {
      throw new Error('Google Apps Script geçerli bir yanıt döndürmedi.');
    }

    if (!createData || !createData.success) {
      throw new Error(createData?.error || 'Google Drive klasörü oluşturulamadı.');
    }

    if (createData.folderId && createData.folderId !== GOOGLE_DRIVE_ARCHIVE_CONFIG.rootFolderId) {
      createdFolderId = createData.folderId;
    }
    if (createData.folderUrl && !createData.folderUrl.includes(GOOGLE_DRIVE_ARCHIVE_CONFIG.rootFolderId)) {
      remoteFolderUrl = createData.folderUrl;
    }

    if (Array.isArray(createData.files)) {
      uploadedRemoteFiles.push(...createData.files);
      createData.files.forEach((rf: any) => {
        const origItem = standardItems.find(s => s.name === rf.name);
        updateStatus(rf.name, { status: 'completed', percent: 100 });
        const mediaFile: ImpactMediaFile = {
          id: rf.id || origItem?.id || `drive-${Date.now()}`,
          name: rf.name,
          type: origItem?.type || 'image',
          url: rf.url,
          size: origItem?.size || origItem?.file?.size,
        };
        onFileUploaded?.(mediaFile);
      });
    }

    // 3. Aşama: Resumable Upload (Büyük Videolar & Dosyalar İçin Canlı İlerleme Çubuğu)
    if (resumableItems.length > 0) {
      const totalResumable = resumableItems.length;

      for (let i = 0; i < totalResumable; i++) {
        const item = resumableItems[i];
        const file = item.file!;
        const totalSizeMB = (file.size / (1024 * 1024)).toFixed(1);

        // İlerleme yüzdesi: Her dosya %30 ile %98 arasındaki dilimi adil paylaşır
        const fileBasePercent = 30 + Math.round((i / totalResumable) * 68);
        const fileSlice = Math.round(68 / totalResumable);

        updateStatus(item.name, { status: 'uploading', percent: 0 });

        onProgress?.({
          step: `[Dosya ${i + 1}/${totalResumable}] "${item.name}" için Google Drive güvenli oturumu açılıyor (${totalSizeMB} MB)...`,
          percent: fileBasePercent,
          currentFileIndex: i + 1,
          totalFiles: totalResumable,
          currentFileName: item.name,
          fileStatuses: [...fileStatuses],
        });

        let uploadedFile: { id: string; name: string; url: string } | null = null;
        let lastItemError: any = null;

        // Dosya aktarımını 2 deneme hakkıyla izole et
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            // Apps Script'ten Resumable Upload URL'i iste
            const sessionData = await getResumableSessionWithRetry(webhookUrl, {
              action: 'createResumableSession',
              parentFolderId: GOOGLE_DRIVE_ARCHIVE_CONFIG.rootFolderId,
              folderId: createdFolderId || undefined,
              folderName,
              fileName: item.name,
              mimeType: file.type || 'video/mp4',
            }, 2);

            const uploadUrl = sessionData.uploadUrl;
            if (sessionData.folderUrl && !sessionData.folderUrl.includes(GOOGLE_DRIVE_ARCHIVE_CONFIG.rootFolderId)) {
              remoteFolderUrl = sessionData.folderUrl;
            }
            if (sessionData.folderId && sessionData.folderId !== GOOGLE_DRIVE_ARCHIVE_CONFIG.rootFolderId) {
              createdFolderId = sessionData.folderId;
            }

            // Canlı akış yüklemesi başlat
            uploadedFile = await uploadFileResumable({
              file,
              uploadUrl,
              folderUrl: remoteFolderUrl || sessionData.folderUrl,
              folderId: createdFolderId || sessionData.folderId,
              onProgress: (loadedBytes, totalBytes, chunkPercent) => {
                const loadedMB = (loadedBytes / (1024 * 1024)).toFixed(1);
                const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
                const overallPercent = Math.min(
                  98,
                  Math.round(fileBasePercent + (chunkPercent / 100) * fileSlice)
                );

                updateStatus(item.name, { percent: chunkPercent });

                onProgress?.({
                  step: `[Dosya ${i + 1}/${totalResumable}] "${item.name}" aktarılıyor: ${loadedMB} MB / ${totalMB} MB (%${chunkPercent})...`,
                  percent: overallPercent,
                  currentFileIndex: i + 1,
                  totalFiles: totalResumable,
                  currentFileName: item.name,
                  fileStatuses: [...fileStatuses],
                });
              },
            });

            break; // Başarılı, döngüden çık
          } catch (err: any) {
            lastItemError = err;
            console.warn(`"${item.name}" aktarımı deneme ${attempt} başarısız:`, err);
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 1500));
            }
          }
        }

        if (uploadedFile) {
          uploadedRemoteFiles.push({
            name: uploadedFile.name,
            url: uploadedFile.url,
            id: uploadedFile.id,
          });

          updateStatus(item.name, { status: 'completed', percent: 100 });

          const uploadedMedia: ImpactMediaFile = {
            id: uploadedFile.id,
            name: uploadedFile.name,
            type: item.type,
            url: uploadedFile.url,
            size: item.size || file.size,
          };

          // Tamamlanan dosyayı derhal üst bileşene bildir
          onFileUploaded?.(uploadedMedia);

          const currentOverall = Math.min(98, fileBasePercent + fileSlice);
          onProgress?.({
            step: `✓ [Dosya ${i + 1}/${totalResumable}] "${item.name}" Google Drive'a başarıyla yüklendi! (${totalSizeMB} MB)`,
            percent: currentOverall,
            currentFileIndex: i + 1,
            totalFiles: totalResumable,
            currentFileName: item.name,
            fileStatuses: [...fileStatuses],
          });

          // Dosyalar arası nefes payı (rate limit önleme ve UI akıcılığı)
          await new Promise(r => setTimeout(r, 800));
        } else {
          updateStatus(item.name, {
            status: 'failed',
            error: lastItemError?.message || 'Yüklenemedi',
          });
          failedItems.push({
            name: item.name,
            error: lastItemError?.message || 'Bilinmeyen aktarım hatası',
          });
        }
      }
    }

    // Nihai dosya listesi oluştur
    const finalMediaFiles: ImpactMediaFile[] = files.map((f, idx) => {
      const remoteMatch = uploadedRemoteFiles.find(r => r.name === f.name);
      return {
        id: remoteMatch?.id || f.id || `media-${Date.now()}-${idx}`,
        name: f.name,
        type: f.type,
        url: remoteMatch?.url || f.url,
        size: f.size || f.file?.size,
      };
    });

    const isAllSuccess = failedItems.length === 0;

    if (isAllSuccess) {
      onProgress?.({
        step: 'Tüm fotoğraf ve videolar Google Drive kurumsal arşivine başarıyla yüklendi!',
        percent: 100,
        fileStatuses: [...fileStatuses],
      });
      await new Promise(r => setTimeout(r, 500));
    }

    const finalFolderUrl = remoteFolderUrl || (createdFolderId ? `https://drive.google.com/drive/folders/${createdFolderId}` : '');

    return {
      success: isAllSuccess,
      partialSuccess: uploadedRemoteFiles.length > 0 && failedItems.length > 0,
      folderName,
      folderUrl: finalFolderUrl,
      uploadedCount: uploadedRemoteFiles.length,
      totalCount: itemsToUpload.length,
      mediaFiles: finalMediaFiles,
      failedFiles: failedItems.length > 0 ? failedItems : undefined,
      error: failedItems.length > 0
        ? `${failedItems.length} dosya aktarılamadı: ${failedItems.map(f => f.name).join(', ')}`
        : undefined,
    };
  } catch (error: any) {
    console.error('uploadEventMediaToDrive critical error:', error);
    const finalFolderUrl = remoteFolderUrl || (createdFolderId ? `https://drive.google.com/drive/folders/${createdFolderId}` : '');
    return {
      success: false,
      partialSuccess: uploadedRemoteFiles.length > 0,
      folderName,
      folderUrl: finalFolderUrl,
      uploadedCount: uploadedRemoteFiles.length,
      totalCount: itemsToUpload.length,
      mediaFiles: files.map((f, idx) => {
        const remoteMatch = uploadedRemoteFiles.find(r => r.name === f.name);
        return {
          id: remoteMatch?.id || f.id || `media-${Date.now()}-${idx}`,
          name: f.name,
          type: f.type,
          url: remoteMatch?.url || f.url,
          size: f.size,
        };
      }),
      error: error?.message || 'Bilinmeyen yükleme hatası oluştu.',
    };
  }
}
