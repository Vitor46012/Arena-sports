import React from 'react';
import { Lock } from 'lucide-react';

interface FeatureGuardProps {
  isAllowed: boolean;
  children: React.ReactNode;
}

export default function FeatureGuard({ isAllowed, children }: FeatureGuardProps) {
  if (isAllowed) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-slate-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-200 font-['Sora']">Módulo Não Habilitado</h2>
      <p className="text-slate-400 mt-2 text-sm max-w-md">
        Esta funcionalidade não está disponível no seu plano atual. Entre em contato com o administrador para realizar o upgrade.
      </p>
    </div>
  );
}
