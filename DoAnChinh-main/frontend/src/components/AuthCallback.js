import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        navigate('/login');
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        const { data } = await axios.post(
          `${API_URL}/api/auth/google/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );
        
        setUser(data.user);
        navigate('/dashboard', { state: { user: data.user }, replace: true });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.error('Session exchange failed:', error);
        navigate('/login');
      }
    };

    processSession();
  }, [location, navigate, setUser, API_URL]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-[#A1A1A6]">Completing authentication...</p>
      </div>
    </div>
  );
}