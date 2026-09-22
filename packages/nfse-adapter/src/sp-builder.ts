import { signRpsString } from '@fiscal/crypto';

export type NfsePrestador = {
  cnpj: string;
  ccm: string; // Inscrição Municipal (8 dígitos)
  razaoSocial?: string;
  codigoServico: string; // 5 dígitos (ex: '02935' ou '02660')
  aliquota: number; // Ex: 0.029 (2,9%)
  tributacao?: 'T' | 'F' | 'I' | 'J'; // T = Tributado em SP
};

export type NfseTomador = {
  cnpjCpf: string;
  razaoSocial: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
};

export type NfseServico = {
  discriminacao: string;
  valorServicos: number;
  valorDeducoes?: number;
  issRetido?: boolean;
  valorPis?: number;
  valorCofins?: number;
  valorInss?: number;
  valorIr?: number;
  valorCsll?: number;
};

export type BuildRpsInput = {
  serie: string;
  numero: number;
  dataEmissao?: Date;
  prestador: NfsePrestador;
  tomador: NfseTomador;
  servico: NfseServico;
  privateKeyPem: string;
};

/**
 * Monta a cadeia oficial de exatamente 86 posições para a assinatura do RPS em São Paulo
 */
export function buildRps86String(params: {
  ccmPrestador: string;
  serieRps: string;
  numeroRps: number;
  dataEmissao: string; // AAAAMMDD
  tributacao: 'T' | 'F' | 'I' | 'J';
  status: 'N' | 'C' | 'E';
  issRetido: boolean;
  valorServicos: number;
  valorDeducoes: number;
  codigoServico: string;
  tomadorCnpjCpf: string;
}): string {
  const padZero = (v: string | number, len: number) => String(v).replace(/\D/g, '').padStart(len, '0');
  const padSpace = (v: string, len: number) => v.padEnd(len, ' ').slice(0, len);

  const ccm = padZero(params.ccmPrestador, 8);
  const serie = padSpace(params.serieRps, 5);
  const numero = padZero(params.numeroRps, 12);
  const data = params.dataEmissao.replace(/\D/g, '').slice(0, 8);
  const trib = params.tributacao;
  const status = params.status;
  const retido = params.issRetido ? 'S' : 'N';
  const vServ = padZero(Math.round(params.valorServicos * 100), 15);
  const vDed = padZero(Math.round(params.valorDeducoes * 100), 15);
  const codServ = padZero(params.codigoServico, 5);

  const cleanDoc = params.tomadorCnpjCpf.replace(/\D/g, '');
  const tipoDoc = cleanDoc.length === 11 ? '1' : cleanDoc.length === 14 ? '2' : '3';
  const docTomador = padZero(cleanDoc, 14);

  const rps86 = `${ccm}${serie}${numero}${data}${trib}${status}${retido}${vServ}${vDed}${codServ}${tipoDoc}${docTomador}`;

  if (rps86.length !== 86) {
    throw new Error(`Cadeia do RPS inválida: esperados 86 caracteres, obtidos ${rps86.length} ("${rps86}")`);
  }

  return rps86;
}

/**
 * Constrói o XML do PedidoEnvioLoteRPS (Prefeitura de São Paulo) pronto para assinatura XMLDSig
 */
export function buildPedidoEnvioLoteRpsXml(input: BuildRpsInput): { xml: string; rps86: string; assinaturaRps: string } {
  const now = input.dataEmissao ?? new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dataIso = `${yyyy}-${mm}-${dd}`;
  const dataCompacta = `${yyyy}${mm}${dd}`;

  const valorServicos = input.servico.valorServicos;
  const valorDeducoes = input.servico.valorDeducoes ?? 0;
  const tributacao = input.prestador.tributacao ?? 'T';
  const issRetido = input.servico.issRetido ?? false;

  const rps86 = buildRps86String({
    ccmPrestador: input.prestador.ccm,
    serieRps: input.serie,
    numeroRps: input.numero,
    dataEmissao: dataCompacta,
    tributacao,
    status: 'N',
    issRetido,
    valorServicos,
    valorDeducoes,
    codigoServico: input.prestador.codigoServico,
    tomadorCnpjCpf: input.tomador.cnpjCpf,
  });

  const assinaturaRps = signRpsString(rps86, input.privateKeyPem);

  const cleanDoc = input.tomador.cnpjCpf.replace(/\D/g, '');
  const docTomadorTag = cleanDoc.length === 11
    ? `<CPF>${cleanDoc}</CPF>`
    : `<CNPJ>${cleanDoc}</CNPJ>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<PedidoEnvioLoteRPS xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${input.prestador.cnpj.replace(/\D/g, '')}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>false</transacao>
    <dtInicio>${dataIso}</dtInicio>
    <dtFim>${dataIso}</dtFim>
    <QtdRPS>1</QtdRPS>
    <ValorTotalServicos>${valorServicos.toFixed(2)}</ValorTotalServicos>
    <ValorTotalDeducoes>${valorDeducoes.toFixed(2)}</ValorTotalDeducoes>
  </Cabecalho>
  <RPS xmlns="">
    <Assinatura>${assinaturaRps}</Assinatura>
    <ChaveRPS>
      <InscricaoPrestador>${String(input.prestador.ccm).replace(/\D/g, '').padStart(8, '0')}</InscricaoPrestador>
      <SerieRPS>${input.serie.padEnd(5, ' ').slice(0, 5)}</SerieRPS>
      <NumeroRPS>${input.numero}</NumeroRPS>
    </ChaveRPS>
    <TipoRPS>RPS</TipoRPS>
    <DataEmissao>${dataIso}</DataEmissao>
    <StatusRPS>N</StatusRPS>
    <TributacaoRPS>${tributacao}</TributacaoRPS>
    <ValorServicos>${valorServicos.toFixed(2)}</ValorServicos>
    <ValorDeducoes>${valorDeducoes.toFixed(2)}</ValorDeducoes>
    <ValorPIS>${(input.servico.valorPis ?? 0).toFixed(2)}</ValorPIS>
    <ValorCOFINS>${(input.servico.valorCofins ?? 0).toFixed(2)}</ValorCOFINS>
    <ValorINSS>${(input.servico.valorInss ?? 0).toFixed(2)}</ValorINSS>
    <ValorIR>${(input.servico.valorIr ?? 0).toFixed(2)}</ValorIR>
    <ValorCSLL>${(input.servico.valorCsll ?? 0).toFixed(2)}</ValorCSLL>
    <CodigoServico>${String(input.prestador.codigoServico).replace(/\D/g, '').padStart(5, '0')}</CodigoServico>
    <AliquotaServicos>${input.prestador.aliquota.toFixed(4)}</AliquotaServicos>
    <ISSRetido>${issRetido ? 'true' : 'false'}</ISSRetido>
    <CPFCNPJTomador>
      ${docTomadorTag}
    </CPFCNPJTomador>
    <RazaoSocialTomador>${input.tomador.razaoSocial}</RazaoSocialTomador>
    <Discriminacao>${input.servico.discriminacao}</Discriminacao>
  </RPS>
</PedidoEnvioLoteRPS>`;

  const cleanXml = xml.replace(/>\s+</g, '><').trim();

  return { xml: cleanXml, rps86, assinaturaRps };
}
