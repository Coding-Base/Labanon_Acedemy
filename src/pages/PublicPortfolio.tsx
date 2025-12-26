import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function PublicPortfolio() {
  const { token } = useParams()
  const [portfolio, setPortfolio] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const res = await axios.get(`${API_BASE}/portfolios/by_token/`, { params: { token } })
        setPortfolio(res.data)
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Portfolio not found')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>
  if (!portfolio) return <div className="p-8">No portfolio available</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="relative">
        <div className="h-64 md:h-80 w-full overflow-hidden bg-gray-200">
          {portfolio.image ? (
            <img src={portfolio.image} alt={portfolio.title} className="w-full h-full object-cover object-center transform hover:scale-105 transition" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">{portfolio.institution_name}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="max-w-6xl mx-auto px-4 -mt-12 md:-mt-16">
          <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0">
              {portfolio.image ? (
                <img src={portfolio.image} alt={portfolio.title} className="w-28 h-28 md:w-36 md:h-36 rounded-lg object-cover shadow" />
              ) : (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-lg bg-gray-200 flex items-center justify-center text-xl">{portfolio.institution_name?.[0]}</div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold">{portfolio.title}</h1>
              <p className="text-sm text-gray-600 mt-1">{portfolio.institution_name}</p>
              <p className="mt-3 text-gray-700 leading-relaxed">{portfolio.overview || portfolio.description}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {portfolio.website && (
                  <a href={portfolio.website} target="_blank" rel="noreferrer" className="text-sm bg-indigo-600 text-white px-3 py-2 rounded shadow">Visit website</a>
                )}
                {portfolio.public_token && (
                  <button
                    onClick={() => navigator.clipboard?.writeText(window.location.href)}
                    className="text-sm border border-gray-200 px-3 py-2 rounded"
                  >
                    Copy link
                  </button>
                )}
              </div>
            </div>
            <aside className="w-full md:w-72">
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="text-sm font-semibold text-gray-700">Contact</h3>
                <div className="mt-2 text-sm text-gray-600">
                  {portfolio.email && <div>Email: <a href={`mailto:${portfolio.email}`} className="text-indigo-600">{portfolio.email}</a></div>}
                  {portfolio.phone && <div>Phone: <a href={`tel:${portfolio.phone}`} className="text-indigo-600">{portfolio.phone}</a></div>}
                  {portfolio.location && <div className="mt-2">{portfolio.location}</div>}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed">{portfolio.description}</p>
        </section>

        {portfolio.gallery_items && portfolio.gallery_items.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {portfolio.gallery_items.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="group block rounded-lg overflow-hidden shadow hover:shadow-lg focus:shadow-lg"
                >
                  <div className="relative h-48 bg-gray-100">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div className="p-3 bg-white">
                    <div className="font-semibold text-sm">{item.title}</div>
                    {item.description && <div className="text-xs text-gray-500 mt-1">{item.description}</div>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="max-w-4xl w-full bg-white rounded shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img src={selected.image} alt={selected.title} className="w-full max-h-[70vh] object-contain bg-black" />
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2">✕</button>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              {selected.description && <p className="text-sm text-gray-600 mt-2">{selected.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
