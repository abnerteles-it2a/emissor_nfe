export enum TaxRegime {
  SIMPLES_NACIONAL = '1',
  SIMPLES_EXCESSO = '2',
  REGIME_NORMAL = '3',
}

export type TaxInputItem = {
  itemIndex: number;
  ncm: string;
  cfop: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  customRateIcms?: number;
  customRatePis?: number;
  customRateCofins?: number;
};

export type TaxItemResult = {
  itemIndex: number;
  origem: string;
  cstIcms?: string;
  csosn?: string;
  baseIcms: number;
  aliquotaIcms: number;
  valorIcms: number;
  cstPis: string;
  basePis: number;
  aliquotaPis: number;
  valorPis: number;
  cstCofins: string;
  baseCofins: number;
  aliquotaCofins: number;
  valorCofins: number;
  // Campos de transição da Reforma Tributária (IBS e CBS)
  ibsCbsInfo?: {
    cstIbsCbs: string;
    cClassTrib: string;
    aliquotaIbs: number;
    valorIbs: number;
    aliquotaCbs: number;
    valorCbs: number;
  };
};

export type TaxEngineResult = {
  regime: TaxRegime;
  totalProducts: number;
  totalIcms: number;
  totalPis: number;
  totalCofins: number;
  totalIbs: number;
  totalCbs: number;
  items: TaxItemResult[];
};
