import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import ExamCategoryPage from '../components/cbt/ExamCategoryPage'

vi.mock('axios')
const mockedAxios = axios as any

describe('ExamCategoryPage Multi-Subject & Category Level Access Tests', () => {
  const mockExam = {
    id: 1,
    title: 'JAMB UTME',
    description: 'Joint Admissions and Matriculation Board Unified Tertiary Matriculation Examination',
    time_limit_minutes: 120,
    created_at: '2025-01-01',
    subject_count: 4,
    subjects: [
      { id: 10, name: 'English Language', question_count: 60, description: '' },
      { id: 11, name: 'Mathematics', question_count: 50, description: '' },
      { id: 12, name: 'Physics', question_count: 50, description: '' },
      { id: 13, name: 'Chemistry', question_count: 50, description: '' },
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Practice Multiple Subjects" button and loads category subjects for unlocked user', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/subjects/')) {
        return Promise.resolve({ data: mockExam.subjects })
      }
      if (url.includes('activation-status')) {
        return Promise.resolve({
          data: {
            unlocked: true,
            trial_available: false,
            trial_attempts_remaining: 0,
            allowed_subjects: [10, 11, 12, 13]
          }
        })
      }
      return Promise.resolve({ data: {} })
    })

    const onStartExam = vi.fn()
    const onBack = vi.fn()

    render(
      <ExamCategoryPage
        exam={mockExam}
        onBack={onBack}
        onStartExam={onStartExam}
      />
    )

    // Wait for subjects to load
    await waitFor(() => {
      expect(screen.getByText('English Language')).toBeInTheDocument()
    })

    // "Practice Multiple Subjects" button should be present
    const multiSubjectBtn = screen.getByRole('button', { name: /practice multiple subjects/i })
    expect(multiSubjectBtn).toBeInTheDocument()

    // Clicking it should trigger onStartExam with empty subjects array (to open multi-subject modal)
    fireEvent.click(multiSubjectBtn)
    expect(onStartExam).toHaveBeenCalledWith(
      mockExam,
      [],
      null,
      [10, 11, 12, 13]
    )
  })

  it('displays "Unlock Full Exam" button and trial exhausted alert when locked without trial', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/subjects/')) {
        return Promise.resolve({ data: mockExam.subjects })
      }
      if (url.includes('activation-status')) {
        return Promise.resolve({
          data: {
            unlocked: false,
            trial_available: false,
            trial_attempts_remaining: 0,
            allowed_subjects: []
          }
        })
      }
      return Promise.resolve({ data: {} })
    })

    const onStartExam = vi.fn()
    const onBack = vi.fn()

    render(
      <ExamCategoryPage
        exam={mockExam}
        onBack={onBack}
        onStartExam={onStartExam}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Free Trial Exhausted for JAMB UTME/i)).toBeInTheDocument()
    })

    // Should display Unlock Full Exam button
    const unlockButtons = screen.getAllByRole('button', { name: /unlock full exam/i })
    expect(unlockButtons.length).toBeGreaterThan(0)
  })
})
