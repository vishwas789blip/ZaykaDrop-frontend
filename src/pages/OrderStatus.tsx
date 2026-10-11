import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import { resturentService } from "../utils/constant";
import type { IOrder } from "../types";
import UserOrderMap from "../components/UserOrderMap";
import { Phone, ShieldCheck } from "lucide-react";

// Matches IOrder.status exactly
type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready_for_rider"
  | "rider_assigned"
  | "picked_up"
  | "delivered"
  | "cancelled";

const STATUS_FLOW: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
  "delivered",
];

const STATUS_META: Record<
  OrderStatus,
  { label: string; desc: string; emoji: string; badgeClass: string; dotClass: string }
> = {
  placed: { label: "Order Placed", desc: "Your order has been received by the restaurant.", emoji: "🕐", badgeClass: "bg-amber-100 text-amber-800", dotClass: "bg-amber-400" },
  accepted: { label: "Accepted", desc: "The restaurant has confirmed your order.", emoji: "✅", badgeClass: "bg-blue-100 text-blue-800", dotClass: "bg-blue-500" },
  preparing: { label: "Preparing", desc: "Your food is being freshly prepared.", emoji: "👨‍🍳", badgeClass: "bg-violet-100 text-violet-800", dotClass: "bg-violet-500" },
  ready_for_rider: { label: "Ready for Pickup", desc: "Your order is packed and awaiting a rider.", emoji: "📦", badgeClass: "bg-emerald-100 text-emerald-800", dotClass: "bg-emerald-500" },
  rider_assigned: { label: "Rider Assigned", desc: "A rider has been assigned to your order.", emoji: "🏍️", badgeClass: "bg-orange-100 text-orange-800", dotClass: "bg-orange-400" },
  picked_up: { label: "Out for Delivery", desc: "Your order is on its way to you.", emoji: "🛵", badgeClass: "bg-orange-100 text-orange-800", dotClass: "bg-orange-500" },
  delivered: { label: "Delivered!", desc: "Your order has been delivered. Enjoy your meal!", emoji: "🎉", badgeClass: "bg-green-100 text-green-800", dotClass: "bg-green-500" },
  cancelled: { label: "Cancelled", desc: "This order has been cancelled.", emoji: "❌", badgeClass: "bg-red-100 text-red-800", dotClass: "bg-red-500" },
};

function shortId(id: string) {
  return "#" + id.slice(-6).toUpperCase();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function StatusStepper({ status }: { status: OrderStatus }) {
  const currentIdx = STATUS_FLOW.indexOf(status);

  if (status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
        <span className="text-3xl">❌</span>
        <div>
          <p className="font-bold text-red-700">Order Cancelled</p>
          <p className="text-sm text-red-400">Please contact the restaurant if you have any concerns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">Order Progress</p>
      <div className="flex items-start">
        {STATUS_FLOW.map((s, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          const meta = STATUS_META[s];
          return (
            <div key={s} className="flex items-start flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                  ${active ? "bg-amber-400 ring-4 ring-amber-100 shadow-md" : done ? "bg-amber-400" : "bg-gray-100"}`}
                >
                  {done && !active ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`text-base ${active ? "" : "grayscale opacity-40"}`}>{meta.emoji}</span>
                  )}
                </div>
                <p
                  className={`text-[10px] font-semibold mt-1.5 text-center leading-tight max-w-[56px]
                  ${active ? "text-amber-700" : done ? "text-gray-500" : "text-gray-300"}`}
                >
                  {meta.label.replace("!", "")}
                </p>
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div className="flex-1 mt-4 mx-1">
                  <div className={`h-1 rounded-full transition-all duration-500 ${i < currentIdx ? "bg-amber-400" : "bg-gray-100"}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current status message */}
      <div className="mt-5 bg-amber-50 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl">{STATUS_META[status].emoji}</span>
        <div>
          <p className="font-bold text-amber-800 text-sm">{STATUS_META[status].label}</p>
          <p className="text-xs text-amber-600">{STATUS_META[status].desc}</p>
        </div>
      </div>
    </div>
  );
}

// Central place for the room-naming convention so join/leave/backend always agree
function orderRoomName(orderId: string) {
  return `order_${orderId}`;
}

export default function OrderStatus() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !id) return;

    try {
      const { data } = await axios.get(`${resturentService}/api/order/single/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.order) {
        setOrder(data.order);
        if (data.order?.riderLocation?.latitude != null && data.order?.riderLocation?.longitude != null) {
          setRiderLocation([data.order.riderLocation.latitude, data.order.riderLocation.longitude]);
        }
      }
    } catch {
      // transient network error
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch order details on mount
  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Polling fallback every 8 seconds while order is active to ensure instant sync even if socket glitches
  useEffect(() => {
    if (!order) return;
    const isActive = !["delivered", "cancelled"].includes(order.status);
    if (!isActive) return;

    const interval = setInterval(() => {
      fetchOrderDetails();
    }, 8000);

    return () => clearInterval(interval);
  }, [order?.status, fetchOrderDetails]);

  // Realtime status updates via Socket.IO
  useEffect(() => {
    if (!socket || !id) return;

    const handleStatusUpdate = (payload: any) => {
      const orderId = payload?.orderId || payload?._id;
      if (orderId && orderId.toString() !== id.toString()) return;

      const newStatus = payload?.status;
      if (newStatus) {
        setOrder(prev => (prev ? { ...prev, status: newStatus as IOrder["status"] } : prev));
        toast.success(`Status updated: ${STATUS_META[newStatus as OrderStatus]?.label || newStatus}`, {
          icon: STATUS_META[newStatus as OrderStatus]?.emoji,
        });
      }

      // If payload includes rider details or full order, update immediately
      if (payload?.order) {
        setOrder(payload.order);
      }
      if (payload?.riderLocation?.latitude != null && payload?.riderLocation?.longitude != null) {
        setRiderLocation([payload.riderLocation.latitude, payload.riderLocation.longitude]);
      }

      // Always re-fetch complete updated data from backend
      fetchOrderDetails();
    };

    socket.on("order_status_updated", handleStatusUpdate);
    return () => {
      socket.off("order_status_updated", handleStatusUpdate);
    };
  }, [socket, id, fetchOrderDetails]);

  // Join / leave the order-specific room
  useEffect(() => {
    if (!socket || !id) return;

    const room = orderRoomName(id);
    socket.emit("join_order_room", room);
    socket.emit("join_order_room", `order:${id}`);

    return () => {
      socket.emit("leave_order_room", room);
      socket.emit("leave_order_room", `order:${id}`);
    };
  }, [socket, id]);

  // Realtime rider location updates
  useEffect(() => {
    if (!socket) return;

    const onRiderLocation = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      if (latitude != null && longitude != null) {
        setRiderLocation([latitude, longitude]);
      }
    };

    socket.on("rider:location-update", onRiderLocation);
    return () => {
      socket.off("rider:location-update", onRiderLocation);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-800 font-semibold text-sm animate-pulse">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 gap-4">
        <span className="text-5xl">😕</span>
        <p className="font-bold text-gray-700 text-lg">Order not found</p>
        <button
          onClick={() => navigate("/orders")}
          className="bg-amber-400 hover:bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          My Orders
        </button>
      </div>
    );
  }

  const isDelivered = order.status === "delivered";
  const isActive = !["delivered", "cancelled"].includes(order.status);
  const showRiderMap =
    (order.status === "rider_assigned" || order.status === "picked_up") &&
    riderLocation !== null &&
    order.deliveryAddress?.latitude != null &&
    order.deliveryAddress?.longitude != null;

  return (
    <div className="min-h-screen bg-amber-50 font-sans pb-10">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 px-5 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-extrabold text-amber-800 text-[17px] leading-tight">Order Status</p>
            <p className="text-xs text-gray-400">
              {shortId(order._id)} · {order.restaurantName}
            </p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-amber-700">Live</span>
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 flex flex-col gap-4">
        {/* Stepper */}
        <StatusStepper status={order.status as OrderStatus} />

        {/* Order items + bill breakdown */}
        <div className="bg-white rounded-2xl border border-amber-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Your Order</p>
          <div className="flex flex-col gap-3">
            {order.items.map(item => (
              <div key={item.itemId} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="bg-amber-400 text-white text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm text-gray-500">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex flex-col gap-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery Fee</span>
              <span>
                {order.deliveryFee === 0 ? (
                  <span className="text-emerald-500 font-semibold">FREE</span>
                ) : (
                  `₹${order.deliveryFee}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Platform Fee</span>
              <span>₹{order.platformFee}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base mt-1 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Payment + delivery details */}
        <div className="bg-white rounded-2xl border border-amber-100 p-5 flex flex-col gap-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Details</p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Payment</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {order.paymentMethod === "COD" ? "💵 Cash on Delivery" : "💳 Online"}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md
                ${order.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
              >
                {order.paymentStatus === "paid" ? "Paid" : "Pending"}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Order Time</span>
            <span className="text-sm font-semibold text-gray-700">{formatTime(order.createdAt.toString())}</span>
          </div>
          {order.deliveryAddress?.formattedAddress && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-sm text-gray-500 shrink-0">Deliver To</span>
              <span className="text-sm font-medium text-gray-700 text-right">
                {order.deliveryAddress.formattedAddress}
              </span>
            </div>
          )}
        </div>

        {/* Rider Assignment Card */}
        {(order.status === "rider_assigned" || order.status === "picked_up") && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/80 p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FF9933] text-white flex items-center justify-center font-black text-xl shadow-md shadow-orange-500/20">
                  🛵
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">
                      {order.riderName || "Delivery Partner Assigned"}
                    </h3>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Assigned
                    </span>
                  </div>
                  <p className="text-xs text-orange-800/80 font-medium mt-0.5">
                    {order.status === "rider_assigned"
                      ? "Heading to restaurant to pick up your order"
                      : "Order picked up! On the way to your address 🚀"}
                  </p>
                </div>
              </div>

              {order.riderPhone && (
                <a
                  href={`tel:${order.riderPhone}`}
                  className="flex items-center gap-1.5 bg-white text-emerald-700 border border-emerald-300 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm hover:bg-emerald-50 transition shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Rider
                </a>
              )}
            </div>
          </div>
        )}

        {/* Live rider map — only rendered once we actually have an assigned rider */}
        {(order.status === "rider_assigned" || order.status === "picked_up") && (
          <div className="bg-white rounded-2xl border border-amber-100 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Delivery Tracking</span>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Map
              </span>
            </div>

            {showRiderMap ? (
              <UserOrderMap
                riderLocation={riderLocation as [number, number]}
                deliveryAddress={[order.deliveryAddress.latitude!, order.deliveryAddress.longitude!]}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-amber-50/50 rounded-xl border border-dashed border-amber-200">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl animate-pulse mb-2">
                  🛵
                </div>
                <p className="text-sm font-bold text-gray-800">Rider On The Move</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  {order.status === "rider_assigned"
                    ? "Rider is navigating to the kitchen. Live route will update continuously."
                    : "Connecting to real-time rider GPS coordinates..."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Order again CTA — only shown after delivery */}
        {isDelivered && (
          <button
            onClick={() => navigate("/")}
            className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-4 rounded-2xl text-sm transition-colors"
          >
            Order Again 🍛
          </button>
        )}
      </div>
    </div>
  );
}