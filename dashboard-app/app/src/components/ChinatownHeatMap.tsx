import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface SiteFull {
  site_id: string
  site_name: string
  lat: number
  lon: number
  pm25: number
  temp: number
  wbgt: number
  humidity: number
  cluster_name: string
  photo: string
}

const CENTER: [number, number] = [42.3501, -71.0618]
const ZOOM = 15

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
  '&copy; <a href="https://carto.com/">CARTO</a> | ' +
  'Data: HEROS Study 2023, Tufts University &times; ACDC'

/** Interpolate through a heat-color ramp given a 0–1 value */
function heatColor(t: number): string {
  const stops: [number, [number, number, number]][] = [
    [0.00, [41, 182, 246]],   // cool blue
    [0.30, [102, 187, 106]],  // green
    [0.55, [255, 202, 40]],   // yellow
    [0.75, [255, 112, 67]],   // orange
    [1.00, [198, 40, 40]],    // hot red
  ]

  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i]
    const [t1, c1] = stops[i + 1]
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0)
      const r = Math.round(c0[0] + f * (c1[0] - c0[0]))
      const g = Math.round(c0[1] + f * (c1[1] - c0[1]))
      const b = Math.round(c0[2] + f * (c1[2] - c0[2]))
      return `rgb(${r},${g},${b})`
    }
  }
  return 'rgb(198,40,40)'
}

export default function ChinatownHeatMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const [sites, setSites] = useState<SiteFull[]>([])

  /* Fetch site data */
  useEffect(() => {
    fetch('/data/clustering_sites.json')
      .then(r => r.json())
      .then((data: SiteFull[]) => setSites(data))
      .catch(() => {})
  }, [])

  /* Initialize map once */
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: CENTER,
      zoom: ZOOM,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    })

    L.control.zoom({ position: 'topright' }).addTo(map)
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map)
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map)

    mapInstance.current = map
    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  /* Add heat circles when sites load */
  useEffect(() => {
    const map = mapInstance.current
    if (!map || sites.length === 0) return

    const wbgts = sites.map(s => s.wbgt)
    const minW = Math.min(...wbgts)
    const maxW = Math.max(...wbgts)

    sites.forEach(site => {
      const t = maxW === minW ? 0.5 : (site.wbgt - minW) / (maxW - minW)
      const color = heatColor(t)

      /* Outer glow circle */
      L.circle([site.lat, site.lon], {
        radius: 140,
        color: 'transparent',
        fillColor: color,
        fillOpacity: 0.18,
        interactive: false,
      }).addTo(map)

      /* Inner fill circle */
      L.circle([site.lat, site.lon], {
        radius: 75,
        color: 'transparent',
        fillColor: color,
        fillOpacity: 0.45,
        interactive: false,
      }).addTo(map)

      /* Center marker with popup */
      const marker = L.circleMarker([site.lat, site.lon], {
        radius: 7,
        color: 'white',
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
      })

      marker.bindPopup(
        `<div style="font-family:'Manrope',sans-serif;width:210px;">
          <div style="padding:10px 12px 12px;">
            <div style="font-weight:700;font-size:14px;color:#1a1a1a;margin-bottom:8px;">${site.site_name}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;">
              <div>
                <span style="color:#888;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">WBGT</span><br/>
                <strong style="color:#c62828;">${site.wbgt.toFixed(1)}°F</strong>
              </div>
              <div>
                <span style="color:#888;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">PM2.5</span><br/>
                <strong style="color:#5d4037;">${site.pm25.toFixed(1)} µg/m³</strong>
              </div>
            </div>
            <div style="font-size:9px;color:#aaa;margin-top:8px;text-transform:uppercase;letter-spacing:.07em;">${site.cluster_name}</div>
          </div>
        </div>`,
        { maxWidth: 230, closeButton: true, offset: [0, -6] },
      )

      marker.addTo(map)
    })
  }, [sites])

  return <div ref={mapRef} className="w-full h-full" />
}
