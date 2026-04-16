import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
} from '@mui/material'
import { User, Mail, Building2, Save } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function Profile() {
  const [form, setForm] = useState<any>({ username: '', email: '', first_name: '', last_name: '', institution_name: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
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
      setErrorMessage('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setSaving(true)
    setSuccessMessage('')
    setErrorMessage('')
    try {
      const token = localStorage.getItem('access')
      await axios.put(`${API_BASE}/users/me/`, form, { headers: { Authorization: `Bearer ${token}` } })
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setErrorMessage('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  function onInstitutionChange(q: string) {
    setForm({ ...form, institution_name: q })
    setShowSuggestions(true)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    // @ts-ignore
    debounceRef.current = window.setTimeout(async () => {
      if (!q || q.length < 2) {
        setSuggestions([])
        return
      }
      try {
        const token = localStorage.getItem('access')
        const res = await axios.get(`${API_BASE}/institutions/`, { 
          headers: { Authorization: `Bearer ${token}` }, 
          params: { search: q, page_size: 10 } 
        })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 custom-scrollbar">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <Avatar
              sx={{
                width: 100,
                height: 100,
                background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                fontSize: '2.5rem',
                fontWeight: 'bold',
              }}
            >
              {form.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                {form.first_name && form.last_name 
                  ? `${form.first_name} ${form.last_name}` 
                  : form.username || 'User Profile'}
              </h1>
              <p className="text-gray-600 dark:text-slate-300">@{form.username}</p>
            </div>
          </div>
          <Divider />
        </div>

        {/* Messages */}
        {successMessage && (
          <Alert severity="success" className="mb-6">
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" className="mb-6">
            {errorMessage}
          </Alert>
        )}

        {/* Main Content Card */}
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg mb-8">
          <CardHeader className="pb-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
              <User className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-bold">Edit Profile Information</h2>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              
              {/* Name Section */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="First Name"
                    value={form.first_name || ''}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'transparent',
                        '& fieldset': {
                          borderColor: '#e5e7eb',
                        },
                        '&:hover fieldset': {
                          borderColor: '#fbbf24',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#f97316',
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Last Name"
                    value={form.last_name || ''}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'transparent',
                        '& fieldset': {
                          borderColor: '#e5e7eb',
                        },
                        '&:hover fieldset': {
                          borderColor: '#fbbf24',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#f97316',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Account Section */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Account Details
                </h3>
                <div className="space-y-4">
                  <TextField
                    label="Username"
                    value={form.username || ''}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'transparent',
                        '& fieldset': {
                          borderColor: '#e5e7eb',
                        },
                        '&:hover fieldset': {
                          borderColor: '#fbbf24',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#f97316',
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Email Address"
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'transparent',
                        '& fieldset': {
                          borderColor: '#e5e7eb',
                        },
                        '&:hover fieldset': {
                          borderColor: '#fbbf24',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#f97316',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Institution Section */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Educational Background
                </h3>
                <div className="relative">
                  <TextField
                    label="Institution"
                    value={form.institution_name || ''}
                    onChange={(e) => onInstitutionChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'transparent',
                        '& fieldset': {
                          borderColor: '#e5e7eb',
                        },
                        '&:hover fieldset': {
                          borderColor: '#fbbf24',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#f97316',
                        },
                      },
                    }}
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {suggestions.map((s: any) => (
                        <div
                          key={s.id}
                          className="px-4 py-3 hover:bg-yellow-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-colors"
                          onClick={() => pickInstitution(s.name)}
                        >
                          <div className="font-medium text-gray-900 dark:text-slate-100">{s.name}</div>
                          {s.description && (
                            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{s.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                    color: 'white',
                    fontWeight: 600,
                    py: 1.5,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    },
                  }}
                  onClick={save}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <Save className="w-5 h-5" />}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-slate-200">
            💡 <strong>Tip:</strong> Keep your profile information up to date to help us personalize your learning experience.
          </p>
        </div>
      </div>
    </div>
  )
}
