import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, AlertCircle, Shield, User } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home', testId: 'nav-dashboard' },
    { path: '/map', icon: MapPin, label: 'Map', testId: 'nav-map' },
    { path: '/report', icon: AlertCircle, label: 'Report', testId: 'nav-report' },
    { path: '/contacts', icon: Shield, label: 'Contacts', testId: 'nav-contacts' },
    { path: '/profile', icon: User, label: 'Profile', testId: 'nav-profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50 pb-safe">
      <div className="max-w-7xl mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                data-testid={item.testId}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-xs font-jakarta font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
