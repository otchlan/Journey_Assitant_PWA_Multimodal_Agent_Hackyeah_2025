"use client"

import type React from "react"

import { useState } from "react"
import styles from "./login-screen.module.css"
import { MapPin, Lock, User } from "lucide-react"

interface LoginScreenProps {
  onLogin: (success: boolean) => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("user")
  const [password, setPassword] = useState("123")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Mock authentication
    setTimeout(() => {
      if (username === "user" && password === "123") {
        onLogin(true)
      } else {
        setError("Nieprawidłowy login lub hasło")
        setIsLoading(false)
      }
    }, 800)
  }

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.gridOverlay}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.logo}>
          <MapPin size={48} className={styles.logoIcon} />
          <h1 className={styles.appName}>MapApp</h1>
          <p className={styles.tagline}>Twoja aplikacja do zarządzania trasami i incydentami</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>
              <User size={18} />
              <span>Nazwa użytkownika</span>
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user"
              required
              autoComplete="username"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              <Lock size={18} />
              <span>Hasło</span>
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="123"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Logowanie...
              </>
            ) : (
              "Zaloguj się"
            )}
          </button>
        </form>

        <div className={styles.hint}>
          <p>Dane testowe:</p>
          <p>
            <strong>Login:</strong> user
          </p>
          <p>
            <strong>Hasło:</strong> 123
          </p>
        </div>
      </div>
    </div>
  )
}
