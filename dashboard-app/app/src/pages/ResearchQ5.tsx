import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { useQ5Data, type VulnerabilityRow } from '../hooks/useQ5Data'

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
  tufts: C.primary,
  berkley: '#c0392b',
  castle: '#e74c3c',
  chin: C.secondary,
  greenway: '#d4a03c',
  taitung: '#b87333',
  reggie: C.outline,
  dewey: '#7f8c8d',
  lyndenboro: '#95a5a6',
  oxford: '#5d8aa8',
  eliotnorton: '#2d6a4f',
  msh: C.tertiary,
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

function categoryBadge(cat: string) {
  switch (cat) {
    case 'HIGH': return 'bg-error-container text-error'
    case 'MODERATE': return 'bg-secondary-container text-on-secondary-container'
    case 'LOW': return 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
    default: return 'bg-surface-container text-on-surface'
  }
}

export default function ResearchQ5() {
  const {
    kpi, hotDaySummary, diurnal, heatmap, vulnerability,
    heatingRates, rankComparison, retention, thresholdExceedance,
    dualExposure, loading,
  } = useQ5Data()
  const { t } = useTranslation()
  const [highlightSites, setHighlightSites] = useState<string[]>(['tufts', 'msh'])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  /* Heatmap bounds */
  const hmValues = heatmap.map(c => c.value)
  const hmMin = Math.min(...hmValues)
  const hmMax = Math.max(...hmValues)
  const siteOrder = vulnerability.map(v => v.site_id)

  /* Max heating rate for bar scale */
  const maxRate = Math.max(...heatingRates.map(h => h.rate))

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="mb-12">
        <h1 className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary mb-2">{t('q5.title')}</h1>
        <p className="text-secondary max-w-2xl font-[family-name:var(--font-family-headline)] italic text-lg">
          {t('q5.description')}
        </p>
      </header>

      {/* ═══ KPI Grid ═══ */}
      <section className="grid grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q5.siteHeatVuln')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{vulnerability[0]?.score ?? '—'}</h3>
            <span className="text-xs text-stone-500">/ 10</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q5.compositeRisk')} ({kpi!.hottest_site})</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q5.dangerousHours')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-secondary">{kpi!.pct_above_74_hottest}%</h3>
            <span className="material-symbols-outlined text-error text-xl">local_fire_department</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q5.dangerousHoursDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q5.intersiteRange')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">{kpi!.inter_site_range}°F</h3>
            <span className="material-symbols-outlined text-tertiary text-xl">swap_vert</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q5.intersiteRangeDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q5.coExposure')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.dual_exposure_pct}%</h3>
            <span className="material-symbols-outlined text-primary text-xl">warning</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q5.coExposureDesc')}</p>
        </div>
      </section>

      {/* ═══ Diurnal Profiles + Site×Hour Heatmap ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Diurnal Profiles */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">{t('q5.diurnalProfiles')}</h3>
              <p className="text-sm text-on-surface-variant">{t('q5.diurnalDesc')}</p>
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
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={diurnal} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke={C.outline} tickFormatter={(h: number) => `${h}:00`} />
              <YAxis domain={['dataMin - 1', 'dataMax + 0.5']} tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: '°F WBGT', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip
                labelFormatter={(h) => `${h}:00`}
                formatter={(v, name) => [`${Number(v).toFixed(1)}°F`, SITE_LABELS[String(name)] ?? String(name)]}
                wrapperStyle={{ zIndex: 50 }}
              />
              {SITE_IDS.map(sid => (
                <Line
                  key={sid}
                  dataKey={sid}
                  stroke={SITE_COLORS[sid]}
                  strokeWidth={highlightSites.includes(sid) ? 3 : 1}
                  strokeOpacity={highlightSites.includes(sid) ? 1 : 0.2}
                  dot={false}
                  name={sid}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-primary rounded-full" /> {kpi!.hottest_site} ({t('q5.warmest')})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-tertiary rounded-full" /> {kpi!.coolest_site} ({t('q5.coolest')})
            </span>
          </div>
        </div>

        {/* Site × Hour Heatmap */}
        <div className="bg-surface-container p-6 rounded-xl flex flex-col">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-4">{t('q5.siteHourIntensity')}</h3>
          <div className="flex-1 overflow-hidden">
            <div className="grid gap-px" style={{ gridTemplateColumns: `80px repeat(24, 1fr)` }}>
              {/* Header row */}
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-[7px] text-center text-stone-400 font-bold">{h}</div>
              ))}
              {/* Data rows */}
              {siteOrder.map(sid => (
                <div key={sid} className="contents">
                  <div className="text-[8px] font-bold text-on-surface-variant truncate pr-1 flex items-center">
                    {vulnerability.find(v => v.site_id === sid)?.site_label.split(' ')[0]}
                  </div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const cell = heatmap.find(c => c.site_id === sid && c.hour === h)
                    const val = cell?.value ?? 0
                    return (
                      <div
                        key={h}
                        className="aspect-square rounded-[2px] relative group/cell cursor-default"
                        style={{ backgroundColor: heatColor(val, hmMin, hmMax) }}
                      >
                        <div className="hidden group-hover/cell:block absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-2 py-1 rounded text-[8px] whitespace-nowrap shadow-xl z-20 pointer-events-none">
                          {cell?.site_label} {h}:00 — {val.toFixed(1)}°F
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
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
          {/* Insight callout */}
          <div className="mt-4 bg-surface-container-lowest p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">insights</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Key Pattern</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t('q5.allSitesPeak')}. {kpi!.hottest_site} and Castle Square reach 75–76°F even as {kpi!.coolest_site} stays 1.5°F cooler, suggesting persistent microclimate offsets driven by humidity and thermal mass.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Microclimate Dynamics + Nighttime Heat Retention ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Microclimate: Heating Rates + Rank Comparison */}
        <div className="bg-surface-container-low p-8 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-6">{t('q5.microclimateDynamics')}</h3>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase text-secondary mb-3 tracking-widest">{t('q5.morningHeatingRate')}</p>
              <div className="space-y-2">
                {heatingRates.slice(0, 6).map(h => (
                  <div key={h.site_id} className="flex items-center gap-3">
                    <span className="text-xs w-28 truncate font-bold">{h.site_label}</span>
                    <div className="flex-1 bg-surface-variant h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${(h.rate / maxRate) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold w-8 text-right">{h.rate}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-outline-variant/30">
              <p className="text-xs font-bold uppercase text-secondary mb-3 tracking-widest">{t('q5.whyTempNotWbgt')}</p>
              <div className="bg-surface-container-lowest p-4 rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left border-b border-outline-variant/20">
                      <th className="pb-2">Site</th>
                      <th className="pb-2">Temp Rank</th>
                      <th className="pb-2 text-primary">WBGT Rank</th>
                      <th className="pb-2">Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankComparison.filter(r => Math.abs(r.rank_shift) >= 2).slice(0, 5).map(r => (
                      <tr key={r.site_id} className="border-b border-outline-variant/10">
                        <td className="py-2 font-bold">{r.site_label}</td>
                        <td className="py-2">#{r.temp_rank}</td>
                        <td className="py-2 font-bold text-primary">#{r.wbgt_rank}</td>
                        <td className={`py-2 font-bold ${r.rank_shift > 0 ? 'text-tertiary' : 'text-error'}`}>
                          {r.rank_shift > 0 ? '+' : ''}{r.rank_shift}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Nighttime Heat Retention */}
        <div className="bg-surface-container-low p-8 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-6">Nighttime Heat Retention</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={retention} margin={{ top: 5, right: 10, bottom: 50, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis
                dataKey="site_label"
                tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }}
                stroke={C.outline}
                interval={0}
                height={60}
              />
              <YAxis domain={[58, 73]} tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: '°F', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip
                formatter={(v) => [`${Number(v).toFixed(1)}°F`]}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="normal_night" fill={C.secondaryContainer} name="Normal Night" radius={[2, 2, 0, 0]} barSize={12} />
              <Bar dataKey="hot_night" fill={C.primary} name="Hot Night" radius={[2, 2, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-8">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary">
              <span className="w-3 h-3 bg-secondary-container rounded-sm" /> Normal Night
            </span>
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
              <span className="w-3 h-3 bg-primary rounded-sm" /> Heat Wave Night
            </span>
          </div>
          {/* Insight callout */}
          <div className="mt-4 bg-surface-container-lowest p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-sm mt-0.5">nightlight</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Night-Heat Effect</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Hot-day nighttime WBGT averages <strong>~{retention.length > 0 ? retention.reduce((s, r) => s + r.retention, 0) / retention.length | 0 : 7}°F above normal</strong> — a substantial urban heat island effect. {retention[0]?.site_label ?? 'Berkeley Garden'} retains the most heat, preventing physiological recovery overnight.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Threshold Exceedance + Dual Exposure ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Threshold Exceedance */}
        <div className="bg-surface-container-lowest p-8 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-4">WBGT Threshold Exceedance</h3>
          <p className="text-xs text-on-surface-variant mb-4">Percentage of hot-day hours above critical WBGT levels by site</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-primary/20">
                  <th className="text-left py-2 font-bold text-on-surface-variant">Site</th>
                  <th className="text-right py-2 font-bold">&gt;70°F</th>
                  <th className="text-right py-2 font-bold">&gt;72°F</th>
                  <th className="text-right py-2 font-bold text-primary">&gt;74°F</th>
                  <th className="text-right py-2 font-bold">&gt;75°F</th>
                </tr>
              </thead>
              <tbody>
                {thresholdExceedance.map(row => (
                  <tr key={row.site_id} className="border-b border-outline-variant/10 hover:bg-surface-container/30">
                    <td className="py-2 font-bold">{row.site_label}</td>
                    <td className="py-2 text-right">{row.pct_70}%</td>
                    <td className="py-2 text-right">{row.pct_72}%</td>
                    <td className="py-2 text-right font-bold text-primary">{row.pct_74}%</td>
                    <td className="py-2 text-right">{row.pct_75}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dual Exposure */}
        <div className="bg-surface-container-lowest p-8 rounded-xl">
          <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-4">Dual Exposure: Heat + PM2.5</h3>
          <p className="text-xs text-on-surface-variant mb-4">Records with WBGT &gt; 70°F AND PM2.5 &gt; 9 µg/m³ simultaneously</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dualExposure} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke={C.outline} unit="%" domain={[0, 'dataMax + 5']} />
              <YAxis dataKey="site_label" type="category" tick={{ fontSize: 9, fontWeight: 700 }} stroke={C.outline} width={90} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Dual Exposure']}
                labelFormatter={(label) => {
                  const row = dualExposure.find(r => r.site_label === label)
                  return row ? `${label} — ${row.dual_records} of ${row.total_records} records` : String(label)
                }}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={16} name="Dual Exposure %">
                {dualExposure.map(row => (
                  <Cell key={row.site_id} fill={row.pct > 50 ? C.primary : row.pct > 45 ? C.secondary : C.outline} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Insight callout */}
          <div className="mt-4 bg-surface-container p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">warning</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Compounded Risk</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  PM2.5 peaks 1–2 hours after WBGT (2–4 PM vs 12–3 PM), creating a <strong>{kpi!.dual_exposure_pct}% overlap window</strong> during afternoon hours when residents are most likely outdoors. Heat advisories should be paired with air quality warnings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Site Vulnerability Ranking ═══ */}
      <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden">
        <div className="px-8 py-6 bg-surface-container-low border-b border-outline-variant/20">
          <h3 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">Site Vulnerability Ranking</h3>
        </div>
        <div className="mx-8 mt-6 mb-2 bg-surface-container-lowest border border-outline-variant/20 p-5 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-lg mt-0.5">science</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Methodology</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Each site receives a <strong>composite vulnerability score (0–10)</strong> derived from four equally-weighted indicators measured during the {kpi!.n_hot_days} hottest days: <strong>(1)</strong> mean WBGT above the 74°F caution threshold, <strong>(2)</strong> percentage of hours exceeding dangerous heat levels, <strong>(3)</strong> nighttime heat retention preventing physiological recovery, and <strong>(4)</strong> dual-exposure overlap where elevated WBGT coincides with PM2.5 &gt; 12 µg/m³. Sites scoring ≥ 7 are classified <em>High</em>, 5–7 <em>Moderate</em>, and &lt; 5 <em>Low</em> vulnerability.
              </p>
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-surface-container-high/30 text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
            <tr>
              <th className="px-8 py-4 text-left">Site Identifier</th>
              <th className="px-8 py-4 text-left">Classification</th>
              <th className="px-8 py-4 text-left">Mean WBGT</th>
              <th className="px-8 py-4 text-left">Score</th>
              <th className="px-8 py-4 text-left">Relative Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {vulnerability.map((row: VulnerabilityRow) => (
              <tr key={row.site_id} className="hover:bg-surface-container/30 transition-colors">
                <td className="px-8 py-4 font-bold">{row.site_label}</td>
                <td className="px-8 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${categoryBadge(row.category)}`}>
                    {row.category}
                  </span>
                </td>
                <td className="px-8 py-4 font-[family-name:var(--font-family-headline)] italic">{row.mean_wbgt}°F</td>
                <td className="px-8 py-4 font-bold text-primary">{row.score}</td>
                <td className="px-8 py-4">
                  <div className="w-24 h-2 bg-surface-variant rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(row.score / 10) * 100}%`,
                        backgroundColor: row.category === 'HIGH' ? C.primary : row.category === 'MODERATE' ? C.secondary : C.tertiary,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ═══ Hot Day Summary Table ═══ */}
      <section className="bg-surface-container-lowest p-8 rounded-xl">
        <h3 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-4">Hot Day Summary</h3>
        <p className="text-xs text-on-surface-variant mb-4">Top 5 hottest days by mean WBGT across all sites</p>
        <table className="w-full text-sm">
          <thead className="border-b-2 border-primary/20">
            <tr className="text-left text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">
              <th className="py-3">Date</th>
              <th className="py-3">WBGT Mean</th>
              <th className="py-3">WBGT Max</th>
              <th className="py-3">Temp Mean</th>
              <th className="py-3">Humidity</th>
              {hotDaySummary[0]?.heat_index_max != null && <th className="py-3">Heat Index Max</th>}
              <th className="py-3">Sites</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {hotDaySummary.map(row => (
              <tr key={row.date} className="hover:bg-surface-container/30">
                <td className="py-3 font-bold">{row.date}</td>
                <td className="py-3 font-[family-name:var(--font-family-headline)] italic text-primary">{row.wbgt_mean}°F</td>
                <td className="py-3">{row.wbgt_max}°F</td>
                <td className="py-3">{row.temp_mean}°F</td>
                <td className="py-3">{row.humidity}%</td>
                {row.heat_index_max != null && <td className="py-3 font-bold text-error">{row.heat_index_max}°F</td>}
                <td className="py-3">{row.n_sites}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ═══ Critical Research Insight Footer ═══ */}
      <footer className="bg-primary text-on-primary p-12 rounded-2xl relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <span className="material-symbols-outlined text-[200px]">inventory_2</span>
        </div>
        <div className="max-w-4xl relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="material-symbols-outlined text-4xl">lightbulb</span>
            <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">Critical Research Insight</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <p className="font-[family-name:var(--font-family-headline)] italic text-lg leading-relaxed text-on-primary-container">
              Humidity acts as the primary driver of physiological heat stress in Chinatown's microclimates.
              While dry temperature varies minimally, moisture retention creates a {kpi!.dual_exposure_pct}% dual-exposure
              risk where peak heat coincides with high particulate matter.
            </p>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-md">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-1 text-on-primary-container">Key Action Item</h4>
                <p className="text-sm">Prioritize green infrastructure at {kpi!.hottest_site} &amp; Berkeley Garden to mitigate the "Night-Heat Retention" cycle.</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-md">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-1 text-on-primary-container">Data Source</h4>
                <p className="text-sm">Tufts HEROS Lab High-Frequency Thermal Mesh (Jul – Aug 2023)</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
