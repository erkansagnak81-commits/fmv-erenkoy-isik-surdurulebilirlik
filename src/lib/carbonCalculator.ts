import { CampusMetric } from '../types';

/**
 * Karbon & Çevresel Etki Hesaplama Sabitleri
 * - Elektrik: Türkiye şebeke ortalaması yaklaşık 0.44 kg CO2e / kWh
 * - Su: Şebeke arıtma ve dağıtım ortalaması 0.30 kg CO2e / m³
 * - Kağıt: 1 ton geri dönüştürülmüş kağıt ~ 17 yetişkin ağaç kurtarır
 * - 1 Top (Koli/Paket) A4 fotokopi kağıdı ~ 2.5 kg
 * - Sıfır Atık: Düzenli depolama yerine geri kazandırılan 1 kg atık ~ 1.5 kg CO2e önler
 */
export const CARBON_CONSTANTS = {
  ELECTRICITY_FACTOR_KG_PER_KWH: 0.44,
  WATER_FACTOR_KG_PER_M3: 0.30,
  TREES_SAVED_PER_TON_PAPER: 17,
  KG_PER_PAPER_REAM: 2.5,
  AVOIDED_CO2_KG_PER_KG_RECYCLED: 1.5,
  DEFAULT_CAMPUS_STUDENTS: 850, // FMV Erenköy Işık Lisesi ve Fen Lisesi mevcudu
};

export interface CarbonAnalysisResult {
  totalElectricityKwh: number;
  totalWaterM3: number;
  totalPaperReams: number;
  totalRecycledKg: number;
  totalCompostKg: number;
  
  electricityEmissionsTons: number;
  waterEmissionsTons: number;
  grossEmissionsTons: number;
  avoidedEmissionsTons: number;
  netEmissionsTons: number;
  
  treesSavedCount: number;
  perStudentMonthlyElectricityKwh: number;
  perStudentDailyWaterLiters: number;
  
  recordedMonthsCount: number;
}

export function calculateCarbonAnalysis(
  metrics: CampusMetric[],
  studentCount = CARBON_CONSTANTS.DEFAULT_CAMPUS_STUDENTS
): CarbonAnalysisResult {
  const uniqueMonths = new Set(metrics.map(m => m.period)).size;
  const monthsCount = Math.max(uniqueMonths, 1);

  const totalElectricityKwh = metrics.reduce((sum, m) => sum + (m.electricityKwh || 0), 0);
  const totalWaterM3 = metrics.reduce((sum, m) => sum + (m.waterM3 || 0), 0);
  const totalPaperReams = metrics.reduce((sum, m) => sum + (m.paperReams || 0), 0);
  
  const totalPaperRecycledKg = metrics.reduce((sum, m) => sum + (m.recyclingPaperKg || 0), 0);
  const totalCompostKg = metrics.reduce((sum, m) => sum + (m.compostOrganicKg || 0), 0);
  const totalRecycledKg = metrics.reduce((sum, m) => 
    sum + (m.recyclingPaperKg || 0) + (m.recyclingPlasticKg || 0) + (m.recyclingGlassKg || 0) +
    (m.recyclingMetalKg || 0) + (m.compostOrganicKg || 0) + (m.specialEwasteKg || 0), 0
  );

  // Brüt Emisyonlar (Ton CO2e)
  const electricityEmissionsTons = (totalElectricityKwh * CARBON_CONSTANTS.ELECTRICITY_FACTOR_KG_PER_KWH) / 1000;
  const waterEmissionsTons = (totalWaterM3 * CARBON_CONSTANTS.WATER_FACTOR_KG_PER_M3) / 1000;
  const grossEmissionsTons = electricityEmissionsTons + waterEmissionsTons;

  // Geri dönüşümle önlenen emisyon (Ton CO2e)
  const avoidedEmissionsTons = (totalRecycledKg * CARBON_CONSTANTS.AVOIDED_CO2_KG_PER_KG_RECYCLED) / 1000;
  const netEmissionsTons = Math.max(0, grossEmissionsTons - avoidedEmissionsTons);

  // Kurtarılan ağaç sayısı (Geri dönüştürülen kağıt kg bazında)
  const treesSavedCount = Math.round((totalPaperRecycledKg / 1000) * CARBON_CONSTANTS.TREES_SAVED_PER_TON_PAPER);

  // Öğrenci başına birim tüketimler
  const perStudentMonthlyElectricityKwh = Math.round(totalElectricityKwh / (monthsCount * studentCount));
  // Günlük su: m3 -> Litre / (ay * 30 gün * öğrenci)
  const perStudentDailyWaterLiters = Number(((totalWaterM3 * 1000) / (monthsCount * 30 * studentCount)).toFixed(1));

  return {
    totalElectricityKwh,
    totalWaterM3,
    totalPaperReams,
    totalRecycledKg,
    totalCompostKg,
    electricityEmissionsTons: Number(electricityEmissionsTons.toFixed(2)),
    waterEmissionsTons: Number(waterEmissionsTons.toFixed(2)),
    grossEmissionsTons: Number(grossEmissionsTons.toFixed(2)),
    avoidedEmissionsTons: Number(avoidedEmissionsTons.toFixed(2)),
    netEmissionsTons: Number(netEmissionsTons.toFixed(2)),
    treesSavedCount,
    perStudentMonthlyElectricityKwh,
    perStudentDailyWaterLiters,
    recordedMonthsCount: uniqueMonths,
  };
}
