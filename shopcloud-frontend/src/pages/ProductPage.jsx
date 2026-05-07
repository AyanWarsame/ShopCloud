import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client.js'
import { endpoints } from '../api/endpoints.js'
import { useCart } from '../hooks/useCart.js'

export default function ProductPage() {
  const { slug } = useParams()
  const [quantity, setQuantity] = useState(1)
  const access = useSelector((state) => state.auth.access)
  const { addItem, status } = useCart()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await api.get(`${endpoints.products}${slug}/`)
      return response.data
    },
  })

  if (isLoading) return <p className="text-moss">Loading product...</p>
  if (!product) return <p className="text-coral">Product not found.</p>

  const image = product.images?.find((item) => item.is_primary)?.image || product.images?.[0]?.image

  return (
    <section className="grid gap-8 md:grid-cols-2">
      <div className="aspect-square rounded-lg bg-white p-4 shadow-sm">
        {image ? (
          <img src={image} alt={product.name} className="h-full w-full rounded-md object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center rounded-md bg-cloud text-moss">No image</div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-coral">{product.category?.name}</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{product.name}</h1>
        <p className="mt-4 text-moss">{product.description}</p>
        <p className="mt-6 text-3xl font-bold text-ink">${product.price}</p>
        <p className="mt-2 text-sm text-moss">{product.stock_quantity} in stock</p>

        {access ? (
          <div className="mt-6 flex max-w-sm gap-3">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="focus-ring w-24 rounded-md border border-black/10 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => addItem(product.id, quantity)}
              className="focus-ring rounded-md bg-coral px-5 py-2 font-semibold text-white"
            >
              {status === 'loading' ? 'Adding...' : 'Add to cart'}
            </button>
          </div>
        ) : (
          <Link to="/login" className="mt-6 inline-block rounded-md bg-ink px-5 py-2 font-semibold text-white">
            Sign in to buy
          </Link>
        )}
      </div>
    </section>
  )
}
