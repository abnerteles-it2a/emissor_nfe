import { generateAccessKey, type AccessKeyParams } from './key-generator.js';
import { processTaxEngine, TaxRegime } from '@fiscal/tax-engine';
import type { TaxInputItem } from '@fiscal/tax-engine';

export type NFeIssuer = {
  cnpj: string;
  name: string;
  fantasyName?: string;
  ie: string;
  crt: '1' | '2' | '3'; // 1=Simples, 2=Excesso Sublimite, 3=Regime Normal
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

function crtToRegime(crt: '1' | '2' | '3'): TaxRegime {
  if (crt === '1') return TaxRegime.SIMPLES_NACIONAL;
  if (crt === '2') return TaxRegime.SIMPLES_EXCESSO;
  return TaxRegime.REGIME_NORMAL;
}

function buildItemXml(item: NFeItem, taxResult: ReturnType<typeof processTaxEngine>['items'][0]): string {
  const isSimples = taxResult.csosn !== undefined;

  const icmsXml = isSimples
    ? `<ICMS>
          <ICMSSN${taxResult.csosn}>
            <orig>${taxResult.origem}</orig>
            <CSOSN>${taxResult.csosn}</CSOSN>
          </ICMSSN${taxResult.csosn}>
        </ICMS>`
    : `<ICMS>
          <ICMS00>
            <orig>${taxResult.origem}</orig>
            <CST>${taxResult.cstIcms ?? '00'}</CST>
            <modBC>3</modBC>
            <vBC>${taxResult.baseIcms.toFixed(2)}</vBC>
            <pICMS>${taxResult.aliquotaIcms.toFixed(2)}</pICMS>
            <vICMS>${taxResult.valorIcms.toFixed(2)}</vICMS>
          </ICMS00>
        </ICMS>`;

  return `
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
        ${icmsXml}
        <PIS>
          <${taxResult.cstPis === '07' ? 'PISNT' : 'PISAliq'}>
            <CST>${taxResult.cstPis}</CST>
            ${taxResult.cstPis !== '07' ? `<vBC>${taxResult.basePis.toFixed(2)}</vBC><pPIS>${taxResult.aliquotaPis.toFixed(2)}</pPIS><vPIS>${taxResult.valorPis.toFixed(2)}</vPIS>` : ''}
          </${taxResult.cstPis === '07' ? 'PISNT' : 'PISAliq'}>
        </PIS>
        <COFINS>
          <${taxResult.cstCofins === '07' ? 'COFINSNT' : 'COFINSAliq'}>
            <CST>${taxResult.cstCofins}</CST>
            ${taxResult.cstCofins !== '07' ? `<vBC>${taxResult.baseCofins.toFixed(2)}</vBC><pCOFINS>${taxResult.aliquotaCofins.toFixed(2)}</pCOFINS><vCOFINS>${taxResult.valorCofins.toFixed(2)}</vCOFINS>` : ''}
          </${taxResult.cstCofins === '07' ? 'COFINSNT' : 'COFINSAliq'}>
        </COFINS>
      </imposto>
    </det>`;
}

function formatDhEmi(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const brt = new Date(utc - 3 * 3600000);
  const y = brt.getFullYear();
  const m = pad(brt.getMonth() + 1);
  const d = pad(brt.getDate());
  const hh = pad(brt.getHours());
  const mm = pad(brt.getMinutes());
  const ss = pad(brt.getSeconds());
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}-03:00`;
}

export function buildNFeXml(input: BuildNFeXmlInput): { xml: string; accessKey: string } {
  const { accessKey, cDV } = generateAccessKey(input.accessKeyParams);
  const dhEmi = formatDhEmi();
  const regime = crtToRegime(input.issuer.crt);

  // Calcula tributos reais via tax-engine
  const taxItems: TaxInputItem[] = input.items.map((item, i) => ({
    itemIndex: i + 1,
    ncm: item.ncm,
    cfop: item.cfop,
    quantity: item.quantity,
    unitValue: item.unitValue,
    totalValue: item.totalValue,
  }));
  const taxResult = processTaxEngine(taxItems, regime);

  const itemsXml = input.items
    .map((item, i) => buildItemXml(item, taxResult.items[i]))
    .join('');

  const tpAmb = '2'; // Homologação — nunca muda sem configuração explícita
  const tpNF = '1';  // Saída
  const idDest = input.issuer.uf === input.recipient.uf ? '1' : '2'; // 1=Interna, 2=Interestadual

  const destDocXml = input.recipient.cnpjCpf.length === 14
    ? `<CNPJ>${input.recipient.cnpjCpf}</CNPJ>`
    : `<CPF>${input.recipient.cnpjCpf}</CPF>`;

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
      <dhEmi>${dhEmi}</dhEmi>
      <tpNF>${tpNF}</tpNF>
      <idDest>${idDest}</idDest>
      <cMunFG>${input.issuer.municipalityCode}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>${input.accessKeyParams.emissionType}</tpEmis>
      <cDV>${cDV}</cDV>
      <tpAmb>${tpAmb}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>1.0.0</verProc>
    </ide>
    <emit>
      <CNPJ>${input.issuer.cnpj}</CNPJ>
      <xNome>${input.issuer.name}</xNome>
      <xFant>${input.issuer.fantasyName ?? input.issuer.name}</xFant>
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
      ${destDocXml}
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
        <vBC>${taxResult.totalIcms > 0 ? taxResult.totalProducts.toFixed(2) : '0.00'}</vBC>
        <vICMS>${taxResult.totalIcms.toFixed(2)}</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${taxResult.totalProducts.toFixed(2)}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>0.00</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>${taxResult.totalPis.toFixed(2)}</vPIS>
        <vCOFINS>${taxResult.totalCofins.toFixed(2)}</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${taxResult.totalProducts.toFixed(2)}</vNF>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>9</modFrete>
    </transp>
    <pag>
      <detPag>
        <tPag>01</tPag>
        <vPag>${taxResult.totalProducts.toFixed(2)}</vPag>
      </detPag>
    </pag>
    <infRespTec>
      <CNPJ>65280654000161</CNPJ>
      <xContato>Suporte IT2A</xContato>
      <email>contato@it2a.com.br</email>
      <fone>11999999999</fone>
    </infRespTec>
  </infNFe>
</NFe>`;

  const cleanXml = xml.replace(/>\s+</g, '><').trim();
  return { xml: cleanXml, accessKey };
}
