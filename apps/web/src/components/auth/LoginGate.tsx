'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  Radio,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  User,
  FileCode2,
  Network,
  ArrowLeft,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from './AuthContext';

export const LoginGate: React.FC = () => {
  const { user, login, signUp, logout, changePassword, forgotPassword, resetPassword, isLoading } = useAuth();

  // Modo ativo: LOGIN, SIGNUP, FORGOT_PASSWORD, CHANGE_PASSWORD
  const [step, setStep] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'CHANGE_PASSWORD'>('LOGIN');

  // Estados de Login
  const [email, setEmail] = useState('abner.teles@it2a.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de Cadastro (Sign Up)
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirmPassword, setSuConfirmPassword] = useState('');
  const [suCompanyName, setSuCompanyName] = useState('');
  const [suDocument, setSuDocument] = useState('');
  const [suProfileType, setSuProfileType] = useState<'EMISSOR' | 'CONTADOR'>('EMISSOR');
  const [showSuPassword, setShowSuPassword] = useState(false);

  // Estados de Recuperação de Senha (Forgot / Reset)
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [forgotTokenSent, setForgotTokenSent] = useState(false);

  // Estados para Troca Obrigatória de Senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Feedbacks
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [changeSuccess, setChangeSuccess] = useState(false);

  // Lógica de força de senha inspirada no gestorfinanceiro-azure
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const currentPassForMeter = step === 'SIGNUP' ? suPassword : step === 'CHANGE_PASSWORD' ? newPassword : resetNewPassword;
  const passStrength = getPasswordStrength(currentPassForMeter);
  const strengthColor = ['bg-slate-200 dark:bg-slate-700', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-teal-500', 'bg-emerald-500'][passStrength];
  const strengthLabel = ['Vazia', 'Muito Fraca', 'Fraca', 'Média', 'Forte', 'Muito Forte'][passStrength];

  // Formatação de Documento (CNPJ ou CPF)
  const handleDocumentChange = (val: string) => {
    const raw = val.replace(/\D/g, '').substring(0, 14);
    if (raw.length <= 11) {
      // Formata como CPF: 000.000.000-00
      const formatted = raw
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      setSuDocument(formatted);
    } else {
      // Formata como CNPJ: 00.000.000/0000-00
      const formatted = raw
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
      setSuDocument(formatted);
    }
  };

  // Sincroniza o modo de tela com a necessidade obrigatória de troca de senha
  useEffect(() => {
    if (user?.mustChangePassword) {
      setStep('CHANGE_PASSWORD');
    }
  }, [user?.mustChangePassword]);

  // Se já está logado e NÃO precisa trocar senha, não exibe o Gate (acesso liberado)
  if (user && !user.mustChangePassword) {
    return null;
  }

  // ── 1. SUBMIT LOGIN ─────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);

    try {
      const loggedUser = await login(email.trim().toLowerCase(), password);
      if (loggedUser?.mustChangePassword) {
        setStep('CHANGE_PASSWORD');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setBusy(false);
    }
  };

  // ── 2. SUBMIT CADASTRO (CRIAR CONTA) ────────────────────────
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanDoc = suDocument.replace(/\D/g, '');
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      setErrorMsg('Informe um CNPJ (14 dígitos) ou CPF (11 dígitos) válido.');
      return;
    }

    if (!suCompanyName.trim()) {
      setErrorMsg('Razão Social ou Nome da Empresa é obrigatório.');
      return;
    }

    if (!suName.trim()) {
      setErrorMsg('Nome do responsável é obrigatório.');
      return;
    }

    if (suPassword.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (suPassword !== suConfirmPassword) {
      setErrorMsg('A confirmação da senha não confere.');
      return;
    }

    setBusy(true);
    try {
      await signUp({
        name: suName.trim(),
        email: suEmail.trim().toLowerCase(),
        password: suPassword,
        document: cleanDoc,
        companyName: suCompanyName.trim().toUpperCase(),
        businessProfile: suProfileType,
      });

      setSuccessMsg('Conta criada com sucesso! Carregando seu ambiente fiscal...');
      setTimeout(() => {
        setStep('LOGIN');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao cadastrar empresa. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  // ── 3. SUBMIT ESQUECI MINHA SENHA ───────────────────────────
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotEmail.trim().includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }

    setBusy(true);
    try {
      const res = await forgotPassword(forgotEmail.trim().toLowerCase());
      setSuccessMsg(res.message || 'Instruções de recuperação enviadas para o seu e-mail.');
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setForgotTokenSent(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao solicitar recuperação de senha.');
    } finally {
      setBusy(false);
    }
  };

  // ── 3.1. SUBMIT REDEFINIÇÃO DE SENHA ────────────────────────
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (resetNewPassword.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!resetToken.trim()) {
      setErrorMsg('Token de recuperação não informado.');
      return;
    }

    setBusy(true);
    try {
      await resetPassword(forgotEmail.trim().toLowerCase(), resetToken.trim(), resetNewPassword);
      setSuccessMsg('Senha redefinida com sucesso! Você já pode entrar.');
      setTimeout(() => {
        setEmail(forgotEmail);
        setPassword('');
        setStep('LOGIN');
        setForgotTokenSent(false);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao redefinir senha com o token.');
    } finally {
      setBusy(false);
    }
  };

  // ── 4. SUBMIT TROCA OBRIGATÓRIA DE SENHA ────────────────────
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação da nova senha não confere.');
      return;
    }

    if (newPassword === '123456') {
      setErrorMsg('A nova senha não pode ser a senha temporária padrão (123456).');
      return;
    }

    setBusy(true);
    try {
      await changePassword(newPassword, password || undefined);
      setChangeSuccess(true);
      setSuccessMsg('Senha definitiva cadastrada com sucesso! Acessando ambiente fiscal...');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar senha.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex min-h-screen w-screen items-center justify-center overflow-y-auto bg-slate-950 p-4 sm:p-6 md:p-8 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-stretch my-auto">
        {/* Coluna Esquerda: Apresentação Corporativa IT2A Fiscal */}
        <div className="hidden md:flex flex-col justify-between rounded-3xl p-8 lg:p-10 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-2xl h-full min-h-[560px]">
          <div>
            {/* Logo & Marca */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="relative w-11 h-11 shrink-0">
                <Image
                  src="/logo_white.png"
                  alt="IT2A Enterprise"
                  fill
                  sizes="44px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase leading-tight">
                  Emissor Fiscal SaaS
                </h2>
                <p className="text-[10px] text-teal-400 font-extrabold uppercase tracking-[0.16em]">
                  IT2A ENTERPRISE CLOUD
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Plataforma autônoma de alta performance para faturamento de <strong>NF-e (55)</strong>, <strong>NFC-e (65)</strong> e <strong>NFS-e (Paulistana / Nacional)</strong>, com assinatura digital mTLS e inteligência artificial fiscal.
            </p>

            {/* Destaques Corporativos */}
            <div className="space-y-3">
              {/* 1. Ecossistema & API Gateway */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">API Gateway para o Ecossistema IT2A</h4>
                  <p className="text-[11px] text-slate-400">
                    Consumido via API Key REST pelo <strong>Gestor Financeiro</strong>, <strong>Gestor Veterinário</strong> e ERPs parceiros com contingência e mensageria.
                  </p>
                </div>
              </div>

              {/* 2. Multi-Empresas */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Multi-Empresas para Contadores</h4>
                  <p className="text-[11px] text-slate-400">
                    Gerencie múltiplos CNPJs clientes com isolamento total de dados e alternância de empresas em 1 clique.
                  </p>
                </div>
              </div>

              {/* 3. A1 mTLS */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Certificado Digital A1 mTLS</h4>
                  <p className="text-[11px] text-slate-400">
                    Assinatura digital XMLDSig e criptografia de ponta a ponta sem cobrança de tributos em homologação.
                  </p>
                </div>
              </div>

              {/* 4. IA Copilot */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Copilot Fiscal &amp; Reforma Tributária</h4>
                  <p className="text-[11px] text-slate-400">
                    Classificação automática de NCM/CFOP, diagnóstico de rejeições SEFAZ e projeção IBS/CBS.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé da Coluna Esquerda */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              SEFAZ SP &amp; Paulistana Online
            </span>
            <span className="font-mono text-slate-400">v1.2 SaaS Enterprise</span>
          </div>
        </div>

        {/* Coluna Direita: Card de Autenticação / Cadastro */}
        <div className="flex items-center justify-center w-full">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 md:p-9 shadow-2xl border border-slate-200 dark:border-slate-800 relative transition-all">
            {busy && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 animate-pulse rounded-t-3xl" />
            )}

            {/* Cabeçalho do Card com Título e Ícone */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-3">
                {step === 'LOGIN' && <Lock className="w-6 h-6" />}
                {step === 'SIGNUP' && <Building2 className="w-6 h-6" />}
                {step === 'FORGOT_PASSWORD' && <Mail className="w-6 h-6" />}
                {step === 'CHANGE_PASSWORD' && <KeyRound className="w-6 h-6" />}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {step === 'LOGIN' && 'Acessar Plataforma'}
                {step === 'SIGNUP' && 'Criar Nova Empresa'}
                {step === 'FORGOT_PASSWORD' && 'Recuperar Acesso'}
                {step === 'CHANGE_PASSWORD' && 'Troca de Senha Obrigatória'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {step === 'LOGIN' && 'Entre com suas credenciais corporativas'}
                {step === 'SIGNUP' && 'Cadastre sua empresa e comece a emitir notas fiscais'}
                {step === 'FORGOT_PASSWORD' && 'Redefina a senha de acesso da sua conta'}
                {step === 'CHANGE_PASSWORD' && 'Sua conta foi inicializada com a senha temporária (123456)'}
              </p>
            </div>

            {/* Alerta de Erro */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Alerta de Sucesso */}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ── 1. FORMULÁRIO DE LOGIN ────────────────────────────── */}
            {step === 'LOGIN' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    E-mail do Administrador / Contador
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      title={showPassword ? 'Ocultar Senha' : 'Ver Senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('abner.teles@it2a.com');
                      setPassword('123456');
                    }}
                    className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <span>⚡ Preencher Admin IT2A</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setForgotEmail(email);
                      setStep('FORGOT_PASSWORD');
                    }}
                    className="text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                {/* Botões de Ação */}
                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    {busy ? (
                      <span>Autenticando...</span>
                    ) : (
                      <>
                        <span>Acessar Emissor Fiscal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setStep('SIGNUP');
                    }}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-teal-500" />
                    <span>Criar Nova Conta / Empresa</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── 2. FORMULÁRIO DE CADASTRO (CRIAR CONTA) ────────────── */}
            {step === 'SIGNUP' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                {/* Seletor de Perfil: Empresa ou Contador */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSuProfileType('EMISSOR')}
                    className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      suProfileType === 'EMISSOR'
                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Empresa Emissora</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuProfileType('CONTADOR')}
                    className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      suProfileType === 'CONTADOR'
                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Contabilidade</span>
                  </button>
                </div>

                {/* Razão Social & Documento */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Razão Social / Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={suCompanyName}
                    onChange={(e) => setSuCompanyName(e.target.value)}
                    placeholder="MINHA EMPRESA LTDA"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CNPJ ou CPF
                    </label>
                    <input
                      type="text"
                      value={suDocument}
                      onChange={(e) => handleDocumentChange(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Responsável
                    </label>
                    <input
                      type="text"
                      value={suName}
                      onChange={(e) => setSuName(e.target.value)}
                      placeholder="Seu Nome Completo"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                {/* E-mail Corporativo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    placeholder="contato@minhaempresa.com.br"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                {/* Senha e Confirmação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showSuPassword ? 'text' : 'password'}
                        value={suPassword}
                        onChange={(e) => setSuPassword(e.target.value)}
                        placeholder="Mínimo 6 dígitos"
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-3.5 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSuPassword(!showSuPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showSuPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Confirmar Senha
                    </label>
                    <input
                      type={showSuPassword ? 'text' : 'password'}
                      value={suConfirmPassword}
                      onChange={(e) => setSuConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                {/* Medidor de Força de Senha */}
                {suPassword.length > 0 && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${(passStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      {strengthLabel}
                    </span>
                  </div>
                )}

                {/* Botões do Cadastro */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    {busy ? <span>Criando Conta...</span> : <span>Cadastrar &amp; Acessar</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setStep('LOGIN');
                    }}
                    className="w-full py-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Já possui uma conta? Voltar ao Login</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── 3. FORMULÁRIO DE RECUPERAÇÃO DE SENHA ──────────────── */}
            {step === 'FORGOT_PASSWORD' && (
              <div className="space-y-4">
                {!forgotTokenSent ? (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        E-mail Cadastrado
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="seu.email@empresa.com"
                          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                    >
                      {busy ? 'Enviando...' : 'Solicitar Redefinição'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-700 dark:text-teal-300">
                      Token gerado para <strong>{forgotEmail}</strong>. Cadastre sua nova senha abaixo:
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Nova Senha
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                    >
                      {busy ? 'Redefinindo...' : 'Salvar Nova Senha'}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setStep('LOGIN');
                  }}
                  className="w-full py-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-teal-600 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Login</span>
                </button>
              </div>
            )}

            {/* ── 4. FORMULÁRIO DE TROCA OBRIGATÓRIA DE SENHA ────────── */}
            {step === 'CHANGE_PASSWORD' && (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Por segurança, cadastre uma nova senha pessoal definitiva para o seu usuário.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nova Senha Definitiva
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {newPassword.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 px-1">
                      <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strengthColor}`}
                          style={{ width: `${(passStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  {busy ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Cadastrar Nova Senha &amp; Entrar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setStep('LOGIN');
                    setPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full py-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-500 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Sair e voltar ao login</span>
                </button>
              </form>
            )}

            {/* Footer do Card */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">
                IT2A Soluções Tecnológicas Ltda — CNPJ 65.280.654/0001-61
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
