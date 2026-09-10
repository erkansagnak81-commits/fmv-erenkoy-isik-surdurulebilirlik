import React, { useState, useRef } from 'react';
import { ProjectEvent, ImpactReport, ImpactOutputItem } from '../../types';
import { GOOGLE_DRIVE_ARCHIVE_CONFIG } from '../../constants';
import { 
  uploadEventMediaToDrive, 
  DriveUploadProgress, 
  UploadMediaItem,
  DriveUploadResult,
  isDriveUrl
} from '../../services/googleDriveService';
import { 
  X, 
  CheckCircle2, 
  Award, 
  Camera, 
  Video, 
  Plus, 
  Trash2, 
  Upload, 
  AlertCircle, 
  Users, 
  GraduationCap, 
  FolderOpen, 
  Image as ImageIcon,
  FileText,
  CloudUpload,
  Sparkles,
  Loader2,
  ExternalLink,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ImpactReportModalProps {
  project: ProjectEvent;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectId: string, report: Omit<ImpactReport, 'id' | 'completedAt'>) => void;
}

export const ImpactReportModal: React.FC<ImpactReportModalProps> = ({
  project,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const existingReport = project.impactReport;

  // 1. Katılımcı Sayıları (Öğrenci & Öğretmen Ayrılmış)
  const [studentParticipants, setStudentParticipants] = useState<number>(
    existingReport?.studentParticipants !== undefined 
      ? existingReport.studentParticipants 
      : (existingReport?.actualParticipants ? Math.round(existingReport.actualParticipants * 0.85) : 35)
  );
  const [teacherParticipants, setTeacherParticipants] = useState<number>(
    existingReport?.teacherParticipants !== undefined 
      ? existingReport.teacherParticipants 
      : (existingReport?.actualParticipants ? Math.max(1, Math.round(existingReport.actualParticipants * 0.15)) : 5)
  );

  // 2. Çoklu Somut Çıktı Kalemleri
  const [impactOutputs, setImpactOutputs] = useState<ImpactOutputItem[]>(() => {
    return existingReport?.impactOutputs && existingReport.impactOutputs.length > 0
      ? existingReport.impactOutputs
      : [
          {
            id: 'out-init-1',
            description: existingReport?.impactMetricUnit || 'Geri kazanılan atık / kompost',
            value: existingReport?.impactMetricValue || 80,
            unit: 'kg'
          }
        ];
  });

  // 3. Değerlendirme & Kazanım Notları
  const [evaluationNotes, setEvaluationNotes] = useState<string>(
    existingReport?.evaluationNotes || ''
  );

  // 4. Medya & Kanıt Dosyaları (Fotoğraf & Video)
  const initialMedia: UploadMediaItem[] = existingReport?.mediaFiles && existingReport.mediaFiles.length > 0
    ? existingReport.mediaFiles
    : existingReport?.photoUrls && existingReport.photoUrls.length > 0
      ? existingReport.photoUrls.map((url, idx) => ({
          id: `media-init-${idx}`,
          name: `Etkinlik Görseli ${idx + 1}`,
          type: 'image' as const,
          url,
        }))
      : [];

  const [mediaFiles, setMediaFiles] = useState<UploadMediaItem[]>(initialMedia);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<DriveUploadProgress | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<DriveUploadResult | null>(null);
  const mediaSectionRef = useRef<HTMLDivElement>(null);

  // Yükleme tamamlanan her dosya için anında state güncellemesi (Kayıp önleyici)
  const handleFileUploaded = (uploadedMedia: { id: string; name: string; type: 'image' | 'video'; url: string; size?: number }) => {
    setMediaFiles(prev => prev.map(m => {
      if (m.name === uploadedMedia.name) {
        return {
          id: uploadedMedia.id,
          name: uploadedMedia.name,
          type: uploadedMedia.type,
          url: uploadedMedia.url,
          size: uploadedMedia.size || m.size,
          file: undefined, // File temizlenir -> anında Drive arşivli olarak işaretlenir
        };
      }
      return m;
    }));
  };

  // Halihazırda Google Drive'da kayıtlı olan dosyalar ile cihaza yeni seçilenleri kesin olarak ayır
  const isItemUploaded = (item: UploadMediaItem) => {
    if (item.file) return false;
    if (item.url?.startsWith('blob:')) return false;
    return Boolean(
      isDriveUrl(item.url) || 
      (item.url && !item.url.startsWith('data:'))
    );
  };

  const archivedFiles = mediaFiles.filter(isItemUploaded);
  const pendingFiles = mediaFiles.filter(item => !isItemUploaded(item));
  
  // Etkinliğe ait gerçek alt klasör mü (kök klasör değilse)
  const isEventSubFolder = (url?: string) => Boolean(url && !url.includes(GOOGLE_DRIVE_ARCHIVE_CONFIG.rootFolderId));
  const existingSubFolderUrl = isEventSubFolder(existingReport?.driveFolderUrl) ? existingReport?.driveFolderUrl : undefined;

  if (!isOpen) return null;

  // Hesaplanan toplam katılımcı
  const totalParticipants = (Number(studentParticipants) || 0) + (Number(teacherParticipants) || 0);

  // Standart önerilen Google Drive klasör adı
  const suggestedFolderName = `${project.startDate} - ${project.title}`;

  // Çıktı kalemi ekle
  const handleAddOutput = () => {
    setImpactOutputs(prev => [
      ...prev,
      {
        id: `out-${Date.now()}-${prev.length + 1}`,
        description: '',
        value: 1,
        unit: 'adet'
      }
    ]);
  };

  // Çıktı kalemi güncelle
  const handleUpdateOutput = (id: string, field: keyof ImpactOutputItem, value: any) => {
    setImpactOutputs(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Çıktı kalemi sil
  const handleRemoveOutput = (id: string) => {
    if (impactOutputs.length <= 1) {
      alert('En az bir somut çıktı kalemi bulunmalıdır.');
      return;
    }
    setImpactOutputs(prev => prev.filter(item => item.id !== id));
  };

  // Dosya Yükleme (Fotoğraf & Video)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setValidationError(null);
    const newMediaItems: UploadMediaItem[] = [];

    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video');
      const isImage = file.type.startsWith('image');

      if (!isVideo && !isImage) {
        alert(`"${file.name}" desteklenmeyen bir dosya türü. Yalnızca fotoğraf ve video yükleyebilirsiniz.`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newMediaItems.push({
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        type: isVideo ? 'video' : 'image',
        url: previewUrl,
        size: file.size,
        file: file,
      });
    });

    setMediaFiles(prev => [...prev, ...newMediaItems]);
  };

  // Medya dosyası sil
  const handleRemoveMedia = (id: string) => {
    if (isUploading) return;
    setMediaFiles(prev => prev.filter(m => m.id !== id));
  };

  // Form Gönderimi ve Otomatik Google Drive Yükleme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    setValidationError(null);

    // Kural 1: Katılımcı kontrolü (Öğrenci veya öğretmenden en az biri > 0 olmalı)
    if (totalParticipants <= 0) {
      setValidationError('Katılımcı sayısı zorunludur: Lütfen öğrenci veya öğretmen katılımcı sayısından en az birine 0\'dan büyük bir değer giriniz.');
      return;
    }

    // Kural 2: Somut çıktı kalemleri kontrolü
    const hasValidOutput = impactOutputs.some(o => o.description.trim() && Number(o.value) > 0);
    if (!hasValidOutput) {
      setValidationError('Lütfen en az bir somut çıktı kalemi için geçerli açıklama ve sayısal değer giriniz.');
      return;
    }

    // Kural 3: Medya / Kanıt zorunluluğu (Kullanıcının kesin talebi)
    if (mediaFiles.length === 0) {
      setValidationError('Etkinlik kanıtı zorunludur: Fotoğraf veya video eklenmeden rapor kaydedilemez. Lütfen en az bir adet etkinlik görseli veya videosu ekleyiniz.');
      return;
    }

    const primaryOutput = impactOutputs[0];

    // EĞER YENİ YÜKLENECEK DOSYA YOKSA (Tüm dosyalar zaten Google Drive'da kayıtlıysa):
    if (pendingFiles.length === 0) {
      const legacyPhotoUrls = mediaFiles
        .filter(m => m.type === 'image')
        .map(m => m.url);

      const resolvedFolderUrl = existingSubFolderUrl;

      onSubmit(project.id, {
        projectId: project.id,
        actualParticipants: totalParticipants,
        studentParticipants: Number(studentParticipants) || 0,
        teacherParticipants: Number(teacherParticipants) || 0,
        impactOutputs,
        impactMetricValue: primaryOutput?.value,
        impactMetricUnit: primaryOutput ? `${primaryOutput.description} (${primaryOutput.unit})` : undefined,
        evaluationNotes,
        photoUrls: legacyPhotoUrls,
        mediaFiles: mediaFiles,
        driveFolderUrl: resolvedFolderUrl,
      });

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setCompletedResult({
        success: true,
        folderName: suggestedFolderName,
        folderUrl: resolvedFolderUrl || '',
        uploadedCount: 0,
        totalCount: mediaFiles.length,
        mediaFiles: mediaFiles.map(m => ({
          id: m.id,
          name: m.name,
          type: m.type,
          url: m.url,
          size: m.size,
        })),
      });
      return;
    }

    // Otomatik Yükleme Sürecini Başlat (Yeni dosyalar var ise)
    setIsUploading(true);
    setUploadProgress({
      step: 'Google Drive kurumsal arşivine bağlanılıyor...',
      percent: 10,
    });

    const uploadResult = await uploadEventMediaToDrive({
      eventTitle: project.title,
      eventDate: project.startDate,
      files: mediaFiles,
      existingFolderUrl: existingSubFolderUrl,
      onProgress: (prog) => {
        setUploadProgress(prog);
      },
      onFileUploaded: handleFileUploaded,
    });

    if (!uploadResult.success) {
      setIsUploading(false);

      // Kısmi başarı durumu: Bazı dosyalar yüklendi ama bir veya daha fazlası aktarılamadı
      if (uploadResult.uploadedCount > 0) {
        const savedMedia = uploadResult.mediaFiles.filter(m => isDriveUrl(m.url));
        if (savedMedia.length > 0) {
          onSubmit(project.id, {
            projectId: project.id,
            actualParticipants: totalParticipants,
            studentParticipants: Number(studentParticipants) || 0,
            teacherParticipants: Number(teacherParticipants) || 0,
            impactOutputs,
            impactMetricValue: primaryOutput?.value,
            impactMetricUnit: primaryOutput ? `${primaryOutput.description} (${primaryOutput.unit})` : undefined,
            evaluationNotes,
            photoUrls: savedMedia.filter(m => m.type === 'image').map(m => m.url),
            mediaFiles: savedMedia,
            driveFolderUrl: isEventSubFolder(uploadResult.folderUrl) ? uploadResult.folderUrl : existingSubFolderUrl,
          });
        }

        const failedNames = uploadResult.failedFiles?.map(f => `"${f.name}"`).join(', ') || 'bazı dosyalar';
        setValidationError(
          `✓ ${uploadResult.uploadedCount} dosya Google Drive kurumsal arşivine başarıyla kaydedildi ve korundu. ` +
          `Ancak ${failedNames} aktarılırken bir sorun oluştu (${uploadResult.error || 'bağlantı hatası'}). ` +
          `Yüklenen dosyalarınız güvenle saklandı; lütfen kalan dosyaları tamamlamak için tekrar "Drive'a Yükle" butonuna tıklayınız.`
        );
      } else {
        setValidationError(uploadResult.error || 'Google Drive yüklemesi sırasında bir hata oluştu.');
      }

      mediaSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Kutlama konfeti efekti
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {}

    const legacyPhotoUrls = uploadResult.mediaFiles
      .filter(m => m.type === 'image')
      .map(m => m.url);

    onSubmit(project.id, {
      projectId: project.id,
      actualParticipants: totalParticipants,
      studentParticipants: Number(studentParticipants) || 0,
      teacherParticipants: Number(teacherParticipants) || 0,
      impactOutputs,
      impactMetricValue: primaryOutput?.value,
      impactMetricUnit: primaryOutput ? `${primaryOutput.description} (${primaryOutput.unit})` : undefined,
      evaluationNotes,
      photoUrls: legacyPhotoUrls,
      mediaFiles: uploadResult.mediaFiles,
      driveFolderUrl: isEventSubFolder(uploadResult.folderUrl) ? uploadResult.folderUrl : existingSubFolderUrl,
    });

    setIsUploading(false);
    setCompletedResult(uploadResult);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 relative animate-in fade-in zoom-in duration-200">
        
        {/* ARKA PLAN GOOGLE DRIVE YÜKLEME OVERLAY EKRANI */}
        {isUploading && (
          <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 p-0.5 shadow-2xl shadow-blue-500/20">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center p-3">
                  <CloudUpload className="w-8 h-8 text-teal-300 animate-pulse" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
            </div>

            <h3 className="text-base font-extrabold text-white mb-1 flex items-center gap-2">
              <span>Google Drive'a Otomatik Aktarılıyor</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </h3>

            <p className="text-xs text-blue-200 font-medium max-w-md mb-3 leading-relaxed min-h-[28px] flex items-center justify-center">
              {uploadProgress?.step || 'Google Drive kurumsal arşivine bağlanılıyor...'}
            </p>

            {/* İlerleme Çubuğu */}
            <div className="w-full max-w-sm bg-slate-800/90 rounded-full h-2.5 overflow-hidden border border-slate-700/80 p-0.5 mb-1.5 shadow-inner">
              <div 
                className="bg-gradient-to-r from-teal-400 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                style={{ width: `${Math.max(5, uploadProgress?.percent || 0)}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full max-w-sm text-[11px] font-semibold text-slate-400 px-1 mb-2">
              <span className="truncate max-w-[240px] text-slate-300">Klasör: {suggestedFolderName}</span>
              <span className="text-teal-300 font-mono font-bold">%{uploadProgress?.percent || 0}</span>
            </div>

            {/* Dosyaların Canlı Durum Listesi */}
            {uploadProgress?.fileStatuses && uploadProgress.fileStatuses.length > 0 && (
              <div className="w-full max-w-sm my-2 space-y-1.5 max-h-36 overflow-y-auto text-left pr-1">
                {uploadProgress.fileStatuses.map((st, sIdx) => (
                  <div 
                    key={sIdx} 
                    className={`flex items-center justify-between p-2 rounded-xl text-[11px] border transition-all ${
                      st.status === 'completed'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                        : st.status === 'uploading'
                          ? 'bg-teal-950/70 border-teal-400/50 text-teal-100 shadow-xs ring-1 ring-teal-500/30'
                          : st.status === 'failed'
                            ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {st.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {st.status === 'uploading' && <Loader2 className="w-3.5 h-3.5 text-teal-300 animate-spin shrink-0" />}
                      {st.status === 'pending' && <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                      {st.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                      <span className="truncate font-medium">{st.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono font-semibold">
                      {st.status === 'completed' && (
                        <span className="text-emerald-300 bg-emerald-900/60 px-1.5 py-0.5 rounded">✓ Yüklendi</span>
                      )}
                      {st.status === 'uploading' && (
                        <span className="text-teal-200 bg-teal-900/80 px-1.5 py-0.5 rounded animate-pulse">%{st.percent}</span>
                      )}
                      {st.status === 'pending' && (
                        <span className="text-slate-400">Sırada</span>
                      )}
                      {st.status === 'failed' && (
                        <span className="text-rose-300 bg-rose-900/60 px-1.5 py-0.5 rounded">Hata</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setIsUploading(false);
                setValidationError('Yükleme kullanıcı tarafından durduruldu.');
              }}
              className="mt-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              Yüklemeyi İptal Et
            </button>
          </div>
        )}

        {/* Modal Başlığı */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Etkinlik Sonuç &amp; Etki Raporu</h2>
              <p className="text-xs text-teal-200 truncate max-w-md">{project.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BİLGİLENDİRME & BAŞARI EKRANI (POPUP ENGELİNE TAKILMAYAN RESMİ BİLGİLENDİRME) */}
        {completedResult ? (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mb-4 text-emerald-600 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1.5">
              {completedResult.uploadedCount > 0 
                ? '🎉 Kanıtlar Google Drive\'a Başarıyla Yüklendi!' 
                : '✓ Sonuç Raporu Başarıyla Güncellendi!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mb-6 leading-relaxed">
              {completedResult.uploadedCount > 0 
                ? `Etkinlik sonuç raporu sisteme işlendi ve ${completedResult.uploadedCount} adet fotoğraf/video Google Drive kurumsal arşivindeki etkinlik klasörüne aktarıldı.` 
                : 'Etkinlik sonuç raporu güncellendi. Yeni dosya seçilmediği için mevcut kayıtlı kanıtlar korundu.'}
            </p>

            {/* Kurumsal Arşiv Bilgilendirme Kartı */}
            <div className="w-full max-w-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4 mb-6 text-left shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Google Drive Kurumsal Arşivi
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {completedResult.folderName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ana Klasör: Sürdürülebilirlik Projeleri
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Güvenle Arşivlendi</span>
                </div>
              </div>
            </div>

            {/* Dosyalar Özeti */}
            <div className="w-full max-w-lg mb-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Kaydedilen Kanıt Dosyaları ({completedResult.mediaFiles.length})</span>
                <span className="text-[11px] text-emerald-600 font-medium">Tümü Arşivlendi</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2.5 bg-slate-50/70">
                {completedResult.mediaFiles.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {m.type === 'video' ? <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <Camera className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                      <span className="truncate text-slate-700 font-medium max-w-[240px]">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{m.size ? `${(m.size / (1024 * 1024)).toFixed(1)} MB` : 'Kaydedildi'}</span>
                      </div>
                      {m.url && isDriveUrl(m.url) && (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-semibold transition-colors"
                        >
                          <span>Aç</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                Tamamla ve Kapat
              </button>
            </div>
          </div>
        ) : (
          /* Form Alanı */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Proje Bilgi Özeti */}
          <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/70 text-xs text-emerald-950 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span><strong>Danışman Öğretmen:</strong> {project.advisorName}</span>
              <span className="text-emerald-700"><strong>Tarih:</strong> {project.startDate}</span>
            </div>
            {project.collaboratingTeachers && project.collaboratingTeachers.length > 0 && (
              <div className="text-emerald-800 pt-0.5">
                <strong>Ortak Çalışan Öğretmenler:</strong> {project.collaboratingTeachers.join(', ')}
              </div>
            )}
          </div>

          {/* Validasyon Hata Uyarısı */}
          {validationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium">{validationError}</div>
            </div>
          )}

          {/* 1. KATILIMCI SAYILARI (ÖĞRENCİ & ÖĞRETMEN AYRI) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-700" />
                <span>Katılımcı Sayısı * (En Az Biri Doldurulmalıdır)</span>
              </label>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Toplam: {totalParticipants} Katılımcı
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Öğrenci Katılımcı Sayısı</span>
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={isUploading}
                  value={studentParticipants}
                  onChange={(e) => setStudentParticipants(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 disabled:opacity-50"
                />
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Öğretmen Katılımcı Sayısı</span>
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={isUploading}
                  value={teacherParticipants}
                  onChange={(e) => setTeacherParticipants(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* 2. ÇOKLU SOMUT ÇIKTI KALEMLERİ */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span>Somut Çıktı ve Etki Kalemleri *</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Birden fazla çıktı girebilirsiniz (Örn: 80 kg organik atık ve 5 adet katılım sertifikası).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddOutput}
                disabled={isUploading}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Çıktı Ekle</span>
              </button>
            </div>

            <div className="space-y-2">
              {impactOutputs.map((item, index) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors"
                >
                  <span className="w-5 text-center text-xs font-bold text-slate-400">
                    {index + 1}.
                  </span>

                  {/* Çıktı Açıklaması */}
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      disabled={isUploading}
                      value={item.description}
                      onChange={(e) => handleUpdateOutput(item.id, 'description', e.target.value)}
                      placeholder="Çıktı / Etki Açıklaması (Örn: Geri kazanılan atık, sertifika)"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Sayısal Değer */}
                  <div className="w-24">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      required
                      disabled={isUploading}
                      value={item.value}
                      onChange={(e) => handleUpdateOutput(item.id, 'value', parseFloat(e.target.value) || 0)}
                      placeholder="Miktar"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-center bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Birim */}
                  <div className="w-24">
                    <input
                      type="text"
                      required
                      disabled={isUploading}
                      value={item.unit}
                      onChange={(e) => handleUpdateOutput(item.id, 'unit', e.target.value)}
                      placeholder="Birim (kg, adet vb.)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Sil Butonu */}
                  <button
                    type="button"
                    onClick={() => handleRemoveOutput(item.id)}
                    disabled={isUploading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                    title="Bu çıktıyı sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. DEĞERLENDİRME & KAZANIM NOTLARI */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Değerlendirme, Yansıma &amp; Kazanım Notları *</span>
            </label>
            <textarea
              rows={3}
              required
              disabled={isUploading}
              value={evaluationNotes}
              onChange={(e) => setEvaluationNotes(e.target.value)}
              placeholder="Etkinlik nasıl geçti? Öğrenciler hangi kazanımları edindi? Karşılaşılan güçlükler ve gelecek dönem için tavsiyeler..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 disabled:opacity-50"
            />
          </div>

          {/* 4. FOTOĞRAF, VİDEO VE GOOGLE DRIVE ARŞİV ALANI */}
          <div ref={mediaSectionRef} className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 border border-blue-200/90 space-y-4">
            {/* Medya Bölümü Doğrudan Hata & Bilgilendirme Uyarısı */}
            {validationError && (
              <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="font-semibold leading-relaxed">{validationError}</div>
              </div>
            )}

            {/* Üst Başlık & Durum Rozeti */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-teal-700" />
                  <span>Etkinlik Fotoğraf &amp; Video Kanıtları *</span>
                </label>
                <p className="text-[11px] text-slate-600">
                  Dosyalar kurumsal Google Drive arşivine güvenle ve otomatik olarak aktarılır.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {archivedFiles.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{archivedFiles.length} Kanıt Drive'da Arşivli</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200/80">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Otomatik Klasörleme Aktif</span>
                  </span>
                )}
              </div>
            </div>

            {/* BÖLÜM 1: GOOGLE DRIVE'DA BAŞARIYLA KAYDEDİLEN KANITLAR & KLASÖR BAĞLANTISI */}
            {archivedFiles.length > 0 && (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/90 to-teal-50/80 border-2 border-emerald-300 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-emerald-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-100" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-950">
                          Google Drive'da Başarıyla Kayıtlı Kanıtlar
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-extrabold">
                          {archivedFiles.length} Dosya
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        Bu dosyalar kurumsal Drive klasöründe saklanmaktadır ve rapora eklenmiştir.
                      </p>
                    </div>
                  </div>

                  {/* Sağ: Aksiyon Butonları */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Kayıtlı kanıt listesini temizleyip dosyaları bilgisayarınızdan yeniden seçmek istiyor musunuz?')) {
                          setMediaFiles(prev => prev.filter(m => !isItemUploaded(m)));
                        }
                      }}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-emerald-300 hover:border-rose-300 bg-white hover:bg-rose-50 text-emerald-800 hover:text-rose-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      title="Mevcut kanıt listesini temizle ve dosyaları cihazdan yeniden seç"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Kanıtları Temizle &amp; Yeniden Seç</span>
                    </button>
                  </div>
                </div>

                {/* Yüklenmiş Dosyaların Kart Listesi */}
                <div className="space-y-2">
                  {archivedFiles.map((media) => (
                    <div
                      key={media.id}
                      className="p-3 rounded-xl border border-emerald-200/90 bg-white hover:border-emerald-400 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      {/* Sol: İkon + Dosya Adı + Boyut + Durum Rozeti */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                          media.type === 'video' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-teal-600 text-white'
                        }`}>
                          {media.type === 'video' ? <Video className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs" title={media.name}>
                              {media.name}
                            </span>
                            {media.size && (
                              <span className="text-[10px] text-slate-500 font-medium shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                                {(media.size / (1024 * 1024)).toFixed(1)} MB
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Drive'a Yüklendi</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              {media.type === 'video' ? 'Video Kanıtı' : 'Fotoğraf Kanıtı'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sağ: Aksiyon Butonları */}
                      <div className="flex items-center gap-2 shrink-0">
                        {media.url && (
                          <a
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                            title="Dosyayı Google Drive'da yeni sekmede aç"
                          >
                            <span>Drive'da Aç</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`"${media.name}" adlı kanıtı bu rapordan kaldırmak istediğinize emin misiniz?`)) {
                              handleRemoveMedia(media.id);
                            }
                          }}
                          disabled={isUploading}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                          title="Kanıtı rapordan kaldır"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Otomatik Arşivleme Bilgilendirmesi (Henüz hiç dosya yüklenmediyse) */}
            {archivedFiles.length === 0 && (
              <div className="p-3 bg-white/90 rounded-xl border border-blue-200/70 text-xs text-slate-700 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tam Otomatik Arka Plan İşlemi:</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Herhangi bir manuel klasör oluşturmanıza gerek yoktur. "Raporu Kaydet" dediğinizde sistem arka planda 
                  <strong> Sürdürülebilirlik Projeleri</strong> ana klasörünün içine otomatik olarak
                  <span className="font-semibold text-blue-900 mx-1">"{suggestedFolderName}"</span>
                  adıyla bir klasör açacak ve seçtiğiniz tüm fotoğraf ve videoları bu klasöre yükleyecektir.
                </p>
              </div>
            )}

            {/* BÖLÜM 2: YENİ DOSYA SEÇİCİ */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>{archivedFiles.length > 0 ? 'Mevcut Arşive Yeni Fotoğraf / Video Ekle:' : 'Cihazınızdan Fotoğraf veya Video Seçin:'}</span>
                </label>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  mediaFiles.length > 0 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {archivedFiles.length > 0 
                    ? `Toplam ${mediaFiles.length} Kanıt (${archivedFiles.length} Arşivli${pendingFiles.length > 0 ? `, ${pendingFiles.length} Yeni` : ''})`
                    : pendingFiles.length > 0 
                      ? `✓ ${pendingFiles.length} Yeni Dosya Seçildi` 
                      : '● Zorunlu Alan'}
                </span>
              </div>

              <div className="relative">
                <input
                  type="file"
                  multiple
                  disabled={isUploading}
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  id="media-file-input"
                  className="hidden"
                />
                <label
                  htmlFor="media-file-input"
                  className={`w-full flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer group ${
                    isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  } ${
                    mediaFiles.length > 0
                      ? 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 text-slate-600'
                      : 'border-rose-300 hover:border-rose-500 bg-white hover:bg-rose-50/20 text-slate-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                    mediaFiles.length > 0 ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-100'
                  }`}>
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-teal-700">
                    {archivedFiles.length > 0 ? 'Ek Fotoğraf veya Video Seçmek İçin Tıklayın veya Sürükleyin' : 'Fotoğraf ve Videoları Yüklemek İçin Tıklayın veya Sürükleyin'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    JPG, PNG, MP4, MOV formatları desteklenir (Çoklu seçim yapılabilir)
                  </span>
                </label>
              </div>

              {mediaFiles.length === 0 && (
                <div className="mt-2 p-2 bg-rose-50/90 border border-rose-200/80 rounded-lg flex items-center gap-2 text-rose-800 text-[11px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Fotoğraf veya video eklenmeden rapor kaydedilemez. Lütfen en az bir dosya seçiniz.</span>
                </div>
              )}
            </div>

            {/* BÖLÜM 3: YÜKLENMEYİ BEKLEYEN YENİ DOSYALAR (Henüz Drive'a aktarılmamış) */}
            {pendingFiles.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Yüklenmeyi Bekleyen Yeni Kanıtlar ({pendingFiles.length} Dosya):</span>
                  </span>
                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                    Rapor kaydedildiğinde Drive'a aktarılacak
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {pendingFiles.map((media) => (
                    <div 
                      key={media.id}
                      className="relative rounded-xl overflow-hidden border border-amber-300 bg-white group shadow-xs"
                    >
                      {media.type === 'image' ? (
                        <div className="h-24 w-full bg-slate-100 relative">
                          <img 
                            src={media.url} 
                            alt={media.name} 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white flex items-center gap-1 backdrop-blur-xs">
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>Yeni Fotoğraf</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 w-full bg-slate-900 flex flex-col items-center justify-center relative p-2 text-center">
                          <Video className="w-7 h-7 text-teal-400 mb-1 animate-pulse" />
                          <span className="text-[10px] text-slate-300 truncate w-full px-1">
                            {media.name}
                          </span>
                          {media.size && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500/90 text-[9px] text-white font-bold flex items-center gap-1 shadow-xs">
                              <span>{(media.size / (1024 * 1024)).toFixed(1)} MB</span>
                            </div>
                          )}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-amber-900/80 text-[10px] text-amber-200 flex items-center gap-1">
                            <Video className="w-2.5 h-2.5" />
                            <span>Yüklenecek</span>
                          </div>
                        </div>
                      )}

                      {/* Medya Silme Butonu */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(media.id)}
                        disabled={isUploading}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-md transition-colors cursor-pointer disabled:opacity-50"
                        title="Seçimi iptal et"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Aksiyon Butonları */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              {pendingFiles.length > 0 
                ? '* Yeni dosyalar Google Drive kurumsal arşivine otomatik aktarılacaktır.' 
                : '* Tüm kanıtlar Google Drive kurumsal arşivinde günceldir.'}
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Drive'a Yükleniyor...</span>
                  </>
                ) : pendingFiles.length > 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{archivedFiles.length > 0 ? 'Yeni Dosyaları Drive\'a Yükle & Raporu Güncelle' : 'Raporu Kaydet & Drive\'a Yükle'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Raporu Güncelle &amp; Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
