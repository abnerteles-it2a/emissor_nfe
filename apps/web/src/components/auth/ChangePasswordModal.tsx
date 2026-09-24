'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from './AuthContext';

export const ChangePasswordModal: React.FC = () => {
  const { user, showPasswordChangeModal, setShowPasswordChangeModal, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showPasswordChangeModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha não confere com a nova senha digitada.');
      return;
    }

    if (newPassword === '123456') {
      setError('A nova senha não pode ser a senha temporária (123456). Escolha uma senha segura.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(newPassword, currentPassword);
      setSuccess('Senha alterada com sucesso! Seu acesso está protegido.');
      setTimeout(() => {
        setShowPasswordChangeModal(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha. Verifique os dados informados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Troca de Senha Obrigatória
              </h3>
              <p className="text-slate-400 text-xs">
                {user?.email || 'abner.teles@it2a.com'}
              </p>
            </div>
          </div>

          {!user?.mustChangePassword && (
            <button
              onClick={() => setShowPasswordChangeModal(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Informative Alert */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Sua conta foi inicializada com a senha temporária padrão (<strong>123456</strong>). Por segurança, por favor cadastre uma nova senha pessoal para continuar.
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex gap-2 items-center">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Senha Atual / Temporária
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Senha atual (ex: 123456)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Cadastrar Nova Senha</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
