import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../features/auth/authSlice.js'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ username: '', password: '' })

  const submit = async (event) => {
    event.preventDefault()
    const result = await dispatch(login(form))
    if (!result.error) {
      navigate(location.state?.from?.pathname || '/')
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-black/10 bg-white p-8 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-coral">Welcome back</p>
      <h1 className="mt-3 text-3xl font-black text-ink">Sign in</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block text-sm font-bold text-ink">
          Username
          <input
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            className="focus-ring mt-2 w-full rounded-md border border-black/10 bg-cloud px-4 py-3"
            required
          />
        </label>
        <label className="block text-sm font-bold text-ink">
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="focus-ring mt-2 w-full rounded-md border border-black/10 bg-cloud px-4 py-3"
            required
          />
        </label>
        {error && (
          <p className="rounded-md border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">
            {error}
          </p>
        )}
        <button type="submit" className="focus-ring w-full rounded-md bg-coral px-5 py-3 font-bold text-white shadow-sm">
          {status === 'loading' ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-sm text-moss">
        New here? <Link to="/register" className="font-bold text-ink">Create an account</Link>
      </p>
    </section>
  )
}
