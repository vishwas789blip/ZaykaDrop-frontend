import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { resturentService } from "../utils/constant";

type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready_for_rider"
  | "rider_assigned"
  | "picked_up"
  | "delivered"
  | "cancelled";

interface ActiveOrder {
  _id: string;
  restaurantName: string;
  status: OrderStatus;
  totalAmount: number;
}

const STATUS_META: Record<OrderStatus, { label: string; emoji: string; pulse: boolean }> = {
  placed:          { label: "Order Placed",     emoji: "🕐", pulse: true  },
  accepted:        { label: "Accepted",         emoji: "✅", pulse: true  },
  preparing:       { label: "Preparing",        emoji: "👨‍🍳", pulse: true  },
  ready_for_rider: { label: "Ready for Pickup", emoji: "📦", pulse: true  },
  rider_assigned:  { label: "Rider Assigned",   emoji: "🏍️", pulse: true  },
  picked_up:       { label: "Out for Delivery", emoji: "🛵", pulse: true  },
  delivered:       { label: "Delivered",        emoji: "🎉", pulse: false },
  cancelled:       { label: "Cancelled",        emoji: "❌", pulse: false },
};

const ACTIVE_STATUSES: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

export default function ActiveOrderBanner() {
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${resturentService}/api/order/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        const orders: ActiveOrder[] = data.orders ?? [];

        // Pick the most recent active order
        const active = orders.find(o =>
          ACTIVE_STATUSES.includes(o.status as OrderStatus)
        );

        setActiveOrder(active ?? null);
      })
      .catch(() => {
        // Silently fail — banner is non-critical
      });
  }, []);

  if (!activeOrder) return null;

  const meta = STATUS_META[activeOrder.status];

  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-4 animate-slide-up">
      <button
        onClick={() => navigate(`/order/${activeOrder._id}`)}
        className="w-full max-w-sm bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xl shadow-black/20 transition-all duration-200 active:scale-95"
      >
        {/* Left — emoji + status */}
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{meta.emoji}</span>
          <div className="text-left">
            <p className="text-[11px] text-gray-400 font-medium leading-none mb-0.5">
              {activeOrder.restaurantName}
            </p>
            <p className="text-xs font-bold leading-none flex items-center gap-1.5">
              {meta.pulse && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              )}
              {meta.label}
            </p>
          </div>
        </div>

        {/* Right — track button */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-400">Track Order →</span>
        </div>
      </button>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
