import https from 'node:https';
import type { IssueResult, ConsultResult, EventResult } from '@fiscal/fiscal-core';

export type SefazClientConfig = {
  nfeUrl: string;
  consultaUrl: string;
  statusServicoUrl?: string;
  certPfxBase64: string;
  certPassword: string;
};

export type SefazEnvironment = 'HOMOLOGATION' | 'PRODUCTION';

/**
 * Cliente SOAP mTLS para SEFAZ SP.
 * Usa o certificado A1 tanto para autenticação TLS quanto para assinatura do XML.
 */
export class SefazClient {
  private readonly config: SefazClientConfig;

  constructor(config: SefazClientConfig) {
    this.config = config;
  }

  private buildAgent(environment?: string): https.Agent {
    const pfxBuffer = Buffer.from(this.config.certPfxBase64, 'base64');
    // ICP-Brasil chain is not in Node.js default bundle.
    // In homologation we accept it; in production use --use-openssl-ca or a custom CA bundle.
    const rejectUnauthorized = environment === 'PRODUCTION';
    return new https.Agent({
      pfx: pfxBuffer,
      passphrase: this.config.certPassword,
      rejectUnauthorized,
    });
  }

  private buildAuthorizationEnvelope(signedXml: string, _accessKey: string, _environment: SefazEnvironment): string {
    const cleanSignedXml = signedXml.replace(/<\?xml[^>]*\?>/g, '').replace(/>\s+</g, '><').trim();
    return `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${Date.now()}</idLote><indSinc>1</indSinc>${cleanSignedXml}</enviNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
  }

  private async postSoap(url: string, envelope: string, soapAction: string, environment?: string): Promise<string> {
    const agent = this.buildAgent(environment);
    const body = Buffer.from(envelope, 'utf8');

    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const req = https.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || 443,
          path: urlObj.pathname,
          method: 'POST',
          agent,
          headers: {
            'Content-Type': `application/soap+xml; charset=utf-8; action="${soapAction}"`,
            'Content-Length': body.byteLength,
            'Accept-Encoding': 'identity',
          },
          timeout: 30_000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            const responseText = Buffer.concat(chunks).toString('utf8');
            resolve(responseText);
          });
        },
      );

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('SEFAZ_TIMEOUT')); });
      req.write(body);
      req.end();
    });
  }

  /** Extrai o valor de uma tag XML simples */
  private extractTag(xml: string, tag: string): string | undefined {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`));
    return match?.[1];
  }

  /** Consulta o status operacional do WebService da SEFAZ */
  async checkStatus(environment: SefazEnvironment = 'HOMOLOGATION', ufCode = '35'): Promise<{ status: 'ONLINE' | 'OFFLINE'; cStat?: string; xMotivo?: string; rawResponse: string }> {
    const tpAmb = environment === 'PRODUCTION' ? '1' : '2';
    const envelope = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4"><consStatServ versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe"><tpAmb>${tpAmb}</tpAmb><cUF>${ufCode}</cUF><xServ>STATUS</xServ></consStatServ></nfeDadosMsg></soap12:Body></soap12:Envelope>`;

    const url = this.config.statusServicoUrl ?? (environment === 'PRODUCTION'
      ? 'https://nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx'
      : 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx');

    const rawResponse = await this.postSoap(
      url,
      envelope,
      'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4/nfeStatusServicoNF',
      environment,
    );

    const cStat = this.extractTag(rawResponse, 'cStat');
    const xMotivo = this.extractTag(rawResponse, 'xMotivo');

    return {
      status: cStat === '107' ? 'ONLINE' : 'OFFLINE',
      cStat,
      xMotivo,
      rawResponse,
    };
  }

  async authorize(signedXml: string, accessKey: string, environment: SefazEnvironment): Promise<IssueResult> {
    const envelope = this.buildAuthorizationEnvelope(signedXml, accessKey, environment);

    let rawResponse: string;
    try {
      rawResponse = await this.postSoap(
        this.config.nfeUrl,
        envelope,
        'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote',
        environment,
      );
    } catch (err) {
      return {
        status: 'UNKNOWN',
        errors: [{ code: 'TRANSPORT_ERROR', message: String(err) }],
      };
    }

    const cStat = this.extractTag(rawResponse, 'cStat');
    const xMotivo = this.extractTag(rawResponse, 'xMotivo');
    const nProt = this.extractTag(rawResponse, 'nProt');
    const chNFe = this.extractTag(rawResponse, 'chNFe');

    // Em envio síncrono (indSinc=1), o lote retorna cStat 104 (Lote processado)
    // e o resultado real da nota está dentro de <protNFe><infProt>
    const infProtMatch = rawResponse.match(/<infProt[^>]*>([\s\S]*?)<\/infProt>/);
    let finalStat = cStat;
    let finalMotivo = xMotivo;
    let finalProt = nProt;
    let finalChave = chNFe;

    if (infProtMatch) {
      const protXml = infProtMatch[1];
      finalStat = this.extractTag(protXml, 'cStat') ?? cStat;
      finalMotivo = this.extractTag(protXml, 'xMotivo') ?? xMotivo;
      finalProt = this.extractTag(protXml, 'nProt') ?? nProt;
      finalChave = this.extractTag(protXml, 'chNFe') ?? chNFe;
    }

    // cStat 100 = Autorizado o uso da NF-e
    if (finalStat === '100') {
      return {
        status: 'AUTHORIZED',
        accessKey: finalChave ?? accessKey,
        protocol: finalProt,
        rawResponse,
      };
    }

    if (cStat === '104' && !infProtMatch) {
      return { status: 'AWAITING_CONSULTATION', accessKey, rawResponse };
    }

    // Rejeições SEFAZ
    return {
      status: 'REJECTED',
      accessKey: finalChave ?? accessKey,
      errors: [{ code: finalStat ?? 'UNKNOWN_STAT', message: finalMotivo ?? 'Resposta inesperada da SEFAZ' }],
      rawResponse,
    };
  }

  async consult(accessKey: string, environment: SefazEnvironment): Promise<ConsultResult> {
    const tpAmb = environment === 'PRODUCTION' ? '1' : '2';
    const envelope = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4"><consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>${tpAmb}</tpAmb><xServ>CONSULTAR</xServ><chNFe>${accessKey}</chNFe></consSitNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;

    let rawResponse: string;
    try {
      rawResponse = await this.postSoap(
        this.config.consultaUrl,
        envelope,
        'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF',
        environment,
      );
    } catch (err) {
      return { status: 'UNKNOWN', errors: [{ code: 'TRANSPORT_ERROR', message: String(err) }] };
    }

    const cStat = this.extractTag(rawResponse, 'cStat');
    const nProt = this.extractTag(rawResponse, 'nProt');

    if (cStat === '100') return { status: 'AUTHORIZED', protocol: nProt, rawResponse };
    if (cStat === '101') return { status: 'CANCELLED', protocol: nProt, rawResponse };
    if (cStat === '217') return { status: 'NOT_FOUND', rawResponse };

    return { status: 'UNKNOWN', rawResponse };
  }

  async cancel(accessKey: string, justification: string, environment: SefazEnvironment): Promise<EventResult> {
    // TODO P1: implementar cancelamento via NFeRecepcaoEvento4
    void accessKey; void justification; void environment;
    return { status: 'UNKNOWN', errors: [{ code: 'NOT_IMPLEMENTED', message: 'Cancelamento ainda não implementado' }] };
  }
}
