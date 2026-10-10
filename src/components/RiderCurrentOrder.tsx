import axios from "axios";
import type { IOrder } from "../types";
import toast from "react-hot-toast";
import { riderService } from "../utils/constant";
import RiderOrderMap from "./RiderOrderMap";
import { Navigation, Phone, Utensils, CheckCircle2, MapPin, IndianRupee } from "lucide-react";
import { useState } from "react";

interface RiderCurrentOrderProps {
  order: IOrder;
  onStatusUpdate: () => void;
}

const RiderCurrentOrder = ({ order, onStatusUpdate }: RiderCurrentOrderProps) => {
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status: string) => {
    try {
      setUpdating(true);
      await axios.put(
        `${riderService}/api/rider/order/update-status/${order._id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(
        status === "picked_up"
          ? "Food picked up! Head to customer 🛵"
          : "Order delivered! Great job 🎉"
      );
      await onStatusUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error updating order status");
      console.error("Error updating order status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const pickupLat = (order as any).pickupAddress?.latitude;
  const pickupLng = (order as any).pickupAddress?.longitude;
  const dropLat = order.deliveryAddress?.latitude;
  const dropLng = order.deliveryAddress?.longitude;

  const openGoogleMaps = (lat?: number, lng?: number) => {
    if (lat == null || lng == null) {
      toast.error("Location coordinates unavailable");
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  const isAssigned = order.status === "rider_assigned";
  const isPickedUp = order.status === "picked_up";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col gap-4 p-5">
      {/* Header with status badge */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div>
          <span className="text-xs font-mono font-semibold text-gray-400">
            ORDER #{order._id.slice(-6).toUpperCase()}
          </span>
          <h3 className="font-bold text-gray-900 text-lg">
            {order.restaurantName || "Restaurant Pickup"}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50 text-[#FF9933] border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
          <IndianRupee className="w-3.5 h-3.5" />
          <span>Earn ₹{order.riderAmount}</span>
        </div>
      </div>

      {/* Addresses with Direct Google Maps Navigation */}
      <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
        {/* Pickup section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pickup</p>
              <p className="text-sm font-medium text-gray-800">
                {(order as any).pickupAddress?.formattedAddress || order.restaurantName || "Restaurant"}
              </p>
            </div>
          </div>
          <button
            onClick={() => openGoogleMaps(pickupLat, pickupLng)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg shrink-0 transition"
          >
            <Navigation className="w-3 h-3" /> Navigate
          </button>
        </div>

        <div className="border-t border-gray-200/60 my-1" />

        {/* Drop section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Drop</p>
              <p className="text-sm font-medium text-gray-800">
                {order.deliveryAddress?.formattedAddress}
              </p>
            </div>
          </div>
          <button
            onClick={() => openGoogleMaps(dropLat, dropLng)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg shrink-0 transition"
          >
            <Navigation className="w-3 h-3" /> Navigate
          </button>
        </div>
      </div>

      {/* Customer Call & Order Details */}
      <div className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Customer:</span>
          <span className="text-xs font-bold text-gray-800">
            {order.deliveryAddress?.mobile || "N/A"}
          </span>
        </div>
        {order.deliveryAddress?.mobile && (
          <a
            href={`tel:${order.deliveryAddress.mobile}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
          >
            <Phone className="w-3 h-3" /> Call Customer
          </a>
        )}
      </div>

      {/* Food Items Checklist */}
      {order.items && order.items.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-3 bg-white">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
            <Utensils className="w-3.5 h-3.5 text-[#FF9933]" />
            <span>Items to collect ({order.items.length}):</span>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-0.5">
                <span className="font-medium text-gray-800">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-gray-400">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200">
        <RiderOrderMap order={order} />
      </div>

      {/* Status CTA Button */}
      {isAssigned && (
        <button
          onClick={() => updateStatus("picked_up")}
          disabled={updating}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          {updating ? "Updating..." : "Mark as Picked Up (Leaving Kitchen)"}
        </button>
      )}

      {isPickedUp && (
        <button
          onClick={() => updateStatus("delivered")}
          disabled={updating}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          {updating ? "Updating..." : "Mark as Delivered (Order Completed)"}
        </button>
      )}
    </div>
  );
};

export default RiderCurrentOrder;