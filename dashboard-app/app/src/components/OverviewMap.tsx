import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface SiteBasic {
  site_id: string
  site_name: string
  lat: number
  lon: number
  pm25: number
  temp: number
  photo: string
}

const CENTER: [number, number] = [42.3495, -71.0620]
const ZOOM = 16

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'

const PRIMARY = '#6f070f'

function createPulsatingIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;
          width:28px; height:28px;
          background:${PRIMARY}30;
          border-radius:50%;
          animation: overview-ping 1.8s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
        <div style="
          position:relative;
          width:12px; height:12px;
          background:${PRIMARY};
          border:2px solid white;
          border-radius:50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function OverviewMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const [sites, setSites] = useState<SiteBasic[]>([])

  /* Load site data from clustering_sites.json (has lat/lon for all 12 sites) */
  useEffect(() => {
    fetch('/data/clustering_sites.json')
      .then(r => r.json())
      .then((data: SiteBasic[]) => setSites(data))
      .catch(() => {})
  }, [])

  /* Initialize map */
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

    const tilePane = map.getPane('tilePane')
    if (tilePane) {
      tilePane.style.filter = 'saturate(0.7) sepia(0.15) hue-rotate(-5deg)'
    }

    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  /* Add markers when sites load */
  useEffect(() => {
    const map = mapInstance.current
    if (!map || sites.length === 0) return

    sites.forEach(site => {
      const marker = L.marker([site.lat, site.lon], {
        icon: createPulsatingIcon(),
      })

      marker.bindPopup(`
        <div style="font-family:'Manrope',sans-serif; width:220px;">
          <img src="${site.photo}" alt="${site.site_name}"
            style="width:100%;height:110px;object-fit:cover;border-radius:8px 8px 0 0;display:block;"
            onerror="this.style.display='none'" />
          <div style="padding:10px;">
            <div style="font-family:'Newsreader',serif;font-weight:700;font-size:15px;color:${PRIMARY};">
              ${site.site_name}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;font-size:11px;">
              <div>
                <span style="color:#87512d;font-size:9px;font-weight:700;text-transform:uppercase;">PM2.5</span><br/>
                <strong>${site.pm25}</strong> <span style="color:#999;font-size:9px;">µg/m³</span>
              </div>
              <div>
                <span style="color:#87512d;font-size:9px;font-weight:700;text-transform:uppercase;">Temp</span><br/>
                <strong>${site.temp}</strong> <span style="color:#999;font-size:9px;">°F</span>
              </div>
            </div>
          </div>
        </div>
      `, {
        maxWidth: 240,
        className: 'chinatown-popup',
        closeButton: true,
        offset: [0, -5],
      })

      marker.addTo(map)
    })
  }, [sites])

  return (
    <>
      <style>{`
        @keyframes overview-ping {
          0% { transform: scale(1); opacity: 0.7; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      <div
        ref={mapRef}
        className="w-full rounded-3xl overflow-hidden border-4 border-surface-container-low shadow-xl"
        style={{ height: 600 }}
      />
    </>
  )
}
