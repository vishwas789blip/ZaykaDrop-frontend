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
    const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);
    const { socket } = useSocket();

    useEffect(() => {
        if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) {
            return;
        }

        const fetchRiderLocation = () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    setRiderLocation([latitude, longitude]);

                    if (socket) {
                        socket.emit("rider:location-update", {
                            userId: order.userId,
                            latitude,
                            longitude,
                        });
                    }
                },
                (err) => {
                    console.error('Geolocation error:', err);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000,
                }
            );
        };

        fetchRiderLocation();
        const interval = setInterval(fetchRiderLocation, 10000);

        return () => clearInterval(interval);
    }, [order.userId, order.riderId, order.deliveryAddress.latitude, order.deliveryAddress.longitude, socket]);

    if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) {
        return null;
    }

    if (!riderLocation) {
        return null;
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
        </div>
    );
};

export default RiderOrderMap;