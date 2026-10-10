import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from "./components/protectedRoute"
import PublicRoute from './components/PublicRoute'
import SelectRole from "./pages/SelectRole"
import { useAppData } from './context/AppContext'
import Resturent from './pages/Resturent'
import Account from './pages/Account'
import Cart from './pages/Cart'
import RestaurantPage from './pages/RestaurentPage'
import AddressManager from './pages/AddressManager'
import CheckOut from "./pages/CheckOut"
import OrderSuccess from "./pages/OrderSuccess"
import AllOrder from "./pages/AllOrder"
import OrderStatus from "./pages/OrderStatus"
import RiderDashboard from "./pages/RiderDashboard"

const App = () => {
  const { user, loading } = useAppData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Seller routes */}
        {user?.role === "seller" && (
          <Route path="/*" element={<Resturent />} />
        )}

        {/* Rider routes */}
        {user?.role === "rider" && (
          <Route path="/*" element={<RiderDashboard />} />
        )}

        {/* Customer & unauthenticated routes */}
        {(!user || user?.role === "customer" || !user?.role) && (
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/account" element={<Account />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/order/:id" element={<OrderStatus />} />
            <Route path="/order-success/:id" element={<OrderSuccess />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<CheckOut />} />
            <Route path="/AllOrder" element={<AllOrder />} />
            <Route path="/address" element={<AddressManager />} />
          </Route>
        )}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App