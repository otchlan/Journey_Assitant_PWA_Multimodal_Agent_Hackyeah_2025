//components/incident-chat-bubble.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { X, Send, AlertTriangle, Mic, MicOff } from "lucide-react"

interface IncidentChatBubbleProps {
  x: number
  y: number
  lat: number
  lng: number
  onClose: () => void
  onShowTrafficMap?: (lat: number, lng: number) => void
  onShowRoutePlanner?: (params: {
    from: string
    to: string
    date: string
    time: string
  }) => void
}

interface Message {
  id: number
  text?: string
  sender: "user" | "bot"
  timestamp: Date
  type?: "text" | "options" | "input-request" | "info-card"
  options?: Array<{
    label: string
    value: string
  }>
  infoCard?: {
    title: string
    items: string[]
    emoji?: string
  }
}

export default function IncidentChatBubble({ 
  x, 
  y, 
  lat, 
  lng, 
  onClose, 
  onShowTrafficMap,
  onShowRoutePlanner 
}: IncidentChatBubbleProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Lokalizacja: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      sender: "bot",
      timestamp: new Date(),
      type: "text"
    },
    {
      id: 2,
      text: "Co chcesz zrobić?",
      sender: "bot",
      timestamp: new Date(),
      type: "options",
      options: [
        { label: "📊 Analiza ruchu", value: "traffic_analysis" },
        { label: "🗺️ Planowanie trasy", value: "route_planning" },
        { label: "🚨 Zgłoszenie incydentu", value: "incident_report" }
      ]
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isAnimating, setIsAnimating] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [routePlanningStep, setRoutePlanningStep] = useState<"from" | "to" | "date" | "time" | "complete" | null>(null)
  const [routeData, setRouteData] = useState({
    from: "",
    to: "",
    date: "",
    time: ""
  })
  const [incidentReportStep, setIncidentReportStep] = useState<"intro" | "type" | "description" | "media" | "severity" | "confirm" | "processing" | "complete" | null>(null)
  const [incidentData, setIncidentData] = useState({
    type: "",
    description: "",
    mediaFiles: [] as File[],
    severity: ""
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef<string>("")
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setIsVoiceSupported(true)
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.lang = 'pl-PL'
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript + ' '
            setInputValue(finalTranscriptRef.current)
            
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current)
            }
            
            silenceTimerRef.current = setTimeout(() => {
              if (recognitionRef.current && isListening) {
                try {
                  recognitionRef.current.stop()
                } catch (e) {}
                setIsListening(false)
              }
            }, 5000)
          } else if (interimTranscript) {
            setInputValue(finalTranscriptRef.current + interimTranscript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error('Error starting recognition:', e)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
      setIsListening(false)
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      finalTranscriptRef.current = inputValue
      startListening()
    }
  }

  const handleOptionSelect = (option: string) => {
    if (selectedOption !== null) return
    
    setSelectedOption(option)
    
    const userMessage: Message = {
      id: Date.now(),
      text: messages.find(m => m.type === "options")?.options?.find(o => o.value === option)?.label,
      sender: "user",
      timestamp: new Date(),
      type: "text"
    }
    setMessages((prev) => [...prev, userMessage])

    setTimeout(() => {
      if (option === "traffic_analysis") {
        const analyzingMessage: Message = {
          id: Date.now() + 1,
          text: "Analizuję ruch w promieniu 5km... chwila",
          sender: "bot",
          timestamp: new Date(),
          type: "text"
        }
        setMessages((prev) => [...prev, analyzingMessage])
        setIsAnalyzing(true)
        
        setTimeout(() => {
          setIsAnalyzing(false)
          const completedMessage: Message = {
            id: Date.now() + 2,
            text: "Analiza zakończona, możesz teraz przejść do mapy",
            sender: "bot",
            timestamp: new Date(),
            type: "text"
          }
          setMessages((prev) => [...prev, completedMessage])
          
          setTimeout(() => {
            if (onShowTrafficMap) {
              onShowTrafficMap(lat, lng)
            }
          }, 500)
        }, 3000)
      } else if (option === "route_planning") {
        setRoutePlanningStep("from")
        const botMessage: Message = {
          id: Date.now() + 1,
          text: "Skąd jedziesz? (np. Warszawa, Polska)",
          sender: "bot",
          timestamp: new Date(),
          type: "input-request"
        }
        setMessages((prev) => [...prev, botMessage])
      } else if (option === "incident_report") {
        setIncidentReportStep("intro")
        
        const infoMessage: Message = {
          id: Date.now() + 1,
          sender: "bot",
          timestamp: new Date(),
          type: "info-card",
          infoCard: {
            title: "Zgłoszenie incydentu",
            emoji: "📋",
            items: [
              "Rodzaj incydentu (wypadek, zagrożenie, utrudnienie)",
              "Szczegółowy opis sytuacji",
              "Zdjęcia lub filmy (opcjonalnie)",
              "Stopień zagrożenia",
              "Twoja lokalizacja (automatycznie)"
            ]
          }
        }
        setMessages((prev) => [...prev, infoMessage])

        setTimeout(() => {
          const startMessage: Message = {
            id: Date.now() + 2,
            text: "Rozpocznijmy zgłoszenie. Będę Cię prowadził krok po kroku. 👇",
            sender: "bot",
            timestamp: new Date(),
            type: "text"
          }
          setMessages((prev) => [...prev, startMessage])

          setTimeout(() => {
            showIncidentTypeSelection()
          }, 800)
        }, 1000)
      }
    }, 800)
  }

  const showIncidentTypeSelection = () => {
    setIncidentReportStep("type")
    const botMessage: Message = {
      id: Date.now(),
      text: "Krok 1/4: Jaki rodzaj incydentu chcesz zgłosić?",
      sender: "bot",
      timestamp: new Date(),
      type: "options",
      options: [
        { label: "🚗 Wypadek", value: "wypadek" },
        { label: "⚠️ Zagrożenie", value: "zagrozenie" },
        { label: "🚧 Utrudnienie w ruchu", value: "utrudnienie" },
        { label: "🚨 Inne", value: "inne" }
      ]
    }
    setMessages((prev) => [...prev, botMessage])
  }

  const handleIncidentTypeSelect = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      "wypadek": "🚗 Wypadek",
      "zagrozenie": "⚠️ Zagrożenie",
      "utrudnienie": "🚧 Utrudnienie w ruchu",
      "inne": "🚨 Inne"
    }

    setIncidentData(prev => ({ ...prev, type }))
    
    const userMessage: Message = {
      id: Date.now(),
      text: typeLabels[type],
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    setTimeout(() => {
      const confirmMessage: Message = {
        id: Date.now() + 1,
        text: `Wybrałeś: ${typeLabels[type]}. Przejdźmy do szczegółów.`,
        sender: "bot",
        timestamp: new Date(),
        type: "text"
      }
      setMessages((prev) => [...prev, confirmMessage])

      setTimeout(() => {
        setIncidentReportStep("description")
        const botMessage: Message = {
          id: Date.now() + 2,
          text: "Krok 2/4: Opisz szczegółowo co się stało. Im więcej informacji, tym lepiej!\n\nMożesz mówić 🎤 lub pisać ⌨️",
          sender: "bot",
          timestamp: new Date(),
          type: "text"
        }
        setMessages((prev) => [...prev, botMessage])

        setTimeout(() => {
          const examplesMessage: Message = {
            id: Date.now() + 3,
            text: "💡 Przykład: \"Zderzenie dwóch samochodów na skrzyżowaniu. Zablokowany lewy pas. Kierowcy poza pojazdami, czekają na policję.\"",
            sender: "bot",
            timestamp: new Date(),
            type: "text"
          }
          setMessages((prev) => [...prev, examplesMessage])
        }, 500)
      }, 800)
    }, 800)
  }

  const handleIncidentDescriptionSubmit = () => {
    if (!inputValue.trim()) return

    if (isListening) {
      stopListening()
    }

    const currentValue = inputValue.trim()
    setIncidentData(prev => ({ ...prev, description: currentValue }))

    const userMessage: Message = {
      id: Date.now(),
      text: currentValue,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    
    setInputValue("")
    finalTranscriptRef.current = ""

    setTimeout(() => {
      const thankYouMessage: Message = {
        id: Date.now() + 1,
        text: "Dziękuję za szczegółowy opis! 👍",
        sender: "bot",
        timestamp: new Date(),
        type: "text"
      }
      setMessages((prev) => [...prev, thankYouMessage])

      setTimeout(() => {
        setIncidentReportStep("media")
        const botMessage: Message = {
          id: Date.now() + 2,
          text: "Krok 3/4: Czy chcesz dodać zdjęcia lub filmy?\n\n📸 Materiały wizualne pomagają lepiej ocenić sytuację.",
          sender: "bot",
          timestamp: new Date(),
          type: "options",
          options: [
            { label: "📷 Dodaj zdjęcie", value: "add_photo" },
            { label: "🎥 Dodaj film", value: "add_video" },
            { label: "⏭️ Pomiń i przejdź dalej", value: "skip_media" }
          ]
        }
        setMessages((prev) => [...prev, botMessage])
      }, 800)
    }, 800)
  }

  const handleMediaOption = (option: string) => {
    if (option === "add_photo" || option === "add_video") {
      const accept = option === "add_photo" ? "image/*" : "video/*"
      
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.multiple = true
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || [])
        if (files.length > 0) {
          setIncidentData(prev => ({
            ...prev,
            mediaFiles: [...prev.mediaFiles, ...files]
          }))

          const mediaType = option === "add_photo" ? "zdjęć" : "filmów"
          const userMessage: Message = {
            id: Date.now(),
            text: `✅ Dodano ${files.length} ${mediaType}:\n${files.map(f => `📎 ${f.name}`).join("\n")}`,
            sender: "user",
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, userMessage])

          setTimeout(() => {
            const botMessage: Message = {
              id: Date.now() + 1,
              text: "Świetnie! Czy chcesz dodać więcej plików?",
              sender: "bot",
              timestamp: new Date(),
              type: "options",
              options: [
                { label: "📷 Dodaj więcej zdjęć", value: "add_photo" },
                { label: "🎥 Dodaj więcej filmów", value: "add_video" },
                { label: "✅ Przejdź dalej", value: "skip_media" }
              ]
            }
            setMessages((prev) => [...prev, botMessage])
          }, 500)
        }
      }
      input.click()
    } else if (option === "skip_media") {
      const userMessage: Message = {
        id: Date.now(),
        text: incidentData.mediaFiles.length > 0 ? "✅ Przejdź dalej" : "⏭️ Pomiń i przejdź dalej",
        sender: "user",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      setTimeout(() => {
        if (incidentData.mediaFiles.length > 0) {
          const summaryMessage: Message = {
            id: Date.now() + 1,
            text: `Dodano łącznie ${incidentData.mediaFiles.length} plików. Przechodzimy dalej! 📎`,
            sender: "bot",
            timestamp: new Date(),
            type: "text"
          }
          setMessages((prev) => [...prev, summaryMessage])
        }

        setTimeout(() => {
          showSeveritySelection()
        }, 800)
      }, 500)
    }
  }

  const showSeveritySelection = () => {
    setIncidentReportStep("severity")
    const botMessage: Message = {
      id: Date.now(),
      text: "Krok 4/4: Oceń stopień zagrożenia lub utrudnienia:",
      sender: "bot",
      timestamp: new Date(),
      type: "options",
      options: [
        { label: "🟢 Niski - Małe utrudnienie", value: "low" },
        { label: "🟡 Średni - Zauważalne utrudnienie", value: "medium" },
        { label: "🟠 Wysoki - Poważne utrudnienie", value: "high" },
        { label: "🔴 Krytyczny - Niebezpieczeństwo", value: "critical" }
      ]
    }
    setMessages((prev) => [...prev, botMessage])
  }

  const handleSeveritySelect = (severity: string) => {
    const severityLabels: { [key: string]: string } = {
      "low": "🟢 Niski - Małe utrudnienie",
      "medium": "🟡 Średni - Zauważalne utrudnienie",
      "high": "🟠 Wysoki - Poważne utrudnienie",
      "critical": "🔴 Krytyczny - Niebezpieczeństwo"
    }

    setIncidentData(prev => ({ ...prev, severity }))
    
    const userMessage: Message = {
      id: Date.now(),
      text: severityLabels[severity],
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    setTimeout(() => {
      showIncidentSummary()
    }, 800)
  }

  const showIncidentSummary = () => {
    setIncidentReportStep("confirm")
    
    const typeLabels: { [key: string]: string } = {
      "wypadek": "🚗 Wypadek",
      "zagrozenie": "⚠️ Zagrożenie",
      "utrudnienie": "🚧 Utrudnienie w ruchu",
      "inne": "🚨 Inne"
    }

    const severityLabels: { [key: string]: string } = {
      "low": "🟢 Niski",
      "medium": "🟡 Średni",
      "high": "🟠 Wysoki",
      "critical": "🔴 Krytyczny"
    }

    const summaryText = `📋 Podsumowanie zgłoszenia:

${typeLabels[incidentData.type]}
${severityLabels[incidentData.severity]}

📍 Lokalizacja: ${lat.toFixed(4)}, ${lng.toFixed(4)}

📝 Opis:
${incidentData.description}

${incidentData.mediaFiles.length > 0 ? `📎 Załączniki: ${incidentData.mediaFiles.length} plików` : '📎 Brak załączników'}

Czy potwierdzasz zgłoszenie?`

    const summaryMessage: Message = {
      id: Date.now(),
      text: summaryText,
      sender: "bot",
      timestamp: new Date(),
      type: "text"
    }
    setMessages((prev) => [...prev, summaryMessage])

    setTimeout(() => {
      const confirmOptions: Message = {
        id: Date.now() + 1,
        text: "",
        sender: "bot",
        timestamp: new Date(),
        type: "options",
        options: [
          { label: "✅ Tak, wyślij zgłoszenie", value: "confirm" },
          { label: "❌ Anuluj", value: "cancel" }
        ]
      }
      setMessages((prev) => [...prev, confirmOptions])
    }, 500)
  }

  const handleConfirmation = (action: string) => {
    if (action === "confirm") {
      submitIncidentReport()
    } else {
      const userMessage: Message = {
        id: Date.now(),
        text: "❌ Anuluj",
        sender: "user",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      setTimeout(() => {
        const cancelMessage: Message = {
          id: Date.now() + 1,
          text: "Zgłoszenie zostało anulowane. Jeśli chcesz zgłosić incydent, wybierz ponownie z menu głównego.",
          sender: "bot",
          timestamp: new Date(),
          type: "text"
        }
        setMessages((prev) => [...prev, cancelMessage])
        
        setIncidentReportStep(null)
        setSelectedOption(null)
        setIncidentData({
          type: "",
          description: "",
          mediaFiles: [],
          severity: ""
        })
      }, 800)
    }
  }

  const submitIncidentReport = () => {
    const userMessage: Message = {
      id: Date.now(),
      text: "✅ Tak, wyślij zgłoszenie",
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    setTimeout(() => {
      setIncidentReportStep("processing")
      const processingMessage: Message = {
        id: Date.now() + 1,
        text: "⏳ Przetwarzam dane... Incydent zaraz pojawi się na liście.",
        sender: "bot",
        timestamp: new Date(),
        type: "text"
      }
      setMessages((prev) => [...prev, processingMessage])

      setTimeout(() => {
        setIncidentReportStep("complete")
        const successMessage: Message = {
          id: Date.now() + 2,
          text: "✅ Zgłoszenie zostało pomyślnie dodane!\n\n🗺️ Incydent pojawił się na liście i mapie.\n\n📱 Otrzymasz powiadomienie gdy status się zmieni.",
          sender: "bot",
          timestamp: new Date(),
          type: "text"
        }
        setMessages((prev) => [...prev, successMessage])

        console.log("Nowy incydent:", {
          type: incidentData.type,
          description: incidentData.description,
          severity: incidentData.severity,
          mediaCount: incidentData.mediaFiles.length,
          mediaFiles: incidentData.mediaFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
          location: { lat, lng },
          timestamp: new Date().toISOString()
        })
      }, 4000)
    }, 800)
  }

  const handleRoutePlanningInput = () => {
    if (!inputValue.trim()) return

    if (isListening) {
      stopListening()
    }

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    const currentValue = inputValue.trim()
    setInputValue("")
    finalTranscriptRef.current = ""

    setTimeout(() => {
      if (routePlanningStep === "from") {
        setRouteData(prev => ({ ...prev, from: currentValue }))
        setRoutePlanningStep("to")
        const botMessage: Message = {
          id: Date.now() + 1,
          text: "Dokąd jedziesz? (np. Kraków, Polska)",
          sender: "bot",
          timestamp: new Date(),
          type: "input-request"
        }
        setMessages((prev) => [...prev, botMessage])
      } else if (routePlanningStep === "to") {
        setRouteData(prev => ({ ...prev, to: currentValue }))
        setRoutePlanningStep("date")
        const botMessage: Message = {
          id: Date.now() + 1,
          text: "Którego dnia jedziesz? (np. dzisiaj, jutro, za 3 dni, 15 października, 2025-10-15)",
          sender: "bot",
          timestamp: new Date(),
          type: "input-request"
        }
        setMessages((prev) => [...prev, botMessage])
      } else if (routePlanningStep === "date") {
        const parsedDate = parseNaturalDate(currentValue)
        setRouteData(prev => ({ ...prev, date: parsedDate }))
        setRoutePlanningStep("time")
        const botMessage: Message = {
          id: Date.now() + 1,
          text: "O której godzinie? (np. teraz, 14:30, o 16, rano, wieczorem)",
          sender: "bot",
          timestamp: new Date(),
          type: "input-request"
        }
        setMessages((prev) => [...prev, botMessage])
      } else if (routePlanningStep === "time") {
        const parsedTime = parseNaturalTime(currentValue)
        
        const finalRouteData = {
          ...routeData,
          time: parsedTime
        }
        setRouteData(finalRouteData)
        setRoutePlanningStep("complete")
        
        const summaryMessage: Message = {
          id: Date.now() + 1,
          text: `Świetnie! Planuję trasę:\n📍 Z: ${routeData.from}\n🎯 Do: ${routeData.to}\n📅 Data: ${routeData.date}\n⏰ Godzina: ${parsedTime}\n\nPrzechodzimy do planera...`,
          sender: "bot",
          timestamp: new Date(),
          type: "text"
        }
        setMessages((prev) => [...prev, summaryMessage])

        setTimeout(() => {
          if (onShowRoutePlanner) {
            onShowRoutePlanner(finalRouteData)
          }
        }, 2000)
      }
    }, 800)
  }

  const parseNaturalDate = (input: string): string => {
    const lowerInput = input.toLowerCase().trim()
    const today = new Date()
    
    if (lowerInput === "dzisiaj" || lowerInput === "dziś") {
      return today.toISOString().split('T')[0]
    }
    
    if (lowerInput === "jutro") {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    }
    
    if (lowerInput === "pojutrze") {
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      return dayAfterTomorrow.toISOString().split('T')[0]
    }
    
    const daysMatch = lowerInput.match(/za (\d+) (dni|dzień|dnia)/)
    if (daysMatch) {
      const days = parseInt(daysMatch[1])
      const futureDate = new Date(today)
      futureDate.setDate(futureDate.getDate() + days)
      return futureDate.toISOString().split('T')[0]
    }
    
    const monthNames: { [key: string]: number } = {
      'stycznia': 0, 'styczeń': 0, 'styczen': 0,
      'lutego': 1, 'luty': 1,
      'marca': 2, 'marzec': 2,
      'kwietnia': 3, 'kwiecień': 3, 'kwiecien': 3,
      'maja': 4, 'maj': 4,
      'czerwca': 5, 'czerwiec': 5,
      'lipca': 6, 'lipiec': 6,
      'sierpnia': 7, 'sierpień': 7, 'sierpien': 7,
      'września': 8, 'wrzesień': 8, 'wrzesien': 8,
      'października': 9, 'październik': 9, 'pazdziernik': 9, 'pazdziernika': 9,
      'listopada': 10, 'listopad': 10,
      'grudnia': 11, 'grudzień': 11, 'grudzien': 11
    }
    
    for (const [monthName, monthNum] of Object.entries(monthNames)) {
      const dayMonthMatch = lowerInput.match(new RegExp(`(\\d+)\\s+${monthName}`))
      const monthDayMatch = lowerInput.match(new RegExp(`${monthName}\\s+(\\d+)`))
      
      if (dayMonthMatch || monthDayMatch) {
        const day = parseInt(dayMonthMatch ? dayMonthMatch[1] : monthDayMatch![1])
        let year = today.getFullYear()
        const targetDate = new Date(year, monthNum, day, 23, 59, 59)
        
        if (targetDate < today) {
          targetDate.setFullYear(year + 1)
        }
        
        return targetDate.toISOString().split('T')[0]
      }
    }
    
    const numericDateMatch = lowerInput.match(/(\d+)[.\s/-](\d+)/)
    if (numericDateMatch) {
      const day = parseInt(numericDateMatch[1])
      const month = parseInt(numericDateMatch[2]) - 1
      let year = today.getFullYear()
      const targetDate = new Date(year, month, day)
      
      if (targetDate < today) {
        targetDate.setFullYear(year + 1)
      }
      
      return targetDate.toISOString().split('T')[0]
    }
    
    if (lowerInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return lowerInput
    }
    
    return today.toISOString().split('T')[0]
  }

  const parseNaturalTime = (input: string): string => {
    const lowerInput = input.toLowerCase().trim()
    const now = new Date()
    
    if (lowerInput === "teraz") {
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    }
    
    if (lowerInput === "rano" || lowerInput === "rankiem") {
      return "08:00"
    }
    
    if (lowerInput === "południe" || lowerInput === "w południe" || lowerInput === "poludnie") {
      return "12:00"
    }
    
    if (lowerInput === "popołudnie" || lowerInput === "popoludnie" || lowerInput === "po południu") {
      return "15:00"
    }
    
    if (lowerInput === "wieczorem" || lowerInput === "wieczór" || lowerInput === "wieczor") {
      return "18:00"
    }
    
    if (lowerInput === "nocą" || lowerInput === "w nocy" || lowerInput === "noca") {
      return "22:00"
    }
    
    const hourOnlyMatch = lowerInput.match(/o?\s*(\d{1,2})$/)
    if (hourOnlyMatch) {
      const hour = parseInt(hourOnlyMatch[1])
      if (hour >= 0 && hour <= 23) {
        return `${String(hour).padStart(2, '0')}:00`
      }
    }
    
    const colonTimeMatch = lowerInput.match(/^(\d{1,2}):(\d{2})$/)
    if (colonTimeMatch) {
      const hour = parseInt(colonTimeMatch[1])
      const minute = parseInt(colonTimeMatch[2])
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      }
    }
    
    const dotTimeMatch = lowerInput.match(/(\d{1,2})\.(\d{2})/)
    if (dotTimeMatch) {
      const hour = parseInt(dotTimeMatch[1])
      const minute = parseInt(dotTimeMatch[2])
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      }
    }
    
    const hoursMatch = lowerInput.match(/za (\d+) (godzin|godzinę|godziny)/)
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1])
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000)
      return `${String(futureTime.getHours()).padStart(2, '0')}:${String(futureTime.getMinutes()).padStart(2, '0')}`
    }
    
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  const handleSend = () => {
    if (routePlanningStep && routePlanningStep !== "complete") {
      handleRoutePlanningInput()
    } else if (incidentReportStep === "description") {
      handleIncidentDescriptionSubmit()
    } else if (!inputValue.trim()) {
      return
    }
  }

  const handleClose = () => {
    stopListening()
    onClose()
  }

  const getPlaceholder = () => {
    if (routePlanningStep === "from") return "Skąd jedziesz..."
    if (routePlanningStep === "to") return "Dokąd jedziesz..."
    if (routePlanningStep === "date") return "dzisiaj, jutro, za 3 dni, 15 października..."
    if (routePlanningStep === "time") return "teraz, 14:30, o 16, rano..."
    if (incidentReportStep === "description") return "Opisz szczegóły incydentu..."
    return "Wpisz wiadomość..."
  }

  const getTitleText = () => {
    if (incidentReportStep && incidentReportStep !== "complete") {
      return 'Zgłoszenie incydentu'
    }
    if (routePlanningStep && routePlanningStep !== "complete") {
      return 'Planowanie trasy'
    }
    return 'Asystent'
  }

  return (
    <div
      className="bubble"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        width: '400px',
        maxWidth: '90vw',
        height: '500px',
        maxHeight: '80vh',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        transform: isAnimating ? 'translate(-50%, -50%) scale(0.8)' : 'translate(-50%, -50%) scale(1)',
        opacity: isAnimating ? 0 : 1,
        transition: 'all 0.3s ease-out',
      }}
    >
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
          <AlertTriangle size={18} color="#f59e0b" />
          <span>{getTitleText()}</span>
        </div>
        <button
          onClick={handleClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === "user" ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.type === "info-card" && msg.infoCard ? (
              <div style={{
                width: '100%',
                backgroundColor: '#eff6ff',
                border: '2px solid #3b82f6',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#1e40af'
                }}>
                  <span style={{ fontSize: '24px' }}>{msg.infoCard.emoji}</span>
                  {msg.infoCard.title}
                </div>
                <div style={{ fontSize: '14px', color: '#1e40af' }}>
                  <div style={{ fontWeight: '500', marginBottom: '8px' }}>Potrzebne informacje:</div>
                  {msg.infoCard.items.map((item, idx) => (
                    <div key={idx} style={{ 
                      marginBottom: '6px',
                      paddingLeft: '8px',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#3b82f6' }}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : msg.type === "options" ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {msg.text && (
                  <div style={{
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    {msg.text}
                  </div>
                )}
                {msg.options?.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (incidentReportStep === "type") {
                        handleIncidentTypeSelect(option.value)
                      } else if (incidentReportStep === "media") {
                        handleMediaOption(option.value)
                      } else if (incidentReportStep === "severity") {
                        handleSeveritySelect(option.value)
                      } else if (incidentReportStep === "confirm") {
                        handleConfirmation(option.value)
                      } else {
                        handleOptionSelect(option.value)
                      }
                    }}
                    disabled={
                      selectedOption !== null && 
                      incidentReportStep !== "type" &&
                      incidentReportStep !== "media" && 
                      incidentReportStep !== "severity" && 
                      incidentReportStep !== "confirm"
                    }
                    style={{
                      padding: '12px 16px',
                      backgroundColor: selectedOption === option.value ? '#3b82f6' : '#fff',
                      color: selectedOption === option.value ? '#fff' : '#1f2937',
                      border: selectedOption === option.value ? 'none' : '2px solid #e5e7eb',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      opacity: 1,
                      boxShadow: selectedOption === option.value ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedOption !== option.value) {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOption !== option.value) {
                        e.currentTarget.style.backgroundColor = '#fff'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div
                  style={{
                    backgroundColor: msg.sender === "user" ? '#3b82f6' : '#f3f4f6',
                    color: msg.sender === "user" ? 'white' : '#1f2937',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    maxWidth: '80%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {msg.text}
                  {(msg.text?.includes("Analizuję ruch") && isAnalyzing) || msg.text?.includes("Przetwarzam dane") ? (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #3b82f6',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                  ) : null}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  {msg.timestamp.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}>
        {(routePlanningStep || incidentReportStep === "description") && (
          <>
            {isVoiceSupported && incidentReportStep === "description" && (
              <button
                onClick={toggleListening}
                style={{
                  border: 'none',
                  background: isListening ? '#ef4444' : '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  animation: isListening ? 'pulse 2s infinite' : 'none',
                }}
                title={isListening ? 'Zatrzymaj nagrywanie' : 'Rozpocznij nagrywanie'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            <input
              type="text"
              placeholder={getPlaceholder()}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              style={{
                border: 'none',
                background: inputValue.trim() ? '#3b82f6' : '#e5e7eb',
                color: inputValue.trim() ? 'white' : '#9ca3af',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={18} />
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}