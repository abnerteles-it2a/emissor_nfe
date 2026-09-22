import { describe, it, expect } from 'vitest';
import { buildRps86String } from '../src';

describe('packages/nfse-adapter', () => {
  it('montagem da cadeia de 86 caracteres do RPS para São Paulo', () => {
    const rps86 = buildRps86String({
      ccmPrestador: '01965530',
      serieRps: 'NF',
      numeroRps: 12345,
      dataEmissao: '20260920',
      tributacao: 'T',
      status: 'N',
      issRetido: false,
      valorServicos: 150.00,
      valorDeducoes: 0.00,
      codigoServico: '02935',
      tomadorCnpjCpf: '65280654000161',
    });

    expect(rps86.length).toBe(86);
    expect(rps86.startsWith('01965530')).toBe(true);
    expect(rps86.slice(8, 13)).toBe('NF   ');
    expect(rps86.slice(13, 25)).toBe('000000012345');
    expect(rps86.slice(25, 33)).toBe('20260920');
    expect(rps86.slice(33, 34)).toBe('T');
    expect(rps86.slice(34, 35)).toBe('N');
    expect(rps86.slice(35, 36)).toBe('N');
    expect(rps86.slice(36, 51)).toBe('000000000015000'); // R$ 150.00 em centavos (15 dígitos)
    expect(rps86.slice(51, 66)).toBe('000000000000000'); // R$ 0.00 deduções
    expect(rps86.slice(66, 71)).toBe('02935');           // Código serviço
    expect(rps86.slice(71, 72)).toBe('2');               // Tipo tomador (2 = CNPJ)
    expect(rps86.slice(72, 86)).toBe('65280654000161'); // CNPJ do tomador
  });
});
