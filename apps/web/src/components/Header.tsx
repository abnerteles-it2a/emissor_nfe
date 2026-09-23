'use client';

import React from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Search,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from './theme/ThemeContext';
import { useEmissionModal } from './modals/EmissionModalContext';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { openEmissionModal } = useEmissionModal();

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm transition-colors">
      {/* Left: Quick search */}
      <div className="relative hidden md:block">
        <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar nota ou comando (Ctrl + K)..."
          className="w-64 bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
        />
      </div>

      {/* Right: Environment & Actions */}
      <div className="flex items-center gap-3">
        {/* Environment Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          Ambiente: Homologação
        </span>

        {/* Alternador de Modo Claro / Escuro */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Alternar para Modo Escuro' : 'Alternar para Modo Claro'}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-700 hover:text-teal-600" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300" />
          )}
        </button>

        {/* Nova Emissão CTA que abre o Modal Inteligente */}
        <button
          type="button"
          onClick={() => openEmissionModal('NFE')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm shadow-teal-600/20"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Emitir Nota</span>
        </button>

        {/* Settings */}
        <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800">
          <Link
            href="/settings"
            title="Configurações Fiscais"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
