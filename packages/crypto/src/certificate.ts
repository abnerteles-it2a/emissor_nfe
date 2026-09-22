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

  const certBags: { cert: forge.pki.Certificate; localKeyId?: string }[] = [];
  let keyBag: { key: forge.pki.PrivateKey; localKeyId?: string } | null = null;

  for (const safeContents of p12.safeContents) {
    for (const safeBag of safeContents.safeBags) {
      if (safeBag.cert) {
        const localKeyId = safeBag.attributes?.localKeyId?.[0];
        certBags.push({ cert: safeBag.cert, localKeyId });
      }
      if (safeBag.key) {
        const localKeyId = safeBag.attributes?.localKeyId?.[0];
        keyBag = { key: safeBag.key, localKeyId };
      }
    }
  }

  if (!keyBag || certBags.length === 0) {
    throw new Error('FAILED_TO_EXTRACT_CERTIFICATE_OR_KEY');
  }

  const privateKey = keyBag.key;

  // Encontra o certificado correspondente à chave privada:
  // 1. Pelo localKeyId coincidente
  // 2. Ou pelo módulo RSA coincidente entre chave pública do certificado e chave privada
  let certificate: forge.pki.Certificate | null = null;

  if (keyBag.localKeyId) {
    const match = certBags.find((cb) => cb.localKeyId === keyBag?.localKeyId);
    if (match) {
      certificate = match.cert;
    }
  }

  if (!certificate) {
    const rsaPriv = privateKey as forge.pki.rsa.PrivateKey;
    if (rsaPriv.n) {
      for (const cb of certBags) {
        const rsaPub = cb.cert.publicKey as forge.pki.rsa.PublicKey;
        if (rsaPub.n && rsaPub.n.compareTo(rsaPriv.n) === 0) {
          certificate = cb.cert;
          break;
        }
      }
    }
  }

  // Fallback: primeiro certificado que não seja CA
  if (!certificate) {
    certificate = certBags[0].cert;
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
