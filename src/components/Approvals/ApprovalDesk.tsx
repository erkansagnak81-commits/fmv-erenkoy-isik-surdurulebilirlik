import React, { useState } from 'react';
import { ProjectEvent, UserProfile, ProjectStatus } from '../../types';
import { DEPARTMENTS, SDG_GOALS, parseTargetGrades } from '../../constants';
import { 
  CheckSquare, 
  Check, 
  X, 
  AlertTriangle, 
  MessageSquare, 
  User, 
  Calendar, 
  MapPin, 
  Package, 
  Clock, 
  ShieldCheck,
  GraduationCap,
  Atom,
  School,
  Users,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProjectDetailModal } from '../Projects/ProjectDetailModal';

interface ApprovalDeskProps {
  projects: ProjectEvent[];
  currentUser: UserProfile;
  onUpdateStatus: (projectId: string, newStatus: ProjectStatus, feedback?: string) => void;
}

export const ApprovalDesk: React.FC<ApprovalDeskProps> = ({
  projects,
  currentUser,
  onUpdateStatus,
}) => {
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDetailProject, setSelectedDetailProject] = useState<ProjectEvent | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');

  // Kullanıcı Bölüm Başkanı ise kendi zümresinin 'submitted' (inceleme bekleyen) projelerini görür.
  // Koordinatör ise Bölüm Başkanı onayından geçmiş 'dept_approved' projeleri ve tüm bekleyenleri görebilir.
  const isDeptHead = currentUser.role === 'dept_head';
  const isCoordinator = currentUser.role === 'coordinator';

  const pendingProjects = projects.filter(p => {
    if (isDeptHead) {
      // Bölüm başkanı kendi bölümünün submitted projelerini onaylar
      return p.departmentId === currentUser.departmentId && p.status === 'submitted';
    }
    if (isCoordinator) {
      // Koordinatör bölüm başkanından geçenleri (veya genel bekleyenleri) onaylar
      return p.status === 'dept_approved' || p.status === 'submitted';
    }
    return p.status === 'submitted';
  });

  const handleApprove = (project: ProjectEvent) => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {}

    if (isDeptHead) {
      // Bölüm başkanı onayladığında 'dept_approved' olur
      onUpdateStatus(project.id, 'dept_approved');
    } else {
      // Koordinatör onayladığında 'coordinator_approved' (resmi yayında) olur
      onUpdateStatus(project.id, 'coordinator_approved');
    }
  };

  const handleOpenRevision = (projectId: string) => {
    setSelectedProjectId(projectId);
    setRevisionFeedback('');
    setRevisionModalOpen(true);
  };

  const handleConfirmRevision = () => {
    if (!selectedProjectId || !revisionFeedback.trim()) {
      alert('Lütfen danışman öğretmene iletilecek revizyon gerekçesini yazınız.');
      return;
    }

    onUpdateStatus(selectedProjectId, 'revision_needed', revisionFeedback.trim());
    setRevisionModalOpen(false);
    setSelectedProjectId(null);
  };

  const currentDept = DEPARTMENTS.find(d => d.id === currentUser.departmentId);

  return (
    <div className="space-y-5">
      {/* Üst Bilgilendirme Panosu */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {isDeptHead ? `${currentDept?.name || 'Bölüm'} Onay Masası` : 'Sürdürülebilirlik Onay ve Yetki Masası'}
            </h2>
            <p className="text-xs text-slate-500">
              {isDeptHead 
                ? 'Zümrenizdeki danışman öğretmenlerden gelen proje başvurularını değerlendirin.' 
                : 'Bölüm başkanları tarafından ön onay verilen projeleri nihai olarak onaylayıp okul takvimine alın.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            {pendingProjects.length} Onay Bekleyen Başvuru
          </span>
        </div>
      </div>

      {/* Başvuru Listesi */}
      {pendingProjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-card-soft">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Harika! Bekleyen başvuru bulunmuyor.</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isDeptHead 
              ? 'Zümrenize ait tüm projeler incelendi ve onaylandı.' 
              : 'Tüm okul genelinde bekleyen onay kalmadı. Yeni başvurular olduğunda burada listelenecektir.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingProjects.map((project) => {
            const dept = DEPARTMENTS.find(d => d.id === project.departmentId);

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card-soft hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-3 flex-1">
                  {/* Başlık ve Rozetler */}
                  <div className="flex items-center flex-wrap gap-2">
                    <span 
                      style={{ backgroundColor: `${dept?.color}15`, color: dept?.color }}
                      className="px-2.5 py-0.5 rounded-md text-xs font-bold border border-current/20"
                    >
                      {dept?.name}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      {project.eventType}
                    </span>

                    {project.status === 'dept_approved' ? (
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
                        Bölüm Başkanı Onayladı
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
                        Yeni Başvuru
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Detay Satırı */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Danışman: {project.advisorName}
                    </span>
                    {project.collaboratingTeachers && project.collaboratingTeachers.length > 0 && (
                      <span className="inline-flex items-center gap-1 font-medium text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        Ortak Öğretmenler: {project.collaboratingTeachers.join(', ')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {project.startDate} {project.endDate ? `— ${project.endDate}` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {project.location}
                    </span>
                  </div>

                  {/* Hedef Kitle / Katılımcı Seviyesi */}
                  {project.targetGrades && project.targetGrades.length > 0 && (() => {
                    const parsed = parseTargetGrades(project.targetGrades);
                    return (
                      <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                        <span className="text-slate-400 font-medium">Hedef Kitle:</span>
                        {parsed.isAllSchool ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            <School className="w-3.5 h-3.5 text-slate-500" />
                            <span>Tüm Okul (Lise & Fen)</span>
                          </span>
                        ) : (
                          <>
                            {parsed.liseGrades.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Işık Lisesi: {parsed.liseGrades.join(', ')}</span>
                              </span>
                            )}
                            {parsed.fenGrades.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                                <Atom className="w-3.5 h-3.5 text-teal-600" />
                                <span>Fen Lisesi: {parsed.fenGrades.join(', ')}</span>
                              </span>
                            )}
                            {parsed.others.map((other, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                <span>{other}</span>
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Kaynak İhtiyacı Varsa */}
                  {project.resourceNeeds && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-500 shrink-0" />
                      <span><strong>Talep Edilen Kaynak:</strong> {project.resourceNeeds}</span>
                    </div>
                  )}

                  {/* İlgili SKA'lar */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.sdgGoals.map(num => {
                      const sdg = SDG_GOALS.find(g => g.number === num);
                      return (
                        <span 
                          key={num}
                          style={{ backgroundColor: `${sdg?.color}20`, color: sdg?.color }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        >
                          SKA {num} • {sdg?.shortName}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Onay & Revizyon Aksiyonları */}
                <div className="flex items-center flex-wrap sm:self-end lg:self-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <button
                    onClick={() => setSelectedDetailProject(project)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Projenin tüm detaylarını, hedeflerini ve kaynak taleplerini incele"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>İncele</span>
                  </button>

                  <button
                    onClick={() => handleOpenRevision(project.id)}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Revizyon İste</span>
                  </button>

                  <button
                    onClick={() => handleApprove(project)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isDeptHead 
                        ? 'Zümre Adına Onayla & İlet' 
                        : 'Okul Takvimine Onayla'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Revizyon Notu Yazma Modalı */}
      {revisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-rose-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm">Danışman Öğretmenden Revizyon İste</h3>
              </div>
              <button 
                onClick={() => setRevisionModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Lütfen projenin onaylanması için yapılması gereken düzeltmeleri veya eksik görülen noktaları (bütçe, iş güvenliği, mekan onayı vb.) belirtiniz:
              </p>

              <textarea
                rows={4}
                required
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="Örn: Etkinlik tarihi 11. sınıfların deneme sınavıyla çakışmaktadır, lütfen bir sonraki haftaya güncelleyiniz."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleConfirmRevision}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs"
                >
                  Revizyon Talebini İlet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proje Detay Kartı Modalı */}
      <ProjectDetailModal
        project={selectedDetailProject}
        isOpen={!!selectedDetailProject}
        onClose={() => setSelectedDetailProject(null)}
      />
    </div>
  );
};
