import { useEffect, useState, useRef, useCallback } from "react";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { riderService } from "../utils/constant";
import toast from "react-hot-toast";
import {
  Volume2,
  VolumeX,
  Star,
  BadgeCheck,
  AlertCircle,
  Clock,
  TrendingUp,
  Package,
  MapPin,
  IndianRupee,
  History,
  CheckCircle2,
  Power
} from "lucide-react";
import audioAsset from "../assets/fahhhhh.mp3";
import type { IOrder } from "../types";
import RiderCurrentOrder from "../components/RiderCurrentOrder";
import AddRiderProfile from "../components/AddRiderProfile";

interface IRider {
  _id: string;
  phoneNumber: string;
  aadharNumber: string;
  drivingLicenseNumber: string;
  picture: string;
  isVerified: boolean;
  isAvailable: boolean;
  vehicleNumber: string;
  rating?: {
    average: number;
    count: number;
  };
}

interface IncomingOrderRequest {
  orderId: string;
  restaurantId?: string;
  restaurantName?: string;
  pickupAddress?: string;
  dropAddress?: string;
  distance?: number;
  riderAmount?: number;
}

interface RiderEarnings {
  todayEarnings: number;
  todayTrips: number;
  totalEarnings: number;
  totalTrips: number;
}

const RiderDashboard = () => {
  const { user } = useAppData();
  const { socket } = useSocket();

  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);

  const [toggling, setToggling] = useState(false);
  const [incomingOrders, setIncomingOrders] = useState<IncomingOrderRequest[]>([]);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [currentOrders, setCurrentOrders] = useState<IOrder[]>([]);
  const [historyOrders, setHistoryOrders] = useState<IOrder[]>([]);
  const [earnings, setEarnings] = useState<RiderEarnings | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audioAsset);
    audioRef.current.preload = "auto";
  }, []);

  const unlockAudio = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioUnlocked(true);
      toast.success("Sound notifications enabled");
    } catch (error) {
      console.error("Failed to unlock audio:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${riderService}/api/rider/myprofile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProfile(data.account || null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentOrders = async () => {
    try {
      const { data } = await axios.get(
        `${riderService}/api/rider/order/current-orders`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setCurrentOrders(data.orders || []);
    } catch (error: any) {
      console.error("Current orders error:", error.response?.data);
      setCurrentOrders([]);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(
        `${riderService}/api/rider/order/history`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setHistoryOrders(data.orders || []);
    } catch (error: any) {
      console.error("History error:", error.response?.data);
    }
  };

  const fetchEarnings = async () => {
    try {
      const { data } = await axios.get(
        `${riderService}/api/rider/earnings`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setEarnings(data);
    } catch (error: any) {
      console.error("Earnings error:", error.response?.data);
    }
  };

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchProfile(),
      fetchCurrentOrders(),
      fetchHistory(),
      fetchEarnings(),
    ]);
  }, []);

  useEffect(() => {
    if (user?.role === "rider") {
      refreshAll();
    } else {
      setLoading(false);
    }
  }, [user, refreshAll]);

  // Periodic location updater when rider is online (every 25 seconds)
  useEffect(() => {
    if (!profile?.isAvailable) return;

    const sendGpsUpdate = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await axios.patch(
              `${riderService}/api/rider/location`,
              {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
          } catch (err) {
            console.error("GPS ping failed:", err);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    const interval = setInterval(sendGpsUpdate, 25000);
    return () => clearInterval(interval);
  }, [profile?.isAvailable]);

  // Incoming Order Realtime Notifications
  useEffect(() => {
    if (!socket) return;

    const onOrderAvailable = (orderData: any) => {
      const orderId = typeof orderData === "string" ? orderData : orderData?.orderId;
      if (!orderId) return;

      const orderPayload: IncomingOrderRequest = typeof orderData === "object"
        ? orderData
        : { orderId };

      setIncomingOrders((prev) => {
        const exists = prev.some((o) => o.orderId === orderId);
        return exists ? prev : [...prev, orderPayload];
      });

      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      // Auto dismiss request after 20 seconds if unanswered
      setTimeout(() => {
        setIncomingOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      }, 20000);
    };

    socket.on("order:available", onOrderAvailable);

    return () => {
      socket.off("order:available", onOrderAvailable);
    };
  }, [socket, audioUnlocked]);

  const toggleAvailability = async () => {
    if (!profile?.isVerified) {
      toast.error("Your profile is pending admin verification. You cannot go online yet.");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location Access Required");
      return;
    }

    setToggling(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await axios.patch(
            `${riderService}/api/rider/toggle-availability`,
            {
              isAvailable: !profile?.isAvailable,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          toast.success(profile?.isAvailable ? "You are now offline" : "You are now online! 🛵");
          await fetchProfile();
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to update availability");
        } finally {
          setToggling(false);
        }
      },
      () => {
        toast.error("GPS location permission required to change availability");
        setToggling(false);
      }
    );
  };

  const acceptOrder = async (orderId: string) => {
    setAcceptingOrderId(orderId);

    try {
      await axios.post(
        `${riderService}/api/rider/accept/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Order accepted! Head to the restaurant 🚀");
      setIncomingOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      await refreshAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to accept order");
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const rejectOrder = (orderId: string) => {
    setIncomingOrders((prev) => prev.filter((o) => o.orderId !== orderId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No rider profile yet — show the profile registration form
  if (!profile) {
    return <AddRiderProfile onSuccess={fetchProfile} />;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col gap-5 pb-16">
      {/* Rider profile banner */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={profile.picture}
            alt="Rider profile"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-100 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-lg">{profile.phoneNumber}</span>
              {profile.isVerified ? (
                <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> KYC Pending
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-mono">
              Vehicle: <span className="font-semibold text-gray-700">{profile.vehicleNumber}</span>
            </div>
            {profile.rating && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold">{profile.rating.average.toFixed(1)}</span>
                <span className="text-gray-400">({profile.rating.count} ratings)</span>
              </div>
            )}
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              profile.isAvailable
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {profile.isAvailable ? "● Online & Ready" : "○ Offline"}
          </span>
          <button
            onClick={toggleAvailability}
            disabled={toggling || !profile.isVerified}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
              profile.isAvailable
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {toggling
              ? "Updating..."
              : profile.isAvailable
              ? "Go Offline"
              : "Go Online"}
          </button>
        </div>
      </div>

      {/* KYC Pending Warning Banner */}
      {!profile.isVerified && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-sm text-amber-900">Verification in Progress</p>
            <p className="mt-0.5 text-amber-700">
              Your profile documents (Aadhar & Driving License) are currently being reviewed by our admin team.
              You will be able to go online and receive delivery requests once verified.
            </p>
          </div>
        </div>
      )}

      {/* Sound notification prompt */}
      {!audioUnlocked && (
        <div className="flex items-center justify-between bg-orange-50/70 border border-orange-200 rounded-xl px-4 py-2.5 text-xs text-orange-800">
          <span className="flex items-center gap-2">
            <VolumeX className="w-4 h-4 text-orange-600" />
            Sound is muted. Enable loud alert for incoming orders.
          </span>
          <button
            onClick={unlockAudio}
            className="flex items-center gap-1.5 font-bold bg-white text-orange-600 border border-orange-200 px-3 py-1 rounded-lg hover:bg-orange-50 transition"
          >
            <Volume2 className="w-3 h-3" /> Turn on sound
          </button>
        </div>
      )}

      {/* Today's Earnings Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Today's Pay
          </div>
          <p className="text-lg font-black text-gray-900 mt-1">
            ₹{earnings?.todayEarnings || 0}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Package className="w-3.5 h-3.5 text-blue-600" /> Today's Rides
          </div>
          <p className="text-lg font-black text-gray-900 mt-1">
            {earnings?.todayTrips || 0}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" /> Total Earnings
          </div>
          <p className="text-lg font-black text-gray-900 mt-1">
            ₹{earnings?.totalEarnings || 0}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Completed
          </div>
          <p className="text-lg font-black text-gray-900 mt-1">
            {earnings?.totalTrips || 0} trips
          </p>
        </div>
      </div>

      {/* Incoming Order Request Cards (Rich Details with Payout) */}
      {profile?.isAvailable && incomingOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
            New Incoming Orders ({incomingOrders.length})
          </h2>

          {incomingOrders.map((req) => (
            <div
              key={req.orderId}
              className="bg-white border-2 border-orange-400 rounded-2xl p-4 shadow-lg shadow-orange-500/10 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                    #{req.orderId.slice(-6).toUpperCase()}
                  </span>
                  <h3 className="font-bold text-gray-900 text-base mt-1">
                    {req.restaurantName || "Nearby Restaurant"}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600">
                    ₹{req.riderAmount ? req.riderAmount : "Payout Available"}
                  </span>
                  {req.distance != null && (
                    <p className="text-[11px] text-gray-500 font-semibold">{req.distance} km trip</p>
                  )}
                </div>
              </div>

              {/* Trip preview addresses */}
              {(req.pickupAddress || req.dropAddress) && (
                <div className="text-xs bg-gray-50 p-2.5 rounded-xl space-y-1.5 text-gray-700">
                  {req.pickupAddress && (
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Pickup:</strong> {req.pickupAddress}</span>
                    </p>
                  )}
                  {req.dropAddress && (
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Drop:</strong> {req.dropAddress}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => acceptOrder(req.orderId)}
                  disabled={acceptingOrderId === req.orderId}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition"
                >
                  {acceptingOrderId === req.orderId ? "Accepting..." : "Accept Order"}
                </button>
                <button
                  onClick={() => rejectOrder(req.orderId)}
                  disabled={acceptingOrderId === req.orderId}
                  className="py-3 px-5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-bold transition"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs: Active vs. History */}
      <div className="flex border-b border-gray-200 text-sm font-bold">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition ${
            activeTab === "active"
              ? "border-[#FF9933] text-[#FF9933]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Package className="w-4 h-4" /> Active Delivery ({currentOrders.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            fetchHistory();
          }}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition ${
            activeTab === "history"
              ? "border-[#FF9933] text-[#FF9933]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <History className="w-4 h-4" /> Past Deliveries ({historyOrders.length})
        </button>
      </div>

      {/* Active Deliveries Tab */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {currentOrders.length > 0 ? (
            currentOrders.map((order) => (
              <RiderCurrentOrder
                key={order._id}
                order={order}
                onStatusUpdate={refreshAll}
              />
            ))
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 text-base">No Active Orders</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {profile.isAvailable
                  ? "You are online! New delivery requests nearby will appear here in real time."
                  : "Go online above to start receiving food delivery orders."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Past Deliveries Tab */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {historyOrders.length > 0 ? (
            historyOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-400">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      Delivered
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mt-1">
                    {order.restaurantName || "Restaurant"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Drop: {order.deliveryAddress?.formattedAddress}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(order.updatedAt || order.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                  <span className="text-base font-black text-emerald-600">
                    +₹{order.riderAmount}
                  </span>
                  <p className="text-[11px] text-gray-400">{order.distance} km trip</p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 text-base">No Completed Rides Yet</h3>
              <p className="text-xs text-gray-400 mt-1">
                Completed customer deliveries and your earned payouts will show up here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;