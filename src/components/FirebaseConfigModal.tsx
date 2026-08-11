import React, { useState } from "react";
import { 
  X, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  Database, 
  HelpCircle,
  Sparkles,
  Compass
} from "lucide-react";

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export default function FirebaseConfigModal({ isOpen, onClose, onConfigSaved }: FirebaseConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"instructions" | "custom_config" | "oauth" | "grounding">("custom_config");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Custom Firebase configuration state
  const [customConfig, setCustomConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_firebase_config");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Error reading custom_firebase_config", e);
    }
    return {
      apiKey: "AIzaSyAQ_UUR9PMnSdUH1UwsfKzltznyhEA7JZ4",
      projectId: "cofounderai-4d430",
      authDomain: "cofounderai-4d430.firebaseapp.com",
      storageBucket: "cofounderai-4d430.firebasestorage.app",
      messagingSenderId: "527233426600",
      appId: "1:527233426600:web:d914db9cdffeaa13134e9d"
    };
  });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customConfig.apiKey || !customConfig.projectId) {
      setSaveStatus("Please enter at least an API Key and Project ID.");
      return;
    }
    const formatted = {
      apiKey: customConfig.apiKey.trim(),
      projectId: customConfig.projectId.trim(),
      authDomain: customConfig.authDomain.trim() || `${customConfig.projectId.trim()}.firebaseapp.com`,
      storageBucket: customConfig.storageBucket.trim() || `${customConfig.projectId.trim()}.appspot.com`,
      messagingSenderId: customConfig.messagingSenderId.trim() || "",
      appId: customConfig.appId.trim() || ""
    };
    localStorage.setItem("custom_firebase_config", JSON.stringify(formatted));
    setSaveStatus("Success! Your custom Firebase project is saved. Reloading page...");
    setTimeout(() => {
      if (onConfigSaved) onConfigSaved();
      window.location.reload();
    }, 1200);
  };

  const handleResetDefault = () => {
    localStorage.removeItem("custom_firebase_config");
    setCustomConfig({
      apiKey: "",
      projectId: "",
      authDomain: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    });
    setSaveStatus("Reset to default AI Studio Firebase project. Reloading...");
    setTimeout(() => {
      if (onConfigSaved) onConfigSaved();
      window.location.reload();
    }, 1200);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const currentRedirectUri = window.location.origin + "/__/auth/handler";
  const currentOrigin = window.location.origin;
  const vercelDomain = "ai-cofounder1234.vercel.app";
  const vercelOrigin = "https://ai-cofounder1234.vercel.app";
  const vercelRedirectUri = "https://ai-cofounder1234.vercel.app/__/auth/handler";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Firebase & OAuth Architecture Guide</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Environment variables, Google OAuth permissions, and live search grounding</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 px-5 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("custom_config")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === "custom_config"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Connect Your Own Project</span>
          </button>

          <button
            onClick={() => setActiveTab("instructions")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === "instructions"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Overview & Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab("oauth")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === "oauth"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Domains & OAuth</span>
          </button>

          <button
            onClick={() => setActiveTab("grounding")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === "grounding"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-500" />
            <span>Search Grounding</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300 text-xs">
          {activeTab === "custom_config" && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
                  <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Why you see: "To manage settings, ask a project owner for the necessary permission"</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  The default Firebase project was created automatically by Google AI Studio under an internal service account. Because your Google account (<code className="font-mono text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded">nexusxai9@gmail.com</code>) isn't an IAM Owner on AI Studio's internal GCP project, Firebase Console blocks direct setting changes (like adding Authorized Domains for Vercel).
                </p>
                <div className="pt-2 font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Solution: Connect Your Own Free Firebase Project Below!</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-mono">1</span>
                  <span>Create a Free Project in 1 Minute</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-2">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 underline font-medium inline-flex items-center">Firebase Console <ExternalLink className="w-3 h-3 ml-0.5" /></a> logged into your account.</li>
                  <li>Click <strong>Add Project</strong>, name it (e.g. <code>ai-cofounder-app</code>), and click <strong>Create</strong>.</li>
                  <li>Go to <strong>Project Settings</strong> (gear icon) &gt; <strong>General</strong> &gt; <strong>Your apps</strong> &gt; Click <strong>Web (&#x3C;/&#x3E;)</strong>.</li>
                  <li>Copy the config values and paste them into the form below! You will have <strong>100% full Owner access</strong> to add <code>ai-cofounder1234.vercel.app</code> to Authorized Domains in your own console!</li>
                </ol>
              </div>

              <form onSubmit={handleSaveCustomConfig} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Enter Your Firebase Project Credentials</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">(Stored locally in browser & used for Vercel/live app)</span>
                </h4>

                {saveStatus && (
                  <div className={`p-3 rounded-lg text-xs font-semibold ${
                    saveStatus.includes("Success") 
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                  }`}>
                    {saveStatus}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      API Key <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="AIzaSy..." 
                      value={customConfig.apiKey}
                      onChange={(e) => setCustomConfig({ ...customConfig, apiKey: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Project ID <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="my-custom-app-123" 
                      value={customConfig.projectId}
                      onChange={(e) => setCustomConfig({ ...customConfig, projectId: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Auth Domain
                    </label>
                    <input 
                      type="text" 
                      placeholder="my-custom-app-123.firebaseapp.com" 
                      value={customConfig.authDomain}
                      onChange={(e) => setCustomConfig({ ...customConfig, authDomain: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Storage Bucket
                    </label>
                    <input 
                      type="text" 
                      placeholder="my-custom-app-123.appspot.com" 
                      value={customConfig.storageBucket}
                      onChange={(e) => setCustomConfig({ ...customConfig, storageBucket: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Messaging Sender ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="1234567890" 
                      value={customConfig.messagingSenderId}
                      onChange={(e) => setCustomConfig({ ...customConfig, messagingSenderId: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      App ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="1:1234567890:web:abc123def456" 
                      value={customConfig.appId}
                      onChange={(e) => setCustomConfig({ ...customConfig, appId: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-xs flex items-center justify-center space-x-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save & Connect Custom Project</span>
                  </button>

                  <button 
                    type="button"
                    onClick={handleResetDefault}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    Reset to Default
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "instructions" && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  Firebase Authentication is pre-configured and runs automatically. Secrets and API keys are passed directly through environment variables in <code className="bg-emerald-100 dark:bg-emerald-950 px-1 py-0.5 rounded font-mono text-[11px] text-emerald-800 dark:text-emerald-300">.env.example</code> without exposing secrets in the UI.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-mono">1</span>
                    <span>Firebase Environment Variables</span>
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 pl-8">
                    To inject custom project credentials, set <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">VITE_FIREBASE_API_KEY</code> and <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">VITE_FIREBASE_PROJECT_ID</code> in the AI Studio environment settings.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-mono">2</span>
                    <span>Google Authentication Provider</span>
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 pl-8">
                    In your <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 underline font-medium inline-flex items-center space-x-1"><span>Firebase Console</span> <ExternalLink className="w-3 h-3 ml-0.5" /></a>, go to <strong>Build &gt; Authentication &gt; Sign-in method</strong>, enable <strong>Google</strong>, and add your support email.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "oauth" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  To send outreach emails via Gmail and schedule calendar events on Google Calendar, configure these Authorized Origins and Redirect URIs in your Google Cloud OAuth Client credentials.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Authorized Vercel Domain (Firebase Auth)</h4>
                  <p className="text-slate-500 dark:text-slate-400">Add this domain in Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains:</p>
                  <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                    <span className="truncate flex-1 text-slate-800 dark:text-slate-200">{vercelDomain}</span>
                    <button 
                      onClick={() => handleCopy(vercelDomain, "vercelDomain")}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded bg-slate-200 dark:bg-slate-800 shrink-0 cursor-pointer"
                    >
                      {copiedField === "vercelDomain" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Authorized JavaScript Origins (Google OAuth)</h4>
                  <p className="text-slate-500 dark:text-slate-400">Add these origins in Google Cloud Console &gt; Credentials &gt; OAuth 2.0 Client ID:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                      <span className="truncate flex-1 text-slate-800 dark:text-slate-200">{vercelOrigin}</span>
                      <button 
                        onClick={() => handleCopy(vercelOrigin, "vercelOrigin")}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded bg-slate-200 dark:bg-slate-800 shrink-0 cursor-pointer"
                      >
                        {copiedField === "vercelOrigin" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                      <span className="truncate flex-1 text-slate-800 dark:text-slate-200">{currentOrigin}</span>
                      <button 
                        onClick={() => handleCopy(currentOrigin, "origin")}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded bg-slate-200 dark:bg-slate-800 shrink-0 cursor-pointer"
                      >
                        {copiedField === "origin" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Authorized Redirect URIs (Firebase Auth Handler)</h4>
                  <p className="text-slate-500 dark:text-slate-400">Add these redirect URIs under Google Cloud Console &gt; Credentials &gt; OAuth 2.0 Client ID:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                      <span className="truncate flex-1 text-slate-800 dark:text-slate-200">{vercelRedirectUri}</span>
                      <button 
                        onClick={() => handleCopy(vercelRedirectUri, "vercelRedirect")}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded bg-slate-200 dark:bg-slate-800 shrink-0 cursor-pointer"
                      >
                        {copiedField === "vercelRedirect" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                      <span className="truncate flex-1 text-slate-800 dark:text-slate-200">{currentRedirectUri}</span>
                      <button 
                        onClick={() => handleCopy(currentRedirectUri, "redirect")}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded bg-slate-200 dark:bg-slate-800 shrink-0 cursor-pointer"
                      >
                        {copiedField === "redirect" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Required OAuth Scopes</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    <li>https://www.googleapis.com/auth/gmail.send</li>
                    <li>https://www.googleapis.com/auth/calendar.events</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "grounding" && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Free Real-Time Web & Google Maps Lead Mining</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                    Nexus AI uses built-in Google Search & Maps Grounding to extract active 2026 corporate domains, verified emails, and decision-maker profiles at <strong>zero cost</strong>, without requiring expensive Apollo.io or paid B2B API subscriptions.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">Features & Capabilities</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>100% Free real-time corporate domain discovery grounded in live 2026 Google search indexes.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Pattern-matched and verified executive email address formats (e.g., name@domain.com).</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>One-click Gmail cold outreach campaign generation with customized value propositions.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
