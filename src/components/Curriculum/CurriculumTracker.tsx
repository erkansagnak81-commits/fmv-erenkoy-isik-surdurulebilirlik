import React, { useState } from 'react';
import { CurriculumIntegration, UserProfile } from '../../types';
import { DEPARTMENTS, SDG_GOALS } from '../../data/mockData';
import { BookOpenCheck, Plus, Search, Users, Sparkles, X, Check } from 'lucide-react';

interface CurriculumTrackerProps {
  curriculums: CurriculumIntegration[];
  onAddCurriculum: (item: Omit<CurriculumIntegration, 'id'>) => void;
  currentUser: UserProfile;
}

export const CurriculumTracker: React.FC<CurriculumTrackerProps> = ({
  curriculums,
  onAddCurriculum,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [courseName, setCourseName] = useState('11. Sınıf Fizik');
  const [gradeLevel, setGradeLevel] = useState('11. Sınıf');
  const [departmentId, setDepartmentId] = useState(currentUser.departmentId || DEPARTMENTS[0].id);
  const [learningOutcome, setLearningOutcome] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [sdgGoals, setSdgGoals] = useState<number[]>([7, 13]);
  const [studentCount, setStudentCount] = useState(120);
  const [academicTerm, setAcademicTerm] = useState('2026-2027 Güz');

  const filteredCurriculums = curriculums.filter(c => {
    const matchesSearch = 
      c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.learningOutcome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'all' || c.departmentId === selectedDept;

    return matchesSearch && matchesDept;
  });

  const totalStudents = curriculums.reduce((sum, c) => sum + c.studentCount, 0);

  const toggleSdg = (num: number) => {
    setSdgGoals(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!learningOutcome.trim() || !activityDescription.trim()) {
      alert('Lütfen kazanım ve etkinlik açıklamasını doldurunuz.');
      return;
    }

    onAddCurriculum({
      departmentId,
      teacherName: currentUser.name,
      courseName,
      gradeLevel,
      learningOutcome,
      sdgGoals,
      activityDescription,
      studentCount,
      academicTerm,
    });

    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Üst Bilgilendirme */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
            {totalStudents} Öğrenciye Ulaşıldı
          </span>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ders Kazanımı Eşle</span>
          </button>
        </div>
      </div>

      {/* Arama & Filtre */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card-soft flex flex-col sm:flex-row items-center justify-between gap-3">
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
        </div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCurriculums.map((item) => {
                const dept = DEPARTMENTS.find(d => d.id === item.departmentId);

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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yeni Kazanım Ekleme Modalı */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-purple-300" />
                <h3 className="font-bold text-sm">Yeni Ders İçi Kazanım Eşleştirmesi</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sorumlu Zümre *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">İlişkili SKA'lar</label>
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Eğitim Dönemi</label>
                  <input
                    type="text"
                    value={academicTerm}
                    onChange={(e) => setAcademicTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs"
                >
                  Matrise Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
