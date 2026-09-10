import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AcademicYear } from '../../types';
import { 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  X, 
  AlertCircle, 
  Clock, 
  Sparkles,
  Info,
  CalendarRange,
  Users
} from 'lucide-react';

interface AcademicYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYears: AcademicYear[];
  activeYear: AcademicYear;
  onSaveYear: (year: AcademicYear) => Promise<void>;
  onSetActiveYear: (yearId: string) => Promise<void>;
}

export const AcademicYearModal: React.FC<AcademicYearModalProps> = ({
  isOpen,
  onClose,
  academicYears,
  activeYear,
  onSaveYear,
  onSetActiveYear,
}) => {
  const [selectedYearId, setSelectedYearId] = useState<string>(activeYear.id);
  const [editingYear, setEditingYear] = useState<AcademicYear>(activeYear);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newYearId, setNewYearId] = useState('');
  const [newYearName, setNewYearName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newTotalStudents, setNewTotalStudents] = useState<number>(850);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeYear) {
      setSelectedYearId(activeYear.id);
      setEditingYear(activeYear);
    }
  }, [activeYear, isOpen]);

  if (!isOpen) return null;

  // Seçilen yılı düzenlemeye al
  const handleSelectYearToEdit = (year: AcademicYear) => {
    setIsAddingNew(false);
    setSelectedYearId(year.id);
    setEditingYear({ ...year });
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Tarih farkı hesaplama (Gün ve Hafta)
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return null;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    return { days: diffDays, weeks };
  };

  const editingDuration = calculateDuration(editingYear.startDate, editingYear.endDate);

  // Güncelleme Kaydet
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!editingYear.startDate || !editingYear.endDate) {
      setErrorMsg('Başlangıç ve bitiş tarihlerini eksiksiz belirtiniz.');
      return;
    }

    if (editingYear.startDate >= editingYear.endDate) {
      setErrorMsg('Başlangıç tarihi bitiş tarihinden önce olmalıdır.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveYear(editingYear);
      setSuccessMsg('Eğitim-öğretim yılı bilgileri başarıyla güncellendi.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Yeni Yıl Ekleme
  const handleCreateNewYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = newYearId.trim();
    if (!cleanId || !newStartDate || !newEndDate) {
      setErrorMsg('Lütfen tüm alanları doldurunuz.');
      return;
    }

    if (newStartDate >= newEndDate) {
      setErrorMsg('Başlangıç tarihi bitiş tarihinden önce olmalıdır.');
      return;
    }

    if (academicYears.some(y => y.id === cleanId)) {
      setErrorMsg('Bu dönem kimliğine sahip bir eğitim-öğretim yılı zaten mevcut.');
      return;
    }

    const created: AcademicYear = {
      id: cleanId,
      name: newYearName.trim() || `${cleanId} Eğitim-Öğretim Yılı`,
      startDate: newStartDate,
      endDate: newEndDate,
      isActive: false,
      totalStudents: newTotalStudents || 850,
      description: `${cleanId} Akademik Faaliyet Dönemi`
    };

    setIsSaving(true);
    try {
      await onSaveYear(created);
      setIsAddingNew(false);
      setNewYearId('');
      setNewYearName('');
      setNewStartDate('');
      setNewEndDate('');
      setEditingYear(created);
      setSelectedYearId(created.id);
      setSuccessMsg('Yeni eğitim-öğretim yılı başarıyla eklendi.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Yeni yıl eklenirken hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Aktif Yılı Değiştir
  const handleSetActive = async (yearId: string) => {
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onSetActiveYear(yearId);
      setSuccessMsg('Aktif eğitim-öğretim yılı başarıyla değiştirildi.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Aktif yıl güncellenirken hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-2xl my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık Alanı */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold backdrop-blur-xs shadow-inner">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">Eğitim-Öğretim Yılı Yönetimi</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Koordinatör Yetkisi
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Okul çalışma takvimini belirleyin, proje ve etkinlik giriş sınırlarını yönetin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gövde */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[calc(88vh-5rem)] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Bilgilendirme Notu */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Tarih Kısıtlaması Kuralı:</strong> Belirlediğiniz başlangıç ve bitiş tarihleri, öğretmenlerin ve zümrelerin yeni proje veya faaliyet girişi yaparken seçecekleri tarihlerin sınırlarını (minimum ve maksimum) otomatik olarak belirler.
            </p>
          </div>

          {/* Dönem Listesi & Hızlı Seçim */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kayıtlı Eğitim-Öğretim Yılları</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingNew ? 'Listeye Dön' : 'Yeni Yıl Tanımla'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {academicYears.map((year) => {
                const isSelected = selectedYearId === year.id && !isAddingNew;
                const isCurrentActive = year.isActive;

                return (
                  <div
                    key={year.id}
                    onClick={() => handleSelectYearToEdit(year)}
                    className={`p-3 rounded-2xl border transition-all text-left cursor-pointer relative ${
                      isCurrentActive
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                        : isSelected
                        ? 'bg-slate-50 border-slate-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm text-slate-900">{year.id}</span>
                      {isCurrentActive ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                          Aktif Yıl
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetActive(year.id);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition cursor-pointer"
                        >
                          Aktif Yap
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{year.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      {year.startDate.split('-').reverse().join('.')} – {year.endDate.split('-').reverse().join('.')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1. SEÇİLİ YILI DÜZENLEME FORMU */}
          {!isAddingNew ? (
            <form onSubmit={handleSaveEdit} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Seçili Yıl Ayarları: <span className="text-emerald-700">{editingYear.id}</span>
                  </h4>
                </div>
                {editingYear.isActive ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Şu Anda Aktif Çalışma Yılı
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetActive(editingYear.id)}
                    className="text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 px-3 py-1 rounded-lg transition shadow-2xs cursor-pointer"
                  >
                    Bu Yılı Aktif Çalışma Yılı Yap
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Eğitim-Öğretim Yılı Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={editingYear.name}
                  onChange={(e) => setEditingYear({ ...editingYear, name: e.target.value })}
                  placeholder="Örn: 2026-2027 Eğitim-Öğretim Yılı"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dönem Başlangıç Tarihi *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editingYear.startDate}
                    onChange={(e) => setEditingYear({ ...editingYear, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dönem Bitiş Tarihi *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editingYear.endDate}
                    onChange={(e) => setEditingYear({ ...editingYear, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              {editingDuration && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Hesaplanan Dönem Süresi:
                  </span>
                  <span className="font-bold text-slate-800">
                    {editingDuration.weeks} Hafta ({editingDuration.days} Gün)
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Okul Toplam Öğrenci Mevcudu</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={editingYear.totalStudents || 850}
                    onChange={(e) => setEditingYear({ ...editingYear, totalStudents: Number(e.target.value) || 850 })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-bold"
                    placeholder="850"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    Öğrenci
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Öğrenci başına aylık elektrik/su ayak izi ve okul geneli sürdürülebilirlik katılım yüzdesinde temel alınır.
                </p>
              </div>

              <div className="pt-1 flex items-center justify-end gap-2.5">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Kaydediliyor...' : 'Tarihleri ve Bilgileri Kaydet'}
                </button>
              </div>
            </form>
          ) : (
            /* 2. YENİ YIL EKLEME FORMU */
            <form onSubmit={handleCreateNewYear} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Plus className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Yeni Eğitim-Öğretim Yılı Tanımla
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dönem Kimliği (Örn: 2027-2028) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newYearId}
                    onChange={(e) => {
                      setNewYearId(e.target.value);
                      if (!newYearName || newYearName.includes('Eğitim-Öğretim Yılı')) {
                        setNewYearName(`${e.target.value} Eğitim-Öğretim Yılı`);
                      }
                    }}
                    placeholder="2027-2028"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Görünen Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={newYearName}
                    onChange={(e) => setNewYearName(e.target.value)}
                    placeholder="2027-2028 Eğitim-Öğretim Yılı"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Başlangıç Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bitiş Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Toplam Öğrenci Mevcudu</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={newTotalStudents}
                    onChange={(e) => setNewTotalStudents(Number(e.target.value) || 850)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-bold"
                    placeholder="850"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    Öğrenci
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Ekleniyor...' : 'Yeni Yılı Listeye Ekle'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Alt Kısım */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Aktif Yıl: <strong>{activeYear.name}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
