import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, ReferenceLine, ErrorBar,
} from 'recharts'
import { useQ7HetData } from '../hooks/useQ7HetData'

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
}

const SITE_COLORS: Record<string, string> = {
  tufts: '#2196f3', berkley: '#4caf50', castle: '#ff9800',
  chin: '#9c27b0', greenway: '#607d8b', taitung: '#e91e63',
  reggie: '#00bcd4', dewey: '#8bc34a', lyndenboro: '#ff5722',
  oxford: '#795548', eliotnorton: '#f44336', msh: '#ffc107',
}

type HetView = 'sensitivity' | 'response' | 'scatter' | 'trajectory'

export default function ResearchQ7Het() {
  const { t } = useTranslation()
  const { kpi, pm25Dist, wbgtDist, binned, sensitivity, trajectories, siteScatter, siteLines, loading } = useQ7HetData()
  const [activeView, setActiveView] = useState<HetView>('sensitivity')
  const [selectedSites, setSelectedSites] = useState<string[]>([])

  // Top 5 + bottom 2 for response curves
  const featuredSites = useMemo(() => {
    if (!sensitivity.length) return []
    const top = sensitivity.slice(0, 5).map(s => s.site_id)
    const bot = sensitivity.slice(-2).map(s => s.site_id)
    return [...new Set([...top, ...bot])]
  }, [sensitivity])

  const activeSites = selectedSites.length > 0 ? selectedSites : featuredSites

  // Binned data pivoted for line chart
  const binnedByBin = useMemo(() => {
    const map = new Map<number, Record<string, number>>()
    for (const row of binned) {
      if (!activeSites.includes(row.site_id)) continue
      let rec = map.get(row.wbgt_bin)
      if (!rec) { rec = { wbgt_bin: row.wbgt_bin }; map.set(row.wbgt_bin, rec) }
      rec[row.site_id] = row.pm25_mean
    }
    return Array.from(map.values()).sort((a, b) => a.wbgt_bin - b.wbgt_bin)
  }, [binned, activeSites])

  // Slope bar data with error bars
  const slopeData = useMemo(() =>
    sensitivity.map(s => ({
      ...s,
      errLo: s.slope - s.slope_ci_lo,
      errHi: s.slope_ci_hi - s.slope,
    }))
  , [sensitivity])

  // Scatter lines as array of points for recharts Line
  const lineSegments = useMemo(() =>
    siteLines.map(l => ({
      site_id: l.site_id,
      site_label: l.site_label,
      points: [{ wbgt: l.x1, pm25: l.y1 }, { wbgt: l.x2, pm25: l.y2 }],
      slope: l.slope,
      r: l.r,
    }))
  , [siteLines])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  const views: { key: HetView; label: string; icon: string }[] = [
    { key: 'sensitivity', label: t('q7het.slopeStrength'), icon: 'compare_arrows' },
    { key: 'response', label: t('q7het.responseCurves'), icon: 'timeline' },
    { key: 'scatter', label: t('q7het.siteScatter'), icon: 'bubble_chart' },
    { key: 'trajectory', label: t('q7het.diurnalPaths'), icon: 'route' },
  ]

  const toggleSite = (sid: string) => {
    setSelectedSites(prev => {
      if (prev.length === 0) {
        // initialize from featured, then toggle
        const base = new Set(featuredSites)
        if (base.has(sid)) base.delete(sid); else base.add(sid)
        return Array.from(base)
      }
      return prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary mb-2">{t('q7het.title')}</h1>
            <p className="text-secondary max-w-2xl font-[family-name:var(--font-family-headline)] italic text-lg">
              {t('q7het.description', { fold_diff: kpi!.fold_diff })}
            </p>
          </div>
          <div className="bg-surface-container-highest/50 backdrop-blur-sm p-4 rounded-lg border border-primary/10 shrink-0 text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">{t('q7het.sitesAnalyzed')}</span>
            <span className="text-xl font-black text-primary">{kpi!.n_sites}</span>
            <span className="text-[10px] text-stone-400 block">{t('q7het.sitesAnalyzedDesc')}</span>
          </div>
        </div>
      </header>

      {/* ═══ KPI Grid ═══ */}
      <section className="grid grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q7het.corrRange')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.range_r[0]} – {kpi!.range_r[1]}</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q7het.corrRangeDesc', { fold_diff: kpi!.fold_diff })}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q7het.cv')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-secondary">{kpi!.cv_r}%</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q7het.cvDesc', { mean: kpi!.mean_r, std: kpi!.std_r })}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q7het.strongest')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">r = {kpi!.strongest_r}</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{kpi!.strongest_site}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q7het.weakest')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold" style={{ color: C.outline }}>r = {kpi!.weakest_r}</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{kpi!.weakest_site}</p>
        </div>
      </section>

      {/* ═══ Foundational EDA: PM2.5 + WBGT Distributions ═══ */}
      <section className="grid grid-cols-2 gap-8">
        {/* PM2.5 Distribution by Site */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-1">Foundational EDA</h3>
          <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-6">{t('q7het.pm25Dist')}</h2>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pm25Dist} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10 }} label={{ value: 'PM2.5 (µg/m³)', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                <YAxis type="category" dataKey="site_label" tick={{ fontSize: 10 }} width={95} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                  formatter={(v, name) => {
                    const labels: Record<string, string> = { q1: t('q7het.q1'), median: t('q7het.medianLabel'), q3: t('q7het.q3'), max: t('q7het.p95cap'), mean: t('q7het.meanLabel') }
                    return [Number(v).toFixed(1) + ' µg/m³', labels[String(name)] || String(name)]
                  }}
                />
                <Bar dataKey="q1" stackId="box" fill={C.outlineVariant} opacity={0.3} />
                <Bar dataKey="median" stackId="box" fill={C.primary} opacity={0.7}>
                  {pm25Dist.map(d => <Cell key={d.site_id} fill={SITE_COLORS[d.site_id] || C.primary} opacity={0.8} />)}
                </Bar>
                <Bar dataKey="q3" stackId="box" fill={C.outlineVariant} opacity={0.2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 bg-surface-container-highest/30 p-4 rounded-lg">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <span className="material-symbols-outlined text-xs align-text-bottom mr-1" style={{ color: C.primary }}>info</span>
              Median PM2.5 ranges from <strong>{pm25Dist[pm25Dist.length - 1]?.mean}</strong> to <strong>{pm25Dist[0]?.mean} µg/m³</strong> across sites — sites with higher baseline pollution may show different heat–PM2.5 coupling.
            </p>
          </div>
        </div>

        {/* WBGT Distribution by Site */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-1">Foundational EDA</h3>
          <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-6">{t('q7het.wbgtDist')}</h2>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wbgtDist} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10 }} domain={[50, 'auto']} label={{ value: 'WBGT (°F)', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                <YAxis type="category" dataKey="site_label" tick={{ fontSize: 10 }} width={95} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                  formatter={(v, name) => {
                    const labels: Record<string, string> = { q1: t('q7het.q1'), median: t('q7het.medianLabel'), q3: t('q7het.q3'), max: 'Max', mean: t('q7het.meanLabel') }
                    return [Number(v).toFixed(1) + '°F', labels[String(name)] || String(name)]
                  }}
                />
                <Bar dataKey="q1" stackId="box" fill={C.outlineVariant} opacity={0.3} />
                <Bar dataKey="median" stackId="box" fill={C.tertiary} opacity={0.7}>
                  {wbgtDist.map(d => <Cell key={d.site_id} fill={SITE_COLORS[d.site_id] || C.tertiary} opacity={0.8} />)}
                </Bar>
                <Bar dataKey="q3" stackId="box" fill={C.outlineVariant} opacity={0.2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 bg-surface-container-highest/30 p-4 rounded-lg">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <span className="material-symbols-outlined text-xs align-text-bottom mr-1" style={{ color: C.tertiary }}>info</span>
              WBGT exposure is relatively uniform (median ≈ 65–67°F) — suggesting that <strong>heterogeneity in PM2.5 response</strong> is driven more by local pollution dynamics than thermal exposure differences.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ View Switcher ═══ */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">Heterogeneity Explorer</h2>
            <p className="text-sm text-on-surface-variant mt-1">{t('q7het.fourLenses')}</p>
          </div>
          <div className="flex gap-2 bg-surface-container-highest/30 p-1 rounded-lg">
            {views.map(v => (
              <button key={v.key}
                onClick={() => setActiveView(v.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${activeView === v.key ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                <span className="material-symbols-outlined text-sm">{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── View: Slope & Strength ── */}
        {activeView === 'sensitivity' && (
          <div className="space-y-8">
            {/* Correlation ranking */}
            <div>
              <h3 className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-4">{t('q7het.corrStrength')}</h3>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sensitivity} layout="vertical" margin={{ left: 110, right: 30, top: 5, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 0.7]}
                      label={{ value: 'Pearson r', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                    <YAxis type="category" dataKey="site_label" tick={{ fontSize: 10 }} width={105} />
                    <ReferenceLine x={kpi!.mean_r} stroke={C.primary} strokeDasharray="6 4" strokeWidth={1.5}
                      label={{ value: `Mean ${kpi!.mean_r}`, position: 'top', fontSize: 9, fill: C.primary }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                      formatter={(v) => [Number(v).toFixed(3), 'Pearson r']}
                    />
                    <Bar dataKey="r" radius={[0, 4, 4, 0]}>
                      {sensitivity.map(s => (
                        <Cell key={s.site_id} fill={SITE_COLORS[s.site_id] || C.primary} opacity={s.r >= kpi!.mean_r ? 0.9 : 0.5} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Slope with CI */}
            <div>
              <h3 className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-4">{t('q7het.regressionSlope')}</h3>
              <p className="text-xs text-on-surface-variant mb-4">{t('q7het.slopeDesc')}</p>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={slopeData} layout="vertical" margin={{ left: 110, right: 30, top: 5, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 0.7]}
                      label={{ value: 'Slope (µg/m³ per °F)', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                    <YAxis type="category" dataKey="site_label" tick={{ fontSize: 10 }} width={105} />
                    <ReferenceLine x={kpi!.mean_slope} stroke={C.secondary} strokeDasharray="6 4" strokeWidth={1.5}
                      label={{ value: `Mean ${kpi!.mean_slope}`, position: 'top', fontSize: 9, fill: C.secondary }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                      formatter={(v, name) => {
                        if (name === 'slope') return [`+${Number(v).toFixed(3)} µg/m³ per °F`, 'Slope']
                        return [Number(v).toFixed(3), String(name)]
                      }}
                    />
                    <Bar dataKey="slope" radius={[0, 4, 4, 0]}>
                      <ErrorBar dataKey="errHi" direction="x" width={4} strokeWidth={1.5} stroke={C.onSurface} />
                      {slopeData.map(s => (
                        <Cell key={s.site_id} fill={SITE_COLORS[s.site_id] || C.secondary} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Insight callout */}
            <div className="bg-surface-container-highest/30 p-6 rounded-xl border-l-4 border-primary">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">psychology</span>
                <div>
                  <h4 className="text-sm font-bold text-on-surface mb-1">Key Finding</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    <strong>{kpi!.strongest_site}</strong> (r = {kpi!.strongest_r}, slope = {sensitivity[0]?.slope}) shows the tightest PM2.5–heat coupling — each °F of WBGT increase yields nearly <strong>+{sensitivity[0]?.slope} µg/m³</strong>.
                    In contrast, <strong>{kpi!.weakest_site}</strong> (r = {kpi!.weakest_r}) shows minimal coupling, suggesting local factors like building shading or ventilation patterns may decouple the heat–pollution relationship.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── View: Response Curves ── */}
        {activeView === 'response' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-on-surface">PM2.5 Response to WBGT Bins</h3>
              <span className="text-xs text-on-surface-variant">(mean PM2.5 within 2.5°F WBGT bins)</span>
            </div>

            {/* Site filter chips */}
            <div className="flex flex-wrap gap-2">
              {sensitivity.map(s => (
                <button key={s.site_id}
                  onClick={() => toggleSite(s.site_id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                    activeSites.includes(s.site_id) ? 'border-transparent text-white shadow-sm' : 'border-outline-variant/30 text-on-surface-variant bg-white'
                  }`}
                  style={activeSites.includes(s.site_id) ? { backgroundColor: SITE_COLORS[s.site_id] } : undefined}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SITE_COLORS[s.site_id] }} />
                  {s.site_label}
                </button>
              ))}
            </div>

            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={binnedByBin} margin={{ left: 20, right: 20, top: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                  <XAxis dataKey="wbgt_bin" tick={{ fontSize: 10 }} domain={[55, 'auto']}
                    label={{ value: 'WBGT Bin Center (°F)', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }}
                    label={{ value: 'Mean PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                    formatter={(v, name) => {
                      const label = sensitivity.find(s => s.site_id === String(name))?.site_label || String(name)
                      return [Number(v).toFixed(1) + ' µg/m³', label]
                    }}
                    labelFormatter={(l) => `WBGT: ${l}°F`}
                  />
                  {activeSites.map(sid => (
                    <Line key={sid} type="monotone" dataKey={sid}
                      stroke={SITE_COLORS[sid]} strokeWidth={2.5} dot={{ r: 3, fill: SITE_COLORS[sid] }}
                      connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-surface-container-highest/30 p-6 rounded-xl border-l-4 border-secondary">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary text-xl mt-0.5">trending_up</span>
                <div>
                  <h4 className="text-sm font-bold text-on-surface mb-1">Response Divergence</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    At low WBGT (55–60°F), PM2.5 levels are similarly low across all sites. As heat stress increases, <strong>response curves diverge dramatically</strong> — high-sensitivity sites like Berkeley Garden reach {'>'}12 µg/m³ while low-sensitivity sites remain under 8 µg/m³. This fan-shaped pattern confirms that heat acts as an <strong>amplifier of pre-existing spatial inequality</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── View: Site Scatter ── */}
        {activeView === 'scatter' && (
          <div className="space-y-6">
            <h3 className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-on-surface">Per-Site Scatter with Regression Lines</h3>

            {/* Site filter chips */}
            <div className="flex flex-wrap gap-2">
              {sensitivity.map(s => (
                <button key={s.site_id}
                  onClick={() => toggleSite(s.site_id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                    activeSites.includes(s.site_id) ? 'border-transparent text-white shadow-sm' : 'border-outline-variant/30 text-on-surface-variant bg-white'
                  }`}
                  style={activeSites.includes(s.site_id) ? { backgroundColor: SITE_COLORS[s.site_id] } : undefined}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SITE_COLORS[s.site_id] }} />
                  {s.site_label} (r={s.r})
                </button>
              ))}
            </div>

            <div className="h-[480px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                  <XAxis dataKey="wbgt" type="number" tick={{ fontSize: 10 }} domain={[50, 'auto']} name="WBGT"
                    label={{ value: 'WBGT (°F)', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="pm25" type="number" tick={{ fontSize: 10 }} name="PM2.5"
                    label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                    formatter={(v, name) => {
                      if (name === 'WBGT') return [Number(v).toFixed(1) + '°F', 'WBGT']
                      return [Number(v).toFixed(1) + ' µg/m³', 'PM2.5']
                    }}
                  />
                  <Scatter data={siteScatter.filter(p => activeSites.includes(p.site_id))} opacity={0.35}>
                    {siteScatter.filter(p => activeSites.includes(p.site_id)).map((p, i) => (
                      <Cell key={i} fill={SITE_COLORS[p.site_id] || C.outline} />
                    ))}
                  </Scatter>
                  {/* Regression lines */}
                  {lineSegments.filter(l => activeSites.includes(l.site_id)).map(l => (
                    <Scatter key={`line-${l.site_id}`} data={l.points} line={{ stroke: SITE_COLORS[l.site_id], strokeWidth: 2.5 }}
                      shape={() => null} legendType="none" />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-surface-container-highest/30 p-6 rounded-xl border-l-4 border-tertiary">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">scatter_plot</span>
                <div>
                  <h4 className="text-sm font-bold text-on-surface mb-1">Spatial Spread</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    The steeper regression lines (Berkeley, Chin Park) mean PM2.5 <strong>escalates faster</strong> with heat stress at these sites. The flat lines (Mary Soo Hoo, Lyndboro) suggest local buffering factors — possibly tree canopy, building geometry, or distance from roadway emissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── View: Diurnal Trajectory ── */}
        {activeView === 'trajectory' && (
          <div className="space-y-6">
            <h3 className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-on-surface">Diurnal WBGT → PM2.5 Trajectories</h3>
            <p className="text-xs text-on-surface-variant">Each line traces a site through 24 hours: morning (low WBGT) → afternoon peak → evening cool-down. Steeper loops = stronger coupling.</p>

            {/* Site filter chips */}
            <div className="flex flex-wrap gap-2">
              {sensitivity.map(s => (
                <button key={s.site_id}
                  onClick={() => toggleSite(s.site_id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                    activeSites.includes(s.site_id) ? 'border-transparent text-white shadow-sm' : 'border-outline-variant/30 text-on-surface-variant bg-white'
                  }`}
                  style={activeSites.includes(s.site_id) ? { backgroundColor: SITE_COLORS[s.site_id] } : undefined}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SITE_COLORS[s.site_id] }} />
                  {s.site_label}
                </button>
              ))}
            </div>

            <div className="h-[480px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                  <XAxis dataKey="wbgt_mean" type="number" tick={{ fontSize: 10 }} domain={[50, 'auto']} name="WBGT"
                    label={{ value: 'Mean WBGT (°F)', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="pm25_mean" type="number" tick={{ fontSize: 10 }} name="PM2.5"
                    label={{ value: 'Mean PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                    formatter={(v, name) => {
                      if (name === 'WBGT') return [Number(v).toFixed(1) + '°F', 'Mean WBGT']
                      return [Number(v).toFixed(1) + ' µg/m³', 'Mean PM2.5']
                    }}
                  />
                  {activeSites.map(sid => {
                    const pts = trajectories.filter(t => t.site_id === sid).sort((a, b) => a.hour - b.hour)
                    return (
                      <Scatter key={sid} data={pts}
                        line={{ stroke: SITE_COLORS[sid], strokeWidth: 2 }}
                        fill={SITE_COLORS[sid]} opacity={0.7}
                      />
                    )
                  })}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-surface-container-highest/30 p-6 rounded-xl border-l-4 border-primary">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">wb_twilight</span>
                <div>
                  <h4 className="text-sm font-bold text-on-surface mb-1">Diurnal Hysteresis</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Sites with <strong>wide loops</strong> (large horizontal extent) experience the full WBGT range and show corresponding PM2.5 escalation. <strong>Tight clusters</strong> indicate sites where either thermal exposure is buffered or PM2.5 responds weakly to temperature swings — key evidence for understanding which sites need cooling interventions vs. emission controls.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══ Detailed Ranking Table ═══ */}
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-8 pb-4">
          <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">Complete Site Sensitivity Ranking</h2>
          <p className="text-sm text-on-surface-variant mt-1">All {kpi!.n_sites} sites ranked by correlation strength with 95% confidence intervals</p>
        </div>
        <table className="w-full">
          <thead className="bg-surface-container-high/30 text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4 text-left">Rank</th>
              <th className="px-6 py-4 text-left">Site</th>
              <th className="px-6 py-4 text-left">r</th>
              <th className="px-6 py-4 text-left">R²</th>
              <th className="px-6 py-4 text-left">Slope</th>
              <th className="px-6 py-4 text-left">95% CI</th>
              <th className="px-6 py-4 text-left">Resid σ</th>
              <th className="px-6 py-4 text-left">PM2.5 µ</th>
              <th className="px-6 py-4 text-left">n</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {sensitivity.map((s, i) => (
              <tr key={s.site_id} className="hover:bg-surface-container/30 transition-colors">
                <td className="px-6 py-3 font-bold text-stone-400">#{i + 1}</td>
                <td className="px-6 py-3">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SITE_COLORS[s.site_id] }} />
                    <span className="font-bold">{s.site_label}</span>
                  </span>
                </td>
                <td className="px-6 py-3 font-[family-name:var(--font-family-headline)] font-bold text-primary">{s.r}</td>
                <td className="px-6 py-3">{s.r_squared}</td>
                <td className="px-6 py-3 font-bold">+{s.slope}</td>
                <td className="px-6 py-3 text-xs text-on-surface-variant">[{s.slope_ci_lo}, {s.slope_ci_hi}]</td>
                <td className="px-6 py-3">{s.residual_std}</td>
                <td className="px-6 py-3">{s.pm25_mean} µg/m³</td>
                <td className="px-6 py-3 text-stone-500">{s.n.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ═══ Research Synthesis Footer ═══ */}
      <footer className="bg-primary text-on-primary p-12 rounded-2xl relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <span className="material-symbols-outlined text-[200px]">diversity_3</span>
        </div>
        <div className="max-w-4xl relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="material-symbols-outlined text-4xl">diversity_3</span>
            <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">Heterogeneity Synthesis</h3>
          </div>
          <p className="font-[family-name:var(--font-family-headline)] italic text-lg leading-relaxed text-on-primary-container mb-8">
            The {kpi!.fold_diff}× variation in heat–PM2.5 coupling across {kpi!.n_sites} sites reveals a deeply unequal environmental risk landscape in Chinatown.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">Unequal Burden</h4>
              <p className="text-sm leading-relaxed">
                {kpi!.strongest_site} faces a <strong>+{sensitivity[0]?.slope} µg/m³ per °F</strong> escalation rate — {((sensitivity[0]?.slope / sensitivity[sensitivity.length - 1]?.slope) || 1).toFixed(1)}× steeper than {kpi!.weakest_site}. Residents at high-sensitivity sites breathe significantly worse air during heat events.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">Local Drivers</h4>
              <p className="text-sm leading-relaxed">
                Since WBGT exposure is similar across sites, the heterogeneity likely stems from <strong>local built environment</strong> factors: canyon effects, vegetation cover, proximity to emission sources, and ventilation patterns.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">Targeted Action</h4>
              <p className="text-sm leading-relaxed">
                The top 5 most sensitive sites ({sensitivity.slice(0, 5).map(s => s.site_label.split(' ')[0]).join(', ')}) should be prioritized for <strong>green infrastructure</strong> investment and heat-triggered air quality advisories.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
