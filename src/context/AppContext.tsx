import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import axios from "axios";
import { authService, resturentService } from "../utils/constant";
import type { AppContextType, IUser, LocationData } from "../types";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [city, setCity] = useState("Fetching location...");

  const [cart, setCart] = useState<any[]>([]);
  const [subTotal, setSubTotal] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${authService}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Invalid session token");

      const data = await res.json();
      setUser(data.user || data);  
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
      setUser(null);
      localStorage.removeItem("token");
      console.error("Auth initialization error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (!user || user.role !== "customer") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const { data } = await axios.get(`${resturentService}/api/cart/get`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const activeCartArray = data.cart || [];
      setCart(activeCartArray);

      const computedTotal = activeCartArray.reduce(
        (sum: number, item: any) => sum + (item.itemId?.price || 0) * item.quantity, 
        0
      );
      const computedQuantity = activeCartArray.reduce(
        (sum: number, item: any) => sum + item.quantity, 
        0
      );

      setSubTotal(computedTotal);
      setQuantity(computedQuantity);
    } catch (error) {
      console.error("Error synchronizing active cart storage:", error);
    }
  }, [user]);

  const fetchMenu = useCallback(async (restaurantId: string) => {
    if (!restaurantId) return;
    
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoadingMenu(true);
      const { data } = await axios.get(
        `${resturentService}/api/menu/all/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error synchronizing menu records:", error);
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isAuth && user?.role === "customer") {
      fetchCart();
    }
  }, [isAuth, user, fetchCart]);

  // ── Fixed & Cached Geolocation Operations Pipeline ──
  useEffect(() => {
    // Stop redundant geolocation pings if memory already has active records
    if (location && city !== "Fetching location...") return;

    if (!navigator.geolocation) {  
      setCity("Location unsupported");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(  
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                "User-Agent": "ZaykaDropFoodApp/1.0 (vishwashprajapati.dev@gmail.com)"
              }
            }
          );
          
          if (!res.ok) throw new Error("API Limit Block hit");
          const data = await res.json();

          setLocation({
            latitude,
            longitude,
            formattedAddress: data.display_name || "Current location", 
          });

          setCity(
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "Your location"
          );
        } catch (error) {
          setCity("Location unavailable");  
          console.error("Reverse geocoding lock failure:", error);
        } finally {
          setLoadingLocation(false);        
        }
      },
      (error) => {
        setCity("Location denied");
        setLoadingLocation(false);
        console.warn("Geolocation access tracking rejected:", error);
      }
    );
  }, []);  

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuth,
        setIsAuth,
        loading,
        setLoading,
        loadingLocation,
        city,
        location,
        cart,
        setCart,
        subTotal,
        setSubTotal,
        quantity,
        setQuantity,
        fetchCart,
        menuItems,
        setMenuItems,
        loadingMenu,
        fetchMenu,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be checked inside an active AppProvider system tree configuration frame");
  }
  return context;
};