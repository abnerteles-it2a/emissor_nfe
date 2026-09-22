'use client';

import React, { useState } from 'react';
import { 
  Building, 
  KeyRound, 
  CheckCircle2, 
  UploadCloud, 
  Server, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertCircle,
  Save,
  Lock
} from 'lucide-react';

export default function SettingsPage() {
  const [certPassword, setCertPassword] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<'HOMOLOGATION' | 'PRODUCTION'>('HOMOLOGATION');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback('Configurações fiscais atualizadas com sucesso!');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Configuração Central</span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400">Dados do Emitente & Certificado</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Configurações & Certificados Digitais</h1>
        <p className="text-sm text-slate-400 mt-1">
          Parametrização cadastral da empresa emitente, credenciais de assinatura A1 ICP-Brasil e chaveamento de ambiente SEFAZ.
        </p>
      </div>

      {saveFeedback && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* 1. Dados do Emitente */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-brand-400" />
            <div>
              <h2 className="text-base font-semibold text-white">1. Cadastro da Empresa Emitente</h2>
              <p className="text-xs text-slate-400">Informações tributárias oficiais cadastradas na Receita e SEFAZ</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
            Simples Nacional (CRT 1)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
            <label className="text-slate-400 block mb-1">Inscrição Municipal (CCM São Paulo)</label>
            <input
              type="text"
              readOnly
              value="01965530"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-medium cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Código de Serviço Padrão (NFS-e SP)</label>
            <input
              type="text"
              readOnly
              value="02935 — Licenciamento e cessão de software (ISS: 2,9%)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-medium cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 2. Certificado Digital A1 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-it2a-cyan" />
            <div>
              <h2 className="text-base font-semibold text-white">2. Certificado Digital A1 (ICP-Brasil)</h2>
              <p className="text-xs text-slate-400">Certificado utilizado pelo Worker ECS para assinatura das NF-e e NFS-e</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ativo & Válido até 06/03/2027
          </span>
        </div>

        {/* Detalhes do Certificado Ativo */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">Autoridade Certificadora (Emissor):</span>
            <span className="font-medium text-slate-300">AC SyngularID Multipla v5 (ICP-Brasil)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Titular do Certificado:</span>
            <span className="font-medium text-slate-300 font-mono">IT2A TECNOLOGIA LTDA:65280654000161</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tipo / Chave:</span>
            <span className="font-medium text-slate-300">PKCS#12 (A1) • RSA 2048 bits / SHA-256</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Criptografia em Repouso:</span>
            <span className="font-medium text-emerald-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              AES-256-GCM com chave isolada em Secrets Manager
            </span>
          </div>
        </div>

        {/* Upload de Novo Certificado */}
        <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-brand-500/50 transition-colors">
          <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-300">Carregar novo arquivo de Certificado Digital (.pfx / .p12)</p>
          <p className="text-[11px] text-slate-500 mt-1">Arraste o arquivo ou clique para selecionar</p>
          <div className="mt-4 max-w-xs mx-auto flex items-center gap-2">
            <input
              type="password"
              placeholder="Senha do arquivo .pfx..."
              value={certPassword}
              onChange={(e) => setCertPassword(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 flex-1"
            />
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Validar
            </button>
          </div>
        </div>
      </div>

      {/* 3. Séries e Ambientes da SEFAZ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-base font-semibold text-white">3. Controle de Séries & Ambiente de Transmissão</h2>
            <p className="text-xs text-slate-400">Defina os parâmetros de numeração para evitar duplicidade de notas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Ambiente de Operação</label>
            <select
              value={selectedEnv}
              onChange={(e: any) => setSelectedEnv(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg px-3 py-2 text-white font-medium focus:outline-none"
            >
              <option value="HOMOLOGATION">Homologação (Testes sem valor fiscal)</option>
              <option value="PRODUCTION">Produção (Validade jurídica e fiscal)</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Série NF-e Padrão</label>
            <input
              type="number"
              defaultValue={1}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Próximo Número NF-e</label>
            <input
              type="number"
              defaultValue={101}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Salvar Parâmetros Fiscais
          </button>
        </div>
      </div>
    </div>
  );
}
