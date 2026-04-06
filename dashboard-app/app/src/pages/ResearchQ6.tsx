import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ComposedChart, Area,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useQ6Data } from '../hooks/useQ6Data'

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

const SITE_IDS = [
  'tufts', 'berkley', 'castle', 'chin', 'greenway', 'taitung',
  'reggie', 'dewey', 'lyndenboro', 'oxford', 'eliotnorton', 'msh',
]

const SITE_LABELS: Record<string, string> = {
  tufts: 'Tufts Garden', berkley: 'Berkeley Garden', castle: 'Castle Square',
  chin: 'Chin Park', greenway: 'One Greenway', taitung: 'Tai Tung',
  reggie: 'Reggie Wong', dewey: 'Dewey Square', lyndenboro: 'Lyndboro Park',
  oxford: 'Oxford Place', eliotnorton: 'Eliot Norton', msh: 'Mary Soo Hoo',
}

const SITE_COLORS: Record<string, string> = {
  tufts: C.primary, berkley: '#c0392b', castle: '#e74c3c',
  chin: C.secondary, greenway: '#d4a03c', taitung: '#b87333',
  reggie: C.outline, dewey: '#7f8c8d', lyndenboro: '#95a5a6',
  oxford: '#5d8aa8', eliotnorton: '#2d6a4f', msh: C.tertiary,
}

/* Severity color scale for PM2.5 deviation */
function devColor(v: number): string {
  if (v >= 3) return '#6f070f'
  if (v >= 1.5) return '#902223'
  if (v >= 0) return '#feb78a'
  if (v >= -1.5) return '#ffecc3'
  return '#e8e0d0'
}

function devTextColor(v: number): string {
  return v >= 1.5 ? '#ffffff' : '#241a00'
}

function aqiBadge(aqi: number): { labelKey: string; cls: string } {
  if (aqi <= 50) return { labelKey: 'q6.good', cls: 'bg-tertiary/10 text-tertiary' }
  if (aqi <= 100) return { labelKey: 'q6.moderate', cls: 'bg-secondary-container text-on-secondary-container' }
  if (aqi <= 150) return { labelKey: 'q6.usg', cls: 'bg-error-container text-error' }
  if (aqi <= 200) return { labelKey: 'q6.unhealthy', cls: 'bg-error text-white' }
  if (aqi <= 300) return { labelKey: 'q6.veryUnhealthy', cls: 'bg-primary-container text-on-primary' }
  return { labelKey: 'q6.hazardous', cls: 'bg-primary text-on-primary' }
}

export default function ResearchQ6() {
  const {
    kpi, highDays, siteComparison, heatmap, diurnalPeak, diurnalTypical,
    rankings, metContext, timeline, perdaySite, loading,
  } = useQ6Data()
  const { t } = useTranslation()

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [highlightSites, setHighlightSites] = useState<string[]>(['chin', 'greenway', 'oxford'])
  const [timelineSite, setTimelineSite] = useState<string>('all')

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  const activeDay = selectedDay ?? kpi!.high_dates[0]
  const dayHeatmap = heatmap.filter(c => c.date === activeDay)
  const dayPerSite = perdaySite.filter(r => r.date === activeDay).sort((a, b) => b.pm25 - a.pm25)

  /* Heatmap bounds for deviation */
  const allDevs = heatmap.map(c => c.deviation)
  const siteOrder = rankings.map(r => r.site_id)
  const uniqueDates = kpi!.high_dates

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="mb-12 relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary mb-2">{t('q6.title')}</h1>
            <p className="text-secondary max-w-2xl font-[family-name:var(--font-family-headline)] italic text-lg">
              {t('q6.description')}
            </p>
          </div>
          <div className="bg-surface-container-highest/50 backdrop-blur-sm p-4 rounded-lg border border-primary/10 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">{t('q6.peakAqiEvent')}</span>
            <span className="text-xl font-black text-primary">{kpi!.peak_aqi_date.slice(5)} — AQI {kpi!.peak_aqi}</span>
          </div>
        </div>
      </header>

      {/* ═══ KPI Grid ═══ */}
      <section className="grid grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q6.peakDailyAqi')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.peak_aqi}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${aqiBadge(kpi!.peak_aqi).cls}`}>
              {t(aqiBadge(kpi!.peak_aqi).labelKey)}
            </span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">Recorded {kpi!.peak_aqi_date}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q6.spatialRange')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-secondary">{kpi!.spatial_range_high}</h3>
            <span className="text-xs text-stone-500">µg/m³</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q6.spatialRangeDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q6.disparityAmplification')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">{kpi!.amplification}×</h3>
            <span className="material-symbols-outlined text-error text-xl">trending_up</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q6.disparityDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q6.mostAffected')}</p>
          <div>
            <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.most_affected_site.toUpperCase()}</h3>
            <span className="text-2xl font-bold text-on-surface">{kpi!.most_affected_pm25} <span className="text-xs font-medium">µg/m³</span></span>
          </div>
        </div>
      </section>

      {/* ═══ AQI Timeline ═══ */}
      <section className="bg-white p-8 rounded-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q6.aqiTimeline')}</h3>
            <p className="text-sm text-on-surface-variant">
              {timelineSite === 'all'
                ? t('q6.aqiTimelineDesc')
                : `Daily PM2.5 for ${SITE_LABELS[timelineSite]} vs network average`}
            </p>
          </div>
          <div className="relative shrink-0">
            <select
              value={timelineSite}
              onChange={e => setTimelineSite(e.target.value)}
              className="appearance-none bg-surface-container border border-outline-variant/30 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">{t('q6.allSites')}</option>
              {SITE_IDS.map(sid => (
                <option key={sid} value={sid}>{SITE_LABELS[sid]}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
        </div>
        {timelineSite === 'all' ? (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={timeline} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke={C.outline} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis yAxisId="aqi" tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: 'AQI', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <YAxis yAxisId="spread" orientation="right" tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: 'PM2.5 Spread', angle: 90, position: 'insideRight', fontSize: 9 }} />
              <Tooltip
                labelFormatter={(d) => String(d)}
                formatter={(v, name) => [
                  String(name) === 'pm25_spread' ? `${v} µg/m³` : String(v),
                  String(name) === 'aqi' ? 'AQI' : 'PM2.5 Spread',
                ]}
                wrapperStyle={{ zIndex: 50 }}
              />
              <Area yAxisId="spread" dataKey="pm25_spread" fill={C.secondaryContainer} fillOpacity={0.3} stroke={C.secondary} strokeWidth={1} />
              <Bar yAxisId="aqi" dataKey="aqi" barSize={3} name="aqi">
                {timeline.map((row, i) => (
                  <Cell key={i} fill={row.is_high ? C.primary : C.outlineVariant} fillOpacity={row.is_high ? 1 : 0.4} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={timeline} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke={C.outline} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip
                labelFormatter={(d) => String(d)}
                formatter={(v, name) => [
                  `${Number(v).toFixed(1)} µg/m³`,
                  String(name) === 'mean_pm25' ? 'Network Avg' : SITE_LABELS[timelineSite],
                ]}
                wrapperStyle={{ zIndex: 50 }}
              />
              <Area dataKey="mean_pm25" fill={C.outlineVariant} fillOpacity={0.15} stroke={C.outlineVariant} strokeWidth={1} strokeDasharray="4 2" name="mean_pm25" />
              <Line dataKey={timelineSite} stroke={SITE_COLORS[timelineSite]} strokeWidth={2} dot={false} connectNulls name={timelineSite} />
              {/* Mark high-AQI days */}
              {timeline.filter(r => r.is_high && r[timelineSite] != null).map(r => (
                <Line key={r.date} dataKey={() => null} dot={false} stroke="none" legendType="none" />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
        <div className="mt-4 flex gap-6 text-xs">
          {timelineSite === 'all' ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded" style={{ backgroundColor: C.primary }} /> High-AQI Day
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded" style={{ backgroundColor: C.outlineVariant, opacity: 0.4 }} /> Normal Day
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: C.secondaryContainer, opacity: 0.3 }} /> Inter-site PM2.5 Spread
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded" style={{ backgroundColor: SITE_COLORS[timelineSite] }} /> {SITE_LABELS[timelineSite]}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded" style={{ backgroundColor: C.outlineVariant, opacity: 0.4 }} /> Network Average
              </span>
            </>
          )}
        </div>
      </section>

      {/* ═══ Site×Day Deviation Heatmap + Per-Day Bar Chart ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deviation Matrix */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q6.deviationMatrix')}</h3>
          <p className="text-xs text-on-surface-variant mb-4">{t('q6.deviationDesc')}</p>
          {/* Day selector */}
          <div className="flex gap-2 mb-4">
            {uniqueDates.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                  activeDay === d
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {d.slice(5)}
              </button>
            ))}
          </div>
          {/* Heatmap grid */}
          <div className="grid gap-px" style={{ gridTemplateColumns: `100px repeat(${uniqueDates.length}, 1fr)` }}>
            <div />
            {uniqueDates.map(d => (
              <div key={d} className={`text-[8px] text-center font-bold pb-2 ${d === activeDay ? 'text-primary' : 'text-stone-400'}`}>
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
                    const cell = heatmap.find(c => c.site_id === sid && c.date === d)
                    if (!cell) return <div key={d} className="aspect-[2/1] bg-surface-variant/30 rounded-sm" />
                    return (
                      <div
                        key={d}
                        className={`aspect-[2/1] rounded-sm relative group/cell cursor-default flex items-center justify-center ${
                          d === activeDay ? 'ring-1 ring-primary/30' : ''
                        }`}
                        style={{ backgroundColor: devColor(cell.deviation) }}
                      >
                        <span className="text-[8px] font-bold" style={{ color: devTextColor(cell.deviation) }}>
                          {cell.deviation > 0 ? '+' : ''}{cell.deviation}
                        </span>
                        <div className="hidden group-hover/cell:block absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-2 py-1 rounded text-[8px] whitespace-nowrap shadow-xl z-20 pointer-events-none">
                          {cell.site_label} — {cell.pm25} µg/m³ (Δ{cell.deviation > 0 ? '+' : ''}{cell.deviation})
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[9px] font-bold text-stone-500">{t('q6.belowAvg')}</span>
            <div className="flex h-2 w-32 rounded-full overflow-hidden">
              <div className="h-full w-1/4" style={{ background: '#e8e0d0' }} />
              <div className="h-full w-1/4" style={{ background: '#ffecc3' }} />
              <div className="h-full w-1/4" style={{ background: '#902223' }} />
              <div className="h-full w-1/4" style={{ background: '#6f070f' }} />
            </div>
            <span className="text-[9px] font-bold text-stone-500">{t('q6.aboveAvg')}</span>
          </div>
          <div className="mt-4 bg-surface-container p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">insights</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{t('q6.disparityPattern')}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {kpi!.most_affected_site} and Lyndboro Park show the strongest positive deviations across all high-AQI days, while {kpi!.cleanest_site} and {rankings[rankings.length - 1]?.site_label} consistently trend below the network average — indicating structural, not random, pollution inequity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Day Site Bars + Deviation from Network Avg */}
        <div className="bg-surface-container p-6 rounded-xl flex flex-col">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q6.sitePm25', { date: activeDay.slice(5) })}</h3>
          <p className="text-xs text-on-surface-variant mb-4">{t('q6.sitePm25Desc')}</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayPerSite} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke={C.outline} unit=" µg/m³" />
              <YAxis dataKey="site_label" type="category" tick={{ fontSize: 9, fontWeight: 700 }} stroke={C.outline} width={90} />
              <Tooltip
                formatter={(v) => [`${v} µg/m³`, 'Mean PM2.5']}
                wrapperStyle={{ zIndex: 50 }}
              />
              <Bar dataKey="pm25" radius={[0, 4, 4, 0]} barSize={14}>
                {dayPerSite.map((row, i) => (
                  <Cell
                    key={i}
                    fill={i === 0 ? C.primary : i === 1 ? C.primaryContainer : i < 4 ? C.secondary : C.outline}
                    fillOpacity={i < 4 ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Deviation from Network Average */}
          {(() => {
            const dayAvg = dayPerSite.length > 0 ? dayPerSite.reduce((s, r) => s + r.pm25, 0) / dayPerSite.length : 0
            const devData = dayPerSite.map(r => ({
              ...r,
              deviation: +(r.pm25 - dayAvg).toFixed(1),
            }))
            return (
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Deviation from Network Average ({dayAvg.toFixed(1)} µg/m³)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={devData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.15} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9 }} stroke={C.outline} unit=" µg/m³" />
                    <YAxis dataKey="site_label" type="category" tick={{ fontSize: 9, fontWeight: 700 }} stroke={C.outline} width={90} />
                    <Tooltip
                      formatter={(v) => [`${Number(v) > 0 ? '+' : ''}${v} µg/m³`, 'Deviation']}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    <Bar dataKey="deviation" barSize={10} radius={[0, 3, 3, 0]}>
                      {devData.map((row, i) => (
                        <Cell
                          key={i}
                          fill={row.deviation >= 0 ? C.primary : C.tertiary}
                          fillOpacity={Math.abs(row.deviation) > 2 ? 1 : 0.6}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 flex gap-4 text-[9px] text-stone-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: C.primary }} /> Above average</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: C.tertiary }} /> Below average</span>
                </div>
                <div className="mt-4 bg-primary/5 border border-primary/15 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">target</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Microenvironment Signal</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {devData[0]?.site_label && devData[devData.length - 1]?.site_label ? (
                          <><strong>{devData[0].site_label}</strong> ({devData[0].deviation > 0 ? '+' : ''}{devData[0].deviation} µg/m³) and <strong>{devData[devData.length - 1].site_label}</strong> ({devData[devData.length - 1].deviation > 0 ? '+' : ''}{devData[devData.length - 1].deviation} µg/m³) sit at opposite ends — a <strong>{Math.abs(devData[0].deviation - devData[devData.length - 1].deviation).toFixed(1)} µg/m³ gap</strong> within a single neighborhood, driven by local ventilation and built-environment trapping.</>
                        ) : 'Loading…'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* ═══ PM2.5 Distribution Shift + Diurnal Profiles ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Shift: side-by-side bar */}
        <div className="bg-surface-container-lowest p-8 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">PM2.5 Distribution Shift</h3>
          <p className="text-xs text-on-surface-variant mb-6">Site-by-site PM2.5: high-AQI days vs normal — +{kpi!.elevation_pct}% elevation</p>
          <ResponsiveContainer width="100%" height={551}>
            <BarChart data={siteComparison} margin={{ top: 10, right: 10, bottom: 50, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis
                dataKey="site_label"
                tick={{ fontSize: 9, angle: -40, textAnchor: 'end' }}
                stroke={C.outline}
                interval={0}
                height={70}
              />
              <YAxis tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip
                formatter={(v, name) => [
                  `${v} µg/m³`,
                  String(name) === 'normal_mean' ? 'Normal Days' : 'High-AQI Days',
                ]}
                wrapperStyle={{ zIndex: 50 }}
              />
              <Bar dataKey="normal_mean" fill={C.outlineVariant} radius={[3, 3, 0, 0]} barSize={12} name="normal_mean" />
              <Bar dataKey="high_mean" fill={C.primary} radius={[3, 3, 0, 0]} barSize={12} name="high_mean" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex gap-6 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: C.outlineVariant }} /> Normal Days
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: C.primary }} /> High-AQI Days
            </span>
          </div>
          <div className="mt-4 bg-surface-container p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-sm mt-0.5">emergency</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-error mb-1">Elevation Factor</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  PM2.5 concentrations jump from <strong>{kpi!.mean_pm25_normal} µg/m³</strong> (normal) to <strong>{kpi!.mean_pm25_high} µg/m³</strong> (high-AQI) — a <strong>+{kpi!.elevation_pct}% elevation</strong> across all sites. Spatial disparities widen by {kpi!.amplification}×, meaning pollution inequity grows when air quality deteriorates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diurnal Profiles: Peak vs Typical */}
        <div className="bg-white p-8 rounded-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">Hourly PM2.5 Profiles</h3>
              <p className="text-xs text-on-surface-variant">Peak AQI day ({kpi!.peak_aqi_date.slice(5)}) vs typical day</p>
            </div>
            <div className="flex flex-wrap gap-1.5 max-w-xs justify-end">
              {SITE_IDS.map(sid => (
                <button
                  key={sid}
                  onClick={() => {
                    setHighlightSites(prev =>
                      prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]
                    )
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border ${
                    highlightSites.includes(sid)
                      ? 'border-primary/40 bg-surface-container shadow-sm'
                      : 'border-transparent opacity-40 hover:opacity-70'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SITE_COLORS[sid] }} />
                  {SITE_LABELS[sid].split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          {/* Peak day */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Peak AQI Day</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={diurnalPeak} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke={C.outline} tickFormatter={(h: number) => `${h}:00`} />
              <YAxis tick={{ fontSize: 9 }} stroke={C.outline} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fontSize: 9 }} />
              <Tooltip
                labelFormatter={(h) => `${h}:00`}
                formatter={(v, name) => [`${Number(v).toFixed(1)} µg/m³`, SITE_LABELS[String(name)] ?? String(name)]}
                wrapperStyle={{ zIndex: 50 }}
              />
              {SITE_IDS.map(sid => (
                <Line
                  key={sid} dataKey={sid} stroke={SITE_COLORS[sid]}
                  strokeWidth={highlightSites.includes(sid) ? 2.5 : 0.8}
                  strokeOpacity={highlightSites.includes(sid) ? 1 : 0.15}
                  dot={false} name={sid}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {/* Typical day */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-2 mt-4">Typical Day</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={diurnalTypical} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke={C.outline} tickFormatter={(h: number) => `${h}:00`} />
              <YAxis tick={{ fontSize: 9 }} stroke={C.outline} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fontSize: 9 }} />
              <Tooltip
                labelFormatter={(h) => `${h}:00`}
                formatter={(v, name) => [`${Number(v).toFixed(1)} µg/m³`, SITE_LABELS[String(name)] ?? String(name)]}
                wrapperStyle={{ zIndex: 50 }}
              />
              {SITE_IDS.map(sid => (
                <Line
                  key={sid} dataKey={sid} stroke={SITE_COLORS[sid]}
                  strokeWidth={highlightSites.includes(sid) ? 2.5 : 0.8}
                  strokeOpacity={highlightSites.includes(sid) ? 1 : 0.15}
                  dot={false} name={sid}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {/* Diurnal insight callout */}
          <div className="mt-6 space-y-3">
            <div className="bg-primary/5 border border-primary/15 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">schedule</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Peak Hour Divergence</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    On the peak AQI day, PM2.5 concentrations diverge sharply during <strong>afternoon hours (12:00–18:00)</strong> when thermal mixing heights collapse. Sites near traffic corridors show 2–3× higher spikes than sheltered park locations during this window.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-tertiary/5 border border-tertiary/15 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">nightlight</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-1">Nighttime Convergence</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    On typical days, inter-site spread narrows to &lt;2 µg/m³ overnight. On high-AQI days, <strong>nighttime disparities persist</strong> — evidence that stagnant conditions trap pollutants locally rather than allowing regional mixing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Ranking Stability + Meteorological Context ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ranking Stability */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">Ranking Stability (σ)</h3>
          <p className="text-xs text-on-surface-variant mb-4">PM2.5 rankings across high-AQI days — lower σ = more consistent</p>
          <div className="space-y-2">
            {rankings.map((r, i) => (
              <div key={r.site_id} className="flex items-center gap-3">
                <span className="text-xs w-6 text-right font-bold text-stone-400">#{i + 1}</span>
                <span className="text-xs w-28 truncate font-bold">{r.site_label}</span>
                <div className="flex-1 flex items-center gap-2">
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
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-primary w-12 text-right">Rank {r.mean_rank}</span>
                  <span className="text-[9px] text-stone-400 w-10 text-right">σ = {r.std_rank}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3 text-[9px] text-stone-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.primary }} /> Rank 1–3 (most polluted)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.secondary }} /> 4–6</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.outline }} /> 7–9</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.outlineVariant }} /> 10–12 (cleanest)</span>
          </div>
          <div className="mt-4 bg-surface-container p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">gavel</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Structural Pattern</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {rankings[0]?.site_label} (rank {rankings[0]?.mean_rank}, σ = {rankings[0]?.std_rank}) is the most consistently polluted site on high-AQI days. {rankings[rankings.length - 1]?.site_label} (rank {rankings[rankings.length - 1]?.mean_rank}) consistently has the cleanest air. The <strong>"Same Sites Suffer Most"</strong> rule confirms infrastructure — not weather — dictates pollution exposure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Meteorological Context */}
        <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '8px 8px' }} />
          <div className="relative z-10">
            <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-primary mb-6">Meteorological Context</h3>
            <div className="space-y-4">
              <div className="bg-surface-container-lowest/80 p-4 rounded-lg border border-primary/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Wind Speed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-primary">{metContext!.high_days.wind}</span>
                  <span className="text-xs text-stone-500">mph</span>
                </div>
                <p className="text-[9px] text-error italic mt-1">vs {metContext!.normal_days.wind} mph average ({metContext!.wind_diff} mph)</p>
              </div>
              <div className="bg-surface-container-lowest/80 p-4 rounded-lg border border-primary/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Temperature</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-secondary">{metContext!.high_days.temp}°F</span>
                </div>
                <p className="text-[9px] text-stone-500 italic mt-1">vs {metContext!.normal_days.temp}°F average ({metContext!.temp_diff > 0 ? '+' : ''}{metContext!.temp_diff}°F)</p>
              </div>
              <div className="bg-surface-container-lowest/80 p-4 rounded-lg border border-primary/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Humidity</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-tertiary">{metContext!.high_days.humidity}%</span>
                </div>
                <p className="text-[9px] text-stone-500 italic mt-1">vs {metContext!.normal_days.humidity}% average ({metContext!.humidity_diff > 0 ? '+' : ''}{metContext!.humidity_diff}%)</p>
              </div>
            </div>
            <div className="mt-6 bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">air</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Wind Stagnation</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    High-AQI days had <strong>25% lower wind speeds</strong>, suggesting trapped pollution builds up unevenly across the neighborhood, amplifying microenvironment disparities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ High-AQI Day Summary Table ═══ */}
      <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden">
        <div className="px-8 py-6 bg-surface-container-low border-b border-outline-variant/20">
          <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">High-AQI Day Summary</h3>
        </div>
        <table className="w-full">
          <thead className="bg-surface-container-high/30 text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
            <tr>
              <th className="px-8 py-4 text-left">Date</th>
              <th className="px-8 py-4 text-left">AQI</th>
              <th className="px-8 py-4 text-left">Mean PM2.5</th>
              <th className="px-8 py-4 text-left">Max PM2.5</th>
              <th className="px-8 py-4 text-left">Temp</th>
              <th className="px-8 py-4 text-left">Wind</th>
              <th className="px-8 py-4 text-left">Sites</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {highDays.map(row => (
              <tr
                key={row.date}
                className={`hover:bg-surface-container/30 transition-colors cursor-pointer ${
                  row.date === activeDay ? 'bg-primary/5' : ''
                }`}
                onClick={() => setSelectedDay(row.date)}
              >
                <td className="px-8 py-4 font-bold">{row.date}</td>
                <td className="px-8 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${aqiBadge(row.aqi).cls}`}>
                    {row.aqi} — {t(aqiBadge(row.aqi).labelKey)}
                  </span>
                </td>
                <td className="px-8 py-4 font-[family-name:var(--font-family-headline)] italic text-primary">{row.mean_pm25} µg/m³</td>
                <td className="px-8 py-4">{row.max_pm25} µg/m³</td>
                <td className="px-8 py-4">{row.mean_temp}°F</td>
                <td className="px-8 py-4">{row.mean_wind ?? '—'} mph</td>
                <td className="px-8 py-4">{row.n_sites}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ═══ Research Synthesis Footer ═══ */}
      <footer className="bg-primary text-on-primary p-12 rounded-2xl relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <span className="material-symbols-outlined text-[200px]">fact_check</span>
        </div>
        <div className="max-w-4xl relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="material-symbols-outlined text-4xl">fact_check</span>
            <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">Research Synthesis</h3>
          </div>
          <p className="font-[family-name:var(--font-family-headline)] italic text-lg leading-relaxed text-on-primary-container mb-8">
            Environmental audit confirming the systemic nature of spatial disparities during hazardous air quality events.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">Trigger Analysis</h4>
              <p className="text-sm leading-relaxed">
                Local <strong>wind stagnation ({metContext!.high_days.wind} mph)</strong> acted as the primary spatial differentiator on high-AQI days, trapping particulates unevenly in urban canyons and amplifying inter-site disparities by {kpi!.amplification}×.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">Structural Equity</h4>
              <p className="text-sm leading-relaxed">
                The "Same Sites Suffer Most" rule: ranking stability proves that infrastructure — not just weather — dictates pollution exposure. <strong>{kpi!.most_affected_site}</strong> consistently remains {kpi!.amplification}× more polluted on bad days.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
