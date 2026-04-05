import { useState, useEffect } from 'react'

const BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  return res.json()
}

export interface ScatterPoint { pa: number; dep: number; site: string }
export interface ScatterData { points: ScatterPoint[]; regression: { slope: number; intercept: number; r2: number; n: number } }

export interface BAPoint { mean: number; diff: number; site: string }
export interface BAData { points: BAPoint[]; stats: { mean_bias: number; loa_upper: number; loa_lower: number; loa_width: number } }

export interface SiteRow { site_id: string; name: string; slope: number; intercept: number; r_squared: number; rmse: number; bias: number; n: number }

export interface ConcBias { bin: string; bias: number; n: number }
export interface DiurnalBias { hour: number; bias: number }
export interface RollingPoint { date: string; r: number; rmse: number }
export interface HeatmapCell { temp: string; humidity: string; bias: number | null; n: number }
export interface AssetCard { id: string; site_id: string; name: string; r_squared: number; bias: number; rmse: number; n: number; health: number }

export function useQ1Data() {
  const [scatter, setScatter] = useState<ScatterData | null>(null)
  const [blandAltman, setBlandAltman] = useState<BAData | null>(null)
  const [siteTable, setSiteTable] = useState<SiteRow[]>([])
  const [concBias, setConcBias] = useState<ConcBias[]>([])
  const [diurnal, setDiurnal] = useState<DiurnalBias[]>([])
  const [rolling, setRolling] = useState<RollingPoint[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([])
  const [assets, setAssets] = useState<AssetCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<ScatterData>('q1_scatter.json'),
      fetchJson<BAData>('q1_bland_altman.json'),
      fetchJson<SiteRow[]>('q1_site_table.json'),
      fetchJson<ConcBias[]>('q1_concentration_bias.json'),
      fetchJson<DiurnalBias[]>('q1_diurnal_bias.json'),
      fetchJson<RollingPoint[]>('q1_rolling_stability.json'),
      fetchJson<HeatmapCell[]>('q1_temp_humidity_heatmap.json'),
      fetchJson<AssetCard[]>('q1_asset_cards.json'),
    ]).then(([sc, ba, st, cb, di, ro, hm, ac]) => {
      setScatter(sc)
      setBlandAltman(ba)
      setSiteTable(st)
      setConcBias(cb)
      setDiurnal(di)
      setRolling(ro)
      setHeatmap(hm)
      setAssets(ac)
      setLoading(false)
    })
  }, [])

  return { scatter, blandAltman, siteTable, concBias, diurnal, rolling, heatmap, assets, loading }
}
