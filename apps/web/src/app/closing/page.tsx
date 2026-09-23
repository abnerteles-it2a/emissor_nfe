'use client';

import React, { useState } from 'react';
import { 
  Archive, 
  Download, 
  Mail, 
  FileCheck2, 
  FileX2, 
  Calendar, 
  CheckCircle2, 
  Building,
  ArrowDownToLine,
  Send
} from 'lucide-react';

export default function ClosingPage() {
  const [selectedMonth, setSelectedMonth] = useState('09/2026');
  const [accountantEmail, setAccountantEmail] = useState('contabil@it2a.com.br');
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const handleExportZip = () => {
    setIsExporting(true);
    setExportFeedback(null);
    setTimeout(() => {
      setIsExporting(false);
      setExportFeedback('Pacote de XMLs compactado com sucesso! Download iniciado.');
    }, 1200);
  };

  const handleSendEmail = () => {
    setExportFeedback(`Fechamento fiscal e XMLs enviados para o e-mail: ${accountantEmail}!`);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Módulo do Contador</span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400">Apuração Mensal e Arquivos Fiscais</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Fechamento Fiscal & Exportação Contábil</h1>
        <p className="text-sm text-slate-400 mt-1">
          Consolidação mensal de todos os XMLs de notas emitidas, canceladas e recebidas para apuração de impostos e entrega contábil.
        </p>
      </div>

      {/* Seletor de Competência */}
      <div className="bg-white dark:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-brand-400" />
          <div>
            <span className="text-xs text-slate-400 block">Competência de Apuração</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">Mês de Referência</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand-500 rounded-lg px-4 py-2 text-xs text-white font-medium focus:outline-none"
          >
            <option value="09/2026">Setembro / 2026 (Competência Vigente)</option>
            <option value="08/2026">Agosto / 2026</option>
            <option value="07/2026">Julho / 2026</option>
          </select>
        </div>
      </div>

      {/* Resumo do Fechamento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Notas Autorizadas</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block">18 XMLs</span>
          <span className="text-xs text-emerald-400 mt-1 block">R$ 48.950,00 faturados</span>
        </div>

        <div className="bg-white dark:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Canceladas / CC-e</span>
            <FileX2 className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block">2 Eventos</span>
          <span className="text-xs text-slate-500 mt-1 block">Com protocolo SEFAZ vinculado</span>
        </div>

        <div className="bg-white dark:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Notas de Entrada (Compras)</span>
            <Archive className="w-4 h-4 text-it2a-cyan" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block">12 XMLs</span>
          <span className="text-xs text-it2a-cyan mt-1 block">R$ 10.860,40 em despesas</span>
        </div>
      </div>

      {/* Ações de Exportação */}
      <div className="bg-white dark:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Opções de Exportação para Contabilidade</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gere o arquivo comprimido (.zip) padronizado contendo pastas organizadas por modelo fiscal (`NFe_Autorizadas`, `NFe_Canceladas`, `Eventos_CCe`, `NFSe_Servicos`).
          </p>
        </div>

        {exportFeedback && (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Download Direto */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-white font-semibold text-sm mb-1">
                <ArrowDownToLine className="w-4 h-4 text-brand-400" />
                Download do Pacote ZIP
              </div>
              <p className="text-xs text-slate-400">
                Baixe imediatamente todos os arquivos XML e relatórios em planilha para o seu computador.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportZip}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Compactando Arquivos...' : `Baixar Pacote .ZIP (${selectedMonth})`}
            </button>
          </div>

          {/* Envio Direto ao Contador */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-white font-semibold text-sm mb-1">
                <Mail className="w-4 h-4 text-it2a-cyan" />
                Disparo Automático por E-mail
              </div>
              <p className="text-xs text-slate-400">
                Encaminhe o fechamento fiscal mensal diretamente para o e-mail do seu escritório contábil.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="email"
                value={accountantEmail}
                onChange={(e) => setAccountantEmail(e.target.value)}
                placeholder="E-mail da contabilidade..."
                className="flex-1 bg-white dark:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleSendEmail}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
