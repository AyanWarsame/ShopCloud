import { Route, Routes } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import CartPage from '../pages/CartPage.jsx'
import CheckoutPage from '../pages/CheckoutPage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import HomePage from '../pages/HomePage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import OrdersPage from '../pages/OrdersPage.jsx'
import ProductPage from '../pages/ProductPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
