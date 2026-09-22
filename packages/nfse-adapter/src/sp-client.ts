import https from 'node:https';

export type SpClientConfig = {
  url?: string;
  certPfxBase64: string;
  certPassword: string;
};

export type SpLoteResult = {
  sucesso: boolean;
  numeroLote?: string;
  erros?: Array<{ codigo: string; descricao: string }>;
  alertas?: Array<{ codigo: string; descricao: string }>;
  rawResponse: string;
};

export class SpNfseClient {
  private readonly config: SpClientConfig;
  private readonly endpoint: string;

  constructor(config: SpClientConfig) {
    this.config = config;
    this.endpoint = config.url ?? 'https://nfews.prefeitura.sp.gov.br/lotenfe.asmx';
  }

  private buildAgent(): https.Agent {
    const pfxBuffer = Buffer.from(this.config.certPfxBase64, 'base64');
    return new https.Agent({
      pfx: pfxBuffer,
      passphrase: this.config.certPassword,
      rejectUnauthorized: false,
    });
  }

  private async postSoap(soapEnvelope: string, action: string): Promise<string> {
    const agent = this.buildAgent();
    const bodyBuffer = Buffer.from(soapEnvelope, 'utf8');
    const urlObj = new URL(this.endpoint);

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || 443,
          path: urlObj.pathname,
          method: 'POST',
          agent,
          headers: {
            'Content-Type': `application/soap+xml; charset=utf-8; action="${action}"`,
            'Content-Length': bodyBuffer.byteLength,
          },
          timeout: 30000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        }
      );

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('SP_NFSE_TIMEOUT')); });
      req.write(bodyBuffer);
      req.end();
    });
  }

  private parseResponse(rawResponse: string): SpLoteResult {
    const unescaped = rawResponse
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');

    const sucessoMatch = unescaped.match(/<Sucesso>([^<]+)<\/Sucesso>/);
    const sucesso = sucessoMatch?.[1] === 'true';
    const numeroLote = unescaped.match(/<NumeroLote>([^<]+)<\/NumeroLote>/)?.[1];

    const erros: Array<{ codigo: string; descricao: string }> = [];
    const errosMatches = unescaped.matchAll(/<Erro[^>]*>[\s\S]*?<Codigo>([^<]+)<\/Codigo>[\s\S]*?<Descricao>([^<]+)<\/Descricao>[\s\S]*?<\/Erro>/g);
    for (const [, codigo, descricao] of errosMatches) {
      erros.push({ codigo, descricao });
    }

    const alertas: Array<{ codigo: string; descricao: string }> = [];
    const alertasMatches = unescaped.matchAll(/<Alerta[^>]*>[\s\S]*?<Codigo>([^<]+)<\/Codigo>[\s\S]*?<Descricao>([^<]+)<\/Descricao>[\s\S]*?<\/Alerta>/g);
    for (const [, codigo, descricao] of alertasMatches) {
      alertas.push({ codigo, descricao });
    }

    return {
      sucesso,
      numeroLote,
      erros: erros.length > 0 ? erros : undefined,
      alertas: alertas.length > 0 ? alertas : undefined,
      rawResponse,
    };
  }

  /**
   * Envia o lote para o método de teste oficial da Prefeitura de São Paulo
   * (Valida regras cadastrais, certificado e assinatura sem gerar nota real).
   */
  async testeEnvioLote(signedLoteXml: string): Promise<SpLoteResult> {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><TesteEnvioLoteRPSRequest xmlns="http://www.prefeitura.sp.gov.br/nfe"><VersaoSchema>1</VersaoSchema><MensagemXML><![CDATA[${signedLoteXml}]]></MensagemXML></TesteEnvioLoteRPSRequest></soap12:Body></soap12:Envelope>`;

    const rawResponse = await this.postSoap(soapEnvelope, 'http://www.prefeitura.sp.gov.br/nfe/ws/testeenvio');
    return this.parseResponse(rawResponse);
  }

  /**
   * Envia o lote para emissão real de NFS-e na Prefeitura de São Paulo
   */
  async envioLote(signedLoteXml: string): Promise<SpLoteResult> {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><EnvioLoteRPSRequest xmlns="http://www.prefeitura.sp.gov.br/nfe"><VersaoSchema>1</VersaoSchema><MensagemXML><![CDATA[${signedLoteXml}]]></MensagemXML></EnvioLoteRPSRequest></soap12:Body></soap12:Envelope>`;

    const rawResponse = await this.postSoap(soapEnvelope, 'http://www.prefeitura.sp.gov.br/nfe/ws/envioloterps');
    return this.parseResponse(rawResponse);
  }
}
