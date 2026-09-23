export type TaxRegime = 'SIMPLES_NACIONAL' | 'REGIME_NORMAL';

export interface ClassificationInput {
  description: string;
  regime?: TaxRegime | string;
  uf?: string;
  operationType?: 'VENDA' | 'SERVICO' | 'TRANSFERENCIA' | 'DEVOLUCAO';
}

export interface ClassificationOutput {
  documentType: 'NFE' | 'NFSE' | 'NFCE' | 'CTE';
  ncm: string;
  ncmDescription: string;
  cfop: string;
  cfopDescription: string;
  csosn?: string;
  cstIcms?: string;
  cstPis?: string;
  cstCofins?: string;
  serviceCode?: string;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  isService: boolean;
  ibsCbsSuggestion?: {
    cClassTrib: string;
    cstIbsCbs: string;
    aliquotaIbs: number;
    aliquotaCbs: number;
  };
}

export interface RejectionExplanationInput {
  cStat: string | number;
  sefazMessage: string;
  documentType?: string;
  rawPayload?: any;
}

export interface RejectionExplanationOutput {
  title: string;
  plainExplanation: string;
  rootCause: string;
  recommendedAction: string;
  affectedFields: string[];
  autoFixable: boolean;
  suggestedCorrection?: Record<string, any>;
}

export interface ReformaSimulationInput {
  items: Array<{
    description: string;
    totalValue: number;
    ncm?: string;
  }>;
  regime?: string;
}

export interface ReformaSimulationOutput {
  currentTotalTaxes: number;
  reformaTotalTaxes: number;
  differential: number;
  breakdown: {
    icms: number;
    pis: number;
    cofins: number;
    ibs: number;
    cbs: number;
  };
  impactAnalysis: string;
}
