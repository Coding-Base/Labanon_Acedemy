import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export async function login(credentials: { username: string; password: string }) {
  // backend expects `username` as the login field (configured in Djoser)
  const res = await axios.post(`${API_BASE}/auth/jwt/create/`, credentials)
  return res.data
}

export async function refresh(token: string) {
  const res = await axios.post(`${API_BASE}/auth/jwt/refresh/`, { refresh: token })
  return res.data
}

export async function register(data: any) {
  const res = await axios.post(`${API_BASE}/auth/users/`, data)
  return res.data
}

export async function me(token: string) {
  const res = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } })
  return res.data
}
