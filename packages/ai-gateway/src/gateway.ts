import { AzureOpenAiClient, AzureOpenAiConfig } from './azure-openai.js';
import { FISCAL_KNOWLEDGE_RULES, SEFAZ_REJECTIONS_KNOWLEDGE } from './knowledge.js';
import {
  ClassificationInput,
  ClassificationOutput,
  RejectionExplanationInput,
  RejectionExplanationOutput,
  ReformaSimulationInput,
  ReformaSimulationOutput,
} from './types.js';

export class FiscalAiGateway {
  private azureClient: AzureOpenAiClient;

  constructor(config?: AzureOpenAiConfig) {
    this.azureClient = new AzureOpenAiClient(config);
  }

  /**
   * Intelligently classifies an item/service description into NCM, CFOP, CST, and document type.
   * Uses Azure OpenAI GPT-4o if configured, otherwise instantly falls back to the embedded fiscal rules engine.
   */
  public async classify(input: ClassificationInput): Promise<ClassificationOutput> {
    if (this.azureClient.isConfigured()) {
      try {
        return await this.azureClient.classifyItem(input);
      } catch (err) {
        console.warn('[FiscalAiGateway] Azure OpenAI call failed, falling back to local heuristic knowledge base:', err);
      }
    }

    return this.classifyWithLocalRules(input);
  }

  /**
   * Translates cryptic SEFAZ or Municipal rejection codes into clear Portuguese explanations and actions.
   */
  public async explainRejection(input: RejectionExplanationInput): Promise<RejectionExplanationOutput> {
    if (this.azureClient.isConfigured()) {
      try {
        return await this.azureClient.explainRejection(input);
      } catch (err) {
        console.warn('[FiscalAiGateway] Azure OpenAI call failed, falling back to SEFAZ knowledge dictionary:', err);
      }
    }

    const cStatStr = String(input.cStat).trim();
    if (SEFAZ_REJECTIONS_KNOWLEDGE[cStatStr]) {
      return SEFAZ_REJECTIONS_KNOWLEDGE[cStatStr];
    }

    // Generic fallback for unmapped rejection codes
    return {
      title: `Rejeição ${cStatStr ? `[cStat: ${cStatStr}]` : 'Fiscal'}`,
      plainExplanation: input.sefazMessage
        ? `A SEFAZ rejeitou o envio com a mensagem: "${input.sefazMessage}".`
        : 'O lote foi recusado pelo WebService autorizador devido a incompatibilidade cadastral ou de regras de validação da SEFAZ.',
      rootCause: 'Inconformidade entre os dados preenchidos e a regra de negócio exigida pela SEFAZ / Prefeitura.',
      recommendedAction: 'Verifique a consistência dos dados de emitente, destinatário e alíquotas dos itens na aba de conferência.',
      affectedFields: ['general'],
      autoFixable: false,
    };
  }

  /**
   * Simulates the financial and tax impact of the Reforma Tributária (EC 132/2023 - IBS/CBS)
   */
  public async simulateReforma(input: ReformaSimulationInput): Promise<ReformaSimulationOutput> {
    if (this.azureClient.isConfigured()) {
      try {
        return await this.azureClient.simulateReforma(input);
      } catch (err) {
        console.warn('[FiscalAiGateway] Azure OpenAI call failed, falling back to local tax formula:', err);
      }
    }

    const totalValue = input.items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const isSimples = input.regime?.toUpperCase().includes('SIMPLES') ?? true;

    let icms: number;
    let pis: number;
    let cofins: number;

    if (isSimples) {
      // Average Simples Nacional unified tax breakdown representation
      icms = Number((totalValue * 0.035).toFixed(2));
      pis = Number((totalValue * 0.005).toFixed(2));
      cofins = Number((totalValue * 0.015).toFixed(2));
    } else {
      icms = Number((totalValue * 0.18).toFixed(2));
      pis = Number((totalValue * 0.0165).toFixed(2));
      cofins = Number((totalValue * 0.076).toFixed(2));
    }

    const currentTotalTaxes = Number((icms + pis + cofins).toFixed(2));

    // Reforma 2026 Test Phase: IBS 0.1% + CBS 0.9%
    const ibs = Number((totalValue * 0.001).toFixed(2));
    const cbs = Number((totalValue * 0.009).toFixed(2));
    const reformaTotalTaxes = Number((ibs + cbs).toFixed(2));
    const differential = Number((reformaTotalTaxes - currentTotalTaxes).toFixed(2));

    const impactAnalysis = isSimples
      ? 'No Simples Nacional, sua empresa mantém o regime unificado até a transição definitiva, podendo optar pelo recolhimento de IBS/CBS fora da guia DAS para gerar créditos fiscais a clientes PJ B2B.'
      : 'No Regime Normal, a transição inicial em 2026 institui a alíquota-teste de 1,0% (0,9% CBS + 0,1% IBS) com direito a crédito financeiro integral sobre insumos e serviços tomados.';

    return {
      currentTotalTaxes,
      reformaTotalTaxes,
      differential,
      breakdown: {
        icms,
        pis,
        cofins,
        ibs,
        cbs,
      },
      impactAnalysis,
    };
  }

  private classifyWithLocalRules(input: ClassificationInput): ClassificationOutput {
    const normalize = (str: string) =>
      (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const text = normalize(input.description);

    for (const rule of FISCAL_KNOWLEDGE_RULES) {
      const match = rule.keywords.some(keyword => text.includes(normalize(keyword)));
      if (match) {
        return {
          ...rule.output,
          confidence: 'high',
        };
      }
    }

    // Check general service patterns
    const serviceKeywords = ['servico', 'consultoria', 'manutencao', 'reparo', 'treinamento', 'desenvolvimento', 'assessoria', 'honorarios', 'consulta'];
    const looksLikeService = serviceKeywords.some(kw => text.includes(normalize(kw)));

    if (looksLikeService) {
      return {
        documentType: 'NFSE',
        isService: true,
        ncm: '00000000',
        ncmDescription: 'Não aplicável (Serviço Municipal)',
        cfop: '0000',
        cfopDescription: 'Prestação de Serviço Municipal (ISS)',
        serviceCode: '02935',
        csosn: '102',
        cstIcms: '41',
        cstPis: '07',
        cstCofins: '07',
        confidence: 'medium',
        rationale: 'Identificada prestação de serviços com incidência de ISSQN municipal.',
        ibsCbsSuggestion: {
          cClassTrib: '010101',
          cstIbsCbs: '01',
          aliquotaIbs: 0.1,
          aliquotaCbs: 0.9,
        },
      };
    }

    // Default Merchandise (NF-e 5102 / 102)
    return {
      documentType: 'NFE',
      isService: false,
      ncm: '84713012',
      ncmDescription: 'Mercadorias para revenda geral / equipamentos',
      cfop: '5102',
      cfopDescription: 'Venda de mercadoria adquirida ou recebida de terceiros',
      csosn: '102',
      cstIcms: '00',
      cstPis: '01',
      cstCofins: '01',
      confidence: 'medium',
      rationale: 'Classificação padrão para comercialização de mercadorias no estado de SP.',
      ibsCbsSuggestion: {
        cClassTrib: '000000',
        cstIbsCbs: '01',
        aliquotaIbs: 0.1,
        aliquotaCbs: 0.9,
      },
    };
  }
}
