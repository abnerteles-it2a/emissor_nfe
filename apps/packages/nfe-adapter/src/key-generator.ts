export type AccessKeyParams = {
  ufCode: string; // ex: '35' para SP
  issueYearMonth: string; // ex: '2608' (YYMM)
  cnpj: string; // 14 dígitos apenas números
  model: string; // '55' (NF-e) ou '65' (NFC-e)
  series: number; // ex: 1
  number: number; // ex: 1
  emissionType: string; // '1' (Normal)
  randomCode: string; // 8 dígitos (cNF)
};

export function calculateMod11(keyWithoutDv: string): number {
  const weights = [2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  let weightIdx = 0;

  for (let i = keyWithoutDv.length - 1; i >= 0; i--) {
    const digit = parseInt(keyWithoutDv.charAt(i), 10);
    sum += digit * weights[weightIdx];
    weightIdx = (weightIdx + 1) % weights.length;
  }

  const remainder = sum % 11;
  if (remainder === 0 || remainder === 1) {
    return 0;
  }
  return 11 - remainder;
}

export function generateAccessKey(params: AccessKeyParams): { accessKey: string; cDV: number } {
  const uf = params.ufCode.padStart(2, '0');
  const ym = params.issueYearMonth.padStart(4, '0');
  const cnpj = params.cnpj.replace(/\D/g, '').padStart(14, '0');
  const mod = params.model.padStart(2, '0');
  const serie = params.series.toString().padStart(3, '0');
  const nNF = params.number.toString().padStart(9, '0');
  const tpEmis = params.emissionType.padStart(1, '0');
  const cNF = params.randomCode.padStart(8, '0');

  const baseKey = `${uf}${ym}${cnpj}${mod}${serie}${nNF}${tpEmis}${cNF}`;
  if (baseKey.length !== 43) {
    throw new Error(`INVALID_BASE_KEY_LENGTH: Expected 43 chars, got ${baseKey.length}`);
  }

  const cDV = calculateMod11(baseKey);
  const accessKey = `${baseKey}${cDV}`;

  return { accessKey, cDV };
}
