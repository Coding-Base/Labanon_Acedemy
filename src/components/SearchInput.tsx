import React, { useEffect } from 'react'
import { Search } from 'lucide-react'
import useDebounce from '../utils/useDebounce'

interface Props {
  value: string
  onChange: (v: string) => void
  onDebounced?: (v: string) => void
  onEnter?: () => void
  placeholder?: string
  delay?: number
  className?: string
}

export default function SearchInput({ value, onChange, onDebounced, onEnter, placeholder = 'Search...', delay = 350, className = '' }: Props) {
  const debounced = useDebounce(value, delay)

  useEffect(() => {
    if (onDebounced) onDebounced(debounced)
  }, [debounced])

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter() }}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
      />
    </div>
  )
}
