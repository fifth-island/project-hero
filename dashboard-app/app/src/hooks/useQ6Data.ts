import { useState, useEffect } from 'react'

const BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  return res.json()
}

/* ── KPI ── */
export interface Q6Kpi {
  peak_aqi: number
  peak_aqi_date: string
  spatial_range_high: number
  spatial_range_normal: number
  amplification: number
  most_affected_site: string
  most_affected_pm25: number
  cleanest_site: string
  cleanest_pm25: number
  elevation_pct: number
  high_dates: string[]
  n_high_days: number
  mean_pm25_high: number
  mean_pm25_normal: number
}

/* ── High Day Summary ── */
export interface HighDayRow {
  date: string
  aqi: number
  dominant: string
  mean_pm25: number
  max_pm25: number
  mean_temp: number
  mean_humidity: number | null
  mean_wind: number | null
  n_sites: number
}

/* ── Site Comparison ── */
export interface SiteCompRow {
  site_id: string
  site_label: string
  high_mean: number
  normal_mean: number
  elevation_pct: number
}

/* ── Heatmap ── */
export interface HeatmapCell {
  date: string
  site_id: string
  site_label: string
  pm25: number
  deviation: number
  n_records: number
}

/* ── Diurnal (hour + site keys) ── */
export interface DiurnalRow {
  hour: number
  [siteId: string]: number
}

/* ── Ranking Stability ── */
export interface RankRow {
  site_id: string
  site_label: string
  mean_rank: number
  std_rank: number
  best_rank: number
  worst_rank: number
  ranks_by_day: Record<string, number>
}

/* ── Met Context ── */
export interface MetContext {
  high_days: { temp: number; humidity: number; wind: number }
  normal_days: { temp: number; humidity: number; wind: number }
  wind_diff: number
  temp_diff: number
  humidity_diff: number
}

/* ── Timeline ── */
export interface TimelineRow {
  date: string
  aqi: number
  dominant: string
  is_high: boolean
  pm25_spread: number
  mean_pm25: number
  [siteId: string]: string | number | boolean | null
}

/* ── Per-day site ── */
export interface PerDaySiteRow {
  date: string
  site_id: string
  site_label: string
  pm25: number
}

export function useQ6Data() {
  const [kpi, setKpi] = useState<Q6Kpi | null>(null)
  const [highDays, setHighDays] = useState<HighDayRow[]>([])
  const [siteComparison, setSiteComparison] = useState<SiteCompRow[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([])
  const [diurnalPeak, setDiurnalPeak] = useState<DiurnalRow[]>([])
  const [diurnalTypical, setDiurnalTypical] = useState<DiurnalRow[]>([])
  const [rankings, setRankings] = useState<RankRow[]>([])
  const [metContext, setMetContext] = useState<MetContext | null>(null)
  const [timeline, setTimeline] = useState<TimelineRow[]>([])
  const [perdaySite, setPerdaySite] = useState<PerDaySiteRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<Q6Kpi>('q6_kpi.json'),
      fetchJson<HighDayRow[]>('q6_high_day_summary.json'),
      fetchJson<SiteCompRow[]>('q6_site_comparison.json'),
      fetchJson<HeatmapCell[]>('q6_site_day_heatmap.json'),
      fetchJson<DiurnalRow[]>('q6_diurnal_peak.json'),
      fetchJson<DiurnalRow[]>('q6_diurnal_typical.json'),
      fetchJson<RankRow[]>('q6_ranking_stability.json'),
      fetchJson<MetContext>('q6_met_context.json'),
      fetchJson<TimelineRow[]>('q6_aqi_timeline.json'),
      fetchJson<PerDaySiteRow[]>('q6_perday_site.json'),
    ]).then(([k, hd, sc, hm, dp, dt, r, mc, tl, ps]) => {
      setKpi(k); setHighDays(hd); setSiteComparison(sc); setHeatmap(hm)
      setDiurnalPeak(dp); setDiurnalTypical(dt); setRankings(r)
      setMetContext(mc); setTimeline(tl); setPerdaySite(ps)
      setLoading(false)
    })
  }, [])

  return {
    kpi, highDays, siteComparison, heatmap, diurnalPeak, diurnalTypical,
    rankings, metContext, timeline, perdaySite, loading,
  }
}
