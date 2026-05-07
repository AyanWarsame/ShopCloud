import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../../api/client.js'
import { endpoints } from '../../api/endpoints.js'

const initialState = {
  user: null,
  access: localStorage.getItem('shopcloud_access'),
  refresh: localStorage.getItem('shopcloud_refresh'),
  status: 'idle',
  error: null,
}

function formatApiError(error, fallback) {
  const data = error.response?.data

  if (!data) {
    return error.message || fallback
  }

  if (typeof data === 'string') {
    return error.response?.status >= 500 ? 'The server hit an error. Please try again in a moment.' : data
  }

  if (data.detail) {
    return data.detail
  }

  const messages = Object.entries(data)
    .map(([field, value]) => {
      const message = Array.isArray(value) ? value[0] : value
      return `${field.replace('_', ' ')}: ${message}`
    })
    .join(', ')

  return messages || fallback
}

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post(endpoints.token, credentials)
    localStorage.setItem('shopcloud_access', data.access)
    localStorage.setItem('shopcloud_refresh', data.refresh)
    const profile = await api.get(endpoints.me)
    return { ...data, user: profile.data }
  } catch (error) {
    return rejectWithValue(formatApiError(error, 'Sign in failed'))
  }
})

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    await api.post(endpoints.register, payload)
    
    const tokenResponse = await api.post(endpoints.token, {
      username: payload.username,
      password: payload.password,
    })
    
    localStorage.setItem('shopcloud_access', tokenResponse.data.access)
    localStorage.setItem('shopcloud_refresh', tokenResponse.data.refresh)
    
    const profileResponse = await api.get(endpoints.me)
    
    return { 
      access: tokenResponse.data.access, 
      refresh: tokenResponse.data.refresh,
      user: profileResponse.data 
    }
  } catch (error) {
    return rejectWithValue(formatApiError(error, 'Registration failed'))
  }
})

export const loadCurrentUser = createAsyncThunk('auth/me', async () => {
  const { data } = await api.get(endpoints.me)
  return data
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.access = null
      state.refresh = null
      localStorage.removeItem('shopcloud_access')
      localStorage.removeItem('shopcloud_refresh')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.access = action.payload.access
        state.refresh = action.payload.refresh
        state.user = action.payload.user
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || action.error.message
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.access = action.payload.access
        state.refresh = action.payload.refresh
        state.user = action.payload.user
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || action.error.message
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
