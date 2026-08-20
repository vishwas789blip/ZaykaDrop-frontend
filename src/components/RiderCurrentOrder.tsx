import axios from "axios";
import type { IOrder } from "../types";
import toast from "react-hot-toast";
import { riderService } from "../utils/constant";
import RiderOrderMap from "./RiderOrderMap";

interface RiderCurrentOrderProps {
  order: IOrder;
  onStatusUpdate: () => void;
}

const RiderCurrentOrder = ({ order, onStatusUpdate }: RiderCurrentOrderProps) => {
  const updateStatus = async (status: string) => {
    try {
      await axios.put(
        `${riderService}/api/rider/order/update-status/${order._id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(`Order status updated to ${status}`);
      await onStatusUpdate();
    } catch (error) {
      toast.error("Error updating order status");
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="p-4 border rounded shadow-md flex flex-col gap-2">
      <h2 className="text-xl font-bold mb-2">Current Order</h2>

      <div>
        <span className="font-medium">Pickup: </span>
        {order.deliveryAddress?.formattedAddress}
      </div>

      <div>
        <span className="font-medium">Drop: </span>
        {order.deliveryAddress?.formattedAddress}
      </div>

      <div>
        <span className="font-medium">Total: </span>
        ₹{order.totalAmount}
      </div>

      <div>
        <span className="font-medium">Your Earnings: </span>
        ₹{order.riderAmount}
      </div>

      <div>
        <span className="font-medium">Status: </span>
        {order.status}
      </div>

      <RiderOrderMap order={order} />

      {order.deliveryAddress?.mobile && (
        <div className="mb-2 flex items-center gap-2">
          <span>Customer phone: {order.deliveryAddress.mobile}</span>
          
           <a href={`tel:${order.deliveryAddress.mobile}`}
            className="text-blue-500 underline"
          >
            Call
          </a>
        </div>
      )}

      {order.status === "rider_assigned" && (
        <button
          onClick={() => updateStatus("picked_up")}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Mark as Picked Up
        </button>
      )}

      {order.status === "picked_up" && (
        <button
          onClick={() => updateStatus("delivered")}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Mark as Delivered
        </button>
      )}
    </div>
  );
};

export default RiderCurrentOrder;