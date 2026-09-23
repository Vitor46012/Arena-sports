'use client';

import React from 'react';
import Image from 'next/image';

interface SportsReviewLogoProps {
  variant?: 'icon' | 'full' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export function SportsReviewIcon({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <div className={`relative inline-block ${className} flex-shrink-0`}>
      <Image
        src="/logo-icon.svg"
        alt="Sports Review Icon"
        fill
        className="object-contain"
        referrerPolicy="no-referrer"
        priority
      />
    </div>
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
    xs: {
      height: 28,
      width: 76,
      iconClass: 'w-7 h-7',
      tag: 'text-[7px]',
    },
    sm: {
      height: 38,
      width: 103,
      iconClass: 'w-9 h-9',
      tag: 'text-[8px]',
    },
    md: {
      height: 50,
      width: 135,
      iconClass: 'w-12 h-12',
      tag: 'text-[10px]',
    },
    lg: {
      height: 70,
      width: 189,
      iconClass: 'w-18 h-18',
      tag: 'text-[12px]',
    },
    xl: {
      height: 94,
      width: 254,
      iconClass: 'w-24 h-24',
      tag: 'text-[14px]',
    },
  };

  const currentSize = sizeMap[size];

  if (variant === 'icon') {
    return (
      <div onClick={onClick} className={`inline-flex items-center ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        <SportsReviewIcon className={currentSize.iconClass} />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="relative inline-block" style={{ width: currentSize.width, height: currentSize.height }}>
        <Image
          src="/logo.svg"
          alt="Sports Review Logo"
          fill
          className="object-contain"
          referrerPolicy="no-referrer"
          priority
        />
      </div>

      {showTagline && (
        <span
          className={`font-sans font-bold tracking-widest text-slate-400 uppercase mt-1 text-center ${currentSize.tag}`}
        >
          Seus melhores momentos em alta definição
        </span>
      )}
    </div>
  );
}
