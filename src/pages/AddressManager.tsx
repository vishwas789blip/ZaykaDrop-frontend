import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { resturentService } from "../utils/constant";
import L from "leaflet";
import { LuLocateFixed } from "react-icons/lu";
import { BiLoader, BiPlus, BiTrash } from "react-icons/bi";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Address {
  _id: string;
  formattedAddress: string;
  phone: number;
}

const LocationPicker = ({
  setLocation,
}: {
  setLocation: (lat: number, lng: number) => void;
}) => {
  const map = useMap();
  useMapEvents({
    click(e) {
      map.flyTo([e.latlng.lat, e.latlng.lng], map.getZoom(), { animate: true });
      setLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const RecenterMap = ({ lat, lng }: { lat: number | null; lng: number | null }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
};

const LocateMeButton = ({
  onLocate,
}: {
  onLocate: (lat: number, lng: number) => void;
}) => {
  const map = useMap();
  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { animate: true });
        onLocate(latitude, longitude);
      },
      () => toast.error("Location permission denied")
    );
  };
  return (
    <button
      type="button"
      onClick={locateUser}
      className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow hover:bg-gray-100 font-semibold text-gray-700"
    >
      <LuLocateFixed size={16} className="text-[#E23744]" />
      Use current location
    </button>
  );
};

const AddAddressPage = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [mobile, setMobile] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [pincode, setPincode] = useState("");           // ← NEW
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const fetchFormattedAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "User-Agent": "ZaykaDropFoodApp/1.0 (vishwashprajapati.dev@gmail.com)",
          },
        }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFormattedAddress(data.display_name || "Selected Location");
      setPincode(data.address?.postcode || "");         // ← dynamic pincode
    } catch {
      toast.error("Couldn't fetch address for this location.");
    }
  };

  const setLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    fetchFormattedAddress(lat, lng);
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get(`${resturentService}/api/address/my`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setAddresses(data.addresses || data || []);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const addAddress = async () => {
    if (!mobile || !formattedAddress || latitude === null || longitude === null) {  // ← mobile (was !phone)
      toast.error("Please select a location on the map first.");
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setAdding(true);
      await axios.post(
        `${resturentService}/api/address/new`,
        {
          formattedAddress,
          phone: Number(mobile),   // ← phone key, mobile value (was mobile: Number(phone))
          latitude,
          longitude,
          pincode,                 // ← dynamic (was hardcoded "201001")
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Address saved successfully!");
      setMobile("");
      setFormattedAddress("");
      setPincode("");              // ← reset
      setLatitude(null);
      setLongitude(null);
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!window.confirm("Delete this address?")) return;   // ← clean string
    try {
      setDeletingId(id);
      await axios.delete(`${resturentService}/api/address/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete address.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Select Delivery Address</h1>
        <p className="text-xs text-gray-400 font-medium">Click on the map to pin your delivery location.</p>
      </div>

      <div className="relative h-96 w-full overflow-hidden rounded-2xl border border-gray-100 shadow-sm z-0">
        <MapContainer
          center={[latitude || 28.6139, longitude || 77.209]}
          zoom={13}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <LocationPicker setLocation={setLocation} />
          <LocateMeButton onLocate={setLocation} />
          <RecenterMap lat={latitude} lng={longitude} />
          {latitude && longitude && <Marker position={[latitude, longitude]} />}
        </MapContainer>
      </div>

      {formattedAddress && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm font-medium text-emerald-800 leading-relaxed shadow-sm">
          📍 <span className="font-bold text-emerald-900">Selected:</span> {formattedAddress}
          {pincode && <span className="ml-2 text-emerald-600 font-bold">— {pincode}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Mobile Number</label>
          <input
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full text-sm rounded-xl border border-gray-100 bg-white px-4 py-2.5 focus:outline-none focus:border-orange-200 transition"
          />
        </div>

        <div className="flex items-end">
          <button
            disabled={adding}
            onClick={addAddress}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#E23744] py-3 text-sm font-bold text-white hover:bg-[#d32f3a] transition shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            {adding ? <BiLoader className="animate-spin" /> : <BiPlus className="stroke-[3]" />}
            Save Address
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-black tracking-tight text-gray-900 border-b border-gray-100 pb-2">
          Saved Addresses
        </h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((n) => (
              <div key={n} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-gray-400 font-medium py-4">No saved addresses yet.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition duration-200 gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-bold text-gray-800 leading-normal break-words">
                    {addr.formattedAddress}
                  </p>
                  <p className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                    📞 {addr.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteAddress(addr._id)}
                  disabled={deletingId === addr._id}
                  className="rounded-xl p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition shrink-0 disabled:opacity-50 active:scale-90"
                >
                  {deletingId === addr._id ? (
                    <BiLoader size={16} className="animate-spin text-red-500" />
                  ) : (
                    <BiTrash size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAddressPage;