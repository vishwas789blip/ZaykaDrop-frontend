import { useAppData } from '../context/AppContext';
import Navbar from '../components/NavBar';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import type { IRestaurant }  from '../types';
import axios from 'axios';
import { resturentService } from '../utils/constant';
import RestaurantCard from '../components/ResturantCard';
import ActiveOrderBanner from "../components/ActiveOrderBanner";


export const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

const Home = () => {
  const { location } = useAppData();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = useCallback(async () => {
    if (!location?.latitude || !location?.longitude) {
      setLoading(false);
      return;
    }

    try {
    setLoading(true);
    const token = localStorage.getItem("token");
    const { data } = await axios.get(`${resturentService}/api/restaurant/all`, {
      params: {
        latitude: location?.latitude,
        longitude: location?.longitude,
        search,
      },
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

  setRestaurants(data.restaurants ?? []);
} catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [location, search]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  if (loading || !location) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500 animate-pulse">
        Finding delicious food near you...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {restaurants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 max-w-sm mx-auto shadow-sm mt-12">
            <span className="text-4xl block mb-2">🔍</span>
            <h4 className="text-base font-bold text-gray-800">No Restaurants Found</h4>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search criteria or looking around another nearby location area.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {restaurants.map((res) => {
              const [resLng, resLat] = res.autoLocation?.coordinates || [0, 0];
              const distance = getDistanceKm(
                location.latitude,
                location.longitude,
                resLat,
                resLng
              );

              return (
                <RestaurantCard
                  key={res._id}
                  id={res._id}
                  name={res.name}
                  image={res.image}
                  distance={String(distance)}
                  isOpen={res.isOpen ?? true}
                />
              );
            })}
          </div>
        )}
      </main>
      <ActiveOrderBanner />

    </div>
  );
};

export default Home;