//components/user-profile.tsx
"use client"

import { useState } from "react"
import styles from "./user-profile.module.css"
import { X, User, MapPin, Award, TrendingUp, Settings } from "lucide-react"

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "achievements" | "settings">("stats")

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={onClose} />
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            <User size={40} />
          </div>
          <h2 className={styles.userName}>Jan Kowalski</h2>
          <p className={styles.userBio}>Odkrywca tras górskich</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "stats" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <TrendingUp size={18} />
            <span>Statystyki</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === "achievements" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("achievements")}
          >
            <Award size={18} />
            <span>Osiągnięcia</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === "settings" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={18} />
            <span>Ustawienia</span>
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === "stats" && (
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <MapPin size={24} className={styles.statIcon} />
                <div className={styles.statValue}>127</div>
                <div className={styles.statLabel}>Odwiedzone miejsca</div>
              </div>
              <div className={styles.statItem}>
                <TrendingUp size={24} className={styles.statIcon} />
                <div className={styles.statValue}>342 km</div>
                <div className={styles.statLabel}>Przebyta trasa</div>
              </div>
              <div className={styles.statItem}>
                <Award size={24} className={styles.statIcon} />
                <div className={styles.statValue}>15</div>
                <div className={styles.statLabel}>Zdobyte odznaki</div>
              </div>
            </div>
          )}

          {activeTab === "achievements" && (
            <div className={styles.achievementsList}>
              <div className={styles.achievement}>
                <div className={styles.achievementIcon}>🏔️</div>
                <div className={styles.achievementInfo}>
                  <div className={styles.achievementTitle}>Zdobywca szczytów</div>
                  <div className={styles.achievementDesc}>Odwiedź 10 szczytów górskich</div>
                </div>
                <div className={styles.achievementBadge}>Zdobyte</div>
              </div>
              <div className={styles.achievement}>
                <div className={styles.achievementIcon}>🚶</div>
                <div className={styles.achievementInfo}>
                  <div className={styles.achievementTitle}>Maratończyk</div>
                  <div className={styles.achievementDesc}>Przebyj 100 km</div>
                </div>
                <div className={styles.achievementBadge}>Zdobyte</div>
              </div>
              <div className={`${styles.achievement} ${styles.achievementLocked}`}>
                <div className={styles.achievementIcon}>🌟</div>
                <div className={styles.achievementInfo}>
                  <div className={styles.achievementTitle}>Odkrywca</div>
                  <div className={styles.achievementDesc}>Odwiedź 50 nowych miejsc</div>
                </div>
                <div className={styles.achievementProgress}>27/50</div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className={styles.settingsList}>
              <div className={styles.settingItem}>
                <div className={styles.settingLabel}>Powiadomienia</div>
                <label className={styles.switch}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.slider}></span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <div className={styles.settingLabel}>Tryb ciemny</div>
                <label className={styles.switch}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.slider}></span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <div className={styles.settingLabel}>Geolokalizacja</div>
                <label className={styles.switch}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
