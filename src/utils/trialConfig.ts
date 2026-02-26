import axios from 'axios'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'
const LOCAL_KEY = 'trial_days'

export function getTrialDaysLocal(): number {
  const fromStorage = localStorage.getItem(LOCAL_KEY)
  if (fromStorage) {
    const n = Number(fromStorage)
    if (!isNaN(n) && n > 0) return n
  }
  const env = (import.meta.env as any).VITE_TRIAL_DAYS
  const envN = env ? Number(env) : NaN
  if (!isNaN(envN) && envN > 0) return envN
  return 30
}

export function setTrialDaysLocal(days: number) {
  if (typeof days === 'number' && days > 0) {
    localStorage.setItem(LOCAL_KEY, String(days))
  }
}

// Try to fetch trial days from server admin endpoint. If it fails, throw.
export async function fetchTrialDaysServer(): Promise<number> {
  const res = await axios.get(`${API_BASE}/admin/trial-days/`)
  // expected shape: { trial_days: number }
  const d = res.data?.trial_days
  const n = Number(d)
  if (isNaN(n) || n <= 0) throw new Error('Invalid trial days from server')
  // cache locally
  localStorage.setItem(LOCAL_KEY, String(n))
  return n
}

export async function saveTrialDaysServer(days: number): Promise<number> {
  // try PUT then POST
  const payload = { trial_days: Number(days) }
  const res = await axios.put(`${API_BASE}/admin/trial-days/`, payload).catch(async (e) => {
    return axios.post(`${API_BASE}/admin/trial-days/`, payload)
  })
  const d = res.data?.trial_days ?? days
  localStorage.setItem(LOCAL_KEY, String(d))
  return Number(d)
}

export default {
  getTrialDaysLocal,
  setTrialDaysLocal,
  fetchTrialDaysServer,
  saveTrialDaysServer,
}
