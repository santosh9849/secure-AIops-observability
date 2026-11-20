
import axios from 'axios'

// Main FastAPI backend
const API_BASE_URL = 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Automatically attach the user's access token.
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Authenticate a user.
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  })

  return response.data
}

// Check backend health.
export const getHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

// Get latest telemetry.
export const getLatestTelemetry = async () => {
  const response = await api.get('/latest')
  return response.data
}

// Get telemetry history.
export const getTelemetryHistory = async (sourceId) => {
  const response = await api.get(
    `/history/${encodeURIComponent(sourceId)}`
  )
  return response.data
}

// Get registered collectors.
export const getCollectors = async () => {
  const response = await api.get('/collectors')
  return response.data
}

// Get stored incidents.
export const getIncidents = async (status) => {
  const response = await api.get('/incidents', {
    params: status ? { status } : {},
  })
  return response.data
}

// Run AIOps analysis.
export const runAIOpsAnalysis = async (sourceId, limit = 20) => {
  const response = await api.post(
    `/aiops/analyze/${encodeURIComponent(sourceId)}`,
    null,
    { params: { limit } }
  )
  return response.data
}

export default api
