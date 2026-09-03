import React, { useState } from 'react';
import { ProjectEvent, UserProfile } from '../../types';
import { DEPARTMENTS, SDG_GOALS } from '../../data/mockData';
import { X, Plus, Sparkles, Calendar, MapPin, Package, Check } from 'lucide-react';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<ProjectEvent, 'id' | 'createdAt'>) => void;
  currentUser: UserProfile;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}) => {
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState(currentUser.departmentId || DEPARTMENTS[0].id);
  const [advisorName, setAdvisorName] = useState(currentUser.name);
  const [eventType, setEventType] = useState<ProjectEvent['eventType']>('Atölye');
  const [sdgGoals, setSdgGoals] = useState<number[]>([12, 13]);
  const [targetGrades, setTargetGrades] = useState<string[]>(['10', '11']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('Okul Konferans Salonu');
  const [resourceNeeds, setResourceNeeds] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const toggleSdg = (num: number) => {
    setSdgGoals(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const toggleGrade = (grade: string) => {
    setTargetGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  const handleSubmit = (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Lütfen proje başlığı ve açıklamasını doldurunuz.');
      return;
    }

    onSubmit({
      title,
      departmentId,
      advisorId: currentUser.id,
      advisorName,
      eventType,
      sdgGoals,
      targetGrades,
      startDate,
      endDate: endDate || undefined,
      location,
      resourceNeeds: resourceNeeds || undefined,
      description,
      status: asDraft ? 'draft' : 'submitted',
    });

    onClose();
  };

  const availableGrades = ['Hazırlık', '9', '10', '11', '12', 'Tüm Okul', 'Veliler'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Modal Başlığı */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Yeni Sürdürülebilirlik Çalışması / Proje Önerisi</h2>
              <p className="text-xs text-emerald-200">Bölüm başkanlığı ve koordinatör onayına sunulacak form</p>
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sorumlu Zümre / Bölüm *
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Danışman Öğretmen / Sorumlu *
              </label>
              <input 
                type="text" 
                required
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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

          {/* Hedef Kitle (Sınıflar) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Hedef Kitle / Katılımcı Seviyesi
            </label>
            <div className="flex flex-wrap gap-2">
              {availableGrades.map((grade) => {
                const isSelected = targetGrades.includes(grade);
                return (
                  <button
                    type="button"
                    key={grade}
                    onClick={() => toggleGrade(grade)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{grade}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tarih ve Mekan */}
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
                Taslak Olarak Kaydet
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Bölüm Başkanına Onaya Gönder</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
