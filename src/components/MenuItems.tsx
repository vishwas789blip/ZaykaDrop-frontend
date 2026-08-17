import { useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { resturentService } from "../utils/constant";
import { useAppData } from "../context/AppContext"; // Importing global context hook

interface MenuTabProps {
  restaurantId: string;
}

export default function MenuTab({ restaurantId }: MenuTabProps) {
  const { menuItems, loadingMenu, fetchMenu, setMenuItems } = useAppData();

  useEffect(() => {
    if (restaurantId) {
      fetchMenu(restaurantId);
    }
  }, [restaurantId, fetchMenu]);

  const handleToggleAvailability = async (itemId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("Please log in first");
    
    try {
      const { data } = await axios.put(
        `${resturentService}/api/menu/status/${itemId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Mutating the global menuItems list reactively
      setMenuItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, isAvailable: data.item.isAvailable } : item))
      );
      toast.success(data.message);
    } catch (error) {
      toast.error("Failed to alter availability status");
      console.error(error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this dish?")) return;
    const token = localStorage.getItem("token");
    if (!token) return toast.error("Please log in first");
    
    try {
      await axios.delete(`${resturentService}/api/menu/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setMenuItems((prev) => prev.filter((item) => item._id !== itemId));
      toast.success("Dish deleted successfully");
    } catch (error) {
      toast.error("Failed to delete menu item");
      console.error(error);
    }
  };

  if (loadingMenu) {
    return <div className="text-sm text-gray-400 py-12 text-center animate-pulse">Loading restaurant menu...</div>;
  }

  if (!menuItems || menuItems.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl bg-white">
        <span className="text-4xl block mb-2">🍽️</span>
        <h4 className="text-base font-bold text-gray-800">Your Menu is Empty</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          Get started by navigating to the Add Item tab to upload your first signature dish.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {menuItems.map((item) => (
        <div key={item._id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition">
          <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-gray-50 shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-base truncate text-gray-900">{item.name}</h4>
                <span className="text-sm font-black text-[#E65100]">₹{item.price}</span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{item.description}</p>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-2">
              <button
                onClick={() => handleToggleAvailability(item._id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                  item.isAvailable
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {item.isAvailable ? "● Available" : "○ Out of Stock"}
              </button>
              <button onClick={() => handleDeleteItem(item._id)} className="text-xs font-semibold text-red-500 hover:text-red-700 p-1 transition">
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}