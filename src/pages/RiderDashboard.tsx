import { useEffect, useState, useRef } from "react";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { riderService } from "../utils/constant";
import toast from "react-hot-toast";
import { Volume2, VolumeX } from "lucide-react";
import audioAsset from "../assets/fahhhhh.mp3";
import type { IOrder } from "../types";
import RiderCurrentOrder from "../components/RiderCurrentOrder";

interface IRider {
  _id: string;
  phoneNumber: string;
  aadharNumber: string;
  drivingLicenseNumber: string;
  picture: string;
  isVerified: boolean;
  isAvailable: boolean;
}

const RiderDashboard = () => {
  const { user } = useAppData();
  const { socket } = useSocket();

  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);

  const [toggling, setToggling] = useState(false);
  const [incomingOrders, setIncomingOrders] = useState<string[]>([]);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [currentOrders, setCurrentOrders] = useState<IOrder[]>([]);
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
      toast.success("Sound enabled");
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
    } catch (error) {
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
      console.error("CURRENT ORDERS FAILED:", error.response?.data);
      console.error("STATUS:", error.response?.status);
      setCurrentOrders([]);
    }
  };

  useEffect(() => {
    if (user?.role === "rider") {
      fetchProfile();
      fetchCurrentOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const onOrderAvailable = ({ orderId }: { orderId: string }) => {
      setIncomingOrders((prev) =>
        prev.includes(orderId) ? prev : [...prev, orderId]
      );

      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      setTimeout(() => {
        setIncomingOrders((prev) => prev.filter((id) => id !== orderId));
      }, 10000);
    };

    socket.on("order:available", onOrderAvailable);

    return () => {
      socket.off("order:available", onOrderAvailable);
    };
  }, [socket, audioUnlocked]);

  useEffect(() => {
  if (!socket || !profile?._id) return;

  socket.emit("join_rider_room", `rider:${profile._id}`);
  console.log("Joined rider room:", `rider:${profile._id}`);

  return () => {
    socket.emit("leave_rider_room", `rider:${profile._id}`);
  };
  }, [socket, profile?._id]);

  const toggleAvailability = async () => {
    if (!navigator.geolocation) {
      toast.error("Location Access Required");
      return;
    }

    setToggling(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
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

        toast.success(profile?.isAvailable ? "You are offline" : "You are online");

        fetchProfile();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to update availability");
      } finally {
        setToggling(false);
      }
    });
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

      toast.success("Order accepted");

      setIncomingOrders((prev) => prev.filter((id) => id !== orderId));
      await fetchProfile();
      await fetchCurrentOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to accept order");
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const rejectOrder = (orderId: string) => {
    setIncomingOrders((prev) => prev.filter((id) => id !== orderId));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {!audioUnlocked && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
          <span className="flex items-center gap-2">
            <VolumeX className="w-3.5 h-3.5" /> Sound notifications are off.
          </span>
          <button
            onClick={unlockAudio}
            className="flex items-center gap-1.5 font-semibold bg-white border border-amber-200 px-3 py-1 rounded-lg cursor-pointer"
          >
            <Volume2 className="w-3 h-3" /> Turn on sound
          </button>
        </div>
      )}

      <button
        onClick={toggleAvailability}
        disabled={toggling}
        className={`px-4 py-2 rounded-lg font-medium text-white ${
          profile?.isAvailable ? "bg-red-500" : "bg-green-500"
        }`}
      >
        {toggling ? "Updating..." : profile?.isAvailable ? "Go Offline" : "Go Online"}
      </button>

      {profile?.isAvailable && incomingOrders.length > 0 && (
        <div className="flex flex-col gap-2">
          {incomingOrders.map((orderId) => (
            <div
              key={orderId}
              className="border border-orange-300 bg-orange-50 rounded-lg p-3 flex items-center justify-between"
            >
              <span className="text-sm font-medium">New order available!</span>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptOrder(orderId)}
                  disabled={acceptingOrderId === orderId}
                  className="bg-green-500 text-white text-sm px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                >
                  {acceptingOrderId === orderId ? "Accepting..." : "Accept"}
                </button>
                <button
                  onClick={() => rejectOrder(orderId)}
                  disabled={acceptingOrderId === orderId}
                  className="bg-white border border-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentOrders.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-lg">Current Orders</h2>
          {currentOrders.map((order) => (
            <RiderCurrentOrder
              key={order._id}
              order={order}
              onStatusUpdate={fetchCurrentOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;