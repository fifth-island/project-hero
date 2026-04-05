import { useState, useEffect } from 'react'

const BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  return res.json()
}

/* ── KPI ── */
export interface ClusteringKpi {
  n_sites: number
  n_clusters: number
  silhouette: number
  pca_variance: number
  pm25_boundary: number
  temp_boundary: number
  pm25_avg: number
  temp_avg: number
}

/* ── Site data point ── */
export interface SitePoint {
  site_id: string
  site_name: string
  pm25: number
  temp: number
  wbgt: number
  humidity: number
  pm25_std: number
  n_obs: number
  cluster: number
  cluster_name: string
  cluster_color: string
  cluster_emoji: string
  silhouette: number
  pca1: number
  pca2: number
  lat: number
  lon: number
  photo: string
}

/* ── Cluster center ── */
export interface ClusterCenter {
  cluster: number
  cluster_name: string
  cluster_color: string
  cluster_emoji: string
  pm25: number
  temp: number
  wbgt: number
  humidity: number
  pm25_norm: number
  temp_norm: number
  wbgt_norm: number
  humidity_norm: number
  pca1: number
  pca2: number
  n_sites: number
  sites: string[]
}

/* ── Elbow point ── */
export interface ElbowPoint {
  k: number
  inertia: number
  silhouette: number
}

/* ── Silhouette bar ── */
export interface SilhouetteBar {
  site_name: string
  cluster: number
  cluster_name: string
  cluster_color: string
  silhouette: number
}

/* ── PCA metadata ── */
export interface PcaMeta {
  pc1_variance: number
  pc2_variance: number
  total_variance: number
  loadings: Record<string, { pc1: number; pc2: number }>
}

export function useClusteringData() {
  const [kpi, setKpi] = useState<ClusteringKpi | null>(null)
  const [sites, setSites] = useState<SitePoint[]>([])
  const [centers, setCenters] = useState<ClusterCenter[]>([])
  const [elbow, setElbow] = useState<ElbowPoint[]>([])
  const [silhouetteData, setSilhouetteData] = useState<SilhouetteBar[]>([])
  const [pcaMeta, setPcaMeta] = useState<PcaMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<ClusteringKpi>('clustering_kpi.json'),
      fetchJson<SitePoint[]>('clustering_sites.json'),
      fetchJson<ClusterCenter[]>('clustering_centers.json'),
      fetchJson<ElbowPoint[]>('clustering_elbow.json'),
      fetchJson<SilhouetteBar[]>('clustering_silhouette.json'),
      fetchJson<PcaMeta>('clustering_pca.json'),
    ]).then(([kp, st, ct, el, sl, pc]) => {
      setKpi(kp)
      setSites(st)
      setCenters(ct)
      setElbow(el)
      setSilhouetteData(sl)
      setPcaMeta(pc)
      setLoading(false)
    })
  }, [])

  return { kpi, sites, centers, elbow, silhouetteData, pcaMeta, loading }
}
