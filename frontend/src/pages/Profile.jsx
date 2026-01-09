import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, User, Mail, Phone, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    auto_detect: true,
    alert_contacts: true,
    share_location: true,
    fake_call_enabled: true
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        if (data.emergency_settings) {
          setSettings(data.emergency_settings);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (setting, value) => {
    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);
    
    // Here you would typically save to backend
    toast.success('Settings updated');
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
      <header className="bg-white border-b border-stone-200">
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
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-outfit font-bold text-[#1C1917]">Profile & Settings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <Card className="card-safe">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.picture} />
                <AvatarFallback className="bg-primary text-white text-2xl font-outfit">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-outfit font-bold text-[#1C1917]">{user?.name}</h2>
                <p className="text-stone-600 font-jakarta">{user?.email}</p>
                {user?.phone && (
                  <p className="text-stone-500 font-jakarta text-sm">{user.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Settings */}
        <Card className="card-safe">
          <CardHeader>
            <CardTitle className="font-outfit text-xl flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Emergency Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="auto_detect" className="font-jakarta font-semibold">
                  AI Distress Detection
                </Label>
                <p className="text-sm text-stone-600 font-jakarta">
                  Automatically detect distress signals using AI
                </p>
              </div>
              <Switch
                id="auto_detect"
                checked={settings.auto_detect}
                onCheckedChange={(checked) => handleSettingChange('auto_detect', checked)}
                data-testid="auto-detect-switch"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="alert_contacts" className="font-jakarta font-semibold">
                  Alert Contacts
                </Label>
                <p className="text-sm text-stone-600 font-jakarta">
                  Notify emergency contacts when SOS is triggered
                </p>
              </div>
              <Switch
                id="alert_contacts"
                checked={settings.alert_contacts}
                onCheckedChange={(checked) => handleSettingChange('alert_contacts', checked)}
                data-testid="alert-contacts-switch"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="share_location" className="font-jakarta font-semibold">
                  Share Live Location
                </Label>
                <p className="text-sm text-stone-600 font-jakarta">
                  Share real-time location during emergencies
                </p>
              </div>
              <Switch
                id="share_location"
                checked={settings.share_location}
                onCheckedChange={(checked) => handleSettingChange('share_location', checked)}
                data-testid="share-location-switch"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="fake_call_enabled" className="font-jakarta font-semibold">
                  Fake Call Feature
                </Label>
                <p className="text-sm text-stone-600 font-jakarta">
                  Enable the fake call feature for discrete exits
                </p>
              </div>
              <Switch
                id="fake_call_enabled"
                checked={settings.fake_call_enabled}
                onCheckedChange={(checked) => handleSettingChange('fake_call_enabled', checked)}
                data-testid="fake-call-switch"
              />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="card-safe">
          <CardHeader>
            <CardTitle className="font-outfit text-xl">About SafeHer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-stone-600 font-jakarta mb-4">
              SafeHer is your guardian in your pocket - providing advanced safety features designed specifically for women.
            </p>
            <p className="text-stone-500 font-jakarta text-sm">
              Version 1.0.0 • Built with love for women's safety
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
