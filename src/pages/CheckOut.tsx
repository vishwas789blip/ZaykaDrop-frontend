import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import {
  MapPin,
  Plus,
  ChevronRight,
  CheckCircle2,
  Wallet,
  Bike,
  CreditCard,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { resturentService } from "../utils/constant";

import type { ICart } from "../types";
import type { IAddress } from "../types";

type PaymentMethod = "COD" | "Razorpay" | "Stripe";

export default function Checkout() {
  const { isAuth } = useAppData();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<ICart[]>([]);
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [cartRes, addrRes] = await Promise.all([
          axios.get(`${resturentService}/api/cart/get`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${resturentService}/api/address/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const cart: ICart[] = cartRes.data.cart || [];
        const addrs: IAddress[] = addrRes.data.addresses || [];

        if (cart.length === 0) {
          toast.error("Cart is empty");
          navigate("/cart");
          return;
        }

        setCartItems(cart);
        setAddresses(addrs);
        if (addrs.length > 0) setSelectedAddressId(addrs[0]._id);
      } catch {
        toast.error("Failed to load checkout data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isAuth]);

  // Pricing
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.itemId?.price || 0) * item.quantity,
    0
  );
  const deliveryFee = cartItems.length > 0 && subtotal < 250 ? 49 : 0;
  const platformFee = cartItems.length > 0 ? 7 : 0;
  const totalAmount = subtotal + deliveryFee + platformFee;

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !selectedAddress) {
      return toast.error("Please select a delivery address");
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setPlacing(true);
      const { data } = await axios.post(
        `${resturentService}/api/order/new`,
        {
          addressId: selectedAddressId,
          deliveryAddress: {
            formattedAddress: selectedAddress.formattedAddress,
            phone: selectedAddress.phone,
            latitude: selectedAddress.location.coordinates[1],
          longitude: selectedAddress.location.coordinates[0],
          },
          paymentMethod,
          distance: 3,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (paymentMethod === "COD") {
        toast.success("Order placed successfully! 🎉");
        navigate(`/order/${data.orderId}`);
      } else {
        navigate(`/payment/${data.orderId}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const restaurantName =
    (typeof cartItems[0]?.restaurantId === "object"
      ? cartItems[0]?.restaurantId?.name
      : undefined) || "Restaurant"; 
      
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#212121] py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/cart")}
            className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Checkout</h1>
            <p className="text-xs text-gray-400 mt-0.5">Ordering from {restaurantName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">

            {/* 1. Delivery Address */}
            <Section step="1" title="Delivery Address">
              {addresses.length === 0 ? (
                <button
                  onClick={() => navigate("/address")}
                  className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-orange-200 rounded-xl text-[#FF9933] hover:bg-orange-50 transition text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add a delivery address
                </button>
              ) : (
                <div className="space-y-2.5">
                  {addresses.map((addr) => {
                    const selected = selectedAddressId === addr._id;
                    return (
                      <button
                        key={addr._id}
                        onClick={() => setSelectedAddressId(addr._id)}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition ${
                          selected
                            ? "border-[#FF9933] bg-orange-50"
                            : "border-gray-100 bg-white hover:border-orange-200"
                        }`}
                      >
                        <div
                          className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                            selected ? "border-[#FF9933]" : "border-gray-300"
                          }`}
                        >
                          {selected && (
                            <div className="w-2 h-2 rounded-full bg-[#FF9933]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* FIX: was formatterAddress — now formattedAddress */}
                          <p className="text-sm font-semibold text-gray-800 leading-snug">
                            {addr.formattedAddress}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            📞 {addr.phone}
                          </p>
                        </div>
                        {selected && (
                          <CheckCircle2 className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => navigate("/address")}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-[#FF9933] hover:bg-orange-50 rounded-xl transition border border-dashed border-orange-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add new address
                  </button>
                </div>
              )}
            </Section>

            {/* 2. Order Summary */}
            <Section step="2" title="Order Summary">
              <div className="space-y-3">
                {cartItems.map((item) => {
                  if (!item.itemId) return null;
                  return (
                    <div
                      key={item._id}
                      className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                    >
                      <img
                        src={item.itemId.image}
                        alt={item.itemId.name}
                        className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {item.itemId.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ₹{item.itemId.price} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-extrabold text-gray-900 shrink-0">
                        ₹{item.itemId.price * item.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* 3. Payment Method */}
            <Section step="3" title="Payment Method">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <PaymentOption
                  id="COD"
                  label="Cash on Delivery"
                  icon={<Wallet className="w-4 h-4" />}
                  selected={paymentMethod === "COD"}
                  onSelect={() => setPaymentMethod("COD")}
                />
                <PaymentOption
                  id="Razorpay"
                  label="Razorpay"
                  icon={<CreditCard className="w-4 h-4" />}
                  selected={paymentMethod === "Razorpay"}
                  onSelect={() => setPaymentMethod("Razorpay")}
                />
                <PaymentOption
                  id="Stripe"
                  label="Stripe"
                  icon={<CreditCard className="w-4 h-4" />}
                  selected={paymentMethod === "Stripe"}
                  onSelect={() => setPaymentMethod("Stripe")}
                />
              </div>
            </Section>
          </div>

          {/* Right Column */}
          <div className="space-y-4">

            {selectedAddress && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#FF9933]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                    Delivering to
                  </p>
                  {/* FIX: was formatterAddress */}
                  <p className="text-xs font-semibold text-gray-700 leading-snug">
                    {selectedAddress.formattedAddress}
                  </p>
                </div>
              </div>
            )}

            {/* Bill Details */}
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

                {subtotal < 250 && (
                  <p className="text-[11px] text-orange-500 font-medium bg-orange-50 px-2.5 py-1.5 rounded-lg">
                    Add ₹{250 - subtotal} more for free delivery!
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-black text-gray-900">
                <span>To Pay</span>
                <span className="text-lg text-[#E65100]">₹{totalAmount}</span>
              </div>
            </div>

            {/* Payment mode badge */}
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm flex items-center gap-2.5">
              <Bike className="w-4 h-4 text-[#FF9933] shrink-0" />
              <p className="text-xs font-semibold text-gray-600">
                Paying via <span className="text-gray-900">{paymentMethod}</span>
              </p>
            </div>

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddressId}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF9933] to-[#E65100] hover:from-[#E65100] hover:to-[#d84315] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 group transition"
            >
              {placing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  <span>
                    {paymentMethod === "COD" ? "Place Order" : "Proceed to Pay"}
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-gray-400">
              By placing the order, you agree to our{" "}
              <span className="text-[#FF9933] font-semibold cursor-pointer hover:underline">
                Terms of Service
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF9933] to-[#E65100] text-white text-[11px] font-black flex items-center justify-center shrink-0">
          {step}
        </span>
        <h3 className="text-base font-black text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function PaymentOption({
  label,
  icon,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition w-full ${
        selected
          ? "border-[#FF9933] bg-orange-50 text-[#E65100]"
          : "border-gray-100 bg-white text-gray-600 hover:border-orange-200"
      }`}
    >
      <span className={selected ? "text-[#FF9933]" : "text-gray-400"}>{icon}</span>
      {label}
    </button>
  );
}