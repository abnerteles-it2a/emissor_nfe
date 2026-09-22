import { describe, it, expect } from 'vitest';
import { generateAccessKey, calculateMod11, buildNFeXml } from '../src';

describe('packages/nfe-adapter', () => {
  it('cálculo do Dígito Verificador Módulo 11 da chave de acesso', () => {
    // Exemplo de chave base de 43 dígitos da SEFAZ SP
    const baseKey = '3526081234567800019555001000000001100000000';
    const dv = calculateMod11(baseKey);
    expect(typeof dv).toBe('number');
    expect(dv).toBeGreaterThanOrEqual(0);
    expect(dv).toBeLessThanOrEqual(9);
  });

  it('geração da chave de acesso completa de 44 dígitos', () => {
    const res = generateAccessKey({
      ufCode: '35',
      issueYearMonth: '2608',
      cnpj: '12345678000195',
      model: '55',
      series: 1,
      number: 1,
      emissionType: '1',
      randomCode: '00000001',
    });

    expect(res.accessKey.length).toBe(44);
    expect(res.accessKey.startsWith('3526081234567800019555001000000001100000001')).toBe(true);
  });

  it('construção do XML da NFe 4.00', () => {
    const res = buildNFeXml({
      accessKeyParams: {
        ufCode: '35',
        issueYearMonth: '2608',
        cnpj: '12345678000195',
        model: '55',
        series: 1,
        number: 1,
        emissionType: '1',
        randomCode: '00000001',
      },
      natureOfOperation: 'VENDA DE MERCADORIA',
      issuer: {
        cnpj: '12345678000195',
        name: 'EMPRESA TESTE LTDA',
        ie: '123456789',
        crt: '1',
        uf: 'SP',
        ufCode: '35',
        municipalityCode: '3550308',
        municipalityName: 'SAO PAULO',
        address: 'RUA TESTE',
        number: '100',
        neighborhood: 'CENTRO',
        cep: '01000000',
      },
      recipient: {
        cnpjCpf: '98765432000198',
        name: 'CLIENTE TESTE SA',
        uf: 'SP',
        municipalityCode: '3550308',
        municipalityName: 'SAO PAULO',
        address: 'AV PAULISTA',
        number: '1000',
        neighborhood: 'BELA VISTA',
        cep: '01310000',
      },
      items: [
        {
          number: 1,
          code: 'PROD001',
          description: 'PRODUTO EXEMPLE TESTE',
          ncm: '84713012',
          cfop: '5102',
          unit: 'UN',
          quantity: 2,
          unitValue: 50.0,
          totalValue: 100.0,
        },
      ],
      totalValue: 100.0,
    });

    expect(res.xml).toContain('<NFe xmlns="http://www.portalfiscal.inf.br/nfe">');
    expect(res.xml).toContain(`<infNFe Id="NFe${res.accessKey}" versao="4.00">`);
    expect(res.xml).toContain('<xProd>PRODUTO EXEMPLE TESTE</xProd>');
    expect(res.xml).toContain('<vNF>100.00</vNF>');
  });
});
