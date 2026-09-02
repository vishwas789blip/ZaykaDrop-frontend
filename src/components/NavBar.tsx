import { useEffect, useState } from "react";
import { useLocation, useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import LocationSelectorModal from "../pages/LocationSelectorModal"; 

const Navbar = () => {
  const { isAuth, city, loadingLocation } = useAppData();
  const currLocation = useLocation();
  const navigate = useNavigate();
  const isHomePage = currLocation.pathname === "/";

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showLocationModal, setShowLocationModal] = useState(false); 

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        setSearchParams({ search });
      } else {
        setSearchParams({});
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, setSearchParams]);

  return (
    <nav className="bg-white border-b border-gray-100 px-4 md:px-8 h-16 flex items-center justify-between gap-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF9933] to-[#E65100] flex items-center justify-center font-black text-white text-lg shadow-md shadow-orange-500/20">
            Z
          </div>
          <span className="text-xl font-black tracking-tight text-[#FF9933] hidden sm:block">
            zayka<span className="text-[#212121]">Drop</span>
          </span>
        </Link>

        {/* Location Selector — ab clickable hai */}
        <button
          onClick={() => setShowLocationModal(true)}
          className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100/80 px-3 py-1.5 rounded-xl border border-gray-100 transition cursor-pointer max-w-[160px] sm:max-w-xs"
        >
          <svg className="w-4 h-4 text-[#FF9933] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[#212121] text-xs font-semibold truncate">
            {loadingLocation ? (
              <span className="text-gray-400 animate-pulse">Locating...</span>
            ) : (
              city
            )}
          </span>
        </button>
      </div>

      {isHomePage ? (
        <div className="relative flex-1 max-w-md hidden md:block">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for restaurants, cuisines, or dishes..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-100 text-[#212121] placeholder-gray-400 text-sm outline-none focus:bg-white focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933] transition-all"
          />
        </div>
      ) : (
        <div className="flex-1 hidden md:block"></div>
      )}

      <div className="flex items-center gap-3 shrink-0">
        {isAuth ? (
          <>
            <button
              onClick={() => navigate("/cart")}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#212121] border border-gray-100 transition group"
            >
              <svg className="w-5 h-5 text-gray-700 group-hover:text-[#FF9933] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E65100]" />
            </button>

            <button
              onClick={() => navigate("/account")}
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-100 text-[#212121] text-sm font-semibold transition"
            >
              <div className="w-6 h-6 rounded-full bg-[#FF9933]/10 text-[#E65100] flex items-center justify-center text-xs font-bold border border-[#FF9933]/20">
                Z
              </div>
              <span className="hidden sm:inline text-xs text-gray-700">Account</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF9933] to-[#E65100] hover:from-[#E65100] hover:to-[#d84315] text-white text-sm font-bold shadow-md shadow-orange-500/10 transition"
          >
            Login
          </Link>
        )}
      </div>

      {/* ✅ Modal */}
      {showLocationModal && (
        <LocationSelectorModal onClose={() => setShowLocationModal(false)} />
      )}
    </nav>
  );
};

export default Navbar;