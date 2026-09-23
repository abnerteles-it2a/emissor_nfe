'use client';

import React from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Search,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#020617]/90 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="font-bold text-slate-200 tracking-wide">IT2A Fiscal</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-400">Plataforma SaaS</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar nota ou comando (Ctrl + K)..."
            className="w-56 bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Environment Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          Ambiente: Homologação
        </span>

        {/* Nova Emissão CTA */}
        <Link
          href="/issue"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0D9488] text-white hover:bg-teal-600 transition-colors shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Emitir Nota
        </Link>

        {/* Settings & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <Link
            href="/settings"
            title="Configurações Fiscais"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              if (window.confirm('Deseja encerrar a sessão fiscal?')) {
                window.location.reload();
              }
            }}
            title="Sair"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
