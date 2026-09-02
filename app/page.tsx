'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { UserRole } from '@/components/layout/SideNavBar';
import NodesView from '@/components/admin/NodesView';
import BillingView from '@/components/admin/BillingView';
import ProvisionView from '@/components/admin/ProvisionView';
import TenantDashboardView from '@/components/tenant/TenantDashboardView';
import CamerasView from '@/components/tenant/CamerasView';
import TenantReplaysView from '@/components/tenant/TenantReplaysView';
import PlayerPortal from '@/components/player/PlayerPortal';
import LoginPage from '@/components/auth/LoginPage';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole | 'player'>('admin');
  const [currentView, setCurrentView] = useState<string>('nodes');

  const handleLoginSuccess = (selectedRole: 'admin' | 'tenant') => {
    setRole(selectedRole);
    setCurrentView(selectedRole === 'admin' ? 'nodes' : 'dashboard');
    setIsAuthenticated(true);
  };

  const handleRoleToggle = () => {
    if (role === 'admin') {
      setRole('tenant');
      setCurrentView('dashboard');
    } else {
      setRole('admin');
      setCurrentView('nodes');
    }
  };

  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId);
  };

  // Se não estiver autenticado, exibe a tela de login como Gatekeeper B2B
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (role === 'player') {
    return <PlayerPortal onBackToDashboard={() => setRole('admin')} />;
  }

  return (
    <AppShell
      role={role as UserRole}
      currentView={currentView}
      onViewChange={handleViewChange}
      onRoleToggle={handleRoleToggle}
      onDeployClick={() => setCurrentView('provision')}
      onOpenPlayerPortal={() => setRole('player')}
    >
      <div className="max-w-7xl mx-auto">
        {/* SUPER ADMIN VIEWS */}
        {role === 'admin' && currentView === 'nodes' && (
          <NodesView onDeployClick={() => setCurrentView('provision')} />
        )}

        {role === 'admin' && currentView === 'billing' && (
          <BillingView />
        )}

        {role === 'admin' && currentView === 'provision' && (
          <ProvisionView />
        )}

        {/* TENANT (ARENA OWNER) VIEWS */}
        {role === 'tenant' && currentView === 'dashboard' && (
          <TenantDashboardView />
        )}

        {role === 'tenant' && currentView === 'cameras' && (
          <CamerasView />
        )}

        {role === 'tenant' && currentView === 'replays' && (
          <TenantReplaysView />
        )}
      </div>
    </AppShell>
  );
}
