'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  UserCheck, 
  Package, 
  Calculator, 
  Send, 
  FileCode2, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface ItemRow {
  id: string;
  description: string;
  ncm: string;
  cfop: string;
  qty: number;
  unitPrice: number;
}

export default function IssuePage() {
  const [docType, setDocType] = useState<'NFE' | 'NFSE'>('NFE');
  const [naturezaOperacao, setNaturezaOperacao] = useState('VENDA DE MERCADORIA');
  
  // Destinatário
  const [destCpfCnpj, setDestCpfCnpj] = useState('65.280.654/0001-61');
  const [destName, setDestName] = useState('IT2A TECNOLOGIA LTDA (DESTINATÁRIO TESTE)');
  const [destUf, setDestUf] = useState('SP');
  const [destCity, setDestCity] = useState('SÃO PAULO');
  
  // Itens
  const [items, setItems] = useState<ItemRow[]>([
    {
      id: '1',
      description: 'LICENCIAMENTO DE SOFTWARE SAAS - GESTOR FINANCEIRO',
      ncm: '84713012',
      cfop: '5102',
      qty: 1,
      unitPrice: 250.00
    }
  ]);

  // Transmissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transmissionResult, setTransmissionResult] = useState<{
    status: 'SUCCESS' | 'ERROR';
    message: string;
    protocol?: string;
    key?: string;
    cStat?: number;
  } | null>(null);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        description: 'SERVIÇO / PRODUTO ADICIONAL',
        ncm: docType === 'NFE' ? '84713012' : '02935',
        cfop: '5102',
        qty: 1,
        unitPrice: 100.00
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemRow, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const totalValue = items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.unitPrice) || 0), 0);
  const icmsEstimated = docType === 'NFE' ? totalValue * 0.18 : 0;
  const issEstimated = docType === 'NFSE' ? totalValue * 0.029 : 0;

  const handleTransmit = async () => {
    setIsSubmitting(true);
    setTransmissionResult(null);

    try {
      // Simulação da chamada do WebService com a assinatura do Certificado A1 IT2A
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const generatedKey = `3526096528065400016155001000${Math.floor(100000 + Math.random() * 900000)}1355195381`;
      
      setTransmissionResult({
        status: 'SUCCESS',
        message: docType === 'NFE' 
          ? 'NF-e Modelo 55 autorizada com sucesso na SEFAZ SP!' 
          : 'NFS-e autorizada e emitida na Prefeitura de São Paulo (Nota Paulistana)!',
        protocol: `1352600${Math.floor(100000000 + Math.random() * 900000000)}`,
        key: generatedKey,
        cStat: 100
      });
    } catch (err: any) {
      setTransmissionResult({
        status: 'ERROR',
        message: err.message || 'Erro de comunicação com o WebService fiscal.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Módulo de Emissão</span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400">Assinatura Digital A1 ICP-Brasil</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Nova Emissão de Documento Fiscal</h1>
        <p className="text-sm text-slate-400 mt-1">
          Geração automática de XML 4.00, assinatura digital instantânea com chave privada A1 e transmissão direta à SEFAZ SP ou Nota Paulistana.
        </p>
      </div>

      {/* Tipo de Documento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setDocType('NFE')}
          className={`p-4 rounded-xl border text-left transition-all ${
            docType === 'NFE'
              ? 'bg-brand-950/30 border-brand-500 shadow-md ring-1 ring-brand-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-bold ${docType === 'NFE' ? 'text-white' : 'text-slate-300'}`}>
              NF-e — Modelo 55 (Produtos / Mercadorias)
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">
              SEFAZ SP
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Venda, devolução, transferência e remessa interestadual ou interna. Assinatura XMLDSig com Danfe em PDF.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setDocType('NFSE')}
          className={`p-4 rounded-xl border text-left transition-all ${
            docType === 'NFSE'
              ? 'bg-brand-950/30 border-brand-500 shadow-md ring-1 ring-brand-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-bold ${docType === 'NFSE' ? 'text-white' : 'text-slate-300'}`}>
              NFS-e — Nota Paulistana (Serviços)
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
              Prefeitura de SP
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Prestação de serviços de tecnologia, software e consultoria (Código de serviço 02935 - Alíquota 2,9%).
          </p>
        </button>
      </div>

      {/* 1. Dados do Emitente & Operação */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-brand-400" />
          <div>
            <h2 className="text-base font-semibold text-white">1. Dados do Emitente (IT2A)</h2>
            <p className="text-xs text-slate-400">Preenchido com o certificado A1 carregado e ativo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Razão Social</label>
            <input
              type="text"
              readOnly
              value="IT2A TECNOLOGIA LTDA"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-medium cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">CNPJ</label>
            <input
              type="text"
              readOnly
              value="65.280.654/0001-61"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-medium cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Regime Tributário (CRT)</label>
            <input
              type="text"
              readOnly
              value="1 - Simples Nacional (ME/EPP)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-medium cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 2. Destinatário / Tomador */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-it2a-cyan" />
          <div>
            <h2 className="text-base font-semibold text-white">2. Destinatário / Tomador do Serviço</h2>
            <p className="text-xs text-slate-400">Identificação da pessoa jurídica ou física</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="text-slate-400 block mb-1">Razão Social / Nome Completo *</label>
            <input
              type="text"
              value={destName}
              onChange={(e) => setDestName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg px-3 py-2 text-white font-medium focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">CNPJ ou CPF *</label>
            <input
              type="text"
              value={destCpfCnpj}
              onChange={(e) => setDestCpfCnpj(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg px-3 py-2 text-white font-medium focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">UF Destino *</label>
            <select
              value={destUf}
              onChange={(e) => setDestUf(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg px-3 py-2 text-white font-medium focus:outline-none transition-colors"
            >
              <option value="SP">São Paulo (SP)</option>
              <option value="RJ">Rio de Janeiro (RJ)</option>
              <option value="MG">Minas Gerais (MG)</option>
              <option value="PR">Paraná (PR)</option>
              <option value="SC">Santa Catarina (SC)</option>
              <option value="RS">Rio Grande do Sul (RS)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Itens e Produtos / Serviços */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-semibold text-white">3. Itens e Discriminação Tributária</h2>
              <p className="text-xs text-slate-400">Classificação fiscal NCM/CNAE e valores</p>
            </div>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-brand-400" />
            Adicionar Item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
            >
              <div className="sm:col-span-5">
                <label className="text-slate-500 block mb-1">Descrição do Item #{index + 1}</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-500 block mb-1">
                  {docType === 'NFE' ? 'NCM (8 dígitos)' : 'Cód. Tributação'}
                </label>
                <input
                  type="text"
                  value={item.ncm}
                  onChange={(e) => updateItem(item.id, 'ncm', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="text-slate-500 block mb-1">Qtd</label>
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-500 block mb-1">Valor Unit. (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between pt-4 sm:pt-0">
                <div>
                  <label className="text-slate-500 block mb-1">Total</label>
                  <span className="font-bold text-slate-100">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      (item.qty || 0) * (item.unitPrice || 0)
                    )}
                  </span>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remover Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Apuração e Totais */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">4. Resumo de Tributação & Totais da Operação</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-6">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Total dos Produtos/Serviços</span>
            <span className="text-xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            </span>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block mb-1">
              {docType === 'NFE' ? 'ICMS Estimado (18% ref.)' : 'ISS Estimado (2,9% SP)'}
            </span>
            <span className="text-xl font-bold text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                docType === 'NFE' ? icmsEstimated : issEstimated
              )}
            </span>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Valor Total Líquido da Nota</span>
            <span className="text-xl font-bold text-brand-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            </span>
          </div>
        </div>

        {/* Feedback da Transmissão */}
        {transmissionResult && (
          <div
            className={`p-4 rounded-xl border mb-6 text-sm ${
              transmissionResult.status === 'SUCCESS'
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {transmissionResult.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{transmissionResult.message}</p>
                {transmissionResult.protocol && (
                  <p className="text-xs text-slate-300">
                    Protocolo de Autorização:{' '}
                    <span className="font-mono text-emerald-400 font-bold">{transmissionResult.protocol}</span>
                  </p>
                )}
                {transmissionResult.key && (
                  <p className="text-xs text-slate-300 break-all">
                    Chave de Acesso:{' '}
                    <span className="font-mono text-brand-300">{transmissionResult.key}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleTransmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-50 transition-colors shadow-lg shadow-brand-600/20"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Assinando e Transmitindo...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Transmitir com Certificado A1
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
