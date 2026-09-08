'use client';

import React from 'react';
import SportsReviewLogo from '@/components/common/SportsReviewLogo';
import {
  Shield,
  Trophy,
  Activity,
  Server,
  LayoutGrid,
  Tv,
  QrCode,
  CreditCard,
  Wrench, ShieldCheck,
  Video,
  Camera,
  Film,
  LucideIcon,
  X,
} from 'lucide-react';

export type UserRole = 'admin' | 'tenant';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface SideNavBarProps {
  role: UserRole;
  currentView?: string;
  features?: Record<string, boolean>;
  onViewChange?: (viewId: string) => void;
  onRoleToggle?: () => void;
  onDeployClick?: () => void;
  onOpenPlayerPortal?: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'nodes', label: 'Network Nodes', icon: Server },
  { id: 'billing', label: 'Faturamento & Consumo', icon: CreditCard },
  { id: 'provision', label: 'Provisionar Infra', icon: Wrench },
  { id: 'permissions', label: 'Permissões (NOC)', icon: ShieldCheck },
];

export const TENANT_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Painel de Transmissão', icon: Video },
  { id: 'courts', label: 'Gestão de Quadras', icon: LayoutGrid },
  { id: 'branding', label: 'Patrocinadores & OBS', icon: Tv },
  { id: 'qrcodes', label: 'Totens & QR Codes', icon: QrCode },
  { id: 'cameras', label: 'Câmeras ao Vivo', icon: Camera },
  { id: 'replays', label: 'Últimos Replays', icon: Film },
];

export default function SideNavBar({
  role,
  currentView = role === 'admin' ? 'nodes' : 'dashboard',
  features,
  onViewChange,
  onRoleToggle,
  onDeployClick,
  onOpenPlayerPortal,
  isMobile = false,
  onClose,
}: SideNavBarProps) {
  // Junção das telas exclusivas de admin + telas compartilhadas
  const sharedIds = ['courts', 'branding', 'qrcodes'];
  
  // Filter items based on features
  const filterByFeatures = (items: NavItem[]) => {
    // If admin, show all
    if (role === 'admin') return items;
    
    // If tenant and no features loaded yet, hide optional ones or show defaults
    if (!features) return items;
    
    return items.filter(item => {
      if (item.id === 'dashboard' && features['transmission.access'] === false) return false;
      if (item.id === 'branding' && features['branding.access'] === false) return false;
      if (item.id === 'qrcodes' && features['totems.generate'] === false) return false;
      if (item.id === 'cameras' && features['cameras.access'] === false) return false;
      if (item.id === 'courts' && features['courts.access'] === false) return false;
      return true;
    });
  };

  const sharedItems = filterByFeatures(TENANT_NAV_ITEMS.filter((item) => sharedIds.includes(item.id)));
  const tenantItems = filterByFeatures(TENANT_NAV_ITEMS);
  const items = role === 'admin' ? [...ADMIN_NAV_ITEMS, ...sharedItems] : tenantItems;

  const handleNavClick = (viewId: string) => {
    onViewChange?.(viewId);
    if (isMobile && onClose) onClose();
  };

  const handleRoleClick = (targetRole: UserRole) => {
    if (role !== targetRole && onRoleToggle) {
      onRoleToggle();
    }
    if (isMobile && onClose) onClose();
  };

  const handlePlayerPortalClick = () => {
    onOpenPlayerPortal?.();
    if (isMobile && onClose) onClose();
  };

  return (
    <aside
      id={isMobile ? 'sideNavMobile' : 'sideNav'}
      className={
        isMobile
          ? 'flex flex-col h-full w-full pt-4 pb-8 px-4 bg-slate-900 select-none overflow-y-auto'
          : 'flex flex-col fixed left-0 top-0 h-screen w-72 flex-shrink-0 pt-6 pb-5 px-4 z-40 bg-slate-900 border-r border-slate-800 select-none'
      }
    >
      {/* Brand Logo Header */}
      <div className="px-1 mb-5 flex items-center justify-between">
        <SportsReviewLogo variant="full" size="sm" />
        {isMobile && onClose && (
          <button
            type="button"
            id="btnCloseMobileDrawer"
            onClick={onClose}
            aria-label="Fechar menu"
            className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Seletor de Perfil (Administrador / Dono da Arena / Visão do Atleta) */}
      <div className="mb-6 space-y-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
          Perfil de Acesso
        </span>
        <div className="grid grid-cols-1 gap-1.5 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <button
            type="button"
            id={isMobile ? 'roleBtnAdminMobile' : 'roleBtnAdmin'}
            onClick={() => handleRoleClick('admin')}
            className={`flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              role === 'admin'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Administrador</span>
          </button>
          <button
            type="button"
            id={isMobile ? 'roleBtnTenantMobile' : 'roleBtnTenant'}
            onClick={() => handleRoleClick('tenant')}
            className={`flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              role === 'tenant'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Dono da Arena</span>
          </button>
          {onOpenPlayerPortal && (
            <button
              type="button"
              id={isMobile ? 'roleBtnPlayerMobile' : 'roleBtnPlayer'}
              onClick={handlePlayerPortalClick}
              className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-bold text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 border border-orange-500/30 transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">VISÃO DO ATLETA</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-col flex-1 h-full overflow-y-auto no-scrollbar" id={isMobile ? 'sideNavLinksMobile' : 'sideNavLinks'} aria-label="Menu Principal">
        <ul className="flex flex-col gap-1.5 flex-1">
          {items.map((item) => {
            const isActive = currentView === item.id;
            const ItemIcon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  id={`nav-item-${item.id}${isMobile ? '-mobile' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full group flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-lg transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-500 border-l-4 border-orange-500 pl-2.5 shadow-[inset_0_0_12px_rgba(249,115,22,0.08)]'
                      : 'hover:bg-slate-800/80 border-l-4 border-transparent pl-2.5'
                  }`}
                >
                  <ItemIcon
                    className={`w-5 h-5 min-w-[20px] transition-colors ${
                      isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-500'
                    }`}
                  />
                  <span className="ml-3 font-medium text-sm text-slate-300 whitespace-nowrap">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {role === 'tenant' && (
          <div className="mt-auto pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-200">Arena Paranaguá</span>
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Edge: node-pr-112 (Online)</p>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
