import { TaxRegime, type TaxInputItem, type TaxItemResult, type TaxEngineResult } from './types.js';

export function calculateItemTaxes(item: TaxInputItem, regime: TaxRegime): TaxItemResult {
  const totalValue = item.totalValue;

  if (regime === TaxRegime.SIMPLES_NACIONAL) {
    // Simples Nacional: tributação unificada via PGDAS (CSOSN 102 sem destaque de ICMS na nota)
    return {
      itemIndex: item.itemIndex,
      origem: '0',
      csosn: '102',
      baseIcms: 0,
      aliquotaIcms: 0,
      valorIcms: 0,
      cstPis: '07', // Operação Isenta / Sem Incidência
      basePis: 0,
      aliquotaPis: 0,
      valorPis: 0,
      cstCofins: '07',
      baseCofins: 0,
      aliquotaCofins: 0,
      valorCofins: 0,
    };
  }

  // Regime Normal (Lucro Presumido ou Real)
  const aliquotaIcms = item.customRateIcms ?? 18.0; // Alíquota padrão interna SP
  const valorIcms = Number(((totalValue * aliquotaIcms) / 100).toFixed(2));

  const aliquotaPis = item.customRatePis ?? 1.65;
  const valorPis = Number(((totalValue * aliquotaPis) / 100).toFixed(2));

  const aliquotaCofins = item.customRateCofins ?? 7.6;
  const valorCofins = Number(((totalValue * aliquotaCofins) / 100).toFixed(2));

  return {
    itemIndex: item.itemIndex,
    origem: '0',
    cstIcms: '00', // Tributada integralmente
    baseIcms: totalValue,
    aliquotaIcms,
    valorIcms,
    cstPis: '01', // Operação Tributável
    basePis: totalValue,
    aliquotaPis,
    valorPis,
    cstCofins: '01',
    baseCofins: totalValue,
    aliquotaCofins,
    valorCofins,
    ibsCbsInfo: {
      cstIbsCbs: '01',
      cClassTrib: '000000',
      aliquotaIbs: 0.1, // Testes alíquota teste transição
      valorIbs: Number(((totalValue * 0.1) / 100).toFixed(2)),
      aliquotaCbs: 0.9,
      valorCbs: Number(((totalValue * 0.9) / 100).toFixed(2)),
    },
  };
}

export function processTaxEngine(items: TaxInputItem[], regime: TaxRegime): TaxEngineResult {
  let totalProducts = 0;
  let totalIcms = 0;
  let totalPis = 0;
  let totalCofins = 0;
  let totalIbs = 0;
  let totalCbs = 0;

  const itemResults = items.map((item) => {
    totalProducts += item.totalValue;
    const res = calculateItemTaxes(item, regime);
    totalIcms += res.valorIcms;
    totalPis += res.valorPis;
    totalCofins += res.valorCofins;
    if (res.ibsCbsInfo) {
      totalIbs += res.ibsCbsInfo.valorIbs;
      totalCbs += res.ibsCbsInfo.valorCbs;
    }
    return res;
  });

  return {
    regime,
    totalProducts: Number(totalProducts.toFixed(2)),
    totalIcms: Number(totalIcms.toFixed(2)),
    totalPis: Number(totalPis.toFixed(2)),
    totalCofins: Number(totalCofins.toFixed(2)),
    totalIbs: Number(totalIbs.toFixed(2)),
    totalCbs: Number(totalCbs.toFixed(2)),
    items: itemResults,
  };
}
