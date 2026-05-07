import { useDispatch, useSelector } from 'react-redux'
import { addCartItem, fetchCart, removeCartItem, updateCartItem } from '../features/cart/cartSlice.js'

export function useCart() {
  const dispatch = useDispatch()
  const cartState = useSelector((state) => state.cart)

  return {
    ...cartState,
    fetchCart: () => dispatch(fetchCart()),
    addItem: (productId, quantity) => dispatch(addCartItem({ productId, quantity })),
    updateItem: (itemId, quantity) => dispatch(updateCartItem({ itemId, quantity })),
    removeItem: (itemId) => dispatch(removeCartItem(itemId)),
  }
}
