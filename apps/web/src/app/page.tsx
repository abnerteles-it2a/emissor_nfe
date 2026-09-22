import { fetchFiscalDocuments } from '@/lib/api';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  ArrowUpRight, 
  Boxes,
  Zap,
  RefreshCw 
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function DashboardPage() {
  const documents = await fetchFiscalDocuments();

  const totalValue = documents.reduce((acc, doc) => acc + (doc.totalValue || 0), 0);
  const authorizedCount = documents.filter((d) => d.status === 'AUTHORIZED').length;
  const processingCount = documents.filter((d) => d.status === 'PROCESSING' || d.status === 'RECEIVED').length;
  const rejectedCount = documents.filter((d) => d.status === 'REJECTED' || d.status === 'FAILED').length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">IT2A Fiscal SaaS</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">Hub Tributário & Mensageria SEFAZ</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Painel Operacional Fiscal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão de emissões autorizadas, contingência, validação tributária e comunicação com a SEFAZ e Prefeituras.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/issue"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-sm"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            Nova Emissão
          </Link>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 shadow-sm"
          >
            Ver Todas
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/90 rounded-xl p-5 shadow-sm hover:border-brand-500/30 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Notas Autorizadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{authorizedCount}</span>
            <span className="text-xs text-emerald-400 block mt-1">100% integradas</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Volume Faturado</span>
            <FileCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Total processado</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Em Processamento</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{processingCount}</span>
            <span className="text-xs text-amber-400/90 block mt-1">Fila assíncrona</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Rejeições / Erros</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{rejectedCount}</span>
            <span className="text-xs text-slate-400 block mt-1">Requer atenção</span>
          </div>
        </div>
      </div>

      {/* Tabela de Documentos Recentes */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Últimas Emissões Processadas</h2>
            <p className="text-xs text-slate-400">Documentos recebidos via API Key das aplicações integradas</p>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            Atualização em tempo real
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-medium text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Tipo / Doc</th>
                <th className="px-6 py-3">Destinatário / Tomador</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Chave / Protocolo</th>
                <th className="px-6 py-3 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mr-2 ${
                      doc.documentType === 'NFE' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {doc.documentType}
                    </span>
                    #{doc.number || 1}
                  </td>
                  <td className="px-6 py-4">
                    <span className="block font-medium text-slate-200 truncate max-w-xs">{doc.recipientName || 'Consumidor'}</span>
                    <span className="text-xs text-slate-500">{doc.recipientCpfCnpj || 'Não identificado'}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(doc.totalValue)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      doc.status === 'AUTHORIZED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : doc.status === 'PROCESSING'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {doc.status === 'AUTHORIZED' && <CheckCircle2 className="w-3 h-3" />}
                      {doc.status === 'PROCESSING' && <Clock className="w-3 h-3" />}
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {doc.accessKey ? `${doc.accessKey.slice(0, 15)}...` : doc.protocol || '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-400">
                    {new Date(doc.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
