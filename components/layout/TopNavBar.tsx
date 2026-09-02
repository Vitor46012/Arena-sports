'use client';

import React from 'react';
import { UserRole } from './SideNavBar';
import SportsReviewLogo from '@/components/common/SportsReviewLogo';

interface TopNavBarProps {
  role: UserRole;
  onRoleToggle?: () => void;
  onOpenPlayerPortal?: () => void;
}

export default function TopNavBar({
  role,
  onRoleToggle,
  onOpenPlayerPortal,
}: TopNavBarProps) {
  return (
    <header
      id="topNavBar"
      className="flex justify-between items-center w-full px-4 md:px-6 h-14 bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shrink-0"
    >
      {/* Left side: Brand on mobile & status badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 md:hidden">
          <SportsReviewLogo variant="compact" size="xs" />
        </div>

        {/* Edge MQTT Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            MQTT Broker: <span className="text-emerald-400 font-semibold">Conectado (TLS)</span>
          </span>
        </div>
      </div>

      {/* Right side: Quick switches, notifications, settings, avatar */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Role toggle button for testing/demo */}
        <button
          type="button"
          id="btnToggleRoleTop"
          onClick={onRoleToggle}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition-colors"
          title="Alternar entre visão Admin e Tenant"
        >
          <span className="material-symbols-outlined text-[16px] text-orange-500">
            sync_alt
          </span>
          <span className="text-[11px] font-semibold">
            Modo: {role === 'admin' ? 'Admin' : 'Tenant'}
          </span>
        </button>

        {/* Shortcut to Player Portal view */}
        {onOpenPlayerPortal && (
          <button
            type="button"
            id="btnGoPlayerPortal"
            onClick={onOpenPlayerPortal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-xs text-orange-400 font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              smartphone
            </span>
            <span className="hidden sm:inline text-[11px]">Portal Jogador (B2C)</span>
          </button>
        )}

        {/* Notifications Icon */}
        <button
          type="button"
          id="btnNotifications"
          aria-label="Notificações"
          className="relative p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500"></span>
        </button>

        {/* Settings Icon */}
        <button
          type="button"
          id="btnSettings"
          aria-label="Configurações do Sistema"
          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>

        {/* User Avatar */}
        <div
          id="userProfileChip"
          className="flex items-center gap-2 pl-2 border-l border-slate-800 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-500 font-['Sora']">
            {role === 'admin' ? 'AD' : 'OP'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">
              {role === 'admin' ? 'NOC Central' : 'Mesa Paranaguá'}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight capitalize">
              {role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
