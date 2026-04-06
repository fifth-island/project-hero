import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, LineChart, Line, ComposedChart, Cell,
} from 'recharts'
import { useQ2Data, type SiteRow } from '../hooks/useQ2Data'
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
}

const SITE_COLORS: Record<string, string> = {
  berkley: '#6f070f', castle: '#902223', chin: '#87512d', dewey: '#c48a5a',
  eliotnorton: '#003e2f', greenway: '#005744', lyndenboro: '#3a9e7e', msh: '#8b716f',
  oxford: '#a93533', reggie: '#6b3a18', taitung: '#2e7d5e', tufts: '#d4766a',
}

function siteColor(site: string) { return SITE_COLORS[site] ?? C.outline }
function biasColor(v: number) { return Math.abs(v) < 0.5 ? 'text-tertiary' : Math.abs(v) < 1.0 ? 'text-secondary' : 'text-error font-bold' }
function rColor(v: number) { return v >= 0.90 ? 'text-tertiary' : v >= 0.85 ? 'text-secondary' : 'text-error' }
function healthColor(h: number) { return h >= 90 ? 'bg-tertiary' : h >= 80 ? 'bg-secondary' : 'bg-primary' }

function biasToRgb(bias: number): string {
  // blue (negative) -> white (0) -> red (positive)
  const t = Math.min(Math.max((bias + 2) / 4, 0), 1)
  const r = Math.round(60 + t * 150)
  const g = Math.round(80 - Math.abs(t - 0.5) * 100)
  const b = Math.round(200 - t * 170)
  return `rgb(${r},${g},${b})`
}

export default function ResearchQ2() {
  const { scatterDep, scatterWs, blandAltman, siteTable, diurnal, rolling, assets, tempRh, loading } = useQ2Data()
  const { t } = useTranslation()

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  const tempBins = ['60-65', '65-70', '70-75', '75-80', '80-85', '85-95']
  const rhBins = ['<40%', '40-50%', '50-60%', '60-70%', '70-80%', '>80%']
  const heatGrid = rhBins.map(rh => tempBins.map(t => tempRh.find(c => c.temp === t && c.humidity === rh)))

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Hero Banner ═══ */}
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
          <div className="flex flex-wrap gap-3 pt-4">
            {[t('q2.studyPeriod'), t('q2.monitoringSites'), t('q2.pairedObs')].map((tag) => (
              <span key={tag} className="bg-surface-container px-4 py-2 text-xs font-bold text-secondary-container border border-secondary-container/30 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          {/* DEP KPI */}
          <div className="bg-surface-container-highest p-6 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5 pointer-events-none"><span className="material-symbols-outlined text-8xl">thermostat</span></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-1">{t('q2.vsDepR')}</p>
            <div className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-tertiary">0.90</div>
            <p className="text-[10px] text-stone-500 mt-1">{t('q2.goldStandard')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 shadow-sm border border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">{t('q2.depRmse')}</p>
              <div className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-tertiary">3.10 <span className="text-xs font-normal text-stone-400">°F</span></div>
            </div>
            <div className="bg-white p-6 shadow-sm border border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">{t('q2.depBias')}</p>
              <div className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-tertiary">−0.37 <span className="text-xs font-normal text-stone-400">°F</span></div>
            </div>
          </div>
          {/* WS KPI — warning */}
          <div className="bg-error-container p-6 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-10 pointer-events-none"><span className="material-symbols-outlined text-8xl">warning</span></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-error mb-1">{t('q2.vsWsR')}</p>
            <div className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-error">0.60</div>
            <p className="text-[10px] text-on-error-container mt-1">{t('q2.unsuitable')}</p>
          </div>
        </div>
      </section>

      {/* ═══ Dual Scatter Plots ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Kestrel vs DEP */}
        <div className="bg-surface-container-low p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-tertiary">{t('q2.kestrelVsDep')}</h3>
            <span className="text-[10px] uppercase tracking-widest bg-stone-200 px-2 py-1">n = {scatterDep!.regression.n.toLocaleString()}</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
              <XAxis dataKey="dep" type="number" name="DEP Nubian" unit="°F" domain={[55, 100]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'DEP Nubian (°F)', position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }} />
              <YAxis dataKey="kes" type="number" name="Kestrel" unit="°F" domain={[55, 100]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'Kestrel (°F)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: C.onSurfaceVariant }} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                formatter={(v: any, name: any) => [`${v}°F`, name]} />
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
            <span className="font-bold text-tertiary">r = 0.90 | RMSE = 3.10°F</span>
          </div>
        </div>

        {/* Kestrel vs WS */}
        <div className="bg-surface-container-low p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-error">{t('q2.kestrelVsWs')}</h3>
            <span className="text-[10px] uppercase tracking-widest bg-error-container px-2 py-1 text-error">{t('q2.poor')}</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
              <XAxis dataKey="ws" type="number" name="WS Rooftop" unit="°F" domain={[55, 100]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'WS 35 Kneeland (°F)', position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }} />
              <YAxis dataKey="kes" type="number" name="Kestrel" unit="°F" domain={[55, 100]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'Kestrel (°F)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: C.onSurfaceVariant }} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                formatter={(v: any, name: any) => [`${v}°F`, name]} />
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
            <span className="font-bold text-error">r = 0.60 | RMSE = 7.03°F</span>
          </div>
        </div>
      </section>

      {/* ═══ Diurnal Pattern — The Critical Finding ═══ */}
      <section className="bg-surface-container-low p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary">{t('q2.diurnalCycle')}</h3>
            <p className="text-xs text-on-surface-variant mt-1">The rooftop weather station has a <strong className="text-error">4-hour thermal lag</strong> — an inverted diurnal cycle</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-error-container rounded-full">
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
              label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: C.onSurfaceVariant }} />
            <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
              formatter={(v: any, name: any) => [`${v}°F`, name]}
              labelFormatter={(h: any) => `${h}:00`} />
            <Line type="monotone" dataKey="kestrel" stroke={C.secondary} strokeWidth={2.5} dot={false} name={t('q2.kestrelGround')} />
            <Line type="monotone" dataKey="dep" stroke={C.tertiary} strokeWidth={2.5} dot={false} name={t('q2.depNubian')} />
            <Line type="monotone" dataKey="ws" stroke={C.error} strokeWidth={2} strokeDasharray="6 4" dot={false} name={t('q2.wsRooftop')} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center border-t border-outline-variant/20 pt-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-0.5 bg-secondary" />
            <span className="text-xs font-bold text-secondary">Kestrel — peak ~2 PM</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-0.5 bg-tertiary" />
            <span className="text-xs font-bold text-tertiary">DEP Nubian — tracks Kestrel</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-0.5 bg-error border-dashed border-t" />
            <span className="text-xs font-bold text-error">WS — peak ~6 PM (4hr lag)</span>
          </div>
        </div>
      </section>

      {/* ═══ Bland-Altman Dual ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-container-low p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-tertiary">Bland-Altman: vs DEP</h3>
            <span className="text-[10px] uppercase tracking-widest text-stone-400">LOA ±6°F</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
              <XAxis dataKey="mean" type="number" name="Mean" domain={[55, 100]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: '(Kes + DEP) / 2 (°F)', position: 'bottom', offset: 15, fontSize: 10 }} />
              <YAxis dataKey="diff" type="number" name="Difference" domain={[-15, 15]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'Kes − DEP (°F)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={C.outlineVariant} />
              <ReferenceLine y={blandAltman!.dep.stats.mean_bias} stroke={C.tertiary} strokeWidth={1.5}
                label={{ value: `Bias: ${blandAltman!.dep.stats.mean_bias}°F`, position: 'right', fontSize: 9, fill: C.tertiary }} />
              <ReferenceLine y={blandAltman!.dep.stats.loa_upper} stroke={C.secondary} strokeDasharray="6 4" />
              <ReferenceLine y={blandAltman!.dep.stats.loa_lower} stroke={C.secondary} strokeDasharray="6 4" />
              <Scatter data={blandAltman!.dep.points.slice(0, 600)} fill={C.tertiary} fillOpacity={0.25} r={2} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface-container-low p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-error">Bland-Altman: vs WS</h3>
            <span className="text-[10px] uppercase tracking-widest text-error">LOA &gt;22°F!</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
              <XAxis dataKey="mean" type="number" name="Mean" domain={[55, 100]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: '(Kes + WS) / 2 (°F)', position: 'bottom', offset: 15, fontSize: 10 }} />
              <YAxis dataKey="diff" type="number" name="Difference" domain={[-25, 25]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'Kes − WS (°F)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={C.outlineVariant} />
              <ReferenceLine y={blandAltman!.ws.stats.mean_bias} stroke={C.error} strokeWidth={1.5}
                label={{ value: `Bias: +${blandAltman!.ws.stats.mean_bias}°F`, position: 'right', fontSize: 9, fill: C.error }} />
              <ReferenceLine y={blandAltman!.ws.stats.loa_upper} stroke={C.error} strokeDasharray="6 4" />
              <ReferenceLine y={blandAltman!.ws.stats.loa_lower} stroke={C.error} strokeDasharray="6 4" />
              <Scatter data={blandAltman!.ws.points.slice(0, 600)} fill={C.error} fillOpacity={0.2} r={2} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ═══ Site Table ═══ */}
      <section className="bg-white shadow-sm overflow-hidden">
        <div className="px-8 py-6 bg-surface-container flex justify-between items-center">
          <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary">Site-Specific Performance</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{siteTable.length} Sites • vs DEP Nubian</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
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
                      {site.name}
                      {site.site_id === 'oxford' && <span className="bg-error text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter">{t('q2.warmest')}</span>}
                      {site.site_id === 'eliotnorton' && <span className="bg-tertiary text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter">{t('q2.coolest')}</span>}
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-bold ${rColor(site.r_dep)}`}>{site.r_dep.toFixed(2)}</td>
                  <td className={`px-6 py-4 text-sm ${biasColor(site.bias_dep)}`}>{site.bias_dep >= 0 ? '+' : ''}{site.bias_dep.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">{site.rmse_dep.toFixed(1)}</td>
                  <td className="px-6 py-4 text-sm text-error">{site.r_ws.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">{site.mean_temp_f.toFixed(1)}°F</td>
                  <td className="px-6 py-4 text-xs text-stone-400 text-right">{site.n.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ Modifier Panels ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Thermal Mass Discovery */}
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
              <p className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">13.5°F</p>
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
            Concrete roofing absorbs solar radiation during the day and releases stored heat at night.
          </p>
        </div>

        {/* Rolling Stability */}
        <div className="bg-white p-8 border border-stone-100">
          <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary mb-2">Rolling 7-Day Stability</h4>
          <p className="text-xs text-stone-500 mb-4">DEP consistently strong; WS consistently poor.</p>
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
          <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DEP Range</p>
              <p className="text-sm font-[family-name:var(--font-family-headline)] font-bold text-tertiary">0.87 – 0.93</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">WS Range</p>
              <p className="text-sm font-[family-name:var(--font-family-headline)] font-bold text-error">0.42 – 0.73</p>
            </div>
          </div>
        </div>

        {/* Temp × Humidity heatmap */}
        <div className="bg-tertiary-container text-white p-8 flex flex-col justify-between">
          <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl mb-2">Temp × Humidity Bias</h4>
          <div className="my-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              <div />
              {tempBins.map(t => <div key={t} className="text-[8px] text-center opacity-70">{t}°F</div>)}
            </div>
            {heatGrid.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-1 mb-1">
                <div className="text-[8px] flex items-center justify-end pr-1 opacity-70">{rhBins[ri]}</div>
                {row.map((cell, ci) => (
                  <div key={ci} className="aspect-square flex items-center justify-center rounded-sm text-[8px] font-bold"
                    style={{ background: biasToRgb(cell?.bias ?? 0), color: 'rgba(255,255,255,0.9)' }}
                    title={cell ? `${cell.temp}°F, ${cell.humidity}: bias=${cell.bias}°F, n=${cell.n}` : 'No data'}>
                    {cell?.bias != null ? cell.bias.toFixed(1) : '—'}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-[10px] font-medium leading-tight opacity-80">Hot+dry → positive bias (solar heating). Cool+humid → negative bias (evaporative cooling).</p>
        </div>
      </section>

      {/* ═══ UHI + Greenspace ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 border border-stone-100 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(45deg, rgba(0,62,47,0.04) 25%, transparent 25%, transparent 50%, rgba(0,62,47,0.04) 50%, rgba(0,62,47,0.04) 75%, transparent 75%, transparent)',
            backgroundSize: '40px 40px',
          }} />
          <div className="relative z-10 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-6">Urban Heat Island Effect</div>
            <div className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary tracking-tight">
              1.4°F
            </div>
            <p className="text-sm text-on-surface-variant mt-2">range across 12 sites</p>
            <div className="mt-8 pt-8 border-t border-stone-100 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Hottest</div>
                <div className="text-sm font-bold text-error">Castle Square — 75.3°F</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Coolest</div>
                <div className="text-sm font-bold text-tertiary">Mary Soo Hoo — 73.9°F</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container p-10">
          <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary mb-4">Greenspace Association</h3>
          <p className="text-sm text-on-surface-variant mb-8">Greenspace within 50m is the strongest predictor of temperature bias between Kestrel and DEP.</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Greenspace vs DEP Bias (r)</span>
              <span className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-tertiary">−0.84</span>
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
      </section>

      {/* ═══ Asset Registry ═══ */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-3xl text-primary">Kestrel Fleet Registry</h3>
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
                  r(DEP): <span className={`font-bold ${rColor(card.r_dep)}`}>{card.r_dep.toFixed(2)}</span> | Bias: <span className={biasColor(card.bias_dep)}>{card.bias_dep >= 0 ? '+' : ''}{card.bias_dep.toFixed(2)}°F</span>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>Health</span>
                    <span>{card.health}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
                    <div className={`h-full ${healthColor(card.health)} rounded-full`} style={{ width: `${card.health}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══ Executive Summary ═══ */}
      <footer className="bg-primary p-12 text-on-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <span className="material-symbols-outlined text-[144px]">format_quote</span>
        </div>
        <div className="relative z-10 max-w-3xl">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 text-on-primary-container">Executive Summary</h3>
          <blockquote className="text-3xl font-[family-name:var(--font-family-headline)] italic leading-snug">
            "Using a rooftop sensor for ground-level heat is like checking the temperature in your attic
            to decide what to wear outside. The DEP Nubian monitor is the true reference — and our Kestrel
            network reveals a 1.4°F urban heat island that no single station can capture."
          </blockquote>
          <div className="mt-8 flex items-center gap-4">
            <div className="w-12 h-px bg-on-primary-container" />
            <div className="text-sm font-bold uppercase tracking-widest">Tufts Environmental Research Collaboration</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
