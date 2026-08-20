import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import type { IRestaurant } from "../types";
import { resturentService } from "../utils/constant";

interface RestaurantProfileProps {
  restaurant: IRestaurant;
  isSeller: boolean;
  onUpdate: (updatedRestaurant: IRestaurant) => void;
}

const RestaurantProfile = ({ restaurant, isSeller, onUpdate }: RestaurantProfileProps) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description);
  const [phone, setPhone] = useState(restaurant.phone || "");  // ✅ phone state
  const [isOpen, setIsOpen] = useState(restaurant.isOpen);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const toggleIsOpenStatus = async () => {
    if (!token) return toast.error("Authentication token missing!");
    try {
      const { data } = await axios.put(
        `${resturentService}/api/restaurant/status`,
        { status: !isOpen },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message || "Status updated!");
      setIsOpen(data.restaurant.isOpen);
      onUpdate(data.restaurant);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update store status");
    }
  };

  const saveChanges = async () => {
    if (!token) return toast.error("Authentication token missing!");
    if (!name.trim()) return toast.error("Restaurant name cannot be empty");

    // ✅ phone validation
    if (phone && !/^\d{10}$/.test(phone)) {
      return toast.error("Please enter a valid 10-digit phone number");
    }

    try {
      setLoading(true);
      const { data } = await axios.put(
        `${resturentService}/api/restaurant/edit`,
        { name, description, phone },  // ✅ phone add kiya
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate(data.restaurant || data.restaurent);
      toast.success(data.message || "Profile changes saved!");
      setEditMode(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile changes");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setName(restaurant.name);
    setDescription(restaurant.description);
    setPhone(restaurant.phone || "");  // ✅ cancel pe reset
    setEditMode(false);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm text-[#212121]">
      {/* Banner */}
      <div className="relative h-48 md:h-60 bg-gray-100">
        {restaurant.image ? (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center text-orange-400 font-bold">
            No Header Image Uploaded
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm uppercase ${
            isOpen ? "bg-[#2E7D32] text-white" : "bg-gray-700 text-gray-100"
          }`}>
            {isOpen ? "🟢 Open & Accepting" : "🔴 Temporarily Closed"}
          </span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-6">

          <div className="flex-1 space-y-3">
            {editMode ? (
              <div className="space-y-3 max-w-xl">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Display Title</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-lg font-bold border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Short Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full text-sm text-gray-600 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933] resize-none"
                  />
                </div>

                {/* ✅ Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Contact Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-2 text-sm outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1 text-gray-900">
                  {restaurant.name}
                </h2>
                <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
                  {restaurant.description || "No description added yet."}
                </p>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mt-3">
                    <span>📍 {restaurant.autoLocation?.formattedAddress || "No address"}</span>                  {restaurant.phone && <span>• 📞 +91 {restaurant.phone}</span>}
                </div>
              </div>
            )}
          </div>

          {isSeller && (
            <div className="flex flex-wrap items-center gap-3 shrink-0 mt-2 md:mt-0">
              {editMode ? (
                <>
                  <button
                    onClick={cancelEdit}  // ✅ cancelEdit function
                    disabled={loading}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={loading}
                    className="px-4 py-2 text-xs font-bold bg-[#2E7D32] hover:bg-[#1b5e20] text-white rounded-xl transition shadow-sm"
                  >
                    {loading ? "Saving..." : "Save Profile"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={toggleIsOpenStatus}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 ${
                      isOpen
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100/70"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70"
                    }`}
                  >
                    {isOpen ? "Close Shop" : "Go Online"}
                  </button>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 text-xs font-bold bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl transition"
                  >
                    Edit Info
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantProfile;