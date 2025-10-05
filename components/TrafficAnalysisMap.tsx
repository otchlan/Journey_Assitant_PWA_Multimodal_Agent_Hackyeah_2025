//components/TrafficAnalysisMap.tsx
"use client"
import { useEffect, useRef, useState } from 'react'

interface TrafficAnalysisMapProps {
  lat: number
  lng: number
  radius: number
  apiKey: string
}

interface TrafficStats {
  avgSpeed: number
  avgFreeFlow: number
  delay: number
  incidents: number
}

export default function TrafficAnalysisMap({ lat, lng, radius, apiKey }: TrafficAnalysisMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TrafficStats | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Dynamically load Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(link)

    // Dynamically load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.async = true

    script.onload = async () => {
      if (!mapContainerRef.current) return
      
      // @ts-ignore
      const L = window.L

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true,
      })

      // Base map layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map

      // Add circle to show search radius
      const circle = L.circle([lat, lng], {
        color: '#667eea',
        fillColor: '#667eea',
        fillOpacity: 0.1,
        radius: radius * 1000,
      }).addTo(map)

      // Add center marker
      L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>Centrum wyszukiwania</b><br>Lat: ${lat}<br>Lon: ${lng}<br>Promień: ${radius} km`)
        .openPopup()

      // Fit map to circle bounds
      map.fitBounds(circle.getBounds(), { padding: [50, 50] })

      // Add TomTom traffic layer
      try {
        const trafficLayer = L.tileLayer(
          `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${apiKey}`,
          {
            attribution: '© TomTom Traffic',
            opacity: 0.8,
            maxZoom: 18,
          }
        ).addTo(map)

        // Fetch traffic flow data
        await fetchTrafficFlowData(lat, lng, radius, apiKey, map, L)

        // Fetch incidents
        await fetchIncidents(lat, lng, radius, apiKey, map, L)

        setIsLoading(false)
      } catch (err: any) {
        console.error('Error loading traffic data:', err)
        setError(err.message || 'Błąd ładowania danych o ruchu')
        setIsLoading(false)
      }
    }

    script.onerror = () => {
      setError('Nie udało się załadować biblioteki mapy')
      setIsLoading(false)
    }

    document.head.appendChild(script)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [lat, lng, radius, apiKey])

  const fetchTrafficFlowData = async (
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    key: string,
    map: any,
    L: any
  ) => {
    const numPoints = Math.max(7, Math.min(15, Math.round(radiusKm * 2)))
    const points: [number, number][] = [[centerLat, centerLon]]

    const latDelta = (radiusKm / 111) * 0.4
    const lonDelta = (radiusKm / (111 * Math.cos(centerLat * Math.PI / 180))) * 0.4

    for (let i = 0; i < numPoints - 1; i++) {
      const angle = (2 * Math.PI * i) / (numPoints - 1)
      const lat = centerLat + latDelta * Math.sin(angle)
      const lon = centerLon + lonDelta * Math.cos(angle)
      points.push([lat, lon])
    }

    let totalSpeed = 0
    let totalFreeFlow = 0
    let count = 0

    for (const [lat, lon] of points) {
      try {
        const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${key}&point=${lat},${lon}`
        const response = await fetch(url)

        if (!response.ok) continue

        const data = await response.json()

        if (data.flowSegmentData) {
          const speed = data.flowSegmentData.currentSpeed || 0
          const freeFlow = data.flowSegmentData.freeFlowSpeed || 0

          totalSpeed += speed
          totalFreeFlow += freeFlow
          count++

          let color = '#00ff00'
          if (speed < freeFlow * 0.5) color = '#8b0000'
          else if (speed < freeFlow * 0.75) color = '#ff0000'
          else if (speed < freeFlow * 0.9) color = '#ffa500'
          else if (speed < freeFlow * 0.95) color = '#ffff00'

          L.circleMarker([lat, lon], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(map)
            .bindPopup(`
              <b>📊 Pomiar prędkości</b><br>
              Aktualna: <b>${speed} km/h</b><br>
              Normalna: ${freeFlow} km/h<br>
              Spowolnienie: ${Math.round((1 - speed / freeFlow) * 100)}%
            `)
        }
      } catch (e) {
        console.warn('Error fetching flow data for point', lat, lon)
      }
    }

    if (count > 0) {
      const avgSpeed = Math.round(totalSpeed / count)
      const avgFreeFlow = Math.round(totalFreeFlow / count)
      const delay = Math.round((1 - avgSpeed / avgFreeFlow) * 100)

      setStats({ avgSpeed, avgFreeFlow, delay, incidents: 0 })
    }
  }

  const fetchIncidents = async (
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    key: string,
    map: any,
    L: any
  ) => {
    const latDelta = radiusKm / 111
    const lonDelta = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180))

    const bbox = `${centerLon - lonDelta},${centerLat - latDelta},${centerLon + lonDelta},${centerLat + latDelta}`

    try {
      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bbox}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},delay}}}`
      const response = await fetch(url)

      if (!response.ok) return

      const data = await response.json()

      if (data.incidents && data.incidents.length > 0) {
        setStats(prev => prev ? { ...prev, incidents: data.incidents.length } : null)

        data.incidents.forEach((incident: any) => {
          if (incident.geometry && incident.geometry.coordinates) {
            const coords = incident.geometry.coordinates[0]
            const description = incident.properties?.events?.[0]?.description || 'Incydent drogowy'
            const delay = incident.properties?.magnitudeOfDelay || 'nieznane'

            L.marker([coords[1], coords[0]]).addTo(map)
              .bindPopup(`<b>${description}</b><br>Opóźnienie: ${delay}`)
          }
        })
      }
    } catch (e) {
      console.warn('Error fetching incidents:', e)
    }
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        zIndex: 1000,
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '1.5em', marginBottom: '5px', fontWeight: '600' }}>
          🚗 Analiza Ruchu Drogowego
        </h1>
        <p style={{ fontSize: '0.9em', opacity: 0.9 }}>
          Lokalizacja: {lat.toFixed(4)}, {lng.toFixed(4)} | Promień: {radius} km
        </p>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          paddingTop: '80px',
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px 40px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 1001,
          textAlign: 'center',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #667eea',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 10px',
          }} />
          <p style={{ color: '#667eea', fontWeight: '600' }}>Ładowanie danych o ruchu...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '100px',
          left: '20px',
          right: '20px',
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '10px',
          border: '2px solid #f5c6cb',
          zIndex: 1001,
        }}>
          {error}
        </div>
      )}

      {/* Stats Panel */}
      {stats && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          background: 'white',
          borderRadius: '12px',
          padding: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 1001,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '5px' }}>{stats.avgSpeed} km/h</h3>
            <p style={{ fontSize: '0.8em', opacity: 0.9 }}>Średnia prędkość</p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '5px' }}>{stats.avgFreeFlow} km/h</h3>
            <p style={{ fontSize: '0.8em', opacity: 0.9 }}>Prędkość normalna</p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '1.5em', marginBottom: '5px' }}>{stats.delay}%</h3>
            <p style={{ fontSize: '0.8em', opacity: 0.9 }}>Spowolnienie</p>
          </div>
          {stats.incidents > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
            }}>
              <h3 style={{ fontSize: '1.5em', marginBottom: '5px' }}>{stats.incidents}</h3>
              <p style={{ fontSize: '0.8em', opacity: 0.9 }}>Incydenty</p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '100px',
        right: '20px',
        background: 'white',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1001,
        maxWidth: '250px',
      }}>
        <h4 style={{ marginBottom: '10px', fontSize: '0.9em', fontWeight: '600' }}>🚦 Legenda</h4>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '0.8em' }}>
          <div style={{ width: '30px', height: '15px', background: '#00ff00', marginRight: '8px', borderRadius: '3px' }} />
          <span>Płynny ruch</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '0.8em' }}>
          <div style={{ width: '30px', height: '15px', background: '#ffff00', marginRight: '8px', borderRadius: '3px' }} />
          <span>Lekkie spowolnienie</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '0.8em' }}>
          <div style={{ width: '30px', height: '15px', background: '#ffa500', marginRight: '8px', borderRadius: '3px' }} />
          <span>Spowolnienie</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '0.8em' }}>
          <div style={{ width: '30px', height: '15px', background: '#ff0000', marginRight: '8px', borderRadius: '3px' }} />
          <span>Duże opóźnienie</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8em' }}>
          <div style={{ width: '30px', height: '15px', background: '#8b0000', marginRight: '8px', borderRadius: '3px' }} />
          <span>Korek</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
