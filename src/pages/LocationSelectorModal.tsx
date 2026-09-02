import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { resturentService } from "../utils/constant";
import { useAppData } from "../context/AppContext";
import { LuLocateFixed } from "react-icons/lu";
import { BiLoader, BiX } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

interface Address {
  _id: string;
  formattedAddress: string;
  phone: number;
  location: { coordinates: [number, number] }; // [lng, lat]
}

const LocationSelectorModal = ({ onClose }: { onClose: () => void }) => {
  const { setManualLocation, refreshCurrentLocation, loadingLocation } = useAppData();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await axios.get(`${resturentService}/api/address/my`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAddresses(data.addresses || data || []);
      } catch {
        toast.error("Failed to load addresses");
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, []);

  const handleSelectSaved = (addr: Address) => {
    const [lng, lat] = addr.location.coordinates;

    // Saved address ka city naam formattedAddress ke pehle part se le lo (simple fallback)
    const cityGuess = addr.formattedAddress.split(",")[0]?.trim() || "Selected address";

    setManualLocation(
      { latitude: lat, longitude: lng, formattedAddress: addr.formattedAddress },
      cityGuess
    );
    onClose();
  };

  const handleUseCurrent = () => {
    refreshCurrentLocation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/40 p-4 pt-20">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">Select Location</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <BiX size={22} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <button
            onClick={handleUseCurrent}
            disabled={loadingLocation}
            className="w-full flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-[#E23744] hover:bg-orange-100 transition disabled:opacity-50"
          >
            {loadingLocation ? (
              <BiLoader className="animate-spin" size={18} />
            ) : (
              <LuLocateFixed size={18} />
            )}
            Use current location
          </button>

          <button
            onClick={() => {
              onClose();
              navigate("/address");
            }}
            className="w-full text-sm font-bold text-gray-600 border border-dashed border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition"
          >
            + Add new address
          </button>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
              Saved Addresses
            </h3>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((n) => (
                  <div key={n} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <p className="text-sm text-gray-400 font-medium py-2">No saved addresses yet.</p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <button
                    key={addr._id}
                    onClick={() => handleSelectSaved(addr)}
                    className="w-full text-left rounded-xl border border-gray-100 px-4 py-3 hover:border-orange-200 hover:bg-orange-50/40 transition"
                  >
                    <p className="text-sm font-bold text-gray-800 line-clamp-2">
                      {addr.formattedAddress}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">📞 {addr.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSelectorModal;