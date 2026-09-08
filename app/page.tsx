'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { UserRole } from '@/components/layout/SideNavBar';
import NodesView from '@/components/admin/NodesView';
import BillingView from '@/components/admin/BillingView';
import ProvisionView from '@/components/admin/ProvisionView';
import PermissionsManagerView from '@/components/admin/PermissionsManagerView';
import TenantDashboardView from '@/components/tenant/TenantDashboardView';
import CamerasView from '@/components/tenant/CamerasView';
import TenantReplaysView from '@/components/tenant/TenantReplaysView';
import CourtsManagementView from '@/components/tenant/CourtsManagementView';
import OverlayBrandingView from '@/components/tenant/OverlayBrandingView';
import QrCodesView from '@/components/admin/QrCodesView';
import PlayerPortal from '@/components/player/PlayerPortal';
import LoginPage from '@/components/auth/LoginPage';

import PermissionGuard from '@/components/auth/PermissionGuard';
import { DeviceLayoutProvider } from '@/contexts/DeviceLayoutContext';

export default function HomePage() {
  const [role, setRole] = useState<UserRole | 'player'>('admin');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('nodes');
  const [features, setFeatures] = useState<Record<string, boolean> | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('courtId') || params.has('arenaId') || params.get('view') === 'player') {
        const timer = setTimeout(() => {
          setRole('player');
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (role === 'tenant') {
      fetch('/api/arenas')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (mounted && Array.isArray(data) && data.length > 0) {
            setFeatures(data[0].features);
          }
        })
        .catch(err => {
          if (mounted) {
            console.warn("Informacoes indisponiveis");
          }
        });
    }
    return () => { mounted = false; };
  }, [role]);

  // Handle setting to undefined when role changes to something else
  useEffect(() => {
    if (role !== 'tenant' && features !== undefined) {
      setTimeout(() => setFeatures(undefined), 0);
    }
  }, [role, features]);

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

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setCurrentView('nodes');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId);
  };

  // Se o usuário estiver no papel de atleta (ex: scan do QR Code do alambrado)
  if (role === 'player') {
    return <PlayerPortal onBackToDashboard={() => { setRole('admin'); setCurrentView('nodes'); }} />;
  }

  // Se não estiver autenticado e não for atleta, exibe a tela de login como Gatekeeper B2B
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <DeviceLayoutProvider>
      <AppShell
        role={role as UserRole}
        currentView={currentView}
        features={features}
        onViewChange={handleViewChange}
        onRoleToggle={handleRoleToggle}
        onRoleChange={handleRoleChange}
        onDeployClick={() => setCurrentView('provision')}
        onOpenPlayerPortal={() => setRole('player')}
      >
        <div className="max-w-7xl mx-auto">
          {/* NOC & ADMIN VIEWS */}
          {currentView === 'nodes' && (
            <NodesView onDeployClick={() => setCurrentView('provision')} />
          )}

          {currentView === 'billing' && (
            <BillingView />
          )}

          {currentView === 'provision' && (
            <ProvisionView />
          )}

          {currentView === 'permissions' && (
            <PermissionsManagerView />
          )}

          {/* TENANT & SHARED VIEWS */}
          {currentView === 'dashboard' && (
            <TenantDashboardView features={features || {}} role={role as UserRole} />
          )}

          {currentView === 'courts' && <CourtsManagementView />}

          {currentView === 'branding' && (
            <PermissionGuard permissionKey="branding.access" features={features} role={role}>
              <OverlayBrandingView />
            </PermissionGuard>
          )}

          {currentView === 'qrcodes' && (
            <PermissionGuard permissionKey="totems.generate" features={features} role={role}>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-1 sm:p-2 shadow-xl">
                <QrCodesView embedded />
              </div>
            </PermissionGuard>
          )}

          {currentView === 'cameras' && (
            <PermissionGuard permissionKey="cameras.access" features={features} role={role}>
              <CamerasView />
            </PermissionGuard>
          )}

          {currentView === 'replays' && (
            <TenantReplaysView />
          )}
        </div>
      </AppShell>
    </DeviceLayoutProvider>
  );
}
