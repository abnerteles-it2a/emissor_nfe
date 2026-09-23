'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  CheckCircle2,
  FileText,
  Building2,
  Clock,
  AlertTriangle,
  Radar,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  ShoppingBag,
  Store,
  FileSpreadsheet,
  DownloadCloud,
  ChevronDown,
  Info,
  Calendar,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { FiscalDocumentSummary } from '@/lib/api';
import { useEmissionModal, EmissionDocType } from '@/components/modals/EmissionModalContext';

interface DashboardViewProps {
  initialDocuments: FiscalDocumentSummary[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ initialDocuments }) => {
  const { openEmissionModal } = useEmissionModal();
  const [activeTab, setActiveTab] = useState<'emitted' | 'radar' | 'sefaz'>('emitted');

  const documents = initialDocuments || [];
  const authorizedDocs = documents.filter((d) => d.status === 'AUTHORIZED');
  const totalValue = authorizedDocs.reduce((acc, doc) => acc + doc.totalValue, 0);
  const nfeDocs = authorizedDocs.filter((d) => d.documentType === 'NFE');
  const nfseDocs = authorizedDocs.filter((d) => d.documentType === 'NFSE');
  const nfeValue = nfeDocs.reduce((acc, d) => acc + d.totalValue, 0);
  const nfseValue = nfseDocs.reduce((acc, d) => acc + d.totalValue, 0);
  const processingCount = documents.filter((d) => d.status === 'PROCESSING' || d.status === 'RECEIVED').length;
  const rejectedCount = documents.filter((d) => d.status === 'REJECTED' || d.status === 'FAILED').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header com Saudações e Status de Conexão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            EMISSOR FISCAL IT2A
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Painel Operacional
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ambiente corporativo de emissão, autorização e monitoramento de DF-e.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">SEFAZ SP &amp; Paulistana Online</span>
        </div>
      </div>

      {/* 2. Os 4 Cards Sóbrios de Ação Rápida */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Fez uma venda? (NF-e Mercadorias) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between group">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <ShoppingBag className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Fez uma venda?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Emita nota fiscal de saída de produtos (NF-e Mod. 55)
            </p>
          </div>

          <button
            type="button"
            onClick={() => openEmissionModal('NFE')}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20 transition-all"
          >
            <span>Emitir NF-e</span>
          </button>
        </div>

        {/* Card 2: Vendeu para o consumidor? (NFC-e) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between group">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Venda no Balcão?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Emita cupom fiscal eletrônico para consumidor (NFC-e Mod. 65)
            </p>
          </div>

          <button
            type="button"
            onClick={() => openEmissionModal('NFCE')}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all"
          >
            <span>Emitir NFC-e</span>
          </button>
        </div>

        {/* Card 3: Prestou serviço ou transporte? */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between group">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <FileSpreadsheet className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Prestou serviço?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Emita nota fiscal de serviços (NFS-e Paulistana / Nacional)
            </p>
          </div>

          <button
            type="button"
            onClick={() => openEmissionModal('NFSE')}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 transition-all"
          >
            <span>Emitir NFS-e</span>
          </button>
        </div>

        {/* Card 4: XML por período & Fechamento */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between group">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <DownloadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">XML por período</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Gere pacotes de XML e relatórios para a contabilidade
            </p>
          </div>

          <Link
            href="/closing"
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 transition-all"
          >
            <span>Exportar XMLs</span>
          </Link>
        </div>
      </div>

      {/* 3. Banner Sóbrio de Diagnóstico Fiscal & Copilot IA */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                COPILOT FISCAL IA &amp; DIAGNÓSTICO
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Ativo &amp; Operacional</span>
            </div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
              Classificação inteligente de NCM/CFOP/ISS, diagnóstico de rejeições SEFAZ em português claro e simulação da Reforma Tributária (IBS/CBS).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openEmissionModal('NFE')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Testar com IA</span>
          </button>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <span>Certificado A1</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Visão Geral Operacional (KPIs Minimalistas e Sóbrios) */}
      <section aria-labelledby="overview-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="overview-title"
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500"
          >
            VISÃO GERAL OPERACIONAL
          </h2>

          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            Mês Vigente
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard
            title="VOLUME TOTAL AUTORIZADO"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            icon={<FileCheck className="w-4 h-4" />}
            subtext={`${authorizedDocs.length} documentos transmitidos`}
            color="teal"
          />

          <KpiCard
            title="NF-E MERCADORIAS (55)"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nfeValue)}
            icon={<FileText className="w-4 h-4" />}
            subtext={`${nfeDocs.length} notas autorizadas`}
            color="emerald"
          />

          <KpiCard
            title="NFS-E SERVIÇOS (PAULISTANA)"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nfseValue)}
            icon={<Building2 className="w-4 h-4" />}
            subtext={`${nfseDocs.length} notas autorizadas`}
            color="blue"
          />

          <KpiCard
            title="EM PROCESSAMENTO / FILA"
            value={processingCount.toString()}
            icon={<Clock className="w-4 h-4" />}
            subtext={rejectedCount > 0 ? `${rejectedCount} rejeitadas / com alerta` : 'Fila de transmissão limpa'}
            color={rejectedCount > 0 ? 'rose' : 'slate'}
          />
        </div>
      </section>

      {/* 5. Seção de Abas & Tabela de Documentos Recentes */}
      <div className="space-y-4 pt-2">
        <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('emitted')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'emitted'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documentos Emitidos Recentemente</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'radar'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>Documentos Recebidos (Radar DF-e)</span>
          </button>
        </div>

        {/* Tabela de Documentos */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Tipo</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Destinatário / Tomador</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Status SEFAZ</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Valor Total</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Chave / Protocolo</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {documents.length > 0 ? (
                documents.slice(0, 6).map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {doc.documentType === 'NFE' ? 'NF-e (55)' : doc.documentType === 'NFSE' ? 'NFS-e' : 'NFC-e'}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      <div className="font-semibold truncate max-w-[220px]">
                        {doc.recipientName || 'IT2A TECNOLOGIA LTDA'}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {doc.recipientCpfCnpj || '65.280.654/0001-61'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {doc.status === 'AUTHORIZED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" /> Autorizada (100)
                        </span>
                      )}
                      {doc.status === 'PROCESSING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                          <Clock className="w-3 h-3 animate-spin" /> Em Processamento
                        </span>
                      )}
                      {doc.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                          <AlertTriangle className="w-3 h-3" /> Rejeitada
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-slate-100">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(doc.totalValue)}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px] truncate max-w-[180px]">
                      {doc.accessKey || doc.protocol || 'SP-13526001234567'}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        href={`/documents?id=${doc.id}`}
                        className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 font-bold"
                      >
                        <span>Ver</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <p className="font-semibold">Nenhum documento emitido nesta base local ainda.</p>
                    <button
                      type="button"
                      onClick={() => openEmissionModal('NFE')}
                      className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      Clique aqui para emitir sua primeira nota de teste
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
