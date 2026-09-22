'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Sparkles,
  Search,
  LogOut,
  Radio,
  FileCheck
} from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';

export const Header: React.FC = () => {
  const [isPrivacy, setIsPrivacy] = useState(false);

  return (
    <div className="shrink-0 flex flex-col w-full">
      {/* 1. TOPBAR GLOBAL (48px - Idêntica ao Gestor Financeiro) */}
      <header className="omie-topbar px-4 sm:px-6 flex items-center justify-between relative z-30">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-white/90 uppercase tracking-widest hidden sm:inline drop-shadow-md">
            • by IT2A
          </span>
        </div>

        {/* Centro: WeatherWidget (São José do Rio Preto 22°C) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center">
          <WeatherWidget />
        </div>

        {/* Lado Direito: Configurações e Sair */}
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            title="Configurações Fiscais &amp; A1"
            className="text-white/80 hover:text-white transition-colors cursor-pointer drop-shadow-md"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <div
            className="flex items-center gap-2 pl-4 border-l border-white/20 cursor-pointer group drop-shadow-md"
            onClick={() => {
              if (window.confirm('Deseja encerrar a sessão fiscal?')) {
                window.location.reload();
              }
            }}
            title="Sair"
          >
            <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest group-hover:text-[#0D9488] transition-colors hidden sm:inline">
              Sair
            </span>
            <LogOut className="w-4 h-4 text-white/80 group-hover:text-[#0D9488] transition-colors" />
          </div>
        </div>
      </header>

      {/* 2. BANNER OPERACIONAL ÂMBAR (Ambiente Fiscal) */}
      <div className="bg-amber-500 text-slate-950 py-1.5 px-4 text-center text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm">
        <span className="uppercase font-black text-slate-950 bg-amber-400 px-1.5 py-0.5 rounded text-[10px]">
          SEFAZ SP:
        </span>
        <span>
          Ambiente de Homologação ativo com Certificado A1 SyngularID (Válido até 06/03/2027).
        </span>
        <Link href="/settings" className="underline font-black hover:text-slate-800 ml-1">
          Ver detalhes
        </Link>
      </div>

      {/* 3. BARRA SECUNDÁRIA DE FERRAMENTAS FISCAIS */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Pílulas Fiscais */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-800 text-white border border-slate-700">
            DASHBOARD FISCAL
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0D9488]/20 text-[#0D9488] border border-[#0D9488]/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            HOMOLOGAÇÃO
          </span>
          <div className="hidden lg:flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-800">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              EMISSÕES:
            </span>
            <span className="text-[10px] font-bold text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">
              2 / 10.000
            </span>
          </div>
        </div>

        {/* Ações e Controles Fiscais */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Ctrl + K */}
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60 transition-all text-xs font-medium"
            title="Buscar comandos fiscais (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline text-[11px] font-semibold">Comandos</span>
            <kbd className="hidden lg:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
              ctrl k
            </kbd>
          </button>

          {/* AI Sparkles - Inteligência Fiscal */}
          <button
            title="Assistente Tributário &amp; Regras Fiscais"
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
          </button>

          {/* Privacy Eye */}
          <button
            onClick={() => setIsPrivacy(!isPrivacy)}
            title={isPrivacy ? 'Mostrar Valores' : 'Ocultar Valores'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isPrivacy ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Theme toggle */}
          <button
            title="Alternar Tema"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Sun className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
