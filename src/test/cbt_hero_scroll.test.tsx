import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import CBT from '../pages/CBT'

vi.mock('axios')
const mockedAxios = axios as any

describe('CBT Hub Hero Button & Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock scrollIntoView in jsdom
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('"Take CBT Test" button smoothly scrolls to Exam Categories and does not bypass to JAMB', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/cbt/exams/popular/')) {
        return Promise.resolve({ data: [] })
      }
      if (url.includes('/cbt/exams/')) {
        return Promise.resolve({
          data: [
            { id: 1, title: 'JAMB UTME', subject_count: 4, icon: 'book', color: 'orange' },
            { id: 2, title: 'WAEC SSCE', subject_count: 8, icon: 'book', color: 'blue' }
          ]
        })
      }
      if (url.includes('/cbt/attempt-list/')) {
        return Promise.resolve({ data: { results: [] } })
      }
      if (url.includes('/cbt/attempts/')) {
        return Promise.resolve({ data: [] })
      }
      return Promise.resolve({ data: [] })
    })

    render(<CBT />)

    // Wait for exams to load
    await waitFor(() => {
      expect(screen.getByText('JAMB UTME')).toBeInTheDocument()
    })

    const heroTakeTestBtn = screen.getByRole('button', { name: /take cbt test/i })
    expect(heroTakeTestBtn).toBeInTheDocument()

    // Click "Take CBT Test"
    fireEvent.click(heroTakeTestBtn)

    // Verify scrollIntoView was called on the categories section
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    })

    // Verify user is still on Hub viewing categories (not switched directly into JAMB exam runner)
    expect(screen.getByText('Exam Categories')).toBeInTheDocument()
    expect(screen.getByText('WAEC SSCE')).toBeInTheDocument()
  })
})
