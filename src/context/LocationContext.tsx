import { createContext, useContext, useState, useEffect,ReactNode  } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { resturentService } from "../utils/constant";

interface SelectedLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  addressId?: string; // saved address se select kiya hai toh uska id
}

interface LocationContextType {
  location: SelectedLocation | null;
  setLocationManually: (loc: SelectedLocation) => void;
  useCurrentLocation: () => void;
  loadingLocation: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = "selectedLocation";

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // App load hote hi pehle localStorage check karo, warna GPS try karo
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setLocation(JSON.parse(saved));
    } else {
      useCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "User-Agent": "ZaykaDropFoodApp/1.0 (vishwashprajapati.dev@gmail.com)",
          },
        }
      );
      const data = await res.json();
      return data.display_name || "Current Location";
    } catch {
      return "Current Location";
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const formattedAddress = await reverseGeocode(latitude, longitude);

        const newLoc: SelectedLocation = { latitude, longitude, formattedAddress };
        setLocation(newLoc);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
        setLoadingLocation(false);
      },
      () => {
        toast.error("Location permission denied");
        setLoadingLocation(false);
      }
    );
  };

  const setLocationManually = (loc: SelectedLocation) => {
    setLocation(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  };

  return (
    <LocationContext.Provider
      value={{ location, setLocationManually, useCurrentLocation, loadingLocation }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
};