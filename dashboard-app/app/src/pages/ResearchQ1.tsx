import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, AreaChart, Area, Line, ComposedChart, BarChart, Bar, Cell,
} from 'recharts'
import { useQ1Data, type SiteRow } from '../hooks/useQ1Data'

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
function r2Color(v: number) { return v >= 0.9 ? 'text-tertiary' : v >= 0.85 ? 'text-secondary' : 'text-error' }
function biasColor(v: number) { return Math.abs(v) < 1.0 ? 'text-tertiary' : Math.abs(v) < 2.0 ? 'text-secondary' : 'text-error font-bold' }
function rmseColor(v: number) { return v < 2.0 ? 'text-tertiary' : v <= 3.0 ? 'text-secondary' : 'text-error' }
function healthColor(h: number) { return h >= 90 ? 'bg-tertiary' : h >= 80 ? 'bg-secondary' : 'bg-primary' }

function biasToRgb(bias: number | null): string {
  if (bias === null) return '#e5e5e5'
  const t = Math.min(Math.max(bias, 0) / 5, 1)
  const r = Math.round(0 + t * 111)
  const g = Math.round(62 - t * 55)
  const b = Math.round(47 - t * 32)
  return `rgb(${r},${g},${b})`
}

export default function ResearchQ1() {
  const { scatter, blandAltman, siteTable, concBias, diurnal, rolling, heatmap, assets, loading } = useQ1Data()

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">Loading sensor validation data…</p>
    </div>
  )

  const tempLabels = ['60-70', '70-75', '75-80', '80-85', '85-95']
  const humidLabels = ['<50%', '50-60%', '60-70%', '70-80%', '>80%']
  const heatGrid = humidLabels.map(h => tempLabels.map(t => heatmap.find(c => c.temp === t && c.humidity === h)))
  const reg = scatter!.regression

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Hero Banner ═══ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30">
            <div className="w-2 h-2 rounded-full bg-tertiary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary">Tufts Verified • Version 2.4</span>
          </div>
          <h2 className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary tracking-tight leading-none">Calibration Fidelity Ledger</h2>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            This protocol evaluates the operational consistency of PurpleAir PA-II sensors against the
            MassDEP Federal Equivalent Method (FEM) at the Harrison Ave site. Validation ensures that
            high-resolution community data maintains scholarly rigor through rigorous regression modeling.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            {['Within ±5 µg/m³ (94.6%)', 'Paired Observations (47,009)', 'Sensor Drift (None Detected)'].map((tag) => (
              <span key={tag} className="bg-surface-container px-4 py-2 text-xs font-bold text-secondary-container border border-secondary-container/30 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          <div className="bg-surface-container-highest p-6 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5 pointer-events-none"><span className="material-symbols-outlined text-8xl">analytics</span></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Pearson Correlation (r)</p>
            <div className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-primary">0.939</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 shadow-sm border border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">RMSE</p>
              <div className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-secondary">2.53 <span className="text-xs font-normal text-stone-400">μg/m³</span></div>
            </div>
            <div className="bg-white p-6 shadow-sm border border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Mean Bias</p>
              <div className="text-2xl font-[family-name:var(--font-family-headline)] font-bold text-tertiary">+1.53 <span className="text-xs font-normal text-stone-400">μg/m³</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Scatter + Bland-Altman ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-container-low p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary">Correlation Analysis</h3>
            <span className="text-[10px] uppercase tracking-widest bg-stone-200 px-2 py-1">n = {reg.n.toLocaleString()}</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
              <XAxis dataKey="pa" type="number" name="Purple Air" unit=" µg/m³" domain={[0, 30]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'Purple Air PM2.5 (µg/m³)', position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }} />
              <YAxis dataKey="dep" type="number" name="MassDEP FEM" unit=" µg/m³" domain={[0, 30]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'MassDEP FEM (µg/m³)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: C.onSurfaceVariant }} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                formatter={(v: any, name: any) => [`${v} µg/m³`, name]} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 30, y: 30 }]} stroke={C.outlineVariant} strokeDasharray="6 4" strokeWidth={1} />
              <ReferenceLine segment={[{ x: 0, y: reg.intercept }, { x: 30, y: reg.slope * 30 + reg.intercept }]} stroke={C.primary} strokeWidth={2} />
              <Scatter data={scatter!.points} fill={C.primary} fillOpacity={0.35} r={2.5}>
                {scatter!.points.map((p, i) => (
                  <Cell key={i} fill={siteColor(p.site)} fillOpacity={0.4} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-between text-xs text-on-surface-variant">
            <span className="italic">PA-II vs MassDEP FEM BAM-1022 • 10-min intervals</span>
            <span className="font-bold">y = {reg.slope}x + {reg.intercept} | R² = {reg.r2}</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary">Bland-Altman Agreement</h3>
            <span className="material-symbols-outlined text-secondary">legend_toggle</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
              <XAxis dataKey="mean" type="number" name="Mean" unit=" µg/m³" domain={[0, 25]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: '(PA + DEP) / 2 (µg/m³)', position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }} />
              <YAxis dataKey="diff" type="number" name="Difference" domain={[-10, 15]}
                tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'PA − DEP (µg/m³)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: C.onSurfaceVariant }} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={C.outlineVariant} strokeWidth={1} />
              <ReferenceLine y={blandAltman!.stats.mean_bias} stroke={C.primary} strokeWidth={1.5}
                label={{ value: `Bias: +${blandAltman!.stats.mean_bias}`, position: 'right', fontSize: 10, fill: C.primary }} />
              <ReferenceLine y={blandAltman!.stats.loa_upper} stroke={C.secondary} strokeDasharray="6 4"
                label={{ value: `+${blandAltman!.stats.loa_upper}`, position: 'right', fontSize: 9, fill: C.secondary }} />
              <ReferenceLine y={blandAltman!.stats.loa_lower} stroke={C.secondary} strokeDasharray="6 4"
                label={{ value: `${blandAltman!.stats.loa_lower}`, position: 'right', fontSize: 9, fill: C.secondary }} />
              <Scatter data={blandAltman!.points} fill={C.tertiary} fillOpacity={0.3} r={2}>
                {blandAltman!.points.map((p, i) => (
                  <Cell key={i} fill={siteColor(p.site)} fillOpacity={0.35} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-6 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" /> Mean Bias: {blandAltman!.stats.mean_bias}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary" /> LOA Width: {blandAltman!.stats.loa_width} µg/m³
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Site Table (all 12) ═══ */}
      <section className="bg-white shadow-sm overflow-hidden">
        <div className="px-8 py-6 bg-surface-container flex justify-between items-center">
          <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary">Site-Specific Performance</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{siteTable.length} Sites • Sorted by Bias</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {['Monitoring Site', 'Slope', 'Intercept', 'R²', 'RMSE', 'Bias (µg/m³)', 'N'].map(h => (
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
                      {site.site_id === 'castle' && <span className="bg-tertiary text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter">Best Agreement</span>}
                      {site.site_id === 'greenway' && <span className="bg-error text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter">Highest Bias</span>}
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm ${site.slope > 1.25 ? 'text-error font-bold' : ''}`}>{site.slope.toFixed(3)}</td>
                  <td className="px-6 py-4 text-sm">{site.intercept >= 0 ? '+' : ''}{site.intercept.toFixed(3)}</td>
                  <td className={`px-6 py-4 font-bold ${r2Color(site.r_squared)}`}>{site.r_squared.toFixed(3)}</td>
                  <td className={`px-6 py-4 text-sm ${rmseColor(site.rmse)}`}>{site.rmse.toFixed(2)}</td>
                  <td className={`px-6 py-4 text-sm ${biasColor(site.bias)}`}>{site.bias >= 0 ? '+' : ''}{site.bias.toFixed(2)}</td>
                  <td className="px-6 py-4 text-xs text-stone-400 text-right">{site.n.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ Bias Modifier Panels ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 bg-surface-container-low p-8 flex flex-col justify-between">
          <div>
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary mb-2">Bias by PM2.5 Level</h4>
            <p className="text-xs text-stone-500 mb-4">Higher concentration trends toward increased sensor divergence.</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={concBias} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.2} horizontal={false} />
              <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                label={{ value: 'Mean Bias (µg/m³)', position: 'bottom', offset: 0, fontSize: 10 }} />
              <YAxis dataKey="bin" type="category" tick={{ fontSize: 9, fill: C.onSurfaceVariant }} width={80} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                formatter={(v: any) => [`${v} µg/m³`, 'Bias']} />
              <Bar dataKey="bias" radius={[0, 4, 4, 0]}>
                {concBias.map((entry, i) => {
                  const t = Math.min(entry.bias / 3.5, 1)
                  return <Cell key={i} fill={`rgb(${Math.round(t * 111)},${Math.round(62 - t * 48)},${Math.round(47 - t * 32)})`} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 border border-stone-100 flex flex-col justify-between">
          <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-secondary mb-2">Diurnal Bias</h4>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={diurnal} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="diurnalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.secondary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.secondary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: C.onSurfaceVariant }} tickFormatter={(h: number) => h % 6 === 0 ? `${h}h` : ''} />
              <YAxis domain={[0, 3]} tick={{ fontSize: 9, fill: C.onSurfaceVariant }} />
              <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }} formatter={(v: any) => [`${v} µg/m³`, 'Bias']} labelFormatter={(h: any) => `${h}:00`} />
              <ReferenceLine y={1.53} stroke={C.primary} strokeDasharray="4 4" strokeWidth={1} />
              <Area type="monotone" dataKey="bias" stroke={C.secondary} fill="url(#diurnalGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-400">PEAK</span>
              <span className="text-sm font-[family-name:var(--font-family-headline)] font-bold text-secondary">
                {diurnal.length > 0 ? `${diurnal.reduce((max, d) => d.bias > max.bias ? d : max, diurnal[0]).hour}:00 — +${diurnal.reduce((max, d) => d.bias > max.bias ? d : max, diurnal[0]).bias} µg/m³` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-tertiary-container text-white p-8 flex flex-col justify-between">
          <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl mb-2">Temp × Humidity</h4>
          <div className="my-4">
            <div className="grid grid-cols-6 gap-1 mb-1">
              <div />
              {tempLabels.map(t => <div key={t} className="text-[8px] text-center opacity-70">{t}°F</div>)}
            </div>
            {heatGrid.map((row, ri) => (
              <div key={ri} className="grid grid-cols-6 gap-1 mb-1">
                <div className="text-[8px] flex items-center justify-end pr-1 opacity-70">{humidLabels[ri]}</div>
                {row.map((cell, ci) => (
                  <div key={ci} className="aspect-square flex items-center justify-center rounded-sm text-[8px] font-bold"
                    style={{ background: biasToRgb(cell?.bias ?? null), color: (cell?.bias ?? 0) > 2.5 ? 'white' : 'rgba(255,255,255,0.85)' }}
                    title={cell ? `${cell.temp}°F, ${cell.humidity}: bias=${cell.bias}, n=${cell.n}` : 'No data'}>
                    {cell?.bias != null ? cell.bias.toFixed(1) : '—'}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-[10px] font-medium leading-tight opacity-80">Interaction effects become significant above 85°F and moderate humidity.</p>
        </div>
      </section>

      {/* ═══ Asset Registry + Temporal Stability ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-3xl text-primary">Active Asset Registry</h3>
            <span className="text-xs uppercase tracking-widest text-tertiary font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /> {assets.length}/{assets.length} Online
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {assets.map((card) => (
              <div key={card.id} className="bg-white p-5 border border-stone-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[10px] font-bold text-stone-400">{card.id}</div>
                  <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div className="font-[family-name:var(--font-family-headline)] font-bold text-stone-800 truncate text-sm mb-1">{card.name}</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-lg font-[family-name:var(--font-family-headline)] font-bold ${r2Color(card.r_squared)}`}>{card.r_squared.toFixed(3)}</span>
                  <span className="text-[9px] text-stone-400 uppercase tracking-widest">R²</span>
                </div>
                <div className="text-[10px] text-stone-400 mb-3">
                  Bias: <span className={biasColor(card.bias)}>{card.bias >= 0 ? '+' : ''}{card.bias.toFixed(2)}</span> | RMSE: {card.rmse.toFixed(2)}
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${healthColor(card.health)} rounded-full`} style={{ width: `${card.health}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-low p-8 border-l-4 border-primary flex-1">
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary mb-4">Temporal Stability</h4>
            <ResponsiveContainer width="100%" height={120}>
              <ComposedChart data={rolling} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: C.onSurfaceVariant }} tickFormatter={(d: string) => d.slice(5)} interval={4} />
                <YAxis yAxisId="r" domain={[0.8, 1]} tick={{ fontSize: 8, fill: C.tertiary }} />
                <YAxis yAxisId="rmse" orientation="right" domain={[1, 4]} tick={{ fontSize: 8, fill: C.primary }} />
                <Tooltip contentStyle={{ background: C.surface, fontSize: 10 }} />
                <ReferenceLine yAxisId="r" y={0.9} stroke={C.outlineVariant} strokeDasharray="4 4" />
                <Line yAxisId="r" dataKey="r" stroke={C.tertiary} strokeWidth={2} dot={false} name="Pearson r" />
                <Line yAxisId="rmse" dataKey="rmse" stroke={C.primary} strokeWidth={1.5} dot={false} name="RMSE" strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="pt-6 border-t border-stone-200 space-y-4 mt-4">
              {[
                { icon: 'trending_down', label: 'Min Rolling r', value: rolling.length ? Math.min(...rolling.map(r => r.r)).toFixed(3) : '—', color: 'text-secondary' },
                { icon: 'trending_up', label: 'Max Rolling r', value: rolling.length ? Math.max(...rolling.map(r => r.r)).toFixed(3) : '—', color: 'text-tertiary' },
                { icon: 'check_circle', label: 'Long-term Drift', value: 'Negligible', color: 'text-stone-800' },
                { icon: 'schedule', label: 'Study Duration', value: '36 Days', color: 'text-stone-800' },
              ].map(kpi => (
                <div key={kpi.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-stone-100">
                    <span className="material-symbols-outlined text-sm text-secondary">{kpi.icon}</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{kpi.label}</div>
                    <div className={`text-sm font-[family-name:var(--font-family-headline)] font-bold ${kpi.color}`}>{kpi.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ═══ Transfer Function + Ref-to-Ref ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 border border-stone-100 relative overflow-hidden flex items-center">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(45deg, rgba(144,34,35,0.03) 25%, transparent 25%, transparent 50%, rgba(144,34,35,0.03) 50%, rgba(144,34,35,0.03) 75%, transparent 75%, transparent)',
            backgroundSize: '40px 40px',
          }} />
          <div className="relative z-10 w-full text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-6">Derived Transfer Function</div>
            <div className="text-3xl md:text-4xl font-[family-name:var(--font-family-headline)] font-bold text-primary tracking-tight">
              DEP<span className="text-lg align-sub">est</span> = 0.7376 × PA + 0.9596
            </div>
            <div className="mt-8 pt-8 border-t border-stone-100 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Metric</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Before → After</div>
              </div>
              <div>
                <div className="text-xs text-stone-500">Bias</div>
                <div className="text-sm font-bold">+1.53 → <span className="text-tertiary">0.00</span></div>
              </div>
              <div>
                <div className="text-xs text-stone-500">RMSE</div>
                <div className="text-sm font-bold">2.53 → <span className="text-tertiary">1.44</span></div>
              </div>
            </div>
            <p className="mt-6 text-xs text-stone-500 italic">PA data uses ALT-CF3 correction. Barkjohn would double-correct.</p>
          </div>
        </div>

        <div className="bg-surface-container p-10">
          <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary mb-4">Reference-to-Reference</h3>
          <p className="text-sm text-on-surface-variant mb-8">Verification of Chinatown FEM versus regional Boston (Nubian Sq) monitors to ensure baseline consistency.</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Chinatown Harrison Ave</span>
              <span className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-primary">7.96 <span className="text-[8px] text-stone-400">μg/m³ mean</span></span>
            </div>
            <div className="flex justify-between items-center bg-white/50 p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Nubian Square FEM</span>
              <span className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-stone-400">8.07 <span className="text-[8px] text-stone-400">μg/m³ mean</span></span>
            </div>
            <div className="flex justify-between items-center py-2 px-4 border-t border-primary/20">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Agreement (r)</span>
              <span className="text-sm font-[family-name:var(--font-family-headline)] font-bold text-tertiary">0.96</span>
            </div>
            <div className="flex justify-between items-center py-2 px-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">RMSE (accuracy floor)</span>
              <span className="text-sm font-[family-name:var(--font-family-headline)] font-bold text-tertiary">1.23 µg/m³</span>
            </div>
          </div>
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
            "Purple Air sensors in Chinatown track official monitors with 94% correlation,
            but read 1–2 µg/m³ high — and this bias doubles during hot afternoons when
            health decisions matter most. Our study-specific calibration eliminates this bias entirely."
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

