import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client.js'
import { endpoints } from '../api/endpoints.js'

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get(endpoints.orders)
      return response.data.results || response.data
    },
  })

  if (isLoading) return <p className="text-moss">Loading orders...</p>

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-ink">Orders</h1>
      <div className="space-y-3">
        {(data || []).map((order) => (
          <article key={order.id} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-ink">Order {order.id}</h2>
              <span className="rounded-full bg-cloud px-3 py-1 text-sm text-moss">{order.status}</span>
            </div>
            <p className="mt-2 text-moss">Payment: {order.payment_status}</p>
            <p className="mt-2 font-bold text-ink">${order.total_price}</p>
          </article>
        ))}
      </div>
      {!data?.length && <p className="rounded-lg bg-white p-6 text-moss">No orders yet.</p>}
    </section>
  )
}
