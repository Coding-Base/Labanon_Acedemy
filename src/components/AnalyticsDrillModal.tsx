import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { X as CloseIcon } from 'lucide-react'

interface Props {
  open: boolean
  type: 'registrations' | 'downloads' | null
  onClose: () => void
  apiBase: string
  token?: string | null
  darkMode?: boolean
}

export default function AnalyticsDrillModal({ open, type, onClose, apiBase, token, darkMode }: Props) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')

  useEffect(() => {
    if (!open) return
    setStart('')
    setEnd('')
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type])

  async function load() {
    if (!type) return
    setLoading(true)
    try {
      const params: any = {}
      if (start) params.start = start
      if (end) params.end = end
      const url = type === 'registrations' ? `${apiBase}/analytics/registrations/` : `${apiBase}/analytics/downloads/`
      const res = await axios.get(url, { params, headers: token ? { Authorization: `Bearer ${token}` } : {} })
      setData(res.data)
    } catch (e) {
      console.error('Failed to load drill data', e)
      setData(null)
    } finally { setLoading(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className={`${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-gray-900'} relative w-full max-w-4xl rounded-lg shadow-lg overflow-hidden z-10`}> 
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">{type === 'registrations' ? 'Registrations Details' : 'Downloads Details'}</h3>
            <div className="text-sm text-gray-500">Filter the date range and inspect timeseries</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded"><CloseIcon className="w-5 h-5" /></button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-gray-500">Start</label>
            <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} className="px-3 py-2 border rounded" />
            <label className="text-sm text-gray-500">End</label>
            <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} className="px-3 py-2 border rounded" />
            <button onClick={load} className="ml-auto px-3 py-2 bg-yellow-600 text-white rounded">Apply</button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div>
              {type === 'registrations' && data && (
                <div>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={data.timeseries || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#F59E0B" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Summary</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded border bg-gray-50">Today: <div className="font-bold">{data.daily}</div></div>
                      <div className="p-3 rounded border bg-gray-50">Weekly: <div className="font-bold">{data.weekly}</div></div>
                      <div className="p-3 rounded border bg-gray-50">Monthly: <div className="font-bold">{data.monthly}</div></div>
                    </div>
                  </div>
                </div>
              )}

              {type === 'downloads' && data && (
                <div>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={data.timeseries || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#3B82F6" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Top Downloads</h4>
                    <div className="max-h-56 overflow-y-auto border rounded">
                      {data.top && data.top.length > 0 ? (
                        data.top.map((t:any, i:number) => (
                          <div key={i} className="p-3 flex items-center justify-between border-b">
                            <div className="truncate max-w-[80%]">{t.full_url}</div>
                            <div className="text-sm font-semibold">{t.count}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-gray-500">No downloads found</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!data && <div className="text-sm text-gray-500">No data available for this selection.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
