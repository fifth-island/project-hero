import { useState, useEffect } from 'react'

const BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  return res.json()
}

/* ── Scatter ── */
export interface DepScatterPoint { kes: number; dep: number; site: string }
export interface WsScatterPoint { kes: number; ws: number; site: string }
interface Regression { slope: number; intercept: number; r2: number; n: number }
export interface DepScatterData { points: DepScatterPoint[]; regression: Regression; reference: string }
export interface WsScatterData { points: WsScatterPoint[]; regression: Regression; reference: string }

/* ── Bland-Altman ── */
export interface BAPoint { mean: number; diff: number; site: string }
interface BAStats { mean_bias: number; loa_upper: number; loa_lower: number; loa_width: number }
export interface BAData { dep: { points: BAPoint[]; stats: BAStats }; ws: { points: BAPoint[]; stats: BAStats } }

/* ── Site table ── */
export interface SiteRow {
  site_id: string; name: string
  r_dep: number; bias_dep: number; rmse_dep: number
  r_ws: number; bias_ws: number; rmse_ws: number
  n: number; mean_temp_f: number
}

/* ── Diurnal ── */
export interface DiurnalPoint { hour: number; kestrel: number; dep: number; ws: number; bias_dep: number; bias_ws: number }

/* ── Rolling stability ── */
export interface RollingPoint { date: string; r_dep: number; r_ws: number; rmse_dep: number; rmse_ws: number }

/* ── Site-hour heatmap ── */
export interface SiteHourCell { site: string; hour: number; bias: number }

/* ── Asset card ── */
export interface AssetCard { id: string; site_id: string; name: string; r_dep: number; bias_dep: number; rmse_dep: number; mean_temp_f: number; n: number; health: number }

/* ── Temp × RH heatmap ── */
export interface TempRhCell { temp: string; humidity: string; bias: number; n: number }

export function useQ2Data() {
  const [scatterDep, setScatterDep] = useState<DepScatterData | null>(null)
  const [scatterWs, setScatterWs] = useState<WsScatterData | null>(null)
  const [blandAltman, setBlandAltman] = useState<BAData | null>(null)
  const [siteTable, setSiteTable] = useState<SiteRow[]>([])
  const [diurnal, setDiurnal] = useState<DiurnalPoint[]>([])
  const [rolling, setRolling] = useState<RollingPoint[]>([])
  const [siteHour, setSiteHour] = useState<SiteHourCell[]>([])
  const [assets, setAssets] = useState<AssetCard[]>([])
  const [tempRh, setTempRh] = useState<TempRhCell[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<DepScatterData>('q2_scatter_dep.json'),
      fetchJson<WsScatterData>('q2_scatter_ws.json'),
      fetchJson<BAData>('q2_bland_altman.json'),
      fetchJson<SiteRow[]>('q2_site_table.json'),
      fetchJson<DiurnalPoint[]>('q2_diurnal_pattern.json'),
      fetchJson<RollingPoint[]>('q2_rolling_stability.json'),
      fetchJson<SiteHourCell[]>('q2_site_hour_heatmap.json'),
      fetchJson<AssetCard[]>('q2_asset_cards.json'),
      fetchJson<TempRhCell[]>('q2_temp_rh_heatmap.json'),
    ]).then(([sd, sw, ba, st, di, ro, sh, ac, tr]) => {
      setScatterDep(sd)
      setScatterWs(sw)
      setBlandAltman(ba)
      setSiteTable(st)
      setDiurnal(di)
      setRolling(ro)
      setSiteHour(sh)
      setAssets(ac)
      setTempRh(tr)
      setLoading(false)
    })
  }, [])

  return { scatterDep, scatterWs, blandAltman, siteTable, diurnal, rolling, siteHour, assets, tempRh, loading }
}
