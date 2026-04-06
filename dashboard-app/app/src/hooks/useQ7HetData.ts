import { useEffect, useState } from 'react'

export interface Q7HKpi {
  n_sites: number
  mean_r: number
  std_r: number
  cv_r: number
  range_r: [number, number]
  fold_diff: number
  mean_slope: number
  slope_range: [number, number]
  strongest_site: string
  strongest_r: number
  weakest_site: string
  weakest_r: number
  n_above_avg: number
  n_below_avg: number
}

export interface SiteDistBox {
  site_id: string
  site_label: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
  iqr?: number
  n: number
}

export interface BinnedRow {
  site_id: string
  site_label: string
  wbgt_bin: number
  wbgt_lo: number
  wbgt_hi: number
  pm25_mean: number
  pm25_median: number
  pm25_p25: number
  pm25_p75: number
  n: number
}

export interface SensitivityRow {
  site_id: string
  site_label: string
  r: number
  rho: number
  r_squared: number
  slope: number
  slope_ci_lo: number
  slope_ci_hi: number
  intercept: number
  std_err: number
  residual_std: number
  n: number
  pm25_mean: number
  wbgt_mean: number
}

export interface TrajectoryPt {
  site_id: string
  site_label: string
  hour: number
  wbgt_mean: number
  pm25_mean: number
}

export interface SiteScatterPt {
  wbgt: number
  pm25: number
  site_id: string
}

export interface SiteLineHet {
  site_id: string
  site_label: string
  x1: number; y1: number
  x2: number; y2: number
  slope: number
  r: number
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  return res.json()
}

export function useQ7HetData() {
  const [kpi, setKpi] = useState<Q7HKpi | null>(null)
  const [pm25Dist, setPm25Dist] = useState<SiteDistBox[]>([])
  const [wbgtDist, setWbgtDist] = useState<SiteDistBox[]>([])
  const [binned, setBinned] = useState<BinnedRow[]>([])
  const [sensitivity, setSensitivity] = useState<SensitivityRow[]>([])
  const [trajectories, setTrajectories] = useState<TrajectoryPt[]>([])
  const [siteScatter, setSiteScatter] = useState<SiteScatterPt[]>([])
  const [siteLines, setSiteLines] = useState<SiteLineHet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJSON<Q7HKpi>('/data/q7h_kpi.json'),
      fetchJSON<SiteDistBox[]>('/data/q7h_pm25_dist.json'),
      fetchJSON<SiteDistBox[]>('/data/q7h_wbgt_dist.json'),
      fetchJSON<BinnedRow[]>('/data/q7h_binned.json'),
      fetchJSON<SensitivityRow[]>('/data/q7h_sensitivity.json'),
      fetchJSON<TrajectoryPt[]>('/data/q7h_trajectories.json'),
      fetchJSON<SiteScatterPt[]>('/data/q7h_site_scatter.json'),
      fetchJSON<SiteLineHet[]>('/data/q7h_site_lines.json'),
    ]).then(([k, p, w, b, s, t, sc, sl]) => {
      setKpi(k); setPm25Dist(p); setWbgtDist(w); setBinned(b)
      setSensitivity(s); setTrajectories(t); setSiteScatter(sc); setSiteLines(sl)
      setLoading(false)
    })
  }, [])

  return { kpi, pm25Dist, wbgtDist, binned, sensitivity, trajectories, siteScatter, siteLines, loading }
}
