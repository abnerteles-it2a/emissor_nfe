import { Shield, KeyRound, Building, Server, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">Configurações & Certificados</h1>
        <p className="text-sm text-slate-400 mt-1">
          Parametrização fiscal do emitente, gestão de certificados digitais A1 e ambientes da SEFAZ.
        </p>
      </div>

      {/* Dados do Emitente */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Dados Cadastrais do Emitente</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Razão Social</label>
            <input
              type="text"
              readOnly
              value="IT2A TECNOLOGIA LTDA"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">CNPJ</label>
            <input
              type="text"
              readOnly
              value="65.280.654/0001-61"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Inscrição Municipal (CCM - SP)</label>
            <input
              type="text"
              readOnly
              value="01965530"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Código de Serviço Principal (NFS-e)</label>
            <input
              type="text"
              readOnly
              value="02935 (Alíquota 2,9%)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* Certificado Digital */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Certificado Digital A1 (ICP-Brasil)</h2>
              <p className="text-xs text-slate-400">Armazenado de forma criptografada para assinatura dos XMLs</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Válido até 06/03/2027
          </span>
        </div>

        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-2 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">Emissor:</span>
            <span className="font-medium text-slate-300">AC SyngularID Multipla v5 (ICP-Brasil)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Titular:</span>
            <span className="font-medium text-slate-300">IT2A TECNOLOGIA LTDA:65280654000161</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Algoritmo:</span>
            <span className="font-medium text-slate-300">RSA 2048 bits / SHA-256</span>
          </div>
        </div>
      </div>
    </div>
  );
}
