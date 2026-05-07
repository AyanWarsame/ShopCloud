import { useSelector } from 'react-redux'

export default function DashboardPage() {
  const user = useSelector((state) => state.auth.user)

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-moss">Signed in as</p>
          <p className="mt-2 font-semibold text-ink">{user?.email || user?.username}</p>
        </article>
        <article className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-moss">Role</p>
          <p className="mt-2 font-semibold capitalize text-ink">{user?.role || 'customer'}</p>
        </article>
        <article className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-moss">Catalog tools</p>
          <p className="mt-2 font-semibold text-ink">API-backed</p>
        </article>
      </div>
    </section>
  )
}
