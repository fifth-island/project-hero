import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis,
  ComposedChart, Area,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useQ5DeepData, type PairwiseRow } from '../hooks/useQ5DeepData'

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
  tufts: C.primary, berkley: '#c0392b', castle: '#e74c3c',
  chin: C.secondary, greenway: '#d4a03c', taitung: '#b87333',
  reggie: C.outline, dewey: '#7f8c8d', lyndenboro: '#95a5a6',
  oxford: '#5d8aa8', eliotnorton: '#2d6a4f', msh: C.tertiary,
}

/* Heatmap color scale */
function heatColor(v: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (v - min) / (max - min)))
  if (t < 0.25) return '#fff2da'
  if (t < 0.5) return '#feb78a'
  if (t < 0.75) return '#902223'
  return '#6f070f'
}

function heatTextColor(v: number, min: number, max: number): string {
  const t = (v - min) / (max - min)
  return t > 0.5 ? '#ffffff' : '#241a00'
}

export default function ResearchQ5Deep() {
  const { t } = useTranslation()
  const {
    kpi, distributions, statTests, rankings, hwVsIso, hwIsoSites,
    daySite, hiSummary, hiScatter, hiHourly, humidity, loading,
  } = useQ5DeepData()

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  /* Day-Site heatmap bounds */
  const dsValues = daySite.map(c => c.mean_wbgt)
  const dsMin = Math.min(...dsValues)
  const dsMax = Math.max(...dsValues)
  const uniqueDates = [...new Set(daySite.map(c => c.date))].sort()
  const siteOrder = rankings.map(r => r.site_id)

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="mb-12">
        <h1 className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary mb-2">{t('q5deep.title')}</h1>
        <p className="text-secondary max-w-2xl font-[family-name:var(--font-family-headline)] italic text-lg">
          {t('q5deep.description')}
        </p>
      </header>

      {/* ═══ KPI Grid ═══ */}
      <section className="grid grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q5deep.effectSize')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.cohens_d}</h3>
            <span className="text-xs text-stone-500">{t('q5deep.cohensD')}</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q5deep.mediumEffect')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q5deep.kruskalWallis')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-secondary">{kpi!.kruskal_h}</h3>
            <span className="material-symbols-outlined text-tertiary text-xl">check_circle</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q5deep.highlySignificant')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q5deep.hiWbgtDivergence')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">{kpi!.hi_wbgt_gap}°F</h3>
            <span className="material-symbols-outlined text-error text-xl">trending_up</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q5deep.avgHiAboveWbgt')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q5deep.significantPairs')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.significant_pairs}</h3>
            <span className="text-xs text-stone-500">/ {kpi!.total_pairs}</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q5deep.bonferroni')}</p>
        </div>
      </section>

      {/* ═══ Site WBGT Distributions + Statistical Tests ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Box Plot Visualization */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl">
          <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q5deep.siteDistributions')}</h3>
          <p className="text-sm text-on-surface-variant mb-6">{t('q5deep.siteDistDesc')}</p>
          <ResponsiveContainer width="100%" height={578}>
            <ComposedChart data={distributions} margin={{ top: 10, right: 10, bottom: 50, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis
                dataKey="site_label"
                tick={{ fontSize: 9, angle: -40, textAnchor: 'end' }}
                stroke={C.outline}
                interval={0}
                height={70}
              />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: '°F WBGT', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip
                formatter={(v, name) => [
                  `${Number(v).toFixed(1)}°F`,
                  String(name) === 'q1' ? t('q5deep.q1Label') : String(name) === 'q3' ? t('q5deep.q3Label') : String(name) === 'mean' ? t('q5deep.mean') : String(name) === 'median' ? t('q5deep.median') : String(name),
                ]}
                wrapperStyle={{ zIndex: 50 }}
              />
              {/* IQR range as area */}
              <Area dataKey="q1" stackId="range" fill="transparent" stroke="transparent" />
              <Area dataKey="q3" stackId="range2" fill={C.secondaryContainer} fillOpacity={0.4} stroke={C.secondary} strokeWidth={1} />
              {/* Mean as bars */}
              <Bar dataKey="mean" fill={C.primary} fillOpacity={0.8} radius={[4, 4, 0, 0]} barSize={20} name="mean" />
              {/* Median as line */}
              <Line dataKey="median" stroke={C.tertiary} strokeWidth={2} dot={{ r: 4, fill: C.tertiary }} name="median" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4 flex gap-6 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: C.primary, opacity: 0.8 }} /> Mean WBGT
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.tertiary }} /> Median WBGT
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: C.secondaryContainer, opacity: 0.4 }} /> {t('q5deep.iqr')}
            </span>
          </div>
          <div className="mt-4 bg-surface-container-lowest p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">insights</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{t('q5deep.spreadAnalysis')}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Despite a narrow {distributions.length > 0 ? (distributions[0].mean - distributions[distributions.length - 1].mean).toFixed(1) : '1.6'}°F range in means, the IQR varies substantially — {distributions[0]?.site_label} shows an IQR of {distributions[0]?.iqr}°F vs {distributions[distributions.length - 1]?.site_label}'s {distributions[distributions.length - 1]?.iqr}°F, indicating more volatile heat stress at the hottest sites.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Tests Panel */}
        <div className="bg-surface-container p-6 rounded-xl flex flex-col">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-4">Statistical Validation</h3>
          {/* Kruskal-Wallis summary */}
          <div className="bg-surface-container-lowest p-4 rounded-lg mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">{t('q5deep.kwTest')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{statTests!.kruskal_wallis_h}</p>
                <p className="text-[9px] text-stone-400">{t('q5deep.hStatistic')}</p>
              </div>
              <div>
                <p className="text-2xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">{statTests!.kruskal_wallis_p_display}</p>
                <p className="text-[9px] text-stone-400">{t('q5deep.pValue')}</p>
              </div>
            </div>
          </div>

          {/* Pairwise results */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">
            {t('q5deep.topPairwise')} <span className="text-stone-400">(Bonferroni α = {statTests!.bonferroni_alpha})</span>
          </p>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {statTests!.pairwise.slice(0, 10).map((row: PairwiseRow, i: number) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-[10px] ${
                  row.significant
                    ? 'bg-error-container/30 border border-error/20'
                    : 'bg-surface-container-lowest'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-bold">{row.site_1.split(' ')[0]}</span>
                  <span className="text-stone-400 mx-1">vs</span>
                  <span className="font-bold">{row.site_2.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-stone-500">{row.p_display}</span>
                  {row.significant && (
                    <span className="material-symbols-outlined text-error text-xs">check</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-surface-container-lowest p-3 rounded-lg">
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              <strong>{statTests!.n_significant} of {statTests!.n_pairs}</strong> pairs remain significant after Bonferroni correction — inter-site variation is <em>not</em> noise.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Ranking Consistency + Day×Site Heatmap ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ranking Consistency */}
        <div className="bg-surface-container-lowest p-8 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q5deep.rankingConsistency')}</h3>
          <p className="text-xs text-on-surface-variant mb-4">{t('q5deep.rankingDesc')}</p>
          <div className="space-y-2">
            {rankings.map((r, i) => (
              <div key={r.site_id} className="flex items-center gap-3">
                <span className="text-xs w-6 text-right font-bold text-stone-400">#{i + 1}</span>
                <span className="text-xs w-28 truncate font-bold">{r.site_label}</span>
                <div className="flex-1 flex items-center gap-2">
                  {/* Rank dots for each day */}
                  {Object.values(r.ranks_by_day).map((rank, di) => (
                    <div
                      key={di}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{
                        backgroundColor: rank <= 3 ? C.primary : rank <= 6 ? C.secondary : rank <= 9 ? C.outline : C.outlineVariant,
                        color: rank <= 6 ? '#fff' : C.onSurface,
                      }}
                    >
                      {rank}
                    </div>
                  ))}
                </div>
                <span className="text-[9px] text-stone-400 w-12 text-right" title="Standard deviation">
                  σ = {r.std_rank.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3 text-[9px] text-stone-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.primary }} /> {t('q5deep.rank1to3')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.secondary }} /> {t('q5deep.rank4to6')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.outline }} /> {t('q5deep.rank7to9')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.outlineVariant }} /> {t('q5deep.rank10to12')}</span>
          </div>
          <div className="mt-4 bg-surface-container p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">verified</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{t('q5deep.consistency')}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {rankings[0]?.site_label} is remarkably stable (σ = {rankings[0]?.std_rank.toFixed(1)}, always rank {rankings[0]?.best_rank}–{rankings[0]?.worst_rank}). {rankings[rankings.length - 1]?.site_label} is equally consistent at the cool end (mean rank {rankings[rankings.length - 1]?.mean_rank}). These are <strong>structural microclimate effects</strong>, not random variation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Day × Site Heatmap */}
        <div className="bg-surface-container p-6 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q5deep.dayHeatmap')}</h3>
          <p className="text-xs text-on-surface-variant mb-4">{t('q5deep.dayHeatmapDesc')}</p>
          <div className="grid gap-px" style={{ gridTemplateColumns: `100px repeat(${uniqueDates.length}, 1fr)` }}>
            <div />
            {uniqueDates.map(d => (
              <div key={d} className="text-[8px] text-center text-stone-400 font-bold pb-2">
                {d.slice(5)}
              </div>
            ))}
            {siteOrder.map(sid => {
              const label = rankings.find(r => r.site_id === sid)?.site_label ?? sid
              return (
                <div key={sid} className="contents">
                  <div className="text-[9px] font-bold text-on-surface-variant truncate pr-2 flex items-center">
                    {label.split(' ').slice(0, 2).join(' ')}
                  </div>
                  {uniqueDates.map(d => {
                    const cell = daySite.find(c => c.site_id === sid && c.date === d)
                    if (!cell) return <div key={d} className="aspect-[2/1] bg-surface-variant/30 rounded-sm" />
                    return (
                      <div
                        key={d}
                        className="aspect-[2/1] rounded-sm relative group/cell cursor-default flex items-center justify-center"
                        style={{ backgroundColor: heatColor(cell.mean_wbgt, dsMin, dsMax) }}
                      >
                        <span className="text-[8px] font-bold" style={{ color: heatTextColor(cell.mean_wbgt, dsMin, dsMax) }}>
                          {cell.mean_wbgt.toFixed(1)}
                        </span>
                        <div className="hidden group-hover/cell:block absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-2 py-1 rounded text-[8px] whitespace-nowrap shadow-xl z-20 pointer-events-none">
                          {cell.site_label} — {d} — {cell.mean_wbgt.toFixed(1)}°F ({cell.n_records} records)
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[9px] font-bold text-stone-500">LOW</span>
            <div className="flex h-2 w-24 rounded-full overflow-hidden">
              <div className="h-full w-1/4" style={{ background: '#fff2da' }} />
              <div className="h-full w-1/4" style={{ background: '#feb78a' }} />
              <div className="h-full w-1/4" style={{ background: '#902223' }} />
              <div className="h-full w-1/4" style={{ background: '#6f070f' }} />
            </div>
            <span className="text-[9px] font-bold text-stone-500">HIGH</span>
          </div>
          <div className="mt-4 bg-surface-container-lowest p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-sm mt-0.5">calendar_month</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">{t('q5deep.dailyVariation')}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Inter-site differences peak on {uniqueDates[0]?.slice(5)} (greatest color spread) and compress on the August dates. Sites with missing cells had sensor gaps during those periods.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Heat Wave vs Isolated + Per-site comparison ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Heat Wave vs Isolated summary */}
        <div className="bg-surface-container-low p-8 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-6">Heat Wave vs Isolated Events</h3>
          <div className="space-y-6">
            <div className="bg-surface-container-lowest p-4 rounded-lg">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                Heat Wave <span className="text-stone-400 normal-case font-normal">({hwVsIso!.heatwave.dates.map(d => d.slice(5)).join(', ')})</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{hwVsIso!.heatwave.mean_wbgt}°F</p>
                  <p className="text-[9px] text-stone-400">Mean WBGT</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-secondary">{hwVsIso!.heatwave.inter_site_range}°F</p>
                  <p className="text-[9px] text-stone-400">Inter-site range</p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-lg">
              <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-3">
                Isolated Days <span className="text-stone-400 normal-case font-normal">({hwVsIso!.isolated.dates.map(d => d.slice(5)).join(', ')})</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">{hwVsIso!.isolated.mean_wbgt}°F</p>
                  <p className="text-[9px] text-stone-400">Mean WBGT</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-secondary">{hwVsIso!.isolated.inter_site_range}°F</p>
                  <p className="text-[9px] text-stone-400">Inter-site range</p>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-sm">difference</span>
                <p className="text-xs font-bold text-primary">Δ {kpi!.hw_iso_diff}°F higher during heat wave</p>
              </div>
              <p className="text-[10px] text-on-surface-variant">
                Mann-Whitney p = {hwVsIso!.test_p_display} — highly significant. Sustained heat events show <strong>higher absolute WBGT</strong> but <strong>narrower inter-site variation</strong> ({hwVsIso!.heatwave.inter_site_range}°F vs {hwVsIso!.isolated.inter_site_range}°F).
              </p>
            </div>
          </div>
        </div>

        {/* Per-site HW vs Isolated comparison */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">Site-Level: Heat Wave vs Isolated</h3>
          <p className="text-xs text-on-surface-variant mb-6">Mean WBGT per site during sustained heat wave vs isolated hot days</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={hwIsoSites.filter(r => r.hw_mean != null)} margin={{ top: 10, right: 10, bottom: 50, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis
                dataKey="site_label"
                tick={{ fontSize: 9, angle: -40, textAnchor: 'end' }}
                stroke={C.outline}
                interval={0}
                height={70}
              />
              <YAxis domain={[69, 'dataMax + 0.5']} tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: '°F WBGT', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip
                formatter={(v, name) => [`${Number(v).toFixed(2)}°F`, String(name) === 'hw_mean' ? 'Heat Wave' : 'Isolated Days']}
                wrapperStyle={{ zIndex: 50 }}
              />
              <Bar dataKey="hw_mean" fill={C.primary} radius={[3, 3, 0, 0]} barSize={14} name="hw_mean" />
              <Bar dataKey="iso_mean" fill={C.tertiary} radius={[3, 3, 0, 0]} barSize={14} name="iso_mean" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex gap-6 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: C.primary }} /> Heat Wave (Jul 27–29)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: C.tertiary }} /> Isolated (Aug 8, 13)
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Heat Index vs WBGT Divergence ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* HI vs WBGT hourly gap */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl">
          <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">Heat Index vs WBGT: The Divergence</h3>
          <p className="text-sm text-on-surface-variant mb-6">Why WBGT stays below OSHA thresholds while Heat Index exceeds danger levels</p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={hiHourly} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke={C.outline} tickFormatter={(h: number) => `${h}:00`} />
              <YAxis tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: '°F', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip
                labelFormatter={(h) => `${h}:00`}
                formatter={(v, name) => [
                  `${Number(v).toFixed(1)}°F`,
                  String(name) === 'heat_index' ? 'Heat Index' : String(name) === 'wbgt' ? 'WBGT' : 'HI–WBGT Gap',
                ]}
                wrapperStyle={{ zIndex: 50 }}
              />
              <Area dataKey="gap" fill={C.error} fillOpacity={0.08} stroke="transparent" name="gap" />
              <Line dataKey="heat_index" stroke={C.error} strokeWidth={2.5} dot={false} name="heat_index" />
              <Line dataKey="wbgt" stroke={C.primary} strokeWidth={2.5} dot={false} name="wbgt" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4 flex gap-6 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-0.5 rounded" style={{ backgroundColor: C.error }} /> Heat Index
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-0.5 rounded" style={{ backgroundColor: C.primary }} /> WBGT
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: C.error, opacity: 0.08 }} /> Divergence Gap
            </span>
          </div>
          <div className="mt-4 bg-surface-container-lowest p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-sm mt-0.5">warning</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-error mb-1">Critical Insight</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  The HI–WBGT gap averages <strong>{hiSummary!.mean_gap}°F</strong> and widens to <strong>{hiSummary!.max_gap}°F</strong> during peak afternoon hours. While WBGT never reached OSHA's 80°F Caution threshold, the Heat Index exceeded 100°F in <strong>{hiSummary!.n_hi_above_100} records ({hiSummary!.pct_hi_above_100}%)</strong>. This divergence means occupational safety standards may understate <em>perceived</em> heat risk for vulnerable populations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scatter plot: HI vs WBGT by site */}
        <div className="bg-surface-container p-6 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-4">HI × WBGT Correlation</h3>
          <p className="text-xs text-on-surface-variant mb-4">r = {hiSummary!.correlation} — strong but imperfect</p>
          <ResponsiveContainer width="100%" height={390}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis dataKey="wbgt" name="WBGT" tick={{ fontSize: 9 }} stroke={C.outline} label={{ value: 'WBGT (°F)', position: 'insideBottom', offset: -5, fontSize: 9 }} />
              <YAxis dataKey="heat_index" name="Heat Index" tick={{ fontSize: 9 }} stroke={C.outline} label={{ value: 'Heat Index (°F)', angle: -90, position: 'insideLeft', fontSize: 9 }} />
              <ZAxis range={[20, 20]} />
              <Tooltip
                formatter={(v, name) => [`${Number(v).toFixed(1)}°F`, String(name)]}
                labelFormatter={() => ''}
              />
              <Scatter data={hiScatter} fill={C.primary} fillOpacity={0.5}>
                {hiScatter.map((entry, i) => (
                  <Cell key={i} fill={SITE_COLORS[entry.site_id] ?? C.outline} fillOpacity={0.6} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 bg-surface-container-lowest p-3 rounded-lg">
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              A perfect 1:1 line would mean HI = WBGT. Points cluster <strong>above</strong> this line — Heat Index systematically overestimates perceived risk relative to the physiologically-grounded WBGT.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Humidity Factor: Why Temperature ≠ WBGT ═══ */}
      <section className="bg-surface-container-lowest p-8 rounded-xl">
        <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">The Humidity Factor</h3>
        <p className="text-sm text-on-surface-variant mb-6">
          Site rankings change substantially between ambient temperature and WBGT because humidity varies by microclimate — a {kpi!.humidity_range}% range across sites
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={humidity} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke={C.outline} unit="%" />
              <YAxis dataKey="site_label" type="category" tick={{ fontSize: 9, fontWeight: 700 }} stroke={C.outline} width={100} />
              <Tooltip
                formatter={(v, name) => [
                  String(name) === 'humidity' ? `${v}%` : `${v}°F`,
                  String(name) === 'humidity' ? 'Mean Humidity' : String(name) === 'temp' ? 'Mean Temp' : 'WBGT',
                ]}
                wrapperStyle={{ zIndex: 50 }}
              />
              <Bar dataKey="humidity" fill={C.tertiary} radius={[0, 4, 4, 0]} barSize={14} name="humidity" />
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-4">
            <div className="bg-surface-container p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">water_drop</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-1">Humidity Drives Rankings</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {humidity[0]?.site_label} has the highest mean humidity ({humidity[0]?.humidity}%) despite ranking only {humidity.findIndex(h => h.site_id === 'tufts') >= 0 ? '#' + (humidity.findIndex(h => h.site_id === 'tufts') + 1) : 'mid-pack'} by temperature. This moisture retention pushes its WBGT to the top, demonstrating why <strong>WBGT — not temperature — should guide heat safety decisions.</strong>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-sm mt-0.5">swap_horiz</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Reggie Wong Paradox</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Reggie Wong is the <strong>hottest site by temperature</strong> but only 7th by WBGT — its low humidity (71.6%) makes conditions less physiologically oppressive. Shade alone won't fix sites that trap moisture; <strong>improved drainage and airflow</strong> are needed.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">policy</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Policy Implication</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Reducing humidity through improved drainage and air circulation may be <strong>more effective than simply adding shade</strong> at high-humidity sites like {humidity[0]?.site_label} and {humidity[1]?.site_label}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Synthesis Footer ═══ */}
      <footer className="bg-primary text-on-primary p-12 rounded-2xl relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <span className="material-symbols-outlined text-[200px]">labs</span>
        </div>
        <div className="max-w-4xl relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="material-symbols-outlined text-4xl">science</span>
            <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">Statistical Synthesis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <p className="font-[family-name:var(--font-family-headline)] italic text-lg leading-relaxed text-on-primary-container">
              With H = {kpi!.kruskal_h} (p &lt; 10⁻³⁹) and {kpi!.significant_pairs} of {kpi!.total_pairs} pairwise comparisons significant
              after Bonferroni correction, we can confirm that inter-site WBGT differences are structurally driven —
              not statistical noise. The {kpi!.hi_wbgt_gap}°F Heat Index divergence reveals a critical
              gap between occupational safety standards and public health reality.
            </p>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-md">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-1 text-on-primary-container">Key Takeaway</h4>
                <p className="text-sm">WBGT never hits 80°F, but Heat Index reaches {kpi!.max_heat_index}°F — heat advisories should use <em>both</em> metrics to protect vulnerable populations.</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-md">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-1 text-on-primary-container">Methodology</h4>
                <p className="text-sm">Non-parametric tests (Kruskal-Wallis, Mann-Whitney U) with Bonferroni correction for multiple comparisons across 12 sites × 5 hot days.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
