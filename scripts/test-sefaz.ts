/**
 * Script de teste end-to-end SEFAZ SP Homologação
 * Testa:
 * 1. checkStatus() -> Consulta status do serviço WebService (esperado: 107 - Serviço em Operação)
 * 2. buildNFeXml -> signXml -> SefazClient.authorize() -> Envio da NF-e
 */

import { parsePfx, signXml } from '@fiscal/crypto';
import { buildNFeXml, SefazClient } from '@fiscal/nfe-adapter';
import type { NFeIssuer, NFeRecipient, NFeItem } from '@fiscal/nfe-adapter';
import fs from 'node:fs';

// Homologação: cadeia ICP-Brasil não está no bundle nativo do Node.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ── Valida pré-requisitos ────────────────────────────────────────
const certB64 = process.env.CERT_PFX_BASE64;
const certPass = process.env.CERT_PASSWORD;

if (!certB64) {
  console.error('❌ CERT_PFX_BASE64 não configurado no .env');
  process.exit(1);
}
if (!certPass) {
  console.error('❌ CERT_PASSWORD não configurado no .env');
  process.exit(1);
}

// ── Dados de teste (homologação — sem efeito fiscal) ─────────────
const issuer: NFeIssuer = {
  cnpj: '65280654000161',        // CNPJ do certificado IT2a
  name: 'IT2A TECNOLOGIA LTDA',
  fantasyName: 'IT2A TECNOLOGIA',
  ie: '110042490000',            // IE com DV válido de SP para teste
  crt: '1',                      // 1 = Simples Nacional
  uf: 'SP',
  ufCode: '35',
  municipalityCode: '3550308',   // São Paulo capital
  municipalityName: 'SAO PAULO',
  address: 'AV PAULISTA',
  number: '1000',
  neighborhood: 'BELA VISTA',
  cep: '01310100',
};

const recipient: NFeRecipient = {
  cnpjCpf: '65280654000161',    // Destinatário = emitente (padrão permitido em homologação)
  name: 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
  uf: 'SP',
  municipalityCode: '3550308',
  municipalityName: 'SAO PAULO',
  address: 'AV PAULISTA',
  number: '1000',
  neighborhood: 'BELA VISTA',
  cep: '01310100',
};

const items: NFeItem[] = [
  {
    number: 1,
    code: 'PROD-001',
    description: 'PRODUTO TESTE HOMOLOGACAO',
    ncm: '84713012',             // NCM: computador portátil
    cfop: '5102',                // Venda de mercadoria dentro do estado
    unit: 'UN',
    quantity: 1,
    unitValue: 100.00,
    totalValue: 100.00,
  },
];

async function run() {
  console.log('='.repeat(65));
  console.log('🚀 TESTE DE INTEGRAÇÃO SEFAZ SP (HOMOLOGAÇÃO - AMBIENTE DE TESTES)');
  console.log('='.repeat(65));

  // 1. Carregar certificado
  console.log('\n🔐 Passo 1: Carregando certificado IT2a...');
  const pfxBuffer = Buffer.from(certB64!, 'base64');
  
  const certInfo = parsePfx(pfxBuffer, certPass);
  console.log(`   ✅ Certificado: ${certInfo.info.commonName}`);
  console.log(`   📅 Validade: ${certInfo.info.validTo.toLocaleDateString('pt-BR')}`);
  if (certInfo.info.cnpj) {
    console.log(`   🏢 CNPJ: ${certInfo.info.cnpj}`);
    issuer.cnpj = certInfo.info.cnpj;
    recipient.cnpjCpf = certInfo.info.cnpj;
  }

  // 2. Instancia o cliente SEFAZ
  const client = new SefazClient({
    nfeUrl: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
    consultaUrl: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
    statusServicoUrl: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx',
    certPfxBase64: certB64!,
    certPassword: certPass!,
  });

  // 3. Teste do Status do Serviço (mTLS + SOAP 1.2)
  console.log('\n📡 Passo 2: Testando status do WebService SEFAZ SP...');
  const statusResult = await client.checkStatus('HOMOLOGATION', '35');
  console.log(`   Status: ${statusResult.status} (cStat: ${statusResult.cStat}) - ${statusResult.xMotivo}`);
  fs.writeFileSync('test-output/status-response.xml', statusResult.rawResponse, 'utf8');

  if (statusResult.status !== 'ONLINE') {
    console.warn('   ⚠️  WebService da SEFAZ SP não respondeu como ONLINE. Verifique test-output/status-response.xml');
  }

  // 4. Gerar XML da NF-e
  console.log('\n📄 Passo 3: Gerando XML da NF-e (Modelo 55, Versão 4.00)...');
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randomCode = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');
  const nNF = Math.floor(Math.random() * 899999) + 100000;

  const { xml: rawXml, accessKey } = buildNFeXml({
    accessKeyParams: {
      ufCode: '35',
      issueYearMonth: yymm,
      cnpj: issuer.cnpj,
      model: '55',
      series: 1,
      number: nNF,
      emissionType: '1',
      randomCode,
    },
    natureOfOperation: 'VENDA DE MERCADORIA',
    issuer,
    recipient,
    items,
    totalValue: 100.00,
  });
  console.log(`   ✅ XML gerado com sucesso`);
  console.log(`   🔑 Chave de Acesso: ${accessKey}`);
  console.log(`   🔢 Número da NF-e: ${nNF}`);
  fs.writeFileSync('test-output/nfe-raw.xml', rawXml, 'utf8');

  // 5. Assinatura Digital do XML
  console.log('\n✍️  Passo 4: Assinando digitalmente o XML com o Certificado A1...');
  const signedXml = signXml({
    xml: rawXml,
    privateKeyPem: certInfo.pem.privateKeyPem,
    certificatePem: certInfo.pem.certificatePem,
    targetTag: 'infNFe',
  });
  console.log('   ✅ XML assinado digitalmente com SHA-1 / RSA e C14N');
  fs.writeFileSync('test-output/nfe-signed.xml', signedXml, 'utf8');

  // 6. Transmissão para SEFAZ
  console.log('\n🚀 Passo 5: Transmitindo lote síncrono para SEFAZ SP (NFeAutorizacao4)...');
  const result = await client.authorize(signedXml, accessKey, 'HOMOLOGATION');

  console.log('\n' + '='.repeat(65));
  console.log('📊 RESULTADO DA TRANSMISSÃO SEFAZ:');
  console.log('='.repeat(65));
  console.log(`   Resultado: ${result.status}`);

  if (result.status === 'AUTHORIZED') {
    console.log('   🎉 NF-e AUTORIZADA COM SUCESSO PELA SEFAZ SP!');
    console.log(`   🔑 Chave de Acesso: ${result.accessKey}`);
    console.log(`   📋 Protocolo de Autorização: ${result.protocol}`);
  } else if (result.status === 'REJECTED') {
    console.log('   ⚠️  NF-e PROCESSADA PELA SEFAZ (REJEIÇÃO DE NEGÓCIO):');
    result.errors?.forEach(e => console.log(`   • Código ${e.code}: ${e.message}`));
  } else {
    console.log('   ❌ Status inesperado ou erro de transporte:');
    console.log(result.errors);
  }

  const rawResp = (result as { rawResponse?: string }).rawResponse;
  if (rawResp) {
    fs.writeFileSync('test-output/sefaz-response.xml', rawResp, 'utf8');
    console.log('\n   📁 Resposta completa gravada em test-output/sefaz-response.xml');
    console.log('\n   📋 Trecho do XML retornado pela SEFAZ:');
    console.log('   ' + rawResp.substring(0, 1000));
  }

  console.log('\n' + '='.repeat(65));
}

fs.mkdirSync('test-output', { recursive: true });

run().catch((err) => {
  console.error('\n💥 Erro fatal durante a execução:', err);
  process.exit(1);
});
