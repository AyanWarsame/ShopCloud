import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client.js'
import { endpoints } from '../api/endpoints.js'

function primaryImage(product) {
  if (!product) return null
  return product.images?.find((image) => image.is_primary)?.image || product.images?.[0]?.image
}

const categoryLooks = [
  {
    surface: 'bg-[#ffe7de]',
    accent: 'bg-coral',
    text: 'text-[#5f2417]',
    pattern: 'from-[#ffe7de] via-[#ffd2c1] to-[#f7a27f]',
  },
  {
    surface: 'bg-[#e4f3ea]',
    accent: 'bg-moss',
    text: 'text-[#18382a]',
    pattern: 'from-[#e4f3ea] via-[#c5e7d2] to-[#83bd9b]',
  },
  {
    surface: 'bg-[#fff1cf]',
    accent: 'bg-gold',
    text: 'text-[#5b3b08]',
    pattern: 'from-[#fff1cf] via-[#f8dc91] to-[#d49b35]',
  },
  {
    surface: 'bg-[#e4ecff]',
    accent: 'bg-[#4761c9]',
    text: 'text-[#1c2a66]',
    pattern: 'from-[#e4ecff] via-[#bfccff] to-[#6d7ee8]',
  },
  {
    surface: 'bg-[#ffe3ef]',
    accent: 'bg-[#c84c7e]',
    text: 'text-[#6d183c]',
    pattern: 'from-[#ffe3ef] via-[#f7b8d1] to-[#d86295]',
  },
]

function getCategoryLook(index) {
  return categoryLooks[index % categoryLooks.length]
}

export default function HomePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get(endpoints.products)
      return response.data.results || response.data
    },
  })
  const { data: categoryData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get(endpoints.categories)
      return response.data.results || response.data
    },
  })

  const products = data || []
  const categories = categoryData || []
  const visibleProducts =
    selectedCategoryId === 'all'
      ? products
      : products.filter((product) => product.category?.id === selectedCategoryId)
  const featuredProduct = products.find((product) => primaryImage(product)) || products[0]
  const activeCategory = categories.find((category) => category.id === selectedCategoryId)
  const productCountByCategory = products.reduce((counts, product) => {
    if (!product.category?.id) return counts
    return { ...counts, [product.category.id]: (counts[product.category.id] || 0) + 1 }
  }, {})

  return (
    <section className="space-y-12">
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="grid min-h-[390px] lg:grid-cols-[0.96fr_1.04fr]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-coral">Cloud retail, grounded ops</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight text-ink sm:text-5xl">
              Shop lively collections from one clean storefront.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-moss">
              Move from beauty finds to electronics, fashion, and home essentials with a storefront built for fast browsing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="focus-ring rounded-md bg-ink px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-black"
              >
                Create account
              </Link>
              <a
                href="#catalog"
                className="focus-ring rounded-md border border-black/10 bg-cloud px-5 py-3 text-sm font-bold text-ink transition hover:border-black/20"
              >
                Browse catalog
              </a>
            </div>
          </div>
          <div className="bg-ink p-5 sm:p-7">
            <div className="grid h-full min-h-[320px] grid-cols-2 gap-3">
              {(categories.length ? categories : [{ id: 'fallback', name: 'Curated catalog', slug: 'catalog' }])
                .slice(0, 5)
                .map((category, index) => {
                  const look = getCategoryLook(index)
                  const isWide = index === 0 || index === 3

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`group relative overflow-hidden rounded-lg p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                        isWide ? 'col-span-2 sm:col-span-1' : ''
                      } ${look.surface}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${look.pattern} opacity-80`} />
                      <div className="absolute inset-x-4 bottom-4 top-1/2 border-t border-black/10" />
                      <div className="relative flex h-full min-h-[112px] flex-col justify-between">
                        <span className={`h-2 w-12 rounded-full ${look.accent}`} />
                        <div>
                          <p className={`text-xl font-black leading-tight ${look.text}`}>{category.name}</p>
                          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-black/55">
                            {productCountByCategory[category.id] || 0} products
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
        <div className="grid border-t border-black/10 bg-cloud sm:grid-cols-3">
          {['Beauty and style', 'Electronics and home', 'Fast customer checkout'].map((item) => (
            <div key={item} className="border-black/10 px-6 py-4 text-sm font-bold text-ink sm:border-r last:sm:border-r-0">
              {item}
            </div>
          ))}
        </div>
      </div>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-coral">Shop by category</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Explore collections</h2>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`focus-ring hidden rounded-md px-4 py-2 text-sm font-bold transition sm:block ${
              selectedCategoryId === 'all' ? 'bg-ink text-white' : 'bg-white text-ink shadow-sm hover:bg-cloud'
            }`}
          >
            View all
          </button>
        </div>

        {categoriesLoading && <p className="text-moss">Loading categories...</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category, index) => {
            const look = getCategoryLook(index)
            const isSelected = selectedCategoryId === category.id

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className={`focus-ring group overflow-hidden rounded-lg border p-0 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected ? 'border-ink bg-white ring-2 ring-ink/10' : 'border-black/10 bg-white'
                }`}
              >
                <div className={`h-24 bg-gradient-to-br ${look.pattern}`}>
                  {category.image && (
                    <img src={category.image} alt={category.name} className="h-full w-full object-cover mix-blend-multiply" />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-base font-black text-ink">{category.name}</p>
                  <p className="mt-2 text-sm font-semibold text-moss">
                    {productCountByCategory[category.id] || 0} products ready
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <div id="catalog" className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-coral">Catalog</p>
          <h2 className="mt-2 text-3xl font-black text-ink">
            {activeCategory ? activeCategory.name : 'Latest products'}
          </h2>
        </div>
        <p className="hidden max-w-sm text-right text-sm leading-6 text-moss sm:block">
          {activeCategory
            ? `Showing products from ${activeCategory.name}.`
            : 'Clean product cards with price, category, and quick access to the product detail page.'}
        </p>
      </div>

      {isLoading && <p className="text-moss">Loading products...</p>}
      {error && <p className="text-coral">Could not load products yet.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.slug}`}
            className="group overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="aspect-[4/3] bg-cloud">
              {primaryImage(product) && (
                <img
                  src={primaryImage(product)}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <div className="p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-moss">{product.category?.name || 'Catalog'}</p>
              <h3 className="mt-2 text-lg font-black text-ink">{product.name}</h3>
              <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-moss">{product.short_description}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-lg font-black text-ink">${product.price}</p>
                <span className="rounded-md bg-cloud px-3 py-1 text-xs font-bold text-ink">View</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && !visibleProducts.length && (
        <div className="rounded-lg border border-black/10 bg-white p-6 text-moss shadow-sm">
          No products are in this category yet. Add products in Django admin and they will appear here automatically.
        </div>
      )}
    </section>
  )
}
