import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, LineChart, Line, ComposedChart, Cell, BarChart, Bar,
} from 'recharts'
import { useQ2Data, type SiteRow } from '../hooks/useQ2Data'
import { useTranslation } from 'react-i18next'
import ReportViewer from '../components/ReportViewer'

/* ─── Design tokens (shared palette) ────────────────────────────────────── */
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

const SITE_COLORS: Record<string, string> = {
  berkley: '#6f070f', castle: '#902223', chin: '#87512d', dewey: '#c48a5a',
  eliotnorton: '#003e2f', greenway: '#005744', lyndenboro: '#3a9e7e', msh: '#8b716f',
  oxford: '#a93533', reggie: '#6b3a18', taitung: '#2e7d5e', tufts: '#d4766a',
}

const SITE_NAMES: Record<string, string> = {
  berkley: 'Berkeley Garden', castle: 'Castle Square', chin: 'Chin Park',
  dewey: 'Dewey Square', eliotnorton: 'Eliot Norton', greenway: 'One Greenway',
  lyndenboro: 'Lyndboro Park', msh: 'Mary Soo Hoo', oxford: 'Oxford Place',
  reggie: 'Reggie Wong', taitung: 'Tai Tung', tufts: 'Tufts Garden',
}

function siteColor(site: string) { return SITE_COLORS[site] ?? C.outline }
function biasColor(v: number) { return Math.abs(v) < 0.5 ? 'text-tertiary' : Math.abs(v) < 1.0 ? 'text-secondary' : 'text-error font-bold' }
function rColor(v: number) { return v >= 0.90 ? 'text-tertiary' : v >= 0.85 ? 'text-secondary' : 'text-error' }
function healthColor(h: number) { return h >= 90 ? 'bg-tertiary' : h >= 80 ? 'bg-secondary' : 'bg-primary' }

/** Diverging blue -> white -> red for bias heatmaps.
 *  Input range [-3, +3] maps to blue-white-red */
function biasToRgb(bias: number): string {
  const t = Math.min(Math.max((bias + 3) / 6, 0), 1)
  const r = Math.round(60  + t * 195)
  const g = Math.round(60  + (0.5 - Math.abs(t - 0.5)) * 2 * 195)
  const b = Math.round(255 - t * 195)
  return `rgb(${r},${g},${b})`
}

/* ─── Mini components ───────────────────────────────────────────────────── */

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/30 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{label}</span>
      </div>
      <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary">{title}</h3>
      {subtitle && <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">{subtitle}</p>}
    </div>
  )
}

export default function ResearchQ2() {
  const { scatterDep, scatterWs, blandAltman, siteTable, diurnal, rolling, siteHour, assets, tempRh, dailyTimeseries, loading } = useQ2Data()
  const { t } = useTranslation()
  const [showReport, setShowReport] = useState(false)

  /* Site x Hour grid for heatmap */
  const siteIds = useMemo(() =>
    [...new Set((siteHour ?? []).map(c => c.site))].sort(),
    [siteHour]
  )
  const siteHourGrid = useMemo(() => {
    if (!siteHour?.length) return []
    return siteIds.map(site => {
      const row = Array.from({ length: 24 }, (_, h) =>
        siteHour.find(c => c.site === site && c.hour === h) ?? { site, hour: h, bias: 0 }
      )
      return { site, cells: row }
    })
  }, [siteHour, siteIds])

  /* Temporal stratification metrics */
  const temporalStats = useMemo(() => {
    if (!diurnal?.length) return null
    const day = diurnal.filter(d => d.hour >= 8 && d.hour <= 18)
    const night = diurnal.filter(d => d.hour < 8 || d.hour > 18)
    const peak = diurnal.filter(d => d.hour >= 10 && d.hour <= 16)
    const avgBias = (arr: typeof diurnal, key: 'bias_dep' | 'bias_ws') =>
      arr.reduce((s, r) => s + r[key], 0) / arr.length
    return {
      dayBiasDep: avgBias(day, 'bias_dep'),
      dayBiasWs: avgBias(day, 'bias_ws'),
      nightBiasDep: avgBias(night, 'bias_dep'),
      nightBiasWs: avgBias(night, 'bias_ws'),
      peakBiasWs: avgBias(peak, 'bias_ws'),
    }
  }, [diurnal])

  /* Bias by hour for bar chart */
  const hourlyBias = useMemo(() => {
    if (!diurnal?.length) return []
    return diurnal.map(d => ({
      hour: d.hour,
      dep: +(d.bias_dep).toFixed(2),
      ws: +(d.bias_ws).toFixed(2),
    }))
  }, [diurnal])

  const tempBins = ['60-65', '65-70', '70-75', '75-80', '80-85', '85-95']
  const rhBins = ['<40%', '40-50%', '50-60%', '60-70%', '70-80%', '>80%']
  const heatGrid = rhBins.map(rh => tempBins.map(tb => tempRh.find(c => c.temp === tb && c.humidity === rh)))

  /* Overview stats from daily timeseries */
  const overview = useMemo(() => {
    if (!dailyTimeseries.length) return null
    const kesAvg = dailyTimeseries.reduce((s, d) => s + d.kestrel, 0) / dailyTimeseries.length
    const depAvg = dailyTimeseries.reduce((s, d) => s + d.dep, 0) / dailyTimeseries.length
    const wsAvg  = dailyTimeseries.reduce((s, d) => s + d.ws, 0) / dailyTimeseries.length
    return { kesAvg, depAvg, wsAvg, days: dailyTimeseries.length }
  }, [dailyTimeseries])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* HERO BANNER */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30">
            <div className="w-2 h-2 rounded-full bg-tertiary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary">{t('q2.badge')}</span>
          </div>
          <h2 className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary tracking-tight leading-none">{t('q2.title')}</h2>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            {t('q2.description')}
          </p>
          <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            Two reference monitors are compared: the <strong className="text-tertiary">DEP Nubian Square FEM</strong> station
            (ground-level, regulatory-grade) and the <strong className="text-error">rooftop weather station at 35 Kneeland St</strong>.
            The results reveal a critical flaw in the rooftop sensor and validate ground-level Kestrel measurements.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            {[t('q2.studyPeriod'), t('q2.monitoringSites'), t('q2.pairedObs')].map((tag) => (
              <span key={tag} className="bg-surface-container px-4 py-2 text-xs font-bold text-secondary-container border border-secondary-container/30 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          <div className="bg-surface-container-highest p-6 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5 pointer-events-none"><span className="material-symbols-outlined text-8xl">monitoring</span></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Study Period</p>
            <div className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-primary">{overview?.days ?? '—'} Days</div>
            <p className="text-xs text-stone-500 mt-1">Jul 19 – Aug 23, 2023 · 12 Kestrel sensors vs. 2 references</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Kestrel Avg',  value: overview ? `${overview.kesAvg.toFixed(1)}` : '—', unit: '°F', note: 'ground-level sensors', color: 'text-secondary' },
              { label: 'DEP Avg',       value: overview ? `${overview.depAvg.toFixed(1)}` : '—', unit: '°F', note: 'Nubian Sq. FEM',       color: 'text-tertiary' },
              { label: 'WS Avg',        value: overview ? `${overview.wsAvg.toFixed(1)}`  : '—', unit: '°F', note: '35 Kneeland rooftop',  color: 'text-error' },
            ].map(k => (
              <div key={k.label} className="bg-white p-4 shadow-sm border border-stone-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">{k.label}</p>
                <div className={`text-lg font-[family-name:var(--font-family-headline)] font-bold ${k.color}`}>
                  {k.value} <span className="text-xs font-normal text-stone-400">{k.unit}</span>
                </div>
                <p className="text-[10px] text-stone-400">{k.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          Data Overview — Temperature over the study period
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Data Overview"
          title="Daily Temperatures Over the Study Period"
          subtitle="Before diving into statistics — here are the raw daily averages from all three temperature sources, side by side. Notice how Kestrel and DEP track closely while the rooftop weather station diverges."
        />

        <div className="bg-surface-container-low p-8">
          <div className="flex flex-wrap gap-6 items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 rounded" style={{ background: C.secondary }} />
              <span className="text-xs text-on-surface-variant">Kestrel (12-site avg)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 rounded" style={{ background: C.tertiary }} />
              <span className="text-xs text-on-surface-variant">DEP Nubian Sq.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 rounded border-t border-dashed" style={{ borderColor: C.error }} />
              <span className="text-xs text-on-surface-variant">WS 35 Kneeland (rooftop)</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={dailyTimeseries} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                tickFormatter={(d: string) => new Date(d + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis domain={[60, 90]} tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft', fontSize: 10, fill: C.onSurfaceVariant }} />
              <Tooltip
                contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(1)}°F`, String(name)]}
                labelFormatter={(d: unknown) => new Date(String(d) + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              />
              <Line dataKey="kestrel" name="Kestrel" type="monotone" stroke={C.secondary} strokeWidth={2} dot={false} />
              <Line dataKey="dep" name="DEP Nubian" type="monotone" stroke={C.tertiary} strokeWidth={2} dot={false} />
              <Line dataKey="ws" name="WS Rooftop" type="monotone" stroke={C.error} strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-5 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-tertiary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">visibility</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">What you're seeing</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  The <strong className="text-secondary">brown</strong> and <strong className="text-tertiary">green</strong> lines
                  (Kestrel and DEP) move in near-lockstep — when it gets hot, both sensors record it.
                  The <strong className="text-error">red dashed line</strong> (rooftop WS) sometimes leads, sometimes lags,
                  and frequently diverges by 3–5°F. That's the rooftop thermal mass effect we'll quantify later.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Study Days',     value: overview?.days.toString() ?? '—',                          icon: 'date_range',   color: C.primary },
            { label: 'Kestrel Avg',    value: overview ? `${overview.kesAvg.toFixed(1)}°F` : '—',        icon: 'sensors',      color: C.secondary },
            { label: 'DEP Avg',        value: overview ? `${overview.depAvg.toFixed(1)}°F` : '—',        icon: 'verified',     color: C.tertiary },
            { label: 'WS Avg',         value: overview ? `${overview.wsAvg.toFixed(1)}°F` : '—',         icon: 'roofing',      color: C.error },
          ].map(k => (
            <div key={k.label} className="bg-white p-4 border border-stone-100 flex items-start gap-3">
              <span className="material-symbols-outlined text-lg mt-0.5" style={{ color: k.color }}>{k.icon}</span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{k.label}</p>
                <p className="text-sm font-bold text-on-surface">{k.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* S1 KPI COMPARISON */}
      <section>
        <SectionHeader
          label="Key Metrics"
          title="Quantifying the Difference: DEP vs Weather Station"
          subtitle="Now let's put numbers to the patterns we just saw. These metrics reveal how reliable each reference is for ground-level temperature monitoring."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'DEP Correlation',  value: 'r = 0.90',  note: 'strong agreement',        icon: 'analytics',  color: C.tertiary },
            { label: 'DEP Bias',         value: '−0.37°F',   note: 'near-zero systematic error', icon: 'straighten', color: C.tertiary },
            { label: 'WS Correlation',   value: 'r = 0.60',  note: 'poor agreement',           icon: 'warning',    color: C.error },
            { label: 'WS RMSE',          value: '7.03°F',    note: 'unacceptable error',       icon: 'error',      color: C.error },
          ].map(k => (
            <div key={k.label} className="bg-surface-container-low p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-lg mt-0.5" style={{ color: k.color }}>{k.icon}</span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{k.label}</p>
                <p className="text-lg font-[family-name:var(--font-family-headline)] font-bold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] text-stone-400">{k.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Within \u00B12\u00B0F', dep: '53.2%', ws: '29.0%' },
            { label: 'Diurnal Bias SD', dep: '0.96\u00B0F', ws: '4.50\u00B0F' },
            { label: 'Heat Event Agreement', dep: '74.3%', ws: '14.1%' },
            { label: 'Spearman \u03C1', dep: '0.89', ws: '0.54' },
          ].map(m => (
            <div key={m.label} className="bg-white p-5 border border-stone-100 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{m.label}</p>
              <div className="flex items-baseline gap-3">
                <div>
                  <span className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-tertiary">{m.dep}</span>
                  <span className="text-[9px] text-stone-400 ml-1">DEP</span>
                </div>
                <span className="text-stone-300">|</span>
                <div>
                  <span className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-error">{m.ws}</span>
                  <span className="text-[9px] text-stone-400 ml-1">WS</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-secondary">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-xl mt-0.5">compare_arrows</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">Two references, two stories</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                The DEP Nubian Square monitor is the <strong>gold-standard reference</strong> {'—'} its readings agree with Kestrel ground-level measurements
                53% of the time within {'±'}2{'°'}F, and it correctly flags 74% of heat events (&gt;85{'°'}F).
                The rooftop weather station at 35 Kneeland is <strong>fundamentally unsuitable</strong>: only 29% agreement,
                and it misses <strong>86% of heat events</strong> due to rooftop thermal mass.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* S2 DUAL SCATTER PLOTS */}
      <section>
        <SectionHeader
          label="Correlation Analysis"
          title="Scatter Plots: Kestrel vs Each Reference"
          subtitle="Each point represents a paired 10-minute temperature reading (sampled). The dashed line is perfect 1:1 agreement. Tight clustering along the line indicates strong agreement."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-low p-8">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-tertiary">{t('q2.kestrelVsDep')}</h4>
              <span className="text-[10px] uppercase tracking-widest bg-surface-container px-2 py-1">n = {scatterDep!.regression.n.toLocaleString()}</span>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Each point is colored by site. Points cluster tightly along the 1:1 line {'\u2014'} confirming Kestrel tracks the DEP reference.
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis dataKey="dep" type="number" name="DEP Nubian" unit={'\u00B0F'} domain={[55, 100]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: 'DEP Nubian (\u00B0F)', position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }} />
                <YAxis dataKey="kes" type="number" name="Kestrel" unit={'\u00B0F'} domain={[55, 100]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: 'Kestrel (\u00B0F)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: C.onSurfaceVariant }} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                  formatter={(v: any, name: any) => [`${v}\u00B0F`, name]} />
                <ReferenceLine segment={[{ x: 55, y: 55 }, { x: 100, y: 100 }]} stroke={C.outlineVariant} strokeDasharray="6 4" strokeWidth={1} />
                <Scatter data={scatterDep!.points.slice(0, 800)} fill={C.tertiary} fillOpacity={0.2} r={2}>
                  {scatterDep!.points.slice(0, 800).map((p, i) => (
                    <Cell key={i} fill={siteColor(p.site)} fillOpacity={0.3} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-between text-xs text-on-surface-variant">
              <span className="italic">{t('q2.tightAgreement')}</span>
              <span className="font-bold text-tertiary">r = 0.90 | RMSE = 3.10{'\u00B0'}F</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-8">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-error">{t('q2.kestrelVsWs')}</h4>
              <span className="text-[10px] uppercase tracking-widest bg-error-container px-2 py-1 text-error">{t('q2.poor')}</span>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              A diffuse cloud with almost no linear structure {'\u2014'} the rooftop thermal mass effect completely dominates.
              The characteristic {'\u201C'}loop{'\u201D'} pattern is the signature of a phase-shifted diurnal cycle.
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis dataKey="ws" type="number" name="WS Rooftop" unit={'\u00B0F'} domain={[55, 100]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: 'WS 35 Kneeland (\u00B0F)', position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }} />
                <YAxis dataKey="kes" type="number" name="Kestrel" unit={'\u00B0F'} domain={[55, 100]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: 'Kestrel (\u00B0F)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: C.onSurfaceVariant }} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                  formatter={(v: any, name: any) => [`${v}\u00B0F`, name]} />
                <ReferenceLine segment={[{ x: 55, y: 55 }, { x: 100, y: 100 }]} stroke={C.outlineVariant} strokeDasharray="6 4" strokeWidth={1} />
                <Scatter data={scatterWs!.points.slice(0, 800)} fill={C.error} fillOpacity={0.15} r={2}>
                  {scatterWs!.points.slice(0, 800).map((_p, i) => (
                    <Cell key={i} fill={C.error} fillOpacity={0.2} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-between text-xs text-on-surface-variant">
              <span className="italic">{t('q2.diffuseCloud')}</span>
              <span className="font-bold text-error">r = 0.60 | RMSE = 7.03{'\u00B0'}F</span>
            </div>
          </div>
        </div>
        <div className="mt-6 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-tertiary">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">info</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">How to read a scatter plot</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                In a scatter plot comparing two sensors, perfect agreement would place every point exactly on the dashed 1:1 line.
                <strong> Left panel (DEP)</strong>: points form a tight oval around the line {'—'} good agreement.
                <strong> Right panel (WS)</strong>: points spread into a formless cloud {'—'} the two sensors measure fundamentally
                different thermal environments (ground vs. rooftop).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* S3 BLAND-ALTMAN */}
      <section>
        <SectionHeader
          label="Agreement Analysis"
          title="Bland-Altman: How Different Are the Readings?"
          subtitle="Bland-Altman plots show the difference between two measurements (y-axis) against their average (x-axis). The solid horizontal line is the mean bias; dashed lines mark the 95% Limits of Agreement (LOA)."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-low p-8">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-tertiary">Bland-Altman: vs DEP</h4>
              <span className="text-[10px] uppercase tracking-widest text-stone-400">LOA {'\u00B1'}6{'\u00B0'}F</span>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Modest bias ({'\u2212'}0.37{'\u00B0'}F) with limits of agreement of ~{'\u00B1'}6{'\u00B0'}F.
              Some proportional bias visible {'\u2014'} spread increases at higher temperatures.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis dataKey="mean" type="number" name="Mean" domain={[55, 100]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: '(Kes + DEP) / 2 (\u00B0F)', position: 'bottom', offset: 15, fontSize: 10 }} />
                <YAxis dataKey="diff" type="number" name="Difference" domain={[-15, 15]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: 'Kes \u2212 DEP (\u00B0F)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }} />
                <ReferenceLine y={0} stroke={C.outlineVariant} />
                <ReferenceLine y={blandAltman!.dep.stats.mean_bias} stroke={C.tertiary} strokeWidth={1.5}
                  label={{ value: `Bias: ${blandAltman!.dep.stats.mean_bias}\u00B0F`, position: 'right', fontSize: 9, fill: C.tertiary }} />
                <ReferenceLine y={blandAltman!.dep.stats.loa_upper} stroke={C.secondary} strokeDasharray="6 4" />
                <ReferenceLine y={blandAltman!.dep.stats.loa_lower} stroke={C.secondary} strokeDasharray="6 4" />
                <Scatter data={blandAltman!.dep.points.slice(0, 600)} fill={C.tertiary} fillOpacity={0.25} r={2} />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white p-3 border border-stone-100">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Mean Bias</p>
                <p className="text-sm font-bold text-tertiary">{blandAltman!.dep.stats.mean_bias}{'\u00B0'}F</p>
              </div>
              <div className="bg-white p-3 border border-stone-100">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">LOA Width</p>
                <p className="text-sm font-bold text-secondary">{blandAltman!.dep.stats.loa_width.toFixed(1)}{'\u00B0'}F</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-8">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-error">Bland-Altman: vs WS</h4>
              <span className="text-[10px] uppercase tracking-widest text-error">LOA &gt;22{'\u00B0'}F!</span>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Enormous limits of agreement (&gt;22{'\u00B0'}F width!) with a distinctive {'\u201C'}X{'\u201D'} pattern reflecting
              the phase-shifted diurnal cycle {'\u2014'} Kestrel reads higher by day and lower at night.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis dataKey="mean" type="number" name="Mean" domain={[55, 100]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: '(Kes + WS) / 2 (\u00B0F)', position: 'bottom', offset: 15, fontSize: 10 }} />
                <YAxis dataKey="diff" type="number" name="Difference" domain={[-25, 25]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: 'Kes \u2212 WS (\u00B0F)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }} />
                <ReferenceLine y={0} stroke={C.outlineVariant} />
                <ReferenceLine y={blandAltman!.ws.stats.mean_bias} stroke={C.error} strokeWidth={1.5}
                  label={{ value: `Bias: +${blandAltman!.ws.stats.mean_bias}\u00B0F`, position: 'right', fontSize: 9, fill: C.error }} />
                <ReferenceLine y={blandAltman!.ws.stats.loa_upper} stroke={C.error} strokeDasharray="6 4" />
                <ReferenceLine y={blandAltman!.ws.stats.loa_lower} stroke={C.error} strokeDasharray="6 4" />
                <Scatter data={blandAltman!.ws.points.slice(0, 600)} fill={C.error} fillOpacity={0.2} r={2} />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white p-3 border border-stone-100">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Mean Bias</p>
                <p className="text-sm font-bold text-error">+{blandAltman!.ws.stats.mean_bias}{'\u00B0'}F</p>
              </div>
              <div className="bg-white p-3 border border-stone-100">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">LOA Width</p>
                <p className="text-sm font-bold text-error">{blandAltman!.ws.stats.loa_width.toFixed(1)}{'\u00B0'}F</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-tertiary">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">science</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">What is Bland-Altman analysis?</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Unlike correlation (which only tests if two values <em>move together</em>), Bland-Altman tests if they
                <em> actually agree</em>. Two clocks can be perfectly correlated yet always 4 hours apart.
                The DEP Bland-Altman shows near-zero bias with a narrow band {'—'} genuine agreement.
                The WS plot shows a 22{'°'}F-wide band {'—'} the readings are <strong>not interchangeable</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* S4 DIURNAL PATTERN */}
      <section>
        <SectionHeader
          label="Critical Finding"
          title="The Rooftop Thermal Mass Effect"
          subtitle="The most important discovery in this analysis: the weather station at 35 Kneeland St has a completely inverted diurnal temperature cycle due to rooftop thermal mass."
        />
        <div className="bg-surface-container-low p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary">{t('q2.diurnalCycle')}</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Kestrel and DEP follow a classic solar pattern: coolest at 4{'\u2013'}5 AM (~69{'\u00B0'}F), warmest at 1{'\u2013'}2 PM (~80{'\u00B0'}F).
                The rooftop WS is <strong className="text-error">out of phase</strong>: coolest at 10 AM, warmest at 6 PM.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-error-container rounded-full shrink-0">
              <span className="material-symbols-outlined text-sm text-error">priority_high</span>
              <span className="text-[10px] font-bold text-error uppercase tracking-wide">{t('q2.criticalFinding')}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={diurnal} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.2} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                tickFormatter={(h: number) => `${h}:00`}
                label={{ value: 'Hour of Day', position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }} />
              <YAxis domain={[66, 82]} tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'Temperature (\u00B0F)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: C.onSurfaceVariant }} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                formatter={(v: any, name: any) => [`${Number(v).toFixed(1)}\u00B0F`, name]}
                labelFormatter={(h: any) => `${h}:00`} />
              <Line type="monotone" dataKey="kestrel" stroke={C.secondary} strokeWidth={2.5} dot={false} name={t('q2.kestrelGround')} />
              <Line type="monotone" dataKey="dep" stroke={C.tertiary} strokeWidth={2.5} dot={false} name={t('q2.depNubian')} />
              <Line type="monotone" dataKey="ws" stroke={C.error} strokeWidth={2} strokeDasharray="6 4" dot={false} name={t('q2.wsRooftop')} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center border-t border-outline-variant/20 pt-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-0.5 bg-secondary" />
              <span className="text-xs font-bold text-secondary">Kestrel {'\u2014'} peak ~2 PM</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-0.5 bg-tertiary" />
              <span className="text-xs font-bold text-tertiary">DEP Nubian {'\u2014'} tracks Kestrel</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-0.5 bg-error border-dashed border-t" />
              <span className="text-xs font-bold text-error">WS {'\u2014'} peak ~6 PM (4hr lag)</span>
            </div>
          </div>
        </div>

        {/* Hourly bias bar chart */}
        <div className="mt-6 bg-surface-container-low p-8">
          <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary mb-1">Hourly Bias Profile</h4>
          <p className="text-xs text-stone-500 mb-4">
            How much does each reference differ from Kestrel at every hour of the day?
            The WS bias swings from <strong className="text-error">{'\u2212'}9{'\u00B0'}F</strong> (morning) to <strong className="text-error">+5{'\u00B0'}F</strong> (evening).
            DEP bias stays within a narrow {'\u00B1'}2{'\u00B0'}F band.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyBias} margin={{ top: 5, right: 10, bottom: 25, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.2} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: C.onSurfaceVariant }}
                tickFormatter={(h: number) => `${h}h`}
                label={{ value: 'Hour', position: 'bottom', offset: 10, fontSize: 10 }} />
              <YAxis domain={[-10, 6]} tick={{ fontSize: 9, fill: C.onSurfaceVariant }}
                label={{ value: 'Bias (\u00B0F)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.surface, fontSize: 10 }}
                formatter={(v: any, name: any) => [`${v}\u00B0F`, name === 'dep' ? 'DEP Bias' : 'WS Bias']} />
              <ReferenceLine y={0} stroke={C.outlineVariant} />
              <Bar dataKey="dep" fill={C.tertiary} opacity={0.7} name="dep" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ws" fill={C.error} opacity={0.5} name="ws" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Temporal stratification cards */}
        {temporalStats && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Daytime (8\u201318h)', depVal: `${temporalStats.dayBiasDep >= 0 ? '+' : ''}${temporalStats.dayBiasDep.toFixed(1)}\u00B0F`, wsVal: `${temporalStats.dayBiasWs >= 0 ? '+' : ''}${temporalStats.dayBiasWs.toFixed(1)}\u00B0F` },
              { label: 'Nighttime (19\u20137h)', depVal: `${temporalStats.nightBiasDep >= 0 ? '+' : ''}${temporalStats.nightBiasDep.toFixed(1)}\u00B0F`, wsVal: `${temporalStats.nightBiasWs >= 0 ? '+' : ''}${temporalStats.nightBiasWs.toFixed(1)}\u00B0F` },
              { label: 'Peak Heat (10\u201316h)', depVal: '\u22122.1\u00B0F', wsVal: `${temporalStats.peakBiasWs >= 0 ? '+' : ''}${temporalStats.peakBiasWs.toFixed(1)}\u00B0F` },
              { label: 'Overall', depVal: '\u22120.37\u00B0F', wsVal: '+0.81\u00B0F' },
            ].map(s => (
              <div key={s.label} className="bg-white p-4 border border-stone-100">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">{s.label}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">DEP Bias</span>
                    <span className="font-bold text-tertiary">{s.depVal}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">WS Bias</span>
                    <span className="font-bold text-error">{s.wsVal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-xl mt-0.5">roofing</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">Why does this happen?</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Concrete roofing absorbs solar radiation during the day and releases stored heat at night,
                creating a <strong>~4-hour thermal lag</strong>. This produces a 13.5{'°'}F bias swing daily.
                When shifted by {'−'}4 hours, the WS correlation jumps from <strong>r = 0.42 {'→'} r = 0.998</strong>.
                The sensor is not faulty {'—'} it is measuring a different thermal environment than the ground.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* S5 SITE x HOUR HEATMAP */}
      {siteHourGrid.length > 0 && (
        <section>
          <SectionHeader
            label="Spatial \u00D7 Temporal"
            title="Temperature Bias by Site and Hour"
            subtitle="This heatmap reveals which site \u00D7 hour combinations have the largest discrepancy between Kestrel and DEP. Blue = Kestrel reads cooler; Red = Kestrel reads warmer."
          />
          <div className="bg-tertiary-container p-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-white">Site {'\u00D7'} Hour Bias Heatmap (vs DEP)</h4>
              <div className="flex items-center gap-4 text-[9px] text-white/70">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-3 rounded-sm" style={{ background: biasToRgb(-2.5) }} />
                  <span>{'\u2212'}2.5{'\u00B0'}F</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-3 rounded-sm" style={{ background: biasToRgb(0) }} />
                  <span>0{'\u00B0'}F</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-3 rounded-sm" style={{ background: biasToRgb(2.5) }} />
                  <span>+2.5{'\u00B0'}F</span>
                </div>
              </div>
            </div>

            <div className="grid gap-[2px] mb-[2px]" style={{ gridTemplateColumns: '120px repeat(24, 1fr)' }}>
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-[8px] text-center text-white/70">{h}</div>
              ))}
            </div>

            {siteHourGrid.map(({ site, cells }) => (
              <div key={site} className="grid gap-[2px] mb-[2px]" style={{ gridTemplateColumns: '120px repeat(24, 1fr)' }}>
                <div className="text-[9px] font-bold flex items-center pr-2 text-white/80 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0 mr-1.5" style={{ background: siteColor(site) }} />
                  {SITE_NAMES[site] ?? site}
                </div>
                {cells.map((cell, ci) => (
                  <div
                    key={ci}
                    className="aspect-[1.5] flex items-center justify-center rounded-[2px] text-[7px] font-bold cursor-default"
                    style={{
                      background: biasToRgb(cell.bias),
                      color: Math.abs(cell.bias) > 1.5 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)',
                    }}
                    title={`${SITE_NAMES[site] ?? site} at ${cell.hour}:00 \u2014 Bias: ${cell.bias >= 0 ? '+' : ''}${cell.bias.toFixed(2)}\u00B0F`}
                  >
                    {cell.bias.toFixed(1)}
                  </div>
                ))}
              </div>
            ))}

            <p className="text-[10px] text-white/70 mt-3">
              Morning hours (4{'\u2013'}9 AM) show uniform negative bias across all sites {'\u2014'} Kestrel reads cooler than DEP.
              Afternoon hours (14{'\u2013'}19h) show positive bias, especially at sites with more impervious surface (Oxford, Castle).
            </p>
          </div>

          <div className="mt-4 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-secondary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-xl mt-0.5">grid_view</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Oxford Place is consistently the warmest site</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Oxford Place reads <strong>+0.63{'°'}F warmer</strong> than the DEP reference at every hour of the day,
                  likely due to surrounding impervious surfaces that absorb and re-radiate heat.
                  In contrast, Eliot Norton and Berkeley Garden read <strong>~1{'°'}F cooler</strong> {'—'} these sites have more open
                  greenspace that promotes radiative and evaporative cooling.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* S6 SITE TABLE */}
      <section>
        <SectionHeader
          label="Site Performance"
          title="All 12 Sites: Agreement with DEP Nubian"
          subtitle="DEP correlations are uniformly strong (r = 0.88\u20130.93) across all sites. WS correlations are uniformly poor (r = 0.45\u20130.65). Site bias varies from \u22121.03\u00B0F (Eliot Norton) to +0.63\u00B0F (Oxford Place)."
        />
        <div className="bg-white shadow-sm overflow-hidden">
          <div className="px-8 py-5 bg-surface-container flex justify-between items-center">
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary">Site-Specific Performance</h4>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{siteTable.length} Sites</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/20">
                  {[t('q2.monitoringSite'), t('q2.rDep'), t('q2.biasF'), t('q2.rmseF'), t('q2.rWs'), t('q2.meanTemp'), t('q2.nObs')].map(h => (
                    <th key={h} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-500 ${h === 'N' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {siteTable.map((site: SiteRow, i: number) => (
                  <tr key={site.site_id} className={`hover:bg-surface-container-low transition-colors ${i % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                    <td className="px-6 py-4 font-[family-name:var(--font-family-headline)] font-bold text-stone-800">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: siteColor(site.site_id) }} />
                        {site.name}
                        {site.site_id === 'oxford' && <span className="bg-error text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter">{t('q2.warmest')}</span>}
                        {site.site_id === 'eliotnorton' && <span className="bg-tertiary text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter">{t('q2.coolest')}</span>}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-bold ${rColor(site.r_dep)}`}>{site.r_dep.toFixed(2)}</td>
                    <td className={`px-6 py-4 text-sm ${biasColor(site.bias_dep)}`}>{site.bias_dep >= 0 ? '+' : ''}{site.bias_dep.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">{site.rmse_dep.toFixed(1)}</td>
                    <td className="px-6 py-4 text-sm text-error">{site.r_ws.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">{site.mean_temp_f.toFixed(1)}{'\u00B0'}F</td>
                    <td className="px-6 py-4 text-xs text-stone-400 text-right">{site.n.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-tertiary">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">location_on</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">Site bias reflects real microclimate, not sensor error</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                The bias range ({'−'}1.03{'°'}F to +0.63{'°'}F) across 12 sites represents <strong>genuine spatial temperature
                variation</strong> within Chinatown. Sites surrounded by concrete and asphalt (Oxford Place) trap more heat;
                sites with greenspace (Eliot Norton, Berkeley) are cooler. A single reference station cannot capture this granularity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* S7 MODIFIER PANELS */}
      <section>
        <SectionHeader
          label="Environmental Drivers"
          title="What Influences Temperature Bias?"
          subtitle="Three factors shape the Kestrel\u2013DEP disagreement: rooftop physics (thermal mass lag), temporal consistency (rolling stability), and meteorological conditions (temperature \u00D7 humidity interaction)."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary text-on-primary p-8 relative overflow-hidden md:col-span-1">
            <div className="absolute -top-4 -right-4 opacity-10"><span className="material-symbols-outlined text-8xl">roofing</span></div>
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl mb-4">Rooftop Thermal Mass</h4>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Phase Lag</p>
                <p className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">4 hours</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Diurnal Bias Swing</p>
                <p className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">13.5{'\u00B0'}F</p>
              </div>
              <div className="border-t border-on-primary/20 pt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Zero-lag r</span>
                  <span className="font-bold">0.42</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Lag-corrected r</span>
                  <span className="font-bold text-on-primary-container">0.998</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] mt-6 opacity-70 leading-relaxed italic">
              Concrete roofing absorbs solar radiation during the day and releases stored heat at night {'\u2014'}
              creating the phase shift that makes this station appear {'\u201C'}inverted.{'\u201D'}
            </p>
          </div>

          <div className="bg-surface-container-low p-8">
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary mb-2">Rolling 7-Day Stability</h4>
            <p className="text-xs text-stone-500 mb-4">
              DEP correlation holds above r = 0.87 throughout the study {'\u2014'} no sensor drift detected.
              WS correlation fluctuates wildly (0.42{'\u2013'}0.73), a persistent structural issue.
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={rolling} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: C.onSurfaceVariant }} tickFormatter={(d: string) => d.slice(5)} interval={4} />
                <YAxis domain={[0.3, 1]} tick={{ fontSize: 8, fill: C.onSurfaceVariant }} />
                <Tooltip contentStyle={{ background: C.surface, fontSize: 10 }} />
                <ReferenceLine y={0.9} stroke={C.outlineVariant} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="r_dep" stroke={C.tertiary} strokeWidth={2} dot={false} name="r (DEP)" />
                <Line type="monotone" dataKey="r_ws" stroke={C.error} strokeWidth={1.5} dot={false} name="r (WS)" strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DEP Range</p>
                <p className="text-sm font-[family-name:var(--font-family-headline)] font-bold text-tertiary">0.87 {'\u2013'} 0.93</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">WS Range</p>
                <p className="text-sm font-[family-name:var(--font-family-headline)] font-bold text-error">0.42 {'\u2013'} 0.73</p>
              </div>
            </div>
          </div>

          {/* Temp x Humidity heatmap */}
          <div className="bg-tertiary-container p-8 flex flex-col justify-between">
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-white mb-1">Temp {'\u00D7'} Humidity Bias</h4>
            <p className="text-xs text-white/70 mb-3">
              Hot+dry {'\u2192'} positive bias (solar heating). Cool+humid {'\u2192'} negative bias (evaporative cooling).
            </p>
            <div className="my-2">
              <div className="grid grid-cols-7 gap-1 mb-1">
                <div />
                {tempBins.map(tb => <div key={tb} className="text-[8px] text-center text-white/70">{tb}{'\u00B0'}F</div>)}
              </div>
              {heatGrid.map((row, ri) => (
                <div key={ri} className="grid grid-cols-7 gap-1 mb-1">
                  <div className="text-[8px] flex items-center justify-end pr-1 text-white/70">{rhBins[ri]}</div>
                  {row.map((cell, ci) => (
                    <div key={ci}
                      className="aspect-square flex items-center justify-center rounded-sm text-[8px] font-bold cursor-default"
                      style={{
                        background: cell ? biasToRgb(cell.bias) : 'var(--md-sys-color-surface-container, #e8e0d0)',
                        color: cell && Math.abs(cell.bias) > 1.5 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
                      }}
                      title={cell ? `Temp: ${cell.temp}\u00B0F | Humidity: ${cell.humidity} | Bias: ${cell.bias >= 0 ? '+' : ''}${cell.bias.toFixed(2)}\u00B0F | n = ${cell.n.toLocaleString()}` : 'No data'}
                    >
                      {cell?.bias != null ? cell.bias.toFixed(1) : '\u2014'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              {[
                { bias: -2, label: '\u22122' },
                { bias: -1, label: '\u22121' },
                { bias: 0, label: '0' },
                { bias: 1, label: '+1' },
                { bias: 2, label: '+2' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ background: biasToRgb(l.bias) }} />
                  <span className="text-[8px] text-white/70">{l.label}{'\u00B0'}F</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* S8 UHI + GREENSPACE */}
      <section>
        <SectionHeader
          label="Environmental Justice"
          title="Urban Heat Island & Greenspace"
          subtitle="Chinatown\u2019s dense urban fabric creates measurable temperature differences across open spaces. Greenspace within 50 meters is the single strongest predictor of site-level temperature bias."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 border border-stone-100 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(45deg, rgba(0,62,47,0.04) 25%, transparent 25%, transparent 50%, rgba(0,62,47,0.04) 50%, rgba(0,62,47,0.04) 75%, transparent 75%, transparent)',
              backgroundSize: '40px 40px',
            }} />
            <div className="relative z-10 text-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-6">Urban Heat Island Effect</div>
              <div className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary tracking-tight">
                1.4{'\u00B0'}F
              </div>
              <p className="text-sm text-on-surface-variant mt-2">range across 12 sites</p>
              <div className="mt-8 pt-8 border-t border-stone-100 grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Hottest</div>
                  <div className="text-sm font-bold text-error">Castle Square {'\u2014'} 75.3{'\u00B0'}F</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Coolest</div>
                  <div className="text-sm font-bold text-tertiary">Mary Soo Hoo {'\u2014'} 73.9{'\u00B0'}F</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container p-10">
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary mb-4">Greenspace Association</h4>
            <p className="text-sm text-on-surface-variant mb-8">
              Greenspace within 50m is the strongest predictor of temperature bias between Kestrel and DEP.
              More green space = cooler readings relative to the reference.
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Greenspace vs DEP Bias (r)</span>
                <span className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-tertiary">{'\u2212'}0.84</span>
              </div>
              <div className="flex justify-between items-center bg-white/50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Statistical Significance</span>
                <span className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-tertiary">p = 0.001</span>
              </div>
              <div className="flex justify-between items-center py-2 px-4 border-t border-primary/20">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Heat Event Agreement (DEP)</span>
                <span className="text-sm font-[family-name:var(--font-family-headline)] font-bold text-tertiary">74.3%</span>
              </div>
              <div className="flex justify-between items-center py-2 px-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Heat Event Agreement (WS)</span>
                <span className="text-sm font-[family-name:var(--font-family-headline)] font-bold text-error">14.1%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-tertiary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">park</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Green space provides measurable cooling</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Sites with more greenspace read <strong>significantly cooler</strong> than the DEP reference (r = {'\u2212'}0.84, p = 0.001).
                  This means the official DEP monitor may <em>underestimate</em> the cooling benefits of green infrastructure {'\u2014'}
                  neighborhoods with less green space have temperatures that reference stations underestimate.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-secondary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-xl mt-0.5">thermostat</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">WBGT provides different information than temperature</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Despite air temperatures exceeding 90{'\u00B0'}F, <strong>WBGT never reached the OSHA caution threshold (80{'\u00B0'}F)</strong> during
                  the study. Temperature alone overstates heat stress risk when humidity is moderate.
                  For worker safety and public health decisions, WBGT is the more appropriate metric.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* S9 ASSET REGISTRY */}
      <section>
        <SectionHeader
          label="Sensor Fleet"
          title="Kestrel Fleet Registry"
          subtitle="Each Kestrel unit deployed across the 12 open-space sites, with real-time health scoring based on data completeness, sensor agreement, and measurement stability."
        />
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-widest text-tertiary font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /> {assets.length}/{assets.length} Online
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {assets.map((card) => {
            const borderColor = card.health >= 90 ? 'border-tertiary' : card.health >= 75 ? 'border-secondary' : 'border-error'
            const dotColor = card.health >= 90 ? 'bg-tertiary' : card.health >= 75 ? 'bg-secondary' : 'bg-error'
            return (
              <div key={card.id} className={`bg-white rounded-lg p-4 shadow-sm border-l-2 ${borderColor}`}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">{card.id}</span>
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                </div>
                <h6 className="text-sm font-bold truncate">{card.name}</h6>
                <div className="mt-2 text-[10px] text-stone-400">
                  r(DEP): <span className={`font-bold ${rColor(card.r_dep)}`}>{card.r_dep.toFixed(2)}</span> | Bias: <span className={biasColor(card.bias_dep)}>{card.bias_dep >= 0 ? '+' : ''}{card.bias_dep.toFixed(2)}{'\u00B0'}F</span>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>Health</span>
                    <span>{card.health}%</span>
                  </div>
                  <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                    <div className={`h-full ${healthColor(card.health)} rounded-full`} style={{ width: `${card.health}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* S10 KEY FINDINGS */}
      <section>
        <SectionHeader
          label="Conclusions"
          title="Key Findings & Implications"
          subtitle="Summary of findings from the temperature sensor comparison analysis, with actionable recommendations for researchers, city planners, and community members."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            {
              icon: 'verified', title: 'DEP Nubian is the gold standard',
              text: `Kestrel\u2013DEP correlation is strong (r = 0.90) with small bias (\u22120.37\u00B0F). The relationship is stable across all 12 sites and throughout the study.`,
              color: 'text-tertiary',
            },
            {
              icon: 'warning', title: 'WS 35 Kneeland is unsuitable',
              text: `Rooftop thermal mass creates a 4-hour phase lag with 13.5\u00B0F daily bias swing. Zero-lag r = 0.60; lag-corrected r = 0.998.`,
              color: 'text-error',
            },
            {
              icon: 'landscape', title: `1.4\u00B0F urban heat island detected`,
              text: `Castle Square is 1.4\u00B0F warmer than Mary Soo Hoo. Driven by impervious surface and shade patterns \u2014 invisible to single reference stations.`,
              color: 'text-primary',
            },
            {
              icon: 'park', title: 'Greenspace is the #1 predictor',
              text: `r = \u22120.84 (p = 0.001) between greenspace and bias. More green = cooler. The official monitor may underestimate cooling from green infrastructure.`,
              color: 'text-secondary',
            },
          ].map(f => (
            <div key={f.title} className="bg-white p-6 border border-stone-100 flex gap-4 items-start">
              <span className={`material-symbols-outlined text-2xl ${f.color} shrink-0 mt-0.5`}
                style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              <div>
                <p className="font-bold text-sm mb-1">{f.title}</p>
                <p className="text-xs text-stone-500 leading-relaxed">{f.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: 'science', title: 'For Researchers',
              items: ['Use DEP Nubian as the reference', 'WS is acceptable for daily averages only', 'Never use WS for time-resolved analyses'],
            },
            {
              icon: 'location_city', title: 'For City Planners',
              items: ['Rooftop stations misrepresent ground-level heat', 'Invest in ground-level monitoring networks', 'Essential for heat equity assessments'],
            },
            {
              icon: 'groups', title: 'For Community Members',
              items: [`Official WS temperature may differ from reality by 5\u20138\u00B0F`, 'Ground-level sensors capture your actual experience', 'Greenspace provides measurable cooling benefits'],
            },
          ].map(imp => (
            <div key={imp.title} className="bg-surface-container-low p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-lg text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}>{imp.icon}</span>
                <h5 className="font-[family-name:var(--font-family-headline)] font-bold text-sm text-primary">{imp.title}</h5>
              </div>
              <ul className="space-y-2">
                {imp.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-stone-500">
                    <span className="material-symbols-outlined text-tertiary text-sm mt-0.5 shrink-0">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-secondary">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-xl mt-0.5">info</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">Limitations</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                This is a single summer study (Jul{'–'}Aug 2023) {'—'} seasonal generalization is limited.
                With 12 sites, land-use analyses are exploratory (low statistical power).
                No direct solar radiation measurements were taken {'—'} we cannot fully separate radiative from convective heating effects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EXECUTIVE QUOTE */}
      <footer className="bg-primary p-12 text-on-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <span className="material-symbols-outlined text-[144px]">format_quote</span>
        </div>
        <div className="relative z-10 max-w-3xl">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 text-on-primary-container">Executive Summary</h3>
          <blockquote className="text-3xl font-[family-name:var(--font-family-headline)] italic leading-snug">
            {'\u201C'}Using a rooftop sensor for ground-level heat is like checking the temperature in your attic
            to decide what to wear outside. The DEP Nubian monitor is the true reference {'\u2014'} and our Kestrel
            network reveals a 1.4{'\u00B0'}F urban heat island that no single station can capture.{'\u201D'}
          </blockquote>
          <div className="mt-8 flex items-center gap-6">
            <div className="w-12 h-px bg-on-primary-container" />
            <div className="text-sm font-bold uppercase tracking-widest">Tufts Environmental Research Collaboration</div>
            <button
              onClick={() => setShowReport(true)}
              className="bg-on-primary text-primary px-6 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:scale-105 transition-transform flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              Read Mini Report
            </button>
          </div>
        </div>
      </footer>
      {showReport && (
        <ReportViewer
          reportPath="/reports/Q2.md"
          title="Q2 — Temperature Sensor Comparison"
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
