import React from 'react';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  permissionKey: string;
  features?: Record<string, boolean>; // Replaces context for now, passed from parent
  fallback?: React.ReactNode;
  hideOnDeny?: boolean;
  children: React.ReactNode;
  role?: string;
}

export default function PermissionGuard({
  permissionKey,
  features = {},
  fallback,
  hideOnDeny = false,
  children,
  role = 'tenant'
}: PermissionGuardProps) {
  // Admin always has access to everything for previewing
  if (role === 'admin') {
    return <>{children}</>;
  }

  // Deny only if explicitly set to false
  const isExplicitlyDenied = features && features[permissionKey] === false;
  if (!isExplicitlyDenied) {
    return <>{children}</>;
  }

  if (hideOnDeny) return null;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-slate-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-200 font-['Sora']">Acesso Restrito</h2>
      <p className="text-slate-400 mt-2 text-sm max-w-md">
        A permissão <strong>{permissionKey}</strong> não está habilitada no seu plano atual. Entre em contato com o NOC para solicitar o upgrade.
      </p>
    </div>
  );
}
