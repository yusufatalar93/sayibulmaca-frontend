import { auth } from '../firebase'

const BASE_URL = import.meta.env.VITE_API_URL || ''

async function fetchWithAuth(endpoint, options = {}) {
  const headers = { ...options.headers }
  
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken()
    headers['Authorization'] = `Bearer ${token}`
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const text = await response.text()
    try {
      const json = JSON.parse(text)
      throw new Error(json.message || text || response.statusText)
    } catch (e) {
      if (e instanceof SyntaxError) throw new Error(text || response.statusText)
      throw e
    }
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export default {
  get: (endpoint) => fetchWithAuth(endpoint),
  post: (endpoint, body) => fetchWithAuth(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => fetchWithAuth(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => fetchWithAuth(endpoint, { method: 'DELETE' })
}
