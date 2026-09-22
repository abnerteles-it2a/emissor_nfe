export interface FiscalDocumentSummary {
  id: string;
  tenantId: string;
  establishmentId: string;
  documentType: 'NFE' | 'NFCE' | 'NFSE';
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  status: 'RECEIVED' | 'PROCESSING' | 'AUTHORIZED' | 'REJECTED' | 'FAILED' | 'CANCELLED';
  accessKey?: string;
  protocol?: string;
  series?: number;
  number?: number;
  totalValue: number;
  recipientName?: string;
  recipientCpfCnpj?: string;
  createdAt: string;
  authorizedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchFiscalDocuments(): Promise<FiscalDocumentSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/fiscal/documents`, {
      headers: {
        'x-tenant-id': 'it2a-default-tenant',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Erro ao buscar documentos: ${res.statusText}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.documents || [];
  } catch (err) {
    console.warn('API não conectada ou sem documentos, utilizando fallback local', err);
    return [
      {
        id: 'doc-demo-001',
        tenantId: 'it2a',
        establishmentId: 'matriz-sp',
        documentType: 'NFE',
        environment: 'HOMOLOGATION',
        status: 'AUTHORIZED',
        accessKey: '35260365280654000161550010000000011839281723',
        protocol: '135260000123456',
        series: 1,
        number: 1,
        totalValue: 1500.0,
        recipientName: 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
        recipientCpfCnpj: '00.000.000/0001-91',
        createdAt: new Date().toISOString(),
        authorizedAt: new Date().toISOString(),
      },
      {
        id: 'doc-demo-002',
        tenantId: 'it2a',
        establishmentId: 'matriz-sp',
        documentType: 'NFSE',
        environment: 'HOMOLOGATION',
        status: 'AUTHORIZED',
        protocol: 'RPS-2026-0001',
        series: 1,
        number: 1,
        totalValue: 3200.0,
        recipientName: 'CLIENTE SERVICOS DE TECNOLOGIA LTDA',
        recipientCpfCnpj: '11.222.333/0001-44',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        authorizedAt: new Date(Date.now() - 3500000).toISOString(),
      },
    ];
  }
}
