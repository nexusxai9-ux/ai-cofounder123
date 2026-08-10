import React from "react";
import { motion } from "motion/react";

interface AvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
}

export default function Avatar({ isSpeaking, isListening, isThinking }: AvatarProps) {
  const wavesCount = 12;

  return (
    <div className="relative w-[280px] sm:w-[320px] h-[280px] sm:h-[320px] mx-auto flex flex-col items-center justify-center select-none">
      
      {/* Background Aura / Deep Ambient Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: isSpeaking ? [1, 1.15, 0.95, 1.05, 1] : isListening ? [1, 1.1, 1] : isThinking ? [1, 1.05, 1] : [1, 1.02, 1],
            opacity: isSpeaking ? 0.75 : isListening ? 0.6 : isThinking ? 0.45 : 0.3,
          }}
          transition={{
            duration: isSpeaking ? 1.2 : isListening ? 1.5 : isThinking ? 2 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`w-72 h-72 rounded-full filter blur-3xl transition-colors duration-700 ${
            isSpeaking 
              ? "bg-emerald-500/40" 
              : isListening 
              ? "bg-teal-500/40" 
              : isThinking 
              ? "bg-indigo-500/40" 
              : "bg-emerald-400/20"
          }`}
        />
      </div>

      {/* Dynamic Voice Waves Radiating Outwards */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={
              isSpeaking
                ? { scale: [0.6, 1.8], opacity: [0.8, 0] }
                : isListening
                ? { scale: [0.7, 1.4], opacity: [0.4, 0] }
                : { scale: [0.8, 1.1], opacity: [0.15, 0] }
            }
            transition={{
              duration: isSpeaking ? 1.5 : isListening ? 2 : 3,
              repeat: Infinity,
              delay: i * (isSpeaking ? 0.35 : 0.6),
              ease: "easeOut",
            }}
            className={`absolute w-60 h-60 rounded-full border-2 border-dashed ${
              isSpeaking
                ? "border-emerald-500/30"
                : isListening
                ? "border-teal-500/30"
                : "border-slate-400/10"
            }`}
          />
        ))}
      </div>

      {/* Main Interactive Avatar Frame */}
      <div className="relative w-64 h-64 flex items-center justify-center z-10">
        {/* Outer Tech Ring with Rotation */}
        <motion.svg 
          animate={{ rotate: 360 }}
          transition={{ duration: isThinking ? 15 : 35, repeat: Infinity, ease: "linear" }}
          className="absolute w-72 h-72 pointer-events-none" 
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke={isSpeaking ? "#10b981" : isListening ? "#14b8a6" : isThinking ? "#6366f1" : "rgba(148, 163, 184, 0.25)"}
            strokeWidth="0.8"
            strokeDasharray={isSpeaking ? "8 4 12 4" : isListening ? "4 8 16 4" : "5 5"}
            className="transition-colors duration-500"
          />
        </motion.svg>

        {/* Floating human silhouette card */}
        <motion.div
          animate={{
            y: isSpeaking ? [0, -4, 2, -2, 0] : [0, -2, 0],
          }}
          transition={{
            duration: isSpeaking ? 2.5 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-56 h-56 rounded-full bg-slate-900 border-2 border-slate-700/50 shadow-2xl flex items-center justify-center overflow-hidden"
        >
          {/* Internal Grid Matrix Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
          
          {/* Radial Spotlight */}
          <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_75%)] transition-colors duration-700 ${
            isSpeaking ? "bg-emerald-500/10" : isListening ? "bg-teal-500/10" : "bg-transparent"
          }`} />

          {/* High Fidelity Human Vector Graphics */}
          <svg className="w-48 h-48 z-10" viewBox="0 0 200 200" fill="none">
            <defs>
              {/* Shading Gradients */}
              <radialGradient id="faceGrad" cx="50%" cy="40%" r="60%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="#ffe6d5" />
                <stop offset="60%" stopColor="#fcd3b6" />
                <stop offset="100%" stopColor="#e29b6f" />
              </radialGradient>
              
              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c2d12" /> {/* Warm Brown */}
                <stop offset="45%" stopColor="#9a3412" />
                <stop offset="100%" stopColor="#c2410c" />
              </linearGradient>

              <linearGradient id="hairHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f97316" /> {/* Warm Orange Highlight */}
                <stop offset="100%" stopColor="#9a3412" />
              </linearGradient>

              <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" /> {/* Softer Grey Suit */}
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              <linearGradient id="collarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              <linearGradient id="irisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 1. Shoulders and Blazer / Tech Suit */}
            <g id="torso">
              <path
                d="M25,180 C25,145 60,125 100,125 C140,125 175,145 175,180"
                fill="url(#suitGrad)"
                stroke="#475569"
                strokeWidth="2"
              />
              <path
                d="M75,125 L100,155 L125,125 Z"
                fill="#0f172a"
                stroke={isSpeaking ? "#10b981" : isListening ? "#14b8a6" : isThinking ? "#6366f1" : "#1e293b"}
                strokeWidth="2.5"
                className="transition-colors duration-500"
              />
              <circle cx="50" cy="148" r="4" fill={isSpeaking ? "#10b981" : isListening ? "#14b8a6" : "#475569"} filter="url(#glow)" />
              <line x1="56" y1="148" x2="68" y2="148" stroke="#334155" strokeWidth="1.5" />
            </g>

            {/* 2. Neck */}
            <g id="neck">
              <path
                d="M85,95 L85,128 C85,128 92,135 100,135 C108,135 115,128 115,128 L115,95 Z"
                fill="#f7be97"
                stroke="#e29b6f"
                strokeWidth="1.5"
              />
              <path d="M85,95 C92,106 108,106 115,95 C115,95 108,100 100,100 C92,100 85,95 85,95 Z" fill="#e29b6f" opacity="0.4" />
            </g>

            {/* 3. Hair Back/Base */}
            <path d="M55,75 C55,40 145,40 145,75 L145,98 L55,98 Z" fill="url(#hairGrad)" />

            {/* 4. Head and Face structure */}
            <g id="head">
              <path
                d="M60,65 C60,35 140,35 140,65 C140,95 135,115 100,115 C65,115 60,95 60,65 Z"
                fill="url(#faceGrad)"
                stroke="#df9062"
                strokeWidth="1"
              />
              <ellipse cx="76" cy="88" rx="8" ry="4" fill="#fc8181" opacity="0.35" />
              <ellipse cx="124" cy="88" rx="8" ry="4" fill="#fc8181" opacity="0.35" />

              <g id="eyes">
                <ellipse cx="82" cy="74" rx="10" ry="7" fill="#ffffff" stroke="#e29b6f" strokeWidth="1" />
                <ellipse cx="118" cy="74" rx="10" ry="7" fill="#ffffff" stroke="#e29b6f" strokeWidth="1" />

                <motion.g animate={isThinking ? { x: [0, -1.5, 1.5, 0] } : {}} transition={{ duration: 3, repeat: Infinity }}>
                  <circle cx="82" cy="74" r="5" fill="url(#irisGrad)" />
                  <circle cx="82" cy="74" r="2.5" fill="#0f172a" />
                  <circle cx="80" cy="72" r="1.2" fill="#ffffff" />
                </motion.g>

                <motion.g animate={isThinking ? { x: [0, -1.5, 1.5, 0] } : {}} transition={{ duration: 3, repeat: Infinity }}>
                  <circle cx="118" cy="74" r="5" fill="url(#irisGrad)" />
                  <circle cx="118" cy="74" r="2.5" fill="#0f172a" />
                  <circle cx="116" cy="72" r="1.2" fill="#ffffff" />
                </motion.g>

                <motion.path d="M71,71 Q82,65 93,71" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <motion.path d="M107,71 Q118,65 129,71" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                <motion.rect x="70" y="65" width="15" height="16" fill="url(#faceGrad)" animate={{ scaleY: [0, 0, 1, 0, 0] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1] }} style={{ transformOrigin: "top", display: "block" }} />
                <motion.rect x="115" y="65" width="15" height="16" fill="url(#faceGrad)" animate={{ scaleY: [0, 0, 1, 0, 0] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1] }} style={{ transformOrigin: "top", display: "block" }} />
              </g>

              <g id="eyebrows">
                <motion.path d="M72,63 Q82,56 90,62" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" fill="none" animate={{ y: isListening ? -2.5 : isThinking ? -1 : 0, rotate: isThinking ? -3 : 0 }} />
                <motion.path d="M110,62 Q118,56 128,63" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" fill="none" animate={{ y: isListening ? -2.5 : isThinking ? -1 : 0, rotate: isThinking ? 3 : 0 }} />
              </g>

              <path d="M100,78 C100,78 97,83 100,85 C103,83 100,78 100,78" fill="#e29b6f" opacity="0.6" />

              <g id="mouth">
                {isSpeaking ? (
                  <motion.path d="M90,94 Q100,99 110,94" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="#be123c" animate={{ d: ["M92,94 Q100,98 108,94 Q100,108 92,94", "M93,95 Q100,103 107,95 Q100,96 93,95", "M91,93 Q100,106 109,93 Q100,100 91,93", "M92,95 Q100,97 108,95 Q100,102 92,95"] }} transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }} />
                ) : isListening ? (
                  <path d="M92,95 Q100,100 108,95" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                ) : (
                  <path d="M90,93 Q100,104 110,93" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
                )}
              </g>
            </g>

            <g id="hair-front">
              <path d="M56,65 C50,42 75,25 100,32 C125,25 150,42 144,65 C132,48 118,50 100,50 C82,50 68,48 56,65 Z" fill="url(#hairGrad)" />
              <path d="M68,36 C85,24 115,24 132,36" stroke="url(#hairHighlight)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              <path d="M80,30 C93,24 107,24 120,30" stroke="#10b981" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
            </g>

            <g id="headset">
              <rect x="52" y="55" width="10" height="25" rx="5" fill="#1e293b" stroke={isListening ? "#14b8a6" : isSpeaking ? "#10b981" : "#475569"} strokeWidth="2" />
              <circle cx="57" cy="67" r="2.5" fill={isListening ? "#14b8a6" : isSpeaking ? "#10b981" : "#64748b"} filter="url(#glow)" />
              <path d="M57,55 C57,25 143,25 143,55" fill="none" stroke="#334155" strokeWidth="2.5" />
              <motion.path d="M57,75 Q70,95 86,95" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <motion.circle cx="86" cy="95" r="3" fill={isSpeaking ? "#10b981" : isListening ? "#14b8a6" : "#475569"} filter="url(#glow)" animate={isSpeaking || isListening ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 1, repeat: Infinity }} />
            </g>
          </svg>

          {/* Core State-Border Lighting (Outer soft rings inside card) */}
          {isListening && (
            <motion.div
              animate={{ opacity: [0.3, 0.75, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-[3px] border-teal-400 pointer-events-none"
            />
          )}

          {isSpeaking && (
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-[3px] border-emerald-400 pointer-events-none"
            />
          )}

          {isThinking && (
            <motion.div
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-[3px] border-indigo-400 pointer-events-none"
            />
          )}
        </motion.div>
      </div>

      {/* Futuristic Soundwave Audio Frequency Bars beneath the avatar */}
      <div className="mt-5 flex items-center justify-center space-x-1 h-8 px-4 w-full max-w-xs bg-slate-900/80 rounded-full border border-slate-700/40 backdrop-blur-sm shadow-inner">
        {Array.from({ length: wavesCount }).map((_, idx) => {
          // generate random offsets for dynamic visualizer effect
          const randomDur = 0.4 + Math.random() * 0.5;
          const isCenter = idx >= 3 && idx <= 8;

          return (
            <motion.div
              key={idx}
              animate={
                isSpeaking
                  ? { height: isCenter ? [6, 24, 6] : [4, 16, 4] }
                  : isListening
                  ? { height: [4, 12, 4] }
                  : isThinking
                  ? { height: [2, 8, 2], opacity: [0.4, 1, 0.4] }
                  : { height: 3 }
              }
              transition={{
                duration: randomDur,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`w-1 rounded-full transition-colors duration-500 ${
                isSpeaking
                  ? "bg-emerald-400"
                  : isListening
                  ? "bg-teal-400 animate-pulse"
                  : isThinking
                  ? "bg-indigo-400"
                  : "bg-slate-700"
              }`}
            />
          );
        })}
      </div>

      {/* Interactive Subtitle / Communication Logs */}
      <div className="mt-4 text-center min-h-[24px]">
        {isListening ? (
          <span className="text-xs font-bold text-teal-500 tracking-wider uppercase animate-pulse">
            🎤 MICROPHONE ACTIVE • SPEAK NOW
          </span>
        ) : isThinking ? (
          <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase animate-pulse">
            ⚡ PARTNER THINKING...
          </span>
        ) : isSpeaking ? (
          <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase animate-pulse">
            🔊 SPEAKING TO YOU...
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500">
            Microphone always-on mode active. Speak anytime!
          </span>
        )}
      </div>
    </div>
  );
}

