//app/page.tsx
"use client"

import dynamic from "next/dynamic"
import { Suspense, useState, useEffect } from "react"
import styles from "./page.module.css"
import { MapPin, Layers, Navigation, Menu } from "lucide-react"
import LoginScreen from "@/components/login-screen"
import OnboardingInstructions from "@/components/onboarding-instructions"

const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <p>{"Ładowanie mapy..."}</p>
    </div>
  ),
})

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")

    if (authStatus === "true") {
      setIsAuthenticated(true)
      if (hasSeenOnboarding !== "true") {
        setShowOnboarding(true)
      }
    }
  }, [])

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true)
      localStorage.setItem("isAuthenticated", "true")

      const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")
      if (hasSeenOnboarding !== "true") {
        setShowOnboarding(true)
      }
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    localStorage.setItem("hasSeenOnboarding", "true")
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <main className={styles.main}>
      {showOnboarding && <OnboardingInstructions onComplete={handleOnboardingComplete} />}

      <header className={styles.header}>
        <button className={styles.menuButton} aria-label="Menu">
          <Menu size={24} />
        </button>
        <h1 className={styles.title}>MapApp</h1>
        <div className={styles.headerActions}>
          <button className={styles.iconButton} aria-label="Layers">
            <Layers size={20} />
          </button>
        </div>
      </header>

      <div className={styles.mapContainer}>
        <Suspense
          fallback={
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
            </div>
          }
        >
          <MapComponent />
        </Suspense>
      </div>

    </main>
  )
}
