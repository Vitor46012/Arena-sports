'use client';

import React, { useState } from 'react';
import SideNavBar, { UserRole } from './SideNavBar';
import TopNavBar from './TopNavBar';
import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';
import {
  Server,
  CreditCard,
  Wrench,
  ShieldCheck,
  Video,
  LayoutGrid,
  Camera,
  Film,
  Menu,
} from 'lucide-react';

export interface AppShellProps {
  role: UserRole;
  currentView?: string;
  features?: Record<string, boolean>;
  onViewChange?: (viewId: string) => void;
  onRoleToggle?: () => void;
  onDeployClick?: () => void;
  onOpenPlayerPortal?: () => void;
  children: React.ReactNode;
}

export default function AppShell({
  role,
  currentView = role === 'admin' ? 'nodes' : 'dashboard',
  features,
  onViewChange,
  onRoleToggle,
  onDeployClick,
  onOpenPlayerPortal,
  children,
}: AppShellProps) {
  const { effectiveLayout } = useDeviceLayout();
  const isMobileLayout = effectiveLayout === 'mobile';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Itens primários para a barra de navegação inferior em smartphones
  const adminBottomTabs = [
    { id: 'nodes', label: 'Nodes', icon: Server },
    { id: 'billing', label: 'Faturas', icon: CreditCard },
    { id: 'provision', label: 'Deploy', icon: Wrench },
    { id: 'permissions', label: 'NOC', icon: ShieldCheck },
  ];

  const tenantBottomTabs = [
    { id: 'dashboard', label: 'Mesa', icon: Video },
    { id: 'courts', label: 'Quadras', icon: LayoutGrid },
    { id: 'cameras', label: 'Câmeras', icon: Camera },
    { id: 'replays', label: 'Replays', icon: Film },
  ];

  const bottomTabs = role === 'admin' ? adminBottomTabs : tenantBottomTabs;
  const isSecondaryViewActive = !bottomTabs.some((tab) => tab.id === currentView);

  return (
    <div
      id="appShell"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-x-hidden relative font-sans"
    >
      {/* Side Navigation for Desktop - Only shown when NOT forced into mobile layout */}
      {!isMobileLayout && (
        <SideNavBar
          role={role}
          currentView={currentView}
          features={features}
          onViewChange={onViewChange}
          onRoleToggle={onRoleToggle}
          onDeployClick={onDeployClick}
          onOpenPlayerPortal={onOpenPlayerPortal}
        />
      )}

      {/* Mobile Drawer Backdrop & Drawer Panel */}
      {isMobileLayout && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] h-full z-50 bg-slate-900 shadow-2xl border-r border-slate-800 animate-in slide-in-from-left duration-250 flex flex-col">
            <SideNavBar
              role={role}
              currentView={currentView}
              features={features}
              isMobile={true}
              onClose={() => setIsMobileMenuOpen(false)}
              onViewChange={(viewId) => {
                onViewChange?.(viewId);
                setIsMobileMenuOpen(false);
              }}
              onRoleToggle={onRoleToggle}
              onDeployClick={onDeployClick}
              onOpenPlayerPortal={onOpenPlayerPortal}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        id="mainContentWrapper"
        className={`flex-1 flex flex-col min-h-screen w-full relative overflow-x-hidden ${
          !isMobileLayout ? 'ml-72' : 'ml-0'
        }`}
      >
        {/* Top Header Bar */}
        <TopNavBar
          role={role}
          onRoleToggle={onRoleToggle}
          onOpenPlayerPortal={onOpenPlayerPortal}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Main Canvas / Children View Slot */}
        <main
          id="mainContent"
          className={`flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 scroll-smooth ${
            isMobileLayout ? 'pb-24' : 'pb-6'
          }`}
        >
          {children}
        </main>

        {/* Persistent Bottom Navigation Bar for Mobile Ergonomics - Only in Mobile Layout */}
        {isMobileLayout && (
          <nav
            id="mobileBottomNav"
            aria-label="Navegação móvel"
            className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 px-1.5 py-1 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
          >
            {bottomTabs.map((tab) => {
              const isActive = currentView === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`mobile-tab-${tab.id}`}
                  onClick={() => onViewChange?.(tab.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'text-orange-500 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 active:scale-95'
                  }`}
                >
                  <div
                    className={`p-1 rounded-lg transition-colors ${
                      isActive ? 'bg-orange-500/15 text-orange-500' : 'text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[62px]">
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* Botão "Mais" que abre o drawer completo com todas as telas e opções */}
            <button
              type="button"
              id="mobile-tab-more"
              onClick={() => setIsMobileMenuOpen(true)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded-xl transition-all cursor-pointer relative ${
                isSecondaryViewActive
                  ? 'text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors relative ${
                  isSecondaryViewActive ? 'bg-orange-500/15 text-orange-500' : 'text-slate-400'
                }`}
              >
                <Menu className="w-4 h-4" />
                {isSecondaryViewActive && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-slate-900" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[62px]">
                Mais
              </span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
