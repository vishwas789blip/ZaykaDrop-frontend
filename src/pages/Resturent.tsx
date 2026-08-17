import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import type { IRestaurant } from '../types';
import { resturentService } from '../utils/constant';
import AddRestaurant from '../components/AddResturent';
import ResturantProfile from '../components/ResturantProfile';
import MenuTab from '../components/MenuItems';
import AddItemTab from '../components/AddMenuItems';
import RestaurantOrder from '../components/RestaurantOrder';
import { useAppData } from '../context/AppContext';

type SellerTab = "menu" | "add-item" | "sales";

function Resturent() {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SellerTab>("menu");

  const { setUser, setIsAuth } = useAppData();
  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuth(false);
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const fetchMyRestaurant = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return toast.error("Please login first");
    }

    try {
      setLoading(true);
      const { data } = await axios.get(
        `${resturentService}/api/restaurant/my`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRestaurant(data?.restaurant || null);
      if (data?.token) localStorage.setItem("token", data.token);
    } catch (error: any) {
      console.error("Dashboard identity verification catch error:", error);

      if (error?.response?.status === 404) {
        setRestaurant(null);
      } else {
        toast.error(error?.response?.data?.message || "Failed to fetch restaurant configuration");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRestaurant();
  }, [fetchMyRestaurant]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#212121] font-medium text-sm animate-pulse">
            Setting up ZaykaDrop Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return <AddRestaurant fetchMyRestaurent={fetchMyRestaurant} />;
  }

  const tabs: { key: SellerTab; label: string; emoji: string }[] = [
    { key: "menu",     label: "Menu",     emoji: "🍽️" },
    { key: "add-item", label: "Add Item", emoji: "➕" },
    { key: "sales",    label: "Sales",    emoji: "📊" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#212121]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-tight text-[#FF9933]">
            zayka<span className="text-[#212121]">Drop</span>
          </span>
          <span className="bg-[#2E7D32]/10 text-[#2E7D32] px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
            Partner Panel
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Open/Closed status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${restaurant?.isOpen ? "bg-[#2E7D32] animate-ping" : "bg-gray-400"}`} />
            <span className="text-xs font-medium text-gray-600">
              {restaurant?.isOpen ? "Accepting Orders" : "Store Closed"}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={logoutHandler}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-500 bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-2 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Restaurant Profile */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <ResturantProfile restaurant={restaurant} onUpdate={setRestaurant} isSeller />
        </div>

        {/* Live Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <RestaurantOrder
            restaurantId={restaurant._id}
            token={localStorage.getItem("token") ?? ""}
            useMock={false}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6 bg-white p-1.5 rounded-xl shadow-sm gap-2 max-w-md">
          {tabs.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 px-3 text-center rounded-lg text-xs md:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === key
                  ? "bg-[#FF9933] text-white shadow-md shadow-[#FF9933]/20"
                  : "text-gray-500 hover:bg-gray-50 hover:text-[#212121]"
              }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === "menu" && (
            <div className="space-y-4">
              <h3 className="text-lg font-black tracking-tight text-[#212121]">Live Menu Dishes</h3>
              <MenuTab restaurantId={String(restaurant?._id || "")} />
            </div>
          )}

          {activeTab === "add-item" && (
            <div className="space-y-4">
              <h3 className="text-lg font-black tracking-tight text-[#212121]">Publish a New Recipe</h3>
              <AddItemTab onSuccess={() => setActiveTab("menu")} />
            </div>
          )}

          {activeTab === "sales" && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center py-16">
              <span className="text-4xl block mb-2">📊</span>
              <h3 className="text-lg font-bold mb-1 text-[#212121]">Earnings & Order Analytics</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Real-time sales charts, automated payouts, and active business matrix summaries are currently compiling.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Resturent;