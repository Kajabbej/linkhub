import React from "react";

interface LogoProps {
  id?: string;
  className?: string;
  size?: number;
  showText?: boolean;
  theme?: "light" | "dark" | "default";
}

export function Logo({
  id,
  className = "",
  size = 32,
  showText = true,
  theme = "default",
}: LogoProps) {
  // Determine color theme classes
  const textClass =
    theme === "light"
      ? "text-white"
      : theme === "dark"
      ? "text-slate-900"
      : "text-slate-900 dark:text-white";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Premium Gradient Logo Icon */}
      <svg
        id={id}
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transform-gpu hover:scale-105 transition-transform duration-300"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" /> {/* Indigo-600 */}
            <stop offset="100%" stopColor="#EC4899" /> {/* Pink-500 */}
          </linearGradient>
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Double-loop chain linking design */}
        <path
          d="M11 21C8.23858 21 6 18.7614 6 16C6 13.2386 8.23858 11 11 11H14C14.5523 11 15 11.4477 15 12C15 12.5523 14.5523 13 14 13H11C9.34315 13 8 14.3431 8 16C8 17.6569 9.34315 19 11 19H14C14.5523 19 15 19.4477 15 20C15 20.5523 14.5523 21 14 21H11Z"
          fill="url(#logo-gradient)"
        />
        <rect
          x="12"
          y="14.5"
          width="8"
          height="3"
          rx="1.5"
          fill="url(#logo-gradient)"
        />
        <path
          d="M21 11C23.7614 11 26 13.2386 26 16C26 18.7614 23.7614 21 21 21H18C17.4477 21 17 20.5523 17 20C17 19.4477 17.4477 19 18 19H21C22.6569 19 24 17.6569 24 16C24 14.3431 22.6569 13 21 13H18C17.4477 13 17 12.5523 17 12C17 11.4477 17.4477 11 18 11H21Z"
          fill="url(#logo-gradient)"
        />
      </svg>

      {/* Brand Text */}
      {showText && (
        <span
          className={`font-black text-xl tracking-tight ${textClass}`}
          style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
        >
          Link<span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">Hub</span>
        </span>
      )}
    </div>
  );
}
