import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { resturentService } from "../utils/constant";

interface CartPopulatedItem {
  _id: string;
  quantity: number;
  restaurantId: {
    _id: string;
    name: string;
    formattedAddress?: string;
  };
  itemId: {
    _id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
  };
}

export default function Cart() {
  const { isAuth } = useAppData();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartPopulatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return setLoading(false);
    try {
      setLoading(true);
      const { data } = await axios.get(`${resturentService}/api/cart/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(data.cart || []);
    } catch (error) {
      console.error("Fetch cart error:", error);
      toast.error("Failed to load your cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuth) fetchCart();
  }, [isAuth, fetchCart]);

  const handleIncrement = async (restaurantId: string, itemId: string) => {
    if (updatingId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setUpdatingId(itemId);
      const { data } = await axios.post(
        `${resturentService}/api/cart/add`,
        { restaurantId, itemId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCartItems((prev) => {
        const itemExists = prev.some((item) => item.itemId._id === itemId);
        if (itemExists) {
          return prev.map((item) =>
            item.itemId._id === itemId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, data.cart];
      });

      toast.success("Cart updated");
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Action failed";
      if (errMsg.includes("clear cart first")) {
        if (window.confirm("Your cart has items from another restaurant. Clear it and add this item?")) {
          await handleClearCart();
          await handleIncrement(restaurantId, itemId);
        }
      } else {
        toast.error(errMsg);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDecrement = async (itemId: string) => {
    if (updatingId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setUpdatingId(itemId);
      await axios.delete(`${resturentService}/api/cart/remove/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCartItems((prev) =>
        prev
          .map((item) =>
            item.itemId._id === itemId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0)
      );
      toast.success("Item updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update cart");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.delete(`${resturentService}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems([]);
      toast.success("Cart cleared");
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear cart");
    }
  };

  // Pricing — free delivery above ₹200
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.itemId?.price || 0) * item.quantity,
    0
  );
  const deliveryFee = cartItems.length > 0 && subtotal < 200 ? 35 : 0;
  const platformFee = cartItems.length > 0 ? 5 : 0;
  const totalAmount = subtotal + deliveryFee + platformFee;

  const checkOut = () => {
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 text-[#212121]">
        <div className="w-16 h-16 bg-orange-50 text-[#FF9933] rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold">Your Cart is Empty</h3>
        <p className="text-sm text-gray-400 mt-1.5 mb-6">
          Good food is always cooking! Go ahead and order some delicious dishes.
        </p>
      </div>
    );
  }

  const activeRestaurantName = cartItems[0]?.restaurantId?.name || "Selected Kitchen";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#212121] py-8 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Cart Items */}
        <div className="lg:col-span-2 space-y-4">

          {/* Restaurant Header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Ordering From
              </span>
              <h2 className="text-lg font-black tracking-tight text-gray-900">
                {activeRestaurantName}
              </h2>
            </div>
            <button
              onClick={handleClearCart}
              className="text-xs font-bold text-red-500 hover:text-red-700 transition flex items-center gap-1 p-1.5 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Cart
            </button>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm space-y-4">
            {cartItems.map((item) => {
              if (!item.itemId) return null;
              const isSyncing = updatingId === item.itemId._id;

              return (
                <div
                  key={item._id}
                  className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <img
                    src={item.itemId.image}
                    alt={item.itemId.name}
                    className="w-16 h-16 object-cover rounded-xl bg-gray-50 shrink-0 border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm md:text-base text-gray-900 truncate">
                      {item.itemId.name}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                      {item.itemId.description}
                    </p>
                    <span className="text-sm font-extrabold text-gray-900 block mt-1">
                      ₹{item.itemId.price}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-1 gap-2 shrink-0">
                    <button
                      onClick={() => handleDecrement(item.itemId._id)}
                      disabled={isSyncing}
                      className="p-1.5 hover:bg-white rounded-lg text-gray-500 transition disabled:opacity-50"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-4 text-center text-xs font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrement(item.restaurantId._id, item.itemId._id)}
                      disabled={isSyncing}
                      className="p-1.5 hover:bg-white rounded-lg text-[#FF9933] transition disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Bill Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
            <h3 className="text-base font-black text-gray-900 border-b border-gray-50 pb-3">
              Bill Details
            </h3>

            <div className="space-y-2.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Item Total</span>
                <span className="font-semibold text-gray-800">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span className="font-semibold text-emerald-600">FREE 🎉</span>
                ) : (
                  <span className="font-semibold text-gray-800">₹{deliveryFee}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="font-semibold text-gray-800">₹{platformFee}</span>
              </div>

              {/* Free delivery progress hint */}
              {subtotal < 200 && (
                <p className="text-[11px] text-orange-500 font-medium bg-orange-50 px-2.5 py-1.5 rounded-lg">
                  Add ₹{200 - subtotal} more for free delivery!
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-black text-gray-900">
              <span>To Pay</span>
              <span className="text-lg text-[#E65100]">₹{totalAmount}</span>
            </div>
          </div>

          <button
            onClick={checkOut}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF9933] to-[#E65100] hover:from-[#E65100] hover:to-[#d84315] text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 group transition"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
        </div>

      </div>
    </div>
  );
}