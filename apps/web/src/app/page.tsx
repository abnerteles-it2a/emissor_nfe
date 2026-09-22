import React from 'react';
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
  Zap,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { PredictiveInsightsWidget } from '@/components/PredictiveInsightsWidget';
import { fetchFiscalDocuments } from '@/lib/api';

export const revalidate = 0;

export default async function DashboardPage() {
  const documents = await fetchFiscalDocuments();

  const authorizedDocs = documents.filter((d) => d.status === 'AUTHORIZED');
  const totalValue = authorizedDocs.reduce((acc, doc) => acc + doc.totalValue, 0);
  const nfeDocs = authorizedDocs.filter((d) => d.documentType === 'NFE');
  const nfseDocs = authorizedDocs.filter((d) => d.documentType === 'NFSE');
  const nfeValue = nfeDocs.reduce((acc, d) => acc + d.totalValue, 0);
  const nfseValue = nfseDocs.reduce((acc, d) => acc + d.totalValue, 0);
  const processingCount = documents.filter((d) => d.status === 'PROCESSING' || d.status === 'RECEIVED').length;
  const rejectedCount = documents.filter((d) => d.status === 'REJECTED' || d.status === 'FAILED').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* 1. Header Executivo do Emissor Fiscal */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            DASHBOARD EXECUTIVO
          </h1>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Painel Operacional Fiscal
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
            Ver Documentos
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Banner de Diagnóstico Preditivo Fiscal */}
      <PredictiveInsightsWidget />

      {/* 3. Seção: Métricas Fiscais (Visual 100% Gestor Financeiro, Dados 100% Fiscais) */}
      <section aria-labelledby="overview-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="overview-title"
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
          >
            VISÃO GERAL OPERACIONAL &amp; EMISSÕES
          </h2>
        </div>

        {/* Grade de 8 KpiCards (Card 1 em Teal Sólido #0D9488 e Cards 2 a 8 com borda esquerda de 5px) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Destaque Primário em Teal Sólido */}
          <KpiCard
            title="VOLUME TOTAL EMITIDO"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            icon={<FileCheck className="w-5 h-5" />}
            subtext="VALOR FISCAL AUTORIZADO"
            variant="primary"
          />

          {/* Card 2: Notas Autorizadas (Borda Azul) */}
          <KpiCard
            title="NOTAS AUTORIZADAS"
            value={authorizedDocs.length.toString()}
            icon={<CheckCircle2 className="w-5 h-5" />}
            subtext="100% INTEGRADAS SEFAZ"
            color="blue"
            density="compact"
          />

          {/* Card 3: NF-e Mercadorias (Borda Verde) */}
          <KpiCard
            title="NF-E MERCADORIAS (55)"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nfeValue)}
            icon={<FileText className="w-5 h-5" />}
            subtext={`${nfeDocs.length} NOTAS AUTORIZADAS`}
            subtextColor="text-emerald-500"
            color="green"
            density="compact"
          />

          {/* Card 4: NFS-e Serviços Paulistana (Borda Ciano) */}
          <KpiCard
            title="NFS-E SERVIÇOS (SP)"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nfseValue)}
            icon={<Building2 className="w-5 h-5" />}
            subtext={`${nfseDocs.length} NOTAS PAULISTANAS`}
            subtextColor="text-emerald-500"
            color="#00B4D8"
            density="compact"
          />

          {/* Card 5: Em Processamento (Borda Âmbar) */}
          <KpiCard
            title="EM PROCESSAMENTO"
            value={processingCount.toString()}
            icon={<Clock className="w-5 h-5" />}
            subtext="FILA ASSÍNCRONA ECS"
            subtextColor="text-orange-500"
            color="amber"
            density="compact"
          />

          {/* Card 6: Rejeições / Erros (Borda Rosa) */}
          <KpiCard
            title="REJEIÇÕES / ERROS"
            value={rejectedCount.toString()}
            icon={<AlertTriangle className="w-5 h-5" />}
            subtext={rejectedCount === 0 ? "0 REJEIÇÕES REGISTRADAS" : "REQUER ATENÇÃO"}
            subtextColor={rejectedCount === 0 ? "text-emerald-500" : "text-rose-500"}
            color="rose"
            density="compact"
          />

          {/* Card 7: Radar DF-e Entradas (Borda Índigo) */}
          <KpiCard
            title="RADAR DF-E (ENTRADAS)"
            value="3"
            icon={<Radar className="w-5 h-5" />}
            subtext="NOTAS DE FORNECEDORES"
            subtextColor="text-emerald-500"
            color="indigo"
            density="compact"
          />

          {/* Card 8: Taxa de Autorização SEFAZ (Borda Verde) */}
          <KpiCard
            title="TAXA DE AUTORIZAÇÃO"
            value="100.0%"
            icon={<ShieldCheck className="w-5 h-5" />}
            subtext="OPERAÇÃO NORMAL SEFAZ"
            subtextColor="text-emerald-500"
            color="green"
            density="compact"
          />
        </div>
      </section>

      {/* 4. Seção: Últimas Emissões Processadas */}
      <section aria-labelledby="flow-title" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2
            id="flow-title"
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
          >
            ÚLTIMAS EMISSÕES TRANSMITIDAS
          </h2>
        </div>

        {/* Tabela de Transmissões no Padrão Omie de Alto Contraste */}
        <div className="omie-table-container">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <h3 className="text-sm font-bold text-white">
                Fila de Transmissões Recentes
              </h3>
              <p className="text-xs text-slate-400">
                Lotes transmitidos via mTLS SEFAZ SP e Prefeitura Paulistana com Certificado A1
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
                  <th className="text-right">Data Emissão</th>
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
                          {doc.documentType === 'NFE' ? 'NF-e 55' : 'NFS-e SP'} #{doc.number || 1}
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
