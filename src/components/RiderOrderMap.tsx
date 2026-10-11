import type { IOrder } from '../types';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { getRouting } from '../utils/leafletRouting';
import { useSocket } from '../context/SocketContext';

const riderIcon = new L.DivIcon({
    html: '<div class="bg-blue-500 w-6 h-6 rounded-full border-2 border-white"></div>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const deliveryIcon = new L.DivIcon({
    html: '<div class="bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

interface Props {
    order: IOrder;
}

const Routing = ({
    from,
    to,
}: {
    from: [number, number];
    to: [number, number];
}) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const routing = getRouting();
        if (!routing || typeof routing.control !== 'function') {
            const fallbackLine = L.polyline([from, to], {
                color: 'blue',
                opacity: 0.6,
                weight: 4,
                dashArray: '6, 8',
            }).addTo(map);

            return () => {
                try {
                    map.removeLayer(fallbackLine);
                } catch {
                    /* no-op */
                }
            };
        }

        let control: any = null;
        try {
            control = routing.control({
                waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
                lineOptions: {
                    styles: [{ color: 'blue', opacity: 0.6, weight: 4 }],
                },
                addWaypoints: false,
                routeWhileDragging: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                showAlternatives: false,
                show: false,
                collapsible: false,
                createMarker: () => null,
                router: routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1',
                }),
            }).addTo(map);
        } catch (err) {
            console.warn('Failed to initialize routing control:', err);
            const fallbackLine = L.polyline([from, to], {
                color: 'blue',
                opacity: 0.6,
                weight: 4,
                dashArray: '6, 8',
            }).addTo(map);

            return () => {
                try {
                    map.removeLayer(fallbackLine);
                } catch {
                    /* no-op */
                }
            };
        }

        return () => {
            try {
                if (control) {
                    map.removeControl(control);
                }
            } catch {
                /* no-op */
            }
        };
    }, [from[0], from[1], to[0], to[1], map]);

    return null;
};

const RiderOrderMap = ({ order }: Props) => {
    const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
        order.riderLocation?.latitude != null && order.riderLocation?.longitude != null
            ? [order.riderLocation.latitude, order.riderLocation.longitude]
            : null
    );
    const { socket } = useSocket();

    const emitLocation = (lat: number, lng: number) => {
        setRiderLocation([lat, lng]);
        if (socket) {
            socket.emit("rider:location-update", {
                userId: order.userId,
                orderId: order._id,
                latitude: lat,
                longitude: lng,
            });
        }
    };

    useEffect(() => {
        if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) {
            return;
        }

        // 1. One immediate fetch
        navigator.geolocation.getCurrentPosition(
            (pos) => emitLocation(pos.coords.latitude, pos.coords.longitude),
            (err) => console.warn('Initial GPS fetch error:', err),
            { enableHighAccuracy: true, timeout: 5000 }
        );

        // 2. Hardware-level GPS watch for true moving updates
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                emitLocation(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => console.warn('GPS Watch error:', err),
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000,
            }
        );

        // 3. Heartbeat emitter every 5 seconds to ensure customer map stays live
        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (pos) => emitLocation(pos.coords.latitude, pos.coords.longitude),
                () => {},
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }, 5000);

        return () => {
            navigator.geolocation.clearWatch(watchId);
            clearInterval(interval);
        };
    }, [order.userId, order._id, order.deliveryAddress.latitude, order.deliveryAddress.longitude, socket]);

    // Allows rider / tester on PC to simulate step-by-step movement towards the delivery address
    const simulateStep = () => {
        if (!riderLocation || order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) return;
        const targetLat = order.deliveryAddress.latitude;
        const targetLng = order.deliveryAddress.longitude;
        const stepFraction = 0.15; // move 15% closer to destination
        const newLat = riderLocation[0] + (targetLat - riderLocation[0]) * stepFraction;
        const newLng = riderLocation[1] + (targetLng - riderLocation[1]) * stepFraction;
        emitLocation(newLat, newLng);
    };

    if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) {
        return null;
    }

    if (!riderLocation) {
        return (
            <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                Connecting to device GPS for live tracking...
            </div>
        );
    }

    const deliveryLocation: [number, number] = [
        order.deliveryAddress.latitude,
        order.deliveryAddress.longitude,
    ];

    return (
        <div>
            <MapContainer center={riderLocation} zoom={13} style={{ height: '400px', width: '100%' }}>
                <TileLayer
                    attribution="&copy; Openstreetmap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={riderLocation} icon={riderIcon}>
                    <Popup>Rider Location</Popup>
                </Marker>
                <Marker position={deliveryLocation} icon={deliveryIcon}>
                    <Popup>Delivery Location</Popup>
                </Marker>

                <Routing from={riderLocation} to={deliveryLocation} />
            </MapContainer>
            <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-b-xl border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Live GPS Streaming Active
                </span>
                <button
                    type="button"
                    onClick={simulateStep}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold transition cursor-pointer"
                >
                    🛵 Move Closer (Test Step)
                </button>
            </div>
        </div>
    );
};

export default RiderOrderMap;