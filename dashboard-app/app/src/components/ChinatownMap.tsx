import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { SitePoint } from '../hooks/useClusteringData'

interface ChinatownMapProps {
  sites: SitePoint[]
}

/* Chinatown center & zoom */
const CENTER: [number, number] = [42.3495, -71.0620]
const ZOOM = 16

/* Warm-toned tile layer that matches our Material Design 3 palette */
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'

function createMarkerIcon(color: string, isHovered: boolean) {
  const size = isHovered ? 18 : 12
  const border = isHovered ? 3 : 2
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px; height:${size}px;
      background:${color};
      border:${border}px solid white;
      border-radius:50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      transition: all 0.15s ease;
    "></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  })
}

export default function ChinatownMap({ sites }: ChinatownMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [hoveredSite, setHoveredSite] = useState<string | null>(null)

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

    /* Apply warm hue-rotate filter to match app theme */
    const tilePane = map.getPane('tilePane')
    if (tilePane) {
      tilePane.style.filter = 'saturate(0.7) sepia(0.15) hue-rotate(-5deg)'
    }

    mapInstance.current = map

    return () => { map.remove(); mapInstance.current = null }
  }, [])

  /* Add/update markers when sites change */
  useEffect(() => {
    const map = mapInstance.current
    if (!map || sites.length === 0) return

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    sites.forEach(site => {
      const marker = L.marker([site.lat, site.lon], {
        icon: createMarkerIcon(site.cluster_color, false),
      })

      const popupContent = `
        <div style="font-family: 'Manrope', sans-serif; width: 240px;">
          <img src="${site.photo}" alt="${site.site_name}"
            style="width:100%; height:130px; object-fit:cover; border-radius:8px 8px 0 0; display:block;" 
            onerror="this.style.display='none'" />
          <div style="padding: 10px;">
            <div style="font-family: 'Newsreader', serif; font-weight: 700; font-size: 15px; color: #6f070f;">
              ${site.site_name}
            </div>
            <div style="margin-top: 4px;">
              <span style="
                display: inline-flex; align-items: center; gap: 4px;
                font-size: 10px; font-weight: 700; padding: 2px 8px;
                border-radius: 99px; background: ${site.cluster_color}18; color: ${site.cluster_color};
              ">
                ${site.cluster_emoji} ${site.cluster_name}
              </span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; font-size: 11px;">
              <div>
                <span style="color: #87512d; font-size: 9px; font-weight: 700; text-transform: uppercase;">PM2.5</span><br/>
                <strong>${site.pm25}</strong> <span style="color: #999; font-size: 9px;">µg/m³</span>
              </div>
              <div>
                <span style="color: #87512d; font-size: 9px; font-weight: 700; text-transform: uppercase;">Temp</span><br/>
                <strong>${site.temp}</strong> <span style="color: #999; font-size: 9px;">°F</span>
              </div>
              <div>
                <span style="color: #87512d; font-size: 9px; font-weight: 700; text-transform: uppercase;">WBGT</span><br/>
                <strong>${site.wbgt}</strong> <span style="color: #999; font-size: 9px;">°F</span>
              </div>
              <div>
                <span style="color: #87512d; font-size: 9px; font-weight: 700; text-transform: uppercase;">Humidity</span><br/>
                <strong>${site.humidity}</strong> <span style="color: #999; font-size: 9px;">%</span>
              </div>
            </div>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 260,
        className: 'chinatown-popup',
        closeButton: true,
        offset: [0, -5],
      })

      /* Hover: enlarge marker */
      marker.on('mouseover', () => {
        marker.setIcon(createMarkerIcon(site.cluster_color, true))
        setHoveredSite(site.site_id)
      })
      marker.on('mouseout', () => {
        marker.setIcon(createMarkerIcon(site.cluster_color, false))
        setHoveredSite(null)
      })

      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }, [sites])

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-outline-variant/20"
        style={{ height: 420 }}
      />
      {/* Cluster legend overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md border border-outline-variant/20">
        <p className="text-[9px] font-bold text-secondary/60 uppercase tracking-widest mb-2">Clusters</p>
        <div className="space-y-1.5">
          {Array.from(new Set(sites.map(s => s.cluster))).sort().map(cId => {
            const rep = sites.find(s => s.cluster === cId)!
            return (
              <div key={cId} className="flex items-center gap-2 text-[11px]">
                <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: rep.cluster_color }} />
                <span className="font-bold" style={{ color: rep.cluster_color }}>{rep.cluster_emoji} {rep.cluster_name}</span>
              </div>
            )
          })}
        </div>
      </div>
      {/* Hovered site name overlay */}
      {hoveredSite && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
          <span className="text-xs font-[family-name:var(--font-family-headline)] font-bold text-primary">
            {sites.find(s => s.site_id === hoveredSite)?.site_name}
          </span>
        </div>
      )}
    </div>
  )
}
