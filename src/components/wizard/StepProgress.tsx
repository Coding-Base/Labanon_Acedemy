import React from 'react'
import { CheckCircle2, Circle } from 'lucide-react'

interface StepProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  onStepClick?: (step: number) => void
}

/**
 * Wizard progress bar component
 * Shows current step and allows navigation between steps
 */
export function StepProgress({
  currentStep,
  totalSteps,
  stepLabels,
  onStepClick
}: StepProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-8">
        <div 
          className="h-full bg-brand-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1
          const isCompleted = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          const isUpcoming = stepNum > currentStep

          return (
            <div
              key={stepNum}
              className="flex flex-col items-center flex-1"
            >
              <button
                onClick={() => onStepClick?.(stepNum)}
                disabled={!onStepClick}
                className={`mb-2 transition-all ${onStepClick ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-brand-600 text-white ring-2 ring-brand-300'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    stepNum
                  )}
                </div>
              </button>
              <div className={`text-xs font-medium text-center ${
                isCurrent ? 'text-brand-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}>
                {label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Step Counter */}
      <div className="text-center mt-4 text-sm text-gray-600">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  )
}
