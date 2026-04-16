import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PaymentCheckout from '../components/PaymentCheckout'
import SubjectLockingModal from '../components/cbt/SubjectLockingModal'
import axios from 'axios'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

interface Exam {
  id: number
  title: string
}

interface Subject {
  id: number
  name: string
  description: string
  question_count: number
}

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function ActivateCheckout() {
  const query = useQuery()
  const navigate = useNavigate()
  const [amount, setAmount] = useState<number | null>(null)
  const [currency, setCurrency] = useState<string>('NGN')
  const [title, setTitle] = useState('Activation')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Subject selection state for exam unlocks
  const [showSubjectSelection, setShowSubjectSelection] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([])
  const [exam, setExam] = useState<Exam | null>(null)

  const type = query.get('type') || 'exam'
  const exam_id = query.get('exam_id')
  const subject_id = query.get('subject_id')
  const account_role = query.get('account_role')
  const return_to_q = query.get('return_to')

  useEffect(() => {
    let mounted = true
    async function loadFee() {
      setLoading(true)
      try {
        // Try to fetch admin-set activation fee
        const params: any = { type }
        if (exam_id) params.exam = exam_id
        if (subject_id) params.subject = subject_id
        if (account_role) params.account_role = account_role

        const token = localStorage.getItem('access')
        const res = await axios.get(`${API_BASE}/payments/activation-fee/`, { params, headers: token ? { Authorization: `Bearer ${token}` } : undefined })
        if (!mounted) return
        const amt = res.data.amount ?? null
        const cur = res.data.currency || 'NGN'
        if (amt === null || amt === undefined) {
          setError('Activation fee not configured. Please contact support.')
        } else {
          setAmount(Number(amt))
          setCurrency(String(cur).toUpperCase())
          if (type === 'interview' && query.get('subject_name')) {
            setTitle(`Unlock: ${query.get('subject_name')}`)
          } else if (type === 'exam' && query.get('exam_title')) {
            setTitle(`Unlock Exam: ${query.get('exam_title')}`)
            // For CBT exams: load exam data and show subject selection modal
            if (exam_id) {
              try {
                const examRes = await axios.get(`${API_BASE}/cbt/exams/${exam_id}/`)
                setExam(examRes.data)
                // Only show subject selection for JAMB exams — other exams unlock all subjects
                const title = String(examRes.data?.title || '').toLowerCase()
                const slug = String(examRes.data?.slug || '').toLowerCase()
                if (title.includes('jamb') || slug === 'jamb') {
                  setShowSubjectSelection(true)
                }
              } catch (err) {
                console.error('Failed to load exam data:', err)
              }
            }
          } else {
            setTitle('Account Activation')
          }
        }
      } catch (err) {
        console.error('Failed to load activation fee', err)
        setError('Failed to load activation fee. Try again later.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadFee()
    return () => { mounted = false }
  }, [type, exam_id, subject_id])

  const handleSubjectsSelected = (subjects: Subject[], subjectIds: number[]) => {
    setSelectedSubjects(subjects)
    setSelectedSubjectIds(subjectIds)
    setShowSubjectSelection(false)
  }

  if (loading) return <div className="p-8">Loading activation checkout...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>
  if (amount === null) return <div className="p-8">No activation amount available.</div>

  // If we're showing subject selection modal, don't show payment yet
  if (showSubjectSelection) {
    return (
      <>
        <div className="max-w-3xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <p className="text-sm text-gray-600 mb-6">First, select the subjects you want to focus on for this exam.</p>
        </div>
        <SubjectLockingModal
          isOpen={showSubjectSelection}
          exam={exam}
          onSubjectsSelected={handleSubjectsSelected}
          onClose={() => {
            setShowSubjectSelection(false)
            navigate(-1)
          }}
        />
      </>
    )
  }

  // Once subjects are selected (or type is not exam), show payment
  const itemId = subject_id ? Number(subject_id) : 0
  const meta: any = { activation_type: type }
  if (exam_id) meta.exam_id = exam_id
  if (subject_id) meta.subject_id = subject_id
  if (account_role) meta.activation_role = account_role
  
  // NEW: Include selected subject IDs for CBT exam unlocks
  if (type === 'exam' && selectedSubjectIds.length > 0) {
    meta.selected_subject_ids = selectedSubjectIds
  }
  
  const defaultReturn = `/student/cbt${exam_id ? `?exam_id=${encodeURIComponent(exam_id)}` : ''}${subject_id ? `${exam_id ? '&' : '?'}subject_id=${encodeURIComponent(subject_id)}` : ''}`
  const returnTo = return_to_q ? decodeURIComponent(return_to_q) : defaultReturn

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {selectedSubjects.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-900 mb-2">Selected Subjects:</p>
          <p className="text-green-800">{selectedSubjects.map(s => s.name).join(', ')}</p>
        </div>
      )}
      <p className="text-sm text-gray-600 mb-6">Complete your payment to unlock this exam.</p>

      <PaymentCheckout
        itemId={itemId}
        itemType={'activation'}
        amount={amount}
        currency={currency}
        itemTitle={title}
        meta={meta}
        returnTo={returnTo}
        onSuccess={() => {
          navigate(returnTo)
        }}
      />
    </div>
  )
}
