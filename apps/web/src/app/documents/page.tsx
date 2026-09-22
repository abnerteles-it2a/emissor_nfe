import { fetchFiscalDocuments } from '@/lib/api';
import { FileText, Download, Search, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

export const revalidate = 0;

export default async function DocumentsPage() {
  const documents = await fetchFiscalDocuments();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Documentos Fiscais</h1>
          <p className="text-sm text-slate-400 mt-1">
            Consulta completa de notas emitidas, status de autorização e download de XMLs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por chave ou CPF/CNPJ..."
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs uppercase font-medium text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-3">Documento</th>
              <th className="px-6 py-3">Destinatário</th>
              <th className="px-6 py-3">Valor Total</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Chave de Acesso</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${doc.documentType === 'NFE' ? 'text-sky-400' : 'text-emerald-400'}`} />
                    <div>
                      <span className="font-semibold text-white block">
                        {doc.documentType} #{doc.number || 1}
                      </span>
                      <span className="text-[11px] text-slate-500">Série {doc.series || 1}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="block font-medium text-slate-200">{doc.recipientName || 'Consumidor Final'}</span>
                  <span className="text-xs text-slate-500">{doc.recipientCpfCnpj || '000.000.000-00'}</span>
                </td>
                <td className="px-6 py-4 font-semibold text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(doc.totalValue)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    doc.status === 'AUTHORIZED' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {doc.status === 'AUTHORIZED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                  {doc.accessKey ? (
                    <span title={doc.accessKey} className="hover:text-emerald-400 cursor-pointer">
                      {doc.accessKey.slice(0, 18)}...{doc.accessKey.slice(-6)}
                    </span>
                  ) : (
                    doc.protocol || 'Aguardando'
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    XML
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
