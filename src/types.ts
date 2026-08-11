export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface Lead {
  company: string;
  website: string;
  location: string;
  contactName: string;
  role: string;
  email: string;
  reason: string;
  emailStatus?: "verified" | "pattern_matched" | "corporate_domain";
  emailed?: boolean;
  pipelineStatus?: "identified" | "drafted" | "sent" | "booked";
}

export interface MarketTrend {
  title: string;
  description: string;
}

export interface DeepResearchPage {
  pageNumber: number;
  title: string;
  subtitle: string;
  contentMarkdown: string;
  keyDataPoints: { label: string; value: string; detail?: string }[];
  strategicTakeaways: string[];
}

export interface MarketReport {
  topic: string;
  marketName: string; // Backward compatibility
  summary: string;
  brandTitle: string;
  generatedDate: string;
  totalPages: number;
  page1: DeepResearchPage;
  page2: DeepResearchPage;
  page3: DeepResearchPage;
  sources: string[];
}

export interface Competitor {
  name: string;
  website: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  pricing: string;
  differentiation: string;
}

export interface CompetitorAnalysis {
  concept: string;
  competitors: Competitor[];
  strategicAdvantage: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  agentName?: string;
  createdAt: string;
}

export interface CustomFirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  oAuthClientId?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
  marketReport?: MarketReport | null;
  competitorAnalysis?: CompetitorAnalysis | null;
  leads?: Lead[];
  tasks?: Task[];
}

