//components/incidents-list.tsx
"use client"

import { useState, useEffect } from "react"
import styles from "./incidents-list.module.css"
import { X, AlertTriangle, MapPin, Clock, ChevronRight } from "lucide-react"

interface IncidentsListProps {
  isOpen: boolean
  onClose: () => void
  newIncidents?: Incident[]  // Nowa prop
}

export interface Incident {
  id: number
  type: string
  location: string
  lat: number
  lng: number
  description: string
  timestamp: Date
  status: "active" | "resolved" | "pending"
  severity?: string
}

const initialMockIncidents: Incident[] = [
  {
    id: 1,
    type: "Wypadek",
    location: "ul. Marszałkowska 123",
    lat: 52.2297,
    lng: 21.0122,
    description: "Kolizja dwóch pojazdów, utrudnienia w ruchu",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    status: "active",
  },
  {
    id: 2,
    type: "Zagrożenie",
    location: "Park Łazienkowski",
    lat: 52.2156,
    lng: 21.0352,
    description: "Podejrzany pakunek, obszar zabezpieczony",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    status: "pending",
  },
  {
    id: 3,
    type: "Utrudnienie",
    location: "Most Poniatowskiego",
    lat: 52.2401,
    lng: 21.0445,
    description: "Remont drogi, objazd przez ul. Wał Miedzeszyński",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    status: "active",
  },
  {
    id: 4,
    type: "Rozwiązane",
    location: "Plac Zamkowy",
    lat: 52.248,
    lng: 21.0133,
    description: "Manifestacja zakończona, ruch przywrócony",
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    status: "resolved",
  },
]

export default function IncidentsList({ isOpen, onClose, newIncidents = [] }: IncidentsListProps) {
  const [incidents, setIncidents] = useState<Incident[]>(initialMockIncidents)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  // Aktualizuj listę gdy przyjdą nowe incydenty
  useEffect(() => {
    if (newIncidents.length > 0) {
      setIncidents(prev => [...newIncidents, ...prev])
    }
  }, [newIncidents])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#ef4444"
      case "pending":
        return "#f59e0b"
      case "resolved":
        return "#10b981"
      default:
        return "#6b7280"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktywny"
      case "pending":
        return "Oczekujący"
      case "resolved":
        return "Rozwiązany"
      default:
        return status
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = Date.now()
    const diff = now - date.getTime()
    const minutes = Math.floor(diff / 1000 / 60)

    if (minutes < 60) return `${minutes} min temu`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} godz. temu`
    const days = Math.floor(hours / 24)
    return `${days} dni temu`
  }

  return (
    <div className={`${styles.panel} ${isOpen ? styles.open : ""}`}>
      <div className={styles.backdrop} onClick={onClose}></div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <AlertTriangle size={20} />
            <span>Lista incydentów</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{incidents.filter((i) => i.status === "active").length}</div>
            <div className={styles.statLabel}>Aktywne</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{incidents.filter((i) => i.status === "pending").length}</div>
            <div className={styles.statLabel}>Oczekujące</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{incidents.filter((i) => i.status === "resolved").length}</div>
            <div className={styles.statLabel}>Rozwiązane</div>
          </div>
        </div>

        <div className={styles.list}>
          {incidents.map((incident) => (
            <div key={incident.id} className={styles.incidentCard} onClick={() => setSelectedIncident(incident)}>
              <div className={styles.incidentHeader}>
                <div className={styles.incidentType}>
                  <AlertTriangle size={16} style={{ color: getStatusColor(incident.status) }} />
                  <span>{incident.type}</span>
                </div>
                <div
                  className={styles.statusBadge}
                  style={{ background: `${getStatusColor(incident.status)}20`, color: getStatusColor(incident.status) }}
                >
                  {getStatusLabel(incident.status)}
                </div>
              </div>

              <div className={styles.incidentLocation}>
                <MapPin size={14} />
                <span>{incident.location}</span>
              </div>

              <div className={styles.incidentDescription}>{incident.description}</div>

              <div className={styles.incidentFooter}>
                <div className={styles.incidentTime}>
                  <Clock size={12} />
                  <span>{formatTimestamp(incident.timestamp)}</span>
                </div>
                <ChevronRight size={16} className={styles.chevron} />
              </div>
            </div>
          ))}
        </div>

        {selectedIncident && (
          <div className={styles.detailOverlay} onClick={() => setSelectedIncident(null)}>
            <div className={styles.detailCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.detailHeader}>
                <h3>{selectedIncident.type}</h3>
                <button className={styles.closeBtn} onClick={() => setSelectedIncident(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailRow}>
                  <MapPin size={16} />
                  <div>
                    <div className={styles.detailLabel}>Lokalizacja</div>
                    <div className={styles.detailValue}>{selectedIncident.location}</div>
                    <div className={styles.detailCoords}>
                      {selectedIncident.lat}, {selectedIncident.lng}
                    </div>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <Clock size={16} />
                  <div>
                    <div className={styles.detailLabel}>Czas zgłoszenia</div>
                    <div className={styles.detailValue}>{formatTimestamp(selectedIncident.timestamp)}</div>
                  </div>
                </div>
                <div className={styles.detailDescription}>
                  <div className={styles.detailLabel}>Opis</div>
                  <div className={styles.detailValue}>{selectedIncident.description}</div>
                </div>
              </div>
              <button className={styles.navigateBtn}>
                <MapPin size={16} />
                Nawiguj do lokalizacji
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}