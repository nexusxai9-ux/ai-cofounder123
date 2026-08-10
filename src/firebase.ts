import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Setup Google Auth Provider for clean standard authentication (profile/email)
export const provider = new GoogleAuthProvider();
// Note: Standard profile & email scopes do not trigger restricted scope verification blocks.

// Incremental provider for optional Workspace APIs if requested
export const workspaceScopeProvider = new GoogleAuthProvider();
workspaceScopeProvider.addScope("https://www.googleapis.com/auth/gmail.send");
workspaceScopeProvider.addScope("https://www.googleapis.com/auth/calendar.events");

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
      console.warn("No Google API Access Token returned in standard Firebase Auth result.");
      cachedAccessToken = "";
    } else {
      cachedAccessToken = credential.accessToken;
      localStorage.setItem("google_access_token", cachedAccessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken || "" };
  } catch (error: any) {
    console.error("Sign-in with Google failed:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Request optional Gmail & Calendar Workspace Permissions
export const requestWorkspacePermissions = async (): Promise<{ success: boolean; accessToken?: string; error?: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, workspaceScopeProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      localStorage.setItem("google_access_token", cachedAccessToken);
      return { success: true, accessToken: cachedAccessToken };
    }
    return { success: false, error: "No Google API token returned." };
  } catch (error: any) {
    console.warn("Workspace API permissions request notice:", error);
    const errMsg = error?.message || String(error);
    if (errMsg.includes("unverified") || errMsg.includes("verification") || error?.code === "auth/popup-closed-by-user") {
      return { 
        success: false, 
        error: "Google Workspace API access requires OAuth App Verification for sensitive Gmail/Calendar scopes on custom domains. Standard workspace sandbox mode is active." 
      };
    }
    return { success: false, error: errMsg };
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
