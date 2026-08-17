import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { resturentService } from "../utils/constant";

interface AddItemTabProps {
  onSuccess: () => void;
}

export default function AddItemTab({ onSuccess }: AddItemTabProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Only store raw binary file chunk state to avoid large string duplicates
    setImage(file);
    
    // Create isolated preview memory address pointer
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Memory optimization cleanup callback listener
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price.trim() || !image) {
      return toast.error("Dish name, price, and image are required");
    }

    const token = localStorage.getItem("token");
    if (!token) return toast.error("Session expired. Please login again.");

    // Initialize multipart/form-data schema wrapper boundary
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("price", price.trim());
    formData.append("image", image); // Appending raw binary blob data safely

    try {
      setSubmitting(true);
      
      const { data } = await axios.post(
        `${resturentService}/api/menu/add`, 
        formData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Explicitly pass boundary configuration verification wrapper
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(data.message || "New dish added to your menu successfully!");
      
      // Flush client data buffers
      setName("");
      setDescription("");
      setPrice("");
      setImage(null);
      setPreview(null);
      
      onSuccess(); 
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add menu item");
      console.error("Payload execution error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Dish Image *</label>
        <div
          onClick={() => document.getElementById("menuItemFileInput")?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden min-h-[140px] hover:border-[#FF9933] hover:bg-orange-50/10 transition"
        >
          {preview ? (
            <img src={preview} alt="Dish preview" className="w-full h-44 object-cover" />
          ) : (
            <div className="p-4 text-center text-gray-400 text-xs font-semibold space-y-1">
              <span className="text-2xl block">📸</span>
              <span>Click to add item picture</span>
            </div>
          )}
          <input id="menuItemFileInput" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Item Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Special Butter Chicken"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Price (INR) *</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="249"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Ingredients / Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="List key delicacies, flavor profiles, or portion options..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933] resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-gradient-to-r from-[#FF9933] to-[#E65100] hover:from-[#E65100] hover:to-[#d84315] disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-sm rounded-xl shadow-md transition"
      >
        {submitting ? "Adding Dish..." : "Add Item To Live Menu"}
      </button>
    </form>
  );
}