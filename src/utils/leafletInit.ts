import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// leaflet-routing-machine expects window.L to exist at evaluation time
if (typeof window !== 'undefined') {
  (window as any).L = L;
}

export default L;
