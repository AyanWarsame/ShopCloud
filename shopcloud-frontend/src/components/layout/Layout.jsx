import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadCurrentUser } from '../../features/auth/authSlice.js'
import { fetchCart } from '../../features/cart/cartSlice.js'
import Header from './Header.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const dispatch = useDispatch()
  const access = useSelector((state) => state.auth.access)

  useEffect(() => {
    if (access) {
      dispatch(loadCurrentUser())
      dispatch(fetchCart())
    }
  }, [access, dispatch])

  return (
    <div className="flex min-h-screen flex-col bg-cloud">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
