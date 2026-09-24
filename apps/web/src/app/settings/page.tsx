'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Lock,
  Users,
  UserPlus,
  Trash2,
  RefreshCw,
  Mail,
  User,
  Phone,
  Shield,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import {
  fetchTenantMembersApi,
  addTenantMemberApi,
  updateTenantMemberRoleApi,
  deleteTenantMemberApi,
  resetMemberPasswordApi,
  TenantMember,
} from '@/lib/api';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'users' ? 'team' : 'emitter';

  const { activeTenant, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'emitter' | 'certificate' | 'series' | 'team'>(initialTab);
  const [certPassword, setCertPassword] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<'HOMOLOGATION' | 'PRODUCTION'>('HOMOLOGATION');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Estados do IAM / Gestão de Membros
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [iamFeedback, setIamFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form de Novo Membro
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'OPERATOR' | 'VIEWER'>('OPERATOR');
  const [newMemberTempPassword, setNewMemberTempPassword] = useState('123456');

  // Carregar Membros da Empresa
  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await fetchTenantMembersApi();
      setMembers(res.members || []);
    } catch (err: any) {
      console.warn('Erro ao carregar membros:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers, activeTenant?.id]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'users') {
      setActiveTab('team');
    }
  }, [searchParams]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback('Configurações fiscais atualizadas com sucesso!');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIamFeedback(null);
    setBusyAction(true);

    try {
      const res = await addTenantMemberApi({
        name: newMemberName.trim(),
        email: newMemberEmail.trim().toLowerCase(),
        role: newMemberRole,
        phone: newMemberPhone.trim() || undefined,
        temporaryPassword: newMemberTempPassword || '123456',
      });

      setIamFeedback({
        type: 'success',
        message: `Membro ${newMemberName} cadastrado com sucesso! Senha temporária: ${res.temporaryPassword || newMemberTempPassword}`,
      });

      setIsAddModalOpen(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPhone('');
      setNewMemberRole('OPERATOR');
      setNewMemberTempPassword('123456');

      await loadMembers();
    } catch (err: any) {
      setIamFeedback({
        type: 'error',
        message: err.message || 'Erro ao adicionar membro à empresa.',
      });
    } finally {
      setBusyAction(false);
    }
  };

  const handleRoleChange = async (membershipId: string, role: string) => {
    setIamFeedback(null);
    try {
      await updateTenantMemberRoleApi(membershipId, role);
      setIamFeedback({
        type: 'success',
        message: 'Função do usuário atualizada com sucesso!',
      });
      await loadMembers();
    } catch (err: any) {
      setIamFeedback({
        type: 'error',
        message: err.message || 'Erro ao alterar papel do usuário.',
      });
    }
  };

  const handleResetPassword = async (membershipId: string, memberName: string) => {
    if (!confirm(`Deseja redefinir a senha do usuário ${memberName}? Uma nova senha temporária será gerada.`)) {
      return;
    }

    setIamFeedback(null);
    try {
      const res = await resetMemberPasswordApi(membershipId);
      setIamFeedback({
        type: 'success',
        message: `${res.message} Nova senha temporária gerada: ${res.temporaryPassword}`,
      });
      await loadMembers();
    } catch (err: any) {
      setIamFeedback({
        type: 'error',
        message: err.message || 'Erro ao redefinir senha do usuário.',
      });
    }
  };

  const handleDeleteMember = async (membershipId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja revogar o acesso do usuário ${memberName} a esta empresa?`)) {
      return;
    }

    setIamFeedback(null);
    try {
      await deleteTenantMemberApi(membershipId);
      setIamFeedback({
        type: 'success',
        message: `Acesso do usuário ${memberName} revogado com sucesso.`,
      });
      await loadMembers();
    } catch (err: any) {
      setIamFeedback({
        type: 'error',
        message: err.message || 'Erro ao remover membro da empresa.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header com Informações da Empresa Ativa */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Painel de Gestão
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {activeTenant?.name || 'IT2A TECNOLOGIA LTDA'} ({activeTenant?.document || '65.280.654/0001-61'})
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Configurações &amp; Gestão Corporativa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Parametrização cadastral da empresa emitente, certificados digitais ICP-Brasil e controle de usuários da equipe.
          </p>
        </div>

        {activeTab === 'team' && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all shrink-0 active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar Usuário</span>
          </button>
        )}
      </div>

      {/* Tabs de Navegação */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('emitter')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'emitter'
              ? 'bg-teal-600/10 text-teal-600 dark:text-teal-400 border border-teal-500/30'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>1. Dados do Emitente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('certificate')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'certificate'
              ? 'bg-teal-600/10 text-teal-600 dark:text-teal-400 border border-teal-500/30'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>2. Certificado Digital A1</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('series')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'series'
              ? 'bg-teal-600/10 text-teal-600 dark:text-teal-400 border border-teal-500/30'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>3. Séries &amp; SEFAZ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'team'
              ? 'bg-teal-600/10 text-teal-600 dark:text-teal-400 border border-teal-500/30'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. Usuários &amp; Equipe (IAM)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-300 text-[10px] font-black">
            {members.length}
          </span>
        </button>
      </div>

      {saveFeedback && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* ── ABA 1: DADOS DO EMITENTE ─────────────────────────────────── */}
      {activeTab === 'emitter' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Cadastro da Empresa Emitente</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Informações tributárias oficiais cadastradas na Receita Federal e Prefeitura de São Paulo
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
              Simples Nacional (CRT 1)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1 font-bold">Razão Social</label>
              <input
                type="text"
                readOnly
                value={activeTenant?.name || 'IT2A TECNOLOGIA LTDA'}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1 font-bold">CNPJ</label>
              <input
                type="text"
                readOnly
                value={activeTenant?.document || '65.280.654/0001-61'}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1 font-bold">Inscrição Municipal (CCM São Paulo)</label>
              <input
                type="text"
                readOnly
                value="01965530"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1 font-bold">Código de Serviço Padrão (NFS-e SP)</label>
              <input
                type="text"
                readOnly
                value="02935 — Licenciamento e cessão de software (ISS: 2,9%)"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 2: CERTIFICADO DIGITAL A1 ────────────────────────────── */}
      {activeTab === 'certificate' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Certificado Digital A1 (ICP-Brasil)</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Certificado utilizado pelo Worker ECS para assinatura das NF-e e NFS-e
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ativo &amp; Válido até 06/03/2027
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Autoridade Certificadora:</span>
              <span className="font-medium">AC SyngularID Multipla v5 (ICP-Brasil)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Titular do Certificado:</span>
              <span className="font-mono">IT2A TECNOLOGIA LTDA:65280654000161</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tipo / Chave:</span>
              <span>PKCS#12 (A1) • RSA 2048 bits / SHA-256</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Criptografia em Repouso:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                AES-256-GCM isolada em Secrets Manager
              </span>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-teal-500/50 transition-colors">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Carregar novo arquivo de Certificado Digital (.pfx / .p12)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Arraste o arquivo ou clique para selecionar</p>
            <div className="mt-4 max-w-xs mx-auto flex items-center gap-2">
              <input
                type="password"
                placeholder="Senha do arquivo .pfx..."
                value={certPassword}
                onChange={(e) => setCertPassword(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 flex-1"
              />
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 transition-colors"
              >
                Validar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 3: SÉRIES & SEFAZ ───────────────────────────────────── */}
      {activeTab === 'series' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Controle de Séries &amp; Ambiente de Transmissão</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Defina os parâmetros de numeração para evitar duplicidade de notas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1 font-bold">Ambiente de Operação</label>
              <select
                value={selectedEnv}
                onChange={(e: any) => setSelectedEnv(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="HOMOLOGATION">Homologação (Testes sem valor fiscal)</option>
                <option value="PRODUCTION">Produção (Validade jurídica e fiscal)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1 font-bold">Série NF-e Padrão</label>
              <input
                type="number"
                defaultValue={1}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1 font-bold">Próximo Número NF-e</label>
              <input
                type="number"
                defaultValue={101}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Parâmetros Fiscais</span>
            </button>
          </div>
        </div>
      )}

      {/* ── ABA 4: USUÁRIOS & EQUIPE (IAM - GESTOR FINANCEIRO PATTERN) ── */}
      {activeTab === 'team' && (
        <div className="space-y-5">
          {/* Alerta de Feedback IAM */}
          {iamFeedback && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
                iamFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {iamFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{iamFeedback.message}</span>
            </div>
          )}

          {/* Cards de Resumo da Equipe */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total de Membros
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {members.length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                Proprietários / Admins
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {members.filter((m) => m.role === 'OWNER' || m.role === 'ADMIN').length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block">
                Contadores
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {members.filter((m) => m.role === 'ACCOUNTANT').length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
                Operadores Emissores
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {members.filter((m) => m.role === 'OPERATOR').length}
              </span>
            </div>
          </div>

          {/* Tabela de Membros */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Membros Autorizados para {activeTenant?.name || 'esta Empresa'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Controle permissões de emissão, fechamento contábil e auditoria fiscal
                </p>
              </div>

              <button
                type="button"
                onClick={loadMembers}
                disabled={loadingMembers}
                title="Atualizar lista"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingMembers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Papel / Função</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Último Acesso</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {members.map((m) => {
                    const initials = m.user.name
                      ? m.user.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'US';

                    const roleBadgeColor = {
                      OWNER: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
                      ADMIN: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
                      ACCOUNTANT: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                      OPERATOR: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                      VIEWER: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
                    }[m.role] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';

                    const roleLabels = {
                      OWNER: 'Proprietário (Total)',
                      ADMIN: 'Administrador',
                      ACCOUNTANT: 'Contador',
                      OPERATOR: 'Operador Emissor',
                      VIEWER: 'Visualizador',
                    };

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-600/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <span className="block font-bold text-slate-900 dark:text-white">
                                {m.user.name}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {m.user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            disabled={m.role === 'OWNER' && user?.id === m.userId}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors outline-none cursor-pointer ${roleBadgeColor}`}
                          >
                            <option value="OWNER">Proprietário (Total)</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="ACCOUNTANT">Contador</option>
                            <option value="OPERATOR">Operador Emissor</option>
                            <option value="VIEWER">Visualizador</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          {m.user.mustChangePassword ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <KeyRound className="w-3 h-3" />
                              Senha Temporária
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Ativo
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          {m.user.lastLoginAt
                            ? new Date(m.user.lastLoginAt).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : 'Nunca acessou'}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleResetPassword(m.id, m.user.name)}
                            title="Redefinir senha temporária para este usuário"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m.id, m.user.name)}
                            title="Remover acesso do usuário a esta empresa"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADICIONAR NOVO USUÁRIO / MEMBRO ───────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Novo Membro da Equipe
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Vincular usuário à empresa {activeTenant?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="carlos@empresa.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone (Opcional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Função / Perfil
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e: any) => setNewMemberRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="ACCOUNTANT">Contador</option>
                    <option value="OPERATOR">Operador Emissor</option>
                    <option value="VIEWER">Visualizador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Senha Temporária Inicial
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newMemberTempPassword}
                    onChange={(e) => setNewMemberTempPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  O usuário será guiado obrigatoriamente a trocar para uma senha pessoal no primeiro acesso.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busyAction}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {busyAction ? 'Adicionando...' : 'Cadastrar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Carregando configurações...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
