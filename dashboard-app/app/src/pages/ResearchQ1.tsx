import { useState, useMemo, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, AreaChart, Area, Line, ComposedChart, BarChart, Bar, Cell,
} from 'recharts'
import {
  useQ1Data,
  type SiteRow, type ScatterPoint, type RushSiteRow, type DowMsd,
  type AqiTimeseriesPoint,
} from '../hooks/useQ1Data'
import { useTranslation } from 'react-i18next'
import ReportViewer from '../components/ReportViewer'

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const C = {
  primary:            '#6f070f',
  primaryContainer:   '#902223',
  secondary:          '#87512d',
  secondaryContainer: '#feb78a',
  tertiary:           '#003e2f',
  tertiaryContainer:  '#005744',
  surface:            '#fff8f1',
  surfaceLow:         '#fff2da',
  surfaceContainer:   '#ffecc3',
  surfaceHighest:     '#f6e1ae',
  onSurface:          '#241a00',
  onSurfaceVariant:   '#58413f',
  outline:            '#8b716f',
  outlineVariant:     '#dfbfbc',
  error:              '#ba1a1a',
}

const SITE_COLORS: Record<string, string> = {
  berkley:     '#6f070f', castle:  '#902223', chin:        '#87512d', dewey:   '#c48a5a',
  eliotnorton: '#003e2f', greenway:'#005744', lyndenboro:  '#3a9e7e', msh:     '#8b716f',
  oxford:      '#a93533', reggie:  '#6b3a18', taitung:     '#2e7d5e', tufts:   '#d4766a',
}

const SITE_LABELS: Record<string, string> = {
  berkley:     'Berkeley',    castle:     'Castle Sq',    chin:      'Chin Park',
  dewey:       'Dewey Sq',    eliotnorton:'Eliot Norton', greenway:  'Greenway',
  lyndenboro:  'Lyndboro',    msh:        'Mary Soo Hoo', oxford:    'Oxford',
  reggie:      'Reggie Wong', taitung:    'Tai Tung',     tufts:     'Tufts',
}

const AQI_COLOR: Record<string, string> = {
  'Good':                  '#22c55e',
  'Moderate':              '#eab308',
  'Unhealthy (Sensitive)': '#f97316',
  'Unhealthy':             '#ef4444',
}
const AQI_META: Record<string, { color: string; bg: string; border: string }> = {
  'Good':                  { color: '#166534', bg: '#dcfce7', border: '#86efac' },
  'Moderate':              { color: '#854d0e', bg: '#fef9c3', border: '#fde047' },
  'Unhealthy (Sensitive)': { color: '#9a3412', bg: '#ffedd5', border: '#fb923c' },
  'Unhealthy':             { color: '#7f1d1d', bg: '#fee2e2', border: '#f87171' },
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function siteColor(s: string) { return SITE_COLORS[s] ?? C.outline }
function r2Color(v: number)   { return v >= 0.9 ? 'text-tertiary' : v >= 0.85 ? 'text-secondary' : 'text-error' }
function biasColor(v: number) { return Math.abs(v) < 1.0 ? 'text-tertiary' : Math.abs(v) < 2.0 ? 'text-secondary' : 'text-error font-bold' }
function rmseColor(v: number) { return v < 2.0 ? 'text-tertiary' : v <= 3.0 ? 'text-secondary' : 'text-error' }
function healthColor(h: number) { return h >= 90 ? 'bg-tertiary' : h >= 80 ? 'bg-secondary' : 'bg-primary' }
function biasToBg(bias: number) {
  const t = Math.min(Math.max(bias / 5, 0), 1)
  return `rgb(${Math.round(t * 111)},${Math.round(62 - t * 55)},${Math.round(47 - t * 32)})`
}
function avg(arr: number[]) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0 }

/* ─── Mini components ───────────────────────────────────────────────────── */
function Callout({
  icon, title, children, variant = 'info',
}: {
  icon: string; title: string; children: React.ReactNode; variant?: 'info' | 'warn' | 'success' | 'insight'
}) {
  const styles: Record<string, string> = {
    info:    'bg-surface-container-low border-l-4 border-tertiary text-on-surface',
    warn:    'bg-error-container border-l-4 border-error text-on-error-container',
    success: 'bg-surface-container-low border-l-4 border-tertiary text-on-surface',
    insight: 'bg-surface-container-lowest border-l-4 border-secondary text-on-surface',
  }
  return (
    <div className={`rounded-r-lg px-5 py-4 ${styles[variant]}`}>
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-xl mt-0.5 shrink-0">{icon}</span>
        <div>
          <p className="font-bold text-sm mb-1">{title}</p>
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/30 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{label}</span>
      </div>
      <h3 className="font-[family-name:var(--font-family-headline)] font-bold text-2xl text-primary">{title}</h3>
      {subtitle && <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">{subtitle}</p>}
    </div>
  )
}

function FilterPill({
  label, options, value, onChange,
}: {
  label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 shrink-0">{label}</span>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
            value === o.value
              ? 'bg-primary text-white border-primary'
              : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:border-primary hover:text-primary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ─── Leaflet bias map ──────────────────────────────────────────────────── */
const MAP_CENTER: [number, number] = [42.3385, -71.0680]
const MAP_ZOOM = 13
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'

const REF_STATIONS = [
  { id: 'dep_chinatown', name: 'DEP Chinatown FEM', lat: 42.3514, lon: -71.0609 },
  { id: 'dep_nubian',    name: 'DEP Nubian Sq. FEM', lat: 42.3257, lon: -71.0826 },
]
const REF_COLOR = '#87512d'

function createBiasIcon(bias: number, isHovered: boolean) {
  const base = 10 + Math.abs(bias) * 4
  const size = isHovered ? base + 6 : base
  const border = isHovered ? 3 : 2
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px; height:${size}px;
      background:${biasToBg(bias)};
      border:${border}px solid white;
      border-radius:50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      transition: all 0.15s ease;
    "></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  })
}

function createRefIcon(isHovered: boolean) {
  const size = isHovered ? 16 : 11
  const border = isHovered ? 3 : 2
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px; height:${size}px;
      background:${REF_COLOR};
      border:${border}px solid white;
      border-radius:3px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      transition: all 0.15s ease;
    "></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  })
}

import type { SiteCoord } from '../hooks/useQ1Data'

function BiasMap({ siteCoords }: { siteCoords: SiteCoord[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    const map = L.map(mapRef.current, {
      center: MAP_CENTER, zoom: MAP_ZOOM,
      zoomControl: false, attributionControl: false, scrollWheelZoom: false,
    })
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map)
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map)
    const tilePane = map.getPane('tilePane')
    if (tilePane) tilePane.style.filter = 'saturate(0.7) sepia(0.15) hue-rotate(-5deg)'
    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || siteCoords.length === 0) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // PA sensor markers
    siteCoords.forEach(s => {
      const marker = L.marker([s.lat, s.lon], { icon: createBiasIcon(s.bias, false) })
      const popup = `
        <div style="font-family:'Manrope',sans-serif;padding:6px;min-width:160px;">
          <div style="font-family:'Newsreader',serif;font-weight:700;font-size:14px;color:#6f070f;">${s.name}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;font-size:11px;">
            <div><span style="color:#87512d;font-size:9px;font-weight:700;text-transform:uppercase;">Bias</span><br/>
              <strong>${s.bias > 0 ? '+' : ''}${s.bias.toFixed(2)}</strong> <span style="color:#58413f;font-size:9px;">µg/m³</span></div>
            <div><span style="color:#87512d;font-size:9px;font-weight:700;text-transform:uppercase;">R²</span><br/>
              <strong>${s.r2.toFixed(3)}</strong></div>
          </div>
          <div style="margin-top:4px;font-size:10px;color:#58413f;">n = ${s.n.toLocaleString()} obs</div>
        </div>`
      marker.bindPopup(popup, { maxWidth: 220, className: 'chinatown-popup', closeButton: true, offset: [0, -5] })
      marker.on('mouseover', () => marker.setIcon(createBiasIcon(s.bias, true)))
      marker.on('mouseout',  () => marker.setIcon(createBiasIcon(s.bias, false)))
      marker.addTo(map)
      markersRef.current.push(marker)
    })

    // Reference station markers (blue squares)
    REF_STATIONS.forEach(ref => {
      const marker = L.marker([ref.lat, ref.lon], { icon: createRefIcon(false) })
      const popup = `
        <div style="font-family:'Manrope',sans-serif;padding:6px;">
          <div style="font-family:'Newsreader',serif;font-weight:700;font-size:14px;color:${REF_COLOR};">${ref.name}</div>
          <div style="margin-top:4px;font-size:11px;color:#58413f;">Federal Equivalent Method reference monitor</div>
        </div>`
      marker.bindPopup(popup, { maxWidth: 220, className: 'chinatown-popup', closeButton: true, offset: [0, -5] })
      marker.on('mouseover', () => marker.setIcon(createRefIcon(true)))
      marker.on('mouseout',  () => marker.setIcon(createRefIcon(false)))
      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }, [siteCoords])

  return (
    <div className="relative">
      <div ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-outline-variant/20"
        style={{ height: 351 }} />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2.5 shadow-md border border-outline-variant/20">
        <p className="text-[9px] font-bold text-secondary/60 uppercase tracking-widest mb-1.5">Mean Bias by Site</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px]">
            <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: biasToBg(0) }} />
            <span className="text-on-surface-variant">Low bias</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: biasToBg(3) }} />
            <span className="text-on-surface-variant">High bias</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <div className="w-3 h-3 rounded-sm border-2 border-white shadow-sm" style={{ background: REF_COLOR }} />
            <span className="text-on-surface-variant">FEM Reference</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function ResearchQ1() {
  const {
    scatter, blandAltman, siteTable, concBias, diurnal, rolling,
    heatmap, assets, rushStats, rushSite, dowMsd, aqiTimeseries, siteCoords, loading,
  } = useQ1Data()
  const { t } = useTranslation()

  /* Filter state */
  const [scatterPeriod, setScatterPeriod] = useState<'all' | 'rush' | 'nonrush'>('all')
  const [scatterSite,   setScatterSite]   = useState('all')
  const [rushView,      setRushView]      = useState<'bias' | 'pa'>('bias')
  const [dowMetric,     setDowMetric]     = useState<'msd' | 'rmse' | 'bias'>('msd')
  const [showReport,    setShowReport]    = useState(false)

  const siteOptions = useMemo(() => [
    { value: 'all', label: 'All Sites' },
    ...Object.keys(SITE_COLORS).map(id => ({ value: id, label: SITE_LABELS[id] ?? id })),
  ], [])

  const filteredScatter = useMemo<ScatterPoint[]>(() => {
    if (!scatter) return []
    let pts = scatter.points
    if (scatterPeriod === 'rush')    pts = pts.filter(p => p.rush)
    if (scatterPeriod === 'nonrush') pts = pts.filter(p => !p.rush)
    if (scatterSite !== 'all')       pts = pts.filter(p => p.site === scatterSite)
    return pts
  }, [scatter, scatterPeriod, scatterSite])

  const rushBySite = useMemo(() => {
    const rush:    Record<string, RushSiteRow> = {}
    const nonrush: Record<string, RushSiteRow> = {}
    rushSite.forEach(r => {
      if (r.period === 'rush') rush[r.site_id] = r; else nonrush[r.site_id] = r
    })
    return Object.keys(SITE_COLORS).map(s => ({
      site_id:     s,
      name:        SITE_LABELS[s] ?? s,
      rush_bias:   rush[s]?.bias     ?? 0,
      nonrush_bias:nonrush[s]?.bias  ?? 0,
      rush_pa:     rush[s]?.pa_mean  ?? 0,
      nonrush_pa:  nonrush[s]?.pa_mean ?? 0,
    })).sort((a, b) => b.rush_bias - a.rush_bias)
  }, [rushSite])

  const getDowVal = (d: DowMsd) =>
    dowMetric === 'msd' ? d.msd : dowMetric === 'rmse' ? d.rmse : d.mean_bias

  /* Overview stats from daily timeseries */
  const overview = useMemo(() => {
    if (!aqiTimeseries.length) return null
    const paAvg  = aqiTimeseries.reduce((s, d) => s + d.pa_mean, 0) / aqiTimeseries.length
    const depAvg = aqiTimeseries.reduce((s, d) => s + d.dep_mean, 0) / aqiTimeseries.length
    const diff   = paAvg - depAvg
    const goodDays = aqiTimeseries.filter(d => d.aqi === 'Good').length
    return { paAvg, depAvg, diff, days: aqiTimeseries.length, goodDays }
  }, [aqiTimeseries])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-10 py-24 text-center">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      <p className="mt-4 text-sm text-stone-400">{t('common.loading')}</p>
    </div>
  )

  const reg     = scatter!.regression
  const baStats = blandAltman!.stats
  const tempLabels  = ['60-70', '70-75', '75-80', '80-85', '85-95']
  const humidLabels = ['<50%',  '50-60%', '60-70%', '70-80%', '>80%']
  const heatGrid = humidLabels.map(h =>
    tempLabels.map(tt => heatmap.find(c => c.temp === tt && c.humidity === h))
  )

  const wdBias = dowMsd.filter(d => !d.is_weekend).map(d => d.mean_bias)
  const weBias = dowMsd.filter(d =>  d.is_weekend).map(d => d.mean_bias)
  const wdMsd  = dowMsd.filter(d => !d.is_weekend).map(d => d.msd)
  const weMsd  = dowMsd.filter(d =>  d.is_weekend).map(d => d.msd)

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-16">

      {/* ══════════════════════════════════════════════════════════
          §0  Context + KPIs
      ══════════════════════════════════════════════════════════ */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: headline + callouts */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30">
              <div className="w-2 h-2 rounded-full bg-tertiary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary">{t('q1.badge')}</span>
            </div>

            <h2 className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary tracking-tight leading-none">
              {t('q1.title')}
            </h2>
            <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">{t('q1.description')}</p>

            <Callout icon="help_outline" title="What is this page measuring?" variant="info">
              The HEROS project deployed 12 low-cost <strong>PurpleAir (PA) sensors</strong> across Chinatown open spaces.
              This page asks: <em>do they agree with the gold-standard MassDEP Federal Equivalent Method (FEM) monitors?</em>{' '}
              Accuracy matters — a biased sensor could hide real health risks or trigger unnecessary alerts.
            </Callout>

            <Callout icon="science" title="Why the bias matters for community health" variant="insight">
              A sensor that reads +1.5 µg/m³ too high seems minor, but at concentrations near the EPA annual standard
              (9&nbsp;µg/m³) it overstates by 17%. During summer heat events — when Chinatown residents are most vulnerable —
              bias grows to 3–4 µg/m³. Our local calibration corrects this entirely.
            </Callout>

            <div className="flex flex-wrap gap-3 pt-1">
              {[t('q1.withinTolerance'), t('q1.pairedObs'), t('q1.sensorDrift')].map(tag => (
                <span key={tag} className="bg-surface-container px-4 py-2 text-xs font-bold text-secondary-container border border-secondary-container/30 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: KPI + mini map */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface-container-highest p-6 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-8xl">monitoring</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Study Period</p>
              <div className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-primary">{overview?.days ?? '—'} Days</div>
              <p className="text-xs text-stone-500 mt-1">Jul 19 – Aug 23, 2023 · 12 PurpleAir sensors vs. MassDEP FEM</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'PA Average',  value: overview ? overview.paAvg.toFixed(1) : '—',  unit: 'µg/m³', note: 'open-space sensors', color: 'text-primary' },
                { label: 'DEP Average', value: overview ? overview.depAvg.toFixed(1) : '—', unit: 'µg/m³', note: 'FEM reference',        color: 'text-secondary' },
                { label: 'Difference',   value: overview ? `+${overview.diff.toFixed(1)}` : '—', unit: 'µg/m³', note: 'PA reads higher',   color: 'text-error'  },
              ].map(k => (
                <div key={k.label} className="bg-white p-4 shadow-sm border border-stone-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">{k.label}</p>
                  <div className={`text-lg font-[family-name:var(--font-family-headline)] font-bold ${k.color}`}>
                    {k.value} <span className="text-xs font-normal text-stone-400">{k.unit}</span>
                  </div>
                  <p className="text-[10px] text-stone-400">{k.note}</p>
                </div>
              ))}
            </div>

            {/* Leaflet bias map */}
            <BiasMap siteCoords={siteCoords} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §0b  Data at a Glance — PA vs DEP over time
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Data Overview"
          title="PM2.5 Readings Over the Study Period"
          subtitle="Before diving into statistics — here are the raw daily averages from PurpleAir sensors and the DEP reference monitor, side by side."
        />

        <div className="bg-surface-container-low p-8">
          <div className="flex flex-wrap gap-6 items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 rounded" style={{ background: C.primary }} />
              <span className="text-xs text-on-surface-variant">PurpleAir (12-site avg)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 rounded" style={{ background: C.tertiary }} />
              <span className="text-xs text-on-surface-variant">DEP Chinatown FEM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm bg-secondary/10" />
              <span className="text-xs text-on-surface-variant">Difference (shaded)</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={aqiTimeseries} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                tickFormatter={(d: string) => new Date(d + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis tick={{ fontSize: 10, fill: C.onSurfaceVariant }} domain={[0, 'auto']}
                label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 10, fill: C.onSurfaceVariant }} />
              <Tooltip
                contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(1)} µg/m³`, String(name)]}
                labelFormatter={(d: unknown) => new Date(String(d) + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              />
              <Area dataKey="bias" name="Bias" fill={C.secondary} fillOpacity={0.12} stroke="none" />
              <Line dataKey="pa_mean" name="PurpleAir" type="monotone" stroke={C.primary} strokeWidth={2} dot={false} />
              <Line dataKey="dep_mean" name="DEP FEM" type="monotone" stroke={C.tertiary} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-5 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-tertiary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">visibility</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">What you're seeing</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  The two lines track each other closely — that's a good sign. But PA (red) consistently sits above
                  DEP (green). That gap is the <strong>bias</strong>: PA overreads by about 1.5 µg/m³ on average.
                  Notice the gap widens on high-pollution days (late July) — we'll quantify this pattern next.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Study Days',     value: overview?.days.toString() ?? '—',                       icon: 'date_range',   color: C.primary },
            { label: 'PA Daily Avg',    value: overview ? `${overview.paAvg.toFixed(1)} µg/m³` : '—',  icon: 'sensors',      color: C.primary },
            { label: 'DEP Daily Avg',   value: overview ? `${overview.depAvg.toFixed(1)} µg/m³` : '—', icon: 'verified',     color: C.tertiary },
            { label: 'Days in "Good" AQI', value: overview ? `${overview.goodDays} of ${overview.days}` : '—', icon: 'eco', color: '#22c55e' },
          ].map(k => (
            <div key={k.label} className="bg-white p-4 border border-stone-100 flex items-start gap-3">
              <span className="material-symbols-outlined text-lg mt-0.5" style={{ color: k.color }}>{k.icon}</span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{k.label}</p>
                <p className="text-sm font-bold text-on-surface">{k.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §1  Correlation + Bland-Altman
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Core Agreement Analysis"
          title="PA vs. Reference — Correlation & Bias Distribution"
          subtitle="Now let's quantify the gap we saw above. How tightly do the two sensors agree, and how big is the systematic overread?"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: t('q1.pearsonR'), value: '0.939',  note: 'strong linear agreement', color: 'text-primary', icon: 'analytics' },
            { label: t('q1.meanBias'), value: '+1.53',  note: 'µg/m³ · PA reads high',   color: 'text-secondary', icon: 'arrow_upward' },
            { label: t('q1.rmse'),     value: '2.53',   note: 'µg/m³ · before calibration', color: 'text-secondary', icon: 'straighten' },
            { label: 'Within ±5',      value: '94.6%',  note: 'of all paired readings',  color: 'text-tertiary', icon: 'check_circle' },
          ].map(k => (
            <div key={k.label} className="bg-surface-container-low p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-lg mt-0.5" style={{ color: k.color === 'text-primary' ? C.primary : k.color === 'text-secondary' ? C.secondary : C.tertiary }}>{k.icon}</span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{k.label}</p>
                <p className={`text-lg font-[family-name:var(--font-family-headline)] font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-stone-400">{k.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-6 p-4 mb-6 bg-surface-container-low rounded-lg border border-outline-variant/30">
          <FilterPill
            label="Time Period"
            value={scatterPeriod}
            onChange={v => setScatterPeriod(v as 'all' | 'rush' | 'nonrush')}
            options={[
              { value: 'all',     label: 'All Hours' },
              { value: 'rush',    label: 'Rush Hour (7–10am, 4–8pm)' },
              { value: 'nonrush', label: 'Off-Peak' },
            ]}
          />
          <FilterPill label="Site" value={scatterSite} onChange={setScatterSite} options={siteOptions} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Scatter */}
          <div className="bg-surface-container-low p-8">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary">{t('q1.corrAnalysis')}</h4>
              <span className="text-[10px] uppercase tracking-widest bg-surface-container px-2 py-1">
                n = {filteredScatter.length.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Each point = one 10-minute reading pair. The <strong className="text-primary">red line</strong> is the overall
              regression; the <strong className="text-stone-400">dashed line</strong> is perfect 1:1 agreement.
              Points above the dash mean PA reads higher than the reference.
            </p>
            <ResponsiveContainer width="100%" height={290}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis dataKey="pa"  type="number" name="Purple Air"  unit=" µg/m³" domain={[0, 30]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: 'Purple Air PM2.5 (µg/m³)', position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }} />
                <YAxis dataKey="dep" type="number" name="MassDEP FEM" unit=" µg/m³" domain={[0, 30]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: 'MassDEP FEM (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 10, fill: C.onSurfaceVariant }} />
                <Tooltip
                  contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                  formatter={(v: unknown, name: unknown) => [`${v} µg/m³`, name as string]}
                />
                {/* 1:1 line */}
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 30, y: 30 }]}
                  stroke={C.outlineVariant} strokeDasharray="6 4" strokeWidth={1} />
                {/* Regression line */}
                <ReferenceLine segment={[{ x: 0, y: reg.intercept }, { x: 30, y: reg.slope * 30 + reg.intercept }]}
                  stroke={C.primary} strokeWidth={2} />
                <Scatter data={filteredScatter} r={2.5}>
                  {filteredScatter.map((p, i) => (
                    <Cell key={i} fill={scatterSite === 'all' ? siteColor(p.site) : C.primary} fillOpacity={0.38} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-stone-400 italic text-right">
              y = {reg.slope}x + {reg.intercept} &nbsp;|&nbsp; R² = {reg.r2}
            </div>
          </div>

          {/* Bland-Altman */}
          <div className="bg-surface-container-low p-8">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary">{t('q1.blandAltman')}</h4>
              <span className="material-symbols-outlined text-secondary">legend_toggle</span>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Plots the difference (PA − DEP) against their average. A flat band near zero = excellent agreement.
              The <strong>widening funnel at higher concentrations</strong> reveals PA overestimates more on high-pollution
              days — exactly when accuracy matters most.
            </p>
            <ResponsiveContainer width="100%" height={290}>
              <ScatterChart margin={{ top: 10, right: 44, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.3} />
                <XAxis dataKey="mean" type="number" name="Mean" unit=" µg/m³" domain={[0, 25]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: '(PA + DEP) / 2 (µg/m³)', position: 'bottom', offset: 15, fontSize: 10, fill: C.onSurfaceVariant }} />
                <YAxis dataKey="diff" type="number" name="Difference" domain={[-10, 15]}
                  tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: 'PA − DEP (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 10, fill: C.onSurfaceVariant }} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }} />
                <ReferenceLine y={0}               stroke={C.outlineVariant} strokeWidth={1} />
                <ReferenceLine y={baStats.mean_bias} stroke={C.primary}    strokeWidth={1.5}
                  label={{ value: `Bias: +${baStats.mean_bias}`, position: 'right', fontSize: 10, fill: C.primary }} />
                <ReferenceLine y={baStats.loa_upper} stroke={C.secondary}  strokeDasharray="6 4"
                  label={{ value: `+${baStats.loa_upper}`, position: 'right', fontSize: 9, fill: C.secondary }} />
                <ReferenceLine y={baStats.loa_lower} stroke={C.secondary}  strokeDasharray="6 4"
                  label={{ value: `${baStats.loa_lower}`, position: 'right', fontSize: 9, fill: C.secondary }} />
                <Scatter data={blandAltman!.points} r={2}>
                  {blandAltman!.points.map((p, i) => (
                    <Cell key={i} fill={siteColor(p.site)} fillOpacity={0.3} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 border border-stone-100">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Mean Bias</p>
                <p className="font-bold text-primary">+{baStats.mean_bias} µg/m³</p>
                <p className="text-[10px] text-stone-400">PA always reads higher</p>
              </div>
              <div className="bg-white p-3 border border-stone-100">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">95% Limits of Agreement</p>
                <p className="font-bold text-secondary">{baStats.loa_lower} to +{baStats.loa_upper} µg/m³</p>
                <p className="text-[10px] text-stone-400">Range containing 95% of readings</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-surface-container-highest/30 p-6 rounded-xl border-l-4 border-tertiary">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">info</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">Correlation is not the same as accuracy</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                <strong>High correlation (r = 0.939)</strong> means PA and DEP move together — when pollution spikes, both sensors detect it.
                But correlation alone doesn't guarantee accuracy. The <strong>+1.53 µg/m³ bias</strong> is a separate issue: PA
                consistently overstates concentration. Both measures matter — correlation for trend detection, bias correction for
                health-grade comparisons against the EPA annual standard.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-tertiary/60 mb-0.5">Slope</p>
                  <p className="text-sm font-bold text-on-surface">0.94</p>
                  <p className="text-[10px] text-on-surface-variant">Near 1.0 = proportional tracking</p>
                </div>
                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-tertiary/60 mb-0.5">Practical Impact</p>
                  <p className="text-sm font-bold text-on-surface">~12% overread</p>
                  <p className="text-[10px] text-on-surface-variant">At the EPA 12 µg/m³ annual standard</p>
                </div>
                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-tertiary/60 mb-0.5">Correction Need</p>
                  <p className="text-sm font-bold text-on-surface">Linear model</p>
                  <p className="text-[10px] text-on-surface-variant">Simple regression removes most bias</p>
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant/70 mt-3 italic">
                The Bland-Altman funnel shape (right panel) reveals an important nuance: PA accuracy degrades at higher concentrations.
                On clean days (&lt;5 µg/m³) the sensors nearly agree; on polluted days (&gt;15 µg/m³) the overread can exceed 5 µg/m³.
                A concentration-dependent correction — not a flat offset — produces the most accurate calibrated readings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §2  AQI Context
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Health Context"
          title="Daily PM2.5 with EPA AQI Categories"
          subtitle="Where did each study day fall on the EPA air quality health scale? Most of the period was 'Good' — but monitoring on moderate days is critical for community decision-making."
        />

        <div className="bg-white p-6 border border-stone-100 shadow-sm">
          <div className="mb-4 bg-surface-container-highest/30 p-4 rounded-xl border-l-4 border-tertiary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">health_and_safety</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Reading the EPA AQI</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <strong>Good (&lt;9 µg/m³):</strong> air quality is satisfactory, no health concern. &nbsp;
                  <strong>Moderate (9–35):</strong> unusually sensitive people should consider limiting prolonged outdoor exertion. &nbsp;
                  <strong>Unhealthy for Sensitive Groups (35–55):</strong> people with heart/lung disease, children, and older adults
                  should reduce extended outdoor activity.
                </p>
              </div>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            {(Object.entries(AQI_META) as [string, { color: string; bg: string; border: string }][]).map(([key, meta]) => (
              <span key={key}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border"
                style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                {key}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={aqiTimeseries} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.onSurfaceVariant }}
                tickFormatter={(d: string) => d.slice(5)} interval={4} />
              <YAxis tick={{ fontSize: 9, fill: C.onSurfaceVariant }}
                label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 9, fill: C.onSurfaceVariant }} />
              <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }}
                formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(2)} µg/m³`, name as string]} />
              <ReferenceLine y={9.0}  stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1}
                label={{ value: 'Good / Moderate', fontSize: 8, fill: '#16a34a', position: 'right' }} />
              <ReferenceLine y={35.4} stroke="#eab308" strokeDasharray="4 3" strokeWidth={1}
                label={{ value: 'Mod / Unhealthy', fontSize: 8, fill: '#854d0e', position: 'right' }} />
              <Bar dataKey="pa_mean" name="PA Mean (daily)" maxBarSize={14}>
                {(aqiTimeseries as AqiTimeseriesPoint[]).map((e, i) => (
                  <Cell key={i} fill={AQI_COLOR[e.aqi] ?? C.outline} opacity={0.8} />
                ))}
              </Bar>
              <Line dataKey="dep_mean" name="DEP FEM" stroke={C.primary} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-stone-400 mt-2 italic">
            Bars = daily PA mean, coloured by AQI category. Line = DEP Chinatown FEM reference.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { cat: 'Good',                  color: '#22c55e', bg: '#dcfce7', border: '#86efac' },
            { cat: 'Moderate',              color: '#ca8a04', bg: '#fef9c3', border: '#fde047' },
            { cat: 'Unhealthy (Sensitive)', color: '#ea580c', bg: '#ffedd5', border: '#fb923c' },
          ] as const).map(row => {
            const days = (aqiTimeseries as AqiTimeseriesPoint[]).filter(d => d.aqi === row.cat).length
            return (
              <div key={row.cat} className="flex items-center gap-4 p-4 rounded-lg border"
                style={{ background: row.bg, borderColor: row.border + '88' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: row.color }}>
                  {days}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: row.color }}>{row.cat}</p>
                  <p className="text-xs text-stone-500">{days === 1 ? 'day' : 'days'} during study period</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §3  Rush-Hour Analysis
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Traffic Analysis"
          title="Rush-Hour vs. Off-Peak Sensor Accuracy"
          subtitle="Boston rush hours (7–10 AM, 4–8 PM) bring concentrated vehicle emissions. Does traffic exposure affect PA accuracy?"
        />

        {rushStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['rush', 'nonrush'] as const).map(period => {
              const d = rushStats[period]
              const isRush = period === 'rush'
              return (
                <div key={period} className={`p-6 border-2 ${isRush ? 'border-primary/20 bg-primary/5' : 'border-tertiary/20 bg-tertiary/5'}`}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="material-symbols-outlined text-2xl"
                      style={{ color: isRush ? C.primary : C.tertiary }}>
                      {isRush ? 'traffic' : 'nights_stay'}
                    </span>
                    <div>
                      <h4 className="font-bold text-lg leading-none" style={{ color: isRush ? C.primaryContainer : C.tertiary }}>
                        {isRush ? 'Rush Hour' : 'Off-Peak'}
                      </h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {isRush ? '7–10 AM and 4–8 PM' : 'All other hours'} · n = {d.n.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'PA Mean',        value: `${d.pa_mean} µg/m³` },
                      { label: 'DEP Mean',       value: `${d.dep_mean} µg/m³` },
                      { label: 'Bias (PA − DEP)',value: `+${d.mean_bias} µg/m³`, hl: true },
                      { label: 'Correlation',    value: `r = ${d.pearson_r}` },
                    ].map(s => (
                      <div key={s.label} className="bg-white/70 p-3 rounded">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">{s.label}</p>
                        <p className={`text-sm font-bold ${s.hl ? (isRush ? 'text-primary' : 'text-tertiary') : 'text-on-surface'}`}>
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {rushStats && (
          <div className="mt-4 mb-6 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-secondary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-xl mt-0.5">insights</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Finding: traffic adds measurable bias</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Rush-hour bias (<strong>+{rushStats.rush.mean_bias} µg/m³</strong>) is{' '}
                  {Math.round(((rushStats.rush.mean_bias - rushStats.nonrush.mean_bias) / rushStats.nonrush.mean_bias) * 100)}% higher
                  than off-peak (<strong>+{rushStats.nonrush.mean_bias} µg/m³</strong>).
                  Correlation also decreases (r = {rushStats.rush.pearson_r} vs {rushStats.nonrush.pearson_r}),
                  confirming PA is less reliable during peak traffic — especially at road-adjacent sites.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-surface-container-low p-8">
          <div className="mb-6 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-primary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">directions_car</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Why traffic changes sensor accuracy</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  PurpleAir sensors detect particles by laser light scattering. Fresh traffic emissions contain mostly
                  small, irregular particles that scatter light differently from aged background PM2.5.
                  Sites near I-93 (One Greenway) are especially exposed. If rush-hour bias is significantly higher,
                  <strong> time-varying corrections</strong> are needed for accurate health monitoring.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary">Rush vs. Off-Peak by Site</h4>
            <FilterPill
              label="Show"
              value={rushView}
              onChange={v => setRushView(v as 'bias' | 'pa')}
              options={[
                { value: 'bias', label: 'Bias (PA − DEP)' },
                { value: 'pa',   label: 'PA Concentration' },
              ]}
            />
          </div>
          <p className="text-xs text-stone-500 mb-4">
            Sorted by rush-hour {rushView === 'bias' ? 'bias' : 'PA concentration'} (highest first).
            <strong className="text-primary"> Red</strong> = rush hour ·{' '}
            <strong className="text-tertiary">Green</strong> = off-peak.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rushBySite} margin={{ top: 5, right: 10, bottom: 60, left: 10 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.onSurfaceVariant }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 9, fill: C.onSurfaceVariant }}
                label={{ value: rushView === 'bias' ? 'Bias (µg/m³)' : 'PA PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 9 }} />
              <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }}
                formatter={(v: unknown) => [`${Number(v).toFixed(2)} µg/m³`]} />
              <ReferenceLine y={0} stroke={C.outlineVariant} />
              <Bar name="Rush Hour" dataKey={rushView === 'bias' ? 'rush_bias'   : 'rush_pa'}    fill={C.primaryContainer} opacity={0.8} radius={[4, 4, 0, 0]} />
              <Bar name="Off-Peak"  dataKey={rushView === 'bias' ? 'nonrush_bias': 'nonrush_pa'} fill={C.tertiary} opacity={0.8} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §4  Day of Week
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Weekly Patterns"
          title="Sensor Agreement by Day of Week"
          subtitle="Traffic volumes drop sharply on weekends. If PA bias tracks traffic, weekends should show lower Mean Squared Difference — this section tests that directly."
        />

        <div className="bg-surface-container-low p-8">
          <div className="mb-6 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-tertiary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">calendar_month</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Why weekday patterns matter</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Boston vehicle volumes peak Tuesday–Thursday and fall ~30% on weekends.
                  If PA overreads because of fresh traffic particles, we'd expect <strong>higher MSD on weekdays</strong>.
                  This would justify differential weekday/weekend calibration coefficients in any operational
                  air-quality alert system deployed in Chinatown.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary">PA–DEP Agreement Metric by Weekday</h4>
            <FilterPill
              label="Metric"
              value={dowMetric}
              onChange={v => setDowMetric(v as 'msd' | 'rmse' | 'bias')}
              options={[
                { value: 'msd',  label: 'MSD (µg/m³)²' },
                { value: 'rmse', label: 'RMSE (µg/m³)' },
                { value: 'bias', label: 'Mean Bias (µg/m³)' },
              ]}
            />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dowMsd} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.2} />
              <XAxis dataKey="day_short" tick={{ fontSize: 10, fill: C.onSurfaceVariant }} />
              <YAxis tick={{ fontSize: 9, fill: C.onSurfaceVariant }}
                label={{
                  value: dowMetric === 'msd' ? 'MSD (µg/m³)²' : dowMetric === 'rmse' ? 'RMSE (µg/m³)' : 'Bias (µg/m³)',
                  angle: -90, position: 'insideLeft', fontSize: 9,
                }} />
              <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }}
                formatter={(v: unknown) => [Number(v).toFixed(3)]}
                labelFormatter={(l: unknown) => {
                  const d = dowMsd.find(x => x.day_short === l)
                  return d ? `${d.day} (n = ${d.n.toLocaleString()})` : String(l)
                }} />
              <Bar dataKey={(d: DowMsd) => getDowVal(d)} radius={[4, 4, 0, 0]}>
                {dowMsd.map((e, i) => (
                  <Cell key={i} fill={e.is_weekend ? C.tertiaryContainer : C.secondary} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-5 grid grid-cols-7 gap-1.5">
            {dowMsd.map(d => (
              <div key={d.day}
                className={`p-2.5 rounded-lg text-center border ${d.is_weekend ? 'bg-tertiary/5 border-tertiary/20' : 'bg-white border-outline-variant/20'}`}>
                <p className="text-[10px] font-bold mb-1" style={{ color: d.is_weekend ? C.tertiaryContainer : C.secondary }}>
                  {d.day_short}
                </p>
                <p className="text-sm font-bold text-stone-800">{getDowVal(d).toFixed(2)}</p>
                <p className={`text-[9px] mt-0.5 ${biasColor(d.mean_bias)}`}>
                  {d.mean_bias > 0 ? '+' : ''}{d.mean_bias.toFixed(2)} bias
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-4 text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: C.secondary }} /> Weekday
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: C.tertiaryContainer }} /> Weekend
            </span>
          </div>
        </div>

        {dowMsd.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-stone-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl text-secondary">work</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Weekday Average</p>
                <p className="text-lg font-bold text-secondary">Bias: +{avg(wdBias).toFixed(2)} µg/m³</p>
                <p className="text-xs text-stone-400">MSD = {avg(wdMsd).toFixed(2)} (µg/m³)²</p>
              </div>
            </div>
            <div className="bg-tertiary/5 border border-tertiary/20 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl text-tertiary">weekend</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary/50">Weekend Average</p>
                <p className="text-lg font-bold text-tertiary">Bias: +{avg(weBias).toFixed(2)} µg/m³</p>
                <p className="text-xs text-tertiary/60">MSD = {avg(weMsd).toFixed(2)} (µg/m³)²</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          §5  Site Performance Table
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Site-Level Analysis"
          title="Per-Site Performance"
          subtitle="Each PA sensor has its own accuracy profile shaped by its microenvironment — proximity to roads, tree canopy, building shelter, and traffic exposure."
        />

        <div className="bg-white shadow-sm border border-stone-100 overflow-hidden">
          <div className="px-8 py-5 bg-surface-container flex justify-between items-center">
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary">{t('q1.sitePerformance')}</h4>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              {siteTable.length} Sites · Sorted by Bias ↑
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/20">
                  {['Site', 'Slope', 'Intercept', 'R²', 'RMSE', 'Bias (µg/m³)', 'N'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {siteTable.map((site: SiteRow, i: number) => (
                  <tr key={site.site_id} className={`hover:bg-surface-container-low transition-colors ${i % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                    <td className="px-5 py-4 font-bold text-stone-800">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: siteColor(site.site_id) }} />
                        {site.name}
                        {site.site_id === 'castle'   && <span className="bg-tertiary/80 text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter">Best</span>}
                        {site.site_id === 'greenway' && <span className="bg-error/80   text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter">High Bias</span>}
                      </div>
                    </td>
                    <td className={`px-5 py-4 text-sm ${site.slope > 1.25 ? 'text-error font-bold' : ''}`}>{site.slope.toFixed(3)}</td>
                    <td className="px-5 py-4 text-sm">{site.intercept >= 0 ? '+' : ''}{site.intercept.toFixed(3)}</td>
                    <td className={`px-5 py-4 font-bold ${r2Color(site.r_squared)}`}>{site.r_squared.toFixed(3)}</td>
                    <td className={`px-5 py-4 text-sm ${rmseColor(site.rmse)}`}>{site.rmse.toFixed(2)}</td>
                    <td className={`px-5 py-4 font-bold ${biasColor(site.bias)}`}>{site.bias >= 0 ? '+' : ''}{site.bias.toFixed(2)}</td>
                    <td className="px-5 py-4 text-xs text-stone-400">{site.n.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mx-8 my-6 bg-surface-container-highest/30 p-5 rounded-xl border-l-4 border-secondary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-xl mt-0.5">location_on</span>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Why sites differ — same sensor, different results</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  All 12 PA-II sensors are identical hardware, yet bias ranges from <strong>−0.01</strong> (Castle Square)
                  to <strong>+2.64 µg/m³</strong> (One Greenway). One Greenway sits adjacent to I-93;
                  Castle Square is in a sheltered residential courtyard.
                  Microenvironment — not the sensor — drives most site-level variation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §6  Bias Drivers
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Bias Drivers"
          title="What Makes PA Read High?"
          subtitle="Bias isn't constant — it responds to concentration levels, time of day, temperature, and humidity. Understanding each driver guides the calibration strategy."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

          {/* Concentration bias */}
          <div className="lg:col-span-2 bg-surface-container-low p-8">
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary mb-1">{t('q1.biasByLevel')}</h4>
            <p className="text-xs text-stone-500 mb-4">
              Bias peaks at <strong>10–15 µg/m³</strong> — the health-relevant window near the EPA standard.
              At very low concentrations PA reads only slightly high; at extreme levels the bias flattens.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={concBias} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} opacity={0.2} horizontal={false} />
                <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 10, fill: C.onSurfaceVariant }}
                  label={{ value: 'Mean Bias (µg/m³)', position: 'bottom', offset: 0, fontSize: 10 }} />
                <YAxis dataKey="bin" type="category" tick={{ fontSize: 9, fill: C.onSurfaceVariant }} width={80} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.outlineVariant}`, fontSize: 11 }}
                  formatter={(v: unknown) => [`${v} µg/m³`, 'Bias']} />
                <Bar dataKey="bias" radius={[0, 4, 4, 0]}>
                  {concBias.map((e, i) => {
                    const tt = Math.min(e.bias / 3.5, 1)
                    return <Cell key={i} fill={`rgb(${Math.round(tt * 111)},${Math.round(62 - tt * 48)},${Math.round(47 - tt * 32)})`} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Diurnal */}
          <div className="bg-white p-8 border border-stone-100">
            <h4 className="font-bold text-xl text-secondary mb-1">{t('q1.diurnalBias')}</h4>
            <p className="text-xs text-stone-500 mb-3">
              Bias is lowest at night (~1.1 µg/m³) and peaks around noon–1 PM (~2.0 µg/m³).
              Red dashed lines mark rush-hour windows.
            </p>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={diurnal} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <defs>
                  <linearGradient id="dG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.secondary} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={C.secondary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                {/* Rush-hour shading reference lines */}
                <ReferenceLine x={7}  stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine x={9}  stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine x={16} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine x={19} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={1.53} stroke={C.primary} strokeDasharray="4 4" strokeWidth={1} />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} tickFormatter={(h: number) => h % 6 === 0 ? `${h}h` : ''} />
                <YAxis domain={[0, 3]} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ background: C.surface, fontSize: 11 }}
                  formatter={(v: unknown) => [`${v} µg/m³`, 'Bias']}
                  labelFormatter={(h: unknown) => `${h}:00`} />
                <Area type="monotone" dataKey="bias" stroke={C.secondary} fill="url(#dG)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[9px] text-stone-400 mt-1">Red dashes = rush hours · Horizontal line = overall mean bias</p>
          </div>

          {/* Temp × Humidity heatmap */}
          <div className="bg-tertiary-container p-8 flex flex-col">
            <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-white mb-1">{t('q1.tempHumidity')}</h4>
            <p className="text-xs text-white/70 mb-3">
              Highest bias at high temp + moderate humidity — typical of Chinatown summer afternoons.
            </p>
            <div className="grid grid-cols-6 gap-1 mb-1">
              <div />
              {tempLabels.map(tt => <div key={tt} className="text-[8px] text-center text-white/70">{tt}°F</div>)}
            </div>
            {heatGrid.map((row, ri) => (
              <div key={ri} className="grid grid-cols-6 gap-1 mb-1">
                <div className="text-[8px] flex items-center justify-end pr-1 text-white/70">{humidLabels[ri]}</div>
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    className="aspect-square flex items-center justify-center rounded-sm text-[8px] font-bold"
                    style={{
                      background: cell ? biasToBg(cell.bias ?? 0) : 'var(--md-sys-color-surface-container)',
                      color: 'rgba(255,255,255,0.9)',
                    }}
                    title={cell ? `${cell.temp}°F, ${cell.humidity}: bias = ${cell.bias}, n = ${cell.n}` : 'No data'}
                  >
                    {cell?.bias != null ? cell.bias.toFixed(1) : '—'}
                  </div>
                ))}
              </div>
            ))}
            <p className="text-[10px] text-white/70 mt-2">{t('q1.tempHumidityDesc')}</p>
          </div>
        </div>

        <div className="mt-4 bg-surface-container-highest/30 p-6 rounded-xl border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-xl mt-0.5">thermostat</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">Hot-day risk: bias triples in Chinatown's heat island</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                At 85–95°F with moderate humidity, PA bias reaches <strong>+4.6 µg/m³</strong> — three times the study average.
                Chinatown is a documented urban heat island with fewer trees and more heat-absorbing surfaces.
                This means the hottest, most health-critical days are also when PA sensors are <em>least accurate</em>.
                Weather-conditioned corrections are strongly recommended for any extreme-heat air-quality alert system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §7  Calibration + Assets
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Calibration & Sensor Health"
          title="Correcting the Bias — Local Transfer Function"
          subtitle="A simple local regression eliminates the systematic overread and brings PA accuracy within 0.21 µg/m³ of the FEM reference floor."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: formula + reference-to-reference */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-10 border border-stone-100 relative overflow-hidden">
              <div className="relative z-10 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-4">
                  Derived Transfer Function
                </p>
                <p className="text-2xl font-bold text-primary">
                  DEP<sub>est</sub> = 0.7376 × PA + 0.9596
                </p>
                <p className="mt-3 text-xs text-stone-400 italic">
                  PA values already include PurpleAir ALT-CF3 correction.
                  Do <strong>not</strong> apply the Barkjohn equation on top — that would double-correct.
                </p>
                <div className="mt-6 pt-6 border-t border-stone-100 grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-stone-400 mb-1">Mean Bias</p>
                    <p className="font-bold">+1.53 → <span className="text-tertiary">0.00 µg/m³</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-stone-400 mb-1">RMSE</p>
                    <p className="font-bold">2.53 → <span className="text-tertiary">1.44 µg/m³</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-8">
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-lg text-primary mb-2">Reference-to-Reference Accuracy Floor</h4>
              <p className="text-xs text-stone-500 mb-4">
                Two FEM monitors at different locations will <em>always</em> disagree slightly — representing
                true spatial variation in PM2.5. This 1.23 µg/m³ RMSE sets the theoretical minimum
                achievable error for any sensor at this geographical scale.
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Chinatown FEM',       value: '7.96 µg/m³', hl: false },
                  { label: 'Nubian Square FEM',    value: '8.07 µg/m³', hl: false },
                  { label: 'Agreement (r)',         value: '0.96',       hl: true },
                  { label: 'RMSE (accuracy floor)', value: '1.23 µg/m³', hl: true },
                ].map(row => (
                  <div key={row.label}
                    className={`flex justify-between items-center px-4 py-2.5 border-b border-stone-100 ${row.hl ? 'bg-white' : 'bg-white/50'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{row.label}</span>
                    <span className="font-bold text-sm text-primary">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Callout icon="verified" title="Calibrated PA approaches FEM accuracy floor" variant="success">
                  After calibration, PA achieves <strong>1.44 µg/m³ RMSE</strong> — only 0.21 µg/m³ above the
                  FEM-vs-FEM floor. Well-calibrated low-cost sensors can approach reference-grade accuracy.
                </Callout>
              </div>
            </div>
          </div>

          {/* Right: asset registry + rolling stability */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-xl text-primary">{t('q1.assetRegistry')}</h4>
                <span className="text-xs uppercase tracking-widest text-tertiary font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  {assets.length}/{assets.length} Online
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {assets.map(card => (
                  <div key={card.id} className="bg-white p-4 border border-stone-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[9px] font-bold text-stone-300">{card.id}</div>
                      <span className="material-symbols-outlined text-tertiary text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div className="font-bold text-stone-800 text-xs mb-1 truncate">{card.name}</div>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className={`text-base font-bold ${r2Color(card.r_squared)}`}>{card.r_squared.toFixed(3)}</span>
                      <span className="text-[9px] text-stone-300 uppercase">R²</span>
                    </div>
                    <div className="text-[10px] text-stone-400 mb-2">
                      Bias: <span className={biasColor(card.bias)}>{card.bias >= 0 ? '+' : ''}{card.bias.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${healthColor(card.health)} rounded-full`} style={{ width: `${card.health}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low p-8 border-l-4 border-primary">
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-xl text-primary mb-2">Temporal Stability (36-Day Rolling)</h4>
              <p className="text-xs text-stone-500 mb-4">
                Rolling 7-day Pearson r and RMSE throughout the study. Flat lines = no sensor drift.
                All 12 sensors maintained consistent agreement with the FEM reference.
              </p>
              <ResponsiveContainer width="100%" height={130}>
                <ComposedChart data={rolling} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: C.onSurfaceVariant }}
                    tickFormatter={(d: string) => d.slice(5)} interval={4} />
                  <YAxis yAxisId="r"    domain={[0.8, 1]} tick={{ fontSize: 8, fill: C.tertiary }} />
                  <YAxis yAxisId="rmse" orientation="right" domain={[1, 4]} tick={{ fontSize: 8, fill: C.primary }} />
                  <Tooltip contentStyle={{ background: C.surface, fontSize: 10 }} />
                  <ReferenceLine yAxisId="r" y={0.9} stroke={C.outlineVariant} strokeDasharray="4 4" />
                  <Line yAxisId="r"    dataKey="r"    stroke={C.tertiary} strokeWidth={2}   dot={false} name="Pearson r" />
                  <Line yAxisId="rmse" dataKey="rmse" stroke={C.primary}  strokeWidth={1.5} dot={false} name="RMSE" strokeDasharray="4 2" />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'Min rolling r',    value: rolling.length ? Math.min(...rolling.map(r => r.r)).toFixed(3) : '—', color: 'text-secondary' },
                  { label: 'Max rolling r',    value: rolling.length ? Math.max(...rolling.map(r => r.r)).toFixed(3) : '—', color: 'text-tertiary' },
                  { label: 'Drift detected',   value: 'None',     color: 'text-tertiary' },
                  { label: 'Study duration',   value: '36 days',  color: 'text-stone-800' },
                ].map(k => (
                  <div key={k.label} className="bg-white p-3 border border-stone-100">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{k.label}</div>
                    <div className={`font-bold ${k.color}`}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          §8  Synthesis
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader label="Synthesis" title="Key Findings & Community Implications" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {([
            {
              icon: 'signal_cellular_alt', v: 'success' as const,
              title: 'Strong correlation: r = 0.939',
              body: 'PA tracks the reference almost perfectly. When pollution spikes, both sensors detect it — confirming PA is sensitive enough for community screening and trend detection.',
            },
            {
              icon: 'arrow_upward', v: 'warn' as const,
              title: 'Systematic +1.53 µg/m³ overread',
              body: 'PA consistently reads above the reference. This is a predictable bias — not random noise — that can be fully removed with the local calibration formula derived in this study.',
            },
            {
              icon: 'directions_car', v: 'warn' as const,
              title: 'Rush hours amplify bias (+0.15 µg/m³)',
              body: 'Traffic amplifies PA\'s overread. Sites near I-93 show the largest rush-hour effect. Time-varying corrections should be incorporated into any operational health alert system.',
            },
            {
              icon: 'weekend', v: 'success' as const,
              title: 'Weekends show better agreement',
              body: 'Weekend bias is consistently lower than weekday bias, confirming reduced traffic improves PA accuracy. This supports differential calibration by traffic period.',
            },
            {
              icon: 'thermostat', v: 'warn' as const,
              title: 'Hot days: bias triples to +4.6 µg/m³',
              body: 'At 85–95°F the bias reaches +4.6 µg/m³. Since Chinatown is a heat island, the worst air-quality days are also the least accurate — a compounded health risk for vulnerable residents.',
            },
            {
              icon: 'verified', v: 'success' as const,
              title: 'After calibration: near FEM accuracy',
              body: 'Post-calibration RMSE drops from 2.53 to 1.44 µg/m³ — only 0.21 µg/m³ above the FEM-vs-FEM spatial accuracy floor. Well-calibrated PA sensors can approach reference-grade accuracy.',
            },
          ] as const).map(item => (
            <Callout key={item.title} icon={item.icon} title={item.title} variant={item.v}>
              {item.body}
            </Callout>
          ))}
        </div>

        <footer className="bg-primary p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined text-[144px]">format_quote</span>
          </div>
          <div className="relative z-10 max-w-3xl">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 opacity-60">Executive Summary</h3>
            <blockquote className="text-2xl font-bold italic leading-snug">
              "PurpleAir sensors in Chinatown track official monitors with 94% correlation,
              but read 1–2 µg/m³ consistently high — and this bias worsens during rush hours
              and hot afternoons when health decisions matter most. A study-specific local
              calibration eliminates the bias entirely, bringing PA accuracy within 0.21 µg/m³
              of the FEM reference floor."
            </blockquote>
            <div className="mt-8 flex items-center gap-6">
              <div className="w-12 h-px bg-white/30" />
              <div className="text-xs font-bold uppercase tracking-widest opacity-60">
                Tufts Environmental Research Collaboration · HEROS 2023
              </div>
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
      </section>
      {showReport && (
        <ReportViewer
          reportPath="/reports/Q1.md"
          title="Q1 — PM2.5 Sensor Calibration & Validation"
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
