import { useState, useEffect } from 'react'

const BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  return res.json()
}

/* ── Deep KPIs ── */
export interface Q5DeepKpi {
  cohens_d: number
  kruskal_h: number
  significant_pairs: number
  total_pairs: number
  hw_iso_diff: number
  hi_wbgt_gap: number
  hi_wbgt_corr: number
  max_heat_index: number
  humidity_range: number
}

/* ── Distributions (box plot) ── */
export interface DistributionRow {
  site_id: string
  site_label: string
  mean: number
  median: number
  q1: number
  q3: number
  min: number
  max: number
  iqr: number
  std: number
  n: number
}

/* ── Statistical Tests ── */
export interface PairwiseRow {
  site_1: string
  site_1_id: string
  site_2: string
  site_2_id: string
  u_stat: number
  p_value: number
  p_display: string
  significant: boolean
  mean_diff: number
}

export interface StatTests {
  kruskal_wallis_h: number
  kruskal_wallis_p: number
  kruskal_wallis_p_display: string
  n_pairs: number
  bonferroni_alpha: number
  n_significant: number
  pairwise: PairwiseRow[]
}

/* ── Ranking Consistency ── */
export interface RankingRow {
  site_id: string
  site_label: string
  mean_rank: number
  std_rank: number
  best_rank: number
  worst_rank: number
  ranks_by_day: Record<string, number>
  n_days: number
}

/* ── Heat Wave vs Isolated ── */
export interface HwIsoEvent {
  dates: string[]
  mean_wbgt: number
  max_wbgt: number
  inter_site_range: number
  mean_humidity: number
  n_records: number
}

export interface HwVsIso {
  heatwave: HwIsoEvent
  isolated: HwIsoEvent
  test_p: number
  test_p_display: string
}

export interface HwIsoSiteRow {
  site_id: string
  site_label: string
  hw_mean: number | null
  iso_mean: number | null
  difference: number | null
}

/* ── Day × Site Heatmap ── */
export interface DaySiteCell {
  date: string
  site_id: string
  site_label: string
  mean_wbgt: number
  n_records: number
}

/* ── Heat Index vs WBGT ── */
export interface HiWbgtSummary {
  correlation: number
  mean_gap: number
  median_gap: number
  max_gap: number
  pct_hi_above_100: number
  n_hi_above_100: number
}

export interface HiWbgtScatter {
  site_id: string
  site_label: string
  wbgt: number
  heat_index: number
  hour: number
}

export interface HiWbgtHourly {
  hour: number
  wbgt: number
  heat_index: number
  gap: number
}

/* ── Humidity Decomposition ── */
export interface HumidityRow {
  site_id: string
  site_label: string
  temp: number
  humidity: number
  wbgt: number
}

export function useQ5DeepData() {
  const [kpi, setKpi] = useState<Q5DeepKpi | null>(null)
  const [distributions, setDistributions] = useState<DistributionRow[]>([])
  const [statTests, setStatTests] = useState<StatTests | null>(null)
  const [rankings, setRankings] = useState<RankingRow[]>([])
  const [hwVsIso, setHwVsIso] = useState<HwVsIso | null>(null)
  const [hwIsoSites, setHwIsoSites] = useState<HwIsoSiteRow[]>([])
  const [daySite, setDaySite] = useState<DaySiteCell[]>([])
  const [hiSummary, setHiSummary] = useState<HiWbgtSummary | null>(null)
  const [hiScatter, setHiScatter] = useState<HiWbgtScatter[]>([])
  const [hiHourly, setHiHourly] = useState<HiWbgtHourly[]>([])
  const [humidity, setHumidity] = useState<HumidityRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<Q5DeepKpi>('q5d_deep_kpi.json'),
      fetchJson<DistributionRow[]>('q5d_distributions.json'),
      fetchJson<StatTests>('q5d_stat_tests.json'),
      fetchJson<RankingRow[]>('q5d_ranking_consistency.json'),
      fetchJson<HwVsIso>('q5d_heatwave_vs_isolated.json'),
      fetchJson<HwIsoSiteRow[]>('q5d_hw_iso_by_site.json'),
      fetchJson<DaySiteCell[]>('q5d_day_site_heatmap.json'),
      fetchJson<HiWbgtSummary>('q5d_hi_wbgt_summary.json'),
      fetchJson<HiWbgtScatter[]>('q5d_hi_wbgt_scatter.json'),
      fetchJson<HiWbgtHourly[]>('q5d_hi_wbgt_hourly.json'),
      fetchJson<HumidityRow[]>('q5d_humidity_decomposition.json'),
    ]).then(([k, d, st, r, hw, hws, ds, hs, hsc, hh, hum]) => {
      setKpi(k); setDistributions(d); setStatTests(st); setRankings(r)
      setHwVsIso(hw); setHwIsoSites(hws); setDaySite(ds)
      setHiSummary(hs); setHiScatter(hsc); setHiHourly(hh); setHumidity(hum)
      setLoading(false)
    })
  }, [])

  return {
    kpi, distributions, statTests, rankings, hwVsIso, hwIsoSites,
    daySite, hiSummary, hiScatter, hiHourly, humidity, loading,
  }
}
