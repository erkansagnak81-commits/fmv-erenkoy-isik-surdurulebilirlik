import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ProjectEvent, UserProfile, AcademicYear } from '../../types';
import { DEPARTMENTS, SDG_GOALS, SCHOOL_LEVELS } from '../../constants';
import { X, Plus, Sparkles, Calendar, MapPin, Package, Check, GraduationCap, Atom, School, AlertCircle, Users, UserCheck } from 'lucide-react';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<ProjectEvent, 'id' | 'createdAt'>) => void;
  onUpdate?: (projectId: string, updates: Partial<ProjectEvent>) => void;
  currentUser: UserProfile;
  initialProject?: ProjectEvent | null;
  activeAcademicYear?: AcademicYear;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  currentUser,
  initialProject,
  activeAcademicYear,
}) => {
  const isEditing = !!initialProject;

  const getDefaultDate = () => {
    const today = new Date().toISOString().split('T')[0];
    if (activeAcademicYear) {
      if (today >= activeAcademicYear.startDate && today <= activeAcademicYear.endDate) {
        return today;
      }
      return activeAcademicYear.startDate;
    }
    return today;
  };

  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState(currentUser.departmentId || DEPARTMENTS[0].id);
  const [advisorName, setAdvisorName] = useState(currentUser.name);
  const [collaboratingTeachers, setCollaboratingTeachers] = useState<string[]>([]);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [studentClub, setStudentClub] = useState('');
  const [studentRepresentatives, setStudentRepresentatives] = useState<string[]>([]);
  const [studentRepInput, setStudentRepInput] = useState('');
  const [eventType, setEventType] = useState<ProjectEvent['eventType']>('Atölye');
  const [sdgGoals, setSdgGoals] = useState<number[]>([12, 13]);
  const [targetGrades, setTargetGrades] = useState<string[]>([
    'Erenköy Işık Lisesi - 10',
    'Erenköy Işık Lisesi - 11',
  ]);
  const [startDate, setStartDate] = useState(getDefaultDate());
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('Okul Konferans Salonu');
  const [resourceNeeds, setResourceNeeds] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const defaultDate = (() => {
      const today = new Date().toISOString().split('T')[0];
      if (activeAcademicYear) {
        if (today >= activeAcademicYear.startDate && today <= activeAcademicYear.endDate) {
          return today;
        }
        return activeAcademicYear.startDate;
      }
      return today;
    })();

    if (initialProject) {
      setTitle(initialProject.title || '');
      setDepartmentId(initialProject.departmentId || currentUser.departmentId || DEPARTMENTS[0].id);
      setAdvisorName(initialProject.advisorName || currentUser.name);
      setCollaboratingTeachers(initialProject.collaboratingTeachers || []);
      setCollaboratorInput('');
      setStudentClub(initialProject.studentClub || '');
      setStudentRepresentatives(initialProject.studentRepresentatives || []);
      setStudentRepInput('');
      setEventType(initialProject.eventType || 'Atölye');
      setSdgGoals(initialProject.sdgGoals || [12, 13]);
      setTargetGrades(initialProject.targetGrades || ['Erenköy Işık Lisesi - 10', 'Erenköy Işık Lisesi - 11']);
      setStartDate(initialProject.startDate || defaultDate);
      setEndDate(initialProject.endDate || '');
      setLocation(initialProject.location || 'Okul Konferans Salonu');
      setResourceNeeds(initialProject.resourceNeeds || '');
      setDescription(initialProject.description || '');
    } else {
      setTitle('');
      setDepartmentId(currentUser.departmentId || DEPARTMENTS[0].id);
      setAdvisorName(currentUser.name);
      setCollaboratingTeachers([]);
      setCollaboratorInput('');
      setStudentClub('');
      setStudentRepresentatives([]);
      setStudentRepInput('');
      setEventType('Atölye');
      setSdgGoals([12, 13]);
      setTargetGrades(['Erenköy Işık Lisesi - 10', 'Erenköy Işık Lisesi - 11']);
      setStartDate(defaultDate);
      setEndDate('');
      setLocation('Okul Konferans Salonu');
      setResourceNeeds('');
      setDescription('');
    }
  }, [initialProject, isOpen, activeAcademicYear, currentUser.departmentId, currentUser.name]);

  if (!isOpen) return null;

  const toggleSdg = (num: number) => {
    setSdgGoals(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const toggleGrade = (gradeKey: string) => {
    setTargetGrades(prev => {
      const next = prev.includes(gradeKey) 
        ? prev.filter(g => g !== gradeKey) 
        : [...prev, gradeKey];

      const allLiseKeys = SCHOOL_LEVELS.LISE.grades.map(g => `Erenköy Işık Lisesi - ${g}`);
      const allFenKeys = SCHOOL_LEVELS.FEN.grades.map(g => `Erenköy Işık Fen Lisesi - ${g}`);
      const allKeys = [...allLiseKeys, ...allFenKeys];
      const hasAll = allKeys.every(k => next.includes(k));

      if (hasAll && !next.includes('Tüm Okul')) {
        return [...next, 'Tüm Okul'];
      } else if (!hasAll && next.includes('Tüm Okul')) {
        return next.filter(k => k !== 'Tüm Okul');
      }
      return next;
    });
  };

  const handleToggleLiseAll = () => {
    const liseKeys = SCHOOL_LEVELS.LISE.grades.map(g => `Erenköy Işık Lisesi - ${g}`);
    const isAllLiseSelected = liseKeys.every(k => targetGrades.includes(k));

    setTargetGrades(prev => {
      let next: string[];
      if (isAllLiseSelected) {
        next = prev.filter(k => !liseKeys.includes(k) && k !== 'Tüm Okul');
      } else {
        const withoutLise = prev.filter(k => !liseKeys.includes(k));
        next = [...withoutLise, ...liseKeys];
        const allFenKeys = SCHOOL_LEVELS.FEN.grades.map(g => `Erenköy Işık Fen Lisesi - ${g}`);
        if (allFenKeys.every(k => next.includes(k)) && !next.includes('Tüm Okul')) {
          next.push('Tüm Okul');
        }
      }
      return next;
    });
  };

  const handleToggleFenAll = () => {
    const fenKeys = SCHOOL_LEVELS.FEN.grades.map(g => `Erenköy Işık Fen Lisesi - ${g}`);
    const isAllFenSelected = fenKeys.every(k => targetGrades.includes(k));

    setTargetGrades(prev => {
      let next: string[];
      if (isAllFenSelected) {
        next = prev.filter(k => !fenKeys.includes(k) && k !== 'Tüm Okul');
      } else {
        const withoutFen = prev.filter(k => !fenKeys.includes(k));
        next = [...withoutFen, ...fenKeys];
        const allLiseKeys = SCHOOL_LEVELS.LISE.grades.map(g => `Erenköy Işık Lisesi - ${g}`);
        if (allLiseKeys.every(k => next.includes(k)) && !next.includes('Tüm Okul')) {
          next.push('Tüm Okul');
        }
      }
      return next;
    });
  };

  const handleToggleAllSchool = () => {
    const allLiseKeys = SCHOOL_LEVELS.LISE.grades.map(g => `Erenköy Işık Lisesi - ${g}`);
    const allFenKeys = SCHOOL_LEVELS.FEN.grades.map(g => `Erenköy Işık Fen Lisesi - ${g}`);
    const allKeys = [...allLiseKeys, ...allFenKeys];
    const isAllSelected = allKeys.every(k => targetGrades.includes(k));

    if (isAllSelected) {
      setTargetGrades([]);
    } else {
      setTargetGrades([...allKeys, 'Tüm Okul']);
    }
  };

  const liseKeys = SCHOOL_LEVELS.LISE.grades.map(g => `Erenköy Işık Lisesi - ${g}`);
  const fenKeys = SCHOOL_LEVELS.FEN.grades.map(g => `Erenköy Işık Fen Lisesi - ${g}`);
  const selectedLiseCount = liseKeys.filter(k => targetGrades.includes(k)).length;
  const selectedFenCount = fenKeys.filter(k => targetGrades.includes(k)).length;
  const isAllLiseSelected = selectedLiseCount === liseKeys.length;
  const isAllFenSelected = selectedFenCount === fenKeys.length;
  const isAllSchoolSelected = isAllLiseSelected && isAllFenSelected;

  const handleAddCollaborator = () => {
    const raw = collaboratorInput.trim();
    if (!raw) return;
    const names = raw
      .split(/[,;\n]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    setCollaboratingTeachers(prev => {
      const added = [...prev];
      for (const name of names) {
        if (!added.some(existing => existing.toLowerCase() === name.toLowerCase())) {
          added.push(name);
        }
      }
      return added;
    });
    setCollaboratorInput('');
  };

  const handleRemoveCollaborator = (nameToRemove: string) => {
    setCollaboratingTeachers(prev => prev.filter(name => name !== nameToRemove));
  };

  const handleCollaboratorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCollaborator();
    }
  };

  const handleAddStudentRep = () => {
    const raw = studentRepInput.trim();
    if (!raw) return;
    const names = raw
      .split(/[,;\n]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    setStudentRepresentatives(prev => {
      const added = [...prev];
      for (const name of names) {
        if (!added.some(existing => existing.toLowerCase() === name.toLowerCase())) {
          added.push(name);
        }
      }
      return added;
    });
    setStudentRepInput('');
  };

  const handleRemoveStudentRep = (nameToRemove: string) => {
    setStudentRepresentatives(prev => prev.filter(name => name !== nameToRemove));
  };

  const handleStudentRepKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddStudentRep();
    }
  };

  const handleSubmit = (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Lütfen proje başlığı ve açıklamasını doldurunuz.');
      return;
    }
    if (targetGrades.length === 0) {
      alert('Lütfen en az bir hedef kitle / okul sınıf düzeyi seçiniz.');
      return;
    }

    // Aktif Eğitim-Öğretim Yılı Tarih Kontrolü
    if (activeAcademicYear) {
      if (startDate < activeAcademicYear.startDate || startDate > activeAcademicYear.endDate) {
        alert(
          `Başlangıç tarihi aktif eğitim-öğretim yılı (${activeAcademicYear.name}: ${activeAcademicYear.startDate.split('-').reverse().join('.')} – ${activeAcademicYear.endDate.split('-').reverse().join('.')}) sınırları içinde olmalıdır.`
        );
        return;
      }
      if (endDate && (endDate < activeAcademicYear.startDate || endDate > activeAcademicYear.endDate)) {
        alert(
          `Bitiş tarihi aktif eğitim-öğretim yılı (${activeAcademicYear.name}: ${activeAcademicYear.startDate.split('-').reverse().join('.')} – ${activeAcademicYear.endDate.split('-').reverse().join('.')}) sınırları içinde olmalıdır.`
        );
        return;
      }
    }
    if (endDate && endDate < startDate) {
      alert('Bitiş tarihi başlangıç tarihinden önce olamaz.');
      return;
    }

    // Input kutusunda henüz eklenmemiş metin varsa otomatik ekle
    let currentCollaborators = [...collaboratingTeachers];
    if (collaboratorInput.trim()) {
      const pendingNames = collaboratorInput
        .trim()
        .split(/[,;\n]+/)
        .map(n => n.trim())
        .filter(n => n.length > 0);
      for (const name of pendingNames) {
        if (!currentCollaborators.some(existing => existing.toLowerCase() === name.toLowerCase())) {
          currentCollaborators.push(name);
        }
      }
    }

    let currentStudentReps = [...studentRepresentatives];
    if (studentRepInput.trim()) {
      const pendingReps = studentRepInput
        .trim()
        .split(/[,;\n]+/)
        .map(n => n.trim())
        .filter(n => n.length > 0);
      for (const name of pendingReps) {
        if (!currentStudentReps.some(existing => existing.toLowerCase() === name.toLowerCase())) {
          currentStudentReps.push(name);
        }
      }
    }

    const projectData = {
      title,
      departmentId,
      advisorId: initialProject ? initialProject.advisorId : currentUser.id,
      advisorName,
      collaboratingTeachers: currentCollaborators.length > 0 ? currentCollaborators : undefined,
      studentClub: studentClub.trim() || undefined,
      studentRepresentatives: currentStudentReps.length > 0 ? currentStudentReps : undefined,
      eventType,
      sdgGoals,
      targetGrades,
      startDate,
      endDate: endDate || undefined,
      location,
      resourceNeeds: resourceNeeds || undefined,
      description,
      status: asDraft ? ('draft' as const) : ('submitted' as const),
    };

    if (isEditing && onUpdate && initialProject) {
      onUpdate(initialProject.id, projectData);
    } else {
      onSubmit(projectData);
    }

    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Modal Başlığı */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEditing 
                  ? (initialProject?.status === 'draft' ? 'Taslak Projeyi Düzenle' : 'Projeyi Güncelle & Onaya Sun')
                  : 'Yeni Sürdürülebilirlik Çalışması / Proje Önerisi'}
              </h2>
              <p className="text-xs text-emerald-200">
                {isEditing
                  ? (initialProject?.status === 'draft' 
                      ? 'Yarım kalan taslağınızı tamamlayıp onaya gönderebilirsiniz' 
                      : 'Revizyon notu doğrultusunda projeyi güncelleyip tekrar onaya sunabilirsiniz')
                  : 'Bölüm başkanlığı ve koordinatör onayına sunulacak form'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Gövdesi */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Revizyon Geri Bildirimi Uyarısı (Varsa) */}
          {initialProject?.rejectionFeedback && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Bölüm Başkanı Revizyon Talebi: </span>
                <span>{initialProject.rejectionFeedback}</span>
              </div>
            </div>
          )}
          {/* Başlık & Bölüm */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Çalışmanın / Projenin Başlığı *
              </label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Kampüs Gri Su Geri Kazanım ve Damla Sulama Sistemi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Sorumlu Zümre / Bölüm *
                </label>
                {(currentUser.role === 'teacher' || currentUser.role === 'dept_head') && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Zümrenize Kilitlendi
                  </span>
                )}
              </div>
              <select
                disabled={currentUser.role === 'teacher' || currentUser.role === 'dept_head'}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                  currentUser.role === 'teacher' || currentUser.role === 'dept_head'
                    ? 'bg-slate-100 text-slate-700 cursor-not-allowed font-medium'
                    : 'bg-white'
                }`}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Danışman & Etkinlik Türü */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Danışman Öğretmen / Sorumlu *
                </label>
                {currentUser.role === 'teacher' && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Bireysel Profiliniz
                  </span>
                )}
              </div>
              <input 
                type="text" 
                required
                readOnly={currentUser.role === 'teacher'}
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                  currentUser.role === 'teacher'
                    ? 'bg-slate-100 text-slate-700 cursor-not-allowed font-medium'
                    : 'bg-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Etkinlik / Proje Türü *
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Atölye">Atölye (Hands-on Workshop)</option>
                <option value="Seminer / Konferans">Seminer / Konferans</option>
                <option value="Saha Gezisi">Saha Gezisi (Field Trip)</option>
                <option value="Farkındalık Kampanyası">Farkındalık Kampanyası</option>
                <option value="Yarışma">Yarışma / Hackathon</option>
                <option value="Müfredat İçi Proje">Müfredat İçi Proje</option>
              </select>
            </div>
          </div>

          {/* Birlikte Çalışılacak Diğer Öğretmenler (Ortak Görevliler) */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Birlikte Çalışılacak Diğer Öğretmenler (Ortak Görevliler)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Projede sizinle birlikte görev alacak öğretmenlerin isimlerini ekleyebilirsiniz. (Sistemde kayıtlı olmaları zorunlu değildir)
                </p>
              </div>
              {collaboratingTeachers.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 self-start sm:self-auto">
                  {collaboratingTeachers.length} Ortak Öğretmen Eklendi
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={collaboratorInput}
                  onChange={(e) => setCollaboratorInput(e.target.value)}
                  onKeyDown={handleCollaboratorKeyDown}
                  placeholder="Öğretmen adı soyadı yazınız (Örn: Selin Öztürk, Ahmet Kaya)..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCollaborator}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>

            {/* Eklenen Öğretmen Rozetleri */}
            {collaboratingTeachers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {collaboratingTeachers.map((teacher, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-medium text-emerald-900 shadow-2xs group animate-in fade-in"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{teacher}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCollaborator(teacher)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors ml-0.5 cursor-pointer"
                      title="Kaldır"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                Henüz ortak öğretmen eklenmedi. (Projenizi tek başınıza yürütüyorsanız bu alanı boş bırakabilirsiniz)
              </div>
            )}
          </div>

          {/* İlgili Öğrenci Kulübü ve Öğrenci Temsilcileri */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                İlgili Öğrenci Kulübü &amp; Öğrenci Temsilcileri
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Projeyi yürüten veya destekleyen öğrenci kulübünü seçebilir, projede aktif rol alan öğrenci temsilcilerini ekleyebilirsiniz.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Öğrenci Kulübü
                </label>
                <select
                  value={studentClub}
                  onChange={(e) => setStudentClub(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                >
                  <option value="">Seçiniz / Bağımsız Zümre Grubu</option>
                  <option value="Çevre ve Sürdürülebilirlik Kulübü">Çevre ve Sürdürülebilirlik Kulübü</option>
                  <option value="Fen, Teknoloji ve İnovasyon Kulübü">Fen, Teknoloji ve İnovasyon Kulübü</option>
                  <option value="Genç Liderler ve Sosyal Sorumluluk Kulübü">Genç Liderler ve Sosyal Sorumluluk Kulübü</option>
                  <option value="TEMA &amp; Doğa Gönüllüleri Kulübü">TEMA &amp; Doğa Gönüllüleri Kulübü</option>
                  <option value="Girişimcilik ve Küresel Amaçlar Kulübü">Girişimcilik ve Küresel Amaçlar Kulübü</option>
                  <option value="Görsel Sanatlar ve Tasarım Kulübü">Görsel Sanatlar ve Tasarım Kulübü</option>
                  <option value="Münazara ve Fikir Kulübü">Münazara ve Fikir Kulübü</option>
                  <option value="Diğer / Öğrenci Meclisi">Diğer / Öğrenci Meclisi</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Öğrenci Temsilcisi Ekle
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={studentRepInput}
                    onChange={(e) => setStudentRepInput(e.target.value)}
                    onKeyDown={handleStudentRepKeyDown}
                    placeholder="Örn: Ali Yılmaz (10A)"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddStudentRep}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>

            {/* Eklenen Öğrenci Temsilcileri Rozetleri */}
            {studentRepresentatives.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {studentRepresentatives.map((rep, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs font-medium text-amber-900 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>{rep}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStudentRep(rep)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors ml-0.5 cursor-pointer"
                      title="Kaldır"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* BM SKA (SDGs) Seçimi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              İlişkili BM Sürdürülebilir Kalkınma Amaçları (En az 1 seçim yapınız)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
              {SDG_GOALS.map((sdg) => {
                const isSelected = sdgGoals.includes(sdg.number);
                return (
                  <button
                    type="button"
                    key={sdg.number}
                    onClick={() => toggleSdg(sdg.number)}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-white shadow-xs border text-slate-900 font-semibold ring-1 ring-emerald-600'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span 
                      style={{ backgroundColor: sdg.color }}
                      className="w-4 h-4 rounded text-[9px] text-white font-bold flex items-center justify-center shrink-0"
                    >
                      {sdg.number}
                    </span>
                    <span className="truncate">{sdg.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hedef Kitle (Okul & Sınıflar) */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hedef Kitle / Katılımcı Seviyesi *
                </label>
                <p className="text-[11px] text-slate-500">
                  Düzeyleri her iki okuldan aynı anda veya ayrı ayrı seçebilirsiniz.
                </p>
              </div>

              {/* Hızlı Tüm Okul Butonu */}
              <button
                type="button"
                onClick={handleToggleAllSchool}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  isAllSchoolSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isAllSchoolSelected ? <Check className="w-3.5 h-3.5" /> : <School className="w-3.5 h-3.5 text-slate-500" />}
                <span>Tüm Okul (Tüm Kademeler)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Kart 1: Erenköy Işık Lisesi */}
              <div className={`p-4 rounded-2xl border transition-all ${
                selectedLiseCount > 0 
                  ? 'bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-200' 
                  : 'bg-slate-50/70 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      selectedLiseCount > 0 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Erenköy Işık Lisesi</h4>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {selectedLiseCount > 0 ? `${selectedLiseCount} Düzey Seçildi` : 'Seçim Yapılmadı'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleLiseAll}
                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-100/60"
                  >
                    {isAllLiseSelected ? 'Temizle' : 'Tümünü Seç'}
                  </button>
                </div>

                {/* Sınıf Düğmeleri */}
                <div className="flex flex-wrap gap-1.5">
                  {SCHOOL_LEVELS.LISE.grades.map((grade) => {
                    const fullKey = `Erenköy Işık Lisesi - ${grade}`;
                    const isSelected = targetGrades.includes(fullKey);
                    return (
                      <button
                        type="button"
                        key={fullKey}
                        onClick={() => toggleGrade(fullKey)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{grade === 'Hazırlık' ? 'Hazırlık' : `${grade}. Sınıf`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kart 2: Erenköy Işık Fen Lisesi */}
              <div className={`p-4 rounded-2xl border transition-all ${
                selectedFenCount > 0 
                  ? 'bg-teal-50/40 border-teal-200 ring-1 ring-teal-200' 
                  : 'bg-slate-50/70 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      selectedFenCount > 0 ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <Atom className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Erenköy Işık Fen Lisesi</h4>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {selectedFenCount > 0 ? `${selectedFenCount} Düzey Seçildi` : 'Seçim Yapılmadı'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleFenAll}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors px-2 py-1 rounded-lg hover:bg-teal-100/60"
                  >
                    {isAllFenSelected ? 'Temizle' : 'Tümünü Seç'}
                  </button>
                </div>

                {/* Sınıf Düğmeleri (Hazırlık yok!) */}
                <div className="flex flex-wrap gap-1.5">
                  {SCHOOL_LEVELS.FEN.grades.map((grade) => {
                    const fullKey = `Erenköy Işık Fen Lisesi - ${grade}`;
                    const isSelected = targetGrades.includes(fullKey);
                    return (
                      <button
                        type="button"
                        key={fullKey}
                        onClick={() => toggleGrade(fullKey)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-600 text-white font-semibold shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{`${grade}. Sınıf`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Tarih ve Mekan */}
          <div className="space-y-2">
            {activeAcademicYear && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>{activeAcademicYear.name}</strong> Proje Girişi:{' '}
                  <span className="font-semibold text-emerald-950 font-mono">
                    {activeAcademicYear.startDate.split('-').reverse().join('.')}
                  </span>
                  {' '}ile{' '}
                  <span className="font-semibold text-emerald-950 font-mono">
                    {activeAcademicYear.endDate.split('-').reverse().join('.')}
                  </span>
                  {' '}tarihleri arasında olmalıdır.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Başlangıç Tarihi *
                </label>
                <div className="relative">
                  <input 
                    type="date" 
                    required
                    value={startDate}
                    min={activeAcademicYear?.startDate}
                    max={activeAcademicYear?.endDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bitiş Tarihi (Opsiyonel)
                </label>
                <input 
                  type="date" 
                  value={endDate}
                  min={startDate || activeAcademicYear?.startDate}
                  max={activeAcademicYear?.endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Uygulama Mekanı / Alanı *
                </label>
                <input 
                  type="text" 
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Örn: Biyoloji Lab &amp; Sera Bahçesi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Özet ve Açıklama */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Çalışmanın Amacı ve Detaylı Açıklaması *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Öğrenciler ne yapacak? Bu projenin sürdürülebilirlik bilincine ve okula somut katkısı ne olacak?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Kaynak / İhtiyaç Talebi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kaynak, Ekipman ve Bütçe İhtiyacı (Varsa)
            </label>
            <input 
              type="text" 
              value={resourceNeeds}
              onChange={(e) => setResourceNeeds(e.target.value)}
              placeholder="Örn: 2 adet atık tartısı, 50 adet bez torba kumaşı, ses sistemi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Aksiyon Butonları */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              Vazgeç
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
              >
                {isEditing ? 'Taslak Olarak Güncelle' : 'Taslak Olarak Kaydet'}
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{isEditing && initialProject?.status === 'revision_needed' ? 'Revizyonu Tamamla & Onaya Gönder' : 'Bölüm Başkanına Onaya Gönder'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
