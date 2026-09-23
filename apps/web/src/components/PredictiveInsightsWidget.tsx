'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Zap, ArrowUpRight, X, Radio } from 'lucide-react';

export const PredictiveInsightsWidget: React.FC = () => {
  const [horizon, setHorizon] = useState<'today' | '7days' | 'month'>('today');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-teal-500/25 p-4 sm:p-5 shadow-xl shadow-slate-950/40 animate-fadeIn space-y-3">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Top Header with icon and horizon selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 shadow-inner">
            <Radio className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">
                DIAGNÓSTICO FISCAL &amp; MENSAGERIA SEFAZ
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                Tempo Real
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Análise cruzada de autorizações SEFAZ, contingência e apuração tributária
            </p>
          </div>
        </div>

        {/* Horizon selector buttons */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 self-start sm:self-center">
          <button
            onClick={() => setHorizon('today')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              horizon === 'today'
                ? 'bg-[#0D9488] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setHorizon('7days')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              horizon === '7days'
                ? 'bg-[#0D9488] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Próximos 7 Dias
          </button>
          <button
            onClick={() => setHorizon('month')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              horizon === 'month'
                ? 'bg-[#0D9488] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mês Vigente
          </button>
        </div>
      </div>

      {/* Main Insight & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">
              Nenhuma rejeição fiscal ou pendência detectada para o período.
            </span>
          </div>
          <p className="text-xs text-slate-400">
            SEFAZ SP: <strong className="text-emerald-400">Operação Normal (cStat 107)</strong> • Nota Paulistana:{' '}
            <strong className="text-emerald-400">Online</strong> • Certificado A1 IT2A:{' '}
            <strong className="text-teal-400">Válido até 06/03/2027</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/documents"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Ver Documentos
          </Link>
          <Link
            href="/issue"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0D9488] hover:bg-teal-600 text-white flex items-center gap-1.5 shadow-md shadow-teal-900/30 transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Nova Emissão
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            title="Fechar diagnóstico"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
