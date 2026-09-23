import { describe, it, expect } from 'vitest';
import { FiscalAiGateway } from './gateway.js';

describe('FiscalAiGateway', () => {
  const gateway = new FiscalAiGateway();

  describe('Item Classification (Heuristic Fallback)', () => {
    it('should classify software SaaS as NFS-e with service code 02935 and ISS', async () => {
      const res = await gateway.classify({
        description: 'Licenciamento de software ERP em nuvem SaaS mensal',
        regime: 'SIMPLES_NACIONAL',
        uf: 'SP',
      });

      expect(res.documentType).toBe('NFSE');
      expect(res.isService).toBe(true);
      expect(res.serviceCode).toBe('02935');
      expect(res.cfop).toBe('0000');
      expect(res.ibsCbsSuggestion).toBeDefined();
    });

    it('should classify computer hardware as NF-e with NCM 8471 and CFOP 5102', async () => {
      const res = await gateway.classify({
        description: 'Notebook Dell Core i7 16GB RAM 512GB SSD',
        regime: 'SIMPLES_NACIONAL',
        uf: 'SP',
      });

      expect(res.documentType).toBe('NFE');
      expect(res.isService).toBe(false);
      expect(res.ncm).toBe('84713012');
      expect(res.cfop).toBe('5102');
    });

    it('should classify veterinary consultation as NFS-e with code 04146', async () => {
      const res = await gateway.classify({
        description: 'Consulta veterinária de rotina pet e vacina',
        regime: 'SIMPLES_NACIONAL',
        uf: 'SP',
      });

      expect(res.documentType).toBe('NFSE');
      expect(res.isService).toBe(true);
      expect(res.serviceCode).toBe('04146');
    });
  });

  describe('SEFAZ Rejection Diagnostics', () => {
    it('should explain cStat 204 (Duplicity) clearly in plain Portuguese and mark autoFixable', async () => {
      const explanation = await gateway.explainRejection({
        cStat: 204,
        sefazMessage: 'Rejeicao: Duplicidade de NF-e [chNFe: 35260900000000000100550010000010421000010420]',
      });

      expect(explanation.title).toContain('Duplicidade');
      expect(explanation.autoFixable).toBe(true);
      expect(explanation.recommendedAction).toContain('Incremente o número');
    });

    it('should explain cStat 209 (IE do destinatário) clearly with correction suggestion', async () => {
      const explanation = await gateway.explainRejection({
        cStat: 209,
        sefazMessage: 'Rejeicao: IE do destinatario nao informada',
      });

      expect(explanation.title).toContain('IE do destinatário');
      expect(explanation.autoFixable).toBe(true);
      expect(explanation.affectedFields).toContain('dest.IE');
    });
  });

  describe('Reforma Tributária (IBS/CBS Simulation)', () => {
    it('should calculate dual tax transition for items', async () => {
      const result = await gateway.simulateReforma({
        items: [
          { description: 'Licenciamento de Software', totalValue: 10000 },
          { description: 'Notebook Corporativo', totalValue: 5000 },
        ],
        regime: 'SIMPLES_NACIONAL',
      });

      expect(result.currentTotalTaxes).toBeGreaterThan(0);
      expect(result.reformaTotalTaxes).toBe(150); // (0.1% + 0.9%) of 15000 = 150
      expect(result.breakdown.ibs).toBe(15);
      expect(result.breakdown.cbs).toBe(135);
      expect(result.impactAnalysis).toContain('Simples Nacional');
    });
  });
});
