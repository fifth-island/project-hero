import { useEffect, useState } from 'react'

/* ── KPI ── */
export interface Q7Kpi {
  pearson_r: number
  spearman_rho: number
  r_squared: number
  slope: number
  intercept: number
  std_err: number
  n_obs: number
  pm25_mean: number
  pm25_median: number
  wbgt_mean: number
  wbgt_range: [number, number]
  strongest_site: string
  strongest_r: number
  weakest_site: string
  weakest_r: number
  corr_cv: number
}

/* ── Scatter point ── */
export interface ScatterPoint {
  wbgt: number
  pm25: number
  site_id: string
  site_label: string
  hour: number
}

/* ── Regression line endpoint ── */
export interface RegressionPt {
  wbgt: number
  pm25: number
}

/* ── Density cell ── */
export interface DensityCell {
  wbgt: number
  pm25: number
  count: number
}

/* ── Site stats ── */
export interface SiteStat {
  site_id: string
  site_label: string
  correlation: number
  r_squared: number
  slope: number
  intercept: number
  n: number
  pm25_mean: number
  wbgt_mean: number
}

/* ── Hourly aggregation ── */
export interface HourlyRow {
  hour: number
  pm25_mean: number
  wbgt_mean: number
  pm25_p25: number
  pm25_p75: number
  wbgt_p25: number
  wbgt_p75: number
  n: number
}

/* ── Site scatter point ── */
export interface SiteScatterPt {
  wbgt: number
  pm25: number
  site_id: string
}

/* ── Site regression line ── */
export interface SiteLine {
  site_id: string
  site_label: string
  x1: number; y1: number
  x2: number; y2: number
  slope: number
}

async function fetchJson<T>(file: string): Promise<T> {
  const r = await fetch(`/data/${file}`)
  return r.json()
}

export function useQ7Data() {
  const [kpi, setKpi] = useState<Q7Kpi | null>(null)
  const [scatter, setScatter] = useState<ScatterPoint[]>([])
  const [regressionLine, setRegressionLine] = useState<RegressionPt[]>([])
  const [density, setDensity] = useState<DensityCell[]>([])
  const [siteStats, setSiteStats] = useState<SiteStat[]>([])
  const [hourly, setHourly] = useState<HourlyRow[]>([])
  const [siteScatter, setSiteScatter] = useState<SiteScatterPt[]>([])
  const [siteLines, setSiteLines] = useState<SiteLine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<Q7Kpi>('q7_kpi.json'),
      fetchJson<ScatterPoint[]>('q7_scatter.json'),
      fetchJson<RegressionPt[]>('q7_regression_line.json'),
      fetchJson<DensityCell[]>('q7_density.json'),
      fetchJson<SiteStat[]>('q7_site_stats.json'),
      fetchJson<HourlyRow[]>('q7_hourly.json'),
      fetchJson<SiteScatterPt[]>('q7_site_scatter.json'),
      fetchJson<SiteLine[]>('q7_site_lines.json'),
    ]).then(([k, sc, rl, d, ss, h, ssc, sl]) => {
      setKpi(k); setScatter(sc); setRegressionLine(rl); setDensity(d)
      setSiteStats(ss); setHourly(h); setSiteScatter(ssc); setSiteLines(sl)
      setLoading(false)
    })
  }, [])

  return { kpi, scatter, regressionLine, density, siteStats, hourly, siteScatter, siteLines, loading }
}
