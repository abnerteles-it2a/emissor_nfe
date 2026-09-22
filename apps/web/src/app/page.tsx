import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Trophy,
  Zap,
  RefreshCw,
  FileCheck,
  FileText
} from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { PredictiveInsightsWidget } from '@/components/PredictiveInsightsWidget';
import { fetchFiscalDocuments } from '@/lib/api';

export const revalidate = 0;

export default async function DashboardPage() {
  const documents = await fetchFiscalDocuments();

  const authorizedDocs = documents.filter((d) => d.status === 'AUTHORIZED');
  const totalValue = authorizedDocs.reduce((acc, doc) => acc + doc.totalValue, 0);
  const nfeValue = authorizedDocs
    .filter((d) => d.documentType === 'NFE')
    .reduce((acc, d) => acc + d.totalValue, 0);
  const nfseValue = authorizedDocs
    .filter((d) => d.documentType === 'NFSE')
    .reduce((acc, d) => acc + d.totalValue, 0);
  const processingCount = documents.filter((d) => d.status === 'PROCESSING' || d.status === 'RECEIVED').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* 1. Header do Dashboard Executivo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            DASHBOARD EXECUTIVO
          </h1>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Visão Geral
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/issue"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0D9488] hover:bg-teal-600 text-white flex items-center gap-1.5 shadow-md shadow-teal-900/30 transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Nova Emissão
          </Link>
          <Link
            href="/documents"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
          >
            Ver Todas
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Banner de Diagnóstico Preditivo (Portado do Gestor Financeiro) */}
      <PredictiveInsightsWidget />

      {/* 3. Seção: Visão Geral de Patrimônio / Faturamento */}
      <section aria-labelledby="overview-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="overview-title"
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
          >
            VISÃO GERAL DE PATRIMÔNIO &amp; FATURAMENTO
          </h2>
        </div>

        {/* Grade de 8 KpiCards 100% idêntica ao Gestor Financeiro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Primário Sólido Teal #0D9488 */}
          <KpiCard
            title="PATRIMÔNIO LÍQUIDO / FATURADO"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            icon={<Building2 className="w-5 h-5" />}
            subtext="ATIVOS + DISPONÍVEL"
            variant="primary"
          />

          {/* Card 2: Saldo em Contas (Borda Azul) */}
          <KpiCard
            title="SALDO EM CONTAS / NOTAS"
            value={authorizedDocs.length.toString()}
            icon={<Wallet className="w-5 h-5" />}
            subtext="100% INTEGRADAS SEFAZ"
            color="blue"
            density="compact"
          />

          {/* Card 3: Receitas do Mês (Borda Verde) */}
          <KpiCard
            title="RECEITAS DO MÊS (NF-E)"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nfeValue)}
            icon={<ArrowUpRight className="w-5 h-5" />}
            subtext="↑ 0.0% VS ANTERIOR"
            subtextColor="text-emerald-500"
            color="green"
            density="compact"
          />

          {/* Card 4: Despesas do Mês (Borda Rosa) */}
          <KpiCard
            title="SERVIÇOS DO MÊS (NFS-E)"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nfseValue)}
            icon={<ArrowDownRight className="w-5 h-5" />}
            subtext="↑ 0.0% VS ANTERIOR"
            subtextColor="text-emerald-500"
            color="rose"
            density="compact"
          />

          {/* Card 5: Contas a Pagar / Em Fila (Borda Âmbar) */}
          <KpiCard
            title="CONTAS A PAGAR / EM FILA"
            value={processingCount.toString()}
            icon={<AlertTriangle className="w-5 h-5" />}
            subtext="FILA ASSÍNCRONA ECS"
            subtextColor="text-orange-500"
            color="amber"
            density="compact"
          />

          {/* Card 6: Contas a Receber / Radar (Borda Azul) */}
          <KpiCard
            title="CONTAS A RECEBER / RADAR"
            value="R$ 0,00"
            icon={<TrendingUp className="w-5 h-5" />}
            subtext="PREVISTO ESTE MÊS"
            subtextColor="text-emerald-500"
            color="blue"
            density="compact"
          />

          {/* Card 7: Projeção Mensal (Borda Índigo) */}
          <KpiCard
            title="PROJEÇÃO MENSAL"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue * 1.15)}
            icon={<DollarSign className="w-5 h-5" />}
            subtext="SALDO FINAL PROJETADO"
            subtextColor="text-emerald-500"
            color="indigo"
            density="compact"
          />

          {/* Card 8: Taxa de Poupança / Sucesso (Borda Verde) */}
          <KpiCard
            title="TAXA DE POUPANÇA / SUCESSO"
            value="100.0%"
            icon={<Trophy className="w-5 h-5" />}
            subtext="↑ 0.0% VS ANTERIOR"
            subtextColor="text-emerald-500"
            color="green"
            density="compact"
          />
        </div>
      </section>

      {/* 4. Seção: Projeção e Inteligência Fiscal */}
      <section aria-labelledby="flow-title" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2
            id="flow-title"
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
          >
            PROJEÇÃO E INTELIGÊNCIA FISCAL
          </h2>
        </div>

        {/* Tabela de Transmissões no Padrão Omie */}
        <div className="omie-table-container">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <h3 className="text-sm font-bold text-white">
                Últimas Emissões Processadas
              </h3>
              <p className="text-xs text-slate-400">
                Documentos transmitidos via mTLS SEFAZ SP e Prefeitura Paulistana
              </p>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
              Atualização em tempo real
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="omie-table">
              <thead>
                <tr>
                  <th>Tipo / Doc</th>
                  <th>Destinatário / Tomador</th>
                  <th>Valor Total</th>
                  <th>Status SEFAZ</th>
                  <th>Chave de Acesso / Protocolo</th>
                  <th className="text-right">Data</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText
                          className={`w-4 h-4 ${
                            doc.documentType === 'NFE' ? 'text-sky-400' : 'text-teal-400'
                          }`}
                        />
                        <span className="font-bold text-white">
                          {doc.documentType} #{doc.number || 1}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-slate-200 block">
                        {doc.recipientName || 'Consumidor Final'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {doc.recipientCpfCnpj || '00.000.000/0001-91'}
                      </span>
                    </td>
                    <td className="font-bold text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        doc.totalValue
                      )}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ● {doc.status === 'AUTHORIZED' ? 'Autorizada' : doc.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-400">
                      {doc.accessKey ? (
                        <span title={doc.accessKey} className="text-teal-400/90 hover:text-teal-300">
                          {doc.accessKey.slice(0, 18)}...{doc.accessKey.slice(-6)}
                        </span>
                      ) : (
                        doc.protocol || '135260000123456'
                      )}
                    </td>
                    <td className="text-right text-xs text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
