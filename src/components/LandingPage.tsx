import React, { useState } from "react";
import { googleSignIn } from "../firebase";
import { User } from "firebase/auth";
import { motion } from "motion/react";
import HumanLogo from "./HumanLogo";
import { 
  Compass, 
  Target, 
  Mail, 
  Calendar, 
  Mic, 
  Briefcase, 
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Zap,
  CheckCircle2
} from "lucide-react";

interface LandingPageProps {
  onSignInSuccess: (user: User, token: string) => void;
}

export default function LandingPage({ onSignInSuccess }: LandingPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await googleSignIn();
      if (result) {
        onSignInSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error("Google sign in error details:", err);
      const msg = err?.message || String(err);
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Sign-in window was closed before completing. Please try again.");
      } else if (err?.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please enable popups and try again.");
      } else if (err?.code === "auth/unauthorized-domain" || msg.includes("unauthorized-domain")) {
        setError("This domain is not authorized in Firebase Auth settings. Please add this domain to authorized domains.");
      } else {
        setError(`Sign-in error: ${msg.replace(/Firebase:\s*/gi, '')}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const capabilities = [
    {
      icon: <Compass className="w-5 h-5 text-emerald-600" />,
      title: "Market Intelligence",
      tagline: "Autonomous live web scrapes",
      description: "Directly mines search engines to compile thorough, real-time market overviews, opportunity sizing, and trend forecasts instantly."
    },
    {
      icon: <Target className="w-5 h-5 text-emerald-600" />,
      title: "Competitor Strategy Matrix",
      tagline: "Live advantage mapping",
      description: "Identifies active players, mapping out exact competitor pricing tiers, key weaknesses, positioning statements, and tactical wedges."
    },
    {
      icon: <Briefcase className="w-5 h-5 text-emerald-600" />,
      title: "Prospect Lead Miner",
      tagline: "CSV & contact databases",
      description: "Extracts validated prospect contacts matching your buyer personas with verified emails, company details, and personalized outreach reasons."
    },
    {
      icon: <Mail className="w-5 h-5 text-emerald-600" />,
      title: "Outreach Dispatcher",
      tagline: "Connected Gmail delivery",
      description: "Drafts highly tailored, contextual sales sequences and dispatches emails directly using your secure, personal Gmail workspace account."
    },
    {
      icon: <Calendar className="w-5 h-5 text-emerald-600" />,
      title: "Google Calendar Scheduler",
      tagline: "Automated booking engine",
      description: "Coordinates meetings, pre-drafts invitations, and books strategy sessions directly on your Google Calendar inside the workspace flow."
    },
    {
      icon: <Mic className="w-5 h-5 text-emerald-600" />,
      title: "Voice-First Cyber Avatar",
      tagline: "Natural speech processing",
      description: "Features responsive voice synthesis and browser-native continuous speech recognition for hands-free co-founder interaction."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1917] font-sans antialiased selection:bg-emerald-500/10 selection:text-emerald-800 flex flex-col justify-between">
      {/* Dynamic Ambient Blur Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-emerald-50/50 via-transparent to-transparent pointer-events-none -z-10 blur-3xl" />

      {/* Top Header / Nav */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 sm:px-8 flex items-center justify-between">
        <HumanLogo size="md" />
        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            2026 Grounded Engine Active
          </span>
        </div>
      </header>

      {/* Core Body Container */}
      <main className="max-w-7xl mx-auto w-full px-6 sm:px-8 flex-1 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Editorial Text Column */}
        <div className="flex-1 space-y-8 text-left max-w-2xl lg:max-w-none">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-stone-100 rounded-full border border-stone-200/60 text-xs font-medium text-stone-600">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Autonomous Intelligence & Workspace Automation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-950 leading-[1.1]">
            Meet your silent partner.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-700">An executable Co-Founder.</span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
            An interactive startup advisor that speaks, listens, and immediately executes market analysis, competitor mapping, prospect scraping, and calendar scheduling in one cohesive platform.
          </p>

          {/* Quick Value Highlights */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">Grounded Results</h4>
                <p className="text-[11px] text-stone-500 leading-normal">Live scans avoid stale data or synthetic hallucination.</p>
              </div>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">OAuth Integrated</h4>
                <p className="text-[11px] text-stone-500 leading-normal">Fully connected Gmail and Calendar booking streams.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Auth / Action Panel Column */}
        <div className="w-full lg:w-[420px] shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white p-8 rounded-2xl border border-stone-200/80 shadow-lg shadow-stone-100/50 space-y-6"
          >
            <div className="text-center space-y-1.5 pb-2 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-950">Initialize Startup Workspace</h2>
              <p className="text-xs text-stone-500">Sign in with your account to access your AI Co-Founder workspace.</p>
            </div>

            {error && (
              <div className="text-xs bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-left">
                <div className="font-medium text-[11px] leading-relaxed">{error}</div>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Google Sign-In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-[#1c1917] hover:bg-[#2e2a27] text-white rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 text-xs font-bold"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5 mr-3 shrink-0">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-stone-400 text-center leading-relaxed">
              Sign in with your Google account to access your workspace, manage outreach, and synchronize strategic calendar meetings.
            </p>
          </motion.div>
        </div>
      </main>

      {/* Capabilities Overview Section */}
      <section className="bg-white border-t border-stone-200/80 py-16 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">
              The Startup Toolkit, Wholly Programmatic
            </h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              Leverage autonomous execution agents designed to offload exhaustive planning, market exploration, and reach operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {capabilities.map((cap, idx) => (
              <div
                key={idx}
                className="bg-[#fafaf9] p-6 rounded-2xl border border-stone-200/60 hover:border-emerald-500/20 hover:shadow-md transition-all duration-300 group"
              >
                <div className="p-3 bg-white text-stone-700 rounded-xl w-fit mb-4 border border-stone-200/60 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                  {cap.icon}
                </div>
                <span className="text-[10px] font-bold tracking-wide uppercase text-emerald-700 block mb-1">
                  {cap.tagline}
                </span>
                <h4 className="text-base font-bold text-stone-900 mb-2">{cap.title}</h4>
                <p className="text-xs text-stone-500 leading-relaxed">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Metrics */}
      <footer className="bg-stone-50 border-t border-stone-200/60 py-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-stone-500">
            <div className="flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Grounded Real-time Scrapes</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Workspace-API Connected</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Continuous Audio Sandbox</span>
            </div>
          </div>
          <div className="text-center sm:text-right text-[11px] text-stone-400">
            AI Co-Founder Workspace &copy; 2026. Powered by Google Gemini.
          </div>
        </div>
      </footer>
    </div>
  );
}
