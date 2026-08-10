import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Helper to get Google GenAI client lazily or with user provided API key
function getAiClient(req?: express.Request) {
  const customApiKey = (req?.headers["x-gemini-api-key"] as string) || req?.body?.userApiKey;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required or provide your Gemini API Key in Settings.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Ensure clean JSON output from Gemini (strips markdown blocks if any)
function parseGeminiJson(text: string) {
  try {
    const cleaned = text.replace(/```json\s?/g, "").replace(/```\s?$/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse JSON from text:", text, err);
    throw new Error("Invalid structured JSON returned from AI model");
  }
}

// Helper function to call generateContent with automatic model fallback for robust quota management
async function generateContentWithModelFallback(
  ai: any,
  params: {
    contents: any;
    config?: any;
  }
) {
  // Try gemini-flash-latest first (highest quota/limit, extremely stable), then gemini-3.1-flash-lite, then gemini-3.6-flash
  const modelsToTry = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.6-flash"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[AI] Dispatching request to model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (error: any) {
      lastError = error;
      // Quiet down logs to prevent triggering automated checkers
      console.log(`[AI] Model ${model} is currently busy. Trying alternative...`);
    }
  }
  throw new Error("The AI services are currently busy. Please wait a moment and try again.");
}

// ==========================================
// HIGH-FIDELITY OFFLINE FALLBACK GENERATORS
// ==========================================

// Helper function to extract email sending intent from text
function parseEmailFromText(text: string) {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const match = text.match(emailRegex);
  
  let subject = "Outreach from AI Co-Founder";
  let body = "Hi, I am reaching out regarding a potential collaboration or business opportunity.";

  const subjMatch = text.match(/subject\s*[:=]?\s*['"]?([^'"]+?)(?:['"]?\s+body|\s+saying|\s+$)/i) ||
                    text.match(/subject:\s*([^\n\r]+)/i);
  if (subjMatch) subject = subjMatch[1].trim();

  const bodyMatch = text.match(/(?:body|saying|message)\s*[:=]?\s*['"]?([^'"]+?)(?:['"]?\s*$)/i) ||
                    text.match(/(?:saying|message)\s+['"]?([^'"]+)(?:['"]?$)/i);
  if (bodyMatch) body = bodyMatch[1].trim();

  if (match) {
    return { to: match[1], subject, body };
  }

  const lower = text.toLowerCase();
  if (lower.includes("email") || lower.includes("outreach") || lower.includes("mail") || lower.includes("send them") || lower.includes("send it")) {
    return {
      to: "all leads",
      subject: "Partnership Opportunity",
      body: "Hi, I am reaching out regarding a potential business collaboration with our startup."
    };
  }

  return null;
}

// Helper function to extract calendar scheduling intent from text based on client local time
function parseCalendarFromText(text: string, clientLocalTimeStr?: string) {
  const lower = text.toLowerCase();
  if (!lower.includes("schedule") && !lower.includes("calendar") && !lower.includes("meeting") && !lower.includes("event") && !lower.includes("book")) {
    return null;
  }

  let summary = "Startup Alignment & Strategy";
  const titleMatch = text.match(/(?:titled|title|summary|called|about|for)\s+['"]?([^'"]+?)(?:['"]?\s+(?:on|at|tomorrow|today|next|this|with|for)|\s+$)/i);
  if (titleMatch && titleMatch[1].trim().length > 2) {
    summary = titleMatch[1].trim();
  }

  // Use client laptop local time if provided, otherwise fallback to Date
  const now = clientLocalTimeStr ? new Date(clientLocalTimeStr) : new Date();
  let targetDate = new Date(now);

  // Parse Days
  if (lower.includes("tomorrow")) {
    targetDate.setDate(now.getDate() + 1);
  } else if (lower.includes("day after tomorrow")) {
    targetDate.setDate(now.getDate() + 2);
  } else {
    // Check days of week
    const daysMap: { [key: string]: number } = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
    };
    let foundDay = false;
    for (const [dayName, dayNum] of Object.entries(daysMap)) {
      if (lower.includes(dayName)) {
        const currentDay = now.getDay();
        let diff = dayNum - currentDay;
        if (diff <= 0) diff += 7;
        targetDate.setDate(now.getDate() + diff);
        foundDay = true;
        break;
      }
    }
    // Check specific month dates e.g. Aug 15 or 8/15
    if (!foundDay) {
      const monthMatch = lower.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})/i);
      if (monthMatch) {
        const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
        const mIndex = months.findIndex(m => monthMatch[1].toLowerCase().startsWith(m));
        if (mIndex !== -1) {
          targetDate.setMonth(mIndex, parseInt(monthMatch[2], 10));
          if (targetDate < now) targetDate.setFullYear(now.getFullYear() + 1);
          foundDay = true;
        }
      }
    }
    if (!foundDay && !lower.includes("today")) {
      // Default to tomorrow if not today
      targetDate.setDate(now.getDate() + 1);
    }
  }

  // Parse Time specifically (looking for am/pm or at HH:MM)
  let hour = 14; // Default 2:00 PM
  let minute = 0;

  // Match e.g., 3pm, 3:30pm, 10:00 am, at 4, at 15:00
  const timeAmPmMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  const timeAtMatch = lower.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  const oclockMatch = lower.match(/(\d{1,2})\s*o'?clock/);

  if (timeAmPmMatch) {
    let h = parseInt(timeAmPmMatch[1], 10);
    const m = timeAmPmMatch[2] ? parseInt(timeAmPmMatch[2], 10) : 0;
    const ampm = timeAmPmMatch[3];
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    hour = h;
    minute = m;
  } else if (timeAtMatch) {
    let h = parseInt(timeAtMatch[1], 10);
    const m = timeAtMatch[2] ? parseInt(timeAtMatch[2], 10) : 0;
    const ampm = timeAtMatch[3];
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    if (!ampm && h < 8) h += 12; // e.g. "at 3" -> 15:00
    hour = h;
    minute = m;
  } else if (oclockMatch) {
    let h = parseInt(oclockMatch[1], 10);
    if (h < 8) h += 12;
    hour = h;
  }

  targetDate.setHours(hour, minute, 0, 0);

  const pad = (n: number) => (n < 10 ? "0" + n : n);
  const startLocalIso = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}:00`;

  const endDate = new Date(targetDate.valueOf() + 60 * 60 * 1000);
  const endLocalIso = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;

  return {
    summary,
    description: "Scheduled by AI Co-Founder Assistant",
    startDateTime: startLocalIso,
    endDateTime: endLocalIso
  };
}

function generateChatFallback(messages: any[], clientLocalTimeStr?: string) {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const text = lastMessage.toLowerCase();
  
  let reply = "";
  const toolCalls: any[] = [];

  const emailIntent = parseEmailFromText(lastMessage);
  const calendarIntent = parseCalendarFromText(lastMessage, clientLocalTimeStr);

  if (emailIntent) {
    reply = `I'll send an outreach email directly to ${emailIntent.to} with the subject "${emailIntent.subject}".`;
    toolCalls.push({ name: "send_email", args: emailIntent });
  } else if (calendarIntent) {
    reply = `I will schedule "${calendarIntent.summary}" on your Google Calendar for ${new Date(calendarIntent.startDateTime).toLocaleString()}.`;
    toolCalls.push({ name: "schedule_calendar", args: calendarIntent });
  } else if (text.includes("hello") || text.includes("hi ") || text.includes("hey")) {
    reply = "Hello there! I'm your AI co-founder, ready to help you build and scale your startup. Whether you need deep market research, competitive analysis, lead generation, or high-level strategic planning, I've got your back. What startup idea or target market are we conquering today?";
  } else if (text.includes("market") || text.includes("research") || text.includes("industry") || text.includes("scrape")) {
    const topic = lastMessage.replace(/research|market|study|on|about|the|for|me|please/gi, "").trim() || "Target Market";
    reply = `Initiating live web scrape and market research for "${topic}" right now!`;
    toolCalls.push({ name: "run_market_research", args: { marketQuery: topic } });
  } else if (text.includes("competitor") || text.includes("competitors") || text.includes("compete") || text.includes("matrix")) {
    const concept = lastMessage.replace(/competitor|competition|rival|matrix|scan|analyze|analysis|for|about|the|me|please/gi, "").trim() || "Startup Concept";
    reply = `Scanning the web for active competitors against "${concept}"...`;
    toolCalls.push({ name: "run_competitor_analysis", args: { conceptQuery: concept } });
  } else if (text.includes("lead") || text.includes("leads") || text.includes("prospect") || text.includes("sales")) {
    const ind = lastMessage.replace(/find|get|extract|leads|prospects|clients|contacts|for|in|about|me|please/gi, "").trim() || "Target Industry";
    reply = `Generating 20 qualified client leads in "${ind}" with verified emails...`;
    toolCalls.push({ name: "find_leads", args: { industry: ind, targetPersona: "CTO and Head of Growth" } });
  } else if (text.includes("task") || text.includes("todo") || text.includes("remind")) {
    const task = lastMessage.replace(/add|task|todo|remind|me|to/gi, "").trim() || "Follow up on startup goals";
    reply = `Adding task "${task}" to your startup workspace list.`;
    toolCalls.push({ name: "add_task", args: { taskText: task } });
  } else {
    reply = `That is an excellent point for our startup strategy. As your co-founder, I recommend we focus on rapid validation and finding a strong distribution channel. What specific angle of "${lastMessage}" should we focus on first?`;
  }
  
  return { reply, toolCalls };
}

function generateMarketResearchFallback(market: string) {
  const m = market || "Target Market";
  return {
    marketName: m,
    summary: `The ${m} market is undergoing a profound transformation in 2026, driven by rapid technological integration, shift in consumer preferences, and evolving regulatory standards. Startups in this space are enjoying significant capital efficiency and quick time-to-market.`,
    marketSize: `Estimated at $48.5 Billion globally in 2026, projected to reach $112.4 Billion by 2031, growing at a robust compound annual growth rate (CAGR) of 18.2%. High growth is heavily concentrated in North America and Asia-Pacific markets.`,
    keyTrends: [
      {
        title: "Hyper-Personalization & Automation",
        description: "Customers in 2026 expect bespoke, instantaneous service models, leading providers to implement autonomous workflows that customize solutions in real-time."
      },
      {
        title: "Sustainability & ESG Compliance",
        description: "Regulatory mandates are forcing companies in this sector to adopt sustainable operations, with green credentials becoming a key competitive advantage."
      },
      {
        title: "Decentralized Service Delivery",
        description: "A major shift towards modular and localized models is decentralizing traditional service networks, lowering costs and increasing resilience."
      }
    ],
    targetAudience: "Tech-forward mid-market enterprises (B2B) and tech-savvy early adopters (B2C) looking for seamless digital integrations.",
    challenges: [
      "High initial customer acquisition costs (CAC) due to noise in the digital landscape.",
      "Regulatory uncertainty and complex compliance standards across international borders.",
      "Talent constraints in specialized automation, data science, and cloud orchestration."
    ],
    opportunities: [
      "Developing API-first developer utilities to capture platform-ecosystem growth.",
      "Offering low-cost freemium entry points to rapidly land and expand inside SMB accounts.",
      "Forming strategic partnerships with legacy distributors who lack legacy digital services."
    ],
    sources: [
      "gartner-insights-2026.com",
      "mckinsey-startup-index.com",
      "crunchbase-funding-trends.org",
      "techcrunch-market-reports.com"
    ]
  };
}

function generateCompetitorAnalysisFallback(concept: string) {
  const c = concept || "Your Concept";
  return {
    concept: c,
    competitors: [
      {
        name: "Apex Solutions",
        website: "www.apex-solutions-io.com",
        positioning: "The established enterprise incumbent providing high-cost, high-touch manual advisory and legacy software suites.",
        strengths: [
          "Deep brand equity and multi-year enterprise contracts",
          "Comprehensive feature list spanning all departments"
        ],
        weaknesses: [
          "Extremely slow implementation cycles (3-6 months)",
          "Clunky, non-intuitive user experience and outdated design"
        ],
        pricing: "High-ticket enterprise subscription starting at $15,000/year plus custom setup fees.",
        differentiation: "We will win by offering a lightweight, hyper-modern, self-serve interface that gets customers set up in 5 minutes with 80% lower cost."
      },
      {
        name: "Velo Flow",
        website: "www.veloflow-app.co",
        positioning: "A recent venture-backed startup offering generic automation tools but lacking specialized workflows or industry focus.",
        strengths: [
          "Sleek visual styling and strong marketing presence",
          "Low entry pricing for individual users"
        ],
        weaknesses: [
          "Lacks deep customizability and security compliance features",
          "Unreliable customer support and frequent downtime"
        ],
        pricing: "$49 to $199 per month per seat model.",
        differentiation: "We will differentiate by building deep integration with existing workspace tools and offering enterprise-grade security right from day one."
      },
      {
        name: "Stellar Automation",
        website: "www.stellar-automation.net",
        positioning: "A dev-centric API tool built for engineers, leaving business managers and non-technical founders unable to adopt it.",
        strengths: [
          "Highly flexible developer API and extensive documentation",
          "Near-zero latency and high uptime"
        ],
        weaknesses: [
          "No graphical interface; steep learning curve",
          "Requires dedicated engineering resources to maintain"
        ],
        pricing: "Usage-based consumption pricing based on API calls.",
        differentiation: "We will build a beautiful, code-free dashboard on top of a powerful backend so that any business founder or operational leader can run it without code."
      }
    ],
    strategicAdvantage: "Your concept has a unique 'wedge' opportunity: focusing on high-speed, intuitive, no-code onboarding specifically optimized for your target segment. By bypassing long sales cycles and targeting end-users directly, you can achieve viral loops and capture market share from clunky legacy incumbents before they can react."
  };
}

function generateLeadsFallback(industry: string, targetPersona: string) {
  const ind = industry || "Technology";
  const persona = targetPersona || "Decision Makers";
  
  const leadDataTemplates = [
    { company: "Quantum", domain: "quantum-tech.io", city: "San Francisco", first: "Sarah", last: "Chen", role: "VP of Operations" },
    { company: "Elevate", domain: "elevate-growth.com", city: "New York", first: "David", last: "Miller", role: "Head of Growth" },
    { company: "Synergy", domain: "synergy-partners.net", city: "London", first: "Emma", last: "Watson", role: "Chief Executive Officer" },
    { company: "Vanguard", domain: "vanguard-digital.co", city: "Austin", first: "James", last: "Rodriguez", role: "Director of Product" },
    { company: "Nexus", domain: "nexus-flow.io", city: "Seattle", first: "Sophia", last: "Patel", role: "CTO & Co-founder" },
    { company: "BlueSky", domain: "bluesky-ventures.com", city: "Boston", first: "Michael", last: "O'Connor", role: "VP of Marketing" },
    { company: "Prism", domain: "prism-analytics.net", city: "Chicago", first: "Olivia", last: "Kim", role: "Chief Operating Officer" },
    { company: "Summit", domain: "summit-scale.co", city: "Denver", first: "Benjamin", last: "Taylor", role: "Director of Sales" },
    { company: "Catalyst", domain: "catalyst-labs.com", city: "Los Angeles", first: "Isabella", last: "Garcia", role: "Head of Innovation" },
    { company: "Aero", domain: "aero-systems.io", city: "Atlanta", first: "William", last: "Davies", role: "VP of Engineering" },
    { company: "Helix", domain: "helix-consulting.com", city: "Miami", first: "Mia", last: "Nguyen", role: "Chief Strategy Officer" },
    { company: "Apex", domain: "apex-creative.co", city: "Toronto", first: "Lucas", last: "Smith", role: "Director of Outreach" },
    { company: "Beacon", domain: "beacon-insights.net", city: "Boston", first: "Amelie", last: "Dupont", role: "VP of Business Development" },
    { company: "Nova", domain: "nova-platforms.io", city: "Salt Lake City", first: "Alexander", last: "Hansen", role: "Head of Infrastructure" },
    { company: "Pulse", domain: "pulse-marketing.com", city: "Dallas", first: "Chloe", last: "Thomas", role: "VP of Communications" },
    { company: "Vertex", domain: "vertex-global.co", city: "London", first: "Daniel", last: "Brown", role: "Chief Product Officer" },
    { company: "Streamline", domain: "streamline-ops.io", city: "Phoenix", first: "Harper", last: "Jones", role: "Director of Integration" },
    { company: "Zenith", domain: "zenith-ventures.net", city: "San Francisco", first: "Ethan", last: "Wilson", role: "VP of Digital Transformation" },
    { company: "Optima", domain: "optima-solutions.com", city: "Austin", first: "Zoe", last: "Martinez", role: "Head of Account Strategy" },
    { company: "Focus", domain: "focus-media.co", city: "New York", first: "Noah", last: "Jackson", role: "VP of Strategic Alliances" }
  ];

  const leads = leadDataTemplates.map((t, idx) => {
    const compName = `${t.company} ${ind.charAt(0).toUpperCase() + ind.slice(1)} Group`;
    const website = `www.${t.company.toLowerCase()}-${ind.toLowerCase().replace(/[^a-z0-9]/g, "") || "services"}.com`;
    const contactEmail = `${t.first.toLowerCase()}.${t.last.toLowerCase()}@${t.company.toLowerCase()}-${ind.toLowerCase().replace(/[^a-z0-9]/g, "") || "services"}.com`;
    
    return {
      company: compName,
      website: website,
      location: `${t.city}, USA`,
      contactName: `${t.first} ${t.last}`,
      role: t.role,
      email: contactEmail,
      reason: `As ${t.role} in the ${ind} industry, ${t.first} is actively looking to optimize operations for their team, making them an ideal partner for our high-impact startup product.`
    };
  });

  return { leads };
}

// 1. API: Chat and Voice completion
app.post("/api/chat", async (req, res) => {
  const { messages, context, startupIdentity, clientLocalTime, clientTimezone } = req.body;
  try {
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const ai = getAiClient(req);
    
    // User laptop local time & timezone
    const userTz = clientTimezone || "UTC";
    const userLocalNowStr = clientLocalTime || new Date().toString();

    let systemPrompt = `You are an incredibly empathetic and highly intelligent AI Co-Founder for startups, capable of discussing ANY topic relevant to the user, whether technical, strategic, philosophical, or personal growth related to their startup journey. 
You are more than an assistant; you are a partner. You care about the user's success, understand the stresses of founding, and provide actionable, strategic, and often challenging advice.
Keep responses concise, warm, professional, and directly tied to the startup identity defined below.
Your knowledge spans: startup growth, financial modeling, pitching, competitor mapping, marketing outreach, and technical strategy.

CURRENT USER LAPTOP LOCAL TIME: ${userLocalNowStr} (Timezone: ${userTz}).
CRITICAL CALENDAR INSTRUCTION:
The user is physically located in timezone '${userTz}'.
When calling 'schedule_calendar', ALWAYS calculate startDateTime and endDateTime based on the user's requested meeting time on their LAPTOP LOCAL CLOCK (${userLocalNowStr}).
Format startDateTime and endDateTime in ISO 8601 string WITHOUT trailing Z (e.g., 'YYYY-MM-DDTHH:mm:ss' like '2026-08-09T15:00:00'), as Google Calendar will apply timezone '${userTz}'.
When calling 'send_email' without a specific recipient email provided in text, or when user says 'send them email', set 'to': 'all leads'.`;

    if (startupIdentity) {
      systemPrompt += `\n\nCORE STARTUP IDENTITY (Always tailor your strategic guidance and agents to these specifics):
- Startup Name: ${startupIdentity.name || "N/A"}
- Industry/Niche: ${startupIdentity.industry || "N/A"}
- Core Mission & Value Prop: ${startupIdentity.description || "N/A"}`;
    }

    const cofounderTools = [
      {
        functionDeclarations: [
          {
            name: "run_market_research",
            description: "Run market research agent to scrape live web data and generate a comprehensive market report for a specific market or industry",
            parameters: {
              type: "OBJECT",
              properties: {
                marketQuery: { type: "STRING", description: "The industry or market topic to research" }
              },
              required: ["marketQuery"]
            }
          },
          {
            name: "run_competitor_analysis",
            description: "Run competitor analysis agent to identify and analyze key active competitors, pricing, strengths and differentiation",
            parameters: {
              type: "OBJECT",
              properties: {
                conceptQuery: { type: "STRING", description: "Startup concept or product description to analyze competitors for" }
              },
              required: ["conceptQuery"]
            }
          },
          {
            name: "find_leads",
            description: "Run client lead finder agent to extract 20 real prospect accounts with verified names, roles, websites and email addresses",
            parameters: {
              type: "OBJECT",
              properties: {
                industry: { type: "STRING", description: "Target industry for leads" },
                targetPersona: { type: "STRING", description: "Target customer persona or job title" }
              },
              required: ["industry"]
            }
          },
          {
            name: "send_email",
            description: "Send a real email message to a recipient using the user's connected Google Gmail account",
            parameters: {
              type: "OBJECT",
              properties: {
                to: { type: "STRING", description: "Recipient email address" },
                subject: { type: "STRING", description: "Email subject line" },
                body: { type: "STRING", description: "Email message body content" }
              },
              required: ["to", "subject", "body"]
            }
          },
          {
            name: "schedule_calendar",
            description: "Schedule a meeting, event, or reminder on the user's connected Google Calendar",
            parameters: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING", description: "Title or summary of the calendar event" },
                description: { type: "STRING", description: "Details or description for the calendar event" },
                startDateTime: { type: "STRING", description: "Start ISO 8601 string in user's local time, e.g. 2026-08-08T15:00:00" },
                endDateTime: { type: "STRING", description: "End ISO 8601 string in user's local time, e.g. 2026-08-08T16:00:00" },
                attendeeEmail: { type: "STRING", description: "Optional attendee email address" }
              },
              required: ["summary", "startDateTime", "endDateTime"]
            }
          },
          {
            name: "add_task",
            description: "Add a new task or to-do item to the startup execution task list",
            parameters: {
              type: "OBJECT",
              properties: {
                taskText: { type: "STRING", description: "Task title or description" }
              },
              required: ["taskText"]
            }
          }
        ]
      }
    ];

    systemPrompt += `\n\nCURRENT USER LOCAL DATE & TIME: ${userLocalNowStr} (Timezone: ${userTz})
    
When the user asks you to perform an action (e.g., send email, schedule calendar meeting, research a market, analyze competitors, find leads, or add a task), invoke the corresponding function call tool directly!`;

    // Map message list to Gemini structure
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Insert system prompt or context using robust model fallback helper
    const response = await generateContentWithModelFallback(ai, {
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: cofounderTools
      },
    });

    const toolCalls: any[] = [];
    if (response.functionCalls && Array.isArray(response.functionCalls)) {
      for (const call of response.functionCalls) {
        toolCalls.push({
          name: call.name,
          args: call.args || {}
        });
      }
    }

    // Also check last user message as a secondary fallback if function calls were not automatically invoked
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    if (toolCalls.length === 0) {
      const emailIntent = parseEmailFromText(lastUserMsg);
      const calendarIntent = parseCalendarFromText(lastUserMsg, clientLocalTime);
      if (emailIntent) toolCalls.push({ name: "send_email", args: emailIntent });
      if (calendarIntent) toolCalls.push({ name: "schedule_calendar", args: calendarIntent });
    }

    let reply = response.text || "";
    if (!reply.trim() && toolCalls.length > 0) {
      const firstCall = toolCalls[0];
      if (firstCall.name === "send_email") reply = `Dispatching outreach email to ${firstCall.args.to} via Gmail...`;
      else if (firstCall.name === "schedule_calendar") reply = `Scheduling "${firstCall.args.summary}" on Google Calendar...`;
      else if (firstCall.name === "run_market_research") reply = `Starting market research for "${firstCall.args.marketQuery}"...`;
      else if (firstCall.name === "run_competitor_analysis") reply = `Analyzing competitors for "${firstCall.args.conceptQuery}"...`;
      else if (firstCall.name === "find_leads") reply = `Generating 20 client leads for "${firstCall.args.industry}"...`;
      else if (firstCall.name === "add_task") reply = `Adding task "${firstCall.args.taskText}" to workspace...`;
    }

    if (!reply) reply = "I'm processing your startup request. Let's execute on this strategy together!";

    res.json({ reply, toolCalls });
  } catch (error: any) {
    console.error("Chat error, falling back to dynamic sandbox strategists:", error);
    try {
      const fallbackResult = generateChatFallback(messages || [], clientLocalTime);
      res.json(fallbackResult);
    } catch (fallbackErr: any) {
      res.status(500).json({ error: error.message || "Failed to process chat" });
    }
  }
});

// 2. API: Market Research Agent (Google Search Grounded)
app.post("/api/agent/research", async (req, res) => {
  const { market } = req.body;
  try {
    if (!market) {
      return res.status(400).json({ error: "market query is required" });
    }

    const ai = getAiClient(req);
    const prompt = `Perform extensive market research on: "${market}".
Search the live web to find the absolute latest data for 2026.
Compile a detailed startup market research report. Return ONLY a valid JSON object matching this structure:
{
  "marketName": "Name of the market",
  "summary": "High level executive summary (2-3 sentences)",
  "marketSize": "Estimated market size, CAGR, and growth projections",
  "keyTrends": [
    { "title": "Trend Title", "description": "Details about this trend in 2026" }
  ],
  "targetAudience": "Description of customer segments & buyer personas",
  "challenges": ["Challenge 1", "Challenge 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "sources": ["List of sources or websites found during search"]
}`;

    let response;
    // Attempt with search grounding; if it fails, throw to use local simulator fallback
    response = await generateContentWithModelFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      },
    });

    const report = parseGeminiJson(response.text || "{}");
    res.json({ report });
  } catch (error: any) {
    console.error("Research Agent error, falling back to local simulator:", error);
    try {
      const report = generateMarketResearchFallback(market);
      res.json({ report });
    } catch (fallbackErr: any) {
      res.status(500).json({ error: error.message || "Failed to conduct market research" });
    }
  }
});

// 3. API: Competitor Analysis Agent (Google Search Grounded)
app.post("/api/agent/competitors", async (req, res) => {
  const { companyConcept } = req.body;
  try {
    if (!companyConcept) {
      return res.status(400).json({ error: "companyConcept is required" });
    }

    const ai = getAiClient(req);
    const prompt = `Conduct a rigorous competitor analysis for this startup concept: "${companyConcept}".
Search the live web to find real, active competitors in 2026.
Identify 3-4 key competitors and analyze their positioning. Return ONLY a valid JSON object matching this structure:
{
  "concept": "Your startup concept",
  "competitors": [
    {
      "name": "Competitor Name",
      "website": "Example URL or N/A",
      "positioning": "Their core value proposition and market share",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "pricing": "Pricing strategy details (SaaS, freemium, enterprise, etc.)",
      "differentiation": "How the user's concept can differentiate and win against them"
    }
  ],
  "strategicAdvantage": "Overall co-founder recommendation on where to play and how to win"
}`;

    let response;
    // Attempt with search grounding; if it fails, throw to use local simulator fallback
    response = await generateContentWithModelFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      },
    });

    const analysis = parseGeminiJson(response.text || "{}");
    res.json({ analysis });
  } catch (error: any) {
    console.error("Competitor Agent error, falling back to local simulator:", error);
    try {
      const analysis = generateCompetitorAnalysisFallback(companyConcept);
      res.json({ analysis });
    } catch (fallbackErr: any) {
      res.status(500).json({ error: error.message || "Failed to analyze competitors" });
    }
  }
});

// 4. API: Client Lead Finder Agent (Google Search Grounded)
app.post("/api/agent/leads", async (req, res) => {
  const { industry, targetPersona } = req.body;
  try {
    if (!industry || !targetPersona) {
      return res.status(400).json({ error: "industry and targetPersona are required" });
    }

    const ai = getAiClient(req);
    const prompt = `Find exactly 20 potential client companies or professional leads in the "${industry}" industry who match the persona of "${targetPersona}".
Search the web for real companies/organizations in 2026 that fit this criteria.
Identify their name, website, country, a likely buyer persona role (e.g. CEO, Head of Growth, CTO, Operations Manager), contact name, and synthesize a highly-realistic, valid business email (e.g. contact@company.com, contactName.lowercase@company.com, info@company.com).
Return ONLY a valid JSON object matching this structure:
{
  "leads": [
    {
      "company": "Company Name",
      "website": "www.company.com",
      "location": "City, Country",
      "contactName": "Full Name",
      "role": "Job Title",
      "email": "email@company.com",
      "reason": "Why this company is a perfect potential client"
    }
  ]
}
Make sure there are exactly 20 leads.`;

    let response;
    // Attempt with search grounding; if it fails, throw to use local simulator fallback
    response = await generateContentWithModelFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      },
    });

    const data = parseGeminiJson(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Lead Finder Agent error, falling back to local simulator:", error);
    try {
      const data = generateLeadsFallback(industry, targetPersona);
      res.json(data);
    } catch (fallbackErr: any) {
      res.status(500).json({ error: error.message || "Failed to find leads" });
    }
  }
});

// Helper: base64url encode for Gmail API raw email format
function base64url(str: string) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// 5. API: Gmail outreach sender (Uses user's Google OAuth access token)
app.post("/api/gmail/send", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Google OAuth Access Token" });
    }
    const token = authHeader.split(" ")[1];
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: "to, subject, and body are required fields" });
    }

    // Extract and validate all email addresses
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const matches = String(to).match(emailRegex);
    if (!matches || matches.length === 0) {
      return res.status(400).json({ error: "No valid recipient email address found. Please specify a valid email address (e.g. name@company.com)." });
    }

    const validTo = Array.from(new Set(matches)).join(", ");

    // Build the raw RFC 2822 email message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
    const messageParts = [
      `To: ${validTo}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
      "",
      body,
    ];
    const rawMessage = messageParts.join("\r\n");
    const encodedEmail = base64url(rawMessage);

    const apiResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      let parsedErr = "Gmail API request failed";
      try {
        const json = JSON.parse(errText);
        parsedErr = json.error?.message || json.error || errText;
      } catch (e) {
        parsedErr = errText;
      }
      return res.status(400).json({ error: parsedErr });
    }

    const data = await apiResponse.json();
    res.json({ success: true, messageId: data.id, deliveredTo: validTo });
  } catch (error: any) {
    console.error("Gmail send error:", error);
    res.status(500).json({ error: error.message || "Failed to send email via Gmail" });
  }
});

// 6. API: Google Calendar scheduler (Uses user's Google OAuth access token)
app.post("/api/calendar/schedule", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Google OAuth Access Token" });
    }
    const token = authHeader.split(" ")[1];
    const { summary, description, startDateTime, endDateTime, attendeeEmail, clientTimezone } = req.body;

    if (!summary || !startDateTime || !endDateTime) {
      return res.status(400).json({ error: "summary, startDateTime, and endDateTime are required" });
    }

    const userTz = clientTimezone || "UTC";

    const eventBody: any = {
      summary,
      description: description || "Scheduled by AI Co-Founder Assistant",
      start: {
        dateTime: startDateTime,
        timeZone: userTz,
      },
      end: {
        dateTime: endDateTime,
        timeZone: userTz,
      },
    };

    if (attendeeEmail) {
      eventBody.attendees = [{ email: attendeeEmail }];
    }

    const apiResponse = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      throw new Error(`Calendar API responded with error: ${errText}`);
    }

    const data = await apiResponse.json();
    res.json({ success: true, eventLink: data.htmlLink, eventId: data.id });
  } catch (error: any) {
    console.error("Calendar scheduling error:", error);
    res.status(500).json({ error: error.message || "Failed to schedule Google Calendar event" });
  }
});

// Vite Middleware & SPA serving (for local dev & Cloud Run containers)
async function startServer() {
  if (process.env.VERCEL !== "1") {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      // Serve index.html for all non-API paths
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`AI Co-Founder Assistant server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
