import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import defaultConfig from "../firebase-applet-config.json";

// Helper to resolve active Firebase config
export function getActiveFirebaseConfig() {
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
    };
  }
  try {
    const saved = localStorage.getItem("custom_firebase_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not parse custom firebase config from localStorage:", e);
  }
  return defaultConfig;
}

// Initialize Firebase App
const activeConfig = getActiveFirebaseConfig();
const app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
export const auth = getAuth(app);

// Setup Google Auth Provider (uses basic profile and email for clean sign-in)
export const provider = new GoogleAuthProvider();
provider.addScope("profile");
provider.addScope("email");

// Optional extended provider for Gmail/Calendar when needed
export const extendedProvider = new GoogleAuthProvider();
extendedProvider.addScope("profile");
extendedProvider.addScope("email");
extendedProvider.addScope("https://www.googleapis.com/auth/gmail.send");
extendedProvider.addScope("https://www.googleapis.com/auth/calendar.events");

// In-memory access token cache
let cachedAccessToken: string | null = localStorage.getItem("google_access_token");
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Clear cached token if user signed in but token was lost (forces a fresh signin or popup if they want Google APIs)
        cachedAccessToken = null;
        localStorage.removeItem("google_access_token");
        if (onAuthSuccess) onAuthSuccess(user, "");
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem("google_access_token");
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google (Popup)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      console.warn("No Google API Access Token returned in Firebase Auth result.");
      cachedAccessToken = "";
    } else {
      cachedAccessToken = credential.accessToken;
      localStorage.setItem("google_access_token", cachedAccessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken || "" };
  } catch (error) {
    console.error("Sign-in with Google failed:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign out
export const googleSignOut = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
    localStorage.removeItem("google_access_token");
  } catch (error) {
    console.error("Sign-out failed:", error);
  }
};

// Get current access token
export const getAccessToken = (): string | null => {
  return cachedAccessToken || localStorage.getItem("google_access_token");
};

// Force update access token in cache (e.g. if loaded via another flow or stored)
export const setAccessToken = (token: string) => {
  cachedAccessToken = token;
  localStorage.setItem("google_access_token", token);
};

