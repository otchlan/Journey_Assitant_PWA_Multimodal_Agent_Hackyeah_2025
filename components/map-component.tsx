"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import styles from "./map-component.module.css"
import { MapPin, ArrowLeft } from "lucide-react"
import IncidentChatBubble from "./incident-chat-bubble"
import RouteChatPanel from "./route-chat-panel"
import UserProfile from "./user-profile"
import IncidentsList from "./incidents-list"
import TrafficAnalysisMap from "./traffic-analysis-map"

interface Marker {
  id: number
  lat: number
  lng: number
}

interface IncidentChat {
  x: number
  y: number
  lat: number
  lng: number
}

interface RoutePlannerParams {
  from: string
  to: string
  date: string
  time: string
}

export default function MapComponent() {
  const [markers, setMarkers] = useState<Marker[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [incidentChat, setIncidentChat] = useState<IncidentChat | null>(null)
  const [showRouteChat, setShowRouteChat] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showIncidentsList, setShowIncidentsList] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [showTrafficMap, setShowTrafficMap] = useState(false)
  const [trafficMapCoords, setTrafficMapCoords] = useState({ lat: 52.2297, lng: 21.0122 })
  const [showRoutePlanner, setShowRoutePlanner] = useState(false)
  const [routePlannerParams, setRoutePlannerParams] = useState<RoutePlannerParams>({
    from: '',
    to: '',
    date: '',
    time: ''
  })

  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef<number>(0)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const isPanningRef = useRef<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.async = true
    
    script.onload = () => {
      if (mapContainerRef.current && !mapRef.current) {
        // @ts-ignore
        const L = window.L
        
        const map = L.map(mapContainerRef.current, {
          center: [52.0, 19.0],
          zoom: 6,
          minZoom: 6,
          maxZoom: 18,
          dragging: false,
          touchZoom: true,
          scrollWheelZoom: true,
          doubleClickZoom: false,
          tap: false,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        const polandBounds = L.latLngBounds(
          L.latLng(49.0, 14.0),
          L.latLng(54.9, 24.15)
        )
        map.setMaxBounds(polandBounds)

        mapRef.current = map
      }
    }
    
    document.head.appendChild(script)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }

    isPanningRef.current = false

    longPressTimerRef.current = window.setTimeout(() => {
      isPanningRef.current = true
      if (mapRef.current) {
        // @ts-ignore
        const L = window.L
        mapRef.current.dragging.enable()
        const event = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true
        })
        mapContainerRef.current?.dispatchEvent(event)
      }
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanningRef.current) {
      const touch = e.touches[0]
      const event = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true
      })
      mapContainerRef.current?.dispatchEvent(event)
      return
    }

    if (longPressTimerRef.current && touchStartRef.current) {
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
      
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (isPanningRef.current) {
      if (mapRef.current) {
        mapRef.current.dragging.disable()
        const touch = e.changedTouches[0]
        const event = new MouseEvent('mouseup', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true
        })
        mapContainerRef.current?.dispatchEvent(event)
      }
      isPanningRef.current = false
      touchStartRef.current = null
      return
    }

    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    const now = Date.now()
    const timeSinceLastTap = now - lastTapRef.current

    if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        if (mapRef.current && mapContainerRef.current) {
          // @ts-ignore
          const L = window.L
          const rect = mapContainerRef.current.getBoundingClientRect()
          const x = touch.clientX - rect.left
          const y = touch.clientY - rect.top
          const point = mapRef.current.containerPointToLatLng([x, y])
          
          setIncidentChat({
            x: 0,
            y: 0,
            lat: Number(point.lat.toFixed(4)),
            lng: Number(point.lng.toFixed(4)),
          })
        }
        lastTapRef.current = 0
        touchStartRef.current = null
        return
      } else {
        lastTapRef.current = now
        touchStartRef.current = null
        return
      }
    }

    if (deltaTime < 300) {
      if (deltaX < -50 && Math.abs(deltaY) < 50) {
        setShowRouteChat(true)
      } else if (deltaY > 50 && Math.abs(deltaX) < 50) {
        setShowProfile(true)
      } else if (deltaY < -50 && Math.abs(deltaX) < 50) {
        setShowIncidentsList(true)
      }
    }

    touchStartRef.current = null
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolokalizacja nie jest wspierana przez Twoją przeglądarkę')
      return
    }

    if (isLoadingLocation) {
      return
    }

    setIsLoadingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setUserLocation({ lat, lng })
        
        if (mapRef.current) {
          // @ts-ignore
          const L = window.L
          mapRef.current.setView([lat, lng], 13)
          
          L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: `<div class="${styles.pulse}"></div><div class="${styles.userDot}"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })
          }).addTo(mapRef.current).bindPopup('Twoja lokalizacja')
        }
        
        setIsLoadingLocation(false)
        console.log('Lokalizacja pobrana:', { lat, lng, accuracy: position.coords.accuracy })
      },
      (error) => {
        setIsLoadingLocation(false)
        console.error('Błąd pobierania lokalizacji:', error)
        
        let errorMessage = 'Nie udało się pobrać lokalizacji. '
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Brak uprawnień do lokalizacji. Musisz ręcznie włączyć lokalizację w ustawieniach przeglądarki/telefonu, a następnie ponownie nacisnąć przycisk "Pobierz moją lokalizację".'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Lokalizacja niedostępna. Sprawdź czy GPS jest włączony, włącz go ręcznie w ustawieniach telefonu, a następnie ponownie nacisnąć przycisk "Pobierz moją lokalizację".'
            break
          case error.TIMEOUT:
            errorMessage += 'Przekroczono limit czasu. Sprawdź czy lokalizacja jest włączona, a następnie ponownie nacisnąć przycisk "Pobierz moją lokalizację".'
            break
          default:
            errorMessage += 'Nieznany błąd. Sprawdź ustawienia lokalizacji i ponownie nacisnąć przycisk "Pobierz moją lokalizację".'
        }
        
        alert(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleShowTrafficMap = (lat: number, lng: number) => {
    setTrafficMapCoords({ lat, lng })
    setShowTrafficMap(true)
    setIncidentChat(null)
  }

  const handleShowRoutePlanner = (params: RoutePlannerParams) => {
    console.log('Route planner params:', params)
    setRoutePlannerParams(params)
    setShowRoutePlanner(true)
    setIncidentChat(null)
  }

  const handleBackToMainMap = () => {
    setShowTrafficMap(false)
    setShowRoutePlanner(false)
  }

  return (
    <div className={styles.mapWrapper}>
      <div
        ref={mapContainerRef}
        className={styles.map}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          display: (showTrafficMap || showRoutePlanner) ? 'none' : 'block'
        }}
      />

      {showTrafficMap && (
        <>
          <button
            onClick={handleBackToMainMap}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              zIndex: 1002,
              border: 'none',
              background: 'white',
              cursor: 'pointer',
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            <ArrowLeft size={20} />
            Powrót
          </button>
          <iframe
            src={`/analiza_ruchu.html?lat=${trafficMapCoords.lat}&lon=${trafficMapCoords.lng}&radius=5.00`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            title="Analiza ruchu"
          />
        </>
      )}

      {showRoutePlanner && (
        <>
          <button
            onClick={handleBackToMainMap}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              zIndex: 1002,
              border: 'none',
              background: 'white',
              cursor: 'pointer',
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            <ArrowLeft size={20} />
            Powrót
          </button>
          <iframe
            src={`/planowanie_trasy.html?from=${encodeURIComponent(routePlannerParams.from)}&to=${encodeURIComponent(routePlannerParams.to)}&date=${routePlannerParams.date}&time=${routePlannerParams.time}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            title="Planer trasy"
          />
        </>
      )}

      <button 
        className={styles.mockLocationBtn} 
        onClick={handleGetLocation} 
        disabled={isLoadingLocation}
        style={{ 
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          opacity: isLoadingLocation ? 0.6 : 1,
          cursor: isLoadingLocation ? 'wait' : 'pointer',
          display: (showTrafficMap || showRoutePlanner) ? 'none' : 'block'
        }}
      >
        {isLoadingLocation ? 'Pobieranie...' : 'Pobierz moją lokalizację'}
      </button>

      {incidentChat && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
        }}>
          <IncidentChatBubble
            x={0}
            y={0}
            lat={incidentChat.lat}
            lng={incidentChat.lng}
            onClose={() => setIncidentChat(null)}
            onShowTrafficMap={handleShowTrafficMap}
            onShowRoutePlanner={handleShowRoutePlanner}
          />
        </div>
      )}

      <RouteChatPanel isOpen={showRouteChat} onClose={() => setShowRouteChat(false)} />

      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />

      <IncidentsList isOpen={showIncidentsList} onClose={() => setShowIncidentsList(false)} />
    </div>
  )
}