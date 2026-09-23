'use client';

import React from 'react';
import { UserRole } from './SideNavBar';
import SportsReviewLogo from '@/components/common/SportsReviewLogo';
import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';
import {
  ArrowLeftRight,
  Smartphone,
  Bell,
  Menu,
  X,
} from 'lucide-react';

export interface TopNavBarProps {
  role: UserRole;
  onRoleToggle?: () => void;
  onOpenPlayerPortal?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export default function TopNavBar({
  role,
  onRoleToggle,
  onOpenPlayerPortal,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}: TopNavBarProps) {
  const { effectiveLayout } = useDeviceLayout();

  return (
    <header
      id="topNavBar"
      className="flex justify-between items-center w-full px-3 sm:px-4 md:px-6 h-14 bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shrink-0"
    >
      {/* Left side: Mobile menu toggle, brand on mobile & status badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {effectiveLayout === 'mobile' && onToggleMobileMenu && (
          <button
            type="button"
            id="btnMobileMenuToggle"
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        {effectiveLayout === 'mobile' && (
          <div className="flex items-center gap-1.5">
            <SportsReviewLogo variant="compact" size="xs" />
          </div>
        )}

        {/* System Status Indicator */}
        {effectiveLayout === 'desktop' && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 text-[11px] font-medium">
              Status do Sistema: <span className="text-emerald-400 font-semibold">Online</span>
            </span>
          </div>
        )}
      </div>

      {/* Right side: Quick switches, notifications, settings, avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        {/* Role toggle button for testing/demo - Visible on mobile as compact pill */}
        <button
          type="button"
          id="btnToggleRoleTop"
          onClick={onRoleToggle}
          className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
          title="Alternar entre visão Admin e Tenant"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span className="text-[11px] font-semibold">
            {role === 'admin' ? 'Admin' : 'Arena'}
          </span>
        </button>

        {/* Shortcut to Player Portal view */}
        {onOpenPlayerPortal && (
          <button
            type="button"
            id="btnGoPlayerPortal"
            onClick={onOpenPlayerPortal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-xs text-orange-400 font-semibold transition-colors cursor-pointer"
            title="Acessar visão do atleta (gravações de lances no celular)"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-[11px]">Portal Jogador</span>
          </button>
        )}

        {/* Notifications Icon */}
        <button
          type="button"
          id="btnNotifications"
          aria-label="Notificações"
          className="relative p-2 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500"></span>
        </button>

        {/* User Avatar */}
        <div
          id="userProfileChip"
          className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-800 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-500 font-['Sora']">
            {role === 'admin' ? 'AD' : 'OP'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">
              {role === 'admin' ? 'Central de Controle' : 'Mesa Paranaguá'}
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
