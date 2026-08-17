import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { IMenuItem, IRestaurant } from '../types';
import axios from 'axios';
import { useAppData } from '../context/AppContext';
import { resturentService } from '../utils/constant';
import Navbar from '../components/NavBar';
import { ShoppingBag, Plus, Minus, MapPin, Phone } from 'lucide-react';
import FloatingCartBar from "../components/FloatingCartBar";


const RestaurantPage = () => {
  const { id } = useParams();
  const { fetchMenu, menuItems, loadingMenu, cart, fetchCart, setMenuItems } = useAppData();

  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchRestaurant = async () => {
      try {
        const { data } = await axios.get(`${resturentService}/api/restaurant/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setRestaurant(data.restaurant || null);
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
    fetchMenu(id);

    return () => setMenuItems([]); // clear stale menu on leave
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateQuantity = async (itemId: string, currentQty: number, change: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newQty = currentQty + change;
    try {
      setAddingId(itemId);
      if (newQty <= 0) {
        // quantity 0 ho gayi — remove karo
        await axios.delete(`${resturentService}/api/cart/remove/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (change > 0) {
        // quantity badhani hai — add route use karo ($inc already karta hai +1)
        await axios.post(`${resturentService}/api/cart/add`, {
          itemId,
          restaurantId: id,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // quantity ghatani hai — remove route use karo (backend -1 karta hai)
        await axios.delete(`${resturentService}/api/cart/remove/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await fetchCart();
    } catch (error) {
      console.error("Cart adjustment failed:", error);
    } finally {
      setAddingId(null);
    }
  };

  const handleAddToCart = async (itemId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setAddingId(itemId);
      await axios.post(`${resturentService}/api/cart/add`, {
        itemId,
        restaurantId: id,  // ✅ required by backend
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCart();
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium text-sm animate-pulse">Loading Menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        Restaurant not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 antialiased pb-24">
      <Navbar />

      {/* Hero Cover */}
      <div className="relative h-52 w-full bg-gray-900 overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover opacity-50 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-transparent to-transparent" />
      </div>

      {/* Restaurant Info Card */}
      <div className="max-w-3xl mx-auto px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100/80 overflow-hidden">

          {/* Orange accent top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-orange-400 to-yellow-400" />

          <div className="p-6 space-y-5">
            {/* Name + status */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <h1 style={{ color: '#000000' }} className="text-2xl md:text-3xl font-black leading-tight">
                  {restaurant.name}
                </h1>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  {restaurant.description || "Fresh food, served with care"}
                </p>
              </div>

              {/* Pulsing status badge */}
              <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                restaurant.isOpen
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-500 border-red-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${restaurant.isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
                {restaurant.isOpen ? "Open Now" : "Closed"}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Contact & Location */}
            <div className="flex flex-col sm:flex-row gap-3 text-xs text-gray-500 font-medium">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-[#FF9933] shrink-0 mt-0.5" />
                <span className="truncate">{restaurant.autoLocation?.formattedAddress || "Nearby Location"}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                <Phone className="w-3 h-3 text-[#FF9933]" />
                <span className="font-semibold text-gray-700">{restaurant.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
            <h2 style={{ color: '#000000' }} className="text-xl font-black tracking-tight">
              🍽️ Full Order Menu
            </h2>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
              {menuItems.length} Items
            </span>
          </div>

          {loadingMenu ? (
            <div className="text-sm text-gray-400 py-16 text-center animate-pulse">
              Loading delicious items...
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-6">
              <p className="text-sm text-gray-400 font-medium">
                This restaurant hasn't added any items yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {menuItems.map((item: IMenuItem) => {

                // FIX 2: Safe string comparison for cart item lookup
                const cartItem = cart.find(
                  (c) => (c.itemId?._id || c.itemId)?.toString() === item._id?.toString()
                );
                const quantityInCart = cartItem ? cartItem.quantity : 0;
                const isSyncing = addingId === item._id;

                return (
                  <div
                    key={item._id}
                    className="bg-white border border-gray-100/80 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition duration-200 items-center justify-between group"
                  >
                    {/* Item Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-base text-gray-900 group-hover:text-[#E65100] transition truncate">
                          {item.name}
                        </h4>
                      </div>
                      <div className="text-sm font-black text-gray-800">
                        ₹{item.price}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 pr-4 font-medium leading-relaxed">
                        {item.description || "Fresh and delicious, made to order."}
                      </p>
                    </div>

                    {/* Image & Cart Controls */}
                    <div className="relative shrink-0 flex flex-col items-center">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200"}
                        alt={item.name}
                        className="w-24 h-24 rounded-2xl object-cover bg-gray-50 border border-gray-100/50 shadow-sm"
                      />

                      <div className="absolute -bottom-2 shadow-md rounded-xl overflow-hidden min-w-[80px]">
                        {quantityInCart > 0 ? (
                          <div className="flex items-center justify-between gap-2 bg-[#FF9933] text-white px-2 py-1.5">
                            <button
                              disabled={isSyncing}
                              onClick={() => handleUpdateQuantity(item._id, quantityInCart, -1)}
                              className="p-0.5 hover:bg-white/10 active:scale-90 rounded transition disabled:opacity-50"
                            >
                              <Minus className="w-3 h-3 stroke-[3]" />
                            </button>
                            <span className="text-xs font-black min-w-[12px] text-center select-none">
                              {quantityInCart}
                            </span>
                            <button
                              disabled={isSyncing}
                              onClick={() => handleUpdateQuantity(item._id, quantityInCart, 1)}
                              className="p-0.5 hover:bg-white/10 active:scale-90 rounded transition disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={isSyncing || !item.isAvailable}
                            onClick={() => handleAddToCart(item._id)}
                            className={`w-full flex items-center justify-center gap-1 text-xs font-bold py-1.5 px-3 transition bg-white ${
                              item.isAvailable
                                ? "text-[#FF9933] border border-orange-100 hover:bg-orange-50/40 active:scale-95"
                                : "text-gray-400 bg-gray-50 cursor-not-allowed"
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{item.isAvailable ? "ADD" : "OOS"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <FloatingCartBar />
        </div>
      </div>
    </div>
  );
}

export default RestaurantPage;