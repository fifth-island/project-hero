import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line, Cell,
} from 'recharts'
import { useClusteringData, type SitePoint, type ClusterCenter } from '../hooks/useClusteringData'
import ChinatownMap from '../components/ChinatownMap'

/* ── Convex hull (Graham scan) ── */
function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 3) return points
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: { x: number; y: number }[] = []
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p) }
  const upper: { x: number; y: number }[] = []
  for (const p of pts.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p) }
  upper.pop(); lower.pop()
  return lower.concat(upper)
}

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

/* ── Custom tooltip for quadrant scatter ── */
function QuadrantTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d: SitePoint = payload[0].payload
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-outline-variant/30 text-xs">
      <p className="font-[family-name:var(--font-family-headline)] font-bold text-primary text-sm">{d.site_name}</p>
      <p className="text-secondary mt-1">{d.cluster_emoji} {d.cluster_name}</p>
      <div className="mt-2 space-y-0.5 text-on-surface-variant">
        <p>PM2.5: <strong>{d.pm25} µg/m³</strong></p>
        <p>Temp: <strong>{d.temp}°F</strong></p>
        <p>WBGT: <strong>{d.wbgt}°F</strong></p>
        <p>Humidity: <strong>{d.humidity}%</strong></p>
      </div>
    </div>
  )
}

/* ── Custom tooltip for PCA scatter ── */
function PcaTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-outline-variant/30 text-xs">
      <p className="font-[family-name:var(--font-family-headline)] font-bold text-primary text-sm">{d.site_name ?? `Centroid ${d.cluster}`}</p>
      <p className="text-secondary">{d.cluster_emoji} {d.cluster_name}</p>
      <p className="mt-1 text-on-surface-variant">PC1: {d.pca1} · PC2: {d.pca2}</p>
    </div>
  )
}

/* ── Sortable table header ── */
type SortKey = 'site_name' | 'cluster' | 'pm25' | 'temp' | 'wbgt' | 'humidity'

export default function ClusteringAnalysis() {
  const { t } = useTranslation()
  const { kpi, sites, centers, elbow, silhouetteData, pcaMeta, loading } = useClusteringData()
  const [clusterFilter, setClusterFilter] = useState<number | 'all'>('all')
  const [showCentroids, setShowCentroids] = useState(true)
  const [showHulls, setShowHulls] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('cluster')
  const [sortAsc, setSortAsc] = useState(true)

  /* Compute convex hull outlines for PCA chart (must be before early return) */
  const hullData = useMemo(() => {
    return centers.map(c => {
      const clusterSites = sites.filter(s => s.cluster === c.cluster)
      if (clusterSites.length < 3) return { cluster: c.cluster, color: c.cluster_color, points: [] }
      const pts = clusterSites.map(s => ({ x: s.pca1, y: s.pca2 }))
      const hull = convexHull(pts)
      const closed = [...hull, hull[0]]
      return {
        cluster: c.cluster,
        color: c.cluster_color,
        points: closed.map(p => ({ pca1: p.x, pca2: p.y })),
      }
    }).filter(h => h.points.length > 0)
  }, [centers, sites])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
    </div>
  )

  const filteredSites = clusterFilter === 'all' ? sites : sites.filter(s => s.cluster === clusterFilter)

  /* Sort logic for table */
  const handleSort = (key: SortKey) => {
    if (sortKey === key) { setSortAsc(!sortAsc) } else { setSortKey(key); setSortAsc(true) }
  }
  const sortedSites = [...sites].sort((a, b) => {
    const valA = a[sortKey]; const valB = b[sortKey]
    if (typeof valA === 'string') return sortAsc ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA)
    return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
  })

  /* Radar data — reshape cluster centers for Recharts RadarChart */
  const radarData = ['PM2.5', 'Temperature', 'WBGT', 'Humidity'].map((label, i) => {
    const keys = ['pm25_norm', 'temp_norm', 'wbgt_norm', 'humidity_norm'] as const
    const row: Record<string, string | number> = { feature: label }
    centers.forEach(c => { row[`cluster_${c.cluster}`] = c[keys[i]] })
    return row
  })

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">

      {/* ═══ Header ═══ */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-primary tracking-tight italic">
            {t('clustering.title')}
          </h2>
          <p className="text-secondary mt-2 max-w-2xl">
            {t('clustering.description')}
          </p>
        </div>
        <div className="px-4 py-2 bg-surface-container rounded-lg border border-outline-variant/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
          <span className="text-xs font-bold uppercase tracking-widest">{t('clustering.period')}</span>
        </div>
      </header>

      {/* ═══ KPI Grid ═══ */}
      <section className="grid grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('clustering.monitoringSites')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.n_sites}</h3>
            <span className="material-symbols-outlined text-secondary text-xl">location_on</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('clustering.monitoringSitesDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('clustering.optimalClusters')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-primary">{kpi!.n_clusters}</h3>
            <span className="material-symbols-outlined text-secondary text-xl">hub</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('clustering.optimalClustersDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('clustering.silhouetteScore')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-tertiary">{kpi!.silhouette}</h3>
            <span className="material-symbols-outlined text-tertiary text-xl">verified</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('clustering.silhouetteDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">{t('clustering.pcaVariance')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-extrabold text-on-surface">{kpi!.pca_variance}%</h3>
            <span className="material-symbols-outlined text-secondary text-xl">insights</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 italic">{t('clustering.pcaVarianceDesc')}</p>
        </div>
      </section>

      {/* ═══ Cluster Quadrant Scatter ═══ */}
      <section>
        <div className="flex items-baseline gap-4 mb-6">
          <h3 className="font-[family-name:var(--font-family-headline)] text-2xl text-primary font-bold">{t('clustering.quadrantMap')}</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#6f070f 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h4 className="font-[family-name:var(--font-family-headline)] italic text-lg text-primary">PM2.5 vs Temperature — Cluster-Informed Quadrants</h4>
              <p className="text-xs text-secondary/60 uppercase mt-1">Boundaries at PM2.5 = {kpi!.pm25_boundary} µg/m³ · Temp = {kpi!.temp_boundary}°F</p>
            </div>
            <select
              value={String(clusterFilter)}
              onChange={(e) => setClusterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs font-bold text-on-surface appearance-none cursor-pointer"
            >
              <option value="all">{t('clustering.allClusters')}</option>
              {centers.map(c => (
                <option key={c.cluster} value={c.cluster}>{c.cluster_emoji} {c.cluster_name}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 20, right: 40, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis
                dataKey="temp" type="number" name="Temperature"
                domain={[73, 76]} tick={{ fontSize: 10 }} stroke={C.outline}
                label={{ value: 'Mean Temperature (°F)', position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }}
              />
              <YAxis
                dataKey="pm25" type="number" name="PM2.5"
                domain={[7, 11.5]} tick={{ fontSize: 10 }} stroke={C.outline}
                label={{ value: 'Mean PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: C.onSurfaceVariant }}
              />
              <Tooltip content={<QuadrantTooltip />} />
              <ReferenceLine y={kpi!.pm25_boundary} stroke="#555" strokeDasharray="6 4" strokeWidth={1.5}
                label={{ value: `PM2.5 = ${kpi!.pm25_boundary}`, position: 'insideTopLeft', fontSize: 9, fill: '#555' }} />
              <ReferenceLine x={kpi!.temp_boundary} stroke="#555" strokeDasharray="6 4" strokeWidth={1.5}
                label={{ value: `${kpi!.temp_boundary}°F`, position: 'insideTopRight', fontSize: 9, fill: '#555' }} />
              {centers.map(c => (
                <Scatter
                  key={c.cluster}
                  data={filteredSites.filter(s => s.cluster === c.cluster)}
                  fill={c.cluster_color}
                  name={`${c.cluster_emoji} ${c.cluster_name}`}
                >
                  {filteredSites.filter(s => s.cluster === c.cluster).map((s, i) => (
                    <Cell key={i} fill={c.cluster_color} fillOpacity={0.85} r={8} />
                  ))}
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          {/* Quadrant labels as chips */}
          <div className="absolute top-[120px] left-[140px] text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#C6282818', color: '#C62828' }}>🔴 High Pollution + Humid</div>
          <div className="absolute top-[120px] right-[140px] text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-400">(no sites)</div>
          <div className="absolute bottom-[100px] left-[140px] text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#2E7D3218', color: '#2E7D32' }}>🟢 Cleaner & Drier</div>
          <div className="absolute bottom-[100px] right-[140px] text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#DAA52018', color: '#DAA520' }}>🟡 Urban Heat Island</div>
        </div>
      </section>

      {/* ═══ Cluster Profiles — Radar + Summary Cards ═══ */}
      <section>
        <div className="flex items-baseline gap-4 mb-6">
          <h3 className="font-[family-name:var(--font-family-headline)] text-2xl text-primary font-bold">{t('clustering.clusterProfiles')}</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Radar chart */}
          <div className="bg-surface-container-lowest rounded-2xl p-6">
            <h4 className="font-[family-name:var(--font-family-headline)] italic text-lg text-primary mb-4">{t('clustering.envRadar')}</h4>
            <p className="text-xs text-secondary/60 mb-4">{t('clustering.radarDesc')}</p>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke={C.outlineVariant} strokeOpacity={0.3} />
                <PolarAngleAxis dataKey="feature" tick={{ fontSize: 11, fill: C.onSurface }} />
                <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fontSize: 9 }} />
                {centers.map(c => (
                  <Radar
                    key={c.cluster}
                    dataKey={`cluster_${c.cluster}`}
                    stroke={c.cluster_color}
                    fill={c.cluster_color}
                    fillOpacity={0.15}
                    strokeWidth={2.5}
                    name={`${c.cluster_emoji} ${c.cluster_name}`}
                  />
                ))}
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Cluster summary cards */}
          <div className="space-y-4">
            {centers.map(c => (
              <div key={c.cluster} className="bg-surface-container-lowest rounded-xl p-5 border-l-4" style={{ borderColor: c.cluster_color }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-[family-name:var(--font-family-headline)] font-bold text-lg" style={{ color: c.cluster_color }}>
                      {c.cluster_emoji} {c.cluster_name}
                    </h5>
                    <p className="text-[10px] text-secondary/60 uppercase tracking-widest">{c.n_sites} site{c.n_sites > 1 ? 's' : ''}</p>
                  </div>
                  <span className="material-symbols-outlined text-sm" style={{ color: c.cluster_color }}>
                    {c.cluster_name.includes('Heat') ? 'local_fire_department' : c.cluster_name.includes('Pollution') ? 'air' : 'park'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <p className="text-[9px] text-secondary/50 uppercase font-bold">PM2.5</p>
                    <p className="text-sm font-bold text-on-surface">{c.pm25} <span className="text-[9px] font-normal text-secondary/50">µg/m³</span></p>
                  </div>
                  <div>
                    <p className="text-[9px] text-secondary/50 uppercase font-bold">Temp</p>
                    <p className="text-sm font-bold text-on-surface">{c.temp} <span className="text-[9px] font-normal text-secondary/50">°F</span></p>
                  </div>
                  <div>
                    <p className="text-[9px] text-secondary/50 uppercase font-bold">WBGT</p>
                    <p className="text-sm font-bold text-on-surface">{c.wbgt} <span className="text-[9px] font-normal text-secondary/50">°F</span></p>
                  </div>
                  <div>
                    <p className="text-[9px] text-secondary/50 uppercase font-bold">Humidity</p>
                    <p className="text-sm font-bold text-on-surface">{c.humidity} <span className="text-[9px] font-normal text-secondary/50">%</span></p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.sites.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: c.cluster_color + '40', color: c.cluster_color }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Method Validation — Elbow + Silhouette ═══ */}
      <section>
        <div className="flex items-baseline gap-4 mb-6">
          <h3 className="font-[family-name:var(--font-family-headline)] text-2xl text-primary font-bold">Method Validation</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Elbow + Silhouette combo */}
          <div className="bg-surface-container-lowest rounded-2xl p-6">
            <h4 className="font-[family-name:var(--font-family-headline)] italic text-lg text-primary mb-2">Choosing k: Elbow & Silhouette</h4>
            <p className="text-xs text-secondary/60 mb-4">k=3 balances compactness (inertia) with cluster separation (silhouette).</p>
            <div className="space-y-6">
              {/* Inertia */}
              <div>
                <p className="text-[10px] font-bold uppercase text-secondary/60 tracking-widest mb-2">Inertia (lower = tighter clusters)</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={elbow} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
                    <XAxis dataKey="k" tick={{ fontSize: 10 }} stroke={C.outline} />
                    <YAxis tick={{ fontSize: 10 }} stroke={C.outline} />
                    <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }} />
                    <ReferenceLine x={3} stroke={C.secondary} strokeDasharray="4 4" strokeWidth={1.5}
                      label={{ value: 'k=3', position: 'top', fontSize: 9, fill: C.secondary }} />
                    <Line type="monotone" dataKey="inertia" stroke={C.primary} strokeWidth={2.5} dot={{ r: 5, fill: C.primary }} name="Inertia" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Silhouette */}
              <div>
                <p className="text-[10px] font-bold uppercase text-secondary/60 tracking-widest mb-2">Silhouette Score (higher = better separation)</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={elbow} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
                    <XAxis dataKey="k" tick={{ fontSize: 10 }} stroke={C.outline} />
                    <YAxis tick={{ fontSize: 10 }} stroke={C.outline} domain={[0, 'dataMax + 0.1']} />
                    <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }} />
                    <ReferenceLine x={3} stroke={C.secondary} strokeDasharray="4 4" strokeWidth={1.5}
                      label={{ value: 'k=3', position: 'top', fontSize: 9, fill: C.secondary }} />
                    <Line type="monotone" dataKey="silhouette" stroke={C.tertiary} strokeWidth={2.5} dot={{ r: 5, fill: C.tertiary }} name="Silhouette" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Per-site silhouette bars */}
          <div className="bg-surface-container-lowest rounded-2xl p-6">
            <h4 className="font-[family-name:var(--font-family-headline)] italic text-lg text-primary mb-2">Per-Site Silhouette Scores</h4>
            <p className="text-xs text-secondary/60 mb-4">All scores &gt; 0 means no site is assigned to the wrong cluster. Avg = {kpi!.silhouette}.</p>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={silhouetteData} layout="vertical" margin={{ top: 5, right: 30, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke={C.outline} domain={[0, 'dataMax + 0.1']} />
                <YAxis
                  type="category" dataKey="site_name" tick={{ fontSize: 9 }} stroke={C.outline} width={100}
                />
                <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }} />
                <ReferenceLine x={kpi!.silhouette} stroke="#888" strokeDasharray="4 4" strokeWidth={1}
                  label={{ value: `Avg ${kpi!.silhouette}`, position: 'top', fontSize: 9, fill: '#888' }} />
                <Bar dataKey="silhouette" radius={[0, 4, 4, 0]} name="Silhouette">
                  {silhouetteData.map((d, i) => (
                    <Cell key={i} fill={d.cluster_color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ═══ PCA Projection ═══ */}
      <section>
        <div className="flex items-baseline gap-4 mb-6">
          <h3 className="font-[family-name:var(--font-family-headline)] text-2xl text-primary font-bold">PCA Projection</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-[family-name:var(--font-family-headline)] italic text-lg text-primary">
                Clusters in 2D Space (PC1: {pcaMeta!.pc1_variance}% · PC2: {pcaMeta!.pc2_variance}%)
              </h4>
              <p className="text-xs text-secondary/60">PCA captures {pcaMeta!.total_variance}% of total variance in 2 dimensions.</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 text-xs font-bold text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showHulls}
                  onChange={(e) => setShowHulls(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                Show cluster shapes
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCentroids}
                  onChange={(e) => setShowCentroids(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                Show centroids
              </label>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 20, right: 40, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} strokeOpacity={0.3} />
              <XAxis
                dataKey="pca1" type="number" name="PC1"
                tick={{ fontSize: 10 }} stroke={C.outline}
                label={{ value: `PC1 (${pcaMeta!.pc1_variance}% variance)`, position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }}
              />
              <YAxis
                dataKey="pca2" type="number" name="PC2"
                tick={{ fontSize: 10 }} stroke={C.outline}
                label={{ value: `PC2 (${pcaMeta!.pc2_variance}% variance)`, angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: C.onSurfaceVariant }}
              />
              <Tooltip content={<PcaTooltip />} />
              {/* Convex hull outlines as connected Scatter lines */}
              {showHulls && hullData.map(h => (
                <Scatter
                  key={`hull-${h.cluster}`}
                  data={h.points}
                  fill="none"
                  line={{ stroke: h.color, strokeWidth: 1.5, strokeOpacity: 0.6 }}
                  lineType="joint"
                  legendType="none"
                  isAnimationActive={false}
                >
                  {h.points.map((_, i) => (
                    <Cell key={i} fill="transparent" r={0} />
                  ))}
                </Scatter>
              ))}
              {/* Sites by cluster */}
              {centers.map(c => (
                <Scatter
                  key={`sites-${c.cluster}`}
                  data={sites.filter(s => s.cluster === c.cluster)}
                  fill={c.cluster_color}
                  name={`${c.cluster_emoji} ${c.cluster_name}`}
                >
                  {sites.filter(s => s.cluster === c.cluster).map((s, i) => (
                    <Cell key={i} fill={c.cluster_color} fillOpacity={0.85} r={8} />
                  ))}
                </Scatter>
              ))}
              {/* Centroids */}
              {showCentroids && (
                <Scatter
                  data={centers.map(c => ({ ...c, site_name: null }))}
                  fill="none"
                  shape="cross"
                  name="Centroids"
                  legendType="none"
                >
                  {centers.map((c, i) => (
                    <Cell key={i} fill={c.cluster_color} strokeWidth={3} r={10} />
                  ))}
                </Scatter>
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ═══ Site Assignment Table ═══ */}
      <section>
        <div className="flex items-baseline gap-4 mb-6">
          <h3 className="font-[family-name:var(--font-family-headline)] text-2xl text-primary font-bold">Site Assignments</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>

        {/* Chinatown Map */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 mb-6">
          <h4 className="font-[family-name:var(--font-family-headline)] italic text-lg text-primary mb-2">Chinatown Monitoring Network</h4>
          <p className="text-xs text-secondary/60 mb-4">Click on a site marker to view its photo and environmental profile. Markers are colored by cluster assignment.</p>
          <ChinatownMap sites={sites} />
        </div>

        <div className="bg-white shadow-sm overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  {[
                    { key: 'site_name' as SortKey, label: 'Site' },
                    { key: 'cluster' as SortKey, label: 'Cluster' },
                    { key: 'pm25' as SortKey, label: 'PM2.5 (µg/m³)' },
                    { key: 'temp' as SortKey, label: 'Temp (°F)' },
                    { key: 'wbgt' as SortKey, label: 'WBGT (°F)' },
                    { key: 'humidity' as SortKey, label: 'Humidity (%)' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-500 cursor-pointer select-none hover:text-primary transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key && (
                          <span className="material-symbols-outlined text-xs text-primary">
                            {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {sortedSites.map((site, i) => (
                  <tr key={site.site_id} className={`hover:bg-surface-container-low transition-colors ${i % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                    <td className="px-6 py-4 font-[family-name:var(--font-family-headline)] font-bold text-stone-800">{site.site_name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: site.cluster_color + '18', color: site.cluster_color }}>
                        {site.cluster_emoji} {site.cluster_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{site.pm25}</td>
                    <td className="px-6 py-4 text-sm">{site.temp}</td>
                    <td className="px-6 py-4 text-sm">{site.wbgt}</td>
                    <td className="px-6 py-4 text-sm">{site.humidity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ Key Research Findings: Synthesis ═══ */}
      <section className="bg-surface-dim rounded-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
        <div className="absolute bottom-[-20px] right-[-20px] opacity-5">
          <span className="material-symbols-outlined text-[160px]">hub</span>
        </div>
        <h3 className="font-[family-name:var(--font-family-headline)] text-3xl text-primary mb-8 border-b border-primary/20 pb-4 font-bold">
          Key Findings: Clustering Synthesis
        </h3>
        <div className="grid md:grid-cols-2 gap-10">
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#C6282820' }}>
                <span className="material-symbols-outlined text-lg" style={{ color: '#C62828' }}>air</span>
              </div>
              <div>
                <p className="font-bold text-primary font-[family-name:var(--font-family-headline)] italic text-lg">Dominant Pollution Cluster</p>
                <p className="text-secondary text-sm leading-relaxed">
                  8 of 12 sites (67%) share a common "High Pollution + Humid" profile with mean PM2.5 ~{centers.find(c => c.cluster_name.includes('Pollution'))?.pm25} µg/m³.
                  Road proximity along the I-93 corridor is the likely driver — prioritize these sites for air quality interventions.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#DAA52020' }}>
                <span className="material-symbols-outlined text-lg" style={{ color: '#DAA520' }}>local_fire_department</span>
              </div>
              <div>
                <p className="font-bold text-primary font-[family-name:var(--font-family-headline)] italic text-lg">Castle Square Heat Island</p>
                <p className="text-secondary text-sm leading-relaxed">
                  Castle Square stands alone as a micro-heat island — the warmest site at {centers.find(c => c.cluster_name.includes('Heat'))?.temp}°F
                  with the highest WBGT ({centers.find(c => c.cluster_name.includes('Heat'))?.wbgt}°F). Targeted cooling strategies
                  (shade structures, reflective surfaces) are recommended.
                </p>
              </div>
            </li>
          </ul>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#2E7D3220' }}>
                <span className="material-symbols-outlined text-lg" style={{ color: '#2E7D32' }}>park</span>
              </div>
              <div>
                <p className="font-bold text-primary font-[family-name:var(--font-family-headline)] italic text-lg">Cleaner & Drier Refuge Sites</p>
                <p className="text-secondary text-sm leading-relaxed">
                  Mary Soo Hoo, Oxford Plaza, and Reggie Wong form a "cleaner" cluster with PM2.5 ~{centers.find(c => c.cluster_name.includes('Cleaner'))?.pm25} µg/m³
                  and the lowest humidity ({centers.find(c => c.cluster_name.includes('Cleaner'))?.humidity}%). Understanding why —
                  greater road setback, building shielding — can inform future park design.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#6f070f20' }}>
                <span className="material-symbols-outlined text-lg" style={{ color: '#6f070f' }}>balance</span>
              </div>
              <div>
                <p className="font-bold text-primary font-[family-name:var(--font-family-headline)] italic text-lg">Uneven Distribution = Actionable</p>
                <p className="text-secondary text-sm leading-relaxed">
                  The 8-1-3 cluster split is not a failure — it's a key finding. Most Chinatown open spaces share a similar
                  pollution burden, with only a few exceptions. This directly informs where limited public-health resources
                  should be concentrated.
                </p>
              </div>
            </li>
          </ul>
        </div>
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/50 rounded-full backdrop-blur-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">K-Means Clustering Lab · Tufts University</span>
          </div>
        </div>
      </section>
    </div>
  )
}
