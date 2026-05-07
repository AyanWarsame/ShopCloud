import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { endpoints } from '../api/endpoints.js'
import { useCart } from '../hooks/useCart.js'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart } = useCart()
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    setError('')
    setIsSubmitting(true)
    try {
      const address = await api.post(endpoints.addresses, form)
      const order = await api.post(endpoints.createOrder, { shipping_address_id: address.data.id })
      navigate(`/orders?created=${order.data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="grid gap-6 md:grid-cols-[1fr_360px]">
      <form onSubmit={submit} className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-ink">Checkout</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Object.keys(form).map((key) => (
            <label key={key} className="text-sm font-medium text-ink">
              {key.replaceAll('_', ' ')}
              <input
                name={key}
                value={form[key]}
                onChange={update}
                required
                className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
              />
            </label>
          ))}
        </div>
        {error && <p className="mt-4 text-coral">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring mt-6 rounded-md bg-coral px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Placing order...' : 'Place order'}
        </button>
      </form>
      <aside className="h-fit rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Summary</h2>
        <p className="mt-3 text-moss">{cart?.total_items || 0} items</p>
        <p className="mt-2 text-2xl font-bold text-ink">${cart?.total_price || 0}</p>
      </aside>
    </section>
  )
}
