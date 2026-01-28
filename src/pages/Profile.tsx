import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function Profile() {
  const [form, setForm] = useState<any>({ username: '', email: '', first_name: '', last_name: '', institution_name: '' })
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } })
      setForm(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    try {
      const token = localStorage.getItem('access')
      await axios.put(`${API_BASE}/users/me/`, form, { headers: { Authorization: `Bearer ${token}` } })
      alert('Profile updated')
    } catch (err) {
      console.error(err)
      alert('Failed to update profile')
    }
  }

  function onInstitutionChange(q: string) {
    setForm({ ...form, institution_name: q })
    setShowSuggestions(true)
    // debounce
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    // @ts-ignore
    debounceRef.current = window.setTimeout(async () => {
      if (!q || q.length < 2) {
        setSuggestions([])
        return
      }
      try {
        const token = localStorage.getItem('access')
        const res = await axios.get(`${API_BASE}/institutions/`, { headers: { Authorization: `Bearer ${token}` }, params: { search: q, page_size: 10 } })
        // institutions may be paginated
        const items = res.data.results || res.data || []
        setSuggestions(items)
      } catch (err) {
        console.error(err)
      }
    }, 300)
  }

  function pickInstitution(name: string) {
    setForm({ ...form, institution_name: name })
    setShowSuggestions(false)
    setSuggestions([])
  }

  if (loading) return <div>Loading profile...</div>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Profile</h2>
      <div className="space-y-3 max-w-md relative">
        <label className="block">
          <div className="text-sm text-gray-600">Username</div>
          <input className="w-full border p-2 rounded" value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">Email</div>
          <input className="w-full border p-2 rounded" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">First name</div>
          <input className="w-full border p-2 rounded" value={form.first_name || ''} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">Last name</div>
          <input className="w-full border p-2 rounded" value={form.last_name || ''} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </label>
        <label className="block relative">
          <div className="text-sm text-gray-600">Institution</div>
          <input className="w-full border p-2 rounded" value={form.institution_name || ''} onChange={(e) => onInstitutionChange(e.target.value)} onFocus={() => setShowSuggestions(true)} />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 bg-white border rounded mt-1 z-50 max-h-48 overflow-auto">
              {suggestions.map((s: any) => (
                <div key={s.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => pickInstitution(s.name)}>
                  <div className="font-medium">{s.name}</div>
                  {s.description && <div className="text-xs text-gray-500">{s.description}</div>}
                </div>
              ))}
            </div>
          )}
        </label>
        <div className="pt-2">
          <button className="px-4 py-2 bg-yellow-600 text-white rounded" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}
