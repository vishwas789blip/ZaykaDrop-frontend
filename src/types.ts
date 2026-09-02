import type { Dispatch, SetStateAction } from "react";

export interface IUser {
  _id?: string;
  name: string;
  email?: string;
  image: string;
  role: string | null;
  restaurantId?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface AppContextType {
  user: IUser | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  location: LocationData | null;
  loadingLocation: boolean;
  city: string;
  setManualLocation: (loc: LocationData, cityName: string) => void;
  refreshCurrentLocation: () => void;                                     
  cart: any[];
  setCart: Dispatch<SetStateAction<any[]>>;
  subTotal: number;
  setSubTotal: Dispatch<SetStateAction<number>>;
  quantity: number;
  setQuantity: Dispatch<SetStateAction<number>>;
  fetchCart: () => Promise<void>;
  menuItems: any[];
  setMenuItems: Dispatch<SetStateAction<any[]>>;
  loadingMenu: boolean;
  fetchMenu: (restaurantId: string) => Promise<void>;
}

export interface IRestaurant {
  _id: string;
  name: string;
  description?: string;
  image: string;
  ownerId: string;
  phone: string;
  isVerified: boolean;
  autoLocation: {
    type: "Point";
    coordinates: [number, number];
    formattedAddress: string;
  };
  isOpen?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  _id: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  isAvailable: boolean;
}

export interface ICart {
  _id: string;
  userId: string;
  restaurantId: IRestaurant | string;
  itemId: ICartItem;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  _id: string;
  userId: string;
  phone: number;              // NOT mobile
  formattedAddress: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude] — GeoJSON order
  };
  pincode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder {
  _id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  riderId?: string | null;
  riderPhone: number | null;
  riderName: string | null;
  distance: number;
  riderAmount: number;

  items: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }[];

  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  totalAmount: number;

  addressId: string;

  deliveryAddress: {
    formattedAddress: string;
    mobile: number;
    latitude: number;
    longitude: number;
  };

  status:
    | "placed"
    | "accepted"
    | "preparing"
    | "ready_for_rider"
    | "rider_assigned"
    | "picked_up"
    | "delivered"
    | "cancelled";

  paymentMethod: "COD" | "Razorpay" | "Stripe";
  paymentStatus: "pending" | "paid" | "failed";

  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRider {
    _id: string; 
    picture: string;
    phoneNumber: string;
    aadharNumber: string;
    drivingLicenseNumber: string;
    isVerified: boolean;
    rating: {
        average: number;
        count: number;
    };
    vehicleNumber: string;
}
