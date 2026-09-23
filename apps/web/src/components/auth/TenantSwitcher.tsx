'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus, Shield, Search } from 'lucide-react';
import { useAuth, TenantInfo } from './AuthContext';

export const TenantSwitcher: React.FC = () => {
  const { activeTenant, tenants, switchTenant, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.document.includes(searchTerm)
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">Proprietário</span>;
      case 'ACCOUNTANT':
        return <span className="text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded font-bold">Contador</span>;
      case 'ADMIN':
        return <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold">Admin</span>;
      default:
        return <span className="text-[9px] bg-slate-500/10 text-slate-400 border border-slate-500/20 px-1.5 py-0.5 rounded font-bold">Operador</span>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de Seleção de Empresa Ativa */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full flex items-center justify-between gap-2.5 p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all text-left shadow-sm group"
        title="Alternar Empresa / Cliente"
      >
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
          <Building2 className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="block font-bold text-white text-xs truncate">
              {activeTenant?.name || 'Selecione a Empresa'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
            <span className="font-mono">{activeTenant?.document || '00.000.000/0001-00'}</span>
            <span>•</span>
            {activeTenant?.role ? getRoleBadge(activeTenant.role) : null}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-teal-400' : ''
          }`}
        />
      </button>

      {/* Dropdown de Empresas para o Contador */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {/* Header do Menu */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Minhas Empresas ({tenants.length})
              </span>
              <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Painel do Contador
              </span>
            </div>

            {/* Input de Busca */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou CNPJ..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de Empresas */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
            {filteredTenants.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Nenhuma empresa encontrada com este filtro.
              </div>
            ) : (
              filteredTenants.map((tenant) => {
                const isSelected = tenant.id === activeTenant?.id;
                return (
                  <button
                    key={tenant.id}
                    onClick={() => {
                      switchTenant(tenant.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-800/60 transition-colors ${
                      isSelected ? 'bg-teal-500/10' : ''
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isSelected ? 'text-teal-300' : 'text-slate-200'
                          }`}
                        >
                          {tenant.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400">
                          {tenant.document}
                        </span>
                        {getRoleBadge(tenant.role)}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer: Adicionar Nova Empresa (Contador) */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/80">
            <button
              onClick={() => {
                setIsOpen(false);
                alert('A tela de cadastro de novos clientes para o contador foi aberta em Configurações > Empresas.');
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Nova Empresa Cliente</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
