'use client';

import React from 'react';

interface SportsReviewLogoProps {
  variant?: 'icon' | 'full' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export function SportsReviewIcon({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-label="Sports Review Logo"
    >
      <defs>
        <linearGradient id="logoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00A3FF" />
          <stop offset="50%" stopColor="#0066CC" />
          <stop offset="100%" stopColor="#003D82" />
        </linearGradient>

        <linearGradient id="logoOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9900" />
          <stop offset="50%" stopColor="#FF6600" />
          <stop offset="100%" stopColor="#E63900" />
        </linearGradient>

        <linearGradient id="logoRunnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0088FF" />
          <stop offset="50%" stopColor="#0055B3" />
          <stop offset="100%" stopColor="#003366" />
        </linearGradient>

        <linearGradient id="logoHighlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFAA00" />
          <stop offset="100%" stopColor="#FF5500" />
        </linearGradient>
      </defs>

      {/* Outer Blue Swoop Frame */}
      <path
        d="M 330 75 C 200 45, 65 140, 65 265 C 65 375, 150 440, 260 440 C 175 425, 115 365, 115 270 C 115 170, 205 100, 310 115 C 355 122, 385 145, 400 175 C 410 140, 380 95, 330 75 Z"
        fill="url(#logoBlueGrad)"
      />
      <path
        d="M 370 120 C 435 180, 445 285, 395 365 L 435 345 C 475 260, 455 160, 370 120 Z"
        fill="url(#logoBlueGrad)"
      />
      <path
        d="M 140 375 C 195 435, 290 445, 370 395 C 300 415, 210 395, 155 350 Z"
        fill="url(#logoBlueGrad)"
      />

      {/* Inner Orange Swoop with Upward Arrow */}
      <path
        d="M 190 160 C 240 100, 340 105, 395 165 C 425 200, 435 250, 420 300 C 400 240, 370 185, 315 155 C 265 130, 215 140, 190 160 Z"
        fill="url(#logoOrangeGrad)"
      />
      <path
        d="M 155 385 C 195 440, 280 475, 360 450 C 410 430, 440 390, 440 390 L 440 435 L 480 340 L 375 365 L 405 385 C 370 415, 295 425, 225 390 C 185 370, 165 350, 155 385 Z"
        fill="url(#logoOrangeGrad)"
      />

      {/* REC Indicator Dot & Text */}
      <circle cx="135" cy="275" r="12" fill="#FF2E2E" />
      <text
        x="152"
        y="283"
        fill="#FF2E2E"
        fontFamily="'Sora', 'Arial Black', sans-serif"
        fontSize="22"
        fontWeight="900"
        letterSpacing="1"
      >
        REC
      </text>

      {/* Play Triangle */}
      <polygon points="340,260 340,290 368,275" fill="url(#logoBlueGrad)" />

      {/* Athlete / Runner Figure */}
      <circle cx="295" cy="180" r="16" fill="url(#logoRunnerGrad)" />
      <path
        d="M 210 245 C 200 230, 215 210, 230 220 C 240 230, 235 255, 220 255 C 210 255, 205 250, 210 245 Z"
        fill="url(#logoRunnerGrad)"
      />
      <path d="M 214 225 Q 224 238 223 250" stroke="#FFAA00" strokeWidth="2.5" fill="none" />
      <path
        d="M 285 198 C 270 205, 255 215, 238 220 C 230 223, 232 235, 242 238 C 255 240, 268 232, 275 235 L 260 270 C 250 285, 240 295, 230 300 C 245 308, 275 295, 288 280 C 298 268, 305 250, 305 230 C 305 215, 298 202, 285 198 Z"
        fill="url(#logoRunnerGrad)"
      />
      <path
        d="M 300 215 C 315 220, 328 230, 340 225 C 345 222, 348 215, 340 210 C 330 205, 315 208, 300 205 Z"
        fill="url(#logoRunnerGrad)"
      />
      <path
        d="M 338 210 L 348 200 L 353 205 L 348 215 L 354 218 L 346 226 Z"
        fill="url(#logoRunnerGrad)"
      />

      {/* Highlights */}
      <path
        d="M 252 238 C 260 255, 258 275, 245 290 C 248 282, 258 265, 252 248 Z"
        fill="url(#logoHighlightGrad)"
      />
      <path
        d="M 280 205 C 295 218, 298 238, 290 255 C 298 240, 295 220, 285 208 Z"
        fill="url(#logoHighlightGrad)"
      />

      {/* Legs */}
      <path
        d="M 255 275 C 245 295, 220 330, 195 345 C 188 350, 180 355, 175 375 C 172 385, 178 392, 190 380 C 200 370, 205 350, 220 335 C 238 318, 260 295, 270 280 Z"
        fill="url(#logoRunnerGrad)"
      />
      <path
        d="M 280 270 C 295 285, 315 305, 335 320 C 342 325, 340 338, 330 338 C 318 338, 305 320, 290 305 C 280 295, 275 282, 280 270 Z"
        fill="url(#logoRunnerGrad)"
      />
    </svg>
  );
}

export default function SportsReviewLogo({
  variant = 'compact',
  size = 'md',
  showTagline = false,
  className = '',
  onClick,
}: SportsReviewLogoProps) {
  const sizeMap = {
    xs: { icon: 'w-8 h-8', sports: 'text-2xl', review: 'text-[10px] tracking-[0.4em]', tag: 'text-[7px]', space: 'gap-2' },
    sm: { icon: 'w-10 h-10', sports: 'text-3xl', review: 'text-[12px] tracking-[0.45em]', tag: 'text-[8px]', space: 'gap-3' },
    md: { icon: 'w-14 h-14', sports: 'text-[40px]', review: 'text-[16px] tracking-[0.45em]', tag: 'text-[10px]', space: 'gap-4' },
    lg: { icon: 'w-20 h-20', sports: 'text-6xl', review: 'text-[24px] tracking-[0.45em]', tag: 'text-[12px]', space: 'gap-5' },
    xl: { icon: 'w-28 h-28', sports: 'text-[80px]', review: 'text-[32px] tracking-[0.45em]', tag: 'text-[14px]', space: 'gap-6' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'icon') {
    return (
      <div onClick={onClick} className={`inline-flex items-center ${className}`}>
        <SportsReviewIcon className={currentSize.icon} />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${currentSize.space} select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <SportsReviewIcon className={currentSize.icon} />

      <div className="flex flex-col justify-center leading-none">
        {/* SPORTS */}
        <span
          className={`font-['Sora'] font-black tracking-tight text-[#0f386b] dark:text-blue-500 leading-none ${currentSize.sports}`}
        >
          SPORTS
        </span>

        {/* Orange Divider Bar */}
        <div className="w-full h-[3px] bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 my-1 rounded-full" />

        {/* REVIEW */}
        <span
          className={`font-['Sora'] font-black text-orange-500 leading-none pl-1 ${currentSize.review}`}
        >
          REVIEW
        </span>

        {/* Optional Tagline */}
        {showTagline && (
          <span
            className={`font-sans font-bold tracking-widest text-slate-400 uppercase mt-2 text-center ${currentSize.tag}`}
          >
            Seus melhores momentos em alta definição
          </span>
        )}
      </div>
    </div>
  );
}
