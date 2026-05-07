import axios from 'axios'
import { endpoints } from './endpoints.js'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopcloud_access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const refresh = localStorage.getItem('shopcloud_refresh')

    if (error.response?.status === 401 && refresh && !original._retry) {
      original._retry = true
      const baseURL = api.defaults.baseURL || ''
      const { data } = await axios.post(`${baseURL}${endpoints.refresh}`, { refresh })
      localStorage.setItem('shopcloud_access', data.access)
      original.headers.Authorization = `Bearer ${data.access}`
      return api(original)
    }

    return Promise.reject(error)
  },
)
