import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Shield, MapPin, Users, Phone, Settings, LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sosActive, setSosActive] = useState(false);
  const [showSosDialog, setShowSosDialog] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    fetchUserData();
    checkActiveEmergency();
    getCurrentLocation();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveEmergency = async () => {
    try {
      const response = await fetch(`${API}/emergency/active`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setActiveAlert(data);
          setSosActive(true);
        }
      }
    } catch (error) {
      console.error('Error checking emergency:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Unable to get your location. Please enable GPS.');
        }
      );
    }
  };

  const handleSosPress = () => {
    if (sosActive) {
      setShowSosDialog(true);
    } else {
      triggerEmergency();
    }
  };

  const triggerEmergency = async () => {
    if (!location) {
      toast.error('Getting your location...');
      getCurrentLocation();
      return;
    }

    try {
      const response = await fetch(`${API}/emergency/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'manual',
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: 'Current Location'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveAlert(data);
        setSosActive(true);
        toast.success('🚨 Emergency alert sent to all contacts!');
      } else {
        throw new Error('Failed to trigger emergency');
      }
    } catch (error) {
      console.error('Error triggering emergency:', error);
      toast.error('Failed to send emergency alert. Please try again.');
    }
  };

  const resolveEmergency = async () => {
    if (!activeAlert) return;

    try {
      const response = await fetch(`${API}/emergency/resolve/${activeAlert.alert_id}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setSosActive(false);
        setActiveAlert(null);
        setShowSosDialog(false);
        toast.success('Emergency resolved. Stay safe!');
      }
    } catch (error) {
      console.error('Error resolving emergency:', error);
      toast.error('Failed to resolve emergency');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-outfit font-bold text-[#1C1917]">SafeHer</h1>
              <p className="text-xs text-stone-500 font-jakarta">Welcome, {user?.name?.split(' ')[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/profile')}
              data-testid="profile-button"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Emergency SOS Button */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center mb-12"
        >
          <button
            onClick={handleSosPress}
            data-testid="sos-button"
            className="sos-button"
            style={{
              animation: sosActive ? 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            }}
          >
            {sosActive ? (
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                <div className="text-sm">ACTIVE</div>
              </div>
            ) : (
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                <div className="text-sm">SOS</div>
              </div>
            )}
          </button>
          <p className="mt-6 text-center text-stone-600 font-jakarta max-w-md">
            {sosActive ? (
              <span className="text-emergency font-semibold">Emergency alert is active. Contacts have been notified.</span>
            ) : (
              <span>Press and hold the SOS button in case of emergency</span>
            )}
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card 
            className="card-safe cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/map')}
            data-testid="quick-action-map"
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <MapPin className="w-10 h-10 text-primary mb-3" />
              <h3 className="font-outfit font-semibold text-[#1C1917]">Safety Map</h3>
              <p className="text-xs text-stone-500 mt-1 font-jakarta">Find safe zones</p>
            </CardContent>
          </Card>

          <Card 
            className="card-safe cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/report')}
            data-testid="quick-action-report"
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Users className="w-10 h-10 text-safe mb-3" />
              <h3 className="font-outfit font-semibold text-[#1C1917]">Report Incident</h3>
              <p className="text-xs text-stone-500 mt-1 font-jakarta">Help community</p>
            </CardContent>
          </Card>

          <Card 
            className="card-safe cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/contacts')}
            data-testid="quick-action-contacts"
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Shield className="w-10 h-10 text-warning mb-3" />
              <h3 className="font-outfit font-semibold text-[#1C1917]">Contacts</h3>
              <p className="text-xs text-stone-500 mt-1 font-jakarta">Manage emergency</p>
            </CardContent>
          </Card>

          <Card 
            className="card-safe cursor-pointer hover:scale-105 transition-transform"
            onClick={async () => {
              try {
                const response = await fetch(`${API}/fake-call`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ caller_name: 'Mom' })
                });
                const data = await response.json();
                toast.success(`Fake call from ${data.caller}: "${data.message}"`);
              } catch (error) {
                toast.error('Failed to generate fake call');
              }
            }}
            data-testid="quick-action-fake-call"
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Phone className="w-10 h-10 text-emergency mb-3" />
              <h3 className="font-outfit font-semibold text-[#1C1917]">Fake Call</h3>
              <p className="text-xs text-stone-500 mt-1 font-jakarta">Exit discreetly</p>
            </CardContent>
          </Card>
        </div>

        {/* Safety Tips */}
        <Card className="card-safe">
          <CardHeader>
            <CardTitle className="font-outfit text-xl">Safety Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 font-jakarta text-stone-600">
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-safe mt-0.5 flex-shrink-0" />
                <span>Share your location with trusted contacts when traveling alone</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-safe mt-0.5 flex-shrink-0" />
                <span>Stay in well-lit, populated areas whenever possible</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-safe mt-0.5 flex-shrink-0" />
                <span>Keep your phone charged and easily accessible</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-safe mt-0.5 flex-shrink-0" />
                <span>Trust your instincts - if something feels wrong, it probably is</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* SOS Dialog */}
      <Dialog open={showSosDialog} onOpenChange={setShowSosDialog}>
        <DialogContent data-testid="sos-dialog">
          <DialogHeader>
            <DialogTitle className="font-outfit text-2xl">Active Emergency</DialogTitle>
            <DialogDescription className="font-jakarta">
              Your emergency contacts have been notified and your location is being tracked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-stone-600 font-jakarta">
              Are you safe now? You can mark this emergency as resolved.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={resolveEmergency}
                data-testid="resolve-emergency-button"
                className="flex-1 bg-safe hover:bg-safe/90 text-white font-jakarta"
              >
                I'm Safe Now
              </Button>
              <Button
                onClick={() => setShowSosDialog(false)}
                variant="outline"
                className="flex-1 font-jakarta"
                data-testid="cancel-resolve-button"
              >
                Keep Active
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
