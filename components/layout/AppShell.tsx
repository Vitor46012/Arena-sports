'use client';

import React from 'react';
import SideNavBar, { UserRole } from './SideNavBar';
import TopNavBar from './TopNavBar';

export interface AppShellProps {
  role: UserRole;
  currentView?: string;
  onViewChange?: (viewId: string) => void;
  onRoleToggle?: () => void;
  onDeployClick?: () => void;
  onOpenPlayerPortal?: () => void;
  children: React.ReactNode;
}

export default function AppShell({
  role,
  currentView,
  onViewChange,
  onRoleToggle,
  onDeployClick,
  onOpenPlayerPortal,
  children,
}: AppShellProps) {
  return (
    <div
      id="appShell"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden relative font-sans"
    >
      {/* Side Navigation for Desktop */}
      <SideNavBar
        role={role}
        currentView={currentView}
        onViewChange={onViewChange}
        onRoleToggle={onRoleToggle}
        onDeployClick={onDeployClick}
      />

      {/* Main Content Area */}
      <div
        id="mainContentWrapper"
        className="flex-1 flex flex-col md:ml-64 min-h-screen w-full relative overflow-hidden"
      >
        {/* Top Header Bar */}
        <TopNavBar
          role={role}
          onRoleToggle={onRoleToggle}
          onOpenPlayerPortal={onOpenPlayerPortal}
        />

        {/* Main Canvas / Children View Slot */}
        <main
          id="mainContent"
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 scroll-smooth"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
