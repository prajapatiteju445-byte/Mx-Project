import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function EmergencyContacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    is_primary: false
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${API}/emergency/contacts`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.relationship || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API}/emergency/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Contact added successfully');
        setShowAddDialog(false);
        setFormData({
          name: '',
          relationship: '',
          phone: '',
          email: '',
          is_primary: false
        });
        fetchContacts();
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      const response = await fetch(`${API}/emergency/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Contact deleted');
        fetchContacts();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
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
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-outfit font-bold text-[#1C1917]">Emergency Contacts</h1>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button 
                className="rounded-full bg-primary hover:bg-primary/90 font-jakarta"
                data-testid="add-contact-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-contact-dialog">
              <DialogHeader>
                <DialogTitle className="font-outfit text-2xl">Add Emergency Contact</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="font-jakarta">Name *</Label>
                  <Input
                    id="name"
                    data-testid="contact-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="rounded-xl font-jakarta"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="relationship" className="font-jakarta">Relationship *</Label>
                  <Input
                    id="relationship"
                    data-testid="contact-relationship-input"
                    placeholder="e.g., Mother, Sister, Friend"
                    value={formData.relationship}
                    onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                    className="rounded-xl font-jakarta"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="font-jakarta">Phone Number *</Label>
                  <Input
                    id="phone"
                    data-testid="contact-phone-input"
                    type="tel"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="rounded-xl font-jakarta"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="font-jakarta">Email (Optional)</Label>
                  <Input
                    id="email"
                    data-testid="contact-email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="rounded-xl font-jakarta"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-full bg-primary hover:bg-primary/90 font-jakarta"
                  data-testid="submit-contact-button"
                >
                  Add Contact
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {contacts.length === 0 ? (
          <Card className="card-safe text-center p-12">
            <Shield className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-outfit font-semibold text-[#1C1917] mb-2">No Emergency Contacts</h3>
            <p className="text-stone-600 font-jakarta mb-6">
              Add trusted contacts who will be notified in case of an emergency
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="rounded-full bg-primary hover:bg-primary/90 font-jakarta"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Contact
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <Card key={contact.contact_id} className="card-safe" data-testid="contact-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="font-outfit text-lg">{contact.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteContact(contact.contact_id)}
                    data-testid={`delete-contact-${contact.contact_id}`}
                    className="text-emergency hover:text-emergency/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-stone-600 font-jakarta mb-3">{contact.relationship}</p>
                  <div className="space-y-2 text-sm font-jakarta">
                    <p className="text-stone-700">{contact.phone}</p>
                    {contact.email && (
                      <p className="text-stone-600">{contact.email}</p>
                    )}
                    {contact.is_primary && (
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                        Primary Contact
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {contacts.length > 0 && (
          <Card className="card-safe mt-8">
            <CardHeader>
              <CardTitle className="font-outfit text-xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 font-jakarta text-stone-600">
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>When you trigger an SOS, all your emergency contacts will receive instant notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>They'll get your real-time location and can track your movements</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Keep your contacts list updated with people you trust most</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
