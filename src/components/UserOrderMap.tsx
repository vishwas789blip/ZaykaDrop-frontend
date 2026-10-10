import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

declare module 'leaflet' {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options: any): any;
  }
}

const riderIcon = new L.DivIcon({
  html: '<div class="bg-blue-500 w-6 h-6 rounded-full border-2 border-white shadow-md"></div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const deliveryIcon = new L.DivIcon({
  html: '<div class="bg-green-500 w-6 h-6 rounded-full border-2 border-white shadow-md"></div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface RoutingProps {
  from: [number, number];
  to: [number, number];
  onError?: () => void;
  onRouteFound?: (summary: { distance: number; time: number }) => void;
}

// Draws / updates the OSRM route line between rider and delivery address.
// Re-creates the control whenever `from` changes so the line tracks rider movement.
const Routing = ({ from, to, onError, onRouteFound }: RoutingProps) => {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    const control = L.Routing.control({
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
      router: L.Routing.osrmv1({
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

    return () => {
      // removeControl can throw if the map instance was already unmounted —
      // guard so a fast-changing rider location can't crash the tree.
      try {
        map.removeControl(control);
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