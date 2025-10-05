"use client"

import { useState, useRef, useEffect } from "react"
import styles from "./route-chat-panel.module.css"
import { X, Send, Map, Navigation, Clock } from "lucide-react"

interface RouteChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export default function RouteChatPanel({ isOpen, onClose }: RouteChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Cześć! Pomogę Ci zaplanować trasę lub wyprawę. Co chcesz dzisiaj odkryć?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: Date.now() + 1,
        text: "Świetny wybór! Mogę zaproponować kilka tras w tym rejonie. Jaki dystans Cię interesuje?",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={onClose} />
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Map size={20} />
            <span>Planowanie trasy</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <Navigation size={16} />
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>Dystans</div>
              <div className={styles.statValue}>0 km</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <Clock size={16} />
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>Czas</div>
              <div className={styles.statValue}>0 min</div>
            </div>
          </div>
        </div>

        <div className={styles.messages}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.sender === "user" ? styles.userMessage : styles.botMessage}`}
            >
              <div className={styles.messageText}>{msg.text}</div>
              <div className={styles.messageTime}>
                {msg.timestamp.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <input
            type="text"
            className={styles.input}
            placeholder="Opisz swoją trasę..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button className={styles.sendBtn} onClick={handleSend}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
