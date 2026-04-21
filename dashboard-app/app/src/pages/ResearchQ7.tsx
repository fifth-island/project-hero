import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ZAxis, Cell, BarChart, Bar, ReferenceLine,
} from 'recharts'
import { useQ7Data } from '../hooks/useQ7Data'
import ReportViewer from '../components/ReportViewer'

const C = {
  primary: '#6f070f',
  primaryContainer: '#902223',
  secondary: '#87512d',
  secondaryContainer: '#feb78a',
  tertiary: '#003e2f',
  tertiaryContainer: '#005744',
  surface: '#fff8f1',
  surfaceContainer: '#ffecc3',
  onSurface: '#241a00',
  onSurfaceVariant: '#58413f',
  outline: '#8b716f',
  outlineVariant: '#dfbfbc',
  error: '#ba1a1a',
}

const SITE_COLORS: Record<string, string> = {
  tufts: '#2196f3', berkley: '#4caf50', castle: '#ff9800',
  chin: '#9c27b0', greenway: '#607d8b', taitung: '#e91e63',
  reggie: '#00bcd4', dewey: '#8bc34a', lyndenboro: '#ff5722',
  oxford: '#795548', eliotnorton: '#f44336', msh: '#ffc107',
}

const SITE_LABELS: Record<string, string> = {
  tufts: 'Tufts Garden', berkley: 'Berkeley Garden', castle: 'Castle Square',
  chin: 'Chin Park', greenway: 'One Greenway', taitung: 'Tai Tung',
  reggie: 'Reggie Wong', dewey: 'Dewey Square', lyndenboro: 'Lyndboro Park',
  oxford: 'Oxford Place', eliotnorton: 'Eliot Norton', msh: 'Mary Soo Hoo',
}

type ChartView = 'overall' | 'density' | 'site' | 'hour'

/** Color scale for hour-of-day (purple→blue→yellow→orange→red→purple) */
function hourColor(h: number): string {
  // Night (0-5): deep purple/blue
  if (h < 6) return `hsl(${260 - h * 8}, 70%, ${30 + h * 3}%)`
  // Morning (6-11): blue → green
  if (h < 12) return `hsl(${210 - (h - 6) * 20}, 65%, ${45 + (h - 6) * 3}%)`
  // Afternoon (12-17): yellow → orange → red
  if (h < 18) return `hsl(${50 - (h - 12) * 8}, 80%, ${55 - (h - 12) * 2}%)`
  // Evening (18-23): red → purple
  return `hsl(${10 - (h - 18) * 10 + 300}, 65%, ${40 + (h - 18) * 2}%)`
}

/** Density count → color */
function densityColor(count: number, maxCount: number): string {
  const t = Math.min(count / maxCount, 1)
  if (t < 0.15) return '#fef9e7'
  if (t < 0.3) return '#fdebd0'
  if (t < 0.5) return '#f5b041'
  if (t < 0.7) return '#e67e22'
  if (t < 0.85) return '#c0392b'
  return '#6f070f'
}

export default function ResearchQ7() {
  const { kpi, scatter, regressionLine, density, siteStats, hourly, siteScatter, loading } = useQ7Data()
  const { t } = useTranslation()
  const [activeView, setActiveView] = useState<ChartView>('overall')
  const [highlightSite, setHighlightSite] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)

  const maxDensity = useMemo(() => Math.max(...density.map(d => d.count), 1), [density])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  const views: { key: ChartView; label: string; icon: string }[] = [
    { key: 'overall', label: t('q7.viewOverall'), icon: 'show_chart' },
    { key: 'density', label: t('q7.viewDensity'), icon: 'grid_on' },
    { key: 'site', label: t('q7.viewSite'), icon: 'location_on' },
    { key: 'hour', label: t('q7.viewHour'), icon: 'schedule' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary mb-2">{t('q7.title')}</h1>
            <p className="text-secondary max-w-2xl font-[family-name:var(--font-family-headline)] italic text-lg">
              {t('q7.description')}
            </p>
          </div>
          <div className="bg-surface-container-highest/50 backdrop-blur-sm p-4 rounded-lg border border-primary/10 shrink-0 text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">{t('q7.observations')}</span>
            <span className="text-xl font-black text-primary">{kpi!.n_obs.toLocaleString()}</span>
            <span className="text-[10px] text-stone-400 block">{t('q7.completePairs')}</span>
          </div>
        </div>
      </header>

      {/* ═══ KPI Grid ═══ */}
      <section className="grid grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q7.pearsonCorr')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">r = {kpi!.pearson_r}</h3>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q7.moderatePositive')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q7.varianceExplained')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-secondary">R² = {kpi!.r_squared}</h3>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q7.varianceDesc', { pct: (kpi!.r_squared * 100).toFixed(1) })}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q7.effectSize')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">+{kpi!.slope}</h3>
            <span className="text-xs text-stone-500">{t('q7.perDegree')}</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q7.linearSlope')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q7.siteHeterogeneity')}</p>
          <div>
            <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.weakest_r} — {kpi!.strongest_r}</h3>
            <span className="text-xs text-stone-500">{t('q7.corrRange', { pct: kpi!.corr_cv })}</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q7.foldVariation')}</p>
        </div>
      </section>

      {/* ═══ Four-View Correlation Explorer ═══ */}
      <section className="bg-white rounded-xl overflow-hidden">
        {/* View selector tabs */}
        <div className="flex border-b border-outline-variant/20">
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${
                activeView === v.key
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-on-surface-variant hover:text-primary/70 hover:bg-surface-container/30'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* ─── Overall Relationship ─── */}
          {activeView === 'overall' && (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">{t('q7.viewOverall')}</h3>
                  <p className="text-sm text-on-surface-variant">n = {kpi!.n_obs.toLocaleString()} · r = {kpi!.pearson_r} · R² = {kpi!.r_squared}</p>
                </div>
                <div className="bg-surface-container px-4 py-2 rounded-lg text-xs">
                  <span className="font-bold text-primary">{t('q7.regressionEq', { intercept: kpi!.intercept, slope: kpi!.slope })}</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
                  <XAxis dataKey="wbgt" type="number" name="WBGT" unit="°F" tick={{ fontSize: 10 }} stroke={C.outline} domain={[50, 'auto']}
                    label={{ value: 'WBGT (°F)', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                  <YAxis dataKey="pm25" type="number" name="PM2.5" unit=" µg/m³" tick={{ fontSize: 10 }} stroke={C.outline}
                    label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                  <Tooltip
                    formatter={(v, name) => [
                      `${v}${String(name) === 'WBGT' ? '°F' : ' µg/m³'}`,
                      String(name),
                    ]}
                    wrapperStyle={{ zIndex: 50 }}
                  />
                  <Scatter data={scatter} fill={C.primary} fillOpacity={0.25} r={2.5} />
                  {/* Regression line as two-point scatter with line type */}
                  <Scatter data={regressionLine} fill="none" line={{ stroke: C.error, strokeWidth: 2.5 }} legendType="none" r={0} />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-surface-container p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">analytics</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{t('q7.moderateAssociation')}</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {t('q7.perDegreeDesc', { slope: kpi!.slope })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-tertiary/5 border border-tertiary/15 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">health_and_safety</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-1">{t('q7.compoundRisk')}</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        The positive correlation means <strong>hotter days carry a double burden</strong>: both heat stress and elevated pollution. Residents face compound health risks on days when WBGT is highest, compounding cardiovascular and respiratory strain.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Joint Density Distribution ─── */}
          {activeView === 'density' && (
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">{t('q7.jointDensity')}</h3>
                <p className="text-sm text-on-surface-variant">{t('q7.jointDensityDesc')}</p>
              </div>
              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
                  <XAxis dataKey="wbgt" type="number" name="WBGT" unit="°F" tick={{ fontSize: 10 }} stroke={C.outline} domain={[50, 'auto']}
                    label={{ value: 'WBGT (°F)', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                  <YAxis dataKey="pm25" type="number" name="PM2.5" unit=" µg/m³" tick={{ fontSize: 10 }} stroke={C.outline}
                    label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                  <ZAxis dataKey="count" range={[80, 400]} />
                  <Tooltip
                    formatter={(v, name) => {
                      if (String(name) === 'count') return [`${v} observations`, 'Count']
                      return [`${v}${String(name) === 'WBGT' ? '°F' : ' µg/m³'}`, String(name)]
                    }}
                    wrapperStyle={{ zIndex: 50 }}
                  />
                  <Scatter data={density} shape="square">
                    {density.map((d, i) => (
                      <Cell key={i} fill={densityColor(d.count, maxDensity)} fillOpacity={0.85} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              {/* Color legend */}
              <div className="mt-4 flex items-center gap-2 justify-center">
                <span className="text-[9px] font-bold text-stone-500">LOW</span>
                <div className="flex h-3 w-48 rounded-full overflow-hidden">
                  {['#fef9e7', '#fdebd0', '#f5b041', '#e67e22', '#c0392b', '#6f070f'].map(c => (
                    <div key={c} className="h-full flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-[9px] font-bold text-stone-500">HIGH</span>
              </div>
              <div className="mt-6 bg-surface-container p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm mt-0.5">hub</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">{t('q7.concentrationHotspot')}</p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {t('q7.densityDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Colored by Site ─── */}
          {activeView === 'site' && (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">{t('q7.coloredBySite')}</h3>
                  <p className="text-sm text-on-surface-variant">{t('q7.siteHetDesc')}</p>
                </div>
                {/* Site filter */}
                <div className="flex flex-wrap gap-1.5 max-w-md justify-end">
                  <button
                    onClick={() => setHighlightSite(null)}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all border ${
                      highlightSite === null ? 'border-primary/40 bg-primary/10 text-primary' : 'border-transparent text-stone-400 hover:text-stone-600'
                    }`}
                  >All</button>
                  {Object.entries(SITE_LABELS).map(([sid, label]) => (
                    <button
                      key={sid}
                      onClick={() => setHighlightSite(highlightSite === sid ? null : sid)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border ${
                        highlightSite === sid
                          ? 'border-primary/40 bg-surface-container shadow-sm'
                          : highlightSite === null
                            ? 'border-transparent opacity-70 hover:opacity-100'
                            : 'border-transparent opacity-25 hover:opacity-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SITE_COLORS[sid] }} />
                      {label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
                  <XAxis dataKey="wbgt" type="number" name="WBGT" unit="°F" tick={{ fontSize: 10 }} stroke={C.outline} domain={[50, 'auto']}
                    label={{ value: 'WBGT (°F)', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                  <YAxis dataKey="pm25" type="number" name="PM2.5" unit=" µg/m³" tick={{ fontSize: 10 }} stroke={C.outline}
                    label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                  <Tooltip
                    formatter={(v, name) => [
                      `${v}${String(name) === 'WBGT' ? '°F' : ' µg/m³'}`,
                      String(name),
                    ]}
                    wrapperStyle={{ zIndex: 50 }}
                  />
                  <Scatter data={siteScatter} r={2.5}>
                    {siteScatter.map((pt, i) => (
                      <Cell
                        key={i}
                        fill={SITE_COLORS[pt.site_id] ?? C.outline}
                        fillOpacity={highlightSite === null ? 0.4 : highlightSite === pt.site_id ? 0.7 : 0.04}
                        r={highlightSite === pt.site_id ? 3.5 : 2.5}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              {/* Site correlation ranking bar */}
              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">{t('q7.siteCorrelationRanking')}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={siteStats} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.2} />
                    <XAxis dataKey="site_label" tick={{ fontSize: 8, angle: -35, textAnchor: 'end' }} stroke={C.outline} interval={0} height={60} />
                    <YAxis tick={{ fontSize: 10 }} stroke={C.outline} domain={[0, 0.7]} />
                    <Tooltip formatter={(v) => [`r = ${v}`, 'Correlation']} wrapperStyle={{ zIndex: 50 }} />
                    <ReferenceLine y={kpi!.pearson_r} stroke={C.primary} strokeDasharray="4 4" strokeWidth={1.5} />
                    <Bar dataKey="correlation" radius={[4, 4, 0, 0]} barSize={20}>
                      {siteStats.map((s, i) => (
                        <Cell
                          key={i}
                          fill={SITE_COLORS[s.site_id] ?? C.outline}
                          fillOpacity={highlightSite === null || highlightSite === s.site_id ? 0.85 : 0.15}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[9px] text-stone-400 text-center mt-1">Dashed line = network average (r = {kpi!.pearson_r})</p>
              </div>
              <div className="mt-4 bg-surface-container p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-sm mt-0.5">compare_arrows</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{t('q7.siteHeterogeneity')}</p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      <strong>{kpi!.strongest_site}</strong> (r = {kpi!.strongest_r}) shows the tightest PM2.5–heat coupling — nearly <strong>2.7× stronger</strong> than <strong>{kpi!.weakest_site}</strong> (r = {kpi!.weakest_r}). Sites with less tree canopy and more impervious surface tend to show stronger correlations, suggesting urban heat island effects amplify particulate trapping.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Colored by Hour ─── */}
          {activeView === 'hour' && (
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">{t('q7.coloredByHour')}</h3>
                <p className="text-sm text-on-surface-variant">{t('q7.temporalVariation')}</p>
              </div>
              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
                  <XAxis dataKey="wbgt" type="number" name="WBGT" unit="°F" tick={{ fontSize: 10 }} stroke={C.outline} domain={[50, 'auto']}
                    label={{ value: 'WBGT (°F)', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                  <YAxis dataKey="pm25" type="number" name="PM2.5" unit=" µg/m³" tick={{ fontSize: 10 }} stroke={C.outline}
                    label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as { wbgt: number; pm25: number; hour: number; site_label: string }
                      return (
                        <div className="bg-white shadow-lg border border-outline-variant/20 rounded-lg px-3 py-2 text-xs">
                          <p className="font-bold">{d.site_label}</p>
                          <p>WBGT: {d.wbgt}°F · PM2.5: {d.pm25} µg/m³</p>
                          <p className="text-stone-500">Hour: {d.hour}:00</p>
                        </div>
                      )
                    }}
                  />
                  <Scatter data={scatter} r={2.5}>
                    {scatter.map((pt, i) => (
                      <Cell key={i} fill={hourColor(pt.hour)} fillOpacity={0.5} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              {/* Hour color legend */}
              <div className="mt-4 flex items-center gap-1 justify-center">
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="flex flex-col items-center">
                    <div className="w-3 h-4 rounded-sm" style={{ backgroundColor: hourColor(h) }} />
                    {h % 4 === 0 && <span className="text-[7px] text-stone-400 mt-0.5">{h}h</span>}
                  </div>
                ))}
              </div>
              {/* Hourly means trajectory */}
              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Hourly Mean Trajectory (WBGT → PM2.5)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
                    <XAxis dataKey="wbgt_mean" type="number" name="WBGT" unit="°F" tick={{ fontSize: 10 }} stroke={C.outline} domain={[50, 'auto']}
                      label={{ value: 'Mean WBGT (°F)', position: 'insideBottom', offset: -10, fontSize: 10 }} />
                    <YAxis dataKey="pm25_mean" type="number" name="PM2.5" unit=" µg/m³" tick={{ fontSize: 10 }} stroke={C.outline}
                      label={{ value: 'Mean PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload as { hour: number; wbgt_mean: number; pm25_mean: number }
                        return (
                          <div className="bg-white shadow-lg border border-outline-variant/20 rounded-lg px-3 py-2 text-xs">
                            <p className="font-bold">{d.hour}:00</p>
                            <p>WBGT: {d.wbgt_mean}°F · PM2.5: {d.pm25_mean} µg/m³</p>
                          </div>
                        )
                      }}
                    />
                    <Scatter data={hourly} r={5}>
                      {hourly.map((h, i) => (
                        <Cell key={i} fill={hourColor(h.hour)} fillOpacity={0.85} stroke={hourColor(h.hour)} strokeWidth={1} />
                      ))}
                    </Scatter>
                    {/* Connect dots with a line */}
                    <Scatter data={hourly} fill="none" line={{ stroke: C.outline, strokeWidth: 1, strokeDasharray: '3 3' }} r={0} legendType="none" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-surface-container p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm mt-0.5">wb_sunny</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Daytime Heat–Pollution Nexus</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Afternoon hours (12–17h) cluster in the <strong>upper-right quadrant</strong> — highest WBGT and highest PM2.5. Solar heating drives both photochemical PM2.5 formation and heat stress simultaneously.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-tertiary/5 border border-tertiary/15 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">dark_mode</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-1">Nighttime Decoupling</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Late-night points (0–5h) sit in the <strong>lower-left</strong> — low WBGT, low PM2.5. The hourly trajectory traces a clear <strong>clockwise loop</strong>, revealing PM2.5 lags behind temperature by 1–2 hours as particulates accumulate post-peak heat.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Site Comparison Table ═══ */}
      <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden">
        <div className="px-8 py-6 bg-surface-container-low border-b border-outline-variant/20">
          <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">Site-Level Regression Summary</h3>
        </div>
        <table className="w-full">
          <thead className="bg-surface-container-high/30 text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4 text-left">Rank</th>
              <th className="px-6 py-4 text-left">Site</th>
              <th className="px-6 py-4 text-left">r</th>
              <th className="px-6 py-4 text-left">R²</th>
              <th className="px-6 py-4 text-left">Slope</th>
              <th className="px-6 py-4 text-left">Mean PM2.5</th>
              <th className="px-6 py-4 text-left">Mean WBGT</th>
              <th className="px-6 py-4 text-left">n</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {siteStats.map((s, i) => (
              <tr key={s.site_id} className="hover:bg-surface-container/30 transition-colors">
                <td className="px-6 py-3 font-bold text-stone-400">#{i + 1}</td>
                <td className="px-6 py-3">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SITE_COLORS[s.site_id] }} />
                    <span className="font-bold">{s.site_label}</span>
                  </span>
                </td>
                <td className="px-6 py-3 font-[family-name:var(--font-family-headline)] font-bold text-primary">{s.correlation}</td>
                <td className="px-6 py-3">{s.r_squared}</td>
                <td className="px-6 py-3">{s.slope}</td>
                <td className="px-6 py-3">{s.pm25_mean} µg/m³</td>
                <td className="px-6 py-3">{s.wbgt_mean}°F</td>
                <td className="px-6 py-3 text-stone-500">{s.n.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ═══ Research Synthesis Footer ═══ */}
      <footer className="bg-primary text-on-primary p-12 rounded-2xl relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <span className="material-symbols-outlined text-[200px]">science</span>
        </div>
        <div className="max-w-4xl relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="material-symbols-outlined text-4xl">science</span>
            <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">Research Synthesis</h3>
          </div>
          <p className="font-[family-name:var(--font-family-headline)] italic text-lg leading-relaxed text-on-primary-container mb-8">
            Root-cause evidence linking heat stress and particulate matter — a compound environmental risk in Chinatown.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">Mechanism</h4>
              <p className="text-sm leading-relaxed">
                Higher WBGT drives photochemical PM2.5 production and reduces atmospheric dispersion, creating a <strong>+{kpi!.slope} µg/m³ per °F</strong> feedback loop.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">Spatial Equity</h4>
              <p className="text-sm leading-relaxed">
                The <strong>2.7× variation</strong> in correlation strength across sites means some locations face disproportionate compound risk — an environmental justice concern requiring targeted intervention.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">Policy Implication</h4>
              <p className="text-sm leading-relaxed">
                Heat action plans should incorporate <strong>air quality advisories</strong>. Sites like {kpi!.strongest_site} need prioritized green infrastructure to break the heat–pollution coupling.
              </p>
            </div>
          </div>
          <div className="mt-8">
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
          reportPath="/reports/Q7.md"
          title="Q7 — PM2.5 & Heat Stress Relationship"
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
