import { useNavigate } from "react-router-dom";
import { MapPin, Clock } from "lucide-react"; // Using professional icons matching ZaykaDrop theme

interface RestaurantCardProps {
  id: string;
  image: string;
  name: string;
  distance?: string;
  isOpen: boolean;
}

const RestaurantCard = ({ id, image, name, distance, isOpen }: RestaurantCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={`cursor-pointer overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group ${
        !isOpen ? "opacity-75 filter grayscale-[30%]" : ""
      }`}
      onClick={() => navigate(`/restaurant/${id}`)}
    >
      {/* Restaurant Image Banner Frame */}
      <div className="relative h-44 w-full bg-gray-50 overflow-hidden">
        <img
          src={image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500"} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Absolute Status Badge overlay */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm border ${
              isOpen
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            {isOpen ? "● Open Now" : "○ Closed"}
          </span>
        </div>
      </div>

      {/* Card Metadata Details content info area */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-base text-gray-900 group-hover:text-[#E65100] transition truncate">
            {name || "Premium Kitchen"}
          </h4>
        </div>

        {/* Dynamic Location metrics mapping row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-50">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
            <span className="font-medium truncate max-w-[120px]">
              {distance ? `${distance} km` : "Nearby"}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-medium text-gray-500">25-35 mins</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;