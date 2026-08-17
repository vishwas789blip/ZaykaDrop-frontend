import React, { useEffect, useState } from "react";
import { CheckCircle, Clock, ArrowRight, Check } from "lucide-react";
import type { IOrder } from "../types";

type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready_for_rider"
  | "rider_assigned"
  | "picked_up"
  | "delivered"
  | "cancelled";

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready_for_rider",
};

export const PENDING_STATUSES: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

export const COMPLETED_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

const PIPELINE: OrderStatus[] = ["placed", "accepted", "preparing", "ready_for_rider"];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  placed:          { label: "Placed",          className: "bg-amber-100 text-amber-700" },
  accepted:        { label: "Accepted",         className: "bg-blue-100 text-blue-700" },
  preparing:       { label: "Preparing",        className: "bg-purple-100 text-purple-700" },
  ready_for_rider: { label: "Ready",            className: "bg-teal-100 text-teal-700" },
  rider_assigned:  { label: "Rider assigned",   className: "bg-teal-100 text-teal-700" },
  picked_up:       { label: "Picked up",        className: "bg-teal-100 text-teal-700" },
  delivered:       { label: "Delivered",        className: "bg-emerald-100 text-emerald-700" },
  cancelled:       { label: "Cancelled",        className: "bg-gray-100 text-gray-500" },
};

const CTА_LABEL: Partial<Record<OrderStatus, string>> = {
  placed:   "Accept order",
  accepted: "Start preparing",
  preparing: "Mark ready",
};

function getStepState(stepStatus: OrderStatus, currentStatus: OrderStatus) {
  const currentIdx = PIPELINE.indexOf(currentStatus);
  const stepIdx = PIPELINE.indexOf(stepStatus);
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "idle";
}

function timeAgo(date: string | Date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

interface OrderCardProps {
  order: IOrder;
  onStatusUpdate: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  isUpdating: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusUpdate, isUpdating }) => {
  const status = order.status as OrderStatus;
  const nextStatus = NEXT_STATUS[status] ?? null;
  const isPending = PENDING_STATUSES.includes(status);
  const isDelivered = status === "delivered";
  const badge = STATUS_BADGE[status] ?? { label: status, className: "bg-gray-100 text-gray-500" };
  const ctaLabel = nextStatus ? (CTА_LABEL[status] ?? `Move to ${nextStatus.replace(/_/g, " ")}`) : null;
  const [retryVisible, setRetryVisible] = useState(false);

  useEffect(() => {
    if(order.status === "ready_for_rider" ) {
      setRetryVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setRetryVisible(true);
    },10000)

    return () => clearTimeout(timer);

  },[order.status])
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Top section */}
      <div className="p-4 pb-3">
        {/* ID + badge */}
        <div className="flex justify-between items-center mb-3">
          <span className="font-mono text-xs font-semibold text-gray-400">
            #{order._id.slice(-6).toUpperCase()}
          </span>
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        {/* Items */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {order.items?.map((i: any) => (
            <span key={i.name}>
              <span className="font-semibold text-gray-900">{i.quantity}×</span> {i.name}
            </span>
          )).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`sep-${i}`} className="text-gray-300 mx-1">·</span>, el], []) || "No items"}
        </p>
      </div>

      {/* Progress track — only for pipeline statuses */}
      {PIPELINE.includes(status) && (
        <div className="flex gap-1 px-4 pb-3">
          {PIPELINE.map((step) => {
            const state = getStepState(step, status);
            return (
              <div
                key={step}
                className={`flex-1 h-[3px] rounded-full transition-all duration-300 ${
                  state === "done"   ? "bg-amber-500" :
                  state === "active" ? "bg-amber-300" :
                  "bg-gray-100"
                }`}
              />
            );
          })}
        </div>
      )}

      <div className="h-px bg-gray-100" />

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        {/* Timestamp */}
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <Clock className="w-3 h-3" />
          {order.createdAt ? timeAgo(order.createdAt) : "—"}
        </span>

        {/* Action */}
        {isDelivered || status === "cancelled" ? (
          <span className={`flex items-center gap-1 text-xs font-medium ${
            isDelivered ? "text-emerald-600" : "text-gray-400"
          }`}>
            <CheckCircle className="w-3.5 h-3.5" />
            {isDelivered ? "Complete" : "Cancelled"}
          </span>
        ) : isPending && nextStatus ? (
          <button
            disabled={isUpdating}
            onClick={() => onStatusUpdate(order._id, nextStatus)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
          >
            {isUpdating ? (
              <span className="animate-pulse">Updating…</span>
            ) : (
              <>
                {ctaLabel}
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        ) : (
          <span className="text-xs text-gray-400 italic">Awaiting rider</span>
        )}
      </div>
      {order.status === "ready_for_rider" && retryVisible && (
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => onStatusUpdate(order._id, "ready_for_rider")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white transition-colors cursor-pointer"
          >
            Retry assigning rider
          </button>
        </div>
      ) }
    </div>
  );
};

export default OrderCard;