import L from './leafletInit';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

export interface LeafletRouting {
  control: (options: any) => any;
  osrmv1: (options: any) => any;
}

export const getRouting = (): LeafletRouting | null => {
  if (typeof window !== 'undefined' && (window as any).L?.Routing) {
    return (window as any).L.Routing;
  }
  if ((L as any)?.Routing) {
    return (L as any).Routing;
  }
  return null;
};

export default L;
