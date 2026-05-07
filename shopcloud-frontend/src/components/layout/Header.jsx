import { Link, NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/auth/authSlice.js'
import { clearLocalCart } from '../../features/cart/cartSlice.js'

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-ink text-white shadow-sm' : 'text-moss hover:bg-white hover:text-ink'
  }`

export default function Header() {
  const dispatch = useDispatch()
  const { user, access } = useSelector((state) => state.auth)
  const totalItems = useSelector((state) => state.cart.cart?.total_items || 0)

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearLocalCart())
  }

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-cloud/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-3 text-xl font-bold tracking-normal text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-sm font-black text-white">SC</span>
          <span>ShopCloud</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2">
          <NavLink to="/" className={navClass}>
            Products
          </NavLink>
          {access && (
            <>
              <NavLink to="/cart" className={navClass}>
                Cart {totalItems ? `(${totalItems})` : ''}
              </NavLink>
              <NavLink to="/orders" className={navClass}>
                Orders
              </NavLink>
              {user?.role !== 'customer' && (
                <NavLink to="/dashboard" className={navClass}>
                  Dashboard
                </NavLink>
              )}
            </>
          )}
          {access ? (
            <button
              type="button"
              onClick={handleLogout}
              className="focus-ring rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-black/20"
            >
              Sign out
            </button>
          ) : (
            <NavLink to="/login" className={navClass}>
              Sign in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
