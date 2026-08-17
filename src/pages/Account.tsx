import { useAppData } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShoppingBag, MapPin, LogOut } from 'lucide-react'

const Account = () => {
    const { user, setUser, setIsAuth } = useAppData(); 
    const navigate = useNavigate();
    
    const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : '?';

    const logoutHandler = () => {
        localStorage.removeItem("token");
        setUser(null);
        setIsAuth(false);
        toast.success("Logged out successfully");
        navigate("/login", { replace: true });
    };

    const goToMyOrder = () => { navigate("/AllOrder"); }

    const goToAddress = () => { navigate("/address"); }

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 text-[#212121]">
            <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/40 overflow-hidden">
                
                {/* Profile Info Header with ZaykaDrop Accent */}
                <div className="flex items-center gap-4 p-5 border-b border-gray-100 bg-gradient-to-r from-orange-50/30 to-transparent">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FF9933] to-[#E65100] flex items-center justify-center text-white text-xl font-black shadow-md shadow-orange-500/10">
                        {firstLetter}
                    </div>
                    <div>
                        <h3 className="text-gray-900 font-bold text-base leading-tight">
                            {user?.name || "User Profile"}
                        </h3>
                        <p className="text-gray-400 text-xs mt-0.5">
                            {user?.email || "profile@example.com"}
                        </p>
                    </div>
                </div>

                {/* Profile Action Menu Items */}
                <div className="flex flex-col p-2">
                    <button onClick={goToMyOrder} className="flex items-center gap-4 px-4 py-3.5 text-gray-700 hover:text-[#E65100] hover:bg-orange-50/30 rounded-xl transition text-left group">
                        <div className="p-2 bg-gray-50 group-hover:bg-orange-50 rounded-lg text-gray-500 group-hover:text-[#FF9933] transition">
                            <ShoppingBag className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold">Your Orders</span>
                    </button>

                    <button onClick={goToAddress} className="flex items-center gap-4 px-4 py-3.5 text-gray-700 hover:text-[#E65100] hover:bg-orange-50/30 rounded-xl transition text-left group">
                        <div className="p-2 bg-gray-50 group-hover:bg-orange-50 rounded-lg text-gray-500 group-hover:text-[#FF9933] transition">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold">Saved Addresses</span>
                    </button>

                    <hr className="my-2 border-gray-100 mx-4" />

                    <button 
                        onClick={logoutHandler}
                        className="flex items-center gap-4 px-4 py-3.5 text-gray-600 hover:text-red-600 hover:bg-red-50/40 rounded-xl transition text-left w-full group"
                    >
                        <div className="p-2 bg-gray-50 group-hover:bg-red-50 rounded-lg text-gray-400 group-hover:text-red-500 transition">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold">Sign Out</span>
                    </button>
                </div>

                {/* Micro Footer Accent */}
                <div className="bg-gray-50 border-t border-gray-100 py-3 text-center">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                        ZaykaDrop Security Verification v1.0
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Account;