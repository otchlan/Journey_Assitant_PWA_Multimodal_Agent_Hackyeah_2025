"use client"

import { useState } from "react"
import styles from "./onboarding-instructions.module.css"
import { MousePointerClick, ArrowLeftRight, ArrowDown, ArrowUp, X, ChevronRight } from "lucide-react"

interface OnboardingInstructionsProps {
  onComplete: () => void
}

export default function OnboardingInstructions({ onComplete }: OnboardingInstructionsProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: MousePointerClick,
      title: "Zgłoś incydent",
      description: "Kliknij dwa razy na mapie, aby otworzyć chatbota i zgłosić incydent w wybranym miejscu",
      gesture: "Podwójne kliknięcie",
    },
    {
      icon: ArrowLeftRight,
      title: "Planuj trasę",
      description: "Przesuń palcem od prawej do lewej, aby otworzyć panel chatbota do planowania tras i wypraw",
      gesture: "Swipe w lewo",
    },
    {
      icon: ArrowDown,
      title: "Twój profil",
      description: "Przesuń palcem z góry w dół, aby zobaczyć swój profil, statystyki i ustawienia",
      gesture: "Swipe w dół",
    },
    {
      icon: ArrowUp,
      title: "Lista incydentów",
      description: "Przesuń palcem od dołu w górę, aby zobaczyć listę wszystkich zgłoszonych incydentów",
      gesture: "Swipe w górę",
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <button className={styles.closeButton} onClick={handleSkip} aria-label="Zamknij">
          <X size={24} />
        </button>

        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <Icon size={64} className={styles.icon} />
          </div>

          <div className={styles.gestureTag}>{step.gesture}</div>

          <h2 className={styles.title}>{step.title}</h2>
          <p className={styles.description}>{step.description}</p>

          <div className={styles.progress}>
            {steps.map((_, index) => (
              <div
                key={index}
                className={`${styles.progressDot} ${
                  index === currentStep ? styles.progressDotActive : ""
                } ${index < currentStep ? styles.progressDotComplete : ""}`}
              />
            ))}
          </div>

          <div className={styles.actions}>
            {currentStep > 0 && (
              <button className={styles.skipButton} onClick={handleSkip}>
                Pomiń
              </button>
            )}
            <button className={styles.nextButton} onClick={handleNext}>
              {currentStep < steps.length - 1 ? (
                <>
                  Dalej
                  <ChevronRight size={20} />
                </>
              ) : (
                "Rozpocznij"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
