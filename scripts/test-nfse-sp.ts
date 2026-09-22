/**
 * Script de teste de NFS-e (Prefeitura do Município de São Paulo - Nota Paulistana)
 * Utiliza os dados reais oficiais da FDC da IT2A Tecnologia Ltda e o Certificado A1.
 * Executa TesteEnvioLoteRPS (teste oficial da Prefeitura sem emissão real / sem efeito fiscal).
 */

import https from 'node:https';
import fs from 'node:fs';
import { parsePfx, signXml, signRpsString } from '@fiscal/crypto';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ── 1. Dados cadastrais da FDC da IT2A ───────────────────────────
const IT2A_FDC = {
  cnpj: '65280654000161',
  ccm: '01965530',                  // C.C.M. 0.196.553-0 (8 dígitos)
  razaoSocial: 'IT2A TECNOLOGIA LTDA',
  codigoServico: '02935',           // 2935 da FDC: Provedores de serviços de aplicação / SaaS
  aliquota: 0.029,                  // 2,9% da FDC
  endereco: 'R JOSE NEVES 585 SALA 3, VILA SAO PAULO',
  cep: '04650141',
  cidade: 'SAO PAULO',
  uf: 'SP',
};

// ── 2. Função para montagem da cadeia de 86 caracteres do RPS ───
function buildRps86String(params: {
  ccmPrestador: string;
  serieRps: string;
  numeroRps: number;
  dataEmissao: string; // AAAAMMDD
  tributacao: 'T' | 'F' | 'I' | 'J';
  status: 'N' | 'C' | 'E';
  issRetido: boolean;
  valorServicos: number; // Ex: 100.00
  valorDeducoes: number; // Ex: 0.00
  codigoServico: string; // 5 dígitos
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

// ── 3. Execução do Teste ─────────────────────────────────────────
async function run() {
  console.log('='.repeat(65));
  console.log('🚀 TESTE DE NFS-E — PREFEITURA DE SÃO PAULO (NOTA PAULISTANA)');
  console.log('='.repeat(65));

  const certB64 = process.env.CERT_PFX_BASE64;
  const certPass = process.env.CERT_PASSWORD;

  if (!certB64 || !certPass) {
    console.error('❌ CERT_PFX_BASE64 ou CERT_PASSWORD ausente no .env');
    process.exit(1);
  }

  // 1. Carregar certificado
  console.log('\n🔐 Passo 1: Carregando certificado A1 da IT2A...');
  const certBuffer = Buffer.from(certB64, 'base64');
  const certInfo = parsePfx(certBuffer, certPass);
  console.log(`   ✅ Certificado: ${certInfo.info.commonName}`);
  console.log(`   🏢 CNPJ do Certificado: ${certInfo.info.cnpj}`);

  // 2. Montar dados do RPS
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dataIso = `${yyyy}-${mm}-${dd}`;
  const dataCompacta = `${yyyy}${mm}${dd}`;
  const numeroRps = Math.floor(Math.random() * 800000) + 100000;
  const serieRps = 'NF';
  const valorServico = 150.00;

  console.log('\n📄 Passo 2: Gerando RPS com dados da FDC da IT2A:');
  console.log(`   • CCM Prestador: ${IT2A_FDC.ccm}`);
  console.log(`   • Código de Serviço: ${IT2A_FDC.codigoServico} (ISS: ${IT2A_FDC.aliquota * 100}%)`);
  console.log(`   • Série/Número RPS: ${serieRps} / ${numeroRps}`);
  console.log(`   • Valor do Serviço: R$ ${valorServico.toFixed(2)}`);

  // 3. Gerar e assinar a cadeia de 86 caracteres
  const rps86String = buildRps86String({
    ccmPrestador: IT2A_FDC.ccm,
    serieRps,
    numeroRps,
    dataEmissao: dataCompacta,
    tributacao: 'T',
    status: 'N',
    issRetido: false,
    valorServicos: valorServico,
    valorDeducoes: 0.00,
    codigoServico: IT2A_FDC.codigoServico,
    tomadorCnpjCpf: IT2A_FDC.cnpj,
  });

  const assinaturaRps = signRpsString(rps86String, certInfo.pem.privateKeyPem);
  console.log(`   ✅ Cadeia de 86 caracteres montada e assinada com RSA-SHA1`);

  // 4. Montar o XML do PedidoEnvioLoteRPS
  const rawLoteXml = `<?xml version="1.0" encoding="UTF-8"?>
<PedidoEnvioLoteRPS xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${IT2A_FDC.cnpj}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>false</transacao>
    <dtInicio>${dataIso}</dtInicio>
    <dtFim>${dataIso}</dtFim>
    <QtdRPS>1</QtdRPS>
    <ValorTotalServicos>${valorServico.toFixed(2)}</ValorTotalServicos>
    <ValorTotalDeducoes>0.00</ValorTotalDeducoes>
  </Cabecalho>
  <RPS xmlns="">
    <Assinatura>${assinaturaRps}</Assinatura>
    <ChaveRPS>
      <InscricaoPrestador>${IT2A_FDC.ccm}</InscricaoPrestador>
      <SerieRPS>${serieRps}</SerieRPS>
      <NumeroRPS>${numeroRps}</NumeroRPS>
    </ChaveRPS>
    <TipoRPS>RPS</TipoRPS>
    <DataEmissao>${dataIso}</DataEmissao>
    <StatusRPS>N</StatusRPS>
    <TributacaoRPS>T</TributacaoRPS>
    <ValorServicos>${valorServico.toFixed(2)}</ValorServicos>
    <ValorDeducoes>0.00</ValorDeducoes>
    <ValorPIS>0.00</ValorPIS>
    <ValorCOFINS>0.00</ValorCOFINS>
    <ValorINSS>0.00</ValorINSS>
    <ValorIR>0.00</ValorIR>
    <ValorCSLL>0.00</ValorCSLL>
    <CodigoServico>${IT2A_FDC.codigoServico}</CodigoServico>
    <AliquotaServicos>${IT2A_FDC.aliquota.toFixed(4)}</AliquotaServicos>
    <ISSRetido>false</ISSRetido>
    <CPFCNPJTomador>
      <CNPJ>${IT2A_FDC.cnpj}</CNPJ>
    </CPFCNPJTomador>
    <RazaoSocialTomador>IT2A TECNOLOGIA LTDA TESTE</RazaoSocialTomador>
    <Discriminacao>LICENCIAMENTO E CESSAO DE DIREITO DE USO DE SOFTWARE - SAAS FISCAL EMISSOR</Discriminacao>
  </RPS>
</PedidoEnvioLoteRPS>`;

  const cleanLoteXml = rawLoteXml.replace(/>\s+</g, '><').trim();

  // 5. Assinar digitalmente o PedidoEnvioLoteRPS (XMLDSig)
  console.log('\n✍️  Passo 3: Assinando o lote XML com XMLDSig (Enveloped)...');
  const signedLoteXml = signXml({
    xml: cleanLoteXml,
    privateKeyPem: certInfo.pem.privateKeyPem,
    certificatePem: certInfo.pem.certificatePem,
    targetTag: 'PedidoEnvioLoteRPS',
    action: 'append',
  });
  console.log('   ✅ Lote assinado com sucesso');
  fs.writeFileSync('test-output/nfse-sp-signed.xml', signedLoteXml, 'utf8');

  // 6. Montar o envelope SOAP para TesteEnvioLoteRPS
  console.log('\n📡 Passo 4: Transmitindo para TesteEnvioLoteRPS da Prefeitura de SP...');
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <TesteEnvioLoteRPSRequest xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <VersaoSchema>1</VersaoSchema>
      <MensagemXML><![CDATA[${signedLoteXml}]]></MensagemXML>
    </TesteEnvioLoteRPSRequest>
  </soap12:Body>
</soap12:Envelope>`;

  fs.writeFileSync('test-output/nfse-sp-soap-envelope.xml', soapEnvelope, 'utf8');

  // 7. Envio mTLS via https.Agent
  const agent = new https.Agent({
    pfx: certBuffer,
    passphrase: certPass,
    rejectUnauthorized: false,
  });

  const bodyBuffer = Buffer.from(soapEnvelope, 'utf8');

  const rawResponse = await new Promise<string>((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'nfews.prefeitura.sp.gov.br',
        port: 443,
        path: '/lotenfe.asmx',
        method: 'POST',
        agent,
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8; action="http://www.prefeitura.sp.gov.br/nfe/ws/testeenvio"',
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
    req.write(bodyBuffer);
    req.end();
  });

  fs.writeFileSync('test-output/nfse-sp-response.xml', rawResponse, 'utf8');

  console.log('\n' + '='.repeat(65));
  console.log('📊 RESPOSTA DA PREFEITURA DE SÃO PAULO:');
  console.log('='.repeat(65));

  // Decodifica entidades HTML se houver no RetornoXML
  const unescaped = rawResponse
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  const sucessoMatch = unescaped.match(/<Sucesso>([^<]+)<\/Sucesso>/);
  const sucesso = sucessoMatch?.[1] === 'true';

  if (sucesso) {
    console.log('   🎉 SUCESSO! O lote de RPS foi aceito e validado pela Prefeitura de SP!');
    const numeroLote = unescaped.match(/<NumeroLote>([^<]+)<\/NumeroLote>/)?.[1];
    if (numeroLote) console.log(`   📋 Número do Lote Validado: ${numeroLote}`);
  } else {
    console.log('   ⚠️  Retorno da validação cadastral/fiscal:');
    const erros = [...unescaped.matchAll(/<Erro[^>]*>[\s\S]*?<Codigo>([^<]+)<\/Codigo>[\s\S]*?<Descricao>([^<]+)<\/Descricao>[\s\S]*?<\/Erro>/g)];
    const alertas = [...unescaped.matchAll(/<Alerta[^>]*>[\s\S]*?<Codigo>([^<]+)<\/Codigo>[\s\S]*?<Descricao>([^<]+)<\/Descricao>[\s\S]*?<\/Alerta>/g)];

    if (erros.length > 0) {
      console.log('   Erros reportados pela Prefeitura:');
      erros.forEach(([, cod, desc]) => console.log(`   • Código ${cod}: ${desc}`));
    }
    if (alertas.length > 0) {
      console.log('   Alertas:');
      alertas.forEach(([, cod, desc]) => console.log(`   • Alerta ${cod}: ${desc}`));
    }
  }

  console.log('\n   📁 Resposta salva em test-output/nfse-sp-response.xml');
  console.log('\n' + '='.repeat(65));
}

run().catch((err) => {
  console.error('\n💥 Erro fatal:', err);
  process.exit(1);
});
