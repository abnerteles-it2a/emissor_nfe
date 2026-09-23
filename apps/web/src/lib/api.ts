export interface FiscalAttemptSummary {
  id: string;
  attemptNumber: number;
  status: 'SUCCESS' | 'REJECTED' | 'ERROR';
  sefazCode?: string;
  sefazMessage?: string;
  rawResponse?: string;
  durationMs: number;
  createdAt: string;
}

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
  rawPayload?: any;
  attempts?: FiscalAttemptSummary[];
}

export interface IssuePayloadInput {
  documentType: 'NFE' | 'NFSE';
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  natureOfOperation?: string;
  recipientName: string;
  recipientCpfCnpj: string;
  recipientUf?: string;
  recipientCity?: string;
  items: Array<{
    description: string;
    ncm: string;
    cfop: string;
    qty: number;
    unitPrice: number;
  }>;
  totalValue: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nfe.it2a.com';

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('it2a_access_token');
}

export function getStoredTenantId(): string {
  if (typeof window === 'undefined') return 'it2a-default-tenant';
  return localStorage.getItem('it2a_active_tenant_id') || 'it2a-default-tenant';
}

export function setStoredTenantId(tenantId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('it2a_active_tenant_id', tenantId);
  }
}

export function setStoredAuth(token: string, tenantId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('it2a_access_token', token);
    localStorage.setItem('it2a_active_tenant_id', tenantId);
  }
}

export function clearStoredAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('it2a_access_token');
    localStorage.removeItem('it2a_active_tenant_id');
  }
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'x-tenant-id': getStoredTenantId(),
  };
  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Consulta a lista oficial de documentos fiscais gravados no PostgreSQL
 */
export async function fetchFiscalDocuments(): Promise<FiscalDocumentSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/fiscal/documents`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Erro ao buscar documentos: ${res.statusText}`);
    }

    const data = await res.json();
    const list = Array.isArray(data) ? data : data.data || data.documents || [];
    
    // Normaliza os campos para exibição amigável
    return list.map((doc: any) => {
      const payload = doc.rawPayload || {};
      const calculatedTotal = Number(
        doc.totalValue ??
        payload.totalValue ??
        payload.items?.reduce((acc: number, i: any) => acc + (Number(i.quantity || i.qty || 1) * Number(i.unitValue || i.unitPrice || 0)), 0) ??
        0
      );

      return {
        ...doc,
        totalValue: calculatedTotal,
        recipientName: doc.recipientName || payload.recipientName || payload.customer?.name || payload.recipient?.name || 'Destinatário Homologação',
        recipientCpfCnpj: doc.recipientCpfCnpj || payload.recipientCpfCnpj || payload.customer?.cpfCnpj || payload.recipient?.cnpjOrCpf || '00.000.000/0001-91',
      };
    });
  } catch (err) {
    console.warn('API não conectada ou sem documentos, utilizando fallback local', err);
    return [];
  }
}

/**
 * Dispara a emissão de um novo documento fiscal via POST /v1/fiscal/documents
 */
export async function issueFiscalDocument(input: IssuePayloadInput): Promise<FiscalDocumentSummary> {
  const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `issue-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const body = {
    sourceSystem: 'emissor-portal',
    sourceDocumentId: `doc-${Date.now()}`,
    establishmentId: 'matriz-sp',
    documentType: input.documentType,
    environment: input.environment,
    natureOfOperation: input.natureOfOperation || (input.documentType === 'NFE' ? 'VENDA DE MERCADORIA' : 'PRESTACAO DE SERVICOS'),
    recipientName: input.recipientName,
    recipientCpfCnpj: input.recipientCpfCnpj,
    totalValue: input.totalValue,
    items: input.items.map((i, idx) => ({
      code: `ITEM-${idx + 1}`,
      description: i.description,
      quantity: Number(i.qty),
      unitValue: Number(i.unitPrice),
      total: Number(i.qty) * Number(i.unitPrice),
      ncm: i.ncm,
      cfop: i.cfop,
    })),
  };

  const res = await fetch(`${API_BASE_URL}/v1/fiscal/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na API: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Consulta o status de um documento específico pelo ID
 */
export async function getFiscalDocument(id: string): Promise<FiscalDocumentSummary> {
  const res = await fetch(`${API_BASE_URL}/v1/fiscal/documents/${id}`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Erro ao consultar documento ${id}`);
  }

  return res.json();
}

/**
 * Faz polling do documento até que o processamento pelo Worker/SEFAZ finalize
 */
export async function pollFiscalDocument(
  id: string,
  maxAttempts = 20,
  intervalMs = 1200
): Promise<FiscalDocumentSummary> {
  let doc = await getFiscalDocument(id);

  for (let i = 0; i < maxAttempts; i++) {
    if (doc.status !== 'RECEIVED' && doc.status !== 'PROCESSING') {
      return doc;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    doc = await getFiscalDocument(id);
  }

  return doc;
}

/**
 * Recupera o XML bruto ou autorizado do documento
 */
export async function getFiscalDocumentXml(id: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/v1/fiscal/documents/${id}/xml`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('XML não encontrado ou ainda em processamento');
  }

  return res.text();
}

// ── Auth & IAM Endpoints ─────────────────────────────────────

export async function loginUserApi(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Falha ao realizar login');
  }
  return data;
}

export async function changePasswordApi(newPassword: string, currentPassword?: string) {
  const res = await fetch(`${API_BASE_URL}/v1/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ newPassword, currentPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Falha ao alterar senha');
  }
  return data;
}

export async function fetchMeApi() {
  const res = await fetch(`${API_BASE_URL}/v1/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Não autenticado');
  return res.json();
}

export async function fetchMyTenantsApi() {
  const res = await fetch(`${API_BASE_URL}/v1/iam/my-tenants`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Falha ao listar empresas do usuário');
  return res.json();
}

export async function switchTenantApi(targetTenantId: string) {
  const res = await fetch(`${API_BASE_URL}/v1/iam/switch-tenant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ targetTenantId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Falha ao alternar empresa');
  }
  return data;
}

export async function fetchSubscriptionUsageApi() {
  const res = await fetch(`${API_BASE_URL}/v1/subscription/usage`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function createTenantApi(name: string, document: string, role = 'ACCOUNTANT') {
  const res = await fetch(`${API_BASE_URL}/v1/iam/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name, document, role }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Falha ao cadastrar empresa');
  }
  return data;
}


