import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { resturentService } from "../utils/constant";
import { useSocket } from "../context/SocketContext";

type OrderStatus = "placed" | "accepted" | "preparing" | "ready_for_rider" | "rider_assigned" | "picked_up" | "delivered" | "cancelled";

interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

const STATUS_META: Record<OrderStatus, { label: string; badgeClass: string; dotClass: string; emoji: string }> = {
  placed:           { label: "Order Placed",     badgeClass: "bg-amber-100 text-amber-800",    dotClass: "bg-amber-400",  emoji: "🕐" },
  accepted:         { label: "Accepted",         badgeClass: "bg-blue-100 text-blue-800",      dotClass: "bg-blue-500",   emoji: "✅" },
  preparing:        { label: "Preparing",        badgeClass: "bg-violet-100 text-violet-800",  dotClass: "bg-violet-500", emoji: "👨‍🍳" },
  ready_for_rider:  { label: "Ready for Pickup", badgeClass: "bg-emerald-100 text-emerald-800",dotClass: "bg-emerald-500",emoji: "📦" },
  rider_assigned:   { label: "Rider Assigned",   badgeClass: "bg-amber-100 text-amber-800",    dotClass: "bg-amber-500",  emoji: "🛵" },
  picked_up:        { label: "Out for Delivery", badgeClass: "bg-orange-100 text-orange-800",  dotClass: "bg-orange-500", emoji: "🛵" },
  delivered:        { label: "Delivered",        badgeClass: "bg-green-100 text-green-800",    dotClass: "bg-green-500",  emoji: "🎉" },
  cancelled:        { label: "Cancelled",        badgeClass: "bg-red-100 text-red-800",        dotClass: "bg-red-500",    emoji: "❌" },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function shortId(id: string) {
  return "#" + id.slice(-6).toUpperCase();
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.placed;
  const isActive = !["delivered", "cancelled"].includes(order.status);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
        ${isActive ? "border border-amber-200 shadow-amber-100 shadow-sm" : "border border-gray-100 shadow-sm"}`}
    >
      {/* Top row */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 text-[15px]">{order.restaurantName}</span>
            {isActive && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">
                Live
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">{shortId(order._id)} · {timeAgo(order.createdAt)}</p>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${meta.badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
          {meta.label}
        </span>
      </div>

      {/* Items */}
      <p className="text-sm text-gray-500 mb-3 leading-relaxed">
        {order.items.map(i => `${i.quantity}× ${i.name}`).join("  ·  ")}
      </p>

      {/* Bottom row */}
      <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-100">
        <span className="text-sm text-gray-500">
          {order.paymentMethod === "COD" ? "💵 COD" : "💳 Online"} ·{" "}
          <span className={order.paymentStatus === "paid" ? "text-emerald-500 font-semibold" : "text-amber-500 font-semibold"}>
            {order.paymentStatus === "paid" ? "Paid" : "Pending"}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-[15px]">₹{order.totalAmount}</span>
          <span className="text-gray-300 text-lg">›</span>
        </div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchOrders = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please log in to view your orders.");
      navigate("/login");
      return;
    }

    axios
      .get(`${resturentService}/api/order/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setOrders(data.orders ?? []))
      .catch(() => {
        toast.error("Failed to fetch orders. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchOrders();
    };

    socket.on("order_status_updated", handleUpdate);
    return () => {
      socket.off("order_status_updated", handleUpdate);
    };
  }, [socket]);

  const active = orders.filter(o => !["delivered", "cancelled"].includes(o.status));
  const past   = orders.filter(o =>  ["delivered", "cancelled"].includes(o.status));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-800 font-semibold text-sm animate-pulse">Fetching your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 font-sans pb-10">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 px-5 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl w-9 h-9 flex items-center justify-center text-base transition-colors"
        >
          ←
        </button>
        <div>
          <p className="font-extrabold text-amber-800 text-[17px] leading-tight">My Orders</p>
          <p className="text-xs text-gray-400">{orders.length} total orders</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🛵</span>
            <h3 className="font-bold text-gray-800 text-lg mb-2">No orders yet</h3>
            <p className="text-gray-400 text-sm mb-6">Place your first order and it will appear here.</p>
            <button
              onClick={() => navigate("/")}
              className="bg-amber-400 hover:bg-amber-500 text-white font-bold px-7 py-3 rounded-xl text-sm transition-colors"
            >
              Browse Restaurants 🍛
            </button>
          </div>
        ) : (
          <>
            {/* Active orders section */}
            {active.length > 0 && (
              <div className="mb-7">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-bold text-sm text-amber-800">Active Orders</span>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-md">{active.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {active.map(order => (
                    <OrderCard key={order._id} order={order} onClick={() => navigate(`/order/${order._id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Past orders section */}
            {past.length > 0 && (
              <div>
                <p className="font-bold text-sm text-gray-400 mb-4">Past Orders</p>
                <div className="flex flex-col gap-3">
                  {past.map(order => (
                    <OrderCard key={order._id} order={order} onClick={() => navigate(`/order/${order._id}`)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}