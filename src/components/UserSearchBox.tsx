import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Search, X, Loader } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  display_name: string
}

interface UserSearchBoxProps {
  onSelectUser: (user: User) => void
  placeholder?: string
  roleFilter?: string
}

export default function UserSearchBox({
  onSelectUser,
  placeholder = 'Search for a student, tutor, or institution...',
  roleFilter
}: UserSearchBoxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Debounced search function
  const handleSearch = useCallback((searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)

    const performSearch = async () => {
      try {
        const token = localStorage.getItem('access')
        const params = new URLSearchParams({ q: searchQuery, limit: '20' })
        if (roleFilter) {
          params.append('role', roleFilter)
        }

        const response = await axios.get(`${API_BASE}/messages/users/search/`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        })

        setResults(response.data.results || [])
        setShowResults(true)
      } catch (err) {
        console.error('Search failed:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Set new timer for debounce (300ms)
    const timer = setTimeout(performSearch, 300)
    setDebounceTimer(timer)
  }, [roleFilter, debounceTimer])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    handleSearch(value)
  }

  const handleSelectUser = (user: User) => {
    onSelectUser(user)
    setQuery('')
   setResults([])
    setShowResults(false)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{loading ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}</div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showResults && (results.length > 0 || (loading && query)) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {loading && !results.length ? (
            <div className="p-4 text-center text-gray-500">
              <Loader size={20} className="animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full px-4 py-3 text-left hover:bg-yellow-50 border-b border-gray-100 last:border-b-0 transition"
              >
                <div className="font-semibold text-gray-900">{user.display_name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div className="text-xs text-gray-500 capitalize mt-1">{user.role}</div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No users found</div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {showResults && query && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 z-50">
          No users found for "{query}"
        </div>
      )}
    </div>
  )
}
