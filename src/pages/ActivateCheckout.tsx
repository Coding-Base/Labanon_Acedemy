import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PaymentCheckout from '../components/PaymentCheckout'
import axios from 'axios'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

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

  const type = query.get('type') || 'exam'
  const exam_id = query.get('exam_id')
  const subject_id = query.get('subject_id')
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

  if (loading) return <div className="p-8">Loading activation checkout...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>
  if (amount === null) return <div className="p-8">No activation amount available.</div>

  // Determine an item id to send to backend. For subject unlock pass subject id, for exam unlock pass 0 and include exam identifier in meta.
  const itemId = subject_id ? Number(subject_id) : 0
  const meta: any = { activation_type: type }
  if (exam_id) meta.exam_id = exam_id
  if (subject_id) meta.subject_id = subject_id
  const defaultReturn = `/student/cbt${exam_id ? `?exam_id=${encodeURIComponent(exam_id)}` : ''}${subject_id ? `${exam_id ? '&' : '?'}subject_id=${encodeURIComponent(subject_id)}` : ''}`
  const returnTo = return_to_q ? decodeURIComponent(return_to_q) : defaultReturn

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-sm text-gray-600 mb-6">To access this exam or subject, please complete activation payment.</p>

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
