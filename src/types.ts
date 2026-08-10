export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Lead {
  company: string;
  website: string;
  location: string;
  contactName: string;
  role: string;
  email: string;
  reason: string;
  emailed?: boolean;
  pipelineStatus?: "identified" | "drafted" | "sent" | "booked";
}

export interface MarketTrend {
  title: string;
  description: string;
}

export interface MarketReport {
  marketName: string;
  summary: string;
  marketSize: string;
  keyTrends: MarketTrend[];
  targetAudience: string;
  challenges: string[];
  opportunities: string[];
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
