'use client';

import React from 'react';
import SportsReviewLogo, { SportsReviewIcon } from '@/components/common/SportsReviewLogo';

export type UserRole = 'admin' | 'tenant';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface SideNavBarProps {
  role: UserRole;
  currentView?: string;
  onViewChange?: (viewId: string) => void;
  onRoleToggle?: () => void;
  onDeployClick?: () => void;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'nodes', label: 'Network Nodes', icon: 'dns' },
  { id: 'billing', label: 'Faturamento & Consumo', icon: 'payments' },
  { id: 'provision', label: 'Provisionar Infra', icon: 'build' },
];

export const TENANT_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Painel de Transmissão', icon: 'switch_video' },
  { id: 'cameras', label: 'Câmeras ao Vivo', icon: 'videocam' },
  { id: 'replays', label: 'Últimos Replays', icon: 'movie' },
];

export default function SideNavBar({
  role,
  currentView = role === 'admin' ? 'nodes' : 'dashboard',
  onViewChange,
  onRoleToggle,
  onDeployClick,
}: SideNavBarProps) {
  const items = role === 'admin' ? ADMIN_NAV_ITEMS : TENANT_NAV_ITEMS;

  return (
    <aside
      id="sideNav"
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 pt-6 pb-5 px-3 z-40 bg-slate-900 border-r border-slate-800"
    >
      {/* Header / Role Selector */}
      <div
        id="sideNavRoleSwitcher"
        onClick={onRoleToggle}
        className="mb-8 p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex justify-between items-center cursor-pointer group hover:border-orange-500/50 transition-all shadow-md"
        title="Clique para alternar perfil (Admin / Tenant)"
      >
        <div className="space-y-1.5">
          <SportsReviewLogo variant="compact" size="xs" />
          <p className="text-[11px] text-slate-400 font-medium pl-0.5" id="roleLabel">
            Perfil: <span className="text-orange-400 font-semibold">{role === 'admin' ? 'Super Admin' : 'Dono da Quadra'}</span>
          </p>
        </div>
        <button
          type="button"
          aria-label="Alternar papel"
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:text-orange-500 group-hover:bg-slate-700 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-col flex-1 h-full" id="sideNavLinks" aria-label="Menu Principal">
        <ul className="flex flex-col gap-1.5 flex-1">
          {items.map((item) => {
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  id={`nav-item-${item.id}`}
                  onClick={() => onViewChange?.(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all text-left ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-500 border-l-4 border-orange-500 pl-2.5 font-bold shadow-[inset_0_0_12px_rgba(249,115,22,0.08)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border-l-4 border-transparent pl-2.5'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive ? 'text-orange-500 icon-fill' : 'text-slate-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer Actions */}
        {role === 'admin' && (
          <div className="mt-auto pt-4 border-t border-slate-800/80">
            <button
              type="button"
              id="btnDeployNewNode"
              onClick={onDeployClick}
              className="w-full py-2.5 px-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Deploy New Node
            </button>
          </div>
        )}

        {role === 'tenant' && (
          <div className="mt-auto pt-4 border-t border-slate-800/80">
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-300">Arena Paranaguá</span>
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Edge: node-pr-112 (Standby)</p>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
