import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import './globals.css';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Radar,
  Archive,
  Settings,
  HelpCircle,
  Menu,
  ShieldCheck
} from 'lucide-react';
import { Header } from '@/components/Header';
import { CalendarWidget } from '@/components/CalendarWidget';

export const metadata: Metadata = {
  title: 'IT2A Fiscal — Emissor SaaS e Inteligência Tributária',
  description: 'Plataforma corporativa de emissão fiscal multi-tenant para NF-e, NFS-e, NFC-e e Radar DF-e.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-spatial text-slate-100 min-h-screen overflow-hidden antialiased font-sans">
        <div className="flex h-screen overflow-hidden">
          {/* SIDEBAR (Idêntica ao Gestor Financeiro) */}
          <aside className="w-64 glass-sidebar flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 text-slate-300 shadow-2xl">
            {/* Top Brand Section */}
            <div>
              <div className="h-20 flex items-center px-5 border-b border-slate-800/80 gap-3">
                <div className="relative w-11 h-11 shrink-0">
                  <Image
                    src="/logo_white.png"
                    alt="IT2A Enterprise"
                    fill
                    sizes="44px"
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="block font-black text-white text-[13px] leading-tight truncate tracking-tight uppercase">
                    GESTOR FISCAL
                  </span>
                  <span className="block text-[8.5px] text-slate-400 font-extrabold truncate uppercase tracking-[0.14em]">
                    ENTERPRISE ECOSYSTEM
                  </span>
                </div>
              </div>

              {/* User Identity Strip */}
              <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#0D9488]/20 flex items-center justify-center text-[10px] font-black text-[#0D9488] shrink-0 border border-teal-500/30">
                    A
                  </div>
                  <p className="text-[11px] font-medium text-slate-300 truncate flex-1">
                    abnerteles77@gmail.com
                  </p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#0D9488]/20 text-[#0D9488] shrink-0 border border-[#0D9488]/30">
                    Admin
                  </span>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="p-3 space-y-1 overflow-y-auto">
                <Link
                  href="/"
                  className="w-full h-10 flex items-center px-3 gap-3 rounded-lg text-sm font-semibold transition-all bg-[#0D9488]/15 text-white shadow-sm border border-[#0D9488]/30"
                >
                  <LayoutDashboard className="w-4.5 h-4.5 text-[#0D9488]" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/issue"
                  className="w-full h-10 flex items-center px-3 gap-3 rounded-lg text-sm font-medium transition-all text-slate-400 hover:bg-slate-800/60 hover:text-white"
                >
                  <PlusCircle className="w-4.5 h-4.5 text-slate-400 group-hover:text-white" />
                  <span>Nova Emissão</span>
                </Link>

                <Link
                  href="/documents"
                  className="w-full h-10 flex items-center px-3 gap-3 rounded-lg text-sm font-medium transition-all text-slate-400 hover:bg-slate-800/60 hover:text-white"
                >
                  <FileText className="w-4.5 h-4.5 text-slate-400 group-hover:text-white" />
                  <span>Documentos Fiscais</span>
                </Link>

                <Link
                  href="/radar"
                  className="w-full h-10 flex items-center px-3 gap-3 rounded-lg text-sm font-medium transition-all text-slate-400 hover:bg-slate-800/60 hover:text-white"
                >
                  <Radar className="w-4.5 h-4.5 text-slate-400 group-hover:text-white" />
                  <span>Radar DF-e</span>
                </Link>

                <Link
                  href="/closing"
                  className="w-full h-10 flex items-center px-3 gap-3 rounded-lg text-sm font-medium transition-all text-slate-400 hover:bg-slate-800/60 hover:text-white"
                >
                  <Archive className="w-4.5 h-4.5 text-slate-400 group-hover:text-white" />
                  <span>Fechamento Fiscal</span>
                </Link>

                <Link
                  href="/settings"
                  className="w-full h-10 flex items-center px-3 gap-3 rounded-lg text-sm font-medium transition-all text-slate-400 hover:bg-slate-800/60 hover:text-white"
                >
                  <Settings className="w-4.5 h-4.5 text-slate-400 group-hover:text-white" />
                  <span>Configurações &amp; A1</span>
                </Link>

                {/* Calendar Widget in Sidebar */}
                <div className="pt-2">
                  <div className="h-px bg-slate-800/80 mb-2.5 mx-1" />
                  <CalendarWidget isSidebar={true} />
                </div>
              </nav>
            </div>

            {/* Bottom: Ajuda & Suporte */}
            <div className="p-3 border-t border-slate-800/80">
              <Link
                href="/settings"
                className="w-full h-10 flex items-center px-3 gap-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition-colors"
              >
                <HelpCircle className="w-4.5 h-4.5 text-slate-400" />
                <span>Ajuda &amp; Suporte</span>
              </Link>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Topbar & Secondary Action Toolbar */}
            <Header />

            {/* Canvas Scrollable */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1560px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
