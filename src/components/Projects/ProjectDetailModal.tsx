import React, { useState } from 'react';
import { ProjectEvent } from '../../types';
import { DEPARTMENTS, SDG_GOALS, parseTargetGrades } from '../../constants';
import { getDriveThumbnailUrl } from '../../services/googleDriveService';
import { 
  X, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  School, 
  Atom, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  FileCheck2,
  Package,
  Video,
  Image as ImageIcon
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: ProjectEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReportModal?: (project: ProjectEvent) => void;
  canEditReport?: boolean;
  onEditProject?: (project: ProjectEvent) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onOpenReportModal,
  canEditReport = false,
  onEditProject,
}) => {
  // Lightbox Durumu (Tam Ekran Görsel İnceleme)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!isOpen || !project) return null;

  const department = DEPARTMENTS.find(d => d.id === project.departmentId);
  const targetParsed = parseTargetGrades(project.targetGrades);
  const report = project.impactReport;

  // Medya listesini toparla (mediaFiles veya photoUrls)
  const mediaItems: Array<{ url: string; name: string; type: 'image' | 'video' }> = [];
  if (report?.mediaFiles && report.mediaFiles.length > 0) {
    report.mediaFiles.forEach(m => {
      mediaItems.push({
        url: m.url,
        name: m.name || 'Etkinlik Medyası',
        type: m.type || 'image',
      });
    });
  } else if (report?.photoUrls && report.photoUrls.length > 0) {
    report.photoUrls.forEach((url, i) => {
      mediaItems.push({
        url,
        name: `Fotoğraf ${i + 1}`,
        type: 'image',
      });
    });
  }

  const getStatusBadge = () => {
    switch (project.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Tamamlandı &amp; Etki Raporlandı
          </span>
        );
      case 'coordinator_approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Okul Takviminde Yayında
          </span>
        );
      case 'dept_approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Koordinatör Onayı Bekliyor
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Bölüm Başkanı Onayında
          </span>
        );
      case 'revision_needed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Revizyon İstendi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Taslak
          </span>
        );
    }
  };

  const activeMedia = lightboxIndex !== null ? mediaItems[lightboxIndex] : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
          {/* Üst Başlık Barı */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-blue-950 text-white flex items-start justify-between gap-4 shrink-0">
            <div className="space-y-1.5">
              <div className="flex items-center flex-wrap gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-amber-300 text-[11px] font-bold tracking-wide uppercase">
                  {project.eventType}
                </span>
                {getStatusBadge()}
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
                {project.title}
              </h2>
              {department && (
                <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: department.color }} />
                  <span>{department.name}</span>
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* İçerik Gövdesi */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
            {/* Varsa Koordinatör Revizyon Gerekçesi Notu (En Üstte Dikkat Çekici Şekilde) */}
            {project.status === 'revision_needed' && project.rejectionFeedback && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50/50 to-rose-50 border-2 border-rose-300 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-rose-900 text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>Koordinatör Revizyon Talebi & Geri Bildirimi</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/80 text-rose-900">
                    Düzeltme Bekleniyor
                  </span>
                </div>
                <p className="text-slate-800 text-xs leading-relaxed font-medium bg-white/90 p-3.5 rounded-xl border border-rose-200 shadow-xs">
                  {project.rejectionFeedback}
                </p>
                {onEditProject && (
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => {
                        onClose();
                        onEditProject(project);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Projeyi Düzenle & Tekrar Gönder</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Danışman, Kulüp ve Temsilciler Kartı */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Danışman Öğretmen</span>
                <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{project.advisorName}</span>
                </p>
                {project.collaboratingTeachers && project.collaboratingTeachers.length > 0 && (
                  <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                    Ortaklar: {project.collaboratingTeachers.join(', ')}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Öğrenci Kulübü</span>
                <p className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{project.studentClub || 'Zümre İçi Çalışma Grubu'}</span>
                </p>
                {project.studentRepresentatives && project.studentRepresentatives.length > 0 && (
                  <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                    Temsilciler: {project.studentRepresentatives.join(', ')}
                  </p>
                )}
              </div>

              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zaman &amp; Konum</span>
                <p className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    {project.startDate.split('-').reverse().join('.')}
                    {project.endDate && project.endDate !== project.startDate ? ` – ${project.endDate.split('-').reverse().join('.')}` : ''}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 pt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{project.location}</span>
                </p>
              </div>
            </div>

            {/* Hedef Kitle & Sınıf Dağılımı */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hedef Kitle ve Kademeler</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {targetParsed.isAllSchool && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    <School className="w-3.5 h-3.5" />
                    <span>Tüm Kampüs (Işık Lisesi &amp; Fen Lisesi)</span>
                  </span>
                )}
                {targetParsed.liseGrades.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-medium border border-blue-200">
                    <School className="w-3.5 h-3.5 text-blue-600" />
                    <span>Işık Lisesi: {targetParsed.liseGrades.join(', ')}</span>
                  </span>
                )}
                {targetParsed.fenGrades.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-medium border border-purple-200">
                    <Atom className="w-3.5 h-3.5 text-purple-600" />
                    <span>Fen Lisesi: {targetParsed.fenGrades.join(', ')}</span>
                  </span>
                )}
              </div>
            </div>

            {/* BM Küresel Amaçları (SKA) Rozetleri */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Desteklenen BM Küresel Amaçları</span>
              <div className="flex flex-wrap gap-2">
                {project.sdgGoals.map(gNum => {
                  const sdg = SDG_GOALS.find(s => s.number === gNum);
                  if (!sdg) return null;
                  return (
                    <div 
                      key={gNum}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-slate-900 font-bold bg-white shadow-xs"
                      style={{ borderColor: sdg.color }}
                    >
                      <span 
                        className="w-4 h-4 rounded-md text-white text-[10px] flex items-center justify-center font-black shrink-0"
                        style={{ backgroundColor: sdg.color }}
                      >
                        {sdg.number}
                      </span>
                      <span>{sdg.shortName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Açıklama & İhtiyaçlar */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Faaliyet Açıklaması</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/60 text-justify">
                  {project.description}
                </p>
              </div>

              {project.resourceNeeds && (
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    <span>Gerekli Araç-Gereç ve Kaynak İhtiyaçları</span>
                  </h4>
                  <p className="text-slate-600 italic bg-amber-50/40 p-2.5 rounded-xl border border-amber-200/50">
                    {project.resourceNeeds}
                  </p>
                </div>
              )}
            </div>

            {/* ETKİ VE KAPANIŞ RAPORU BÖLÜMÜ */}
            {report ? (
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 border border-emerald-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-emerald-200/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Etki Değerlendirme &amp; Sonuç Raporu</h4>
                      <p className="text-[10px] text-emerald-800 font-semibold">
                        Tamamlanma Tarihi: {report.completedAt ? report.completedAt.slice(0, 10).split('-').reverse().join('.') : '—'}
                      </p>
                    </div>
                  </div>

                  {canEditReport && onOpenReportModal && (
                    <button
                      onClick={() => onOpenReportModal(project)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Raporu Güncelle</span>
                    </button>
                  )}
                </div>

                {/* Katılımcı Dağılımı ve Temel Gösterge */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Toplam Katılım</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{report.actualParticipants || 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Öğrenci</span>
                    <p className="text-xl font-black text-emerald-800 mt-0.5">{report.studentParticipants || report.actualParticipants || 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Öğretmen</span>
                    <p className="text-xl font-black text-blue-800 mt-0.5">{report.teacherParticipants || 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Somut Çıktı</span>
                    <p className="text-lg font-black text-teal-800 mt-0.5 truncate" title={`${report.impactMetricValue} ${report.impactMetricUnit}`}>
                      {report.impactMetricValue ? `${report.impactMetricValue} ${report.impactMetricUnit}` : '—'}
                    </p>
                  </div>
                </div>

                {/* Değerlendirme & Kazanım Notu */}
                {report.evaluationNotes && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Danışman Değerlendirme Notu</span>
                    <p className="text-slate-700 italic bg-white p-3.5 rounded-xl border border-emerald-100 leading-relaxed">
                      "{report.evaluationNotes}"
                    </p>
                  </div>
                )}

                {/* Çoklu Çıktı Kalemleri */}
                {report.impactOutputs && report.impactOutputs.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Somut Çıktı Kalemleri</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {report.impactOutputs.map(out => (
                        <div key={out.id} className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center justify-between shadow-xs">
                          <span className="text-slate-700 font-medium">{out.description}</span>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg">
                            {out.value} {out.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MEDYA & KANIT FOTOĞRAFLARI GALERİSİ */}
                {mediaItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Etkinlik Fotoğrafları &amp; Kanıt Belgeleri ({mediaItems.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Büyütmek için görsele tıklayın</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {mediaItems.map((item, idx) => {
                        const thumbUrl = getDriveThumbnailUrl(item.url, 400);
                        return (
                          <div
                            key={idx}
                            onClick={() => setLightboxIndex(idx)}
                            className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 cursor-pointer shadow-xs hover:shadow-md transition-all border border-slate-200"
                          >
                            <img
                              src={thumbUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                // Drive izin sorunu varsa fallback
                                (e.target as HTMLElement).style.opacity = '0.4';
                              }}
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              {item.type === 'video' ? (
                                <Video className="w-6 h-6 text-amber-400" />
                              ) : (
                                <Maximize2 className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <span className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded bg-slate-900/70 text-white text-[9px] font-semibold truncate">
                              {item.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              project.status === 'coordinator_approved' && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <h4 className="font-bold text-amber-900 text-xs">Etkinlik Tamamlandı mı?</h4>
                    <p className="text-[11px] text-amber-800">
                      Bu etkinlik gerçekleştiğinde katılımcı sayılarını ve etki fotoğraflarını kaydederek arşive ekleyebilirsiniz.
                    </p>
                  </div>
                  {onOpenReportModal && canEditReport && (
                    <button
                      onClick={() => onOpenReportModal(project)}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs shrink-0"
                    >
                      Sonuç Raporu Gir
                    </button>
                  )}
                </div>
              )
            )}
          </div>

          {/* Alt Kapatma Çubuğu */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>

      {/* TAM EKRAN GÖRSEL / VİDEO LIGHTBOX */}
      {activeMedia && lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Lightbox Üst Bar */}
          <div 
            className="w-full max-w-5xl flex items-center justify-between text-white p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">
                {lightboxIndex + 1} / {mediaItems.length}
              </span>
              <span className="text-xs font-semibold text-slate-300 truncate max-w-md">
                {activeMedia.name}
              </span>
            </div>

            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Görsel / Video Alanı */}
          <div 
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-2 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {activeMedia.type === 'video' ? (
              <video 
                src={activeMedia.url} 
                controls 
                autoPlay 
                className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl object-contain"
              />
            ) : (
              <img
                src={getDriveThumbnailUrl(activeMedia.url, 1600)}
                alt={activeMedia.name}
                className="max-w-full max-h-[78vh] rounded-2xl shadow-2xl object-contain transition-all"
              />
            )}

            {/* Önceki Butonu */}
            {mediaItems.length > 1 && (
              <button
                onClick={() => setLightboxIndex((lightboxIndex - 1 + mediaItems.length) % mediaItems.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all hover:scale-110 shadow-lg"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Sonraki Butonu */}
            {mediaItems.length > 1 && (
              <button
                onClick={() => setLightboxIndex((lightboxIndex + 1) % mediaItems.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all hover:scale-110 shadow-lg"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Alt Açıklama */}
          <div 
            className="text-center text-slate-400 text-xs py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{project.title} • FMV Erenköy Işık Lisesi ve Fen Lisesi</span>
          </div>
        </div>
      )}
    </>
  );
};
