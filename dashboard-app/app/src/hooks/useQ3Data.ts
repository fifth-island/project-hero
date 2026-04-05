import { useState, useEffect } from 'react'

const BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  return res.json()
}

/* ── KPI ── */
export interface Q3Kpi {
  pm25_naaqs_exceedance_pct: number
  wbgt_heat_risk_pct: number
  pm25_mean: number
  total_observations: number
  wbgt_mean: number
  wbgt_max: number
  pm25_median: number
  pm25_p75: number
  pm25_skewness: number
  wbgt_median: number
  wbgt_p75: number
}

/* ── CDF point ── */
export interface CdfPoint { x: number; y: number }

/* ── Overall CDF ── */
export interface CdfOverall { pm25: CdfPoint[]; wbgt: CdfPoint[] }

/* ── Day/Night CDF ── */
export interface KsResult { d: number; p: number }
export interface CdfDayNight {
  pm25_day: CdfPoint[]; pm25_night: CdfPoint[]
  wbgt_day: CdfPoint[]; wbgt_night: CdfPoint[]
  ks_pm25: KsResult; ks_wbgt: KsResult
}

/* ── Per-site CDF ── */
export interface SiteCdfs {
  [siteId: string]: { pm25: CdfPoint[]; wbgt: CdfPoint[] }
}

/* ── Site table ── */
export interface Q3SiteRow {
  site_id: string; name: string; n_pm25: number
  pm25_median: number; pm25_p90: number; exceedance_pct: number
  wbgt_p90: number; status: string
}

/* ── Temporal ── */
export interface TemporalPoint {
  hour: number; pm25_median: number | null; pm25_p90: number | null
  wbgt_median: number | null; wbgt_p90: number | null
}

/* ── Cross-variable ── */
export interface CrossPoint { pm25: number; wbgt: number; site: string }
export interface CrossVariable {
  points: CrossPoint[]; pearson_r: number; r_squared: number; n: number
}

export function useQ3Data() {
  const [kpi, setKpi] = useState<Q3Kpi | null>(null)
  const [cdfOverall, setCdfOverall] = useState<CdfOverall | null>(null)
  const [cdfDayNight, setCdfDayNight] = useState<CdfDayNight | null>(null)
  const [cdfBySite, setCdfBySite] = useState<SiteCdfs | null>(null)
  const [siteTable, setSiteTable] = useState<Q3SiteRow[]>([])
  const [temporal, setTemporal] = useState<TemporalPoint[]>([])
  const [crossVariable, setCrossVariable] = useState<CrossVariable | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<Q3Kpi>('q3_kpi.json'),
      fetchJson<CdfOverall>('q3_cdf_overall.json'),
      fetchJson<CdfDayNight>('q3_cdf_day_night.json'),
      fetchJson<SiteCdfs>('q3_cdf_by_site.json'),
      fetchJson<Q3SiteRow[]>('q3_site_table.json'),
      fetchJson<TemporalPoint[]>('q3_temporal.json'),
      fetchJson<CrossVariable>('q3_cross_variable.json'),
    ]).then(([kp, co, dn, cs, st, tm, cv]) => {
      setKpi(kp)
      setCdfOverall(co)
      setCdfDayNight(dn)
      setCdfBySite(cs)
      setSiteTable(st)
      setTemporal(tm)
      setCrossVariable(cv)
      setLoading(false)
    })
  }, [])

  return { kpi, cdfOverall, cdfDayNight, cdfBySite, siteTable, temporal, crossVariable, loading }
}
