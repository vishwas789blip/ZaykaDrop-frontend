import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
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
    return <div className='text-2xl font-bold'>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      {user?.role === "seller" ? (
        <Resturent />
      ) : user?.role === "rider" ? (
        <RiderDashboard />
      ) : (
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
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
        </Routes>
      )}
    </BrowserRouter>
  )
}

export default App