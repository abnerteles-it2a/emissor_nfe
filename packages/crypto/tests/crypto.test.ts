import { describe, it, expect } from 'vitest';
import forge from 'node-forge';
import { parsePfx, signXml } from '../src';

describe('packages/crypto', () => {
  it('geração sintética de cert A1 e validação de assinatura XML', () => {
    // 1. Gera par de chaves RSA sintético
    const keys = forge.pki.rsa.generateKeyPair(1024);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [{ name: 'commonName', value: 'EMPRESA TESTE LTDA 12345678000195' }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);

    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], 'password123');
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const pfxBuffer = Buffer.from(p12Der, 'binary');

    // 2. Testa o parsePfx
    const parsed = parsePfx(pfxBuffer, 'password123');
    expect(parsed.info.commonName).toContain('EMPRESA TESTE LTDA');
    expect(parsed.info.cnpj).toBe('12345678000195');
    expect(parsed.info.isExpired).toBe(false);

    // 3. Testa a assinatura de XML fiscal
    const xmlMock = '<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe35260812345678000195550010000000011000000001"><chNFe>35260812345678000195550010000000011000000001</chNFe></infNFe></NFe>';
    const signedXml = signXml({
      xml: xmlMock,
      privateKeyPem: parsed.pem.privateKeyPem,
      certificatePem: parsed.pem.certificatePem,
      targetTag: 'infNFe',
    });

    expect(signedXml).toContain('<Signature');
    expect(signedXml).toContain('<X509Certificate>');
    expect(signedXml).toContain('<SignatureValue>');
  });
});
