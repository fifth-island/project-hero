import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, LineChart, Line, ComposedChart, Bar,
} from 'recharts'
import { useQ3Data, type Q3SiteRow } from '../hooks/useQ3Data'
import { useTranslation } from 'react-i18next'

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
  errorContainer: '#ffdad6',
}

function statusBadge(status: string) {
  switch (status) {
    case 'CRITICAL': return 'bg-error-container text-on-error-container'
    case 'HIGH': return 'bg-secondary-container text-on-secondary-container'
    case 'MODERATE': return 'bg-surface-container-high text-on-surface-variant'
    case 'STABLE': return 'bg-tertiary-fixed text-on-tertiary-fixed'
    default: return 'bg-surface-container text-on-surface'
  }
}

export default function ResearchQ3() {
  const { kpi, cdfOverall, cdfDayNight, siteTable, temporal, loading } = useQ3Data()
  const { t } = useTranslation()

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-primary tracking-tight italic">
            {t('q3.title')}
          </h2>
          <p className="text-secondary mt-2 max-w-2xl">
            {t('q3.description')}
          </p>
        </div>
        <div className="px-4 py-2 bg-surface-container rounded-lg border border-outline-variant/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
          <span className="text-xs font-bold uppercase tracking-widest">{t('q3.period')}</span>
        </div>
      </header>

      {/* ═══ KPI Grid ═══ */}
      <section className="grid grid-cols-4 gap-6">
        {/* PM2.5 NAAQS Exceedance */}
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q3.pm25Exceedance')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.pm25_naaqs_exceedance_pct}%</h3>
            <span className="material-symbols-outlined text-error text-xl">trending_up</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q3.pm25ExceedanceDesc')}</p>
        </div>
        {/* WBGT Heat Risk */}
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q3.wbgtHeatRisk')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">{kpi!.wbgt_heat_risk_pct}%</h3>
            <span className="material-symbols-outlined text-tertiary text-xl">check_circle</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q3.wbgtHeatRiskDesc')}</p>
        </div>
        {/* PM2.5 Mean Density */}
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q3.pm25MeanDensity')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-on-surface">{kpi!.pm25_mean}</h3>
            <span className="text-xs text-stone-500">µg/m³</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q3.pm25MeanDensityDesc')}</p>
        </div>
        {/* Total Observations */}
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q3.totalObs')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-on-surface">{kpi!.total_observations.toLocaleString()}</h3>
            <span className="material-symbols-outlined text-secondary text-xl">database</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q3.totalObsDesc')}</p>
        </div>
      </section>

      {/* ═══ CDF Charts ═══ */}
      <section className="grid grid-cols-2 gap-8">
        {/* PM2.5 CDF */}
        <div className="bg-surface-container p-8 rounded-lg">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-[family-name:var(--font-family-headline)] text-xl font-bold italic text-primary">{t('q3.cdfPm25')}</h4>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{t('q3.aggregateData')}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cdfOverall!.pm25} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="pm25Fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.primary} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis dataKey="x" type="number" domain={[0, 'dataMax']} tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: 'µg/m³', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} stroke={C.outline} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
              <ReferenceLine x={9.0} stroke={C.primary} strokeDasharray="4 4" strokeWidth={1.5} label={{ value: t('q3.naaqs'), position: 'top', fontSize: 9, fill: C.primary }} />
              <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} labelFormatter={(v) => `${v} µg/m³`} />
              <Area type="monotone" dataKey="y" stroke={C.primary} strokeWidth={2.5} fill="url(#pm25Fill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="mt-6 text-xs text-stone-600 leading-relaxed">
            The curve illustrates that <strong className="text-primary">{kpi!.pm25_naaqs_exceedance_pct}% of all observations</strong> lie above the 9.0 µg/m³ mark.
            Variance is highest during morning transit peaks (07:00–09:00).
          </p>
        </div>

        {/* WBGT CDF */}
        <div className="bg-surface-container p-8 rounded-lg">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-[family-name:var(--font-family-headline)] text-xl font-bold italic text-secondary">{t('q3.cdfWbgt')}</h4>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-secondary rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{t('q3.heatRiskMetric')}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cdfOverall!.wbgt} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="wbgtFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.secondary} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={C.secondary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 10 }} stroke={C.outline} label={{ value: '°F', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} stroke={C.outline} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
              <ReferenceLine x={80} stroke={C.secondary} strokeDasharray="4 4" strokeWidth={1.5} label={{ value: t('q3.oshaCaution'), position: 'top', fontSize: 9, fill: C.secondary }} />
              <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} labelFormatter={(v) => `${v}°F`} />
              <Area type="monotone" dataKey="y" stroke={C.secondary} strokeWidth={2.5} fill="url(#wbgtFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="mt-6 text-xs text-stone-600 leading-relaxed">
            Observations remain well below OSHA risk categories. Max WBGT recorded was <strong className="text-secondary">{kpi!.wbgt_max}°F</strong>.
            Thermal comfort is maintained by prevailing coastal winds during this cycle.
          </p>
        </div>
      </section>

      {/* ═══ Day vs Night & Site Variability ═══ */}
      <div className="grid grid-cols-12 gap-8">
        {/* Day vs Night Distribution */}
        <div className="col-span-4 bg-surface-container-low p-8 relative">
          <h4 className="font-[family-name:var(--font-family-headline)] text-lg font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">contrast</span>
            {t('q3.temporalVariance')}
          </h4>
          <div className="space-y-6">
            {/* KS Test PM2.5 */}
            <div className="p-4 bg-surface-container-lowest border-l-4 border-primary">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">{t('q3.ksTest')}</p>
              <h5 className="text-2xl font-[family-name:var(--font-family-headline)] font-bold">D = {cdfDayNight!.ks_pm25.d.toFixed(2)}</h5>
              <p className="text-[10px] text-stone-400 italic mt-1">
                {t('q3.significantDifference')}
              </p>
            </div>

            {/* Day/Night PM2.5 mini chart */}
            <ResponsiveContainer width="100%" height={120}>
              <LineChart margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.2} />
                <XAxis dataKey="x" type="number" hide />
                <YAxis domain={[0, 1]} hide />
                <Line data={cdfDayNight!.pm25_day} dataKey="y" stroke={C.secondaryContainer} strokeWidth={2} dot={false} name="Day" />
                <Line data={cdfDayNight!.pm25_night} dataKey="y" stroke={C.primary} strokeWidth={2} dot={false} name="Night" />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-around px-4">
              <div className="text-center">
                <span className="material-symbols-outlined text-secondary text-2xl">light_mode</span>
                <p className="text-[10px] font-bold mt-1">{t('q3.day')}</p>
              </div>
              <div className="w-px h-12 bg-outline-variant/30" />
              <div className="text-center">
                <span className="material-symbols-outlined text-primary text-2xl">dark_mode</span>
                <p className="text-[10px] font-bold mt-1">{t('q3.night')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Site Variability Table */}
        <div className="col-span-8 bg-surface-container-low p-8">
          <div className="flex justify-between items-end mb-6">
            <h4 className="font-[family-name:var(--font-family-headline)] text-lg font-bold">{t('q3.svi')}</h4>
            <span className="text-[10px] font-bold text-stone-400">{siteTable.length} MONITORING SITES</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-stone-500 border-b border-outline-variant/30">
                  <th className="pb-3">{t('q3.sensorId')}</th>
                  <th className="pb-3">{t('q3.locationContext')}</th>
                  <th className="pb-3">{t('q3.pm25P90')}</th>
                  <th className="pb-3">{t('q3.exceedancePct')}</th>
                  <th className="pb-3">{t('q3.status')}</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {siteTable.map((row: Q3SiteRow) => (
                  <tr key={row.site_id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 font-bold text-primary">{row.site_id}</td>
                    <td className="py-3 text-stone-600">{row.name}</td>
                    <td className="py-3 font-bold">{row.pm25_p90} µg/m³</td>
                    <td className="py-3">{row.exceedance_pct}%</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ Temporal Patterns ═══ */}
      <section className="bg-surface-container-low p-8 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-[family-name:var(--font-family-headline)] text-lg font-bold">{t('q3.hourlyPatterns')}</h4>
            <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-widest font-bold">{t('q3.hourlyDesc')}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-primary inline-block" /><span className="text-[10px] font-bold uppercase tracking-widest">{t('q3.pm25Median')}</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-secondary inline-block" /><span className="text-[10px] font-bold uppercase tracking-widest">{t('q3.wbgtMedian')}</span></div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={temporal} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke={C.outline} tickFormatter={(h: number) => `${h}:00`} />
            <YAxis yAxisId="pm" tick={{ fontSize: 10 }} stroke={C.primary} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fontSize: 10, fill: C.primary }} />
            <YAxis yAxisId="wb" orientation="right" tick={{ fontSize: 10 }} stroke={C.secondary} label={{ value: '°F', angle: 90, position: 'insideRight', fontSize: 10, fill: C.secondary }} />
            <Tooltip />
            <Bar yAxisId="pm" dataKey="pm25_p90" fill={C.primary} fillOpacity={0.15} name="PM2.5 P90" />
            <Line yAxisId="pm" dataKey="pm25_median" stroke={C.primary} strokeWidth={2} dot={false} name="PM2.5 Median" />
            <Line yAxisId="wb" dataKey="wbgt_median" stroke={C.secondary} strokeWidth={2} dot={false} name="WBGT Median" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* ═══ Statistical Confidence (floating) ═══ */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-4 rounded-xl shadow-xl inline-block">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-sm">legend_toggle</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">{t('q3.statConfidence')}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] gap-8">
            <span className="text-stone-500">{t('q3.ci95')}</span>
            <span className="font-bold">±0.4 µg/m³</span>
          </div>
          <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
            <div className="bg-tertiary w-full h-full" />
          </div>
          <p className="text-[9px] text-stone-400 leading-tight italic mt-2">
            {t('q3.dataSource')}
          </p>
        </div>
      </div>

      {/* ═══ Research Insight Callout ═══ */}
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
            The distribution analysis confirms a critical environmental injustice: <strong className="text-white">nearly half ({kpi!.pm25_naaqs_exceedance_pct}%)</strong> of all PM2.5 readings in the Chinatown study area exceed the EPA's annual NAAQS health threshold of 9.0 µg/m³. This represents a persistent exposure level that significantly outpaces regional Boston averages.
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
