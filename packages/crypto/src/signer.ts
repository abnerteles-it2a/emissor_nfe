import crypto from 'node:crypto';
import { SignedXml } from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';

export type SignXmlOptions = {
  xml: string;
  privateKeyPem: string;
  certificatePem: string;
  targetTag: string; // Ex: 'infNFe', 'infDPS' ou 'PedidoEnvioLoteRPS'
  signatureAlgorithm?: string;
  canonicalizationAlgorithm?: string;
  action?: 'after' | 'append';
};

export function signXml({
  xml,
  privateKeyPem,
  certificatePem,
  targetTag,
  signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
  canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
  action,
}: SignXmlOptions): string {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const targetElement = doc.getElementsByTagName(targetTag)[0];

  if (!targetElement) {
    throw new Error(`TARGET_TAG_NOT_FOUND: Element <${targetTag}> missing in XML`);
  }

  const isRoot = doc.documentElement === targetElement;
  const effectiveAction = action ?? (isRoot ? 'append' : 'after');

  const idAttribute = targetElement.getAttribute('Id');
  const uri = idAttribute ? `#${idAttribute}` : '';
  const isEmptyUri = !idAttribute;

  const sig = new SignedXml({
    privateKey: privateKeyPem,
    signatureAlgorithm,
    canonicalizationAlgorithm,
    publicCert: certificatePem,
  });

  sig.addReference({
    xpath: uri ? `//*[@Id='${idAttribute}']` : `//*[local-name(.)='${targetTag}']`,
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    isEmptyUri,
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
  });

  sig.computeSignature(xml, {
    location: {
      reference: uri ? `//*[@Id='${idAttribute}']` : `//*[local-name(.)='${targetTag}']`,
      action: effectiveAction,
    },
  });

  return sig.getSignedXml();
}

/**
 * Assina a cadeia de 86 caracteres do RPS (Prefeitura de São Paulo)
 * utilizando SHA-1 + RSA com o certificado A1 e retorna em Base64
 */
export function signRpsString(rpsString: string, privateKeyPem: string): string {
  const signer = crypto.createSign('RSA-SHA1');
  signer.update(rpsString, 'ascii');
  return signer.sign(privateKeyPem, 'base64');
}
