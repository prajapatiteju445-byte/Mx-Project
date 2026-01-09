import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { ArrowLeft, MapPin, Shield, AlertTriangle, Hospital, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function SafetyMap() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [safetyZones, setSafetyZones] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
    fetchSafetyZones();
    fetchReports();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Unable to get your location');
          setUserLocation({ lat: 28.6139, lng: 77.2090 }); // Default to Delhi
        }
      );
    }
  };

  const fetchSafetyZones = async () => {
    try {
      const response = await fetch(`${API}/safety/zones`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSafetyZones(data);
      }
    } catch (error) {
      console.error('Error fetching safety zones:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API}/community/reports?limit=50`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getZoneIcon = (type) => {
    switch (type) {
      case 'police_station':
        return <Shield className="w-4 h-4" />;
      case 'hospital':
        return <Hospital className="w-4 h-4" />;
      case 'safe_house':
        return <Home className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  if (loading || !userLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-outfit font-bold text-[#1C1917]">Safety Map</h1>
          </div>
        </div>
      </header>

      <div className="h-[calc(100vh-140px)] relative">
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={13}
          className="h-full w-full"
          data-testid="map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Location */}
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={100}
            pathOptions={{ color: '#2E1065', fillColor: '#2E1065', fillOpacity: 0.2 }}
          />
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={createCustomIcon('#2E1065')}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-outfit font-semibold">Your Location</h3>
                <p className="text-xs text-stone-600 font-jakarta">You are here</p>
              </div>
            </Popup>
          </Marker>

          {/* Safety Zones */}
          {safetyZones.map((zone) => (
            <Marker
              key={zone.zone_id}
              position={[zone.location.latitude, zone.location.longitude]}
              icon={createCustomIcon('#059669')}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    {getZoneIcon(zone.type)}
                    <h3 className="font-outfit font-semibold">{zone.name}</h3>
                  </div>
                  <p className="text-xs text-stone-600 font-jakarta mb-2">{zone.address}</p>
                  {zone.contact && (
                    <p className="text-xs text-stone-700 font-jakarta">
                      <strong>Contact:</strong> {zone.contact}
                    </p>
                  )}
                  <p className="text-xs text-stone-700 font-jakarta">
                    <strong>Hours:</strong> {zone.hours}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Community Reports */}
          {reports.map((report) => (
            <Marker
              key={report.report_id}
              position={[report.location.latitude, report.location.longitude]}
              icon={createCustomIcon(report.severity >= 4 ? '#DC2626' : '#D97706')}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <h3 className="font-outfit font-semibold capitalize">{report.type.replace('_', ' ')}</h3>
                  </div>
                  <p className="text-xs text-stone-600 font-jakarta mb-1">
                    {report.description}
                  </p>
                  <p className="text-xs text-stone-500 font-jakarta">
                    Severity: {'⚠️'.repeat(report.severity)}
                  </p>
                  <p className="text-xs text-stone-400 font-jakarta mt-1">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000]">
          <Card className="glassmorphism shadow-lg">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary"></div>
                <span className="text-xs font-jakarta">Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-safe"></div>
                <span className="text-xs font-jakarta">Safe Zones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-warning"></div>
                <span className="text-xs font-jakarta">Moderate Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emergency"></div>
                <span className="text-xs font-jakarta">High Risk</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
