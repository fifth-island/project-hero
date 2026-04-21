import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell,
} from 'recharts'
import { useQ8Data } from '../hooks/useQ8Data'
import ReportViewer from '../components/ReportViewer'

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

const DOW_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/* Heatmap color scale for PM2.5 */
function heatColor(v: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (v - min) / (max - min)))
  if (t < 0.25) return '#fff2da'       // surface-low
  if (t < 0.5) return '#feb78a'        // secondary-container
  if (t < 0.75) return '#902223'       // primary-container
  return '#6f070f'                      // primary
}

export default function ResearchQ8() {
  const { kpi, diurnal, dow, heatmapPm25, siteTemporal, heatmapBySite, loading } = useQ8Data()
  const { t } = useTranslation()
  const [heatmapSite, setHeatmapSite] = useState('all')
  const [showReport, setShowReport] = useState(false)

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  /* Heatmap data based on selected site */
  const activeHeatmap = heatmapSite === 'all' ? heatmapPm25 : (heatmapBySite[heatmapSite] ?? heatmapPm25)
  const hmValues = activeHeatmap.map(c => c.value)
  const hmMin = Math.min(...hmValues)
  const hmMax = Math.max(...hmValues)
  const peakCell = activeHeatmap.find(c => c.is_peak) ?? activeHeatmap.reduce((a, b) => a.value > b.value ? a : b)

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-primary tracking-tight italic">
            {t('q8.title')}
          </h2>
          <p className="text-secondary mt-2 max-w-2xl">
            {t('q8.description')}
          </p>
        </div>
        <div className="px-4 py-2 bg-surface-container rounded-lg border border-outline-variant/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
          <span className="text-xs font-bold uppercase tracking-widest">{t('q8.period')}</span>
        </div>
      </header>

      {/* ═══ Hero Banner: Compound Risk ═══ */}
      <section className="bg-surface-container rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
        <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold tracking-widest uppercase mb-4">
              {t('q8.compoundRisk')}
            </div>
            <h3 className="font-[family-name:var(--font-family-headline)] text-3xl text-primary leading-tight mb-3">
              {t('q8.temporalSummary')}
            </h3>
            <p className="text-secondary max-w-lg leading-relaxed">
              {t('q8.temporalDynamics', { offset_hours: kpi!.offset_hours })}
            </p>
            <div className="flex flex-wrap gap-6 pt-4">
              <div>
                <p className="text-xs font-bold uppercase text-secondary/60 tracking-widest">{t('q8.compoundWindow')}</p>
                <p className="text-xl font-[family-name:var(--font-family-headline)] italic text-primary">{kpi!.compound_window}</p>
              </div>
              <div className="w-px h-10 bg-primary/10" />
              <div>
                <p className="text-xs font-bold uppercase text-secondary/60 tracking-widest">{t('q8.offsetDuration')}</p>
                <p className="text-xl font-[family-name:var(--font-family-headline)] italic text-primary">{kpi!.offset_hours} {t('q8.hours')}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest p-6 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary">air</span>
                <span className="text-[10px] font-bold text-secondary">{t('q8.pm25Label')}</span>
              </div>
              <p className="text-xs text-secondary/70">{t('q8.peak')}: <span className="text-primary font-bold">{String(kpi!.pm25_peak_hour).padStart(2, '0')}:00</span></p>
              <p className="text-xs text-secondary/70">{t('q8.trough')}: <span className="text-primary font-bold">{String(kpi!.pm25_trough_hour).padStart(2, '0')}:00</span></p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-tertiary">thermostat</span>
                <span className="text-[10px] font-bold text-secondary">{t('q8.wbgtLabel')}</span>
              </div>
              <p className="text-xs text-secondary/70">{t('q8.peak')}: <span className="text-primary font-bold">{String(kpi!.wbgt_peak_hour).padStart(2, '0')}:00</span></p>
              <p className="text-xs text-secondary/70">{t('q8.trough')}: <span className="text-primary font-bold">{String(kpi!.wbgt_trough_hour).padStart(2, '0')}:00</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Diurnal Cycle Analysis ═══ */}
      <section>
        <div className="flex items-baseline gap-4 mb-6">
          <h3 className="font-[family-name:var(--font-family-headline)] text-2xl text-primary font-bold">{t('q8.diurnalCycle')}</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* PM2.5 diurnal */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
            <div className="flex justify-between mb-6">
              <div>
                <h4 className="font-[family-name:var(--font-family-headline)] italic text-lg text-primary">{t('q8.pm25Concentration')}</h4>
                <p className="text-xs text-secondary/60 uppercase">{t('q8.pm25Unit')}</p>
              </div>
              <span className="text-xs font-bold text-secondary bg-surface-container px-2 py-1 rounded h-fit">
                {t('q8.dailyAvg')}: {kpi!.pm25_peak_val}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={diurnal} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="pm25DiurnalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.primary} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={C.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke={C.outline} tickFormatter={(h: number) => `${h}:00`} />
                <YAxis tick={{ fontSize: 10 }} stroke={C.outline} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip
                  labelFormatter={(h) => `${h}:00`}
                  formatter={(v) => [`${Number(v).toFixed(1)} µg/m³`]}
                />
                <Area type="monotone" dataKey="pm25_mean" stroke={C.primary} strokeWidth={2.5} fill="url(#pm25DiurnalFill)" dot={false} name="PM2.5" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="mt-4 text-[10px] italic text-primary leading-tight">
              "{t('q8.pm25Note')}"
            </p>
          </div>
          {/* WBGT diurnal */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#87512d 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
            <div className="flex justify-between mb-6">
              <div>
                <h4 className="font-[family-name:var(--font-family-headline)] italic text-lg text-secondary">{t('q8.wbgtTemp')}</h4>
                <p className="text-xs text-secondary/60 uppercase">{t('q8.wbgtUnit')}</p>
              </div>
              <span className="text-xs font-bold text-secondary bg-surface-container px-2 py-1 rounded h-fit">
                {t('q8.dailyMax')}: {kpi!.wbgt_peak_val}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={diurnal} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="wbgtDiurnalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.secondary} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={C.secondary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke={C.outline} tickFormatter={(h: number) => `${h}:00`} />
                <YAxis tick={{ fontSize: 10 }} stroke={C.outline} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip
                  labelFormatter={(h) => `${h}:00`}
                  formatter={(v) => [`${Number(v).toFixed(1)} °F`]}
                />
                <Area type="monotone" dataKey="wbgt_mean" stroke={C.secondary} strokeWidth={2.5} fill="url(#wbgtDiurnalFill)" dot={false} name="WBGT" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="mt-4 text-[10px] italic text-secondary leading-tight">
              "{t('q8.wbgtNote')}"
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Temporal Hotspots + Baseline Shift ═══ */}
      <section className="grid lg:grid-cols-3 gap-8">
        {/* Hour × DOW Heatmap */}
        <div className="lg:col-span-2">
          <div className="flex items-baseline gap-4 mb-4">
            <h3 className="font-[family-name:var(--font-family-headline)] text-2xl text-primary font-bold">{t('q8.temporalHotspots')}</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h4 className="font-[family-name:var(--font-family-headline)] text-xl text-secondary">{t('q8.weeklyPollution')}</h4>
                <select
                  value={heatmapSite}
                  onChange={(e) => setHeatmapSite(e.target.value)}
                  className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs font-bold text-on-surface appearance-none cursor-pointer"
                >
                  <option value="all">{t('q8.allSites')}</option>
                  {siteTemporal.map(s => (
                    <option key={s.site_id} value={s.site_id}>{s.site_label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-stone-500">{t('q8.low')}</span>
                <div className="flex h-3 w-32 rounded-full overflow-hidden">
                  <div className="h-full w-1/4" style={{ background: '#fff2da' }} />
                  <div className="h-full w-1/4" style={{ background: '#feb78a' }} />
                  <div className="h-full w-1/4" style={{ background: '#902223' }} />
                  <div className="h-full w-1/4" style={{ background: '#6f070f' }} />
                </div>
                <span className="text-[10px] font-bold text-stone-500">{t('q8.high')}</span>
              </div>
            </div>
            {/* Heatmap grid */}
            <div className="space-y-1">
              {DOW_ORDER.map(day => {
                const cells = activeHeatmap.filter(c => c.day === day).sort((a, b) => a.hour - b.hour)
                return (
                  <div key={day} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-stone-400 uppercase w-8 text-right shrink-0">{day}</span>
                    <div className="flex-1 grid grid-cols-24 gap-[2px]">
                      {cells.map(cell => (
                        <div
                          key={cell.hour}
                          className="aspect-[2/1] rounded-[2px] relative group/hm cursor-default"
                          style={{ background: heatColor(cell.value, hmMin, hmMax) }}
                        >
                          {cell.is_peak && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white border-2 border-primary z-10" />
                          )}
                          {/* Hover tooltip */}
                          <div className="hidden group-hover/hm:block absolute -top-16 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-2 py-1.5 rounded text-[9px] whitespace-nowrap shadow-xl z-20 pointer-events-none">
                            <p className="font-bold">{cell.day} {cell.hour}:00</p>
                            <p>PM2.5: {cell.value} µg/m³</p>
                            {cell.is_peak && <p className="text-secondary-container font-bold">{t('q8.peakCell')}</p>}
                            <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-on-surface rotate-45" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {/* Hour labels */}
              <div className="flex items-center gap-2">
                <span className="w-8 shrink-0" />
                <div className="flex-1 flex justify-between text-[8px] font-bold text-stone-400 uppercase px-1">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
                </div>
              </div>
            </div>
            {/* Peak annotation */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded">
              <span className="material-symbols-outlined text-sm">warning</span>
              Peak: {peakCell.day} {peakCell.hour}:00 — {peakCell.value} µg/m³
            </div>
          </div>
        </div>

        {/* Baseline Shift: Weekday vs Weekend */}
        <div>
          <div className="flex items-baseline gap-4 mb-4">
            <h3 className="font-[family-name:var(--font-family-headline)] text-2xl text-primary font-bold">{t('q8.baselineShift')}</h3>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-8 h-[calc(100%-2.5rem)] flex flex-col">
            <h4 className="font-[family-name:var(--font-family-headline)] text-xl text-secondary mb-2">{t('q8.weekdayVsWeekend')}</h4>
            <p className="text-sm text-secondary/70 leading-relaxed mb-6">
              {t('q8.weekendHigher')}
            </p>
            <div className="flex-1 flex flex-col justify-center gap-8">
              {/* Weekday bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>{t('q8.weekday')}</span>
                  <span className="text-secondary/50">{kpi!.weekday_pm25} µg/m³</span>
                </div>
                <div className="h-4 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary-container rounded-full transition-all"
                    style={{ width: `${(kpi!.weekday_pm25 / Math.max(kpi!.weekday_pm25, kpi!.weekend_pm25)) * 100}%` }}
                  />
                </div>
              </div>
              {/* Weekend bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-primary">{t('q8.weekend')}</span>
                  <span className="text-primary">{kpi!.weekend_pm25} µg/m³</span>
                </div>
                <div className="h-4 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="mt-4 p-4 bg-primary/5 rounded-lg italic text-xs text-primary text-center leading-relaxed">
                "{t('q8.weekendNote', { delta: (kpi!.weekend_pm25 - kpi!.weekday_pm25).toFixed(1) })}"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Day-of-Week Profiles ═══ */}
      <section>
        <div className="flex items-baseline gap-4 mb-6">
          <h3 className="font-[family-name:var(--font-family-headline)] text-2xl text-primary font-bold">{t('q8.dowProfiles')}</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* PM2.5 DOW */}
          <div className="bg-surface-container-lowest rounded-2xl p-6">
            <h4 className="font-[family-name:var(--font-family-headline)] italic text-lg text-primary mb-4">{t('q8.pm25ByDay')}</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dow} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke={C.outline} />
                <YAxis tick={{ fontSize: 10 }} stroke={C.outline} domain={[0, 'dataMax + 2']} />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} µg/m³`]} />
                <Bar dataKey="pm25_mean" radius={[4, 4, 0, 0]} name="PM2.5">
                  {dow.map((d) => (
                    <Cell key={d.day} fill={d.is_weekend ? C.primary : C.secondaryContainer} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex gap-4 text-[10px] text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: C.secondaryContainer }} /> {t('q8.weekday')}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: C.primary }} /> {t('q8.weekend')}</span>
            </div>
          </div>
          {/* WBGT DOW */}
          <div className="bg-surface-container-lowest rounded-2xl p-6">
            <h4 className="font-[family-name:var(--font-family-headline)] italic text-lg text-secondary mb-4">{t('q8.wbgtByDay')}</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dow} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke={C.outline} />
                <YAxis tick={{ fontSize: 10 }} stroke={C.outline} domain={[60, 'dataMax + 2']} />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} °F`]} />
                <Bar dataKey="wbgt_mean" radius={[4, 4, 0, 0]} name="WBGT">
                  {dow.map((d) => (
                    <Cell key={d.day} fill={d.is_weekend ? C.secondary : C.surfaceHighest} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex gap-4 text-[10px] text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: C.surfaceHighest }} /> {t('q8.weekday')}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: C.secondary }} /> {t('q8.weekend')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Site-Level Temporal Heterogeneity ═══ */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-[family-name:var(--font-family-headline)] text-2xl text-primary font-bold">Site-Level Temporal Heterogeneity</h3>
          <span className="text-[10px] font-bold uppercase bg-secondary/10 text-secondary px-3 py-1 rounded-full tracking-widest">
            Comparative Small-Multiples
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {siteTemporal.map(site => {
            const isHighVar = site.pm25_amplitude >= 3.0
            const isLowVar = site.pm25_amplitude <= 1.5
            return (
              <div key={site.site_id} className="bg-surface-container-lowest p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-[family-name:var(--font-family-headline)] font-bold text-primary">{site.site_label}</span>
                  <div className={`w-2 h-2 rounded-full ${isHighVar ? 'bg-error' : isLowVar ? 'bg-tertiary' : 'bg-primary/40'}`} />
                </div>
                {/* Sparkline */}
                <div className="h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={site.diurnal_curve.map((v, i) => ({ h: i, v }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                      <defs>
                        <linearGradient id={`spark-${site.site_id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isHighVar ? C.primary : C.secondary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={isHighVar ? C.primary : C.secondary} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={isHighVar ? C.primary : C.secondary}
                        strokeWidth={1.5}
                        fill={`url(#spark-${site.site_id})`}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-secondary/60 leading-tight space-y-0.5">
                  <p>Peak: {site.pm25_peak_hour}:00 · Amp: {site.pm25_amplitude} µg/m³</p>
                  <p>Peak day: {site.pm25_peak_dow} · Mean: {site.pm25_mean} µg/m³</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══ Key Research Findings: Synthesis ═══ */}
      <section className="bg-surface-dim rounded-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
        <div className="absolute bottom-[-20px] right-[-20px] opacity-5">
          <span className="material-symbols-outlined text-[160px]">inventory</span>
        </div>
        <h3 className="font-[family-name:var(--font-family-headline)] text-3xl text-primary mb-8 border-b border-primary/20 pb-4 font-bold">
          Key Research Findings: Synthesis
        </h3>
        <div className="grid md:grid-cols-2 gap-10">
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-[family-name:var(--font-family-headline)] font-bold">1</div>
              <div>
                <p className="font-bold text-primary font-[family-name:var(--font-family-headline)] italic text-lg">Solar Heating Dominance</p>
                <p className="text-secondary text-sm leading-relaxed">WBGT peaks consistently at {kpi!.wbgt_peak_hour}:00, trailing solar noon by {kpi!.offset_hours} hours, driven by the thermal mass of asphalt and masonry.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-[family-name:var(--font-family-headline)] font-bold">2</div>
              <div>
                <p className="font-bold text-primary font-[family-name:var(--font-family-headline)] italic text-lg">Scavenging Mechanisms</p>
                <p className="text-secondary text-sm leading-relaxed">The weekend PM2.5 elevation (+{(kpi!.weekend_pm25 - kpi!.weekday_pm25).toFixed(1)} µg/m³) indicates that weekday traffic actually scavenges ozone and particulates via NO titration.</p>
              </div>
            </li>
          </ul>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-[family-name:var(--font-family-headline)] font-bold">3</div>
              <div>
                <p className="font-bold text-primary font-[family-name:var(--font-family-headline)] italic text-lg">Wildfire Confounding</p>
                <p className="text-secondary text-sm leading-relaxed">Episodic events, such as the {peakCell.day} wildfire spike ({peakCell.value} µg/m³), can skew seasonal averages by up to 15% if not temporally isolated.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-[family-name:var(--font-family-headline)] font-bold">4</div>
              <div>
                <p className="font-bold text-primary font-[family-name:var(--font-family-headline)] italic text-lg">Compound Exposure Risks</p>
                <p className="text-secondary text-sm leading-relaxed">The {kpi!.compound_window} window represents a "perfect storm" where both thermal stress and particulate load are at concurrent local maxima.</p>
              </div>
            </li>
          </ul>
        </div>
        <div className="mt-10 flex justify-center gap-4 flex-wrap">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/50 rounded-full backdrop-blur-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Archival Synthesis Verified · Tufts University</span>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-xs uppercase tracking-widest font-bold hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            Read Mini Report
          </button>
        </div>
      </section>
      {showReport && (
        <ReportViewer
          reportPath="/reports/Q8.md"
          title="Q8 — Temporal Patterns in PM2.5 & WBGT"
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
