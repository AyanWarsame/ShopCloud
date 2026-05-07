import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../../api/client.js'
import { endpoints } from '../../api/endpoints.js'

const initialState = {
  cart: null,
  status: 'idle',
  error: null,
}

export const fetchCart = createAsyncThunk('cart/fetch', async () => {
  const { data } = await api.get(endpoints.cart)
  return data
})

export const addCartItem = createAsyncThunk('cart/addItem', async ({ productId, quantity = 1 }) => {
  const { data } = await api.post(endpoints.cartItems, { product_id: productId, quantity })
  return data
})

export const updateCartItem = createAsyncThunk('cart/updateItem', async ({ itemId, quantity }) => {
  const { data } = await api.put(`${endpoints.cartItems}${itemId}/`, { quantity })
  return data
})

export const removeCartItem = createAsyncThunk('cart/removeItem', async (itemId) => {
  const { data } = await api.delete(`${endpoints.cartItems}${itemId}/`)
  return data
})

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearLocalCart(state) {
      state.cart = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher((action) => action.type.startsWith('cart/') && action.type.endsWith('/pending'), (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addMatcher((action) => action.type.startsWith('cart/') && action.type.endsWith('/fulfilled'), (state, action) => {
        state.status = 'succeeded'
        state.cart = action.payload
      })
      .addMatcher((action) => action.type.startsWith('cart/') && action.type.endsWith('/rejected'), (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  },
})

export const { clearLocalCart } = cartSlice.actions
export default cartSlice.reducer
