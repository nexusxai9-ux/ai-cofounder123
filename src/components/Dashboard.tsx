import React, { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { googleSignOut, googleSignIn, setAccessToken, getAccessToken } from "../firebase";
import Avatar from "./Avatar";
import HumanLogo from "./HumanLogo";
import FirebaseConfigModal from "./FirebaseConfigModal";
import { jsPDF } from "jspdf";
import { 
  Message, 
  Lead, 
  MarketReport, 
  CompetitorAnalysis, 
  Task,
  ChatSession 
} from "../types";
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Download, 
  Mail, 
  Calendar as CalendarIcon, 
  Play, 
  LogOut, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Compass, 
  Target, 
  Briefcase, 
  Check, 
  Sparkles,
  Link as LinkIcon,
  MapPin,
  RefreshCw,
  Clock,
  User as UserIcon,
  Database,
  LayoutGrid,
  ListFilter,
  Search,
  FileEdit,
  CheckCircle,
  TrendingUp,
  Sun,
  Moon,
  Settings,
  ShieldCheck,
  FileText,
  Paperclip,
  Printer,
  ChevronLeft,
  ChevronRight,
  Layers,
  History,
  Trash2,
  ChevronDown,
  MessageSquare
} from "lucide-react";

interface DashboardProps {
  user: User | null;
  accessToken: string;
  onSignOut: () => void;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
}

export default function Dashboard({ user, accessToken, onSignOut, toggleTheme, theme }: DashboardProps) {
  // Navigation & Workspace State
  const [activeTab, setActiveTab] = useState<"avatar" | "market" | "competitors" | "leads">("avatar");
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [researchActivePage, setResearchActivePage] = useState<1 | 2 | 3 | "all">(1);
  const [aiMode, setAiMode] = useState<"cofounder" | "analyst" | "creative" | "taskmaster">("cofounder");

  // Persistent Multi-Thread Chat Memory & Sessions
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_ai_chat_sessions_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load saved sessions:", e);
    }
    return [
      {
        id: "session_default",
        title: "Initial Co-Founder Sync",
        updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        messages: [
          {
            role: "assistant",
            content: `Hello ${user?.displayName || "Partner"}! I am your AI Co-Founder. Let's build something world-changing together. Ask me anything, or run one of our automated agents on the right to start executing work immediately.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem("nexus_ai_active_session_id_v3") || "session_default";
  });

  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);
  
  // Active Session State
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const [messages, setMessages] = useState<Message[]>(activeSession.messages || []);
  const [inputText, setInputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  // Agent Outputs
  const [marketQuery, setMarketQuery] = useState("");
  const [marketReport, setMarketReport] = useState<MarketReport | null>(activeSession.marketReport || null);
  
  const [competitorQuery, setCompetitorQuery] = useState("");
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(activeSession.competitorAnalysis || null);
  
  const [leadIndustry, setLeadIndustry] = useState("");
  const [leadPersona, setLeadPersona] = useState("");
  const [leads, setLeads] = useState<Lead[]>(activeSession.leads || []);

  // Agent Status Logs
  const [agentProgress, setAgentProgress] = useState<string>("");
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  // Custom Outreach State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Custom Meeting State
  const [meetingSummary, setMeetingSummary] = useState("");
  const [meetingDesc, setMeetingDesc] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false);
  const [meetingSuccess, setMeetingSuccess] = useState(false);

  // Startup Identity Settings State
  const [startupName, setStartupName] = useState(() => localStorage.getItem("co_founder_startup_name") || "Apex Quantum");
  const [startupIndustry, setStartupIndustry] = useState(() => localStorage.getItem("co_founder_startup_industry") || "AI / GreenTech SaaS");
  const [startupDescription, setStartupDescription] = useState(() => localStorage.getItem("co_founder_startup_description") || "Generative AI carbon reporting and ESG intelligence for manufacturing enterprises.");

  // Save changes to localStorage dynamically
  useEffect(() => {
    localStorage.setItem("co_founder_startup_name", startupName);
  }, [startupName]);

  useEffect(() => {
    localStorage.setItem("co_founder_startup_industry", startupIndustry);
  }, [startupIndustry]);

  useEffect(() => {
    localStorage.setItem("co_founder_startup_description", startupDescription);
  }, [startupDescription]);

  // Local Task State
  const [tasks, setTasks] = useState<Task[]>(activeSession.tasks || [
    { id: "1", text: "Incorporate startup legal entity", completed: false, createdAt: "10:30 AM" },
    { id: "2", text: "Create high-level business model slide", completed: true, createdAt: "09:15 AM" },
    { id: "3", text: "Compile target client email lists", completed: false, createdAt: "08:00 AM", agentName: "Lead Finder" }
  ]);
  const [newTaskText, setNewTaskText] = useState("");

  // Sync current workspace state into active chat session and localStorage
  useEffect(() => {
    setSessions(prevSessions => {
      let found = false;
      const updated = prevSessions.map(sess => {
        if (sess.id === activeSessionId) {
          found = true;
          return {
            ...sess,
            messages,
            marketReport,
            competitorAnalysis,
            leads,
            tasks,
            updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
          };
        }
        return sess;
      });

      if (!found && activeSessionId) {
        updated.unshift({
          id: activeSessionId,
          title: messages.length > 1 ? (messages[1].content.slice(0, 28) + "...") : "Co-Founder Workspace",
          updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          messages,
          marketReport,
          competitorAnalysis,
          leads,
          tasks
        });
      }

      try {
        localStorage.setItem("nexus_ai_chat_sessions_v3", JSON.stringify(updated));
        localStorage.setItem("nexus_ai_active_session_id_v3", activeSessionId);
      } catch (e) {
        console.warn("Could not save session state to localStorage:", e);
      }
      return updated;
    });
  }, [messages, marketReport, competitorAnalysis, leads, tasks, activeSessionId]);

  // Session Helper: Create new clean session
  const createNewSession = () => {
    const newId = "session_" + Date.now();
    const newTitle = `Session #${sessions.length + 1} (${startupName})`;
    const initialMsg: Message = {
      role: "assistant",
      content: `New session started! What shall we focus on for ${startupName} next?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const newSession: ChatSession = {
      id: newId,
      title: newTitle,
      updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      messages: [initialMsg],
      marketReport: null,
      competitorAnalysis: null,
      leads: [],
      tasks: []
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([initialMsg]);
    setMarketReport(null);
    setCompetitorAnalysis(null);
    setLeads([]);
    setIsSessionMenuOpen(false);
  };

  // Session Helper: Switch active session
  const switchSession = (sessionId: string) => {
    const target = sessions.find(s => s.id === sessionId);
    if (target) {
      setActiveSessionId(sessionId);
      setMessages(target.messages || []);
      setMarketReport(target.marketReport || null);
      setCompetitorAnalysis(target.competitorAnalysis || null);
      setLeads(target.leads || []);
      if (target.tasks) setTasks(target.tasks);
      setIsSessionMenuOpen(false);
    }
  };

  // Session Helper: Delete session
  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert("You must keep at least one active chat session.");
      return;
    }
    const filtered = sessions.filter(s => s.id !== sessionId);
    setSessions(filtered);
    try {
      localStorage.setItem("nexus_ai_chat_sessions_v3", JSON.stringify(filtered));
    } catch (err) {
      console.warn(err);
    }
    if (activeSessionId === sessionId) {
      switchSession(filtered[0].id);
    }
  };

  // Capital & Valuation Simulator State (Next-Level Startup Sandbox)
  const [simPrice, setSimPrice] = useState(49);
  const [simCustomers, setSimCustomers] = useState(500);
  const [simMultiple, setSimMultiple] = useState(10);
  const [simMargin, setSimMargin] = useState(85);

  // CRM Pipeline toggles
  const [crmViewMode, setCrmViewMode] = useState<"table" | "kanban">("kanban");

  // Speech Recognition and Synthesis references
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Persistent Microphone Mode & Sync Refs
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const isMicEnabledRef = useRef(false);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false);

  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled;
  }, [isMicEnabled]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  // Initialize Speech Tools
  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setMicErrorMessage(null); // Clear any old errors on successful activation
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          addMessage("user", transcript);
          handleChatSubmission(transcript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // ALWAYS WORKING MICROPHONE MODE
        // Automatically restart speech recognition if enabled, not thinking, and not speaking
        setTimeout(() => {
          if (isMicEnabledRef.current && !isSpeakingRef.current && !isThinkingRef.current && !isListeningRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn("Could not auto-restart recognition onend:", e);
            }
          }
        }, 300);
      };

      recognition.onerror = (err: any) => {
        const errType = err?.error || "unknown";
        console.warn("Speech Recognition event:", errType);
        setIsListening(false);

        // Handle permission or blocked mic errors
        if (errType === "not-allowed" || errType === "permission-blocked" || errType === "service-not-allowed") {
          setIsMicEnabled(false);
          isMicEnabledRef.current = false;
          setMicErrorMessage("Microphone access is blocked or restricted in this browser context. Please type your message.");
          return;
        }

        if (errType === "network") {
          setIsMicEnabled(false);
          isMicEnabledRef.current = false;
          setMicErrorMessage("Speech recognition network error. Please use text input.");
          return;
        }

        if (errType === "no-speech" || errType === "aborted") {
          // Transient silence or manual stop
        } else {
          setMicErrorMessage(`Speech recognition paused (${errType}). You can continue using text input.`);
        }

        // Auto-resume after transient mic errors if mic is still enabled
        setTimeout(() => {
          if (isMicEnabledRef.current && !isSpeakingRef.current && !isThinkingRef.current && !isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn("Could not auto-restart recognition on error:", e);
            }
          }
        }, 1200);
      };

      recognitionRef.current = recognition;
    }

    // Scroll to latest chat
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Voice output function with automated Mic pause/resume
  const speakText = (text: string) => {
    if (isVoiceMuted || !synthRef.current) return;
    synthRef.current.cancel(); // cancel existing speaker

    // Clean text from symbols/markdown for cleaner reading
    const cleanText = text.replace(/[*_`#-]/g, "").trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synthRef.current.getVoices();
    // Select high-quality English voice if available
    const voice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || 
                  voices.find(v => v.lang.startsWith("en")) || 
                  voices[0];
    
    if (voice) utterance.voice = voice;
    utterance.rate = 1.02;

    utterance.onstart = () => {
      setIsSpeaking(true);
      // Temporarily stop microphone so we do not listen to ourselves
      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn(e);
        }
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-resume continuous listening when done speaking
      setTimeout(() => {
        if (isMicEnabledRef.current && !isThinkingRef.current && !isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn("Auto-resume mic after speech failed:", e);
          }
        }
      }, 400);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      // Auto-resume on error
      setTimeout(() => {
        if (isMicEnabledRef.current && !isThinkingRef.current && !isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn("Auto-resume mic after speech error failed:", e);
          }
        }
      }, 400);
    };

    synthRef.current.speak(utterance);
  };

  const ensureGoogleAuth = async (): Promise<string> => {
    const currentToken = accessToken || getAccessToken() || localStorage.getItem("google_access_token");
    if (currentToken) return currentToken;
    try {
      setAgentProgress("AUTHENTICATION: Opening Google Sign-In for Gmail & Calendar authorization...");
      const res = await googleSignIn();
      if (res?.accessToken) {
        return res.accessToken;
      }
    } catch (err: any) {
      console.warn("Google authentication popup cancelled or failed:", err);
    }
    return "";
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setMicErrorMessage("Speech recognition is not supported in this browser environment. Please type instead.");
      return;
    }

    if (isMicEnabled) {
      setIsMicEnabled(false);
      isMicEnabledRef.current = false;
      if (isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Could not stop recognition:", e);
        }
      }
    } else {
      // Request microphone access stream directly via browser mediaDevices to unblock sandboxed iframe
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // Release track so SpeechRecognition can acquire mic
        }
      } catch (err: any) {
        console.warn("Microphone getUserMedia permission notice:", err);
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          setIsMicEnabled(false);
          isMicEnabledRef.current = false;
          setMicErrorMessage("Microphone access was denied. Please allow microphone access in your browser location bar.");
          return;
        }
      }

      setIsMicEnabled(true);
      isMicEnabledRef.current = true;
      setMicErrorMessage(null);

      if (isSpeaking && synthRef.current) {
        try {
          synthRef.current.cancel();
        } catch (e) {
          console.warn(e);
        }
        setIsSpeaking(false);
      }

      setTimeout(() => {
        if (!isListeningRef.current && recognitionRef.current && isMicEnabledRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e: any) {
            console.warn("Notice starting recognition:", e?.message || e);
            if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
              setIsMicEnabled(false);
              isMicEnabledRef.current = false;
              setMicErrorMessage("Microphone permission was denied. Please use text input or allow mic access.");
            }
          }
        }
      }, 100);
    }
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages(prev => [
      ...prev,
      {
        role,
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  // Direct Email Send execution via AI Co-Founder Chat
  const executeDirectEmailSend = async (to: string, subject: string, body: string) => {
    let activeToken = accessToken;
    if (!activeToken) {
      activeToken = await ensureGoogleAuth() || "";
    }
    if (!activeToken) {
      addMessage("assistant", "⚠️ Google authorization is required to send emails via Gmail. Please click 'Connect Google Account' in the header to grant Gmail permissions.");
      return false;
    }

    // Extract valid emails from `to` parameter
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    let targetEmails = Array.from(new Set(to.match(emailRegex) || []));

    // If no valid email in 'to', but we have extracted leads, fallback to lead emails
    if (targetEmails.length === 0 && leads && leads.length > 0) {
      targetEmails = Array.from(new Set(leads.map(l => l.email).filter(Boolean)));
    }

    // If still no leads found, attempt to fetch/generate 20 leads on the fly
    if (targetEmails.length === 0) {
      try {
        setAgentProgress("EMAIL AGENT: Fetching target prospect email list...");
        const res = await fetch("/api/agent/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry: startupIndustry || "AI Technology",
            targetPersona: "CTO and Head of Growth"
          })
        });
        if (res.ok) {
          const leadData = await res.json();
          if (leadData.leads && leadData.leads.length > 0) {
            setLeads(leadData.leads);
            targetEmails = Array.from(new Set(leadData.leads.map((l: any) => l.email).filter(Boolean)));
          }
        }
      } catch (e) {
        console.warn("Could not auto-fetch leads for email:", e);
      }
    }

    if (targetEmails.length === 0) {
      addMessage("assistant", "⚠️ No target email addresses found. Please specify a recipient email address or generate leads first in the Prospect Leads tab.");
      return false;
    }

    // Process target emails individually to guarantee standard RFC 2822 compliance for Gmail API
    const emailsToSend = targetEmails.slice(0, 10); // Batch send up to 10 top target leads
    let successCount = 0;
    const sentEmails: string[] = [];

    setAgentProgress(`EMAIL AGENT: Sending ${emailsToSend.length} personalized Gmail outreach message(s)...`);

    for (const emailAddr of emailsToSend) {
      try {
        const response = await fetch("/api/gmail/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            to: emailAddr,
            subject: subject || "Partnership Opportunity",
            body: body.replace(/\n/g, "<br />")
          })
        });

        if (response.ok) {
          successCount++;
          sentEmails.push(emailAddr);
        } else {
          const errText = await response.text();
          console.warn(`Failed to send email to ${emailAddr}:`, errText);
        }
      } catch (err) {
        console.warn(`Error sending email to ${emailAddr}:`, err);
      }
    }

    if (successCount > 0) {
      // Mark emailing status in leads state
      setLeads(prev => prev.map(l => sentEmails.includes(l.email) ? { ...l, pipelineStatus: "sent", emailed: true } : l));
      const successMsg = `📧 **Gmail Outreach Dispatched!** Successfully delivered ${successCount} individual outreach email(s) using your connected Gmail account to: **${sentEmails.slice(0, 3).join(", ")}**${sentEmails.length > 3 ? ` and ${sentEmails.length - 3} others` : ""}.`;
      addMessage("assistant", successMsg);
      speakText(`Outreach emails sent successfully via Gmail to ${successCount} prospect accounts.`);
      return true;
    } else {
      addMessage("assistant", "❌ Failed to send outreach emails via Gmail API. Please verify your connected Google account in the top right header.");
      return false;
    }
  };

  // Direct Calendar Schedule execution via AI Co-Founder Chat
  const executeDirectCalendarSchedule = async (summary: string, description?: string, startDateTime?: string, endDateTime?: string, attendeeEmail?: string) => {
    let activeToken = accessToken;
    if (!activeToken) {
      activeToken = await ensureGoogleAuth() || "";
    }
    if (!activeToken) {
      addMessage("assistant", "⚠️ Google authorization is required to schedule events on Google Calendar. Please connect your Google account in the header.");
      return false;
    }

    try {
      setAgentProgress(`CALENDAR AGENT: Creating Google Calendar event '${summary}'...`);
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const pad = (n: number) => (n < 10 ? "0" + n : n);
      
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const defaultStartLocalIso = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}:00`;
      const defaultEndLocalIso = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours() + 1)}:${pad(tomorrow.getMinutes())}:00`;

      const startIso = startDateTime || defaultStartLocalIso;
      const endIso = endDateTime || defaultEndLocalIso;

      const response = await fetch("/api/calendar/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          summary,
          description: description || "Scheduled by AI Co-Founder Assistant",
          startDateTime: startIso,
          endDateTime: endIso,
          attendeeEmail: attendeeEmail || "",
          clientTimezone: userTz
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Calendar API error: ${errText}`);
      }

      const data = await response.json();
      const successMsg = `📅 Scheduled on Google Calendar! **"${summary}"** set for ${startIso.replace("T", " ")} (${userTz}). [View Calendar Event](${data.eventLink || "#"})`;
      addMessage("assistant", successMsg);
      speakText(`Scheduled ${summary} on your Google Calendar.`);
      return true;
    } catch (err: any) {
      console.error("Direct calendar schedule error:", err);
      addMessage("assistant", `❌ Could not schedule event: ${err.message || "Calendar API error"}`);
      return false;
    } finally {
      setAgentProgress("");
    }
  };

  // Submit Text/Voice to Chat
  const handleChatSubmission = async (text: string) => {
    if (!text.trim()) return;
    setIsThinking(true);
    setAgentProgress("Co-founder is drafting a strategic response...");

    // Temporarily pause mic listening when thinking
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }

    try {
      const chatHistory = [...messages, { role: "user", content: text }];
      // Trim history to stay clean and rapid
      const payload = chatHistory.slice(-8);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: payload,
          startupIdentity: {
            name: startupName,
            industry: startupIndustry,
            description: startupDescription
          },
          clientLocalTime: new Date().toString(),
          clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });

      if (!response.ok) {
        throw new Error("Chat service responded with an error");
      }

      const data = await response.json();
      const reply = data.reply;
      addMessage("assistant", reply);
      speakText(reply);

      // Execute structured tool calls returned by AI model / backend
      if (data.toolCalls && Array.isArray(data.toolCalls) && data.toolCalls.length > 0) {
        for (const call of data.toolCalls) {
          if (call.name === "send_email" && call.args?.to) {
            await executeDirectEmailSend(call.args.to, call.args.subject || "Outreach from AI Co-Founder", call.args.body || "Hello");
          } else if (call.name === "schedule_calendar" && call.args?.summary) {
            await executeDirectCalendarSchedule(call.args.summary, call.args.description, call.args.startDateTime, call.args.endDateTime, call.args.attendeeEmail);
          } else if (call.name === "run_market_research" && call.args?.marketQuery) {
            setMarketQuery(call.args.marketQuery);
            triggerResearchAgent(call.args.marketQuery);
          } else if (call.name === "run_competitor_analysis" && call.args?.conceptQuery) {
            setCompetitorQuery(call.args.conceptQuery);
            triggerCompetitorAgent(call.args.conceptQuery);
          } else if (call.name === "find_leads" && call.args?.industry) {
            setLeadIndustry(call.args.industry);
            triggerLeadFinderAgent(call.args.industry, call.args.targetPersona || "CTO and Head of Growth");
          } else if (call.name === "add_task" && call.args?.taskText) {
            const taskId = Date.now().toString();
            setTasks(prev => [{ id: taskId, text: call.args.taskText, completed: false, createdAt: "Just now", agentName: "AI Co-Founder" }, ...prev]);
            addMessage("assistant", `✅ Task added to workspace: "${call.args.taskText}"`);
          }
        }
      } else {
        // Fallback keyword-based execution if toolCalls was empty
        const lowercaseText = text.toLowerCase();
        if (lowercaseText.includes("email") || lowercaseText.includes("mail") || lowercaseText.includes("outreach") || lowercaseText.includes("pitch") || lowercaseText.includes("send them") || lowercaseText.includes("send it")) {
          await executeDirectEmailSend("all leads", "Partnership Opportunity", "Hi, I am reaching out regarding a potential business collaboration with our startup.");
        } else if (lowercaseText.includes("research") || lowercaseText.includes("market") || lowercaseText.includes("study")) {
          const cleaned = text.replace(/research|market|study|on|about|the|for|me|please/gi, "").trim();
          const query = cleaned.length > 2 ? cleaned : startupIndustry || startupName || "Artificial Intelligence";
          setMarketQuery(query);
          triggerResearchAgent(query);
        } else if (lowercaseText.includes("competitor") || lowercaseText.includes("competition") || lowercaseText.includes("rival") || lowercaseText.includes("matrix")) {
          const cleaned = text.replace(/competitor|competition|rival|matrix|scan|analyze|analysis|for|about|the|me|please/gi, "").trim();
          const query = cleaned.length > 2 ? cleaned : startupDescription || startupName || "SaaS Platform";
          setCompetitorQuery(query);
          triggerCompetitorAgent(query);
        } else if (lowercaseText.includes("lead") || lowercaseText.includes("prospect") || lowercaseText.includes("client") || lowercaseText.includes("contact")) {
          const cleaned = text.replace(/find|get|extract|leads|prospects|clients|contacts|for|in|about|me|please/gi, "").trim();
          const ind = cleaned.length > 2 ? cleaned : startupIndustry || "SaaS & Enterprise Tech";
          setLeadIndustry(ind);
          triggerLeadFinderAgent(ind, leadPersona || "CTO and Head of Growth");
        }
      }

    } catch (err: any) {
      console.error("Chat submission error:", err);
      const fallbackText = "I'm currently syncing with our strategy engines. Let's keep momentum on building! What strategic objective or market goal should we tackle next?";
      addMessage("assistant", fallbackText);
      speakText("I am syncing with our strategy engines. What goal should we focus on next?");
    } finally {
      setIsThinking(false);
      setAgentProgress("");
      // When done thinking, if mic is enabled and we are not speaking, auto-resume
      setTimeout(() => {
        if (isMicEnabledRef.current && !isSpeakingRef.current && !isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn("Could not auto-restart mic after thinking:", e);
          }
        }
      }, 500);
    }
  };

  const handleManualSend = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    addMessage("user", text);
    setInputText("");
    handleChatSubmission(text);
  };

  // 1. Run Market Research Agent
  const triggerResearchAgent = async (query: string) => {
    if (!query.trim()) return;
    setIsAgentRunning(true);
    setActiveTab("market");
    setAgentProgress("RESEARCH AGENT ACTIVE: Booting live scraper engines...");
    
    try {
      setAgentProgress("RESEARCH AGENT ACTIVE: Querying Google Search grounding indexing in 2026...");
      const response = await fetch("/api/agent/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market: query })
      });

      if (!response.ok) throw new Error("Market research request failed");

      const data = await response.json();
      setMarketReport(data.report);
      
      // Add a task indicating research completed
      const newTaskId = Date.now().toString();
      setTasks(prev => [
        { id: newTaskId, text: `Review compiled Market Research Report for "${query}"`, completed: false, createdAt: "Just now", agentName: "Research Agent" },
        ...prev
      ]);

      const successMsg = `I have successfully scraped live data and completed our market intelligence analysis for "${query}". I am automatically downloading your PDF report now!`;
      addMessage("assistant", successMsg);
      speakText(successMsg);

      // AUTOMATIC PDF DOWNLOAD
      setTimeout(() => {
        downloadMarketReportPDF(data.report);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setAgentProgress("RESEARCH AGENT FAILED: Scraper error occurred.");
      addMessage("assistant", "The Market Research Agent hit an indexing error. I'll recalibrate.");
    } finally {
      setIsAgentRunning(false);
    }
  };

  // 2. Run Competitor Analysis Agent
  const triggerCompetitorAgent = async (concept: string) => {
    if (!concept.trim()) return;
    setIsAgentRunning(true);
    setActiveTab("competitors");
    setAgentProgress("COMPETITOR AGENT ACTIVE: Indexing competitor landscapes on the web...");

    try {
      setAgentProgress("COMPETITOR AGENT ACTIVE: Grounding competitor lists and pricing patterns...");
      const response = await fetch("/api/agent/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyConcept: concept })
      });

      if (!response.ok) throw new Error("Competitor scan request failed");

      const data = await response.json();
      setCompetitorAnalysis(data.analysis);

      // Add a task
      const newTaskId = Date.now().toString();
      setTasks(prev => [
        { id: newTaskId, text: `Review competitive strategy matrix for "${concept}"`, completed: false, createdAt: "Just now", agentName: "Competitor Agent" },
        ...prev
      ]);

      const successMsg = `I've finished scanning competitors for "${concept}". I found ${data.analysis.competitors.length} key active players on the market, and I am automatically downloading the PDF competitive strategy matrix!`;
      addMessage("assistant", successMsg);
      speakText(successMsg);

      // AUTOMATIC PDF DOWNLOAD
      setTimeout(() => {
        downloadCompetitorPDF(data.analysis);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setAgentProgress("COMPETITOR AGENT FAILED: Data grounding error.");
      addMessage("assistant", "My competitor analysis agent ran into a crawl blockage. Let me run it manually.");
    } finally {
      setIsAgentRunning(false);
    }
  };

  // 3. Run Client Lead Finder Agent
  const triggerLeadFinderAgent = async (industry: string, persona: string) => {
    const targetInd = industry || leadIndustry || "Artificial Intelligence and SaaS";
    const targetPers = persona || leadPersona || "CTO and Head of Growth";

    setIsAgentRunning(true);
    setActiveTab("leads");
    setAgentProgress("LEAD FINDER AGENT ACTIVE: Compiling 10 real B2B prospective clients (Testing Phase Limit)...");

    try {
      setAgentProgress("LEAD FINDER AGENT ACTIVE: Querying Apollo.io API for verified real company contacts...");
      const response = await fetch("/api/agent/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          industry: targetInd, 
          targetPersona: targetPers,
          apolloApiKey: localStorage.getItem("apollo_api_key") || "-aYkP_50NLyaMCQis-Hn0w"
        })
      });

      const data = await response.json();

      const mappedLeads = (data.leads || []).slice(0, 10).map((l: any) => ({
        ...l,
        pipelineStatus: l.emailed ? "sent" : "identified"
      }));

      setLeads(mappedLeads);

      // Add task
      const newTaskId = Date.now().toString();
      setTasks(prev => [
        { id: newTaskId, text: `Launch automated email sequences to 10 client leads in ${targetInd}`, completed: false, createdAt: "Just now", agentName: "Lead Finder" },
        ...prev
      ]);

      const successMsg = `Done! I've successfully compiled exactly ${mappedLeads.length} real potential client lead accounts for "${targetInd}" (Testing Phase Limit: 10 max) and triggered an automatic CSV spreadsheet download!`;
      addMessage("assistant", successMsg);
      speakText(successMsg);

      // AUTOMATIC CSV DOWNLOAD
      setTimeout(() => {
        downloadLeadsCSV(mappedLeads);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setAgentProgress("LEAD FINDER NOTICE: Search completed.");
      addMessage("assistant", "I encountered a network issue during lead retrieval. Please try your search again.");
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Outreach: Send Email via Gmail API proxy
  const sendOutreachEmail = async () => {
    if (!selectedLead) return;
    
    let activeToken = accessToken;
    if (!activeToken) {
      activeToken = await ensureGoogleAuth() || "";
    }

    if (!activeToken) {
      alert("Please authorize Google Gmail access to dispatch real outreach emails.");
      return;
    }

    setIsSendingEmail(true);
    setEmailSuccess(false);

    try {
      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          to: selectedLead.email,
          subject: emailSubject,
          body: emailBody.replace(/\n/g, "<br />")
        })
      });

      if (!response.ok) throw new Error("Failed to send outreach email");

      setEmailSuccess(true);
      
      // Update local leads list
      setLeads(prev => prev.map(l => l.email === selectedLead.email ? { ...l, emailed: true, pipelineStatus: "sent" } : l));
      
      addMessage("assistant", `I've sent out the outreach email to ${selectedLead.contactName} (${selectedLead.company}) successfully.`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to send Gmail message. Verify Google permissions or try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Outreach: Schedule meeting via Google Calendar proxy
  const scheduleCalendarMeeting = async () => {
    if (!meetingSummary || !meetingDate || !meetingTime) {
      alert("Please fill in meeting title, date, and time.");
      return;
    }

    let activeToken = accessToken;
    if (!activeToken) {
      activeToken = await ensureGoogleAuth() || "";
    }

    if (!activeToken) {
      alert("Please authorize Google Calendar access to schedule meetings.");
      return;
    }

    setIsSchedulingMeeting(true);
    setMeetingSuccess(false);

    try {
      // Parse start and end timestamps
      const startDateTimeStr = `${meetingDate}T${meetingTime}:00`;
      const startDate = new Date(startDateTimeStr);
      // Event lasts 30 minutes by default
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

      const response = await fetch("/api/calendar/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          summary: meetingSummary,
          description: meetingDesc,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          attendeeEmail: selectedLead?.email || ""
        })
      });

      if (!response.ok) throw new Error("Calendar schedule request failed");

      setMeetingSuccess(true);
      // Update local leads list
      if (selectedLead) {
        setLeads(prev => prev.map(l => l.email === selectedLead.email ? { ...l, pipelineStatus: "booked" } : l));
      }
      addMessage("assistant", `Calendar invitation scheduled with ${selectedLead?.contactName || "Client"} for ${meetingDate} at ${meetingTime}.`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to schedule calendar meeting. Verify Google Auth or try again.");
    } finally {
      setIsSchedulingMeeting(false);
    }
  };

  // Download PDF Report client-side
  const downloadMarketReportPDF = (customReport?: MarketReport) => {
    const reportToUse = customReport || marketReport;
    if (!reportToUse) return;
    const doc = new jsPDF();
    doc.setFont("helvetica");

    // 1. If 3-Page Deep Research Report format exists
    if (reportToUse.page1) {
      // PAGE 1
      doc.setFontSize(20);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text(reportToUse.brandTitle || "Nexus AI Deep Research Intelligence", 15, 20);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Topic: ${reportToUse.topic || reportToUse.marketName} • Date: ${reportToUse.generatedDate || new Date().toLocaleDateString()}`, 15, 26);

      doc.setDrawColor(226, 232, 240);
      doc.line(15, 29, 195, 29);

      // Page 1 Title
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(reportToUse.page1.title, 15, 37);

      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      const p1Lines = doc.splitTextToSize(reportToUse.page1.contentMarkdown.replace(/[*_#]/g, ""), 180);
      doc.text(p1Lines, 15, 44);

      let y = 44 + (p1Lines.length * 4.2) + 6;
      if (y < 240 && reportToUse.page1.keyDataPoints) {
        doc.setFontSize(11);
        doc.setTextColor(16, 185, 129);
        doc.text("Key Empirical Data Points (Page 1)", 15, y);
        y += 6;
        reportToUse.page1.keyDataPoints.forEach((dp) => {
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(`• ${dp.label}: ${dp.value} (${dp.detail || ""})`, 18, y);
          y += 5;
        });
      }

      // PAGE 2
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(16, 185, 129);
      doc.text(reportToUse.page2.title, 15, 20);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(reportToUse.page2.subtitle, 15, 26);
      doc.line(15, 29, 195, 29);

      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      const p2Lines = doc.splitTextToSize(reportToUse.page2.contentMarkdown.replace(/[*_#]/g, ""), 180);
      doc.text(p2Lines, 15, 37);

      y = 37 + (p2Lines.length * 4.2) + 6;
      if (y < 240 && reportToUse.page2.keyDataPoints) {
        doc.setFontSize(11);
        doc.setTextColor(16, 185, 129);
        doc.text("Technical Metrics & Benchmarks (Page 2)", 15, y);
        y += 6;
        reportToUse.page2.keyDataPoints.forEach((dp) => {
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(`• ${dp.label}: ${dp.value} (${dp.detail || ""})`, 18, y);
          y += 5;
        });
      }

      // PAGE 3
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(16, 185, 129);
      doc.text(reportToUse.page3.title, 15, 20);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(reportToUse.page3.subtitle, 15, 26);
      doc.line(15, 29, 195, 29);

      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      const p3Lines = doc.splitTextToSize(reportToUse.page3.contentMarkdown.replace(/[*_#]/g, ""), 180);
      doc.text(p3Lines, 15, 37);

      y = 37 + (p3Lines.length * 4.2) + 6;
      if (y < 245 && reportToUse.sources) {
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("Grounded Web Sources & Index Citations", 15, y);
        y += 6;
        reportToUse.sources.forEach((src) => {
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`• ${src}`, 18, y);
          y += 4;
        });
      }

      doc.save(`Deep-Research-Report-${(reportToUse.topic || reportToUse.marketName || "Intelligence").replace(/\s+/g, "-")}.pdf`);
      return;
    }

    // Legacy Format Fallback
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text(reportToUse.marketName, 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`AI Co-Founder Market Intelligence Report • Generated: ${new Date().toLocaleDateString()}`, 15, 26);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, 29, 195, 29);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Executive Summary", 15, 37);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const summaryLines = doc.splitTextToSize(reportToUse.summary, 180);
    doc.text(summaryLines, 15, 43);

    doc.save(`Market-Research-${reportToUse.marketName.replace(/\s+/g, "-")}.pdf`);
  };

  const downloadCompetitorPDF = (customAnalysis?: CompetitorAnalysis) => {
    const analysisToUse = customAnalysis || competitorAnalysis;
    if (!analysisToUse) return;
    const doc = new jsPDF();
    doc.setFont("helvetica");

    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text("Competitor Landscape & Matrix", 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Concept: "${analysisToUse.concept}" • Generated: ${new Date().toLocaleDateString()}`, 15, 26);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, 29, 195, 29);

    let y = 38;
    analysisToUse.competitors.forEach((comp, idx) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${comp.name} (${comp.website})`, 15, y);
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Positioning: ${comp.positioning}`, 15, y + 5);
      doc.text(`Pricing: ${comp.pricing}`, 15, y + 10);
      
      doc.setTextColor(30, 41, 59);
      doc.text(`User Differentiation Opportunity: ${comp.differentiation}`, 15, y + 15);

      y += 22;
    });

    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Strategic Advantage Summary", 15, y + 5);
    const lines = doc.splitTextToSize(analysisToUse.strategicAdvantage, 180);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(lines, 15, y + 11);

    doc.save("Competitor-Strategic-Analysis.pdf");
  };

  // Download Leads PDF client-side
  const downloadLeadsPDF = (customLeads?: Lead[]) => {
    const leadsToUse = customLeads || leads;
    if (!leadsToUse || leadsToUse.length === 0) return;
    const doc = new jsPDF();
    doc.setFont("helvetica");

    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text("B2B Prospect Client Leads Report", 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Target Industry: ${leadIndustry || "General"} • Total Leads: ${leadsToUse.length} • Generated: ${new Date().toLocaleDateString()}`, 15, 26);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, 29, 195, 29);

    let y = 38;
    leadsToUse.forEach((lead, idx) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${lead.company} — ${lead.contactName} (${lead.role})`, 15, y);
      
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Email: ${lead.email} | Location: ${lead.location} | Website: ${lead.website}`, 15, y + 5);
      const matchLines = doc.splitTextToSize(`Match Reason: ${lead.reason}`, 175);
      doc.text(matchLines, 15, y + 10);
      
      y += 12 + (matchLines.length * 4) + 2;
    });

    doc.save(`Prospect-Leads-${(leadIndustry || "b2b").replace(/\s+/g, "-")}.pdf`);
  };

  // Download Leads CSV client-side
  const downloadLeadsCSV = (customLeads?: Lead[]) => {
    const leadsToUse = customLeads || leads;
    if (leadsToUse.length === 0) return;
    const headers = ["Company", "Website", "Location", "Contact Name", "Role", "Email Address", "Pitch Reason"];
    const rows = leadsToUse.map(l => [
      `"${l.company.replace(/"/g, '""')}"`,
      `"${l.website.replace(/"/g, '""')}"`,
      `"${l.location.replace(/"/g, '""')}"`,
      `"${l.contactName.replace(/"/g, '""')}"`,
      `"${l.role.replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${l.reason.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Prospect-Client-Leads-20.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Email Composer helper
  const openEmailComposer = (lead: Lead) => {
    setSelectedLead(lead);
    setEmailSubject(`Partnership Query: Supporting ${lead.company} Growth Strategy`);
    setEmailBody(`Hi ${lead.contactName.split(" ")[0] || "there"},\n\nI was reviewing ${lead.company}'s active market positioning and noticed you are leading efforts as the ${lead.role}.\n\nWe've crafted a unique startup optimization strategy tailored directly to your team's current challenges.\n\nWould you be open to a quick 10-minute briefing on Google Meet this coming week?\n\nBest regards,\n${user?.displayName || "Founder"}`);
    setEmailSuccess(false);

    // Update status to drafted if it was identified
    setLeads(prev => prev.map(l => l.email === lead.email && (!l.pipelineStatus || l.pipelineStatus === "identified") ? { ...l, pipelineStatus: "drafted" } : l));
    
    // Auto-prefill calendar event too
    setMeetingSummary(`Briefing: AI Co-Founder Strategy x ${lead.company}`);
    setMeetingDesc(`Exploring growth collaboration. Guest: ${lead.contactName} (${lead.role})`);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMeetingDate(tomorrow.toISOString().split("T")[0]);
    setMeetingTime("10:00");
    setMeetingSuccess(false);
  };

  // Task Management actions
  const toggleTaskCompleted = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText("");
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-slate-950 text-[#1c1917] dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-300">
      {/* Premium Sticky Header */}
      <header className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-stone-200/60 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm shadow-stone-100/40 dark:shadow-none transition-colors duration-300">
        <HumanLogo size="md" />

        {/* Connections & Dynamic profile */}
        <div className="flex items-center space-x-6">
          {/* Workspace OAuth Status */}
          <div className="hidden md:flex items-center space-x-3 text-[11px] font-bold">
            <button 
              onClick={ensureGoogleAuth}
              className="flex items-center space-x-1.5 bg-stone-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-stone-200/50 dark:border-slate-700/60 hover:border-emerald-500/50 transition-colors cursor-pointer"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${accessToken ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-stone-600 dark:text-slate-300">{accessToken ? "Gmail Connected" : "Connect Gmail"}</span>
            </button>
            <button 
              onClick={ensureGoogleAuth}
              className="flex items-center space-x-1.5 bg-stone-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-stone-200/50 dark:border-slate-700/60 hover:border-emerald-500/50 transition-colors cursor-pointer"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${accessToken ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-stone-600 dark:text-slate-300">{accessToken ? "Calendar Connected" : "Connect Calendar"}</span>
            </button>
          </div>

          {/* User profile details and logout */}
          <div className="flex items-center space-x-3 pl-4 border-l border-stone-200 dark:border-slate-800">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-stone-200 dark:border-slate-700 shadow-inner" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold border border-stone-200 dark:border-slate-700">
                {user?.displayName?.[0] || "F"}
              </div>
            )}
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-stone-900 dark:text-slate-100 leading-none">{user?.displayName || "Guest Founder"}</p>
              <p className="text-[10px] text-stone-400 dark:text-slate-400 font-medium mt-0.5">{user?.email || "guest@sandbox.net"}</p>
            </div>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-100 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-transparent"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <button
              onClick={() => {
                googleSignOut();
                onSignOut();
              }}
              title="Sign Out Workspace"
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-transparent"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Column: Chat Console (3/12 width) */}
        <div className="lg:col-span-3 border-r border-stone-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[calc(100vh-69px)] relative">
          {/* Chat Header & Session Memory Bar */}
          <div className="px-4 py-3 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between bg-stone-50/70 dark:bg-slate-900/80 shrink-0 gap-2">
            {/* Session selector dropdown button */}
            <div className="relative flex-1 min-w-0">
              <button
                onClick={() => setIsSessionMenuOpen(!isSessionMenuOpen)}
                className="w-full flex items-center justify-between space-x-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700/80 border border-stone-200/80 dark:border-slate-700 rounded-lg text-left transition-colors cursor-pointer"
                title="Switch Chat Session / Saved Memory"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-200 truncate">
                    {activeSession?.title || "Chat Memory"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {isSessionMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-stone-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3 text-emerald-500" />
                      <span>Saved Chat Threads ({sessions.length})</span>
                    </span>
                    <button
                      onClick={createNewSession}
                      className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>New</span>
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => switchSession(s.id)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-between group ${
                          s.id === activeSessionId
                            ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                            : "hover:bg-stone-100 dark:hover:bg-slate-700/60 text-stone-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-bold truncate">{s.title}</p>
                          <p className="text-[10px] text-stone-400 dark:text-slate-400">{s.updatedAt} • {s.messages.length} msgs</p>
                        </div>
                        {sessions.length > 1 && (
                          <button
                            onClick={(e) => deleteSession(s.id, e)}
                            title="Delete Session"
                            className="p-1 opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voice mute toggle button */}
            <button
              onClick={() => setIsVoiceMuted(!isVoiceMuted)}
              title={isVoiceMuted ? "Unmute Voice Output" : "Mute Voice Output"}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer border shrink-0 ${
                isVoiceMuted 
                  ? "text-stone-400 border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800" 
                  : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/70"
              }`}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Messages stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-[#1c1917] dark:bg-emerald-600 text-white rounded-br-none font-medium"
                      : "bg-[#f5f5f4] dark:bg-slate-800 text-stone-800 dark:text-slate-100 rounded-bl-none border border-stone-200/40 dark:border-slate-700/50"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                <span className="text-[9px] font-bold text-stone-400 dark:text-slate-500 mt-1 pl-1 pr-1">{m.timestamp}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat / Speech controls panel */}
          <div className="p-4 border-t border-stone-200/70 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-900/80 shrink-0 space-y-2.5">
            {/* Quick Action Prompt Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              <button
                onClick={() => setInputText(`Research deep market report for ${startupIndustry}`)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-stone-200 dark:border-slate-700 hover:border-emerald-300 rounded-lg shrink-0 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Compass className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Research Market</span>
              </button>

              <button
                onClick={() => setInputText(`Scan top competitors and differentiation strategies for ${startupName}`)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-stone-200 dark:border-slate-700 hover:border-emerald-300 rounded-lg shrink-0 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Competitors</span>
              </button>

              <button
                onClick={() => setInputText(`Mine 20 real verified prospect leads for ${startupIndustry}`)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-stone-200 dark:border-slate-700 hover:border-emerald-300 rounded-lg shrink-0 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Briefcase className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Mine 20 Leads</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mic Toggle button */}
              <button
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                  isMicEnabled 
                    ? "bg-emerald-600 text-white animate-pulse" 
                    : "bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700"
                }`}
                title={isMicEnabled ? "Microphone Active: Always Listening" : "Activate microphone"}
              >
                {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Chat Input Field */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSend()}
                placeholder={isListening ? "Listening... Speak now!" : isMicEnabled ? "Mic is active... Speak naturally" : "Type a startup prompt..."}
                disabled={isListening}
                className="flex-1 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 disabled:opacity-50 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500"
              />

              <button
                onClick={handleManualSend}
                disabled={!inputText.trim() || isListening}
                className="p-3 bg-[#1c1917] dark:bg-emerald-600 hover:bg-stone-800 dark:hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-stone-400 dark:text-slate-500 text-center mt-3 font-medium">
              Pro-tip: speak <em className="text-stone-600 dark:text-slate-300 font-bold">&quot;Research [market]...&quot;</em> to run agents hands-free!
            </p>
          </div>
        </div>

        {/* Middle Column: Interactive Worksheets (6/12 width) */}
        <div className="lg:col-span-6 bg-stone-50/40 dark:bg-slate-950/80 flex flex-col h-[calc(100vh-69px)] overflow-hidden">
          {/* Worksheet Tabs Header */}
          <div className="bg-white dark:bg-slate-900 border-b border-stone-200/60 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between shadow-sm shadow-stone-100/20 dark:shadow-none shrink-0">
            <div className="flex space-x-1 bg-stone-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("avatar")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === "avatar"
                    ? "bg-[#1c1917] dark:bg-emerald-600 text-white shadow-sm"
                    : "text-stone-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-slate-100"
                }`}
              >
                Co-Founder Avatar
              </button>
              <button
                onClick={() => setActiveTab("market")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === "market"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-stone-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-slate-100"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Market intelligence</span>
              </button>
              <button
                onClick={() => setActiveTab("competitors")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === "competitors"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-stone-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-slate-100"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Competitor Matrix</span>
              </button>
              <button
                onClick={() => setActiveTab("leads")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === "leads"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-stone-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-slate-100"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Prospect Leads</span>
              </button>
            </div>

            {/* Agent Live Progress indicator */}
            {isAgentRunning && (
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full animate-pulse font-bold flex items-center">
                <RefreshCw className="w-3 h-3 mr-1.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                Running agent
              </span>
            )}
          </div>

          {/* Worksheet scrollable content area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Tab A: CO-FOUNDER AVATAR PANEL */}
            {activeTab === "avatar" && (
              <div className="max-w-4xl mx-auto flex flex-col items-center space-y-6 py-4">
                
                {/* 1. Cybernetic Holographic Console Deck */}
                <div className="relative w-full max-w-sm flex justify-center items-center">
                  <div className="p-4 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 rounded-[2.5rem] border border-stone-800 shadow-2xl shadow-emerald-500/10 w-[290px] sm:w-[330px] h-[290px] sm:h-[330px] flex items-center justify-center relative overflow-hidden group">
                    {/* Animated grid overlay to give computer core look */}
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
                    {/* Glowing radial center gradient */}
                    <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />
                    
                    <Avatar 
                      isSpeaking={isSpeaking}
                      isListening={isListening}
                      isThinking={isThinking}
                    />
                  </div>
                </div>

                {/* Agent Action Console */}
                {agentProgress && (
                  <div className="w-full max-w-md bg-stone-950 rounded-xl p-3.5 border border-stone-800 shadow-lg text-left font-mono">
                    <p className="text-[10px] text-emerald-400 flex items-center font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-2.5 shrink-0" />
                      <span>{agentProgress}</span>
                    </p>
                  </div>
                )}

                {/* Startup Identity Alignment Card */}
                <div id="startup-identity-card" className="w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-stone-200/60 dark:border-slate-800 shadow-sm space-y-4 text-left transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-4 gap-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-stone-900 dark:text-slate-100 flex items-center">
                        <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-2 shrink-0" />
                        Startup Identity Alignment
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Calibrate your AI Co-Founder for your exact enterprise, industry, and strategic values</p>
                    </div>
                    <span className="self-start sm:self-center bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                      Active Partner Memory
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Startup Name</label>
                      <input
                        type="text"
                        value={startupName}
                        onChange={(e) => setStartupName(e.target.value)}
                        placeholder="e.g. Apex Quantum"
                        className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Primary Niche / Industry</label>
                      <input
                        type="text"
                        value={startupIndustry}
                        onChange={(e) => setStartupIndustry(e.target.value)}
                        placeholder="e.g. AI / GreenTech SaaS"
                        className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Core Mission & Value Prop</label>
                    <textarea
                      rows={2}
                      value={startupDescription}
                      onChange={(e) => setStartupDescription(e.target.value)}
                      placeholder="e.g. Generative AI carbon reporting and ESG intelligence for manufacturing enterprises."
                      className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 text-stone-800 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-stone-50 p-4 rounded-xl border border-stone-200/40 gap-3">
                    <span className="text-[10px] text-stone-400 font-medium leading-relaxed max-w-xl">
                      <strong>AI Co-Founder Memory Synced:</strong> Profile configuration is auto-linked to chat strategies and outreach sequences.
                    </span>
                    <button
                      onClick={() => {
                        const infoMsg = `Excellent! I have aligned my operational parameters to serve as the Co-Founder of **${startupName}** in the **${startupIndustry}** space. I have successfully customized my strategic memory to prioritize our core mission: "${startupDescription}". What should we execute first?`;
                        addMessage("assistant", infoMsg);
                        speakText(`Understood. Calibrating algorithms to lead as the co-founder of ${startupName}.`);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-[#1c1917] hover:bg-stone-800 text-white text-[11px] font-black rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 uppercase tracking-wider"
                    >
                      Calibrate Memory
                    </button>
                  </div>
                </div>

                {/* Grid for Controls & Financial Simulator */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  
                  {/* Left Column: Voice Session controls card */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-md flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 flex items-center mb-1">
                        <Sparkles className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                        AI Co-Founder Voice Terminal
                      </h3>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        Engage in continuous interactive strategic discussions. When enabled, speaking aloud will trigger real-time AI founder analysis.
                      </p>
                    </div>

                    {micErrorMessage && (
                      <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 flex items-start space-x-2 animate-pulse font-medium">
                        <span className="font-bold shrink-0 text-red-500">⚠️</span>
                        <span>{micErrorMessage}</span>
                      </div>
                    )}

                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/40 text-center space-y-4">
                      {isMicEnabled ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center space-x-2 text-emerald-600 font-extrabold text-xs tracking-wider uppercase mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>Voice sandbox active</span>
                          </div>
                          <p className="text-[11px] text-stone-500 mb-4 leading-relaxed">
                            I am actively listening. Say things like <strong className="text-stone-800">&quot;Run market research&quot;</strong> to start execution.
                          </p>
                          <button
                            onClick={toggleListening}
                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center cursor-pointer"
                          >
                            <MicOff className="w-3.5 h-3.5 mr-1.5" />
                            Pause Voice Terminal
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center space-x-1.5 text-stone-800 font-extrabold text-xs tracking-wider uppercase mb-2">
                            <Mic className="w-4 h-4 text-stone-400" />
                            <span>Voice sandbox idle</span>
                          </div>
                          <p className="text-[11px] text-stone-500 mb-4 leading-relaxed">
                            Experience real-time verbal co-founder sparring. Toggle voice session to speak, query, or instruct execution agents hands-free.
                          </p>
                          <button
                            onClick={toggleListening}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all flex items-center justify-center cursor-pointer hover:-translate-y-0.5"
                          >
                            <Mic className="w-3.5 h-3.5 mr-1.5" />
                            Enable Voice Terminal
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-stone-400 font-medium leading-normal flex items-start">
                      <span className="mr-1.5">💡</span>
                      <span>To trigger agents via text, you can always converse with the Chat Console on the left side at any time.</span>
                    </div>
                  </div>

                  {/* Right Column: Next-Level Holographic Financial Simulator & Valuator */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-md space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 flex items-center mb-1">
                        <TrendingUp className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                        Interactive Seed Valuation & Financial Sandbox
                      </h3>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        Model pre-revenue financial projections and calculate venture multiples directly within your planning dashboard.
                      </p>
                    </div>

                    {/* Sliders Grid */}
                    <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200/40">
                      
                      {/* Price Tier */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
                          <span>Avg Price / Month</span>
                          <span className="text-emerald-700 font-extrabold">${simPrice}</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="250"
                          step="5"
                          value={simPrice}
                          onChange={(e) => setSimPrice(Number(e.target.value))}
                          className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      {/* Active Customers */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
                          <span>Target Active Customers</span>
                          <span className="text-emerald-700 font-extrabold">{simCustomers.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="5000"
                          step="100"
                          value={simCustomers}
                          onChange={(e) => setSimCustomers(Number(e.target.value))}
                          className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      {/* EBITDA Profit Margin */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
                          <span>Target Net Margin</span>
                          <span className="text-emerald-700 font-extrabold">{simMargin}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="95"
                          step="5"
                          value={simMargin}
                          onChange={(e) => setSimMargin(Number(e.target.value))}
                          className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      {/* ARR Multiple */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
                          <span>ARR Valuation Multiple</span>
                          <span className="text-emerald-700 font-extrabold">{simMultiple}x</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="20"
                          step="1"
                          value={simMultiple}
                          onChange={(e) => setSimMultiple(Number(e.target.value))}
                          className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Result Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-stone-50 border border-stone-200/50 rounded-xl">
                        <span className="block text-[9px] font-extrabold text-stone-400 uppercase tracking-wider mb-0.5">Annual Run Rate (ARR)</span>
                        <span className="text-xs font-black text-stone-900">${(simPrice * simCustomers * 12).toLocaleString()}</span>
                      </div>
                      <div className="p-3 bg-stone-50 border border-stone-200/50 rounded-xl">
                        <span className="block text-[9px] font-extrabold text-stone-400 uppercase tracking-wider mb-0.5">Venture Valuation</span>
                        <span className="text-xs font-black text-emerald-700">${(simPrice * simCustomers * 12 * simMultiple).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Dynamic Advisory Bullet */}
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[10px] text-stone-600 leading-normal font-medium">
                      <strong className="text-emerald-800 font-bold uppercase tracking-wider mr-1.5">Advisor:</strong>
                      {simPrice * simCustomers * 12 >= 1000000 ? (
                        <span>Milestone Achieved! ARR exceeds $1M. You have reached premium Series A thresholds. Recommended team scale: Hire 12 product & sales engineers.</span>
                      ) : simPrice * simCustomers * 12 >= 250000 ? (
                        <span>Product-Market Fit Vector! ARR exceeds $250k. Excellent seed stage footing. Recommended team scale: Hire 4 fullstack developers & 1 SDR.</span>
                      ) : (
                        <span>Initial Validation Stage. Focus heavily on acquiring client leads. Leverage automated prospecting below to secure your first 50 paid users.</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Tab B: MARKET INTELLIGENCE REPORT */}
            {activeTab === "market" && (
              <div className="space-y-6">
                {/* Header widget */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-extrabold text-stone-950 flex items-center">
                      <Compass className="w-5 h-5 text-emerald-600 mr-2 shrink-0" />
                      Live Market Scrapers
                    </h2>
                    <p className="text-xs text-stone-400 font-medium">Fuses search engine scrapes to compile a comprehensive PDF report</p>
                  </div>
                  {marketReport && (
                    <button
                      onClick={downloadMarketReportPDF}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center shadow-sm cursor-pointer hover:-translate-y-0.5"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Download PDF Report
                    </button>
                  )}
                </div>

                {/* Scraper request form */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm">
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Target Industry or Niche</label>
                    {startupIndustry && (
                      <button
                        onClick={() => setMarketQuery(startupIndustry)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center transition-all bg-emerald-50 hover:bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-200/30 cursor-pointer"
                        title="Prefill with active startup industry"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Use My Startup Industry ({startupIndustry})
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={marketQuery}
                      onChange={(e) => setMarketQuery(e.target.value)}
                      placeholder="e.g. US residential solar distribution, Corporate wellness software trends 2026"
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 placeholder-stone-400"
                    />
                    <button
                      onClick={() => triggerResearchAgent(marketQuery)}
                      disabled={isAgentRunning || !marketQuery.trim()}
                      className="px-5 py-2.5 bg-[#1c1917] hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Run Scraper
                    </button>
                  </div>
                </div>

                {marketReport ? (
                  <div className="space-y-6">
                    {/* Multi-Page Report Tab Selector */}
                    {marketReport.page1 && (
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-stone-200/60 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5 overflow-x-auto">
                          <button
                            onClick={() => setResearchActivePage(1)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                              researchActivePage === 1
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Page 1: Executive Overview</span>
                          </button>

                          <button
                            onClick={() => setResearchActivePage(2)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                              researchActivePage === 2
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Page 2: Technical Mechanics</span>
                          </button>

                          <button
                            onClick={() => setResearchActivePage(3)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                              researchActivePage === 3
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Page 3: Strategic Roadmap</span>
                          </button>

                          <button
                            onClick={() => setResearchActivePage("all")}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                              researchActivePage === "all"
                                ? "bg-stone-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                                : "text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>View Complete 3-Page Document</span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => downloadMarketReportPDF(marketReport)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center shadow-sm cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            <span>Export 3-Page PDF</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Page 1 Content */}
                    {(researchActivePage === 1 || researchActivePage === "all" || !marketReport.page1) && (
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-stone-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            Deep Research Report • Page 1 of 3
                          </span>
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border border-emerald-200/40">
                            Grounded Scrape Validated
                          </span>
                        </div>

                        <h3 className="text-xl font-black text-stone-900 dark:text-white">
                          {marketReport.page1?.title || marketReport.marketName}
                        </h3>

                        <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-stone-700 dark:text-slate-300 whitespace-pre-wrap font-sans bg-stone-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-stone-200/40 dark:border-slate-800">
                          {marketReport.page1?.contentMarkdown || marketReport.summary}
                        </div>

                        {/* Page 1 Data points */}
                        {marketReport.page1?.keyDataPoints && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {marketReport.page1.keyDataPoints.map((dp, i) => (
                              <div key={i} className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider block">{dp.label}</span>
                                <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 block">{dp.value}</span>
                                {dp.detail && <p className="text-[11px] text-stone-600 dark:text-slate-400">{dp.detail}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Page 2 Content */}
                    {(researchActivePage === 2 || researchActivePage === "all") && marketReport.page2 && (
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-stone-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            Deep Research Report • Page 2 of 3
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono px-2.5 py-0.5 rounded-full font-bold uppercase">
                            Technical Analysis & Case Studies
                          </span>
                        </div>

                        <h3 className="text-xl font-black text-stone-900 dark:text-white">
                          {marketReport.page2.title}
                        </h3>
                        <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                          {marketReport.page2.subtitle}
                        </p>

                        <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-stone-700 dark:text-slate-300 whitespace-pre-wrap font-sans bg-stone-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-stone-200/40 dark:border-slate-800">
                          {marketReport.page2.contentMarkdown}
                        </div>

                        {/* Page 2 Data points */}
                        {marketReport.page2.keyDataPoints && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {marketReport.page2.keyDataPoints.map((dp, i) => (
                              <div key={i} className="p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider block">{dp.label}</span>
                                <span className="text-sm font-black text-blue-800 dark:text-blue-300 block">{dp.value}</span>
                                {dp.detail && <p className="text-[11px] text-stone-600 dark:text-slate-400">{dp.detail}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Page 3 Content */}
                    {(researchActivePage === 3 || researchActivePage === "all") && marketReport.page3 && (
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-stone-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            Deep Research Report • Page 3 of 3
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono px-2.5 py-0.5 rounded-full font-bold uppercase">
                            Strategic Roadmap & Action Plan
                          </span>
                        </div>

                        <h3 className="text-xl font-black text-stone-900 dark:text-white">
                          {marketReport.page3.title}
                        </h3>
                        <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                          {marketReport.page3.subtitle}
                        </p>

                        <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-stone-700 dark:text-slate-300 whitespace-pre-wrap font-sans bg-stone-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-stone-200/40 dark:border-slate-800">
                          {marketReport.page3.contentMarkdown}
                        </div>
                      </div>
                    )}

                    {/* Scraper evidence lists */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200/60 dark:border-slate-800 shadow-sm space-y-3">
                      <h4 className="text-[10px] font-extrabold text-stone-400 dark:text-slate-500 uppercase tracking-widest">Reference Grounded Sources & Citations</h4>
                      <div className="flex flex-wrap gap-2">
                        {marketReport.sources.map((s, idx) => (
                          <span key={idx} className="bg-stone-50 dark:bg-slate-800 border border-stone-200/60 dark:border-slate-700 text-stone-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center font-bold">
                            <LinkIcon className="w-2.5 h-2.5 mr-1.5 text-stone-400" />
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-2xl border border-stone-200/60 text-center text-stone-400 shadow-sm">
                    <Compass className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">No Market Overviews Generated</p>
                    <p className="text-xs text-stone-400 mt-1">Specify an industry concept above to trigger active intelligence.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab C: COMPETITOR MATRIX VIEW */}
            {activeTab === "competitors" && (
              <div className="space-y-6">
                {/* Header widget */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-extrabold text-stone-950 flex items-center">
                      <Target className="w-5 h-5 text-emerald-600 mr-2 shrink-0" />
                      Competitor Strategy Matrix
                    </h2>
                    <p className="text-xs text-stone-400 font-medium">Maps pricing strategies, feature wedges, weaknesses, and direct tactical plans</p>
                  </div>
                  {competitorAnalysis && (
                    <button
                      onClick={downloadCompetitorPDF}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center shadow-sm cursor-pointer hover:-translate-y-0.5"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Download Matrix PDF
                    </button>
                  )}
                </div>

                {/* Strategy Concept input form */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm">
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Your Concept or Pitch Wedge</label>
                    {startupDescription && (
                      <button
                        onClick={() => setCompetitorQuery(`${startupName}: ${startupDescription}`)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center transition-all bg-emerald-50 hover:bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-200/30 cursor-pointer"
                        title="Prefill with startup identity description"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Use My Startup Concept ({startupName})
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={competitorQuery}
                      onChange={(e) => setCompetitorQuery(e.target.value)}
                      placeholder="e.g. Remote design collaboration with integrated legal signatures"
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 placeholder-stone-400"
                    />
                    <button
                      onClick={() => triggerCompetitorAgent(competitorQuery)}
                      disabled={isAgentRunning || !competitorQuery.trim()}
                      className="px-5 py-2.5 bg-[#1c1917] hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Scan Competitors
                    </button>
                  </div>
                </div>

                {competitorAnalysis ? (
                  <div className="space-y-6">
                    {/* Concept card */}
                    <div className="bg-[#1c1917] text-white p-5 rounded-2xl shadow-sm space-y-1">
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Startup Strategy Concept Target</h4>
                      <p className="text-xs font-bold text-stone-200 leading-normal">{competitorAnalysis.concept}</p>
                    </div>

                    {/* Competitor detailed maps */}
                    <div className="space-y-4">
                      {competitorAnalysis.competitors.map((comp, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden shadow-sm">
                          {/* Card Header */}
                          <div className="bg-stone-50 border-b border-stone-200/60 px-5 py-3.5 flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-stone-900">{comp.name}</h4>
                              <p className="text-[10px] text-stone-400 font-mono mt-0.5">{comp.website}</p>
                            </div>
                            <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                              Competitor #{idx + 1}
                            </span>
                          </div>

                          {/* Card Body */}
                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                            <div className="space-y-3.5">
                              <div>
                                <h5 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Positioning Statement</h5>
                                <p className="text-stone-600 mt-1 leading-relaxed font-medium">{comp.positioning}</p>
                              </div>
                              <div>
                                <h5 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Pricing Strategy</h5>
                                <p className="text-stone-600 mt-1 leading-relaxed font-semibold">{comp.pricing}</p>
                              </div>
                            </div>

                            <div className="space-y-3.5">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <h5 className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Core Strengths</h5>
                                  <ul className="list-disc pl-3.5 text-stone-500 space-y-0.5 text-[11px]">
                                    {comp.strengths.slice(0, 2).map((s, i) => <li key={i}>{s}</li>)}
                                  </ul>
                                </div>
                                <div className="space-y-1">
                                  <h5 className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">Weaknesses</h5>
                                  <ul className="list-disc pl-3.5 text-stone-500 space-y-0.5 text-[11px]">
                                    {comp.weaknesses.slice(0, 2).map((w, i) => <li key={i}>{w}</li>)}
                                  </ul>
                                </div>
                              </div>

                              <div className="border-t border-stone-100 pt-3">
                                <h5 className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center">
                                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                                  Your Tactical Wedge
                               </h5>
                                <p className="text-stone-800 font-bold mt-1 leading-relaxed">{comp.differentiation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Consolidated Strategy */}
                    <div className="bg-emerald-50/40 border border-emerald-100 p-6 rounded-2xl shadow-sm space-y-2">
                      <h4 className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">Recommended Playbook Tactics</h4>
                      <p className="text-xs text-stone-800 leading-relaxed font-medium">{competitorAnalysis.strategicAdvantage}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-2xl border border-stone-200/60 text-center text-stone-400 shadow-sm">
                    <Target className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">No competitor analysis created</p>
                    <p className="text-xs text-stone-400 mt-1">Submit your startup concept description to perform a scan.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab D: PROSPECTIVE LEADS & OUTREACH */}
            {activeTab === "leads" && (
              <div className="space-y-6">
                {/* Header widget */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-extrabold text-stone-950 flex items-center">
                      <Briefcase className="w-5 h-5 text-emerald-600 mr-2 shrink-0" />
                      Prospect Lead Miner
                      <span className="ml-3 px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 rounded-full flex items-center">
                        <Sparkles className="w-3 h-3 mr-1 text-emerald-500" />
                        Apollo.io API Connected
                      </span>
                    </h2>
                    <p className="text-xs text-stone-400 font-medium">Extracts up to 10 verified prospect accounts (Testing Phase Limit) with zero fake data</p>
                  </div>
                  {leads.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadLeadsPDF(leads)}
                        className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-white text-xs font-bold rounded-xl transition-all flex items-center shadow-sm cursor-pointer hover:-translate-y-0.5"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download Leads PDF
                      </button>
                      <button
                        onClick={() => downloadLeadsCSV(leads)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center shadow-sm cursor-pointer hover:-translate-y-0.5"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Export CSV List
                      </button>
                    </div>
                  )}
                </div>

                {/* Testing Phase Notice Banner */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3.5 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shadow-sm">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono bg-amber-200/80 dark:bg-amber-800 text-amber-950 dark:text-amber-100 font-black px-2 py-0.5 rounded text-[10px] uppercase shrink-0">
                      Testing Phase Active
                    </span>
                    <span className="font-medium">
                      Real Apollo.io lead extraction is strictly capped at 10 leads max per search to preserve API credits. Simulated/fake data generation is strictly disabled.
                    </span>
                  </div>
                </div>

                {/* Lead request criteria */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Target Industry/Niche</label>
                      {startupIndustry && (
                        <button
                          onClick={() => setLeadIndustry(startupIndustry)}
                          className="text-[9px] text-emerald-700 hover:text-emerald-800 font-extrabold transition-all bg-emerald-50 hover:bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200/20 cursor-pointer"
                        >
                          Use Startup Niche
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={leadIndustry}
                      onChange={(e) => setLeadIndustry(e.target.value)}
                      placeholder="e.g. Healthcare platforms, Retail ERP"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 placeholder-stone-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-widest mb-2">Buyer Persona Profile</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={leadPersona}
                        onChange={(e) => setLeadPersona(e.target.value)}
                        placeholder="e.g. Operations Director, Chief Legal Officer"
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 placeholder-stone-400"
                      />
                      <button
                        onClick={() => triggerLeadFinderAgent(leadIndustry, leadPersona)}
                        disabled={isAgentRunning || !leadIndustry.trim() || !leadPersona.trim()}
                        className="px-5 py-2.5 bg-[#1c1917] hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        Mine Leads
                      </button>
                    </div>
                  </div>
                </div>

                {leads.length > 0 ? (
                  <div className="space-y-6">
                    
                    {/* CRM Views Toggle and Metric bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-stone-100 p-2 rounded-2xl border border-stone-200/60 gap-3">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setCrmViewMode("kanban")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                            crmViewMode === "kanban"
                              ? "bg-white text-stone-900 shadow-sm border border-stone-200/40"
                              : "text-stone-500 hover:text-stone-800"
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Interactive Kanban pipeline</span>
                        </button>
                        <button
                          onClick={() => setCrmViewMode("table")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                            crmViewMode === "table"
                              ? "bg-white text-stone-900 shadow-sm border border-stone-200/40"
                              : "text-stone-500 hover:text-stone-800"
                          }`}
                        >
                          <ListFilter className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Direct Data Table</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-[10px] font-extrabold text-stone-400 uppercase tracking-widest px-2 font-mono">
                        <span>Extracted: {leads.length}</span>
                        <span>•</span>
                        <span className="text-emerald-700">Booked Calls: {leads.filter(l => l.pipelineStatus === "booked").length}</span>
                      </div>
                    </div>

                    {crmViewMode === "table" ? (
                      /* Beautiful Leads List Table */
                      <div className="bg-white border border-stone-200/60 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-stone-50 text-stone-400 font-extrabold border-b border-stone-200/60 tracking-wider text-[10px] uppercase">
                                <th className="p-4 pl-5">Company & Domain</th>
                                <th className="p-4">Decision Maker</th>
                                <th className="p-4">Contact Role</th>
                                <th className="p-4">Direct Email</th>
                                <th className="p-4">CRM Pipeline State</th>
                                <th className="p-4 text-right pr-5">Execution Options</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-stone-700">
                              {leads.map((lead, idx) => (
                                <tr key={idx} className="hover:bg-stone-50/40 transition-colors">
                                  <td className="p-4 pl-5">
                                    <div>
                                      <span className="font-bold text-stone-900 block">{lead.company}</span>
                                      <span className="text-[10px] text-stone-400 font-mono mt-0.5 inline-flex items-center">
                                        <LinkIcon className="w-2.5 h-2.5 mr-1" />
                                        {lead.website}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-bold text-stone-800">{lead.contactName}</td>
                                  <td className="p-4">
                                    <span className="bg-stone-100 border border-stone-200/50 px-2.5 py-1 rounded-lg text-[10px] font-bold text-stone-600">
                                      {lead.role}
                                    </span>
                                  </td>
                                  <td className="p-4 font-mono text-stone-500 text-[11px]">
                                    <div className="flex flex-col space-y-1">
                                      <span className="font-bold text-stone-800 dark:text-slate-200">{lead.email}</span>
                                      <span className={`inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded border w-fit ${
                                        lead.emailStatus === "verified"
                                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                          : lead.emailStatus === "corporate_domain"
                                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                      }`}>
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                        <span>{lead.emailStatus === "verified" ? "Verified Corporate" : lead.emailStatus === "corporate_domain" ? "Corporate Domain" : "Pattern Matched"}</span>
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                      lead.pipelineStatus === "booked"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                        : lead.pipelineStatus === "sent"
                                        ? "bg-amber-50 border-amber-200 text-amber-800"
                                        : lead.pipelineStatus === "drafted"
                                        ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                                        : "bg-stone-100 border-stone-200 text-stone-500"
                                    }`}>
                                      {lead.pipelineStatus || "identified"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right pr-5">
                                    <button
                                      onClick={() => openEmailComposer(lead)}
                                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold inline-flex items-center cursor-pointer transition-all ${
                                        selectedLead?.email === lead.email
                                          ? "bg-stone-900 text-white border border-stone-900"
                                          : lead.emailed
                                          ? "bg-stone-50 text-stone-400 border border-stone-200/60"
                                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/40"
                                      }`}
                                    >
                                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                                      {selectedLead?.email === lead.email ? "Active Composition" : lead.emailed ? "Pitch Dispatched" : "Draft Pitch"}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* Interactive CRM Pipeline Kanban Board */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { id: "identified", label: "Identified Targets", color: "border-stone-200", icon: <Search className="w-3.5 h-3.5 text-stone-500" /> },
                          { id: "drafted", label: "Pitch Drafted", color: "border-indigo-200", icon: <FileEdit className="w-3.5 h-3.5 text-indigo-600" /> },
                          { id: "sent", label: "Pitches Sent", color: "border-amber-200", icon: <Send className="w-3.5 h-3.5 text-amber-600" /> },
                          { id: "booked", label: "Meetings Booked", color: "border-emerald-200", icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> }
                        ].map((col) => {
                          const colLeads = leads.filter(l => (l.pipelineStatus || "identified") === col.id);
                          return (
                            <div key={col.id} className="bg-stone-50 border border-stone-200/50 p-4 rounded-2xl flex flex-col min-h-[350px]">
                              {/* Column Header */}
                              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200/50">
                                <div className="flex items-center space-x-1.5">
                                  {col.icon}
                                  <span className="text-[10px] font-black text-stone-700 uppercase tracking-wider">{col.label}</span>
                                </div>
                                <span className="text-[9px] bg-stone-200/80 text-stone-600 px-2.5 py-0.5 rounded-full font-extrabold font-mono">
                                  {colLeads.length}
                                </span>
                              </div>

                              {/* Lead Cards List */}
                              <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[380px] pr-1">
                                {colLeads.length === 0 ? (
                                  <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-stone-200/60 rounded-xl bg-white/20">
                                    <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest">No Targets</span>
                                  </div>
                                ) : (
                                  colLeads.map((lead, lIdx) => (
                                    <div
                                      key={lIdx}
                                      onClick={() => openEmailComposer(lead)}
                                      className={`p-4 bg-white border rounded-xl hover:shadow-md hover:border-emerald-500/25 transition-all text-left space-y-2.5 cursor-pointer relative group ${
                                        selectedLead?.email === lead.email
                                          ? "ring-2 ring-emerald-600 border-transparent"
                                          : "border-stone-200/60"
                                      }`}
                                    >
                                      <div>
                                        <h4 className="text-xs font-black text-stone-900 leading-tight flex items-center justify-between">
                                          <span className="truncate max-w-[150px]">{lead.company}</span>
                                          {selectedLead?.email === lead.email && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                          )}
                                        </h4>
                                        <span className="text-[9px] text-stone-400 truncate block mt-0.5">{lead.website}</span>
                                      </div>

                                      <div className="border-t border-stone-100 pt-2 text-[10px]">
                                        <p className="font-extrabold text-stone-800 truncate">{lead.contactName}</p>
                                        <p className="text-[9px] text-stone-500 truncate">{lead.role}</p>
                                      </div>

                                      <div className="pt-1 border-t border-stone-50">
                                        {col.id === "identified" && (
                                          <button className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-lg transition-colors uppercase tracking-wider">
                                            Compose Pitch
                                          </button>
                                        )}
                                        {col.id === "drafted" && (
                                          <button className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[9px] font-black rounded-lg transition-colors uppercase tracking-wider">
                                            Deploy Email
                                          </button>
                                        )}
                                        {col.id === "sent" && (
                                          <button className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[9px] font-black rounded-lg transition-colors uppercase tracking-wider">
                                            Schedule call
                                          </button>
                                        )}
                                        {col.id === "booked" && (
                                          <div className="w-full py-1 bg-emerald-100 border border-emerald-200 text-emerald-900 text-[9px] font-black rounded-lg text-center flex items-center justify-center uppercase tracking-wider">
                                            <Check className="w-3 h-3 mr-1" />
                                            Booked!
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Integrated Sales Outreach Composer */}
                    {selectedLead && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        
                        {/* 1. Gmail Composer Card */}
                        <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-md space-y-4">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                            <h3 className="text-xs font-bold text-stone-900 flex items-center">
                              <Mail className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                              Gmail Client Outreach
                            </h3>
                            <span className="text-[10px] bg-stone-100 border border-stone-200/60 text-stone-500 px-2.5 py-1 rounded-lg font-bold">
                              To: {selectedLead.contactName}
                            </span>
                          </div>

                          {emailSuccess && (
                            <div className="bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center font-bold">
                              <Check className="w-4 h-4 mr-1.5 shrink-0 text-emerald-600" />
                              Email sent successfully! Draft updated in your Google Workspace Sent folder.
                            </div>
                          )}

                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-1">Subject</label>
                              <input
                                type="text"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-1">Contextual Pitch Body</label>
                              <textarea
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                rows={6}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs leading-relaxed focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 font-sans text-stone-700"
                              />
                            </div>

                            <button
                              onClick={sendOutreachEmail}
                              disabled={isSendingEmail || !accessToken}
                              className="w-full py-3 bg-[#1c1917] hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-400 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm hover:-translate-y-0.5"
                            >
                              {isSendingEmail ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4 mr-2" />
                              )}
                              {accessToken ? "Send Outreach Email Now" : "Authorize with Google to dispatch pitches"}
                            </button>
                          </div>
                        </div>

                        {/* 2. Calendar Scheduler Card */}
                        <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-md space-y-4">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                            <h3 className="text-xs font-bold text-stone-900 flex items-center">
                              <CalendarIcon className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                              Google Calendar Scheduler
                            </h3>
                            <span className="text-[10px] bg-stone-100 border border-stone-200/60 text-stone-500 px-2.5 py-1 rounded-lg font-bold">
                              Guest: {selectedLead.email}
                            </span>
                          </div>

                          {meetingSuccess && (
                            <div className="bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center font-bold">
                              <Check className="w-4 h-4 mr-1.5 shrink-0 text-emerald-600" />
                              Call successfully scheduled! Event synced on your Google Calendar.
                            </div>
                          )}

                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-1">Session Title</label>
                              <input
                                type="text"
                                value={meetingSummary}
                                onChange={(e) => setMeetingSummary(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-1">Session Date</label>
                                <input
                                  type="date"
                                  value={meetingDate}
                                  onChange={(e) => setMeetingDate(e.target.value)}
                                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-1">Time Slot</label>
                                <input
                                  type="time"
                                  value={meetingTime}
                                  onChange={(e) => setMeetingTime(e.target.value)}
                                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-1">Brief Description</label>
                              <textarea
                                value={meetingDesc}
                                onChange={(e) => setMeetingDesc(e.target.value)}
                                rows={2}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 text-stone-600"
                              />
                            </div>

                            <button
                              onClick={scheduleCalendarMeeting}
                              disabled={isSchedulingMeeting || !accessToken}
                              className="w-full py-3 bg-[#1c1917] hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-400 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm hover:-translate-y-0.5"
                            >
                              {isSchedulingMeeting ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CalendarIcon className="w-4 h-4 mr-2" />
                              )}
                              {accessToken ? "Schedule Workspace Meeting" : "Authorize with Google to book calendar slots"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-2xl border border-stone-200/60 text-center text-stone-400 shadow-sm">
                    <Briefcase className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">No prospect lists mined</p>
                    <p className="text-xs text-stone-400 mt-1">Submit your industry targeting criteria above to extract 20 contacts.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Execution Backlog & Automated Trigger Buttons (3/12 width) */}
        <div className="lg:col-span-3 border-l border-stone-200/70 bg-white flex flex-col h-[calc(100vh-69px)] overflow-y-auto p-5 space-y-6">
          
          {/* Active Agents Trigger Menu */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-stone-400 tracking-wider uppercase">Strategic AI Agents</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab("market");
                  setMarketQuery("Electric Vehicle smart charging grids in Europe");
                  triggerResearchAgent("Electric Vehicle smart charging grids in Europe");
                }}
                disabled={isAgentRunning}
                className="w-full p-3.5 bg-stone-50 hover:bg-stone-100/60 border border-stone-200/50 hover:border-emerald-500/20 rounded-xl transition-all text-left flex items-start cursor-pointer group"
              >
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mr-3 shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Trigger Market Research</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-normal">Runs live scans for 2026 industry intelligence reports.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab("competitors");
                  setCompetitorQuery("B2B AI meeting summarizer with Gmail automation");
                  triggerCompetitorAgent("B2B AI meeting summarizer with Gmail automation");
                }}
                disabled={isAgentRunning}
                className="w-full p-3.5 bg-stone-50 hover:bg-stone-100/60 border border-stone-200/50 hover:border-indigo-500/20 rounded-xl transition-all text-left flex items-start cursor-pointer group"
              >
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mr-3 shrink-0 group-hover:bg-indigo-100 transition-colors">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Trigger Competitor Scan</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-normal">Gathers actual competitor prices and strategy matrices.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab("leads");
                  setLeadIndustry("Corporate sustainability consultation");
                  setLeadPersona("Head of Sustainability");
                  triggerLeadFinderAgent("Corporate sustainability consultation", "Head of Sustainability");
                }}
                disabled={isAgentRunning}
                className="w-full p-3.5 bg-stone-50 hover:bg-stone-100/60 border border-stone-200/50 hover:border-teal-500/20 rounded-xl transition-all text-left flex items-start cursor-pointer group"
              >
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg mr-3 shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Trigger Lead Finder</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-normal">Extracts exactly 20 potential high-intent client leads.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Task Planner backlog section */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <h3 className="text-[10px] font-bold text-stone-400 tracking-wider uppercase">Startup Strategic Backlog</h3>
            
            {/* Action item addition form */}
            <form onSubmit={handleAddTask} className="flex space-x-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Enter new strategic milestone..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 text-stone-800 placeholder-stone-400"
              />
              <button
                type="submit"
                className="p-2 bg-[#1c1917] hover:bg-stone-800 text-white rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Backlog Items */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border flex items-start transition-all ${
                    task.completed
                      ? "bg-stone-50/50 border-stone-200/40 opacity-60"
                      : "bg-white border-stone-200"
                  }`}
                >
                  <button
                    onClick={() => toggleTaskCompleted(task.id)}
                    className="p-0.5 text-stone-400 hover:text-emerald-600 mr-2 cursor-pointer transition-colors shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-stone-300" />
                    )}
                  </button>

                  <div className="flex-1 text-xs space-y-1">
                    <p className={`font-bold text-stone-800 leading-tight ${task.completed ? "line-through text-stone-400 font-medium" : ""}`}>
                      {task.text}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[9px] font-bold text-stone-400">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-0.5 text-stone-300" />
                        {task.createdAt}
                      </span>
                      {task.agentName && (
                        <span className="bg-emerald-50 border border-emerald-100/60 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold uppercase text-[8px]">
                          {task.agentName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Wisdom Card quotes */}
          <div className="bg-[#1c1917] text-white p-5 rounded-2xl space-y-3 shadow-lg border border-stone-800 flex-1 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase">Strategic Wisdom</span>
              <span className="text-[8px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded font-mono font-bold">2026 OUTLOOK</span>
            </div>
            <p className="text-xs leading-relaxed text-stone-300 font-serif italic flex-1 flex items-center">
              &quot;The most successful founders focus on hyper-targeted distribution. Don&apos;t build in secret. Launch prospecting email sequences on day one to validate the actual willingness to pay.&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Firebase & OAuth Credentials Configuration Modal */}
      <FirebaseConfigModal 
        isOpen={isFirebaseModalOpen} 
        onClose={() => setIsFirebaseModalOpen(false)} 
        onConfigSaved={() => {}} 
      />
    </div>
  );
}
