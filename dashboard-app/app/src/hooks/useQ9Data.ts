import { useEffect, useState } from 'react'

export interface Q9Kpi {
  n_sites: number
  n_obs: number
  n_lu_vars: number
  best_pm25_predictor: string
  best_pm25_r: number
  best_pm25_r2: number
  best_pm25_p: number
  neg_pm25_predictor: string
  neg_pm25_r: number
  best_wbgt_predictor: string
  best_wbgt_r: number
  best_wbgt_p: number
  sig_pm25_count: number
  sig_wbgt_count: number
}

export interface SiteProfile {
  site_id: string
  site_label: string
  pm25_mean: number
  wbgt_mean: number
  n: number
  [key: string]: string | number
}

export interface ScatterPt {
  lu_var: string
  lu_val?: number
  pm25?: number
  wbgt?: number
  site_id?: string
  site_label?: string
  _type?: string
  x1?: number; y1?: number
  x2?: number; y2?: number
  r?: number; p?: number
}

export interface CorrRow {
  lu_var: string
  r_pm25: number
  p_pm25: number
  sig_pm25: boolean
  r_wbgt: number
  p_wbgt: number
  sig_wbgt: boolean
}

export interface HeatmapCell {
  x: string
  y: string
  r: number
  p: number
  sig: boolean
}

export interface RegRow {
  lu_var: string
  beta_pm25: number
  se_pm25: number
  p_pm25: number
  beta_wbgt: number
  se_wbgt: number
  p_wbgt: number
}

export interface PcaSite {
  site_id: string
  site_label: string
  pc1: number
  pc2: number
  pc3: number
  pm25_mean: number
  wbgt_mean: number
}

export interface PcaLoading {
  lu_var: string
  pc1: number
  pc2: number
}

export interface PcaInfo {
  explained: number[]
  cumulative: number
}

export interface ClusterSite {
  site_id: string
  site_label: string
  cluster: number
  pm25_mean: number
  wbgt_mean: number
  pc1: number
  pc2: number
}

export interface ClusterSummary {
  cluster: number
  n_sites: number
  sites: string[]
  pm25_mean: number
  wbgt_mean: number
  [key: string]: string | number | string[]
}

export interface ClustersData {
  best_k: number
  silhouette_scores: { k: number; silhouette: number }[]
  sites: ClusterSite[]
  summary: ClusterSummary[]
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  return res.json()
}

export function useQ9Data() {
  const [kpi, setKpi] = useState<Q9Kpi | null>(null)
  const [profiles, setProfiles] = useState<SiteProfile[]>([])
  const [scatterPm25, setScatterPm25] = useState<ScatterPt[]>([])
  const [scatterWbgt, setScatterWbgt] = useState<ScatterPt[]>([])
  const [corrSummary, setCorrSummary] = useState<CorrRow[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([])
  const [regression, setRegression] = useState<RegRow[]>([])
  const [pcaSites, setPcaSites] = useState<PcaSite[]>([])
  const [pcaLoadings, setPcaLoadings] = useState<PcaLoading[]>([])
  const [pcaInfo, setPcaInfo] = useState<PcaInfo | null>(null)
  const [clusters, setClusters] = useState<ClustersData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJSON<Q9Kpi>('/data/q9_kpi.json'),
      fetchJSON<SiteProfile[]>('/data/q9_profiles.json'),
      fetchJSON<ScatterPt[]>('/data/q9_scatter_pm25.json'),
      fetchJSON<ScatterPt[]>('/data/q9_scatter_wbgt.json'),
      fetchJSON<CorrRow[]>('/data/q9_corr_summary.json'),
      fetchJSON<HeatmapCell[]>('/data/q9_heatmap.json'),
      fetchJSON<RegRow[]>('/data/q9_regression.json'),
      fetchJSON<PcaSite[]>('/data/q9_pca_sites.json'),
      fetchJSON<PcaLoading[]>('/data/q9_pca_loadings.json'),
      fetchJSON<PcaInfo>('/data/q9_pca_info.json'),
      fetchJSON<ClustersData>('/data/q9_clusters.json'),
    ]).then(([k, pr, sp, sw, cs, hm, rg, ps, pl, pi, cl]) => {
      setKpi(k); setProfiles(pr); setScatterPm25(sp); setScatterWbgt(sw)
      setCorrSummary(cs); setHeatmap(hm); setRegression(rg)
      setPcaSites(ps); setPcaLoadings(pl); setPcaInfo(pi); setClusters(cl)
      setLoading(false)
    })
  }, [])

  return {
    kpi, profiles, scatterPm25, scatterWbgt, corrSummary, heatmap, regression,
    pcaSites, pcaLoadings, pcaInfo, clusters, loading,
  }
}
