import React from "react";
import { Feather, Sparkles, Heart } from "lucide-react";

interface HumanLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function HumanLogo({ size = "md", showText = true, className = "" }: HumanLogoProps) {
  const symbolSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12"
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Handcrafted Unique Human Artisan Emblem */}
      <div className={`relative shrink-0 ${symbolSizes[size]} flex items-center justify-center group`}>
        {/* Soft background glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/30 to-teal-500/20 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
        
        {/* Organic Hand-Drawn Emblem Badge */}
        <div className="relative w-full h-full rounded-2xl bg-stone-900 border border-stone-800/80 shadow-inner flex items-center justify-center overflow-hidden">
          {/* Custom Hand-Drawn SVG Signature Loop Icon */}
          <svg className="w-full h-full p-1.5 text-emerald-400" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="artisanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="brushStroke" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            
            {/* Organic hand-crafted fingerprint / fluid infinity curve */}
            <path
              d="M 28 58 C 18 42, 32 22, 50 22 C 72 22, 82 42, 68 62 C 55 80, 25 75, 20 52 C 16 35, 30 15, 52 15 C 80 15, 88 38, 82 62 C 76 82, 48 88, 32 82"
              stroke="url(#artisanGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-90"
            />
            {/* Hand-drawn accent dot / fingerprint core */}
            <circle cx="50" cy="48" r="4" fill="url(#brushStroke)" />
            <path d="M 42 42 Q 50 36 58 42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>

          {/* Micro feather craft badge */}
          <div className="absolute bottom-0.5 right-0.5 bg-amber-500/90 text-stone-950 p-0.5 rounded-full shadow-sm">
            <Feather className="w-2.5 h-2.5" />
          </div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center space-x-2">
            <span className="text-base font-black tracking-tight text-stone-900 dark:text-stone-100 font-serif italic">
              CoFounder<span className="text-emerald-600 dark:text-emerald-400 not-italic font-sans font-extrabold">.AI</span>
            </span>
            <span className="text-[9px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 flex items-center shadow-xs">
              <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-500 fill-amber-400" /> Human-Crafted
            </span>
          </div>
          <div className="flex items-center space-x-1 mt-0.5">
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold tracking-wider uppercase">
              Handcrafted AI Partner & Advisor
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

