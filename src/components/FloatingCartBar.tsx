import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useAppData } from "../context/AppContext";

export default function FloatingCartBar() {
  const { cart, subTotal } = useAppData();
  const navigate = useNavigate();

  // Total items count
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-4 animate-slide-up">
      <button
        onClick={() => navigate("/cart")}
        className="w-full max-w-sm bg-[#FF9933] hover:bg-[#E65100] text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg shadow-orange-300/40 transition-all duration-200 active:scale-95"
      >
        {/* Left — item count badge */}
        <div className="flex items-center gap-2">
          <span className="bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-lg">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Center — label */}
        <div className="flex items-center gap-2 font-black text-sm tracking-wide">
          <ShoppingBag className="w-4 h-4" />
          View Cart
        </div>

        {/* Right — subtotal */}
        <span className="font-black text-sm">₹{subTotal}</span>
      </button>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}