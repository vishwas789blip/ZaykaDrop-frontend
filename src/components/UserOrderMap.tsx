import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { getRouting } from '../utils/leafletRouting';

const riderIcon = new L.DivIcon({
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:32px;height:32px;background-color:#38bdf8;border-radius:9999px;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;opacity:0.75;"></div>
    <div style="position:relative;width:28px;height:28px;background-color:#2563eb;border-radius:9999px;border:2px solid white;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;font-size:14px;">🛵</div>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const deliveryIcon = new L.DivIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;">
    <div style="width:28px;height:28px;background-color:#16a34a;border-radius:9999px;border:2px solid white;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface RoutingProps {
  from: [number, number];
  to: [number, number];
  onError?: () => void;
  onRouteFound?: (summary: { distance: number; time: number }) => void;
}

// Draws / updates the OSRM route line between rider and delivery address.
const Routing = ({ from, to, onError, onRouteFound }: RoutingProps) => {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // If control already exists, just update waypoints without destroying and recreating
    if (controlRef.current && typeof controlRef.current.setWaypoints === 'function') {
      try {
        controlRef.current.setWaypoints([L.latLng(from[0], from[1]), L.latLng(to[0], to[1])]);
        return;
      } catch (err) {
        console.warn('Failed to update waypoints on existing control:', err);
      }
    }

    const routing = getRouting();
    if (!routing || typeof routing.control !== 'function') {
      const fallbackLine = L.polyline([from, to], {
        color: '#3b82f6',
        opacity: 0.7,
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
          styles: [{ color: '#3b82f6', opacity: 0.7, weight: 4 }],
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
      });

      control.on('routesfound', (e: any) => {
        const route = e.routes?.[0];
        if (route && onRouteFound) {
          onRouteFound({ distance: route.summary.totalDistance, time: route.summary.totalTime });
        }
      });

      control.on('routingerror', () => {
        onError?.();
      });

      control.addTo(map);
      controlRef.current = control;
    } catch (err) {
      console.warn('Failed to initialize routing control:', err);
      onError?.();
      const fallbackLine = L.polyline([from, to], {
        color: '#3b82f6',
        opacity: 0.7,
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
        /* no-op — map already gone */
      }
      controlRef.current = null;
    };
  }, [from[0], from[1], to[0], to[1], map, onError, onRouteFound]);

  return null;
};

// Keeps the map view following the rider without fighting user pan/zoom too aggressively —
// only recenters when the rider has actually moved.
const RecenterOnMove = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  const prevPos = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!map) return;
    const [lat, lng] = position;
    const prev = prevPos.current;
    const moved = !prev || prev[0] !== lat || prev[1] !== lng;
    if (moved) {
      map.panTo([lat, lng], { animate: true });
      prevPos.current = position;
    }
  }, [position, map]);

  return null;
};

interface Props {
  riderLocation: [number, number];
  deliveryAddress: [number, number];
}

function formatEta(seconds: number) {
  const mins = Math.round(seconds / 60);
  return mins <= 1 ? '< 1 min' : `${mins} mins`;
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

const UserOrderMap = ({ riderLocation, deliveryAddress }: Props) => {
  const [routeError, setRouteError] = useState(false);
  const [routeSummary, setRouteSummary] = useState<{ distance: number; time: number } | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl overflow-hidden border border-gray-100">
        <MapContainer
          center={riderLocation}
          zoom={14}
          style={{ height: '400px', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={riderLocation} icon={riderIcon}>
            <Popup>Rider Location</Popup>
          </Marker>
          <Marker position={deliveryAddress} icon={deliveryIcon}>
            <Popup>Delivery Location</Popup>
          </Marker>

          <Routing
            from={riderLocation}
            to={deliveryAddress}
            onError={() => setRouteError(true)}
            onRouteFound={summary => {
              setRouteError(false);
              setRouteSummary(summary);
            }}
          />
          <RecenterOnMove position={riderLocation} />
        </MapContainer>
      </div>

      {/* Route status strip — quietly degrades if OSRM is unreachable */}
      {routeError ? (
        <p className="text-xs text-gray-400 text-center">
          Live route unavailable right now — showing last known positions only.
        </p>
      ) : routeSummary ? (
        <p className="text-xs text-gray-500 text-center">
          {formatDistance(routeSummary.distance)} away · ETA {formatEta(routeSummary.time)}
        </p>
      ) : null}
    </div>
  );
};

export default UserOrderMap;