import React, { useState } from 'react';
import { CampusMetric, UserProfile } from '../../types';
import { 
  BarChart3, 
  Plus, 
  Zap, 
  Droplets, 
  FileText, 
  Recycle, 
  Sparkles, 
  Leaf, 
  TrendingDown, 
  X,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CampusMetricsViewProps {
  metrics: CampusMetric[];
  onAddMetric: (metric: Omit<CampusMetric, 'id'>) => void;
  currentUser: UserProfile;
}

export const CampusMetricsView: React.FC<CampusMetricsViewProps> = ({
  metrics,
  onAddMetric,
  currentUser,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [electricityKwh, setElectricityKwh] = useState(11500);
  const [waterM3, setWaterM3] = useState(260);
  const [paperReams, setPaperReams] = useState(28);
  const [recyclingPaperKg, setRecyclingPaperKg] = useState(300);
  const [recyclingPlasticKg, setRecyclingPlasticKg] = useState(110);
  const [recyclingGlassKg, setRecyclingGlassKg] = useState(65);
  const [recyclingMetalKg, setRecyclingMetalKg] = useState(30);
  const [compostOrganicKg, setCompostOrganicKg] = useState(140);
  const [specialEwasteKg, setSpecialEwasteKg] = useState(25);
  const [notes, setNotes] = useState('');

  // Sıralı metrikler
  const sortedMetrics = [...metrics].sort((a, b) => a.period.localeCompare(b.period));
  const latest = sortedMetrics[sortedMetrics.length - 1];
  const previous = sortedMetrics[sortedMetrics.length - 2];

  // Toplamlar
  const totalRecycled = sortedMetrics.reduce((sum, m) => 
    sum + m.recyclingPaperKg + m.recyclingPlasticKg + m.recyclingGlassKg + m.recyclingMetalKg + m.compostOrganicKg + m.specialEwasteKg, 0
  );

  // Karbon salımı tahmini (Türkiye şebekesi ortalama ~0.44 kg CO2/kWh, su ~0.3 kg CO2/m3)
  const totalCarbonKg = latest 
    ? Math.round((latest.electricityKwh * 0.44) + (latest.waterM3 * 0.3))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch (_) {}

    onAddMetric({
      period,
      electricityKwh,
      waterM3,
      paperReams,
      recyclingPaperKg,
      recyclingPlasticKg,
      recyclingGlassKg,
      recyclingMetalKg,
      compostOrganicKg,
      specialEwasteKg,
      notes: notes || undefined,
    });

    setModalOpen(false);
  };

  // Basit grafik hesaplamaları
  const maxElectricity = Math.max(...sortedMetrics.map(m => m.electricityKwh), 1);
  const maxWater = Math.max(...sortedMetrics.map(m => m.waterM3), 1);

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
              Yeşil Kampüs Göstergeleri &amp; Kaynak Tüketimi
            </h2>
            <p className="text-xs text-slate-500">
              Okulun elektrik, su, kağıt tüketimi ve sıfır atık geri dönüşüm istatistikleri
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Aylık Tüketim / Atık Verisi Gir</span>
        </button>
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
            {latest?.electricityKwh.toLocaleString('tr-TR')} <span className="text-xs font-medium text-slate-500">kWh</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-2">
            Dönem: <strong>{latest?.period}</strong>
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
            {latest?.waterM3.toLocaleString('tr-TR')} <span className="text-xs font-medium text-slate-500">m³</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-2">
            Dönem: <strong>{latest?.period}</strong>
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
            {latest?.paperReams} <span className="text-xs font-medium text-slate-500">Koli / Top</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-2">
            Dönem: <strong>{latest?.period}</strong>
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
            {totalRecycled.toLocaleString('tr-TR')} <span className="text-xs font-medium text-slate-500">kg atık</span>
          </h3>
          <p className="text-[11px] text-emerald-700 font-semibold mt-2">
            Sıfır Atık Hedefine Katkı
          </p>
        </div>
      </div>

      {/* Grafikler Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Elektrik ve Su Trend Grafiği */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Aylık Elektrik Tüketim Trendi (kWh)</span>
          </h3>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
            {sortedMetrics.map((m) => {
              const heightPercent = Math.round((m.electricityKwh / maxElectricity) * 100);
              return (
                <div key={m.id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(m.electricityKwh / 1000).toFixed(1)}k
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all group-hover:from-amber-600 group-hover:to-amber-500 shadow-xs"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">
                    {m.period.split('-')[1]}. Ay
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geri Dönüşüm Kategorileri Dağılımı */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Recycle className="w-4 h-4 text-emerald-600" />
            <span>Son Ay Atık Ayrıştırma Envanteri (kg)</span>
          </h3>

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
                const pct = Math.round((item.val / totalMonth) * 100);

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

      {/* Yeni Veri Giriş Modalı */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-sm">Aylık Kampüs Tüketim &amp; Atık Girişi</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
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
                    value={electricityKwh}
                    onChange={(e) => setElectricityKwh(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Su (m³) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={waterM3}
                    onChange={(e) => setWaterM3(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Kağıt (Koli/Top)</label>
                  <input
                    type="number"
                    min="0"
                    value={paperReams}
                    onChange={(e) => setPaperReams(Number(e.target.value))}
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
                      value={recyclingPaperKg}
                      onChange={(e) => setRecyclingPaperKg(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Plastik (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={recyclingPlasticKg}
                      onChange={(e) => setRecyclingPlasticKg(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Organik Kompost (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={compostOrganicKg}
                      onChange={(e) => setCompostOrganicKg(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Cam (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={recyclingGlassKg}
                      onChange={(e) => setRecyclingGlassKg(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Metal (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={recyclingMetalKg}
                      onChange={(e) => setRecyclingMetalKg(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">E-Atık &amp; Pil (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={specialEwasteKg}
                      onChange={(e) => setSpecialEwasteKg(Number(e.target.value))}
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
                  placeholder="Örn: Sınav dönemi nedeniyle tüketim arttı."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
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
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Veriyi Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
