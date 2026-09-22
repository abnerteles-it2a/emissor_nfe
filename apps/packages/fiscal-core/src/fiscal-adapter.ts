export interface FiscalAdapter {
  validate(input: FiscalDocumentInput): Promise<ValidationResult>;
  issue(input: FiscalDocumentInput): Promise<IssueResult>;
  consult(input: ConsultInput): Promise<ConsultResult>;
  cancel(input: CancelInput): Promise<EventResult>;
  inutilize(input: InutilizationInput): Promise<EventResult>;
  getFiles(input: GetFilesInput): Promise<FiscalFiles>;
}

export interface FiscalDocumentInput {
  tenantId: string;
  establishmentId: string;
  documentType: 'NFE' | 'NFCE' | 'NFSE';
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  payload: unknown;
  idempotencyKey: string;
  series: number;
  number?: number;
}

export interface ValidationResult {
  ok: boolean;
  errors?: Array<{ code: string; message: string; path?: string }>;
  normalized?: unknown;
}

export interface IssueResult {
  status: 'AUTHORIZED' | 'REJECTED' | 'QUEUED' | 'UNKNOWN' | 'AWAITING_CONSULTATION';
  accessKey?: string;
  protocol?: string;
  rawResponse?: unknown;
  errors?: Array<{ code: string; message: string }>;
}

export interface ConsultInput {
  accessKey: string;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
}

export interface ConsultResult {
  status:
    | 'AUTHORIZED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'UNKNOWN'
    | 'AWAITING_CONSULTATION'
    | 'NOT_FOUND';
  protocol?: string;
  rawResponse?: unknown;
  errors?: Array<{ code: string; message: string }>;
}

export interface CancelInput {
  accessKey: string;
  justification: string;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
}

export interface InutilizationInput {
  series: number;
  numberStart: number;
  numberEnd: number;
  justification: string;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
}

export interface EventResult {
  status: 'CANCELLED' | 'REJECTED' | 'UNKNOWN' | 'AWAITING_CONSULTATION';
  protocol?: string;
  rawResponse?: unknown;
  errors?: Array<{ code: string; message: string }>;
}

export interface GetFilesInput {
  accessKey: string;
}

export interface FiscalFiles {
  signedXml?: Buffer;
  authorizedXml?: Buffer;
  pdf?: Buffer;
}
