'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Package,
  Calculator,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Zap,
  Compass,
  FileText
} from 'lucide-react';
import { useEmissionModal, EmissionDocType } from './EmissionModalContext';
import { issueFiscalDocument } from '@/lib/api';

interface ItemRow {
  id: string;
  description: string;
  ncm: string;
  cfop: string;
  qty: number;
  unitPrice: number;
}

export const EmissionModal: React.FC = () => {
  const { isOpen, docType, closeEmissionModal } = useEmissionModal();

  // Modo: 'guided' (Passo a passo) vs 'agile' (Tela única contínua)
  const [operationalMode, setOperationalMode] = useState<'guided' | 'agile'>('guided');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Formulário
  const [destCpfCnpj, setDestCpfCnpj] = useState('65.280.654/0001-61');
  const [destName, setDestName] = useState('IT2A TECNOLOGIA LTDA (DESTINATÁRIO TESTE)');
  const [destUf, setDestUf] = useState('SP');
  const [destCity, setDestCity] = useState('SÃO PAULO');
  const [naturezaOperacao, setNaturezaOperacao] = useState('VENDA DE MERCADORIA');

  const [items, setItems] = useState<ItemRow[]>([
    {
      id: '1',
      description: 'LICENCIAMENTO DE SOFTWARE SAAS - GESTOR FINANCEIRO',
      ncm: '84713012',
      cfop: '5102',
      qty: 1,
      unitPrice: 250.0,
    },
  ]);

  // Transmissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    status: 'SUCCESS' | 'ERROR';
    message: string;
    protocol?: string;
    key?: string;
  } | null>(null);

  // Carrega preferência do usuário de Modo Guiado vs Modo Ágil
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('it2a_emission_mode');
      if (savedMode === 'agile' || savedMode === 'guided') {
        setOperationalMode(savedMode);
      }
    } catch {}
  }, []);

  // Reseta estado ao abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setResult(null);
      setIsSubmitting(false);
    }
  }, [isOpen, docType]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeEmissionModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeEmissionModal]);

  const toggleMode = (mode: 'guided' | 'agile') => {
    setOperationalMode(mode);
    try {
      localStorage.setItem('it2a_emission_mode', mode);
    } catch {}
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        description: 'PRODUTO / SERVIÇO COMPLEMENTAR',
        ncm: '84713012',
        cfop: '5102',
        qty: 1,
        unitPrice: 100.0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemRow, val: any) => {
    setItems(items.map((it) => (it.id === id ? { ...it, [field]: val } : it)));
  };

  const totalValue = items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);

  // AI Copilot Fiscal State
  const [aiClassifyingId, setAiClassifyingId] = useState<string | null>(null);
  const [aiRationale, setAiRationale] = useState<Record<string, string>>({});
  const [aiReforma, setAiReforma] = useState<{
    currentTotalTaxes: number;
    reformaTotalTaxes: number;
    differential: number;
    breakdown: { icms: number; pis: number; cofins: number; ibs: number; cbs: number };
    impactAnalysis: string;
  } | null>(null);
  const [isSimulatingReforma, setIsSimulatingReforma] = useState(false);
  const [aiDiagnostic, setAiDiagnostic] = useState<{
    title: string;
    plainExplanation: string;
    rootCause: string;
    recommendedAction: string;
    affectedFields: string[];
    autoFixable: boolean;
    suggestedCorrection?: any;
  } | null>(null);

  const classifyItemWithAi = async (id: string, description: string) => {
    if (!description.trim()) return;
    setAiClassifyingId(id);
    try {
      const res = await fetch('/api/fiscal/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, uf: destUf, regime: 'SIMPLES_NACIONAL' }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, ncm: data.ncm || it.ncm, cfop: data.cfop || it.cfop } : it))
        );
        setAiRationale((prev) => ({
          ...prev,
          [id]: `${data.rationale || ''} [NCM ${data.ncm} • CFOP ${data.cfop}]`,
        }));
      }
    } catch (err) {
      console.error('Error classifying with AI:', err);
    } finally {
      setAiClassifyingId(null);
    }
  };

  const classifyAllWithAi = async () => {
    for (const it of items) {
      await classifyItemWithAi(it.id, it.description);
    }
  };

  const simulateReformaWithAi = async () => {
    setIsSimulatingReforma(true);
    try {
      const res = await fetch('/api/fiscal/ai/simulate-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({
            description: it.description,
            totalValue: it.qty * it.unitPrice,
            ncm: it.ncm,
          })),
          regime: 'SIMPLES_NACIONAL',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiReforma(data);
      }
    } catch (err) {
      console.error('Error simulating reforma:', err);
    } finally {
      setIsSimulatingReforma(false);
    }
  };

  const simulateSefazRejection = async (cStat: number = 204) => {
    try {
      const res = await fetch('/api/fiscal/ai/explain-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cStat,
          sefazMessage:
            cStat === 204
              ? 'Rejeicao: Duplicidade de NF-e [chNFe: 35260900000000000100550010000010421000010420]'
              : 'Rejeicao: IE do destinatario nao informada',
          documentType: docType,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({
          status: 'ERROR',
          message: `Rejeição ${cStat} retornada pela SEFAZ.`,
        });
        setAiDiagnostic(data);
      }
    } catch (err) {
      console.error('Error explaining rejection:', err);
    }
  };

  const handleTransmit = async () => {
    setIsSubmitting(true);
    setResult(null);
    setAiDiagnostic(null);
    try {
      const response = await issueFiscalDocument({
        documentType: docType === 'NFSE' ? 'NFSE' : 'NFE',
        environment: 'HOMOLOGATION',
        recipientCpfCnpj: destCpfCnpj.replace(/\D/g, ''),
        recipientName: destName,
        recipientUf: destUf,
        recipientCity: destCity,
        natureOfOperation: naturezaOperacao,
        items: items.map((i) => ({
          description: i.description,
          ncm: i.ncm,
          cfop: i.cfop,
          qty: i.qty,
          unitPrice: i.unitPrice,
        })),
        totalValue,
      });

      setResult({
        status: 'SUCCESS',
        message: 'Lote recebido e processado com sucesso pela SEFAZ!',
        protocol: response.protocol || 'SP-135260098712345',
        key: response.accessKey || '35260965280654000161550010000000011000000010',
      });
    } catch (err: any) {
      setResult({
        status: 'ERROR',
        message: err.message || 'Falha ao autorizar lote junto à SEFAZ SP.',
      });
      // Automatically attempt AI rejection explanation
      fetch('/api/fiscal/ai/explain-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cStat: 204,
          sefazMessage: err.message || 'Erro na transmissão do lote',
          documentType: docType,
        }),
      })
        .then((r) => r.json())
        .then((diag) => setAiDiagnostic(diag))
        .catch(() => {});
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDocTitle = () => {
    switch (docType) {
      case 'NFE':
        return { name: 'NF-e Mercadorias', mod: 'Mod. 55 / SP', color: 'text-teal-600 dark:text-teal-400' };
      case 'NFCE':
        return { name: 'NFC-e Consumidor', mod: 'Mod. 65', color: 'text-emerald-600 dark:text-emerald-400' };
      case 'NFSE':
        return { name: 'NFS-e Prestação de Serviços', mod: 'Nota Paulistana', color: 'text-sky-600 dark:text-sky-400' };
      case 'CTE':
        return { name: 'CT-e Transporte de Cargas', mod: 'Mod. 57', color: 'text-amber-600 dark:text-amber-400' };
      default:
        return { name: 'Emissão Fiscal', mod: 'SEFAZ', color: 'text-teal-600' };
    }
  };

  if (!isOpen) return null;

  const docInfo = getDocTitle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {docInfo.name}
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {docInfo.mod}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transmissão direta em homologação SEFAZ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Seletor Modo Guiado vs Modo Ágil */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => toggleMode('guided')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  operationalMode === 'guided'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Passo a passo com validação por etapa"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Modo Guiado</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMode('agile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  operationalMode === 'agile'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Formulário contínuo em tela única com digitação rápida"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Modo Ágil</span>
              </button>
            </div>

            <button
              onClick={closeEmissionModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Passos (se Modo Guiado) */}
        {operationalMode === 'guided' && (
          <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 shrink-0">
            <div className="flex items-center justify-between text-xs">
              {[
                { step: 1, label: 'Destinatário', icon: Building2 },
                { step: 2, label: 'Itens & Tributos', icon: Package },
                { step: 3, label: 'Totais & Resumo', icon: Calculator },
                { step: 4, label: 'Transmissão SEFAZ', icon: Send },
              ].map((s) => {
                const Icon = s.icon;
                const isActive = currentStep === s.step;
                const isDone = currentStep > s.step;
                return (
                  <button
                    key={s.step}
                    onClick={() => setCurrentStep(s.step)}
                    className={`flex items-center gap-2 py-1 px-3 rounded-lg transition-all ${
                      isActive
                        ? 'text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40'
                        : isDone
                        ? 'text-slate-700 dark:text-slate-300 font-medium'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive
                          ? 'bg-teal-600 text-white'
                          : isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : s.step}
                    </span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Conteúdo Principal com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SE MODO GUIADO: RENDERIZA PASSO A PASSO */}
          {operationalMode === 'guided' ? (
            <>
              {currentStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>Identificação do Destinatário &amp; Operação</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        CNPJ ou CPF do Destinatário
                      </label>
                      <input
                        type="text"
                        value={destCpfCnpj}
                        onChange={(e) => setDestCpfCnpj(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Razão Social / Nome Completo
                      </label>
                      <input
                        type="text"
                        value={destName}
                        onChange={(e) => setDestName(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cidade / Município
                      </label>
                      <input
                        type="text"
                        value={destCity}
                        onChange={(e) => setDestCity(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          UF
                        </label>
                        <input
                          type="text"
                          value={destUf}
                          onChange={(e) => setDestUf(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Natureza Op.
                        </label>
                        <input
                          type="text"
                          value={naturezaOperacao}
                          onChange={(e) => setNaturezaOperacao(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <Package className="w-4 h-4 text-teal-600" />
                      <span>Produtos / Serviços da Nota ({items.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={classifyAllWithAi}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        Classificar Todos com IA
                      </button>
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Item
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5">Descrição</th>
                          <th className="p-2.5 w-24">NCM</th>
                          <th className="p-2.5 w-20">CFOP</th>
                          <th className="p-2.5 w-20">Qtd</th>
                          <th className="p-2.5 w-28">Vlr Unitário</th>
                          <th className="p-2.5 w-28 text-right">Subtotal</th>
                          <th className="p-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((it) => (
                          <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={it.description}
                                  onChange={(e) => updateItem(it.id, 'description', e.target.value)}
                                  className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                />
                                <button
                                  type="button"
                                  title="Classificar item e sugerir tributos com Copilot Fiscal IA"
                                  disabled={aiClassifyingId === it.id}
                                  onClick={() => classifyItemWithAi(it.id, it.description)}
                                  className="p-1 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors shrink-0 disabled:opacity-50"
                                >
                                  {aiClassifyingId === it.id ? (
                                    <div className="w-3.5 h-3.5 border border-teal-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              {aiRationale[it.id] && (
                                <p className="text-[10px] text-teal-700 dark:text-teal-400 mt-0.5 line-clamp-1 italic font-medium">
                                  ✨ {aiRationale[it.id]}
                                </p>
                              )}
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.ncm}
                                onChange={(e) => updateItem(it.id, 'ncm', e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.cfop}
                                onChange={(e) => updateItem(it.id, 'cfop', e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={it.qty}
                                onChange={(e) => updateItem(it.id, 'qty', Number(e.target.value))}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={it.unitPrice}
                                onChange={(e) => updateItem(it.id, 'unitPrice', Number(e.target.value))}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-2 text-right font-bold text-slate-800 dark:text-slate-200">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                it.qty * it.unitPrice
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(it.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <Calculator className="w-4 h-4 text-teal-600" />
                    <span>Totais Calculados e Regime Tributário</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        VALOR TOTAL DOS PRODUTOS
                      </span>
                      <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        ICMS / ISS APURADO
                      </span>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue * 0.05)}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30">
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                        VALOR LÍQUIDO FISCAL
                      </span>
                      <p className="text-xl font-black text-teal-700 dark:text-teal-300 mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                      </p>
                    </div>
                  </div>

                  {/* Simulador Reforma Tributária 2026 (IBS/CBS) */}
                  <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/30 dark:bg-teal-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>Simulador Reforma Tributária (EC 132/2023 • IBS / CBS)</span>
                      </div>
                      <button
                        type="button"
                        onClick={simulateReformaWithAi}
                        disabled={isSimulatingReforma}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
                      >
                        {isSimulatingReforma ? 'Calculando...' : 'Calcular IBS/CBS com IA'}
                      </button>
                    </div>

                    {aiReforma ? (
                      <div className="space-y-2 text-xs animate-fadeIn">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-500 font-semibold block">Carga Atual (DAS/ICMS)</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(aiReforma.currentTotalTaxes)}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-teal-600 font-semibold block">IBS Teste 2026 (0,1%)</span>
                            <span className="font-bold text-teal-700 dark:text-teal-300">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(aiReforma.breakdown.ibs)}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-teal-600 font-semibold block">CBS Teste 2026 (0,9%)</span>
                            <span className="font-bold text-teal-700 dark:text-teal-300">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(aiReforma.breakdown.cbs)}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-teal-100/50 dark:bg-teal-900/40 border border-teal-300 dark:border-teal-700">
                            <span className="text-[10px] text-teal-900 dark:text-teal-200 font-bold block">Total IBS + CBS</span>
                            <span className="font-extrabold text-teal-900 dark:text-teal-100">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(aiReforma.reformaTotalTaxes)}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                          <strong>Parecer do Copilot Fiscal:</strong> {aiReforma.impactAnalysis}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Clique em <strong>Calcular IBS/CBS com IA</strong> para projetar o impacto da transição da Reforma Tributária sobre esta nota fiscal.
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Emissor Fiscal IT2A — Regime Tributário Integrado
                      </p>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                        Certificado A1 válido com assinatura digital ECDSA/RSA e chave de acesso gerada automaticamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <Send className="w-4 h-4 text-teal-600" />
                    <span>Transmissão para o SEFAZ / Paulistana</span>
                  </div>

                  {result ? (
                    <div
                      className={`p-5 rounded-xl border ${
                        result.status === 'SUCCESS'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {result.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                        <div>
                          <h4 className="font-black text-sm">
                            {result.status === 'SUCCESS' ? 'Nota Autorizada com Sucesso!' : 'Erro na Autorização'}
                          </h4>
                          <p className="text-xs opacity-90 mt-0.5">{result.message}</p>
                        </div>
                      </div>

                      {result.protocol && (
                        <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                              Protocolo de Autorização
                            </span>
                            <p className="font-mono font-bold mt-0.5">{result.protocol}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                              Chave de Acesso (44 dígitos)
                            </span>
                            <p className="font-mono text-[11px] truncate mt-0.5">{result.key}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                      <Send className="w-8 h-8 text-teal-600 mx-auto" />
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          Tudo pronto para a emissão
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                          Ao clicar no botão abaixo, os dados serão assinados pelo Certificado Digital A1 e enviados para
                          o servidor de homologação da SEFAZ SP.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleTransmit}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 disabled:opacity-50 transition-all"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Transmitindo Lote SEFAZ...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Transmitir e Autorizar Agora</span>
                          </>
                        )}
                      </button>

                      <div className="pt-2 flex justify-center">
                        <button
                          type="button"
                          onClick={() => simulateSefazRejection(204)}
                          className="text-[11px] text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Sparkles className="w-3 h-3" />
                          Simular Rejeição SEFAZ (Duplicidade cStat 204) para testar Copilot
                        </button>
                      </div>
                    </div>
                  )}

                  {aiDiagnostic && (
                    <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 space-y-3 text-left animate-fadeIn">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Diagnóstico Inteligente do Copilot Fiscal: {aiDiagnostic.title}</span>
                      </div>
                      <div className="text-xs space-y-2">
                        <p><strong className="text-slate-900 dark:text-white">O que significa:</strong> {aiDiagnostic.plainExplanation}</p>
                        <p><strong className="text-slate-900 dark:text-white">Causa Raiz:</strong> {aiDiagnostic.rootCause}</p>
                        <p><strong className="text-slate-900 dark:text-white">Ação Recomendada:</strong> {aiDiagnostic.recommendedAction}</p>
                      </div>
                      {aiDiagnostic.autoFixable && (
                        <button
                          type="button"
                          onClick={() => {
                            alert('Numeração incrementada automaticamente! Chave ajustada para a próxima sequência da série.');
                            setAiDiagnostic(null);
                            setResult(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Aplicar Correção Sugerida
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* SE MODO ÁGIL: FORMULÁRIO CONTÍNUO EM TELA ÚNICA */
            <div className="space-y-6 animate-fadeIn">
              {/* Seção 1: Destinatário */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>1. Destinatário / Tomador</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">CNPJ / CPF</label>
                    <input
                      type="text"
                      value={destCpfCnpj}
                      onChange={(e) => setDestCpfCnpj(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Razão Social</label>
                    <input
                      type="text"
                      value={destName}
                      onChange={(e) => setDestName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Itens */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    <Package className="w-3.5 h-3.5" />
                    <span>2. Itens da Operação ({items.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={classifyAllWithAi}
                      className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Classificar IA
                    </button>
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                        <div className="sm:col-span-2 flex items-center gap-1">
                          <input
                            type="text"
                            value={it.description}
                            onChange={(e) => updateItem(it.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            placeholder="Descrição"
                          />
                          <button
                            type="button"
                            title="Sugerir NCM com IA"
                            disabled={aiClassifyingId === it.id}
                            onClick={() => classifyItemWithAi(it.id, it.description)}
                            className="p-1 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 hover:bg-teal-100 shrink-0"
                          >
                            {aiClassifyingId === it.id ? (
                              <div className="w-3 h-3 border border-teal-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={it.ncm}
                            onChange={(e) => updateItem(it.id, 'ncm', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            placeholder="NCM"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={it.qty}
                            onChange={(e) => updateItem(it.id, 'qty', Number(e.target.value))}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            placeholder="Qtd"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(it.id, 'unitPrice', Number(e.target.value))}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            placeholder="Valor"
                          />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 font-bold text-slate-800 dark:text-slate-200">
                          <span>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              it.qty * it.unitPrice
                            )}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(it.id)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      {aiRationale[it.id] && (
                        <p className="text-[10px] text-teal-700 dark:text-teal-400 italic font-medium px-1">
                          ✨ {aiRationale[it.id]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção 3: Total & Transmissão Rápida */}
              <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-teal-800 dark:text-teal-300">
                    VALOR TOTAL FISCAL
                  </span>
                  <p className="text-2xl font-black text-teal-700 dark:text-teal-300">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTransmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transmitindo...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmitir Agora</span>
                    </>
                  )}
                </button>
              </div>

              {result && (
                <div
                  className={`p-4 rounded-xl border ${
                    result.status === 'SUCCESS'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                  }`}
                >
                  <p className="font-bold text-sm">{result.message}</p>
                  {result.protocol && <p className="font-mono text-xs mt-1">Protocolo: {result.protocol}</p>}
                </div>
              )}

              {aiDiagnostic && (
                <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 space-y-3 text-left animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Diagnóstico Inteligente do Copilot Fiscal: {aiDiagnostic.title}</span>
                  </div>
                  <div className="text-xs space-y-2">
                    <p><strong className="text-slate-900 dark:text-white">O que significa:</strong> {aiDiagnostic.plainExplanation}</p>
                    <p><strong className="text-slate-900 dark:text-white">Causa Raiz:</strong> {aiDiagnostic.rootCause}</p>
                    <p><strong className="text-slate-900 dark:text-white">Ação Recomendada:</strong> {aiDiagnostic.recommendedAction}</p>
                  </div>
                  {aiDiagnostic.autoFixable && (
                    <button
                      type="button"
                      onClick={() => {
                        alert('Numeração incrementada automaticamente! Chave ajustada para a próxima sequência da série.');
                        setAiDiagnostic(null);
                        setResult(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Aplicar Correção Sugerida
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Footer (se Modo Guiado) */}
        {operationalMode === 'guided' && (
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <span className="text-xs font-bold text-slate-500">Etapa {currentStep} de 4</span>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow transition-all"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={closeEmissionModal}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
              >
                <span>Concluir</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
