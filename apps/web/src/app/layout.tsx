import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FileText, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  Radio, 
  PlusCircle,
  Radar,
  Archive,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

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
      <body className="bg-slate-950 text-slate-100 flex flex-col md:flex-row min-h-screen">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#020617] border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0 shadow-lg">
          <div>
            {/* Logo Oficial IT2A */}
            <div className="flex items-center gap-3 px-2 py-2 mb-6 border-b border-slate-800/60 pb-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="relative h-8 w-28">
                  <Image
                    src="/logo_white.png"
                    alt="IT2A Logo"
                    fill
                    sizes="112px"
                    className="object-contain object-left"
                    priority
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-600/20 text-brand-400 border border-brand-500/30">
                  Fiscal
                </span>
              </Link>
            </div>

            {/* Menu de Navegação */}
            <nav className="space-y-1.5">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-brand-400" />
                Dashboard
              </Link>

              <Link
                href="/issue"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold bg-brand-600/10 text-brand-300 hover:bg-brand-600/20 border border-brand-500/20 hover:border-brand-500/40 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-4 h-4 text-brand-400" />
                  <span>Nova Emissão</span>
                </div>
                <span className="text-[10px] bg-brand-500 text-slate-950 px-1.5 py-0.5 rounded font-bold">
                  NF-e / NFS-e
                </span>
              </Link>

              <Link
                href="/documents"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              >
                <FileText className="w-4 h-4 text-it2a-cyan" />
                Documentos Fiscais
              </Link>

              <Link
                href="/radar"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              >
                <Radar className="w-4 h-4 text-amber-400" />
                Radar DF-e (Entradas)
              </Link>

              <Link
                href="/closing"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              >
                <Archive className="w-4 h-4 text-indigo-400" />
                Fechamento Fiscal
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Configurações & A1
              </Link>
            </nav>
          </div>

          {/* Status e Certificados no Rodapé da Sidebar */}
          <div className="pt-6 border-t border-slate-800/80 space-y-4">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  SEFAZ SP
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
                  Online (107)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Nota Paulistana
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
                  Online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
              <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
              <div className="truncate">
                <span className="block font-medium text-slate-300 truncate">Certificado A1 IT2A</span>
                <span className="text-[10px] text-brand-400">Válido até 06/03/2027</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal com TopHeader */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar Superior */}
          <header className="h-14 border-b border-slate-800/80 bg-[#001e2c]/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">IT2A Fiscal</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-400">Plataforma SaaS</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Ambiente: Homologação
              </span>

              <Link
                href="/issue"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Emitir Nota
              </Link>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

