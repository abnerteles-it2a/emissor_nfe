'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  PlusCircle,
  Users,
  Radar,
  Archive,
  Settings,
  ChevronRight,
  Radio,
  ShieldCheck,
  Package,
  Truck,
  Building,
  Store,
  FileSpreadsheet
} from 'lucide-react';
import { useEmissionModal, EmissionDocType } from './modals/EmissionModalContext';
import { TenantSwitcher } from './auth/TenantSwitcher';
import { SubscriptionBadge } from './auth/SubscriptionBadge';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { openEmissionModal } = useEmissionModal();

  // Estados dos Flyouts
  const [activeFlyout, setActiveFlyout] = useState<'emission' | 'cadastros' | null>(null);
  const flyoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menu: 'emission' | 'cadastros') => {
    if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    setActiveFlyout(menu);
  };

  const handleMouseLeave = () => {
    flyoutTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 200);
  };

  const handleTriggerEmission = (type: EmissionDocType) => {
    setActiveFlyout(null);
    openEmissionModal(type);
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 text-slate-300 shadow-xl select-none">
      {/* Top Brand Section */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
          <div className="relative w-9 h-9 shrink-0">
            <Image
              src="/logo_white.png"
              alt="IT2A Enterprise"
              fill
              sizes="36px"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="block font-black text-white text-[13px] leading-tight truncate tracking-tight uppercase">
              EMISSOR FISCAL
            </span>
            <span className="block text-[8.5px] text-teal-400 font-extrabold truncate uppercase tracking-[0.14em]">
              IT2A ENTERPRISE
            </span>
          </div>
        </div>

        {/* Seletor de Empresa / Tenant Switcher para Contadores */}
        <div className="p-3 pb-1 border-b border-slate-800/80">
          <TenantSwitcher />
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 relative">
          {/* 1. Início */}
          <Link
            href="/"
            className={`w-full h-10 flex items-center px-3 gap-3 rounded-xl text-sm font-semibold transition-all ${
              pathname === '/'
                ? 'bg-teal-600/20 text-white border border-teal-500/30 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 text-teal-400" />
            <span>Início</span>
          </Link>

          {/* 2. Minhas Notas */}
          <Link
            href="/documents"
            className={`w-full h-10 flex items-center px-3 gap-3 rounded-xl text-sm font-semibold transition-all ${
              pathname === '/documents'
                ? 'bg-teal-600/20 text-white border border-teal-500/30 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Minhas Notas</span>
          </Link>

          {/* 3. Emissão de Notas (com Flyout Lateral) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('emission')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveFlyout(activeFlyout === 'emission' ? null : 'emission')}
              className={`w-full h-10 flex items-center justify-between px-3 rounded-xl text-sm font-semibold transition-all group ${
                activeFlyout === 'emission'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <PlusCircle className={`w-4 h-4 ${activeFlyout === 'emission' ? 'text-white' : 'text-teal-400'}`} />
                <span>Emissão de Notas</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  activeFlyout === 'emission' ? 'rotate-90 text-white' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
            </button>

            {/* Flyout Menu: Emissão */}
            {activeFlyout === 'emission' && (
              <div
                className="absolute left-full top-0 ml-2 w-64 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-fadeIn space-y-1 text-xs"
                onMouseEnter={() => handleMouseEnter('emission')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  SELECIONE O TIPO DE NOTA
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerEmission('NFE')}
                  className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <Building className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600">
                      NF-e Mercadorias (55)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Venda, remessa e devolução
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerEmission('NFCE')}
                  className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600">
                      NFC-e Consumidor (65)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Venda direta ao consumidor
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerEmission('NFSE')}
                  className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <FileSpreadsheet className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600">
                      NFS-e Serviços
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Padrão Paulistana &amp; Nacional
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerEmission('CTE')}
                  className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600">
                      CT-e Cargas (57)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Conhecimento de transporte
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 4. Cadastros (com Flyout Lateral) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('cadastros')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveFlyout(activeFlyout === 'cadastros' ? null : 'cadastros')}
              className={`w-full h-10 flex items-center justify-between px-3 rounded-xl text-sm font-semibold transition-all group ${
                activeFlyout === 'cadastros'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Cadastros</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  activeFlyout === 'cadastros' ? 'rotate-90 text-white' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
            </button>

            {/* Flyout Menu: Cadastros */}
            {activeFlyout === 'cadastros' && (
              <div
                className="absolute left-full top-0 ml-2 w-60 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-fadeIn space-y-1 text-xs"
                onMouseEnter={() => handleMouseEnter('cadastros')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  CADASTROS FISCAIS
                </div>

                <Link
                  href="/cadastros/clientes"
                  onClick={() => setActiveFlyout(null)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <Users className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>Clientes &amp; Tomadores</span>
                </Link>

                <Link
                  href="/cadastros/produtos"
                  onClick={() => setActiveFlyout(null)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Produtos &amp; Serviços</span>
                </Link>

                <Link
                  href="/cadastros/transportadoras"
                  onClick={() => setActiveFlyout(null)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Transportadoras</span>
                </Link>
              </div>
            )}
          </div>

          {/* 5. Radar DF-e */}
          <Link
            href="/radar"
            className={`w-full h-10 flex items-center px-3 gap-3 rounded-xl text-sm font-semibold transition-all ${
              pathname === '/radar'
                ? 'bg-teal-600/20 text-white border border-teal-500/30 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Radar className="w-4 h-4 text-amber-400" />
            <span>Radar DF-e</span>
          </Link>

          {/* 6. Fechamento Fiscal */}
          <Link
            href="/closing"
            className={`w-full h-10 flex items-center px-3 gap-3 rounded-xl text-sm font-semibold transition-all ${
              pathname === '/closing'
                ? 'bg-teal-600/20 text-white border border-teal-500/30 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4 text-indigo-400" />
            <span>Fechamento Fiscal</span>
          </Link>

          {/* 7. Configurações & A1 */}
          <Link
            href="/settings"
            className={`w-full h-10 flex items-center px-3 gap-3 rounded-xl text-sm font-semibold transition-all ${
              pathname === '/settings'
                ? 'bg-teal-600/20 text-white border border-teal-500/30 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Configurações &amp; A1</span>
          </Link>
        </nav>
      </div>

      {/* Monitoramento Fiscal & Subscriptions no Rodapé da Sidebar */}
      <div className="p-3 space-y-2">
        <SubscriptionBadge />

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300 text-[11px]">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              SEFAZ SP
            </span>
            <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
              Online (107)
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300 text-[11px]">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              Paulistana
            </span>
            <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
              Online
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <div className="truncate">
              <span className="block font-semibold text-slate-200 text-[11px] truncate">
                Certificado A1 IT2A
              </span>
              <span className="text-[9px] text-teal-400 font-medium">
                Válido até 06/03/2027
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
