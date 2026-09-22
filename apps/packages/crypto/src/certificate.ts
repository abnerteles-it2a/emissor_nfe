import forge from 'node-forge';

export type CertificateInfo = {
  subject: string;
  cnpj?: string;
  cpf?: string;
  commonName: string;
  validFrom: Date;
  validTo: Date;
  isExpired: boolean;
};

export type PemKeyPair = {
  privateKeyPem: string;
  certificatePem: string;
};

export function parsePfx(pfxBuffer: Buffer, password?: string): { info: CertificateInfo; pem: PemKeyPair } {
  const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');

  let certificate: forge.pki.Certificate | null = null;
  let privateKey: forge.pki.PrivateKey | null = null;

  for (const safeContents of p12.safeContents) {
    for (const safeBag of safeContents.safeBags) {
      if (safeBag.cert) {
        certificate = safeBag.cert;
      }
      if (safeBag.key) {
        privateKey = safeBag.key;
      }
    }
  }

  if (!certificate || !privateKey) {
    throw new Error('FAILED_TO_EXTRACT_CERTIFICATE_OR_KEY');
  }

  const certificatePem = forge.pki.certificateToPem(certificate);
  const privateKeyPem = forge.pki.privateKeyToPem(privateKey);

  const commonName = certificate.subject.getField('CN')?.value as string || '';
  
  // Extrai CNPJ/CPF do atributo OID ou do CommonName se presente
  let cnpj: string | undefined;
  let cpf: string | undefined;

  const cnpjMatch = commonName.match(/\d{14}/);
  if (cnpjMatch) {
    cnpj = cnpjMatch[0];
  }

  const cpfMatch = commonName.match(/\d{11}/);
  if (!cnpj && cpfMatch) {
    cpf = cpfMatch[0];
  }

  const now = new Date();
  const validFrom = certificate.validity.notBefore;
  const validTo = certificate.validity.notAfter;
  const isExpired = now < validFrom || now > validTo;

  return {
    info: {
      subject: commonName,
      cnpj,
      cpf,
      commonName,
      validFrom,
      validTo,
      isExpired,
    },
    pem: {
      privateKeyPem,
      certificatePem,
    },
  };
}
