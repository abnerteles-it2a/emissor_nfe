import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { 
  FileText, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  Radio, 
  Building2,
  ExternalLink 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'IT2A Fiscal — Plataforma de Emissão SaaS',
  description: 'Emissor fiscal multi-tenant de alta performance para NF-e, NFS-e e NFC-e.',
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
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 px-2 py-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                IT
              </div>
              <div>
                <span className="font-semibold text-white tracking-tight">IT2A Fiscal</span>
                <span className="block text-xs text-slate-400">Emissor SaaS v0.1</span>
              </div>
            </div>

            <nav className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Dashboard
              </Link>
              <Link
                href="/documents"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                Documentos Fiscais
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                Configurações & Certificados
              </Link>
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-800/80 space-y-4">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  SEFAZ SP
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Nota Paulistana
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Certificado A1 Ativo (IT2A)</span>
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
