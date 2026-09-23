'use client';

import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from './AuthContext';

export const SubscriptionBadge: React.FC = () => {
  const { subscription } = useAuth();

  if (!subscription) return null;

  const isLimitNear = subscription.percentUsed > 80;

  return (
    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span className="truncate">{subscription.planName}</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
          Ativo
        </span>
      </div>

      <div>
        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
          <span>Consumo de notas:</span>
          <span className="font-semibold text-slate-200">
            {subscription.docsIssued.toLocaleString('pt-BR')} / {subscription.monthlyLimit.toLocaleString('pt-BR')}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isLimitNear ? 'bg-amber-500' : 'bg-teal-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, subscription.percentUsed))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
