import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../config/logger';

const client = new Anthropic();

const SYSTEM_PROMPT_CLASSIFY = `Você é um especialista em contabilidade e finanças brasileiras. Sua função é classificar transações financeiras de empresas brasileiras.

Contexto do mercado brasileiro:
- PIX: transferência instantânea, pode ser receita ou despesa
- Boleto: pagamento de contas, geralmente despesa
- TED/DOC: transferências bancárias
- Maquininha/POS: recebimento de cartão, geralmente receita
- DAS: Documento de Arrecadação do Simples Nacional (imposto)
- FGTS/INSS: encargos trabalhistas (despesa)
- Nota fiscal / NF: pode ser receita (emitida) ou despesa (recebida)
- CMV/Custo das mercadorias: compra de estoque, matéria-prima
- Pró-labore: retirada dos sócios
- ICMS, PIS, COFINS, ISS: impostos
- Fornecedores: geralmente CMV ou EXPENSE
- Salário/Folha: despesa de pessoal

Tipos de transação disponíveis:
- REVENUE: receitas de vendas e serviços
- EXPENSE: despesas operacionais
- TAX: impostos e tributos
- WITHDRAWAL: retiradas dos sócios (pró-labore, distribuição de lucros)
- TRANSFER: transferências entre contas da empresa
- CMV: custo da mercadoria vendida (compras de estoque/insumos)

Responda sempre em JSON válido.`;

const SYSTEM_PROMPT_INSIGHTS = `Você é um consultor financeiro especializado em PMEs (Pequenas e Médias Empresas) brasileiras. Analise os dados financeiros fornecidos e gere insights práticos e acionáveis em português brasileiro. Seja direto, objetivo e use linguagem acessível. Mencione percentuais e valores quando relevante.`;

const SYSTEM_PROMPT_PARSE = `Você é um especialista em análise de extratos bancários e documentos financeiros brasileiros. Sua função é extrair transações estruturadas de textos de extratos, OFX, planilhas exportadas de bancos brasileiros e outros documentos financeiros. Responda sempre em JSON válido.`;

export interface ClassifyResult {
  type: string;
  category: string;
  confidence: number;
  reasoning: string;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
}

export interface AnomalyResult {
  transactionId: string;
  description: string;
  amount: number;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export async function classifyTransaction(
  description: string,
  amount: number,
  context?: string
): Promise<ClassifyResult> {
  try {
    const prompt = `Classifique esta transação financeira:

Descrição: "${description}"
Valor: R$ ${(amount / 100).toFixed(2)}
${context ? `Contexto adicional: ${context}` : ''}

Responda no formato JSON:
{
  "type": "REVENUE|EXPENSE|TAX|WITHDRAWAL|TRANSFER|CMV",
  "category": "nome da categoria em português",
  "confidence": 0.0 a 1.0,
  "reasoning": "breve explicação da classificação"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT_CLASSIFY,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }

    const result = JSON.parse(jsonMatch[0]) as ClassifyResult;
    return result;
  } catch (error) {
    logger.error('AI classify transaction error:', error);
    return {
      type: 'EXPENSE',
      category: 'Outras Despesas',
      confidence: 0.1,
      reasoning: 'Classificação automática falhou, usando padrão',
    };
  }
}

export async function classifyBatch(
  transactions: Array<{ description: string; amount: number; id?: string }>
): Promise<Array<ClassifyResult & { id?: string }>> {
  if (transactions.length === 0) return [];

  try {
    const txList = transactions
      .map((t, i) => `${i + 1}. Descrição: "${t.description}" | Valor: R$ ${(t.amount / 100).toFixed(2)}`)
      .join('\n');

    const prompt = `Classifique as seguintes ${transactions.length} transações financeiras:

${txList}

Responda em JSON com um array de objetos, um para cada transação na mesma ordem:
[
  {
    "type": "REVENUE|EXPENSE|TAX|WITHDRAWAL|TRANSFER|CMV",
    "category": "nome da categoria em português",
    "confidence": 0.0 a 1.0,
    "reasoning": "breve explicação"
  }
]`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT_CLASSIFY,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON array from AI response');
    }

    const results = JSON.parse(jsonMatch[0]) as ClassifyResult[];

    return results.map((r, i) => ({
      ...r,
      id: transactions[i]?.id,
    }));
  } catch (error) {
    logger.error('AI classify batch error:', error);
    return transactions.map((t) => ({
      id: t.id,
      type: 'EXPENSE',
      category: 'Outras Despesas',
      confidence: 0.1,
      reasoning: 'Classificação em lote falhou',
    }));
  }
}

export async function parseDocument(
  text: string,
  fileType: string
): Promise<ParsedTransaction[]> {
  try {
    const prompt = `Analise o seguinte conteúdo de arquivo (tipo: ${fileType}) e extraia as transações financeiras.

Conteúdo:
${text.substring(0, 8000)}

Extraia todas as transações e retorne em JSON:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "descrição da transação",
      "amount": 0.00,
      "type": "REVENUE|EXPENSE|TAX|WITHDRAWAL|TRANSFER|CMV",
      "category": "categoria sugerida em português"
    }
  ]
}

Regras:
- amount sempre positivo (use o tipo para indicar se é entrada ou saída)
- date no formato ISO YYYY-MM-DD
- Se não conseguir determinar o tipo com certeza, use EXPENSE para saídas e REVENUE para entradas`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT_PARSE,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return [];

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const result = JSON.parse(jsonMatch[0]) as { transactions: ParsedTransaction[] };
    return result.transactions || [];
  } catch (error) {
    logger.error('AI parse document error:', error);
    return [];
  }
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  description: string;
  metric?: string;
  value?: number;
  generatedAt: string;
}

export async function generateInsights(financialData: Record<string, unknown>): Promise<AIInsight[]> {
  try {
    const prompt = `Analise os seguintes dados financeiros e gere exatamente 3-5 insights estruturados:

${JSON.stringify(financialData, null, 2)}

Retorne um JSON válido no formato:
{
  "insights": [
    {
      "id": "1",
      "type": "warning|success|info|tip",
      "title": "Título curto do insight (máx 50 chars)",
      "description": "Descrição detalhada e acionável (máx 150 chars)",
      "metric": "Nome da métrica relacionada (opcional)",
      "value": 0.0
    }
  ]
}

Tipos:
- "warning": alerta de problema ou risco
- "success": ponto positivo ou conquista
- "info": informação relevante
- "tip": sugestão de melhoria

Seja específico com números e percentuais. Use português brasileiro.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT_INSIGHTS,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return getDefaultInsights();

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return getDefaultInsights();

    const result = JSON.parse(jsonMatch[0]) as { insights: AIInsight[] };
    const now = new Date().toISOString();
    return (result.insights || []).map((ins, i) => ({
      ...ins,
      id: String(i + 1),
      generatedAt: now,
    }));
  } catch (error) {
    logger.error('AI generate insights error:', error);
    return getDefaultInsights();
  }
}

function getDefaultInsights(): AIInsight[] {
  const now = new Date().toISOString();
  return [
    {
      id: '1',
      type: 'info',
      title: 'Análise em andamento',
      description: 'Registre mais transações para obter insights financeiros personalizados.',
      generatedAt: now,
    },
  ];
}

export async function detectAnomalies(
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: string;
    date: string;
    category?: string;
  }>
): Promise<AnomalyResult[]> {
  if (transactions.length === 0) return [];

  try {
    const summary = transactions.slice(0, 50).map((t) => ({
      id: t.id,
      desc: t.description.substring(0, 80),
      amount: (t.amount / 100).toFixed(2),
      type: t.type,
      date: t.date,
      category: t.category,
    }));

    const prompt = `Analise estas transações financeiras e identifique anomalias, inconsistências ou pontos de atenção:

${JSON.stringify(summary, null, 2)}

Procure por:
- Valores muito altos ou muito baixos para a categoria
- Transações duplicadas
- Descrições suspeitas
- Padrões incomuns de datas
- Classificações possivelmente erradas

Responda em JSON:
{
  "anomalies": [
    {
      "transactionId": "id da transação",
      "description": "descrição da transação",
      "amount": 0.00,
      "reason": "motivo da anomalia em português",
      "severity": "LOW|MEDIUM|HIGH"
    }
  ]
}

Se não encontrar anomalias significativas, retorne array vazio.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT_CLASSIFY,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return [];

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const result = JSON.parse(jsonMatch[0]) as { anomalies: AnomalyResult[] };
    return result.anomalies || [];
  } catch (error) {
    logger.error('AI detect anomalies error:', error);
    return [];
  }
}
