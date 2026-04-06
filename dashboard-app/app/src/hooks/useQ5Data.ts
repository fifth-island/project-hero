import { useState, useEffect } from 'react'

const BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  return res.json()
}

/* ── KPI ── */
export interface Q5Kpi {
  hottest_site: string
  hottest_site_wbgt: number
  coolest_site: string
  coolest_site_wbgt: number
  inter_site_range: number
  cohens_d: number
  max_wbgt: number
  dual_exposure_pct: number
  pct_above_74_hottest: number
  n_hot_days: number
  hot_dates: string[]
}

/* ── Hot Day Summary ── */
export interface HotDayRow {
  date: string
  wbgt_mean: number
  wbgt_max: number
  temp_mean: number
  humidity: number
  heat_index_max?: number
  n_sites: number
}

/* ── Diurnal (hour + one key per site_id) ── */
export interface DiurnalRow {
  hour: number
  [siteId: string]: number
}

/* ── Site×Hour Heatmap ── */
export interface HeatmapCell {
  site_id: string
  site_label: string
  hour: number
  value: number
  is_peak: boolean
}

/* ── Vulnerability ── */
export interface VulnerabilityRow {
  site_id: string
  site_label: string
  mean_wbgt: number
  pct_above_74: number
  night_wbgt: number
  rise_rate: number
  rise_total: number
  score: number
  category: string
}

/* ── Heating Rate ── */
export interface HeatingRow {
  site_id: string
  site_label: string
  rise: number
  peak_hour: number
  rate: number
}

/* ── Rank Comparison ── */
export interface RankRow {
  site_id: string
  site_label: string
  temp: number
  temp_rank: number
  wbgt: number
  wbgt_rank: number
  humidity: number
  rank_shift: number
}

/* ── Nighttime Retention ── */
export interface RetentionRow {
  site_id: string
  site_label: string
  hot_night: number
  normal_night: number
  retention: number
}

/* ── Threshold Exceedance ── */
export interface ThresholdRow {
  site_id: string
  site_label: string
  pct_70: number
  pct_72: number
  pct_74: number
  pct_75: number
}

/* ── Dual Exposure ── */
export interface DualExposureRow {
  site_id: string
  site_label: string
  dual_records: number
  total_records: number
  pct: number
}

export function useQ5Data() {
  const [kpi, setKpi] = useState<Q5Kpi | null>(null)
  const [hotDaySummary, setHotDaySummary] = useState<HotDayRow[]>([])
  const [diurnal, setDiurnal] = useState<DiurnalRow[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([])
  const [vulnerability, setVulnerability] = useState<VulnerabilityRow[]>([])
  const [heatingRates, setHeatingRates] = useState<HeatingRow[]>([])
  const [rankComparison, setRankComparison] = useState<RankRow[]>([])
  const [retention, setRetention] = useState<RetentionRow[]>([])
  const [thresholdExceedance, setThresholdExceedance] = useState<ThresholdRow[]>([])
  const [dualExposure, setDualExposure] = useState<DualExposureRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<Q5Kpi>('q5_kpi.json').then(setKpi),
      fetchJson<HotDayRow[]>('q5_hot_day_summary.json').then(setHotDaySummary),
      fetchJson<DiurnalRow[]>('q5_diurnal.json').then(setDiurnal),
      fetchJson<HeatmapCell[]>('q5_site_hour_heatmap.json').then(setHeatmap),
      fetchJson<VulnerabilityRow[]>('q5_vulnerability.json').then(setVulnerability),
      fetchJson<HeatingRow[]>('q5_heating_rates.json').then(setHeatingRates),
      fetchJson<RankRow[]>('q5_rank_comparison.json').then(setRankComparison),
      fetchJson<RetentionRow[]>('q5_nighttime_retention.json').then(setRetention),
      fetchJson<ThresholdRow[]>('q5_threshold_exceedance.json').then(setThresholdExceedance),
      fetchJson<DualExposureRow[]>('q5_dual_exposure.json').then(setDualExposure),
    ]).finally(() => setLoading(false))
  }, [])

  return {
    kpi, hotDaySummary, diurnal, heatmap, vulnerability,
    heatingRates, rankComparison, retention, thresholdExceedance,
    dualExposure, loading,
  }
}
