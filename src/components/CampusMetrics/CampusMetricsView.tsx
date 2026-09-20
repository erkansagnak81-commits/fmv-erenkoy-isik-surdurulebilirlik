import React, { useState } from 'react';
import { CampusMetric, UserProfile, AcademicYear, SystemRolePermissions } from '../../types';
import { hasUserActionPermission } from '../../constants/permissions';
import { calculateCarbonAnalysis } from '../../lib/carbonCalculator';
import { exportCampusMetricsToCsv } from '../../lib/exportUtils';
import { 
  BarChart3, 
  Plus, 
  Zap, 
  Droplets, 
  FileText, 
  Recycle, 
  Leaf, 
  X,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Edit3,
  UserCheck,
  Clock,
  CalendarDays,
  Download,
  TreePine,
  CloudRain,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CampusMetricsViewProps {
  metrics: CampusMetric[];
  onAddMetric: (metric: Omit<CampusMetric, 'id'>) => void;
  onUpdateMetric?: (metric: CampusMetric) => void;
  onDeleteMetric?: (metricId: string) => void;
  onClearMetrics?: () => void;
  currentUser: UserProfile;
  activeAcademicYear?: AcademicYear;
  rolePermissions?: SystemRolePermissions;
}

export const CampusMetricsView: React.FC<CampusMetricsViewProps> = ({
  metrics,
  onAddMetric,
  onUpdateMetric,
  onDeleteMetric,
  onClearMetrics,
  currentUser,
  activeAcademicYear,
  rolePermissions,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<CampusMetric | null>(null);
  const [deletingMetric, setDeletingMetric] = useState<CampusMetric | null>(null);

  const canEdit = hasUserActionPermission(currentUser, 'canEditCampusMetrics', rolePermissions);
  const canReset = hasUserActionPermission(currentUser, 'canResetCampusMetrics', rolePermissions);

  // Form State
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [electricityKwh, setElectricityKwh] = useState<number>(0);
  const [waterM3, setWaterM3] = useState<number>(0);
  const [paperReams, setPaperReams] = useState<number>(0);
  const [recyclingPaperKg, setRecyclingPaperKg] = useState<number>(0);
  const [recyclingPlasticKg, setRecyclingPlasticKg] = useState<number>(0);
  const [recyclingGlassKg, setRecyclingGlassKg] = useState<number>(0);
  const [recyclingMetalKg, setRecyclingMetalKg] = useState<number>(0);
  const [compostOrganicKg, setCompostOrganicKg] = useState<number>(0);
  const [specialEwasteKg, setSpecialEwasteKg] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Rapor Kapsamı: 'year' (Aktif Eğitim-Öğretim Yılı) veya 'all' (Tüm Dönemler / Kümülatif)
  const [scopeMode, setScopeMode] = useState<'year' | 'all'>('year');

  // Sıralı tüm metrikler
  const sortedMetrics = React.useMemo(() => {
    return [...metrics].sort((a, b) => a.period.localeCompare(b.period));
  }, [metrics]);

  // Aktif eğitim yılına göre filtrelenmiş metrikler
  const scopedMetrics = React.useMemo(() => {
    if (scopeMode === 'year' && activeAcademicYear) {
      const startMonth = activeAcademicYear.startDate.slice(0, 7);
      const endMonth = activeAcademicYear.endDate.slice(0, 7);
      return sortedMetrics.filter(m => m.period >= startMonth && m.period <= endMonth);
    }
    return sortedMetrics;
  }, [sortedMetrics, scopeMode, activeAcademicYear]);

  const latest = scopedMetrics[scopedMetrics.length - 1] || sortedMetrics[sortedMetrics.length - 1];

  // Karbon ve Çevresel Etki Analizi
  const carbonAnalysis = calculateCarbonAnalysis(scopedMetrics, activeAcademicYear?.totalStudents || 850);

  const handleOpenNewModal = () => {
    setEditingMetric(null);
    setPeriod(new Date().toISOString().slice(0, 7));
    setElectricityKwh(0);
    setWaterM3(0);
    setPaperReams(0);
    setRecyclingPaperKg(0);
    setRecyclingPlasticKg(0);
    setRecyclingGlassKg(0);
    setRecyclingMetalKg(0);
    setCompostOrganicKg(0);
    setSpecialEwasteKg(0);
    setNotes('');
    setModalOpen(true);
  };

  const handleStartEdit = (m: CampusMetric) => {
    setEditingMetric(m);
    setPeriod(m.period);
    setElectricityKwh(m.electricityKwh);
    setWaterM3(m.waterM3);
    setPaperReams(m.paperReams);
    setRecyclingPaperKg(m.recyclingPaperKg);
    setRecyclingPlasticKg(m.recyclingPlasticKg);
    setRecyclingGlassKg(m.recyclingGlassKg);
    setRecyclingMetalKg(m.recyclingMetalKg);
    setCompostOrganicKg(m.compostOrganicKg);
    setSpecialEwasteKg(m.specialEwasteKg);
    setNotes(m.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {}

    if (editingMetric) {
      if (onUpdateMetric) {
        onUpdateMetric({
          ...editingMetric,
          period,
          electricityKwh: Number(electricityKwh) || 0,
          waterM3: Number(waterM3) || 0,
          paperReams: Number(paperReams) || 0,
          recyclingPaperKg: Number(recyclingPaperKg) || 0,
          recyclingPlasticKg: Number(recyclingPlasticKg) || 0,
          recyclingGlassKg: Number(recyclingGlassKg) || 0,
          recyclingMetalKg: Number(recyclingMetalKg) || 0,
          compostOrganicKg: Number(compostOrganicKg) || 0,
          specialEwasteKg: Number(specialEwasteKg) || 0,
          notes: notes.trim() || '',
        });
      }
    } else {
      onAddMetric({
        period,
        electricityKwh: Number(electricityKwh) || 0,
        waterM3: Number(waterM3) || 0,
        paperReams: Number(paperReams) || 0,
        recyclingPaperKg: Number(recyclingPaperKg) || 0,
        recyclingPlasticKg: Number(recyclingPlasticKg) || 0,
        recyclingGlassKg: Number(recyclingGlassKg) || 0,
        recyclingMetalKg: Number(recyclingMetalKg) || 0,
        compostOrganicKg: Number(compostOrganicKg) || 0,
        specialEwasteKg: Number(specialEwasteKg) || 0,
        notes: notes.trim() || '',
      });
    }

    // Formu sıfırla
    setEditingMetric(null);
    setElectricityKwh(0);
    setWaterM3(0);
    setPaperReams(0);
    setRecyclingPaperKg(0);
    setRecyclingPlasticKg(0);
    setRecyclingGlassKg(0);
    setRecyclingMetalKg(0);
    setCompostOrganicKg(0);
    setSpecialEwasteKg(0);
    setNotes('');
    setModalOpen(false);
  };

  const handleExportCsv = () => {
    exportCampusMetricsToCsv(scopedMetrics);
  };

  // Grafik hesaplamaları
  const maxElectricity = Math.max(...scopedMetrics.map(m => m.electricityKwh), 1);

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Barı */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Yeşil Kampüs Göstergeleri &amp; Karbon Ayak İzi
            </h2>
            <p className="text-xs text-slate-500">
              FMV Erenköy Işık Lisesi ve Fen Lisesi elektrik, su, kağıt tüketimi ve sıfır atık envanteri
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {activeAcademicYear && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setScopeMode('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scopeMode === 'year'
                    ? 'bg-white text-teal-800 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {activeAcademicYear.name}
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scopeMode === 'all'
                    ? 'bg-white text-teal-800 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Tüm Dönemler
              </button>
            </div>
          )}

          {scopedMetrics.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Sayaç ve atık verilerini Excel / CSV olarak indir"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Excel / CSV</span>
            </button>
          )}

          {metrics.length > 0 && canReset && onClearMetrics && (
            <button
              onClick={() => setConfirmClearOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Verileri Temizle</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Aylık Sayaç / Atık Verisi Gir</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Ana Sayaç Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Elektrik */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Elektrik Tüketimi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {latest ? latest.electricityKwh.toLocaleString('tr-TR') : '0'} <span className="text-xs font-medium text-slate-500">kWh</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-2">
            {latest ? (
              <>Son Dönem: <strong>{latest.period}</strong></>
            ) : (
              <span className="text-slate-400 italic">Veri Bekleniyor</span>
            )}
          </p>
        </div>

        {/* Su */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Su Kullanımı</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {latest ? latest.waterM3.toLocaleString('tr-TR') : '0'} <span className="text-xs font-medium text-slate-500">m³</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-2">
            {latest ? (
              <>Son Dönem: <strong>{latest.period}</strong></>
            ) : (
              <span className="text-slate-400 italic">Veri Bekleniyor</span>
            )}
          </p>
        </div>

        {/* Kağıt */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Kağıt / Fotokopi</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {latest ? latest.paperReams : '0'} <span className="text-xs font-medium text-slate-500">Koli / Top</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-2">
            {latest ? (
              <>Son Dönem: <strong>{latest.period}</strong></>
            ) : (
              <span className="text-slate-400 italic">Veri Bekleniyor</span>
            )}
          </p>
        </div>

        {/* Toplam Geri Dönüşüm */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Toplam Geri Kazanım</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Recycle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {carbonAnalysis.totalRecycledKg.toLocaleString('tr-TR')} <span className="text-xs font-medium text-slate-500">kg atık</span>
          </h3>
          <p className="text-[11px] font-semibold mt-2">
            {latest ? (
              <span className="text-emerald-700">T.C. Sıfır Atık Hedefine Katkı</span>
            ) : (
              <span className="text-slate-400 italic">Veri Girişi Bekleniyor</span>
            )}
          </p>
        </div>
      </div>

      {/* YENİ: OTOMATİK KARBON AYAK İZİ & BİRİM TÜKETİM HESAPLAYICI KARTLARI */}
      {scopedMetrics.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-900/50 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Otomatik Ekolojik Etki &amp; Karbon Ayak İzi Analizi
                </h3>
                <p className="text-xs text-slate-300">
                  {carbonAnalysis.recordedMonthsCount} kayıtlı dönemin tüketim verilerinden üretilen resmi emisyon göstergeleri
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
              <span>Mevcut: ~{activeAcademicYear?.totalStudents || 850} Öğrenci</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Net Karbon Salımı */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-slate-300 text-[11px] font-semibold">
                <span>Net Karbon Ayak İzi</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">
                {carbonAnalysis.netEmissionsTons} <span className="text-xs font-normal text-slate-300">tCO₂e</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Brüt: {carbonAnalysis.grossEmissionsTons} tCO₂e • Önlenen: -{carbonAnalysis.avoidedEmissionsTons} tCO₂e
              </p>
            </div>

            {/* Kurtarılan Ağaç */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-slate-300 text-[11px] font-semibold">
                <span>Kurtarılan Ağaç</span>
                <TreePine className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                ~{carbonAnalysis.treesSavedCount} <span className="text-xs font-normal text-slate-300">yetişkin ağaç</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Kağıt ve karton geri kazanımı sayesinde
              </p>
            </div>

            {/* Öğrenci Başı Aylık Elektrik */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-slate-300 text-[11px] font-semibold">
                <span>Öğrenci Başı Elektrik</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">
                {carbonAnalysis.perStudentMonthlyElectricityKwh} <span className="text-xs font-normal text-slate-300">kWh/ay</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Kişi başı aylık ortalama elektrik yükü
              </p>
            </div>

            {/* Öğrenci Başı Günlük Su */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-slate-300 text-[11px] font-semibold">
                <span>Öğrenci Başı Günlük Su</span>
                <CloudRain className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-blue-300 mt-1">
                {carbonAnalysis.perStudentDailyWaterLiters} <span className="text-xs font-normal text-slate-300">Litre/gün</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Okul günlerinde kişi başı su tüketimi
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Veri Durumuna Göre İçerik */}
      {metrics.length === 0 ? (
        /* Boş Durum (Empty State) */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-card-soft space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-slate-900">
              Henüz Kampüs Tüketim ve Atık Verisi Girilmedi
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              FMV Erenköy Işık Lisesi ve Fen Lisesi elektrik sayaçları, su tüketimi, fotokopi kağıdı ve sıfır atık geri dönüşüm tartım verilerini aylık periyotlar halinde kaydederek grafiksel trendleri ve karbon ayak izini buradan izleyebilirsiniz.
            </p>
          </div>
          {canEdit ? (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Aylık Veri Girişini Yap</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 shadow-2xs">
              <Leaf className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Bu hesapta veri girişi yetkisi bulunmamaktadır (Yalnızca Görüntüleme Modu).</span>
            </div>
          )}
        </div>
      ) : (
        /* Grafikler Alanı */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Elektrik & Su Trend Grafiği */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Aylık Elektrik Tüketim Seyri (kWh)</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">kWh Bazında</span>
              </div>

              <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
                {scopedMetrics.map((m) => {
                  const heightPercent = Math.round((m.electricityKwh / maxElectricity) * 100);
                  return (
                    <div key={m.id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(m.electricityKwh / 1000).toFixed(1)}k
                      </span>
                      <div
                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                        className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all group-hover:from-amber-600 group-hover:to-amber-500 shadow-xs"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">
                        {m.period}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geri Dönüşüm Kategorileri Dağılımı */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Recycle className="w-4 h-4 text-emerald-600" />
                  <span>Son Ay Atık Ayrıştırma Envanteri (kg)</span>
                </h3>
                {latest && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Dönem: {latest.period}
                  </span>
                )}
              </div>

              {latest && (
                <div className="space-y-3 pt-2">
                  {[
                    { label: 'Kağıt & Karton', val: latest.recyclingPaperKg, color: '#3b82f6' },
                    { label: 'Organik Atık & Kompost', val: latest.compostOrganicKg, color: '#10b981' },
                    { label: 'Plastik Ambalaj', val: latest.recyclingPlasticKg, color: '#f59e0b' },
                    { label: 'Cam Şişe / Kavanoz', val: latest.recyclingGlassKg, color: '#06b6d4' },
                    { label: 'Elektronik & Özel Atık', val: latest.specialEwasteKg, color: '#8b5cf6' },
                    { label: 'Metal Kutu', val: latest.recyclingMetalKg, color: '#64748b' },
                  ].map((item, idx) => {
                    const totalMonth = latest.recyclingPaperKg + latest.compostOrganicKg + latest.recyclingPlasticKg + latest.recyclingGlassKg + latest.specialEwasteKg + latest.recyclingMetalKg;
                    const pct = totalMonth > 0 ? Math.round((item.val / totalMonth) * 100) : 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>{item.label}</span>
                          <span>{item.val} kg (%{pct})</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dönemsel Kayıt Geçmişi Tablosu */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card-soft overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-700" />
                <span>Kayıtlı Dönemler ve Tüketim Tablosu</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {scopedMetrics.length} Dönem {scopeMode === 'year' && activeAcademicYear ? 'Seçili Yılda' : 'Kayıtlı'}
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Dönem</th>
                    <th className="p-3">Elektrik (kWh)</th>
                    <th className="p-3">Su (m³)</th>
                    <th className="p-3">Kağıt (Koli)</th>
                    <th className="p-3">Geri Dönüşüm (kg)</th>
                    <th className="p-3">Kompost (kg)</th>
                    <th className="p-3">Not</th>
                    <th className="p-3">Kayıt / Güncelleme</th>
                    {canEdit && <th className="p-3 text-right">İşlem</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scopedMetrics.map((m) => {
                    const mRecycled = m.recyclingPaperKg + m.recyclingPlasticKg + m.recyclingGlassKg + m.recyclingMetalKg + m.compostOrganicKg + m.specialEwasteKg;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{m.period}</td>
                        <td className="p-3">{m.electricityKwh.toLocaleString('tr-TR')}</td>
                        <td className="p-3">{m.waterM3.toLocaleString('tr-TR')}</td>
                        <td className="p-3">{m.paperReams}</td>
                        <td className="p-3 font-semibold text-emerald-800">{mRecycled.toLocaleString('tr-TR')}</td>
                        <td className="p-3">{m.compostOrganicKg.toLocaleString('tr-TR')}</td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{m.notes || '—'}</td>
                        <td className="p-3">
                          <div className="flex flex-col text-[11px] leading-tight">
                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                              <UserCheck className="w-3 h-3 text-teal-600 shrink-0" />
                              <span className="truncate max-w-[130px]">{m.createdByName || (m.createdAt ? 'Yetkili' : 'Sistem')}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {m.createdAt ? new Date(m.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </span>
                            {m.updatedByName && (
                              <span className="text-[9.5px] text-teal-700 font-medium mt-0.5 flex items-center gap-0.5" title={`Son güncelleme: ${m.updatedAt ? new Date(m.updatedAt).toLocaleString('tr-TR') : ''}`}>
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[120px]">Düzenleyen: {m.updatedByName}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        {canEdit && (
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(m)}
                                className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer"
                                title="Dönem Verilerini Düzenle"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingMetric(m)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Dönem Verisini Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Veri Giriş Modalı */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-sm">{editingMetric ? `${editingMetric.period} Dönemi Tüketim & Atık Verisini Düzenle` : 'Aylık Kampüs Tüketim & Atık Girişi'}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Dönem (Yıl ve Ay) *</label>
                <input
                  type="month"
                  required
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Elektrik (kWh) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={electricityKwh === 0 ? '' : electricityKwh}
                    onChange={(e) => setElectricityKwh(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Su (m³) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={waterM3 === 0 ? '' : waterM3}
                    onChange={(e) => setWaterM3(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Kağıt (Koli/Top)</label>
                  <input
                    type="number"
                    min="0"
                    value={paperReams === 0 ? '' : paperReams}
                    onChange={(e) => setPaperReams(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="font-bold text-slate-800 uppercase tracking-wider">Ayrıştırılan Geri Dönüşüm (kg)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Kağıt/Karton (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={recyclingPaperKg === 0 ? '' : recyclingPaperKg}
                      onChange={(e) => setRecyclingPaperKg(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Plastik (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={recyclingPlasticKg === 0 ? '' : recyclingPlasticKg}
                      onChange={(e) => setRecyclingPlasticKg(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Organik Kompost (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={compostOrganicKg === 0 ? '' : compostOrganicKg}
                      onChange={(e) => setCompostOrganicKg(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Cam (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={recyclingGlassKg === 0 ? '' : recyclingGlassKg}
                      onChange={(e) => setRecyclingGlassKg(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Metal (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={recyclingMetalKg === 0 ? '' : recyclingMetalKg}
                      onChange={(e) => setRecyclingMetalKg(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">E-Atık &amp; Pil (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={specialEwasteKg === 0 ? '' : specialEwasteKg}
                      onChange={(e) => setSpecialEwasteKg(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Dönem Notu / Açıklama</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Isıtma sezonu başlangıcı veya tasarruf uygulamaları notu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingMetric ? 'Değişiklikleri Güncelle' : 'Veriyi Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tüm Metrikleri Temizleme Onay Modalı */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Kampüs Metriklerini Temizle
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Tüm kayıtlı elektrik, su, kağıt ve geri dönüşüm verileri hem yerel bellekten hem de buluttan kalıcı olarak silinecektir. Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearMetrics?.();
                  setConfirmClearOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
              >
                Evet, Tümünü Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tekil Dönem Silme Onay Modalı */}
      {deletingMetric && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingMetric(null);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Dönem Tüketim Verisini Sil
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  <strong className="text-slate-900">{deletingMetric.period}</strong> dönemine ait sayaç, tüketim ve atık kayıtları kalıcı olarak silinecektir.
                </p>
                <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  Bu işlem geri alınamaz. Karbon ayak izi ve okul tüketim grafikleri anlık olarak güncellenecektir.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingMetric(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteMetric && deletingMetric) {
                    onDeleteMetric(deletingMetric.id);
                  }
                  setDeletingMetric(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
