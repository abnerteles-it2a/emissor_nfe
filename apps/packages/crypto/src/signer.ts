import { SignedXml } from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';

export type SignXmlOptions = {
  xml: string;
  privateKeyPem: string;
  certificatePem: string;
  targetTag: string; // Ex: 'infNFe' ou 'infDPS'
  signatureAlgorithm?: string;
  canonicalizationAlgorithm?: string;
};

export function signXml({
  xml,
  privateKeyPem,
  certificatePem,
  targetTag,
  signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
  canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
}: SignXmlOptions): string {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const targetElement = doc.getElementsByTagName(targetTag)[0];

  if (!targetElement) {
    throw new Error(`TARGET_TAG_NOT_FOUND: Element <${targetTag}> missing in XML`);
  }

  const idAttribute = targetElement.getAttribute('Id');
  const uri = idAttribute ? `#${idAttribute}` : '';

  const cleanCertPem = certificatePem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/[\r\n]/g, '');

  const sig = new SignedXml({
    privateKey: privateKeyPem,
    signatureAlgorithm,
    canonicalizationAlgorithm,
    publicCert: cleanCertPem,
  });

  sig.addReference({
    xpath: uri ? `//*[@Id='${idAttribute}']` : `//*[local-name(.)='${targetTag}']`,
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
  });

  sig.computeSignature(xml, {
    location: {
      reference: uri ? `//*[@Id='${idAttribute}']` : `//*[local-name(.)='${targetTag}']`,
      action: 'after',
    },
  });

  return sig.getSignedXml();
}
