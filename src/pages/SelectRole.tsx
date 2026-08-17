import React, { useState } from 'react';
import axios from "axios";
import toast from "react-hot-toast";
import { useAppData } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../utils/constant';

type Role = "customer" | "rider" | "seller"; 

interface RoleOption {
  label: string;
  value: Role;
  sub: string;
  icon: string;
}

const roles: RoleOption[] = [
  { label: "Customer", value: "customer", sub: "Order delicious food right to your doorstep", icon: "🍔" },
  { label: "Rider",    value: "rider",    sub: "Join our fleet and earn by delivering packages", icon: "🏍️" },
  { label: "Seller",   value: "seller",   sub: "Grow your restaurant business with us", icon: "👨‍🍳" },
];

function SelectRole() {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAppData();
  const navigate = useNavigate();

  const addRole = async () => {
    if (!role) return toast.error("Please select a role first");

    const token = localStorage.getItem("token");
    if (!token) return toast.error("Please log in to continue");

    setLoading(true);

    try {
      const { data } = await axios.put(`${authService}/api/auth/add/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem("token", data.token);
      setUser(data.user);
      toast.success("Role configured successfully!");
      navigate("/", { replace: true });                    
    } catch (error) {
      toast.error("Something went wrong. Please try again.");  
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-xl shadow-gray-100/50">

        {/* Brand Header */}
        <div className="bg-gradient-to-r from-[#FF9933] to-[#E65100] px-6 py-6 text-white">
          <h2 className="text-2xl font-black tracking-tight mb-2">
            zayka<span className="text-gray-900 opacity-90">Drop</span>
          </h2>
          <p className="text-lg font-semibold text-orange-50">Welcome to ZaykaDrop</p>
          <p className="text-xs text-orange-100/80">Please select your account type to proceed</p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <div className="flex flex-col gap-3 mb-6">
            {roles.map((r) => {
              const isSelected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-[#FF9933] bg-[#FF9933]/5 ring-1 ring-[#FF9933]"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl" role="img" aria-label={r.label}>
                      {r.icon}
                    </span>
                    <div>
                      <p className={`text-base font-bold ${isSelected ? "text-[#E65100]" : "text-[#212121]"}`}>
                        {r.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.sub}
                      </p>
                    </div>
                  </div>
                  
                  {/* Visual Radio Check Indicator */}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? "border-[#FF9933] bg-[#FF9933]" : "border-gray-300"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={addRole}
            disabled={!role || loading}
            className="w-full py-3 bg-gradient-to-r from-[#FF9933] to-[#E65100] hover:from-[#E65100] hover:to-[#d84315] disabled:from-gray-300 disabled:to-gray-400 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/10 transition duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              "Continue"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default SelectRole;