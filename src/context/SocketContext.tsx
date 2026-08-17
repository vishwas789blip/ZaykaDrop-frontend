import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAppData } from "./AppContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ 
  socket: null, 
  isConnected: false 
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuth } = useAppData();
  // Using State instead of Ref so child components actually get the update!
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // If user is not logged in, kill any existing connection safely
    if (!isAuth) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to the Socket server using your environment service URL
    const socketInstance = io(import.meta.env.VITE_REALTIME_SERVICE, {
      auth: {
        token: localStorage.getItem("token"),
      },
      transports: ["websocket"],
    });

    // Handle internal event hooks to change network status state
    socketInstance.on("connect", () => {
      console.log("Socket Connected:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket Disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket Error:", err.message);
      setIsConnected(false);
    });

    // Expose the instance to state so context propagates it downstream
    setSocket(socketInstance);

    // Cleanup connection completely when component unmounts or auth changes
    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuth]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);