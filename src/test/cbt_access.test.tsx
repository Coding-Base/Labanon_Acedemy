import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SubjectExamCard from '../components/cbt/SubjectExamCard'

describe('SubjectExamCard Access Control & Trial Tests', () => {
  const mockSubject = {
    id: 101,
    name: 'Mathematics',
    description: 'Calculus and Algebra practice',
    question_count: 50,
  }

  it('renders locked overlay and Unlock button when exam is locked and trial is exhausted', () => {
    const handleStartExam = vi.fn()
    const handleUnlock = vi.fn()

    render(
      <SubjectExamCard
        subject={mockSubject}
        examTitle="JAMB"
        examTimeLimitMinutes={120}
        colorIndex={0}
        isLocked={true}
        isTrialAvailable={false}
        onStartExam={handleStartExam}
        onUnlock={handleUnlock}
      />
    )

    // Verify locked badge and text are present
    expect(screen.getByText('Premium Content')).toBeInTheDocument()
    expect(screen.getByText('Trial expired or access restricted')).toBeInTheDocument()

    // Verify Unlock Exam button is displayed and triggers onUnlock
    const unlockBtn = screen.getByRole('button', { name: /unlock exam/i })
    expect(unlockBtn).toBeInTheDocument()
    fireEvent.click(unlockBtn)
    expect(handleUnlock).toHaveBeenCalledTimes(1)
    expect(handleStartExam).not.toHaveBeenCalled()
  })

  it('renders Free Trial Available badge and Start Free Trial button when user is on trial mode', () => {
    const handleStartExam = vi.fn()

    render(
      <SubjectExamCard
        subject={mockSubject}
        examTitle="JAMB"
        examTimeLimitMinutes={120}
        colorIndex={0}
        isLocked={true}
        isTrialAvailable={true}
        onStartExam={handleStartExam}
      />
    )

    // Should indicate free trial is active
    expect(screen.getByText('Free Trial Available')).toBeInTheDocument()
    // Should NOT show locked overlay text
    expect(screen.queryByText('Trial expired or access restricted')).not.toBeInTheDocument()

    // Can start free trial practice
    const startBtn = screen.getByRole('button', { name: /start free trial/i })
    expect(startBtn).toBeInTheDocument()
    fireEvent.click(startBtn)
    expect(handleStartExam).toHaveBeenCalledTimes(1)
  })

  it('allows starting exam directly when user has unlocked access', () => {
    const handleStartExam = vi.fn()

    render(
      <SubjectExamCard
        subject={mockSubject}
        examTitle="WAEC"
        examTimeLimitMinutes={90}
        colorIndex={1}
        isLocked={false}
        isTrialAvailable={false}
        onStartExam={handleStartExam}
      />
    )

    expect(screen.queryByText('Premium Content')).not.toBeInTheDocument()
    const startBtn = screen.getByRole('button', { name: /start exam/i })
    expect(startBtn).toBeInTheDocument()
    fireEvent.click(startBtn)
    expect(handleStartExam).toHaveBeenCalledTimes(1)
  })
})
