import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('Authentication failed');
          navigate('/', { replace: true });
          return;
        }

        const response = await fetch(`${API}/auth/session`, {
          headers: {
            'X-Session-ID': sessionId,
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Session exchange failed');
        }

        const data = await response.json();
        
        document.cookie = `session_token=${data.session_token}; path=/; max-age=${7*24*60*60}; secure; samesite=none`;
        
        toast.success(`Welcome, ${data.name}!`);
        navigate('/dashboard', { replace: true, state: { user: data } });
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/', { replace: true });
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-600 font-jakarta">Completing sign in...</p>
      </div>
    </div>
  );
}