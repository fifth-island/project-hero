import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine,
} from 'recharts'
import { useQ9Data } from '../hooks/useQ9Data'

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

const CLUSTER_COLORS = ['#6f070f', '#003e2f', '#87512d', '#2196f3']

type PcaColor = 'pm25' | 'wbgt' | 'cluster'

export default function ResearchQ9Clust() {
  const { kpi, pcaSites, pcaLoadings, pcaInfo, clusters, heatmap, loading } = useQ9Data()
  const { t } = useTranslation()
  const [pcaColor, setPcaColor] = useState<PcaColor>('cluster')

  // Heatmap: land-use × outcomes only
  const luOutcomeHm = useMemo(() =>
    heatmap.filter(h => (h.x === 'PM2.5' || h.x === 'WBGT') && h.y !== 'PM2.5' && h.y !== 'WBGT')
  , [heatmap])

  // Unique Y labels for heatmap ordering
  const hmYLabels = useMemo(() => {
    const seen = new Set<string>()
    return luOutcomeHm.filter(h => { if (seen.has(h.y)) return false; seen.add(h.y); return true }).map(h => h.y)
  }, [luOutcomeHm])

  // PCA color range
  const pm25Range = useMemo(() => {
    const vals = pcaSites.map(s => s.pm25_mean)
    return [Math.min(...vals), Math.max(...vals)]
  }, [pcaSites])
  const wbgtRange = useMemo(() => {
    const vals = pcaSites.map(s => s.wbgt_mean)
    return [Math.min(...vals), Math.max(...vals)]
  }, [pcaSites])

  function gradientColor(val: number, min: number, max: number, lowColor: string, highColor: string) {
    const t = Math.max(0, Math.min(1, (val - min) / (max - min || 1)))
    // Simple interpolation in hex — approximate
    const lo = parseInt(lowColor.slice(1), 16)
    const hi = parseInt(highColor.slice(1), 16)
    const r = Math.round(((lo >> 16) & 0xff) * (1 - t) + ((hi >> 16) & 0xff) * t)
    const g = Math.round(((lo >> 8) & 0xff) * (1 - t) + ((hi >> 8) & 0xff) * t)
    const b = Math.round((lo & 0xff) * (1 - t) + (hi & 0xff) * t)
    return `rgb(${r},${g},${b})`
  }

  function dotColor(site: typeof pcaSites[0]) {
    if (pcaColor === 'cluster') {
      const cl = clusters?.sites.find(s => s.site_id === site.site_id)?.cluster ?? 0
      return CLUSTER_COLORS[cl]
    }
    if (pcaColor === 'pm25') return gradientColor(site.pm25_mean, pm25Range[0], pm25Range[1], '#fee8c8', '#6f070f')
    return gradientColor(site.wbgt_mean, wbgtRange[0], wbgtRange[1], '#e0f7fa', '#003e2f')
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary mb-2">{t('q9clust.title')}</h1>
            <p className="text-secondary max-w-2xl font-[family-name:var(--font-family-headline)] italic text-lg">
              {t('q9clust.description')}
            </p>
          </div>
          <div className="bg-surface-container-highest/50 backdrop-blur-sm p-4 rounded-lg border border-primary/10 shrink-0 text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">{t('q9clust.pcaVariance')}</span>
            <span className="text-xl font-black text-primary">{pcaInfo!.cumulative}%</span>
            <span className="text-[10px] text-stone-400 block">{t('q9clust.pcaVarianceDesc')}</span>
          </div>
        </div>
      </header>

      {/* ═══ KPI Grid ═══ */}
      <section className="grid grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q9clust.pc1Explained')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{pcaInfo!.explained[0]}%</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q9clust.pc1Desc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q9clust.pc2Explained')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-secondary">{pcaInfo!.explained[1]}%</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q9clust.pc2Desc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q9clust.optimalClusters')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">k = {clusters!.best_k}</h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q9clust.optimalClustersDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('q9clust.pm25Diff')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold" style={{ color: C.outline }}>
            {Math.abs(clusters!.summary[0]?.pm25_mean - clusters!.summary[1]?.pm25_mean).toFixed(1)} µg/m³
          </h3>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('q9clust.pm25DiffDesc')}</p>
        </div>
      </section>

      {/* ═══ Correlation Heatmap ═══ */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
        <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q9clust.corrHeatmap')}</h2>
        <p className="text-xs text-on-surface-variant mb-6">{t('q9clust.corrHeatmapDesc')}</p>
        <div className="overflow-x-auto">
          <table className="mx-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 text-[10px] font-bold text-on-surface-variant uppercase"></th>
                <th className="px-6 py-2 text-[10px] font-bold text-on-surface-variant uppercase">PM2.5</th>
                <th className="px-6 py-2 text-[10px] font-bold text-on-surface-variant uppercase">WBGT</th>
              </tr>
            </thead>
            <tbody>
              {hmYLabels.map(label => {
                const pm = luOutcomeHm.find(h => h.y === label && h.x === 'PM2.5')
                const wb = luOutcomeHm.find(h => h.y === label && h.x === 'WBGT')
                return (
                  <tr key={label}>
                    <td className="px-4 py-2 text-xs font-bold text-on-surface text-right">{label}</td>
                    {[pm, wb].map((cell, i) => {
                      if (!cell) return <td key={i} className="px-6 py-2" />
                      const intensity = Math.min(Math.abs(cell.r) / 0.7, 1)
                      const bg = cell.r > 0
                        ? `rgba(111,7,15,${intensity * 0.4})`
                        : `rgba(0,62,47,${intensity * 0.4})`
                      return (
                        <td key={i} className="px-6 py-2 text-center text-xs font-bold rounded"
                          style={{ backgroundColor: bg, color: intensity > 0.5 ? 'white' : C.onSurface }}>
                          {cell.r.toFixed(2)}{cell.sig ? ' ★' : ''}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-6 bg-surface-container-highest/30 p-4 rounded-lg">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            <span className="material-symbols-outlined text-xs align-text-bottom mr-1" style={{ color: C.primary }}>info</span>
            Only road variables show significant (★) association with PM2.5. WBGT correlations are all non-significant — the <strong>positive tree–WBGT</strong> and <strong>negative impervious–WBGT</strong> associations likely reflect confounding with waterfront proximity rather than direct land-cover effects.
          </p>
        </div>
      </section>

      {/* ═══ PCA Biplot ═══ */}
      <section className="grid grid-cols-3 gap-8">
        <div className="col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">{t('q9clust.pcaSiteMap')}</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                PC1 ({pcaInfo!.explained[0]}%) vs PC2 ({pcaInfo!.explained[1]}%) — {pcaInfo!.cumulative}% total variance
              </p>
            </div>
            <div className="flex gap-2 bg-surface-container-highest/30 p-1 rounded-lg">
              {([['cluster', t('q9clust.colorCluster')], ['pm25', t('q9clust.colorPm25')], ['wbgt', t('q9clust.colorWbgt')]] as [PcaColor, string][]).map(([key, label]) => (
                <button key={key}
                  onClick={() => setPcaColor(key)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${pcaColor === key ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis dataKey="pc1" type="number" tick={{ fontSize: 10 }} name="PC1"
                  label={{ value: `PC1 (${pcaInfo!.explained[0]}%)`, position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="pc2" type="number" tick={{ fontSize: 10 }} name="PC2"
                  label={{ value: `PC2 (${pcaInfo!.explained[1]}%)`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <ReferenceLine x={0} stroke={C.outlineVariant} strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke={C.outlineVariant} strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border text-xs">
                        <p className="font-bold">{d.site_label}</p>
                        <p>PC1: {d.pc1}, PC2: {d.pc2}</p>
                        <p>PM2.5: {d.pm25_mean} µg/m³</p>
                        <p>WBGT: {d.wbgt_mean}°F</p>
                      </div>
                    )
                  }}
                />
                <Scatter data={pcaSites}>
                  {pcaSites.map(s => (
                    <Cell key={s.site_id} fill={dotColor(s)} r={8} />
                  ))}
                </Scatter>
                {/* Loading vectors (scaled) */}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {/* Site labels below chart */}
          <div className="mt-4 flex flex-wrap gap-3">
            {pcaSites.map(s => (
              <span key={s.site_id} className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor(s) }} />
                {s.site_label}
              </span>
            ))}
          </div>
        </div>

        {/* PCA Loadings */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <h2 className="text-lg font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q9clust.pcaLoadings')}</h2>
          <p className="text-xs text-on-surface-variant mb-6">{t('q9clust.pcaLoadingsDesc')}</p>
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">PC1 ({pcaInfo!.explained[0]}%)</h4>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...pcaLoadings].sort((a, b) => b.pc1 - a.pc1)} layout="vertical" margin={{ left: 80, right: 10, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 9 }} domain={[-0.6, 0.6]} />
                    <YAxis type="category" dataKey="lu_var" tick={{ fontSize: 9 }} width={75} />
                    <ReferenceLine x={0} stroke={C.onSurface} />
                    <Bar dataKey="pc1" radius={3}>
                      {pcaLoadings.map(l => (
                        <Cell key={l.lu_var} fill={l.pc1 > 0 ? C.primary : C.tertiary} opacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">PC2 ({pcaInfo!.explained[1]}%)</h4>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...pcaLoadings].sort((a, b) => b.pc2 - a.pc2)} layout="vertical" margin={{ left: 80, right: 10, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 9 }} domain={[-0.6, 0.6]} />
                    <YAxis type="category" dataKey="lu_var" tick={{ fontSize: 9 }} width={75} />
                    <ReferenceLine x={0} stroke={C.onSurface} />
                    <Bar dataKey="pc2" radius={3}>
                      {pcaLoadings.map(l => (
                        <Cell key={l.lu_var} fill={l.pc2 > 0 ? C.secondary : C.tertiaryContainer} opacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Cluster Summary ═══ */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
        <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-2">{t('q9clust.clusterProfiles')}</h2>
        <p className="text-xs text-on-surface-variant mb-6">k = {clusters!.best_k} clusters (silhouette = {clusters!.silhouette_scores[0]?.silhouette})</p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {clusters!.summary.map((cl, i) => (
            <div key={cl.cluster} className="p-6 rounded-xl border-2" style={{ borderColor: CLUSTER_COLORS[i] }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[i] }} />
                <h3 className="text-lg font-[family-name:var(--font-family-headline)] font-bold" style={{ color: CLUSTER_COLORS[i] }}>
                  Cluster {cl.cluster} — {cl.n_sites} sites
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {cl.sites.map(s => (
                  <span key={s} className="px-2 py-1 bg-surface-container-highest/30 rounded text-[10px] font-bold">{s}</span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">PM2.5</p>
                  <p className="text-xl font-bold text-primary">{cl.pm25_mean}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">WBGT</p>
                  <p className="text-xl font-bold text-secondary">{cl.wbgt_mean}°F</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">Imperv 50m</p>
                  <p className="text-xl font-bold text-tertiary">{cl.impervious_50m}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Silhouette scores */}
        <div className="flex items-center gap-6">
          <span className="text-xs font-bold text-on-surface-variant">Silhouette scores:</span>
          {clusters!.silhouette_scores.map(s => (
            <span key={s.k} className={`px-3 py-1 rounded text-xs font-bold ${s.k === clusters!.best_k ? 'bg-primary text-on-primary' : 'bg-surface-container-highest/30 text-on-surface-variant'}`}>
              k={s.k}: {s.silhouette}
            </span>
          ))}
        </div>

        <div className="mt-6 bg-surface-container-highest/30 p-6 rounded-xl border-l-4 border-secondary">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-xl mt-0.5">hub</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">Clustering Interpretation</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Two land-use clusters emerge — one with higher vegetation/tree cover (Cluster 0: {clusters!.summary[0]?.sites.length} sites) and one dominated by impervious surface (Cluster 1: {clusters!.summary[1]?.sites.length} sites).
                However, <strong>neither PM2.5 nor WBGT differ significantly between clusters</strong>. This confirms that buffer-level land-use classification alone cannot explain environmental outcome differences — finer-scale factors (road proximity, wind corridors, building geometry) are the true drivers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Limitations ═══ */}
      <section className="bg-surface-container-highest/20 p-8 rounded-2xl border border-outline-variant/10">
        <h2 className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface mb-4">Limitations</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: 'groups', title: 'Small Sample', text: 'n = 12 sites limits statistical power. Only very strong effects (r > 0.6) reach significance.' },
            { icon: 'zoom_in', title: 'Small Buffers', text: '25–50 m radii may miss broader urban context influencing PM2.5 and WBGT.' },
            { icon: 'location_city', title: 'Urban Homogeneity', text: 'All sites are in dense Chinatown — impervious surface dominates everywhere, limiting variance.' },
            { icon: 'shuffle', title: 'Confounding', text: 'Waterfront proximity, building height, and wind corridors confound land-use associations, especially for WBGT.' },
          ].map(l => (
            <div key={l.icon} className="flex items-start gap-3 p-4 bg-white rounded-lg">
              <span className="material-symbols-outlined text-on-surface-variant text-lg mt-0.5">{l.icon}</span>
              <div>
                <h4 className="text-xs font-bold text-on-surface mb-1">{l.title}</h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{l.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Research Synthesis Footer ═══ */}
      <footer className="bg-primary text-on-primary p-12 rounded-2xl relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <span className="material-symbols-outlined text-[200px]">landscape</span>
        </div>
        <div className="max-w-4xl relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="material-symbols-outlined text-4xl">landscape</span>
            <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">Clustering Synthesis</h3>
          </div>
          <p className="font-[family-name:var(--font-family-headline)] italic text-lg leading-relaxed text-on-primary-container mb-8">
            Land-use clustering reveals structural site differences — but environmental outcomes require finer-grained analysis.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">PCA Insight</h4>
              <p className="text-sm leading-relaxed">
                Two PCA components capture <strong>{pcaInfo!.cumulative}%</strong> of land-use variance. PC1 separates sites along an impervious-vs-vegetation gradient — the primary structural axis of Chinatown's open spaces.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">Cluster Gap</h4>
              <p className="text-sm leading-relaxed">
                Despite distinct land-use profiles, the two clusters show <strong>no significant PM2.5 or WBGT differences</strong> — confirming that within-cluster heterogeneity (driven by roads, wind) matters more than between-cluster differences.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-on-primary-container">What Matters</h4>
              <p className="text-sm leading-relaxed">
                <strong>Road proximity</strong> (not captured by broad land-use categories) is the actionable predictor. Future monitoring should include traffic volume and street-canyon geometry as covariates.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
