import React, { useState } from 'react';
import { CurriculumIntegration, UserProfile, AcademicYear, SystemRolePermissions } from '../../types';
import { DEPARTMENTS, SDG_GOALS, isSuperAdminEmail } from '../../constants';
import { hasUserActionPermission } from '../../constants/permissions';
import { exportCurriculumsToCsv } from '../../lib/exportUtils';
import { 
  BookOpenCheck, 
  Plus, 
  Search, 
  Users, 
  X, 
  Check, 
  Pencil, 
  Trash2,
  Download,
  Globe2,
  Lock,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface CurriculumTrackerProps {
  curriculums: CurriculumIntegration[];
  onAddCurriculum: (item: Omit<CurriculumIntegration, 'id'>) => void;
  onUpdateCurriculum: (id: string, updates: Partial<CurriculumIntegration>) => void;
  onDeleteCurriculum: (id: string) => void;
  currentUser: UserProfile;
  activeAcademicYear?: AcademicYear;
  academicYears?: AcademicYear[];
  rolePermissions?: SystemRolePermissions;
}

export const CurriculumTracker: React.FC<CurriculumTrackerProps> = ({
  curriculums,
  onAddCurriculum,
  onUpdateCurriculum,
  onDeleteCurriculum,
  currentUser,
  activeAcademicYear,
  academicYears,
  rolePermissions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedSdg, setSelectedSdg] = useState<number | null>(null);
  const [scopeTab, setScopeTab] = useState<'my' | 'school'>(
    currentUser.role === 'coordinator' || currentUser.role === 'admin' || currentUser.role === 'principal' ? 'school' : 'my'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CurriculumIntegration | null>(null);
  const [deletingItem, setDeletingItem] = useState<CurriculumIntegration | null>(null);

  const isSuperAdmin = isSuperAdminEmail(currentUser.email) || currentUser.role === 'admin';
  const canCreate = isSuperAdmin || (rolePermissions ? hasUserActionPermission(currentUser, 'canCreateCurriculum', rolePermissions) : true);
  const canExport = isSuperAdmin || (rolePermissions ? hasUserActionPermission(currentUser, 'canExportCurriculum', rolePermissions) : true);

  // Form State
  const isDeptLocked = currentUser.role === 'teacher' || currentUser.role === 'dept_head';
  const userDeptId = currentUser.departmentId || DEPARTMENTS[0].id;
  const activeYearId = activeAcademicYear?.id || '2026-2027';
  const defaultTerm = `${activeYearId} 1. Dönem`;

  const [courseName, setCourseName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [departmentId, setDepartmentId] = useState(isDeptLocked ? userDeptId : (currentUser.departmentId || DEPARTMENTS[0].id));
  const [teacherName, setTeacherName] = useState(currentUser.name);
  const [learningOutcome, setLearningOutcome] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [sdgGoals, setSdgGoals] = useState<number[]>([7, 13]);
  const [studentCount, setStudentCount] = useState(120);
  const [academicTerm, setAcademicTerm] = useState(defaultTerm);

  const canManageItem = (item: CurriculumIntegration) => {
    if (currentUser.role === 'coordinator' || currentUser.role === 'admin' || currentUser.role === 'principal') return true;
    if (currentUser.role === 'dept_head') return item.departmentId === currentUser.departmentId;
    if (currentUser.role === 'teacher') {
      return (
        item.teacherName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        item.departmentId === currentUser.departmentId
      );
    }
    return false;
  };

  const myDeptCurriculums = curriculums.filter(c => {
    if (currentUser.role === 'teacher') {
      return (
        c.departmentId === currentUser.departmentId ||
        c.teacherName.toLowerCase().includes(currentUser.name.toLowerCase())
      );
    } else if (currentUser.role === 'dept_head') {
      return c.departmentId === currentUser.departmentId;
    }
    return true;
  });

  const filteredCurriculums = curriculums.filter(c => {
    // Rol Bazlı Kapsam Kontrolü:
    if (scopeTab === 'my') {
      if (currentUser.role === 'teacher') {
        const isMyDeptOrName = 
          c.departmentId === currentUser.departmentId ||
          c.teacherName.toLowerCase().includes(currentUser.name.toLowerCase());
        if (!isMyDeptOrName) return false;
      } else if (currentUser.role === 'dept_head') {
        if (c.departmentId !== currentUser.departmentId) return false;
      }
    }

    const matchesSearch = 
      c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.learningOutcome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.gradeLevel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'all' || c.departmentId === selectedDept;
    const matchesSdg = selectedSdg === null || c.sdgGoals.includes(selectedSdg);

    return matchesSearch && matchesDept && matchesSdg;
  });

  const handleExportCsv = () => {
    exportCurriculumsToCsv(filteredCurriculums, DEPARTMENTS);
  };

  const totalStudents = curriculums.reduce((sum, c) => sum + c.studentCount, 0);

  const toggleSdg = (num: number) => {
    setSdgGoals(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setCourseName('');
    setGradeLevel('');
    setDepartmentId(isDeptLocked ? userDeptId : (currentUser.departmentId || DEPARTMENTS[0].id));
    setTeacherName(currentUser.name);
    setLearningOutcome('');
    setActivityDescription('');
    setSdgGoals([7, 13]);
    setStudentCount(100);
    setAcademicTerm(`${activeAcademicYear?.id || '2026-2027'} 1. Dönem`);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: CurriculumIntegration) => {
    setEditingItem(item);
    setCourseName(item.courseName);
    setGradeLevel(item.gradeLevel || '');
    setDepartmentId(isDeptLocked ? userDeptId : item.departmentId);
    setTeacherName(item.teacherName || currentUser.name);
    setLearningOutcome(item.learningOutcome);
    setActivityDescription(item.activityDescription);
    setSdgGoals(item.sdgGoals || []);
    setStudentCount(item.studentCount || 0);
    setAcademicTerm(item.academicTerm || `${activeAcademicYear?.id || '2026-2027'} 1. Dönem`);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem && !canCreate) return;
    if (!courseName.trim()) {
      alert('Lütfen ders adını giriniz.');
      return;
    }
    if (!gradeLevel.trim()) {
      alert('Lütfen sınıf / kademe seçiniz.');
      return;
    }
    if (!learningOutcome.trim() || !activityDescription.trim()) {
      alert('Lütfen kazanım ve etkinlik açıklamasını doldurunuz.');
      return;
    }
    if (sdgGoals.length === 0) {
      alert('Lütfen en az bir adet SKA hedefi seçiniz.');
      return;
    }

    const finalDepartmentId = isDeptLocked && currentUser.departmentId 
      ? currentUser.departmentId 
      : departmentId;

    const payload = {
      departmentId: finalDepartmentId,
      teacherName: teacherName.trim() || currentUser.name,
      courseName: courseName.trim(),
      gradeLevel: gradeLevel.trim(),
      learningOutcome: learningOutcome.trim(),
      sdgGoals,
      activityDescription: activityDescription.trim(),
      studentCount: Number(studentCount) || 0,
      academicTerm: academicTerm.trim() || `${activeAcademicYear?.id || '2026-2027'} 1. Dönem`,
    };

    if (editingItem) {
      onUpdateCurriculum(editingItem.id, payload);
    } else {
      onAddCurriculum(payload);
    }

    setModalOpen(false);
    setEditingItem(null);
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      onDeleteCurriculum(deletingItem.id);
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Üst Bilgilendirme ve Eylemler */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Müfredat &amp; SKA Entegrasyon Matrisi
              </h2>
              <p className="text-xs text-slate-500">
                Sürdürülebilirlik ilkelerinin ders içi resmi MEB kazanımlarıyla entegrasyonu
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
              {totalStudents.toLocaleString('tr-TR')} Öğrenciye Ulaşıldı
            </span>

            {canExport && (
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                title="Müfredat matrisini Excel / CSV formatında indir"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Excel / CSV</span>
              </button>
            )}

            {canCreate && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Ders Kazanımı Eşle</span>
              </button>
            )}
          </div>
        </div>

        {/* Sekme Geçişi: Zümre Planı vs Okul Geneli Havuz */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={() => setScopeTab('my')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scopeTab === 'my'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {currentUser.role === 'teacher' 
                ? 'Zümremizin Müfredat Planı & Derslerim' 
                : currentUser.role === 'dept_head'
                ? `${DEPARTMENTS.find(d => d.id === currentUser.departmentId)?.name || 'Zümre'} Müfredat Planı`
                : 'Bölüm Müfredatları'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              scopeTab === 'my' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {myDeptCurriculums.length}
            </span>
          </button>

          <button
            onClick={() => setScopeTab('school')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scopeTab === 'school'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Okul Geneli Müfredat Havuzu (Tüm Branşlar)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              scopeTab === 'school' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {curriculums.length}
            </span>
          </button>
        </div>
      </div>

      {/* Arama & Filtre Çubuğu */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ders, kazanım veya öğretmen ara..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Zümre Filtresi */}
            {scopeTab === 'school' || currentUser.role === 'coordinator' || currentUser.role === 'admin' || currentUser.role === 'principal' ? (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">Tüm Zümreler ({curriculums.length} Kayıt)</option>
                {DEPARTMENTS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <span className="text-slate-400">Kapsam: </span>
                <span>{DEPARTMENTS.find(d => d.id === currentUser.departmentId)?.name}</span>
              </div>
            )}

            {/* SKA Filtresi */}
            <select
              value={selectedSdg !== null ? selectedSdg : 'all'}
              onChange={(e) => setSelectedSdg(e.target.value === 'all' ? null : Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">Tüm SKA'lar</option>
              {SDG_GOALS.map(sdg => (
                <option key={sdg.number} value={sdg.number}>
                  SKA {sdg.number}: {sdg.shortName}
                </option>
              ))}
            </select>

            {(searchTerm || selectedDept !== 'all' || selectedSdg !== null) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDept('all');
                  setSelectedSdg(null);
                }}
                className="px-2.5 py-1.5 text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-xl transition cursor-pointer font-semibold shrink-0"
              >
                Temizle
              </button>
            )}
          </div>
        </div>

        {/* Bilgilendirme Rozeti (Okul Geneli Modunda) */}
        {scopeTab === 'school' && currentUser.role === 'teacher' && (
          <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-[11px] text-purple-950 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-700 shrink-0" />
            <span>
              Okul genelindeki tüm zümrelerin sürdürülebilirlik ders kazanımlarını inceliyorsunuz. Kendi branşınız dışındaki dersler ilham amaçlı <strong>salt okunur</strong> olarak görüntülenmektedir.
            </span>
          </div>
        )}
      </div>

      {/* Entegrasyon Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ders &amp; Zümre</th>
                <th className="py-3.5 px-4">Müfredat Kazanımı</th>
                <th className="py-3.5 px-4">İlişkili SKA</th>
                <th className="py-3.5 px-4">Uygulanan Sürdürülebilirlik Etkinliği</th>
                <th className="py-3.5 px-4 text-right">Öğrenci Sayısı</th>
                <th className="py-3.5 px-4 text-center w-24">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCurriculums.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Kriterlere uygun ders kazanım eşleştirmesi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredCurriculums.map((item) => {
                  const dept = DEPARTMENTS.find(d => d.id === item.departmentId);
                  const allowed = canManageItem(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-bold text-slate-900">{item.courseName}</p>
                        <span 
                          style={{ color: dept?.color }}
                          className="text-[11px] font-semibold block mt-0.5"
                        >
                          {dept?.name.split(' ')[0]} • {item.gradeLevel}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">{item.teacherName}</p>
                      </td>

                      <td className="py-3.5 px-4 align-top max-w-xs text-slate-700 font-medium leading-relaxed">
                        {item.learningOutcome}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap gap-1">
                          {item.sdgGoals.map(sdgNum => {
                            const sdg = SDG_GOALS.find(g => g.number === sdgNum);
                            return (
                              <span 
                                key={sdgNum}
                                style={{ backgroundColor: `${sdg?.color}20`, color: sdg?.color }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold"
                                title={sdg?.name}
                              >
                                SKA {sdgNum}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top max-w-sm text-slate-600 leading-relaxed">
                        {item.activityDescription}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-900 px-2 py-1 rounded-md">
                          <Users className="w-3 h-3 text-purple-600" />
                          {item.studentCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top text-center">
                        {allowed ? (
                          <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Girişi Düzenle"
                              className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              title="Girişi Sil"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            title="Yalnızca ilgili branş düzenleyebilir"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>İlham</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kazanım Ekleme / Düzenleme Modalı */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalOpen(false);
              setEditingItem(null);
            }
          }}
        >
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                {editingItem ? (
                  <Pencil className="w-5 h-5 text-purple-300" />
                ) : (
                  <BookOpenCheck className="w-5 h-5 text-purple-300" />
                )}
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    {editingItem ? 'Ders İçi Kazanım Eşleştirmesini Düzenle' : 'Yeni Ders İçi Kazanım Eşleştirmesi'}
                  </h3>
                  <p className="text-[11px] text-purple-200/80">
                    Sürdürülebilirlik ilkelerinin MEB ders kazanımlarıyla ilişkilendirilmesi
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingItem(null);
                }} 
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ders Adı *</label>
                  <input
                    type="text"
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Örn: 10. Sınıf Kimya"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sınıf / Kademe *
                  </label>
                  <select
                    required
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                  >
                    <option value="">Sınıf / Kademe Seçiniz...</option>
                    <option value="Hazırlık">Hazırlık</option>
                    <option value="9. Sınıf">9. Sınıf</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="12. Sınıf">12. Sınıf</option>
                    <option value="Fen Lisesi 9">Fen Lisesi 9</option>
                    <option value="Fen Lisesi 10">Fen Lisesi 10</option>
                    <option value="Fen Lisesi 11">Fen Lisesi 11</option>
                    <option value="Fen Lisesi 12">Fen Lisesi 12</option>
                    <option value="Ortaokul">Ortaokul</option>
                    <option value="Tüm Kademeler">Tüm Kademeler</option>
                    {gradeLevel && ![
                      'Hazırlık', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf',
                      'Fen Lisesi 9', 'Fen Lisesi 10', 'Fen Lisesi 11', 'Fen Lisesi 12',
                      'Ortaokul', 'Tüm Kademeler'
                    ].includes(gradeLevel) && (
                      <option value={gradeLevel}>{gradeLevel}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Sorumlu Zümre *
                    </label>
                    {isDeptLocked && (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3 text-purple-600" />
                        Zümrenize Kilitlendi
                      </span>
                    )}
                  </div>
                  <select
                    disabled={isDeptLocked}
                    value={isDeptLocked ? userDeptId : departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isDeptLocked
                        ? 'border-slate-200 bg-slate-100 text-slate-700 font-semibold cursor-not-allowed opacity-90'
                        : 'border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20'
                    }`}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {isDeptLocked && (
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      Öğretmenler ve bölüm başkanları yalnızca bağlı oldukları zümre için kazanım ekleyebilir.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Öğretmen Adı *</label>
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Örn: Emre Kaya"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Müfredat Kazanımı (MEB) *</label>
                <textarea
                  rows={2}
                  required
                  value={learningOutcome}
                  onChange={(e) => setLearningOutcome(e.target.value)}
                  placeholder="Örn: Karışımların ayrılma ilkelerini su arıtma süreçleri üzerinden açıklar."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ders İçi Uygulanan Sürdürülebilirlik Etkinliği *</label>
                <textarea
                  rows={3}
                  required
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="Derste öğrenciler ne yaptı? (Örn: Mini arıtma filtresi kurularak gri su analizi yapıldı)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">İlişkili SKA'lar *</label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 max-h-32 overflow-y-auto">
                  {SDG_GOALS.map(sdg => {
                    const isSelected = sdgGoals.includes(sdg.number);
                    return (
                      <button
                        type="button"
                        key={sdg.number}
                        onClick={() => toggleSdg(sdg.number)}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                          isSelected ? 'bg-purple-700 text-white' : 'bg-white text-slate-600 border'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>SKA {sdg.number}: {sdg.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ulaşılan Öğrenci Sayısı *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={studentCount}
                    onChange={(e) => setStudentCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Eğitim Dönemi *
                    </label>
                    {activeAcademicYear && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        Aktif Yıl: {activeAcademicYear.id}
                      </span>
                    )}
                  </div>
                  <select
                    value={academicTerm}
                    onChange={(e) => setAcademicTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <optgroup label={`Aktif Eğitim Yılı (${activeAcademicYear?.id || '2026-2027'})`}>
                      <option value={`${activeAcademicYear?.id || '2026-2027'} 1. Dönem`}>
                        {activeAcademicYear?.id || '2026-2027'} 1. Dönem
                      </option>
                      <option value={`${activeAcademicYear?.id || '2026-2027'} 2. Dönem`}>
                        {activeAcademicYear?.id || '2026-2027'} 2. Dönem
                      </option>
                      <option value={`${activeAcademicYear?.id || '2026-2027'} Yıl Boyu`}>
                        {activeAcademicYear?.id || '2026-2027'} Yıl Boyu
                      </option>
                    </optgroup>
                    {academicYears && academicYears.filter(y => y.id !== (activeAcademicYear?.id || '2026-2027')).map(year => (
                      <optgroup key={year.id} label={year.id}>
                        <option value={`${year.id} 1. Dönem`}>{year.id} 1. Dönem</option>
                        <option value={`${year.id} 2. Dönem`}>{year.id} 2. Dönem</option>
                        <option value={`${year.id} Yıl Boyu`}>{year.id} Yıl Boyu</option>
                      </optgroup>
                    ))}
                    {academicTerm && ![
                      `${activeAcademicYear?.id || '2026-2027'} 1. Dönem`,
                      `${activeAcademicYear?.id || '2026-2027'} 2. Dönem`,
                      `${activeAcademicYear?.id || '2026-2027'} Yıl Boyu`,
                    ].includes(academicTerm) && !academicYears?.some(y => [
                      `${y.id} 1. Dönem`, `${y.id} 2. Dönem`, `${y.id} Yıl Boyu`
                    ].includes(academicTerm)) && (
                      <option value={academicTerm}>{academicTerm}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingItem ? 'Değişiklikleri Kaydet' : 'Matrise Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Silme Onay Modalı */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Kazanım Eşleştirmesini Sil
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              <strong className="text-slate-900">{deletingItem.courseName}</strong> dersine ait sürdürülebilirlik kazanım eşleştirmesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
