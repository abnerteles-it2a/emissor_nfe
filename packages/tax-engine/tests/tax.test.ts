import { describe, it, expect } from 'vitest';
import { TaxRegime, processTaxEngine, calculateItemTaxes } from '../src';

describe('packages/tax-engine', () => {
  it('cálculo para Simples Nacional (sem destaque de ICMS na nota)', () => {
    const itemResult = calculateItemTaxes(
      {
        itemIndex: 1,
        ncm: '84713012',
        cfop: '5102',
        quantity: 1,
        unitValue: 100,
        totalValue: 100,
      },
      TaxRegime.SIMPLES_NACIONAL
    );

    expect(itemResult.csosn).toBe('102');
    expect(itemResult.valorIcms).toBe(0);
    expect(itemResult.valorPis).toBe(0);
    expect(itemResult.valorCofins).toBe(0);
  });

  it('cálculo para Regime Normal com ICMS/PIS/COFINS e suporte IBS/CBS', () => {
    const engineResult = processTaxEngine(
      [
        {
          itemIndex: 1,
          ncm: '84713012',
          cfop: '5102',
          quantity: 2,
          unitValue: 50,
          totalValue: 100,
        },
      ],
      TaxRegime.REGIME_NORMAL
    );

    expect(engineResult.totalProducts).toBe(100);
    expect(engineResult.totalIcms).toBe(18.0); // 18% SP
    expect(engineResult.totalPis).toBe(1.65); // 1.65%
    expect(engineResult.totalCofins).toBe(7.6); // 7.6%
    expect(engineResult.items[0].ibsCbsInfo).toBeDefined();
  });
});
