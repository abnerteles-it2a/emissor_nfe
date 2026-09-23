import { ClassificationOutput, RejectionExplanationOutput } from './types.js';

interface KnowledgeRule {
  keywords: string[];
  output: Omit<ClassificationOutput, 'confidence'>;
}

export const FISCAL_KNOWLEDGE_RULES: KnowledgeRule[] = [
  // 1. Serviços de TI / Software SaaS
  {
    keywords: ['software', 'saas', 'licenca', 'licenciamento', 'desenvolvimento', 'hospedagem', 'cloud', 'programacao', 'suporte ti'],
    output: {
      documentType: 'NFSE',
      isService: true,
      ncm: '00000000',
      ncmDescription: 'Não aplicável (Serviço Municipal)',
      cfop: '0000',
      cfopDescription: 'Prestação de Serviço Municipal (ISS)',
      serviceCode: '02935',
      csosn: '102',
      cstIcms: '41',
      cstPis: '07',
      cstCofins: '07',
      rationale: 'Operação de licenciamento ou serviço de software classificada sob ISSQN municipal (Código 02935 - Paulistana / Lista LC 116 Item 1.05).',
      ibsCbsSuggestion: {
        cClassTrib: '010101',
        cstIbsCbs: '01',
        aliquotaIbs: 0.1,
        aliquotaCbs: 0.9,
      },
    },
  },

  // 2. Hardware / Informática / Computadores
  {
    keywords: ['notebook', 'computador', 'laptop', 'servidor', 'pc', 'teclado', 'mouse', 'monitor', 'hardware', 'impressora'],
    output: {
      documentType: 'NFE',
      isService: false,
      ncm: '84713012',
      ncmDescription: 'Máquinas automáticas para processamento de dados, portáteis (Notebooks)',
      cfop: '5102',
      cfopDescription: 'Venda de mercadoria adquirida ou recebida de terceiros (Dentro do Estado)',
      csosn: '102',
      cstIcms: '00',
      cstPis: '01',
      cstCofins: '01',
      rationale: 'Equipamento de processamento de dados sujeito a ICMS estadual. Classificação oficial NCM 8471 e CFOP 5.102 para saída interna.',
      ibsCbsSuggestion: {
        cClassTrib: '000000',
        cstIbsCbs: '01',
        aliquotaIbs: 0.1,
        aliquotaCbs: 0.9,
      },
    },
  },

  // 3. Serviços Veterinários / Clínicos (conforme especificação item 1)
  {
    keywords: ['veterinario', 'veterinaria', 'consulta pet', 'banho', 'tosa', 'procedimento clinico', 'cirurgia animal', 'vacina aplicacao'],
    output: {
      documentType: 'NFSE',
      isService: true,
      ncm: '00000000',
      ncmDescription: 'Não aplicável (Serviço Municipal)',
      cfop: '0000',
      cfopDescription: 'Prestação de Serviço Municipal (ISS)',
      serviceCode: '04146',
      csosn: '102',
      cstIcms: '41',
      cstPis: '07',
      cstCofins: '07',
      rationale: 'Serviço de medicina veterinária, cuidados e higiene de animais enquadrado no item 5.01 da Lei Complementar 116/2003 (NFS-e Paulistana/Nacional).',
      ibsCbsSuggestion: {
        cClassTrib: '050101',
        cstIbsCbs: '01',
        aliquotaIbs: 0.1,
        aliquotaCbs: 0.9,
      },
    },
  },

  // 4. Rações e Medicamentos Veterinários (Mercadorias - NF-e / NFC-e)
  {
    keywords: ['racao', 'medicamento', 'antibiotico', 'petisco', 'coleira', 'antipulgas', 'vacina frasco', 'acessorio pet'],
    output: {
      documentType: 'NFE',
      isService: false,
      ncm: '23091000',
      ncmDescription: 'Alimentos para cães ou gatos, acondicionados para venda a retalho',
      cfop: '5405',
      cfopDescription: 'Venda de mercadoria adquirida ou recebida de terceiros sujeita a Substituição Tributária (ST)',
      csosn: '500',
      cstIcms: '60',
      cstPis: '04',
      cstCofins: '04',
      rationale: 'Alimentos para animais de estimação possuem tributação concentrada/ST na maioria das UFs. Classificado sob NCM 2309.10.00 e CFOP 5.405.',
      ibsCbsSuggestion: {
        cClassTrib: '230910',
        cstIbsCbs: '01',
        aliquotaIbs: 0.1,
        aliquotaCbs: 0.9,
      },
    },
  },

  // 5. Consultoria / Gestão Financeira
  {
    keywords: ['consultoria', 'assessoria', 'gestao financeira', 'planejamento', 'auditoria', 'contabilidade'],
    output: {
      documentType: 'NFSE',
      isService: true,
      ncm: '00000000',
      ncmDescription: 'Não aplicável (Serviço Municipal)',
      cfop: '0000',
      cfopDescription: 'Prestação de Serviço Municipal (ISS)',
      serviceCode: '02690',
      csosn: '102',
      cstIcms: '41',
      cstPis: '07',
      cstCofins: '07',
      rationale: 'Serviço de assessoria e consultoria empresarial/financeira enquadrado na LC 116 Item 17.01 com incidência de ISSQN.',
      ibsCbsSuggestion: {
        cClassTrib: '170101',
        cstIbsCbs: '01',
        aliquotaIbs: 0.1,
        aliquotaCbs: 0.9,
      },
    },
  },
];

export const SEFAZ_REJECTIONS_KNOWLEDGE: Record<string, Omit<RejectionExplanationOutput, 'cStat'>> = {
  '100': {
    title: 'Autorizado o uso da NF-e',
    plainExplanation: 'A nota fiscal foi processada, validada e autorizada com sucesso pela SEFAZ.',
    rootCause: 'Todos os campos, assinaturas e cálculos fiscais conferem com os schemas e regras de validação oficiais.',
    recommendedAction: 'Nenhuma ação necessária. Você já pode imprimir o DANFE ou baixar o XML autorizado.',
    affectedFields: [],
    autoFixable: false,
  },
  '204': {
    title: 'Duplicidade de NF-e [chNFe já autorizada]',
    plainExplanation: 'A SEFAZ rejeitou o lote porque já existe uma nota fiscal autorizada com exatamente o mesmo número, série, modelo e CNPJ emitente.',
    rootCause: 'Esta numeração já foi emitida anteriormente.',
    recommendedAction: 'Incremente o número da nota fiscal para o próximo número da sequência (ex: de 1042 para 1043) ou consulte a nota anterior pelo protocolo.',
    affectedFields: ['ide.nNF', 'number'],
    autoFixable: true,
    suggestedCorrection: { action: 'INCREMENT_NUMBER' },
  },
  '209': {
    title: 'Rejeição: IE do destinatário não informada',
    plainExplanation: 'A empresa destinatária é inscrita na SEFAZ, mas o campo Inscrição Estadual (IE) foi enviado em branco.',
    rootCause: 'O destinatário possui Inscrição Estadual ativa no Cadastro Centralizado de Contribuintes (CCC/SINTEGRA).',
    recommendedAction: 'Selecione "Contribuinte ICMS" e preencha a Inscrição Estadual do cliente, ou altere o Indicador da IE para "9 - Não Contribuinte" caso seja consumidor final.',
    affectedFields: ['dest.IE', 'dest.indIEDest'],
    autoFixable: true,
    suggestedCorrection: { indIEDest: '9' },
  },
  '539': {
    title: 'Duplicidade de NF-e, com diferença na Chave de Acesso',
    plainExplanation: 'Você tentou emitir uma nota com o mesmo número e série de uma nota já enviada, mas com dados diferentes (destinatário, valor ou data).',
    rootCause: 'Conflito de numeração com chave de acesso diferente na SEFAZ.',
    recommendedAction: 'Avance a numeração da nota para a próxima disponível.',
    affectedFields: ['number', 'ide.nNF'],
    autoFixable: true,
    suggestedCorrection: { action: 'INCREMENT_NUMBER' },
  },
  '600': {
    title: 'Rejeição: CSOSN incompatível na operação com Não Contribuinte',
    plainExplanation: 'O código de tributação (CSOSN) informado não é permitido para vendas a consumidor final / não contribuinte.',
    rootCause: 'Empresas do Simples Nacional devem utilizar CSOSN 102 (Tributada pelo Simples sem permissão de crédito) ou 500 (ICMS cobrado anteriormente por substituição tributária).',
    recommendedAction: 'Ajuste o CSOSN do item para 102 ou 500.',
    affectedFields: ['items[].csosn'],
    autoFixable: true,
    suggestedCorrection: { csosn: '102' },
  },
  '778': {
    title: 'Rejeição: Informado NCM inexistente',
    plainExplanation: 'O código NCM informado não existe na Tabela de NCMs da Receita Federal ou foi revogado.',
    rootCause: 'NCM inválido ou com menos de 8 dígitos.',
    recommendedAction: 'Consulte o classificador fiscal de NCM da IT2A e informe um código válido de 8 dígitos.',
    affectedFields: ['items[].ncm'],
    autoFixable: true,
  },
  '1207': {
    title: 'Erro de validação do lote RPS (Prefeitura de São Paulo)',
    plainExplanation: 'O WebService da Nota Paulistana recusou o lote enviado.',
    rootCause: 'Divergência na assinatura digital do lote RPS, formato da cadeia de 86 caracteres ou CCM/Inscrição Municipal.',
    recommendedAction: 'Verifique se o CCM (Cadastro de Contribuinte Mobiliário) e o código de serviço correspondem aos dados cadastrados na FDC da empresa.',
    affectedFields: ['services[].code', 'establishment.im'],
    autoFixable: false,
  },
};
