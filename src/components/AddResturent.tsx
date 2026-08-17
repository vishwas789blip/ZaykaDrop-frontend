import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppData } from "../context/AppContext";
import { resturentService } from "../utils/constant";

interface AddRestaurantProps {
  fetchMyRestaurant: () => Promise<void>; // Corrected typo mapping name
}

const AddRestaurant = ({ fetchMyRestaurant }: AddRestaurantProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { loadingLocation, location } = useAppData();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !image || !location) {
      toast.error("All mandatory fields are required");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("phone", phone);
    formData.append("latitude", String(location.latitude));
    formData.append("longitude", String(location.longitude));
    formData.append("formattedAddress", location.formattedAddress);
    formData.append("image", image);

    try {
      setSubmitting(true);
      await axios.post(
        `${resturentService}/api/restaurant/new`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Restaurant onboarded successfully!");
      await fetchMyRestaurant();

      // Clear state data buffers safely
      setName("");
      setDescription("");
      setPhone("");
      setImage(null);
      setImagePreview(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong during creation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 md:p-8 text-[#212121]">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/40 border border-gray-100 w-full max-w-xl overflow-hidden">
        
        {/* Decorative Brand Header Accent */}
        <div className="bg-gradient-to-r from-[#FF9933] to-[#E65100] p-6 text-white">
          <h1 className="text-2xl font-black tracking-tight">Onboard Your Restaurant</h1>
          <p className="text-orange-100/80 text-xs mt-1">
            Partner with ZaykaDrop and start reaching thousands of food lovers near you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          
          {/* Visual Image Uploader Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Banner Display Image *
            </label>
            <div
              onClick={() => document.getElementById("imageInput")?.click()}
              className={`border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200 flex flex-col items-center justify-center cursor-pointer min-h-[160px] bg-gray-50 ${
                imagePreview 
                  ? "border-gray-200" 
                  : "border-gray-200 hover:border-[#FF9933] hover:bg-orange-50/20"
              }`}
            >
              {imagePreview ? (
                <div className="relative w-full h-44 group">
                  <img
                    src={imagePreview}
                    alt="Restaurant Preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition duration-200">
                    Change Banner Image
                  </div>
                </div>
              ) : (
                <div className="p-6 flex flex-col items-center text-center gap-2">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-600">Click to upload restaurant banner</p>
                  <p className="text-xs text-gray-400">Supports high-res JPG, PNG pictures</p>
                </div>
              )}
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Form Text Input Groups Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Restaurant Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Royal Biryani Kitchen"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933] transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Contact Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full border border-gray-200 rounded-xl pl-14 pr-4 py-2.5 text-sm outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933] transition"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Description / Speciality
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly tell foodies about your kitchen specials, cuisine types, or hygiene standards..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933] transition resize-none"
              />
            </div>
          </div>

          {/* Location Segment Block */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Detected Store Location
            </label>
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-600">
              <span className="text-base text-[#FF9933] shrink-0 mt-0.5">📍</span>
              <div className="space-y-1">
                <p className="font-semibold text-gray-700">Auto-Detected Outlet Coordinates</p>
                <p className="leading-relaxed">
                  {loadingLocation ? (
                    <span className="text-gray-400 animate-pulse">Syncing GPS locks...</span>
                  ) : (
                    location?.formattedAddress || "No pinpoint location locked. Check browser permissions."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Submit CTA Trigger */}
          <button
            type="submit"
            disabled={submitting || loadingLocation || !location}
            className="w-full mt-2 bg-gradient-to-r from-[#FF9933] to-[#E65100] hover:from-[#E65100] hover:to-[#d84315] disabled:from-gray-300 disabled:to-gray-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Onboarding Kitchen...</span>
              </>
            ) : (
              "Launch Restaurant Profile"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRestaurant;