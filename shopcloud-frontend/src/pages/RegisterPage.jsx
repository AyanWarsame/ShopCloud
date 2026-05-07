import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../features/auth/authSlice.js'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { error, status } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirm: '' })
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (error) {
      setLocalError(error)
    }
  }, [error])

  useEffect(() => {
    if (status === 'succeeded') {
      navigate('/')
    }
  }, [status, navigate])

  const submit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (form.password !== form.password_confirm) {
      setLocalError('Passwords do not match')
      return
    }

    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters long')
      return
    }
    
    await dispatch(register(form))
  }

  return (
    <section className="mx-auto grid max-w-5xl overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm lg:grid-cols-[0.92fr_1.08fr]">
      <div className="bg-ink px-6 py-10 text-white sm:px-10">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/60">Join ShopCloud</p>
        <h1 className="mt-4 text-4xl font-black leading-tight">Create your commerce workspace.</h1>
        <p className="mt-4 leading-7 text-white/70">
          Start with a customer account, then browse inventory, save a cart, and place orders through the storefront.
        </p>
        <div className="mt-8 grid gap-3 text-sm font-semibold text-white/80">
          <span className="rounded-md bg-white/10 px-4 py-3">Secure account access</span>
          <span className="rounded-md bg-white/10 px-4 py-3">Saved cart and order history</span>
          <span className="rounded-md bg-white/10 px-4 py-3">Checkout-ready customer profile</span>
        </div>
      </div>
      <div className="px-6 py-10 sm:px-10">
        <h2 className="text-3xl font-black text-ink">Create account</h2>
        <p className="mt-2 text-sm leading-6 text-moss">Use a unique username and email address.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          {[
            ['username', 'Username'],
            ['email', 'Email address'],
            ['password', 'Password'],
            ['password_confirm', 'Confirm password'],
          ].map(([field, label]) => (
            <label key={field} className="block text-sm font-bold text-ink">
              {label}
              <input
                type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                className="focus-ring mt-2 w-full rounded-md border border-black/10 bg-cloud px-4 py-3 text-ink transition placeholder:text-moss/60 hover:border-black/20"
                autoComplete={field.includes('password') ? 'new-password' : field}
                required
              />
            </label>
          ))}
          {(localError || error) && (
            <p className="rounded-md border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">
              {localError || error}
            </p>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="focus-ring mt-2 w-full rounded-md bg-coral px-5 py-3 font-bold text-white shadow-sm transition hover:bg-[#d95f45] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'loading' ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-5 text-sm text-moss">
          Already have an account? <Link to="/login" className="font-bold text-ink">Sign in</Link>
        </p>
      </div>
    </section>
  )
}
