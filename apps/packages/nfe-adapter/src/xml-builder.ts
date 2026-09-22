import { generateAccessKey, type AccessKeyParams } from './key-generator.js';

export type NFeIssuer = {
  cnpj: string;
  name: string;
  fantasyName?: string;
  ie: string;
  crt: '1' | '2' | '3'; // Simples Nacional (1), Excesso de Sublimite (2), Regime Normal (3)
  uf: string;
  ufCode: string;
  municipalityCode: string;
  municipalityName: string;
  address: string;
  number: string;
  neighborhood: string;
  cep: string;
};

export type NFeRecipient = {
  cnpjCpf: string;
  name: string;
  ie?: string;
  uf: string;
  municipalityCode: string;
  municipalityName: string;
  address: string;
  number: string;
  neighborhood: string;
  cep: string;
};

export type NFeItem = {
  number: number;
  code: string;
  description: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
};

export type BuildNFeXmlInput = {
  accessKeyParams: AccessKeyParams;
  natureOfOperation: string;
  issuer: NFeIssuer;
  recipient: NFeRecipient;
  items: NFeItem[];
  totalValue: number;
};

export function buildNFeXml(input: BuildNFeXmlInput): { xml: string; accessKey: string } {
  const { accessKey, cDV } = generateAccessKey(input.accessKeyParams);
  const now = new Date().toISOString();

  const itemsXml = input.items
    .map(
      (item) => `
    <det nItem="${item.number}">
      <prod>
        <cProd>${item.code}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${item.description}</xProd>
        <NCM>${item.ncm}</NCM>
        <CFOP>${item.cfop}</CFOP>
        <uCom>${item.unit}</uCom>
        <qCom>${item.quantity.toFixed(4)}</qCom>
        <vUnCom>${item.unitValue.toFixed(4)}</vUnCom>
        <vProd>${item.totalValue.toFixed(2)}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>${item.unit}</uTrib>
        <qTrib>${item.quantity.toFixed(4)}</qTrib>
        <vUnTrib>${item.unitValue.toFixed(4)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <ICMS>
          <ICMSSN102>
            <orig>0</orig>
            <CSOSN>102</CSOSN>
          </ICMSSN102>
        </ICMS>
        <PIS>
          <PISNT>
            <CST>07</CST>
          </PISNT>
        </PIS>
        <COFINS>
          <COFINSNT>
            <CST>07</CST>
          </COFINSNT>
        </COFINS>
      </imposto>
    </det>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${accessKey}" versao="4.00">
    <ide>
      <cUF>${input.accessKeyParams.ufCode}</cUF>
      <cNF>${input.accessKeyParams.randomCode}</cNF>
      <natOp>${input.natureOfOperation}</natOp>
      <mod>${input.accessKeyParams.model}</mod>
      <serie>${input.accessKeyParams.series}</serie>
      <nNF>${input.accessKeyParams.number}</nNF>
      <dhEmi>${now}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>${input.issuer.municipalityCode}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>${input.accessKeyParams.emissionType}</tpEmis>
      <cDV>${cDV}</cDV>
      <tpAmb>2</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>1.0.0</verProc>
    </ide>
    <emit>
      <CNPJ>${input.issuer.cnpj}</CNPJ>
      <xNome>${input.issuer.name}</xNome>
      <xFant>${input.issuer.fantasyName || input.issuer.name}</xFant>
      <enderEmit>
        <xLgr>${input.issuer.address}</xLgr>
        <nro>${input.issuer.number}</nro>
        <xBairro>${input.issuer.neighborhood}</xBairro>
        <cMun>${input.issuer.municipalityCode}</cMun>
        <xMun>${input.issuer.municipalityName}</xMun>
        <UF>${input.issuer.uf}</UF>
        <CEP>${input.issuer.cep}</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
      </enderEmit>
      <IE>${input.issuer.ie}</IE>
      <CRT>${input.issuer.crt}</CRT>
    </emit>
    <dest>
      <CNPJ>${input.recipient.cnpjCpf}</CNPJ>
      <xNome>${input.recipient.name}</xNome>
      <enderDest>
        <xLgr>${input.recipient.address}</xLgr>
        <nro>${input.recipient.number}</nro>
        <xBairro>${input.recipient.neighborhood}</xBairro>
        <cMun>${input.recipient.municipalityCode}</cMun>
        <xMun>${input.recipient.municipalityName}</xMun>
        <UF>${input.recipient.uf}</UF>
        <CEP>${input.recipient.cep}</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
      </enderDest>
      <indIEDest>9</indIEDest>
    </dest>
    ${itemsXml}
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${input.totalValue.toFixed(2)}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>0.00</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${input.totalValue.toFixed(2)}</vNF>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>9</modFrete>
    </transp>
  </infNFe>
</NFe>`;

  return { xml, accessKey };
}
