import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CommunityReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    severity: 3,
    description: '',
    anonymous: true,
    location: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.location) {
      toast.error('Getting your location...');
      getCurrentLocation();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/community/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          location: {
            latitude: formData.location.latitude,
            longitude: formData.location.longitude
          }
        })
      });

      if (response.ok) {
        toast.success('Report submitted successfully. Thank you for helping the community stay safe!');
        navigate('/map');
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });
          toast.success('Location captured');
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Unable to get your location. Please enable GPS.');
        }
      );
    }
  };

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
            <AlertTriangle className="w-6 h-6 text-warning" />
            <h1 className="text-xl font-outfit font-bold text-[#1C1917]">Report Incident</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="card-safe">
          <CardHeader>
            <CardTitle className="font-outfit text-2xl">Help Keep Our Community Safe</CardTitle>
            <p className="text-stone-600 font-jakarta mt-2">
              Report any incident to alert other users in your area. Your report helps everyone make informed safety decisions.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="type" className="font-jakarta font-semibold">Incident Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({...formData, type: value})}
                  required
                >
                  <SelectTrigger className="rounded-xl font-jakarta" data-testid="incident-type-select">
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="unsafe_area">Unsafe Area</SelectItem>
                    <SelectItem value="theft">Theft/Robbery</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                    <SelectItem value="poor_lighting">Poor Lighting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity" className="font-jakarta font-semibold">Severity Level: {formData.severity}</Label>
                <input
                  type="range"
                  id="severity"
                  data-testid="severity-slider"
                  min="1"
                  max="5"
                  value={formData.severity}
                  onChange={(e) => setFormData({...formData, severity: parseInt(e.target.value)})}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emergency"
                />
                <div className="flex justify-between text-xs text-stone-500 font-jakarta mt-1">
                  <span>Minor</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="font-jakarta font-semibold">Description *</Label>
                <Textarea
                  id="description"
                  data-testid="description-textarea"
                  placeholder="Describe what happened... (e.g., Man following me for several blocks, poor street lighting, etc.)"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="rounded-xl font-jakarta min-h-32"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={formData.anonymous}
                  onCheckedChange={(checked) => setFormData({...formData, anonymous: checked})}
                  data-testid="anonymous-checkbox"
                />
                <Label 
                  htmlFor="anonymous" 
                  className="font-jakarta text-sm cursor-pointer"
                >
                  Submit anonymously (recommended for privacy)
                </Label>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-jakarta font-semibold text-sm mb-1">Your Location</h4>
                    <p className="text-xs text-stone-600 font-jakarta mb-3">
                      {formData.location ? 
                        `Location captured: ${formData.location.latitude.toFixed(4)}, ${formData.location.longitude.toFixed(4)}` : 
                        'Location will be captured when you submit'
                      }
                    </p>
                    {!formData.location && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        data-testid="get-location-button"
                        className="rounded-full font-jakarta"
                      >
                        Get My Location Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                data-testid="submit-report-button"
                className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 font-jakarta font-semibold"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="card-safe mt-6">
          <CardHeader>
            <CardTitle className="font-outfit text-lg">Why Report?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 font-jakarta text-stone-600 text-sm">
              <li className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-safe mt-0.5 flex-shrink-0" />
                <span>Help other women avoid dangerous areas</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-safe mt-0.5 flex-shrink-0" />
                <span>Create a community-wide safety network</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-safe mt-0.5 flex-shrink-0" />
                <span>Enable data-driven safety improvements</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
