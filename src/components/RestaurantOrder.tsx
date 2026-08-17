import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import type { IOrder } from "../types";
import axios from "axios";
import { resturentService } from "../utils/constant";
import audioAsset from "../assets/fahhhhh.mp3";
import OrderCard, { PENDING_STATUSES,   } from "./OrderCart";
import {  Volume2, VolumeX, Clock, CheckCircle, Ban } from "lucide-react";

type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready_for_rider"
  | "rider_assigned"
  | "picked_up"
  | "delivered"
  | "cancelled";

type Tab = "active" | "completed" | "cancelled";

interface DashboardProps {
  restaurantId: string;
  token: string;
  useMock?: boolean;
}

export default function RestaurantOrder({ restaurantId, token, useMock = false }: DashboardProps) {
  const [activeOrders, setActiveOrders]       = useState<IOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<IOrder[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<IOrder[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [audioUnlocked, setAudioUnlocked]     = useState(false);
  const [updatingId, setUpdatingId]           = useState<string | null>(null);
  const [tab, setTab]                         = useState<Tab>("active");

  const { socket, isConnected } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const authHeader = `Bearer ${token || localStorage.getItem("token")}`;

  useEffect(() => {
    audioRef.current = new Audio(audioAsset);
    audioRef.current.load();
  }, []);

  const unlockAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.play()
      .then(() => {
        audioRef.current!.pause();
        audioRef.current!.currentTime = 0;
        setAudioUnlocked(true);
      })
      .catch(console.error);
  };

  const fetchActiveOrders = useCallback(async () => {
    if (useMock) return;
    try {
      const { data } = await axios.get(`${resturentService}/api/order/${restaurantId}`, {
        params: { status: PENDING_STATUSES.join(",") },
        headers: { Authorization: authHeader },
      });
      setActiveOrders(data.orders || data || []);
    } catch (e) { console.error(e); }
  }, [restaurantId, token, useMock]);

  const fetchCompletedOrders = useCallback(async () => {
    if (useMock) return;
    try {
      const { data } = await axios.get(`${resturentService}/api/order/${restaurantId}`, {
        params: { status: "delivered", limit: 20 },
        headers: { Authorization: authHeader },
      });
      setCompletedOrders(data.orders || data || []);
    } catch (e) { console.error(e); }
  }, [restaurantId, token, useMock]);

  const fetchCancelledOrders = useCallback(async () => {
    if (useMock) return;
    try {
      const { data } = await axios.get(`${resturentService}/api/order/${restaurantId}`, {
        params: { status: "cancelled", limit: 20 },
        headers: { Authorization: authHeader },
      });
      setCancelledOrders(data.orders || data || []);
    } catch (e) { console.error(e); }
  }, [restaurantId, token, useMock]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchActiveOrders(), fetchCompletedOrders(), fetchCancelledOrders()]);
      setLoading(false);
    };
    load();
  }, [fetchActiveOrders, fetchCompletedOrders, fetchCancelledOrders]);

  useEffect(() => {
    if (!socket || !restaurantId) return;
    socket.emit("join_restaurant", { restaurantId });
    const onNewOrder = () => {
      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
      fetchActiveOrders();
    };
    socket.on("order:new", onNewOrder);
    return () => { socket.off("order:new", onNewOrder); };
  }, [socket, audioUnlocked, fetchActiveOrders, restaurantId]);

  const handleStatusUpdate = useCallback(async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${resturentService}/api/order/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) return;

      if (nextStatus === "delivered") {
        const moved = activeOrders.find(o => o._id === orderId);
        setActiveOrders(prev => prev.filter(o => o._id !== orderId));
        if (moved) setCompletedOrders(prev => [{ ...moved, status: nextStatus }, ...prev]);
      } else if (nextStatus === "cancelled") {
        const moved = activeOrders.find(o => o._id === orderId);
        setActiveOrders(prev => prev.filter(o => o._id !== orderId));
        if (moved) setCancelledOrders(prev => [{ ...moved, status: nextStatus }, ...prev]);
      } else {
        setActiveOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: nextStatus } : o));
      }
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  }, [activeOrders, token]);


  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number; badgeClass: string }[] = [
    { key: "active",    label: "Active",    icon: <Clock className="w-3.5 h-3.5" />,        count: activeOrders.length,    badgeClass: "bg-amber-100 text-amber-700" },
    { key: "completed", label: "Completed", icon: <CheckCircle className="w-3.5 h-3.5" />,  count: completedOrders.length, badgeClass: "bg-emerald-100 text-emerald-700" },
    { key: "cancelled", label: "Cancelled", icon: <Ban className="w-3.5 h-3.5" />,          count: cancelledOrders.length, badgeClass: "bg-gray-100 text-gray-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-sm text-amber-600 animate-pulse font-medium">Loading kitchen view…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isConnected ? "text-emerald-600" : "text-gray-400"}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            {isConnected ? "Live" : "Offline"}
          </div>
        </div>
      </div>

      {/* Sound banner */}
      {!audioUnlocked && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
          <span className="flex items-center gap-2"><VolumeX className="w-3.5 h-3.5" /> Sound notifications are off.</span>
          <button
            onClick={unlockAudio}
            className="flex items-center gap-1.5 font-semibold bg-white border border-amber-200 px-3 py-1 rounded-lg cursor-pointer"
          >
            <Volume2 className="w-3 h-3" /> Turn on sound
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active now",       value: activeOrders.length,    color: "text-amber-600" },
          { label: "Completed today",  value: completedOrders.length, color: "text-emerald-600" },
          { label: "Cancelled today",  value: cancelledOrders.length, color: "text-gray-500" },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <p className="text-[11px] text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {tabs.map(({ key, label, icon, count, badgeClass }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              tab === key
                ? "bg-white text-gray-900 border border-gray-200 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {icon} {label}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeClass}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === "active" && (
        <div className="space-y-3">
          {activeOrders.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-gray-200 rounded-2xl text-sm text-gray-400">
              No active orders right now.
            </div>
          ) : (
            activeOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
                isUpdating={updatingId === order._id}
              />
            ))
          )}
        </div>
      )}

      {tab === "completed" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-90">
          {completedOrders.length === 0 ? (
            <div className="col-span-2 text-center py-14 border border-dashed border-gray-200 rounded-2xl text-sm text-gray-400">
              No completed orders yet today.
            </div>
          ) : (
            completedOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
                isUpdating={updatingId === order._id}
              />
            ))
          )}
        </div>
      )}

      {tab === "cancelled" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-75">
          {cancelledOrders.length === 0 ? (
            <div className="col-span-2 text-center py-14 border border-dashed border-gray-200 rounded-2xl text-sm text-gray-400">
              No cancelled orders today.
            </div>
          ) : (
            cancelledOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
                isUpdating={updatingId === order._id}
              />
            ))
          )}
        </div>
      )}

    </div>
  );
}