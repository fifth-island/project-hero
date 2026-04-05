import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar,
} from 'recharts'
import { useQ4Data, type DailyAqi, type ComplianceRow, type CorrCell } from '../hooks/useQ4Data'

const C = {
  primary: '#6f070f',
  primaryContainer: '#902223',
  secondary: '#87512d',
  secondaryContainer: '#feb78a',
  tertiary: '#003e2f',
  tertiaryContainer: '#005744',
  surface: '#fff8f1',
  surfaceLow: '#fff2da',
  surfaceContainer: '#ffecc3',
  surfaceHighest: '#f6e1ae',
  onSurface: '#241a00',
  onSurfaceVariant: '#58413f',
  outline: '#8b716f',
  outlineVariant: '#dfbfbc',
  error: '#ba1a1a',
}

/* AQI color: 0-50 green, 51-100 yellow, 101+ orange/red */
function aqiColor(aqi: number): string {
  if (aqi <= 25) return '#82d7ba'        // tertiary-fixed-dim
  if (aqi <= 35) return '#9ef3d6'        // tertiary-fixed
  if (aqi <= 42) return '#005744'        // tertiary-container
  if (aqi <= 50) return '#feb78a'        // secondary-container
  return '#902223'                        // primary-container
}

function aqiOpacity(aqi: number): number {
  return Math.min(0.3 + (aqi / 50) * 0.7, 1)
}

/* Correlation cell color */
function corrColor(v: number): string {
  if (v >= 0.5) return 'bg-secondary-container/40 font-bold text-secondary'
  if (v >= 0.3) return 'bg-tertiary-fixed/30 font-bold text-tertiary'
  if (v <= -0.3) return 'bg-error-container/40 text-error'
  return ''
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const HOURLY_POLLUTANTS = [
  { key: 'no2', label: 'NO₂', unit: 'ppb', color: C.primary, icon: 'local_shipping', desc: 'Weekday rush-hour at 5 AM confirms I-93 commuter traffic source.' },
  { key: 'ozone', label: 'Ozone', unit: 'ppm', color: C.secondary, icon: 'wb_sunny', desc: 'Classic photochemical cycle with peak irradiance at 3 PM.' },
  { key: 'co', label: 'CO', unit: 'ppm', color: C.tertiaryContainer, icon: 'local_fire_department', desc: 'Combustion-sourced, with calm-wind trapping visible in nighttime readings.' },
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', color: C.onSurfaceVariant, icon: 'blur_on', desc: 'Secondary aerosol formation drives afternoon PM2.5 buildup.' },
  { key: 'so2', label: 'SO₂', unit: 'ppb', color: C.outline, icon: 'factory', desc: 'Low-level industrial/combustion signal with midday peak.' },
] as const

const ROSE_OPTIONS = [
  { key: 'no2_mean', label: 'NO₂', unit: 'ppb', color: C.primary },
  { key: 'ozone_mean', label: 'Ozone', unit: 'ppm', color: C.secondary },
  { key: 'co_mean', label: 'CO', unit: 'ppm', color: C.tertiaryContainer },
  { key: 'pm25_mean', label: 'PM2.5', unit: 'µg/m³', color: C.onSurfaceVariant },
  { key: 'so2_mean', label: 'SO₂', unit: 'ppb', color: C.outline },
  { key: 'wind_speed_mean', label: 'Wind Speed', unit: 'mph', color: C.tertiary },
] as const

export default function ResearchQ4() {
  const { kpi, dailyAqi, hourlyPatterns, corrMatrix, compliance, pollutionRose, weekdayWeekendGap, loading } = useQ4Data()
  const [hourlyPollutant, setHourlyPollutant] = useState(0) // index into HOURLY_POLLUTANTS
  const [roseMetric, setRoseMetric] = useState(0) // index into ROSE_OPTIONS

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">Loading AQI &amp; multi-pollutant data…</p>
    </div>
  )

  /* Build calendar grid from dailyAqi */
  const firstDate = new Date(dailyAqi[0].date + 'T00:00:00')
  const startDow = (firstDate.getDay() + 6) % 7 // Monday=0
  const calendarCells: (DailyAqi | null)[] = Array(startDow).fill(null).concat(dailyAqi)

  /* Build correlation table labels */
  const corrLabels = ['CO', 'NO2', 'Ozone', 'SO2', 'PM2.5']
  const corrMap = new Map(corrMatrix.map(c => [`${c.row}-${c.col}`, c.value]))

  /* Find peak day */
  const peakDay = dailyAqi.reduce((a, b) => a.aqi > b.aqi ? a : b)

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-primary tracking-tight italic">
            AQI &amp; Multi-Pollutant Analysis
          </h2>
          <p className="text-secondary mt-2 max-w-2xl">
            Daily Air Quality Index and concentrations of CO, SO₂, NO₂, and Ozone
            in Chinatown based on the MassDEP monitor.
          </p>
        </div>
        <div className="px-4 py-2 bg-surface-container rounded-lg border border-outline-variant/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
          <span className="text-xs font-bold uppercase tracking-widest">Jul – Aug 2023</span>
        </div>
      </header>

      {/* ═══ KPI Banner ═══ */}
      <section className="grid grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#8b716f 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }} />
          <p className="text-xs font-bold text-secondary tracking-widest uppercase mb-1">Status Integrity</p>
          <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-black text-tertiary">{kpi!.days_good_aqi_pct}%</h3>
          <p className="text-sm text-on-surface-variant font-medium">Days in 'Good' AQI</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#8b716f 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }} />
          <p className="text-xs font-bold text-secondary tracking-widest uppercase mb-1">Index Average</p>
          <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-black text-primary">{kpi!.mean_daily_aqi}</h3>
          <p className="text-sm text-on-surface-variant font-medium">Mean Daily AQI</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#8b716f 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }} />
          <p className="text-xs font-bold text-secondary tracking-widest uppercase mb-1">Observed Peak</p>
          <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-black text-primary">{kpi!.max_daily_aqi}</h3>
          <p className="text-sm text-on-surface-variant font-medium">Maximum Daily AQI</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#8b716f 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }} />
          <p className="text-xs font-bold text-secondary tracking-widest uppercase mb-1">Primary Agent</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-black text-secondary">{kpi!.dominant_pollutant}</h3>
            <span className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-primary">{kpi!.dominant_pollutant_pct}%</span>
          </div>
          <p className="text-sm text-on-surface-variant font-medium">Dominant Pollutant</p>
        </div>
      </section>

      {/* ═══ Daily AQI Calendar Heatmap ═══ */}
      <section className="bg-surface-container p-8 rounded-2xl relative border-b-4 border-primary-container">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-[family-name:var(--font-family-headline)] font-black text-on-surface">Daily AQI Heatmap</h2>
            <p className="text-sm text-on-surface-variant">Scholarly review of environmental safety levels (July – August)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-stone-500">Scale</span>
            <div className="w-3 h-3 rounded-sm" style={{ background: '#82d7ba' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: '#005744' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: '#902223' }} />
            <span className="text-[10px] font-bold uppercase text-stone-500 ml-1">Good — Hazardous</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3 max-w-4xl mx-auto">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-stone-400 uppercase">{d}</div>
          ))}
          {calendarCells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} className="aspect-square opacity-0" />
            const day = new Date(cell.date + 'T00:00:00')
            const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            const label = day.getDate() === 1 ? `${monthNames[day.getMonth()]} ${day.getDate()}` : String(day.getDate())
            const isPeak = cell.date === peakDay.date
            return (
              <div
                key={cell.date}
                className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] font-bold relative transition-all hover:scale-105 group/cell ${
                  isPeak ? 'border-2 border-primary shadow-sm' : 'border border-white/40'
                }`}
                style={{ backgroundColor: aqiColor(cell.aqi), opacity: aqiOpacity(cell.aqi) }}
              >
                <span>{label}</span>
                {isPeak && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white px-2 py-1 rounded text-[9px] whitespace-nowrap shadow-xl z-10">
                    Peak: {cell.aqi} AQI
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
                  </div>
                )}
                {/* Hover tooltip */}
                <div className="hidden group-hover/cell:block absolute -top-24 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-3 py-2 rounded-lg text-[10px] whitespace-nowrap shadow-xl z-20 pointer-events-none">
                  <p className="font-bold text-[11px] mb-1">{monthNames[day.getMonth()]} {day.getDate()}, {day.getFullYear()}</p>
                  <p>Overall AQI: <strong>{cell.aqi.toFixed(1)}</strong></p>
                  <p>Dominant: <strong className="capitalize">{cell.dominant === 'pm25' ? 'PM2.5' : cell.dominant === 'ozone' ? 'Ozone' : cell.dominant}</strong></p>
                  {cell.aqi_ozone != null && <p>Ozone sub-index: {cell.aqi_ozone.toFixed(1)}</p>}
                  {cell.aqi_pm25 != null && <p>PM2.5 sub-index: {cell.aqi_pm25.toFixed(1)}</p>}
                  <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-on-surface rotate-45" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══ Hourly Patterns + Weekday/Weekend Gap ═══ */}
      <section className="grid grid-cols-5 gap-8">
        {/* Left: Hourly patterns with pollutant filter */}
        <div className="col-span-3 bg-surface-container-lowest p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">{HOURLY_POLLUTANTS[hourlyPollutant].icon}</span>
              <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-black">Hourly {HOURLY_POLLUTANTS[hourlyPollutant].label} Patterns</h3>
            </div>
            <div className="flex gap-1">
              {HOURLY_POLLUTANTS.map((p, i) => (
                <button
                  key={p.key}
                  onClick={() => setHourlyPollutant(i)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    i === hourlyPollutant
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={hourlyPatterns} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke={C.outline} tickFormatter={(h: number) => `${h}:00`} />
              <YAxis tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: HOURLY_POLLUTANTS[hourlyPollutant].unit, angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip
                labelFormatter={(h) => `${h}:00`}
                formatter={(v) => [`${Number(v).toFixed(3)} ${HOURLY_POLLUTANTS[hourlyPollutant].unit}`]}
              />
              <Line
                dataKey={`${HOURLY_POLLUTANTS[hourlyPollutant].key}_weekday`}
                stroke={HOURLY_POLLUTANTS[hourlyPollutant].color}
                strokeWidth={2.5}
                dot={false}
                name="Weekday"
              />
              <Line
                dataKey={`${HOURLY_POLLUTANTS[hourlyPollutant].key}_weekend`}
                stroke={HOURLY_POLLUTANTS[hourlyPollutant].color}
                strokeWidth={2}
                dot={false}
                name="Weekend"
                strokeDasharray="6 4"
                strokeOpacity={0.6}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center gap-6 text-xs text-on-surface-variant">
            <span className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-primary" /> Weekday
            </span>
            <span className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-primary opacity-60" style={{ borderTop: '2px dashed currentColor' }} /> Weekend
            </span>
          </div>
          <p className="mt-3 text-xs text-on-surface-variant font-medium">
            {HOURLY_POLLUTANTS[hourlyPollutant].desc}
          </p>
        </div>

        {/* Right: Weekday/Weekend gap bar chart */}
        <div className="col-span-2 bg-surface-container-lowest p-8 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">compare_arrows</span>
            <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-black">Weekday / Weekend Gap</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekdayWeekendGap} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke={C.outline} unit="%" />
              <YAxis dataKey="pollutant" type="category" tick={{ fontSize: 11, fontWeight: 700 }} stroke={C.outline} width={55} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Max hourly Δ']}
                labelFormatter={(label) => {
                  const row = weekdayWeekendGap.find(r => r.pollutant === label)
                  return row ? `${label} — WD peak: ${row.weekday_peak} / WE peak: ${row.weekend_peak} ${row.unit}` : String(label)
                }}
              />
              <Bar dataKey="pct_difference" fill={C.primary} radius={[0, 4, 4, 0]} barSize={20} name="Gap %" />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-4 text-xs text-on-surface-variant font-medium italic">
            Maximum hourly percentage difference between weekday and weekend median concentrations.
          </p>
        </div>
      </section>

      {/* ═══ Correlation Matrix + Pollution Rose ═══ */}
      <section className="grid grid-cols-5 gap-8">
        <div className="col-span-3 bg-surface-container-lowest p-8 rounded-2xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-black mb-6">Multi-Pollutant Correlation Matrix</h3>
          <div className="overflow-hidden border border-outline-variant/30 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="p-3 text-left font-[family-name:var(--font-family-headline)] text-primary border-r border-outline-variant/30">Variable</th>
                  {corrLabels.map(l => (
                    <th key={l} className="p-3 text-center font-[family-name:var(--font-family-headline)] text-stone-500">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {corrLabels.map(row => (
                  <tr key={row}>
                    <td className="p-3 font-bold border-r border-outline-variant/30">{row}</td>
                    {corrLabels.map(col => {
                      const v = corrMap.get(`${row}-${col}`) ?? 0
                      const isDiag = row === col
                      return (
                        <td key={col} className={`p-3 text-center ${isDiag ? 'bg-stone-100 font-bold' : corrColor(v)}`}>
                          {v.toFixed(2)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-2 bg-surface-container-lowest p-8 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-black">Pollution Rose</h3>
            <select
              value={roseMetric}
              onChange={(e) => setRoseMetric(Number(e.target.value))}
              className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs font-bold text-on-surface appearance-none cursor-pointer"
            >
              {ROSE_OPTIONS.map((opt, i) => (
                <option key={opt.key} value={i}>{opt.label} ({opt.unit})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={pollutionRose} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke={C.outlineVariant} strokeOpacity={0.3} />
                <PolarAngleAxis dataKey="direction" tick={{ fontSize: 9, fill: C.onSurfaceVariant }} />
                <PolarRadiusAxis tick={{ fontSize: 8 }} stroke={C.outline} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(3)} ${ROSE_OPTIONS[roseMetric].unit}`, ROSE_OPTIONS[roseMetric].label]}
                  labelFormatter={(dir) => {
                    const pt = pollutionRose.find(r => r.direction === dir)
                    return pt ? `${dir} — ${pt.count} observations` : String(dir)
                  }}
                />
                <Radar
                  dataKey={ROSE_OPTIONS[roseMetric].key}
                  stroke={ROSE_OPTIONS[roseMetric].color}
                  fill={ROSE_OPTIONS[roseMetric].color}
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-xs text-center text-on-surface-variant italic">
            Directional concentration of {ROSE_OPTIONS[roseMetric].label} by wind bearing. W/SW prevailing winds align with I-93 corridor.
          </p>
        </div>
      </section>

      {/* ═══ EPA Compliance Table ═══ */}
      <section className="bg-surface p-8 rounded-2xl border-2 border-surface-container-high">
        <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-black mb-6">EPA Standards Compliance Audit</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-primary">
              <tr>
                <th className="py-4 text-left font-[family-name:var(--font-family-headline)] text-lg text-primary">Pollutant</th>
                <th className="py-4 text-left text-xs uppercase tracking-widest text-stone-500">NAAQS Standard</th>
                <th className="py-4 text-left text-xs uppercase tracking-widest text-stone-500">Max Observed</th>
                <th className="py-4 text-right text-xs uppercase tracking-widest text-stone-500">Margin to Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {compliance.map((row: ComplianceRow) => (
                <tr key={row.pollutant} className="group hover:bg-surface-container-low transition-colors">
                  <td className="py-4 font-[family-name:var(--font-family-headline)] font-bold text-on-surface">{row.pollutant}</td>
                  <td className="py-4 text-sm font-medium">{row.standard}</td>
                  <td className="py-4 text-sm font-bold text-tertiary">{row.max_display}</td>
                  <td className="py-4 text-right">
                    <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-bold">
                      {row.margin_pct}% Below
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ Core Research Finding ═══ */}
      <footer className="bg-primary-container text-on-primary rounded-xl p-10 relative overflow-hidden flex items-center gap-12">
        <div className="absolute top-0 right-0 w-64 h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
        <div className="shrink-0">
          <div className="w-20 h-20 border-2 border-on-primary-container rounded-full flex items-center justify-center p-2">
            <div className="w-full h-full bg-on-primary rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <h3 className="font-[family-name:var(--font-family-headline)] text-3xl font-bold italic mb-4">Core Research Finding</h3>
          <p className="text-xl leading-relaxed max-w-4xl opacity-90">
            All <strong className="text-white">36 study days</strong> achieved EPA &ldquo;Good&rdquo; AQI (mean 29.4, max 46.2), with <strong className="text-white">zero federal standard exceedances</strong> across all five criteria pollutants. Ozone drove AQI on 97% of days via summer photochemistry, while NO₂ exhibited a <strong className="text-white">197% weekday–weekend difference</strong> — the clearest traffic fingerprint — tracing directly to the I-93 corridor.
          </p>
          <div className="mt-8 flex gap-6 items-center">
            <button className="bg-on-primary text-primary px-6 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:scale-105 transition-transform">
              Read Full Manuscript
            </button>
            <span className="text-xs opacity-70 italic font-medium">Verified by Tufts Faculty Board</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
