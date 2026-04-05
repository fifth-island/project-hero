import { useState, useEffect } from 'react'

const BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  return res.json()
}

/* ── KPI ── */
export interface Q8Kpi {
  pm25_peak_hour: number
  pm25_peak_val: number
  pm25_trough_hour: number
  pm25_trough_val: number
  pm25_amplitude: number
  wbgt_peak_hour: number
  wbgt_peak_val: number
  wbgt_trough_hour: number
  wbgt_trough_val: number
  wbgt_amplitude: number
  pm25_peak_dow: string
  pm25_peak_dow_val: number
  wbgt_peak_dow: string
  wbgt_peak_dow_val: number
  compound_window: string
  offset_hours: number
  weekday_pm25: number
  weekend_pm25: number
  weekday_wbgt: number
  weekend_wbgt: number
}

/* ── Diurnal ── */
export interface DiurnalRow {
  hour: number
  pm25_mean: number; pm25_std: number
  wbgt_mean: number; wbgt_std: number
}

/* ── DOW ── */
export interface DowRow {
  day: string; dow: number
  pm25_mean: number; wbgt_mean: number
  is_weekend: boolean
}

/* ── Heatmap cell ── */
export interface HeatmapCell {
  day: string; dow: number; hour: number
  value: number; is_peak: boolean
}

/* ── Weekday/Weekend diurnal ── */
export interface WdWeRow {
  hour: number
  pm25_weekday: number; pm25_weekend: number
  wbgt_weekday: number; wbgt_weekend: number
}

/* ── Site temporal ── */
export interface SiteTemporal {
  site_id: string; site_label: string
  pm25_peak_hour: number; pm25_trough_hour: number
  pm25_amplitude: number; wbgt_peak_hour: number
  wbgt_amplitude: number; pm25_peak_dow: string
  pm25_mean: number; diurnal_curve: number[]
}

export function useQ8Data() {
  const [kpi, setKpi] = useState<Q8Kpi | null>(null)
  const [diurnal, setDiurnal] = useState<DiurnalRow[]>([])
  const [dow, setDow] = useState<DowRow[]>([])
  const [heatmapPm25, setHeatmapPm25] = useState<HeatmapCell[]>([])
  const [wdWeDiurnal, setWdWeDiurnal] = useState<WdWeRow[]>([])
  const [siteTemporal, setSiteTemporal] = useState<SiteTemporal[]>([])
  const [heatmapBySite, setHeatmapBySite] = useState<Record<string, HeatmapCell[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<Q8Kpi>('q8_kpi.json'),
      fetchJson<DiurnalRow[]>('q8_diurnal.json'),
      fetchJson<DowRow[]>('q8_dow.json'),
      fetchJson<HeatmapCell[]>('q8_heatmap_pm25.json'),
      fetchJson<WdWeRow[]>('q8_weekday_weekend.json'),
      fetchJson<SiteTemporal[]>('q8_site_temporal.json'),
      fetchJson<Record<string, HeatmapCell[]>>('q8_heatmap_by_site.json'),
    ]).then(([kp, di, dw, hm, ww, st, hbs]) => {
      setKpi(kp)
      setDiurnal(di)
      setDow(dw)
      setHeatmapPm25(hm)
      setWdWeDiurnal(ww)
      setSiteTemporal(st)
      setHeatmapBySite(hbs)
      setLoading(false)
    })
  }, [])

  return { kpi, diurnal, dow, heatmapPm25, wdWeDiurnal, siteTemporal, heatmapBySite, loading }
}
