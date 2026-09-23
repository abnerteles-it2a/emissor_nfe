import {
  ClassificationInput,
  ClassificationOutput,
  RejectionExplanationInput,
  RejectionExplanationOutput,
  ReformaSimulationInput,
  ReformaSimulationOutput,
} from './types.js';

export interface AzureOpenAiConfig {
  endpoint?: string;
  apiKey?: string;
  deployment?: string;
  apiVersion?: string;
}

export class AzureOpenAiClient {
  private endpoint: string;
  private apiKey: string;
  private deployment: string;
  private apiVersion: string;

  constructor(config?: AzureOpenAiConfig) {
    this.endpoint = (config?.endpoint || process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '');
    this.apiKey = config?.apiKey || process.env.AZURE_OPENAI_API_KEY || '';
    this.deployment = config?.deployment || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
    this.apiVersion = config?.apiVersion || process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
  }

  public isConfigured(): boolean {
    return Boolean(this.endpoint && this.apiKey);
  }

  private async callChatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Azure OpenAI returned empty response payload');
      }
      return content;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async classifyItem(input: ClassificationInput): Promise<ClassificationOutput> {
    const systemPrompt = `Você é um Auditor e Contador Fiscal Especialista em Tributação Brasileira (SEFAZ, NF-e 4.0, NFS-e Padrão Nacional/Paulistana, e Reforma Tributária EC 132/2023).
Classifique a descrição do produto ou serviço fornecida.
Responda EXCLUSIVAMENTE em formato JSON com o seguinte schema:
{
  "documentType": "NFE" | "NFSE" | "NFCE" | "CTE",
  "isService": boolean,
  "ncm": string (8 dígitos para mercadorias, "00000000" para serviços),
  "ncmDescription": string,
  "cfop": string (4 dígitos, ex: "5102", "0000"),
  "cfopDescription": string,
  "csosn": string (ex: "102", "500"),
  "cstIcms": string (ex: "00", "41"),
  "cstPis": string (ex: "01", "07"),
  "cstCofins": string (ex: "01", "07"),
  "serviceCode": string (código LC 116 ou Paulistana se for serviço),
  "confidence": "high" | "medium" | "low",
  "rationale": string (justificativa técnica clara),
  "ibsCbsSuggestion": {
    "cClassTrib": string,
    "cstIbsCbs": string,
    "aliquotaIbs": number,
    "aliquotaCbs": number
  }
}`;

    const userPrompt = `Classifique fiscalmente:
Descrição: "${input.description}"
Regime Tributário: ${input.regime || 'SIMPLES_NACIONAL'}
UF: ${input.uf || 'SP'}
Tipo de Operação: ${input.operationType || 'VENDA'}`;

    const raw = await this.callChatCompletion(systemPrompt, userPrompt);
    return JSON.parse(raw) as ClassificationOutput;
  }

  public async explainRejection(input: RejectionExplanationInput): Promise<RejectionExplanationOutput> {
    const systemPrompt = `Você é um Analista de Suporte Fiscal de Nível 3 para emissores de notas fiscais (SEFAZ / Prefeituras).
Explique o erro ou rejeição fiscal em português claro e didático para um operador de faturamento, apontando a causa raiz e o passo a passo de correção.
Responda EXCLUSIVAMENTE em formato JSON com o seguinte schema:
{
  "title": string,
  "plainExplanation": string (explicação simples sem jargões confusos),
  "rootCause": string,
  "recommendedAction": string (passo a passo para consertar no formulário),
  "affectedFields": string[] (campos do formulário ou XML afetados),
  "autoFixable": boolean,
  "suggestedCorrection": object (opcional com valores sugeridos)
}`;

    const userPrompt = `Rejeição Recebida:
Código de Status (cStat): ${input.cStat}
Mensagem Original da SEFAZ: "${input.sefazMessage}"
Tipo de Documento: ${input.documentType || 'NFE'}
Payload (se houver): ${JSON.stringify(input.rawPayload || {})}`;

    const raw = await this.callChatCompletion(systemPrompt, userPrompt);
    return JSON.parse(raw) as RejectionExplanationOutput;
  }

  public async simulateReforma(input: ReformaSimulationInput): Promise<ReformaSimulationOutput> {
    const systemPrompt = `Você é um Consultor Tributário especialista na Reforma Tributária sobre o Consumo (EC 132/2023 - CBS / IBS).
Calcule e compare a carga tributária atual (ICMS/PIS/COFINS/ISS) versus a nova sistemática (IBS estadual/municipal + CBS federal).
Responda EXCLUSIVAMENTE em formato JSON com o seguinte schema:
{
  "currentTotalTaxes": number,
  "reformaTotalTaxes": number,
  "differential": number,
  "breakdown": {
    "icms": number,
    "pis": number,
    "cofins": number,
    "ibs": number,
    "cbs": number
  },
  "impactAnalysis": string
}`;

    const userPrompt = `Simule a Reforma Tributária para os itens:
${JSON.stringify(input.items, null, 2)}
Regime: ${input.regime || 'SIMPLES_NACIONAL'}`;

    const raw = await this.callChatCompletion(systemPrompt, userPrompt);
    return JSON.parse(raw) as ReformaSimulationOutput;
  }
}
