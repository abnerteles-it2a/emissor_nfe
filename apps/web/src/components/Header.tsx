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
import { useAuth } from './auth/AuthContext';
import { KeyRound, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { openEmissionModal } = useEmissionModal();
  const { user, setShowPasswordChangeModal } = useAuth();

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

        {/* User Profile & Password Change Pill */}
        <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setShowPasswordChangeModal(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors text-left"
            title="Clique para alterar sua senha ou gerenciar perfil"
          >
            <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {user?.name || 'Abner Teles'}
              </span>
              <span className="block text-[9.5px] text-teal-600 dark:text-teal-400 font-medium leading-none">
                Admin IT2A
              </span>
            </div>
            {user?.mustChangePassword && (
              <span className="flex items-center gap-0.5 text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-1 py-0.5 rounded font-bold ml-1 animate-pulse">
                <KeyRound className="w-2.5 h-2.5" />
                Trocar Senha
              </span>
            )}
          </button>

          {/* Settings */}
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
