import React, { useState } from 'react';
import { ProjectEvent, ImpactReport } from '../../types';
import { X, CheckCircle2, Award, Camera, FileText } from 'lucide-react';
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

  const [actualParticipants, setActualParticipants] = useState(
    existingReport?.actualParticipants || 45
  );
  const [impactMetricValue, setImpactMetricValue] = useState<number>(
    existingReport?.impactMetricValue || 80
  );
  const [impactMetricUnit, setImpactMetricUnit] = useState(
    existingReport?.impactMetricUnit || 'kg geri kazanılan atık'
  );
  const [evaluationNotes, setEvaluationNotes] = useState(
    existingReport?.evaluationNotes || ''
  );
  const [photoUrl, setPhotoUrl] = useState(
    existingReport?.photoUrls?.[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Kutlama konfeti patlatma
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) {}

    onSubmit(project.id, {
      projectId: project.id,
      actualParticipants,
      impactMetricValue,
      impactMetricUnit,
      evaluationNotes,
      photoUrls: photoUrl ? [photoUrl] : [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Başlık */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Etkinlik Kapanış &amp; Etki Raporu</h2>
              <p className="text-xs text-teal-200 truncate max-w-sm">{project.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 text-xs text-emerald-900">
            <strong>Danışman Öğretmen:</strong> {project.advisorName} • <strong>Tarih:</strong> {project.startDate}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Katılımcı Sayısı (Öğrenci + Öğretmen) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={actualParticipants}
                onChange={(e) => setActualParticipants(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Somut Çıktı Değeri (Sayısal)
              </label>
              <input
                type="number"
                value={impactMetricValue}
                onChange={(e) => setImpactMetricValue(Number(e.target.value))}
                placeholder="Örn: 120"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Çıktı / Etki Birimi Açıklaması
            </label>
            <input
              type="text"
              value={impactMetricUnit}
              onChange={(e) => setImpactMetricUnit(e.target.value)}
              placeholder="Örn: kg e-atık toplandı, dikilen fidan, üretilen kompost kg vb."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Değerlendirme &amp; Kazanım Notları
            </label>
            <textarea
              rows={3}
              required
              value={evaluationNotes}
              onChange={(e) => setEvaluationNotes(e.target.value)}
              placeholder="Etkinlik nasıl geçti? Öğrenciler hangi kazanımları edindi? Gelecek yıl için öneriler..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Etkinlik Fotoğraf Linki / Kanıt Görseli</span>
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {photoUrl && (
              <div className="mt-2 rounded-xl overflow-hidden h-32 border border-slate-200">
                <img src={photoUrl} alt="Kanıt önizleme" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              Kapat
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Raporu Kaydet &amp; Tamamlandı Olarak İşle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
