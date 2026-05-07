import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart.js'

export default function CartPage() {
  const { cart, updateItem, removeItem } = useCart()
  const items = cart?.items || []

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-ink">Cart</h1>
      {!items.length && <p className="rounded-lg bg-white p-6 text-moss">Your cart is empty.</p>}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-4 rounded-lg bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <h2 className="font-semibold text-ink">{item.product.name}</h2>
              <p className="text-sm text-moss">${item.product.price}</p>
            </div>
            <input
              type="number"
              min="0"
              value={item.quantity}
              onChange={(event) => updateItem(item.id, Number(event.target.value))}
              className="focus-ring w-24 rounded-md border border-black/10 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="focus-ring rounded-md border border-black/10 px-3 py-2 text-sm font-medium text-ink"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {!!items.length && (
        <div className="flex items-center justify-between rounded-lg bg-white p-5 shadow-sm">
          <p className="text-xl font-bold text-ink">Total: ${cart.total_price}</p>
          <Link to="/checkout" className="rounded-md bg-coral px-5 py-2 font-semibold text-white">
            Checkout
          </Link>
        </div>
      )}
    </section>
  )
}
