import { useState, useEffect } from 'react'

const BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  return res.json()
}

/* ── KPI ── */
export interface Q4Kpi {
  days_good_aqi_pct: number
  mean_daily_aqi: number
  max_daily_aqi: number
  dominant_pollutant: string
  dominant_pollutant_pct: number
  total_days: number
}

/* ── Daily AQI ── */
export interface DailyAqi {
  date: string
  aqi: number
  dominant: string
  aqi_ozone?: number
  aqi_pm25?: number
}

/* ── Hourly patterns ── */
export interface HourlyPattern {
  hour: number
  no2_weekday?: number; no2_weekend?: number
  ozone_weekday?: number; ozone_weekend?: number
  co_weekday?: number; co_weekend?: number
  pm25_weekday?: number; pm25_weekend?: number
  so2_weekday?: number; so2_weekend?: number
}

/* ── Correlation matrix ── */
export interface CorrCell { row: string; col: string; value: number }

/* ── Compliance ── */
export interface ComplianceRow {
  pollutant: string; standard: string; max_observed: number
  max_display: string; margin_pct: number
}

/* ── Pollution rose ── */
export interface RosePoint {
  direction: string; count: number
  no2_mean: number; ozone_mean: number; so2_mean: number
  co_mean: number; pm25_mean: number; wind_speed_mean: number
}

/* ── Weekday/Weekend gap ── */
export interface GapRow {
  pollutant: string; weekday_peak: number; weekend_peak: number
  pct_difference: number; unit: string
}

export function useQ4Data() {
  const [kpi, setKpi] = useState<Q4Kpi | null>(null)
  const [dailyAqi, setDailyAqi] = useState<DailyAqi[]>([])
  const [hourlyPatterns, setHourlyPatterns] = useState<HourlyPattern[]>([])
  const [corrMatrix, setCorrMatrix] = useState<CorrCell[]>([])
  const [compliance, setCompliance] = useState<ComplianceRow[]>([])
  const [pollutionRose, setPollutionRose] = useState<RosePoint[]>([])
  const [weekdayWeekendGap, setWeekdayWeekendGap] = useState<GapRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJson<Q4Kpi>('q4_kpi.json'),
      fetchJson<DailyAqi[]>('q4_daily_aqi.json'),
      fetchJson<HourlyPattern[]>('q4_hourly_patterns.json'),
      fetchJson<CorrCell[]>('q4_correlation_matrix.json'),
      fetchJson<ComplianceRow[]>('q4_compliance.json'),
      fetchJson<RosePoint[]>('q4_pollution_rose.json'),
      fetchJson<GapRow[]>('q4_weekday_weekend_gap.json'),
    ]).then(([kp, da, hp, cm, co, pr, gap]) => {
      setKpi(kp)
      setDailyAqi(da)
      setHourlyPatterns(hp)
      setCorrMatrix(cm)
      setCompliance(co)
      setPollutionRose(pr)
      setWeekdayWeekendGap(gap)
      setLoading(false)
    })
  }, [])

  return { kpi, dailyAqi, hourlyPatterns, corrMatrix, compliance, pollutionRose, weekdayWeekendGap, loading }
}
