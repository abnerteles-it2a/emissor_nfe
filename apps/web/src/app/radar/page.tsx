'use client';

import React, { useState } from 'react';
import { 
  Radar, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  FileText, 
  RefreshCw,
  Eye,
  ShieldCheck
} from 'lucide-react';

interface IncomingDfe {
  id: string;
  nsu: string;
  chNFe: string;
  emitName: string;
  emitCnpj: string;
  emitUf: string;
  issueDate: string;
  totalValue: number;
  manifestStatus: 'CIENCIA' | 'CONFIRMADA' | 'PENDENTE' | 'DESCONHECIDA';
}

export default function RadarPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterManifest, setFilterManifest] = useState<string>('ALL');

  const [incomings, setIncomings] = useState<IncomingDfe[]>([
    {
      id: '1',
      nsu: '00000000004821',
      chNFe: '35260933000161550010001429811827364512',
      emitName: 'AMAZON WEB SERVICES BRASIL LTDA',
      emitCnpj: '23.412.247/0001-10',
      emitUf: 'SP',
      issueDate: '22/09/2026 14:32',
      totalValue: 1489.50,
      manifestStatus: 'CONFIRMADA'
    },
    {
      id: '2',
      nsu: '00000000004822',
      chNFe: '35260900011161550010000984112938475610',
      emitName: 'DELL COMPUTADORES DO BRASIL LTDA',
      emitCnpj: '72.381.189/0001-10',
      emitUf: 'SP',
      issueDate: '21/09/2026 10:15',
      totalValue: 8950.00,
      manifestStatus: 'PENDENTE'
    },
    {
      id: '3',
      nsu: '00000000004823',
      chNFe: '31260944000161550010000472119827364519',
      emitName: 'KALUNGA COMERCIO E INDUSTRIA GRAFICA LTDA',
      emitCnpj: '43.283.811/0001-50',
      emitUf: 'SP',
      issueDate: '19/09/2026 16:40',
      totalValue: 420.90,
      manifestStatus: 'CIENCIA'
    }
  ]);

  const handleManifest = (id: string, newStatus: IncomingDfe['manifestStatus']) => {
    setIncomings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, manifestStatus: newStatus } : item))
    );
  };

  const filtered = incomings.filter((item) => {
    const matchSearch =
      item.emitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.emitCnpj.includes(searchTerm) ||
      item.chNFe.includes(searchTerm);
    if (filterManifest === 'ALL') return matchSearch;
    return matchSearch && item.manifestStatus === filterManifest;
  });

  const totalReceived = incomings.reduce((acc, curr) => acc + curr.totalValue, 0);
  const pendingCount = incomings.filter((i) => i.manifestStatus === 'PENDENTE').length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Radar DF-e de Entradas</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">WebService DistDFe SEFAZ Nacional</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Recepção de Notas de Fornecedores</h1>
          <p className="text-sm text-slate-400 mt-1">
            Captura contínua de todos os documentos fiscais emitidos contra o CNPJ da IT2A com registro de Manifestação do Destinatário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sincronizar SEFAZ (NSU)
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Notas Recebidas (Mês)</span>
          <span className="text-2xl font-bold text-white">{incomings.length} documentos</span>
          <span className="text-xs text-emerald-400 block mt-1">100% capturadas via NSU</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Total Faturado Contra CNPJ</span>
          <span className="text-2xl font-bold text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceived)}
          </span>
          <span className="text-xs text-slate-400 block mt-1">Compras & Serviços tomados</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Pendentes de Manifestação</span>
          <span className="text-2xl font-bold text-amber-400">{pendingCount} notas</span>
          <span className="text-xs text-amber-400/80 block mt-1">Aguardando Ciência / Confirmação</span>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por fornecedor, CNPJ ou chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterManifest('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterManifest === 'ALL' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterManifest('PENDENTE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterManifest === 'PENDENTE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilterManifest('CONFIRMADA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterManifest === 'CONFIRMADA' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Confirmadas
          </button>
        </div>
      </div>

      {/* Tabela de Notas de Entrada */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-medium text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">NSU / Data</th>
                <th className="px-6 py-3">Fornecedor (Emitente)</th>
                <th className="px-6 py-3">Valor da NF-e</th>
                <th className="px-6 py-3">Manifestação</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors text-xs">
                  <td className="px-6 py-4">
                    <span className="font-mono text-slate-400 block font-bold">NSU #{item.nsu.slice(-6)}</span>
                    <span className="text-slate-500 text-[11px]">{item.issueDate}</span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-white block">{item.emitName}</span>
                        <span className="text-slate-500">{item.emitCnpj} • {item.emitUf}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-bold text-slate-100">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalValue)}
                  </td>

                  <td className="px-6 py-4">
                    {item.manifestStatus === 'CONFIRMADA' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Confirmada
                      </span>
                    )}
                    {item.manifestStatus === 'CIENCIA' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Clock className="w-3 h-3" />
                        Ciência da Emissão
                      </span>
                    )}
                    {item.manifestStatus === 'PENDENTE' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        Pendente
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.manifestStatus === 'PENDENTE' && (
                        <button
                          type="button"
                          onClick={() => handleManifest(item.id, 'CONFIRMADA')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 transition-colors text-[11px] font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmar
                        </button>
                      )}
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Baixar XML do Fornecedor"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
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
