import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeContext';
import { AuthProvider } from '@/components/auth/AuthContext';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { LoginGate } from '@/components/auth/LoginGate';
import { EmissionModalProvider } from '@/components/modals/EmissionModalContext';
import { EmissionModal } from '@/components/modals/EmissionModal';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Emissor Fiscal IT2A — Painel Operacional',
  description: 'Plataforma corporativa de emissão e monitoramento de documentos fiscais eletrônicos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="light" suppressHydrationWarning>
      <body className="min-h-screen overflow-hidden antialiased font-sans bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors">
        <ThemeProvider>
          <AuthProvider>
            <EmissionModalProvider>
              <div className="flex h-screen overflow-hidden bg-[var(--bg-canvas)]">
                {/* Sidebar com Flyout Lateral */}
                <Sidebar />

                {/* Área Central */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                  </main>
                </div>
              </div>

              {/* Modal de Emissão Inteligente (Modo Guiado / Modo Ágil) */}
              <EmissionModal />

              {/* Modal de Troca de Senha Obrigatória (Admin/Novo Usuário) */}
              <ChangePasswordModal />

              {/* Tela de Autenticação / Login Gate com Split Screen (Gestor Financeiro) */}
              <LoginGate />
            </EmissionModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
