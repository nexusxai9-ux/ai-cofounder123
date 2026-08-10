/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import { initAuth, setAccessToken } from "./firebase";
import { User } from "firebase/auth";
import { RefreshCw } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setTokenState] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication changes from Firebase Auth
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) {
          setTokenState(token);
          setAccessToken(token);
        }
        setLoading(false);
      },
      () => {
        setUser(null);
        setTokenState("");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSignInSuccess = (signedInUser: User, token: string) => {
    setUser(signedInUser);
    setTokenState(token);
    setAccessToken(token);
  };

  const handleSignOut = () => {
    setUser(null);
    setTokenState("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Booting AI Co-Founder Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-900 transition-colors duration-300">
      {user ? (
        <Dashboard 
          user={user} 
          accessToken={accessToken} 
          onSignOut={handleSignOut} 
          toggleTheme={toggleTheme}
          theme={theme}
        />
      ) : (
        <LandingPage 
          onSignInSuccess={handleSignInSuccess} 
        />
      )}
    </div>
  );
}

