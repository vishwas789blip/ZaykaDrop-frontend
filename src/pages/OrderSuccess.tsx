import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Map } from "lucide-react";

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [counter, setCounter] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(`/order/${id}`); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = ((10 - counter) / 10) * 100;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-sm w-full shadow-sm">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF9933] to-[#E65100] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-white w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">Order confirmed!</h1>
        <p className="text-sm text-gray-500 mb-4">Restaurant will start preparing shortly.</p>
        <span className="bg-orange-50 text-[#E65100] text-xs font-bold px-3 py-1.5 rounded-lg">
          #{id?.toUpperCase()}
        </span>
        <hr className="my-5 border-gray-100" />
        <p className="text-sm text-gray-500 mb-2">
          Redirecting in <span className="font-bold text-[#E65100]">{counter}s</span>
        </p>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-[#FF9933] to-[#E65100] transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          onClick={() => navigate(`/order/${id}`)}
          className="w-full py-3 bg-gradient-to-r from-[#FF9933] to-[#E65100] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
        >
          <Map className="w-4 h-4" /> Track order now
        </button>
      </div>
    </div>
  );
}