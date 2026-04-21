import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine,
} from 'recharts'
import { useQ9Data } from '../hooks/useQ9Data'
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
}

const SITE_COLORS: Record<string, string> = {
  tufts: '#2196f3', berkley: '#4caf50', castle: '#ff9800',
  chin: '#9c27b0', greenway: '#607d8b', taitung: '#e91e63',
  reggie: '#00bcd4', dewey: '#8bc34a', lyndenboro: '#ff5722',
  oxford: '#795548', eliotnorton: '#f44336', msh: '#ffc107',
}

type TargetVar = 'pm25' | 'wbgt'

export default function ResearchQ9() {
  const { t } = useTranslation()
  const { kpi, profiles, scatterPm25, scatterWbgt, corrSummary, regression, loading } = useQ9Data()
  const [target, setTarget] = useState<TargetVar>('pm25')
  const [selectedLu, setSelectedLu] = useState<string>('Roads 50m')
  const [showReport, setShowReport] = useState(false)

  const luVars = useMemo(() => corrSummary.map(c => c.lu_var), [corrSummary])

  // Scatter points for selected LU var
  const scatterData = useMemo(() => {
    const src = target === 'pm25' ? scatterPm25 : scatterWbgt
    return src.filter(p => p.lu_var === selectedLu && !p._type)
  }, [target, selectedLu, scatterPm25, scatterWbgt])

  // Regression line for selected LU var
  const regLine = useMemo(() => {
    const src = target === 'pm25' ? scatterPm25 : scatterWbgt
    return src.find(p => p.lu_var === selectedLu && p._type === 'regression')
  }, [target, selectedLu, scatterPm25, scatterWbgt])

  // Correlation bars sorted
  const corrBars = useMemo(() => {
    return corrSummary.map(c => ({
      ...c,
      r: target === 'pm25' ? c.r_pm25 : c.r_wbgt,
      sig: target === 'pm25' ? c.sig_pm25 : c.sig_wbgt,
      p: target === 'pm25' ? c.p_pm25 : c.p_wbgt,
    })).sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
  }, [corrSummary, target])

  // Regression coef bars
  const regBars = useMemo(() => {
    return regression.map(r => ({
      ...r,
      beta: target === 'pm25' ? r.beta_pm25 : r.beta_wbgt,
      se: target === 'pm25' ? r.se_pm25 : r.se_wbgt,
      p: target === 'pm25' ? r.p_pm25 : r.p_wbgt,
    })).sort((a, b) => Math.abs(b.beta) - Math.abs(a.beta))
  }, [regression, target])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  const yKey = target === 'pm25' ? 'pm25' : 'wbgt'
  const yLabel = target === 'pm25' ? 'Mean PM2.5 (µg/m³)' : 'Mean WBGT (°F)'
  const yUnit = target === 'pm25' ? ' µg/m³' : '°F'

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary mb-2">{t('q9.title')}</h1>
            <p className="text-secondary max-w-2xl font-[family-name:var(--font-family-headline)] italic text-lg">
              {t('q9.description')}
            </p>
          </div>
          <div className="bg-surface-container-highest/50 backdrop-blur-sm p-4 rounded-lg border border-primary/10 shrink-0 text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">{t('q9.luVariables')}</span>
            <span className="text-xl font-black text-primary">{kpi!.n_lu_vars}</span>
            <span className="text-[10px] text-stone-400 block">{t('q9.luVarDesc')}</span>
          </div>
        </div>
      </header>

      {/* ═══ KPI Grid ═══ */}
      <section className="grid grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q9.bestPm25Predictor')}</p>
          <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.best_pm25_predictor}</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">r = {kpi!.best_pm25_r}, R² = {(kpi!.best_pm25_r2 * 100).toFixed(0)}%</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q9.varianceExplained')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-secondary">{(kpi!.best_pm25_r2 * 100).toFixed(0)}%</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q9.varianceDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q9.sigPredictors')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">{kpi!.sig_pm25_count} / {kpi!.n_lu_vars}</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q9.sigPredictorsDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q9.wbgtSig')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold" style={{ color: C.outline }}>{kpi!.sig_wbgt_count} / {kpi!.n_lu_vars}</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q9.wbgtSigDesc')}</p>
        </div>
      </section>

      {/* ═══ Target Toggle ═══ */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-on-surface-variant">{t('q9.outcomeVariable')}</span>
        <div className="flex gap-2 bg-surface-container-highest/30 p-1 rounded-lg">
          {(['pm25', 'wbgt'] as TargetVar[]).map(t => (
            <button key={t}
              onClick={() => setTarget(t)}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${target === t ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              {t === 'pm25' ? 'PM2.5' : 'WBGT'}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Main: Correlation Bars + Scatter ═══ */}
      <section className="grid grid-cols-5 gap-8">
        {/* Correlation ranking — 2 cols */}
        <div className="col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q9.corrRanking')}</h2>
          <p className="text-xs text-on-surface-variant mb-6">{t('q9.corrRankingDesc', { outcome: target === 'pm25' ? 'PM2.5' : 'WBGT' })}</p>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={corrBars} layout="vertical" margin={{ left: 90, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10 }} domain={[-0.8, 0.8]} />
                <YAxis type="category" dataKey="lu_var" tick={{ fontSize: 10 }} width={85} />
                <ReferenceLine x={0} stroke={C.onSurface} strokeWidth={1} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                  formatter={(v) => [Number(v).toFixed(3), 'Pearson r']}
                />
                <Bar dataKey="r" radius={4} onClick={(_d, idx) => { if (idx >= 0) setSelectedLu(corrBars[idx].lu_var) }} cursor="pointer">
                  {corrBars.map(c => (
                    <Cell key={c.lu_var}
                      fill={c.r > 0 ? C.primary : C.tertiary}
                      opacity={c.lu_var === selectedLu ? 1 : c.sig ? 0.7 : 0.3}
                      stroke={c.lu_var === selectedLu ? C.onSurface : 'none'}
                      strokeWidth={c.lu_var === selectedLu ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-4 text-[10px] text-on-surface-variant">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: C.primary, opacity: 0.7 }} /> {t('q9.positiveSig')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: C.tertiary, opacity: 0.7 }} /> {t('q9.negativeSig')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: C.outline, opacity: 0.3 }} /> {t('q9.notSignificant')}</span>
          </div>
        </div>

        {/* Scatter plot — 3 cols */}
        <div className="col-span-3 bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">{selectedLu} vs {target === 'pm25' ? 'PM2.5' : 'WBGT'}</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                r = {regLine?.r}, p = {regLine?.p}{regLine && regLine.p !== undefined && regLine.p < 0.05 ? ' ★' : ''}
              </p>
            </div>
            {/* LU selector */}
            <select value={selectedLu} onChange={e => setSelectedLu(e.target.value)}
              className="text-xs border border-outline-variant/30 rounded-lg px-3 py-1.5 bg-white text-on-surface">
              {luVars.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis dataKey="lu_val" type="number" tick={{ fontSize: 10 }} name={selectedLu}
                  label={{ value: `${selectedLu} (%)`, position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                <YAxis dataKey={yKey} type="number" tick={{ fontSize: 10 }}
                  label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                  formatter={(v, name) => {
                    if (String(name) === selectedLu) return [Number(v).toFixed(1) + '%', selectedLu]
                    return [Number(v).toFixed(1) + yUnit, target === 'pm25' ? 'PM2.5' : 'WBGT']
                  }}
                  labelFormatter={() => ''}
                />
                <Scatter data={scatterData} opacity={0.8}>
                  {scatterData.map((p, i) => (
                    <Cell key={i} fill={SITE_COLORS[p.site_id || ''] || C.primary} r={6} />
                  ))}
                </Scatter>
                {/* Regression line */}
                {regLine && (
                  <Scatter
                    data={[{ lu_val: regLine.x1, [yKey]: regLine.y1 }, { lu_val: regLine.x2, [yKey]: regLine.y2 }]}
                    line={{ stroke: C.primary, strokeWidth: 2, strokeDasharray: '6 4' }}
                    shape={() => null} legendType="none"
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {/* Site labels */}
          <div className="mt-4 flex flex-wrap gap-2">
            {scatterData.map(p => (
              <span key={p.site_id} className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SITE_COLORS[p.site_id || ''] }} />
                {p.site_label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Regression Coefficients ═══ */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
        <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q9.regressionCoefficients')}</h2>
        <p className="text-xs text-on-surface-variant mb-6">{t('q9.regressionDesc', { outcome: target === 'pm25' ? 'PM2.5' : 'WBGT' })}</p>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regBars} layout="vertical" margin={{ left: 110, right: 30, top: 5, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 10 }} domain={[-0.8, 0.8]}
                label={{ value: 'Standardized β', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
              <YAxis type="category" dataKey="lu_var" tick={{ fontSize: 10 }} width={105} />
              <ReferenceLine x={0} stroke={C.onSurface} strokeWidth={1} />
              <Tooltip
                contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                formatter={(v) => [Number(v).toFixed(3), 'β']}
              />
              <Bar dataKey="beta" radius={4}>
                {regBars.map(r => (
                  <Cell key={r.lu_var}
                    fill={r.beta > 0 ? C.primaryContainer : C.tertiaryContainer}
                    opacity={r.p < 0.05 ? 0.9 : 0.35}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 bg-surface-container-highest/30 p-6 rounded-xl border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-xl mt-0.5">science</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">{t('q9.interpretation')}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {target === 'pm25' ? (
                  <>
                    <strong>{kpi!.best_pm25_predictor}</strong> dominates: a 1-SD increase in road area within 50 m is associated with a <strong>+{corrBars[0]?.r.toFixed(2)} SD</strong> increase in PM2.5. Only road variables (25 m and 50 m) reach statistical significance. 
                    Trees show a weak negative effect — suggestive of buffering but not significant with n = 12.
                  </>
                ) : (
                  <>
                    <strong>No land-use variable significantly predicts WBGT</strong> (p &lt; 0.05). The counterintuitive signs — trees positive, impervious negative — likely reflect confounding with <strong>waterfront proximity</strong> and prevailing wind corridors rather than a direct land-cover effect.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Site Profile Table ═══ */}
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-8 pb-4">
          <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">{t('q9.siteProfiles')}</h2>
          <p className="text-sm text-on-surface-variant mt-1">{t('q9.siteProfilesDesc')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-high/30 text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-4 py-4 text-left">{t('q9.site')}</th>
                <th className="px-4 py-4 text-left">{t('q9.tableHeaders.pm25')}</th>
                <th className="px-4 py-4 text-left">{t('q9.tableHeaders.wbgt')}</th>
                <th className="px-4 py-4 text-left">{t('q9.tableHeaders.roads50m')}</th>
                <th className="px-4 py-4 text-left">{t('q9.tableHeaders.trees50m')}</th>
                <th className="px-4 py-4 text-left">{t('q9.tableHeaders.imperv50m')}</th>
                <th className="px-4 py-4 text-left">{t('q9.tableHeaders.green50m')}</th>
                <th className="px-4 py-4 text-left">{t('q9.tableHeaders.roads25m')}</th>
                <th className="px-4 py-4 text-left">{t('q9.tableHeaders.trees25m')}</th>
                <th className="px-4 py-4 text-left">{t('q9.tableHeaders.imperv25m')}</th>
                <th className="px-4 py-4 text-left">{t('q9.tableHeaders.n')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {profiles.map(p => (
                <tr key={p.site_id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SITE_COLORS[p.site_id] }} />
                      <span className="font-bold text-sm">{p.site_label}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-[family-name:var(--font-family-headline)] font-bold text-primary">{p.pm25_mean}</td>
                  <td className="px-4 py-3">{p.wbgt_mean}°F</td>
                  <td className="px-4 py-3">{p.roads_50m}%</td>
                  <td className="px-4 py-3">{p.trees_50m}%</td>
                  <td className="px-4 py-3">{p.impervious_50m}%</td>
                  <td className="px-4 py-3">{p.greenspace_50m}%</td>
                  <td className="px-4 py-3">{p.roads_25m}%</td>
                  <td className="px-4 py-3">{p.trees_25m}%</td>
                  <td className="px-4 py-3">{p.impervious_25m}%</td>
                  <td className="px-4 py-3 text-stone-500">{Number(p.n).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ Research Synthesis Footer ═══ */}
      <footer className="bg-primary text-on-primary p-12 rounded-2xl relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <span className="material-symbols-outlined text-[200px]">forest</span>
        </div>
        <div className="max-w-4xl relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="material-symbols-outlined text-4xl">forest</span>
            <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">{t('q9.synthesis')}</h3>
          </div>
          <p className="font-[family-name:var(--font-family-headline)] italic text-lg leading-relaxed text-on-primary-container mb-8">
            {t('q9.synthesisDesc', { pct: (kpi!.best_pm25_r2 * 100).toFixed(0) })}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">{t('q9.trafficExposure')}</h4>
              <p className="text-sm leading-relaxed">
                Sites with more road area within 50 m have consistently higher PM2.5. <strong>{kpi!.best_pm25_predictor}</strong> alone achieves r = {kpi!.best_pm25_r} (p = {kpi!.best_pm25_p}).
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">{t('q9.heatComplexity')}</h4>
              <p className="text-sm leading-relaxed">
                {t('q9.heatComplexityDesc')}
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">{t('q9.policyAction')}</h4>
              <p className="text-sm leading-relaxed">
                {t('q9.policyActionDesc')}
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
          reportPath="/reports/Q9.md"
          title="Q9 — Land-Use & Environmental Associations"
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
