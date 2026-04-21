import { useState, useEffect } from 'react'

const BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  return res.json()
}

export interface ScatterPoint { pa: number; dep: number; site: string; rush?: boolean; dow?: number }
export interface ScatterData { points: ScatterPoint[]; regression: { slope: number; intercept: number; r2: number; n: number } }

export interface BAPoint { mean: number; diff: number; site: string }
export interface BAData { points: BAPoint[]; stats: { mean_bias: number; loa_upper: number; loa_lower: number; loa_width: number } }

export interface SiteRow { site_id: string; name: string; slope: number; intercept: number; r_squared: number; rmse: number; bias: number; n: number }

export interface ConcBias { bin: string; bias: number; n: number }
export interface DiurnalBias { hour: number; bias: number }
export interface RollingPoint { date: string; r: number; rmse: number }
export interface HeatmapCell { temp: string; humidity: string; bias: number | null; n: number }
export interface AssetCard { id: string; site_id: string; name: string; r_squared: number; bias: number; rmse: number; n: number; health: number }

export interface RushPeriodStats { n: number; pa_mean: number; dep_mean: number; mean_bias: number; rmse: number; pearson_r: number }
export interface RushStats { rush: RushPeriodStats; nonrush: RushPeriodStats }
export interface RushSiteRow { site_id: string; name: string; period: 'rush' | 'nonrush'; n: number; pa_mean: number; dep_mean: number; bias: number; rmse: number }

export interface DowMsd { day: string; day_short: string; is_weekend: boolean; n: number; msd: number; rmse: number; mean_bias: number; pearson_r: number }

export interface AqiTimeseriesPoint { date: string; pa_mean: number; dep_mean: number; bias: number; n: number; aqi: string }

export interface SiteCoord { site_id: string; name: string; lat: number; lon: number; bias: number; r2: number; n: number }

export function useQ1Data() {
  const [scatter, setScatter] = useState<ScatterData | null>(null)
  const [blandAltman, setBlandAltman] = useState<BAData | null>(null)
  const [siteTable, setSiteTable] = useState<SiteRow[]>([])
  const [concBias, setConcBias] = useState<ConcBias[]>([])
  const [diurnal, setDiurnal] = useState<DiurnalBias[]>([])
  const [rolling, setRolling] = useState<RollingPoint[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([])
  const [assets, setAssets] = useState<AssetCard[]>([])
  const [rushStats, setRushStats] = useState<RushStats | null>(null)
  const [rushSite, setRushSite] = useState<RushSiteRow[]>([])
  const [dowMsd, setDowMsd] = useState<DowMsd[]>([])
  const [aqiTimeseries, setAqiTimeseries] = useState<AqiTimeseriesPoint[]>([])
  const [siteCoords, setSiteCoords] = useState<SiteCoord[]>([])
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
      fetchJson<RushStats>('q1_rush_stats.json'),
      fetchJson<RushSiteRow[]>('q1_rush_site.json'),
      fetchJson<DowMsd[]>('q1_dow_msd.json'),
      fetchJson<AqiTimeseriesPoint[]>('q1_aqi_timeseries.json'),
      fetchJson<SiteCoord[]>('q1_site_coords.json'),
    ]).then(([sc, ba, st, cb, di, ro, hm, ac, rs, rss, dm, aq, coords]) => {
      setScatter(sc)
      setBlandAltman(ba)
      setSiteTable(st)
      setConcBias(cb)
      setDiurnal(di)
      setRolling(ro)
      setHeatmap(hm)
      setAssets(ac)
      setRushStats(rs)
      setRushSite(rss)
      setDowMsd(dm)
      setAqiTimeseries(aq)
      setSiteCoords(coords)
      setLoading(false)
    })
  }, [])

  return { scatter, blandAltman, siteTable, concBias, diurnal, rolling, heatmap, assets, rushStats, rushSite, dowMsd, aqiTimeseries, siteCoords, loading }
}
