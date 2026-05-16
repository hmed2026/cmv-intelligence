import { Request, Response } from 'express';
import { body } from 'express-validator';
import * as aiService from '../services/ai.service';
import * as transactionService from '../services/transaction.service';
import { validate } from '../middleware/validate.middleware';
import { logger } from '../config/logger';

export const classifyValidation = validate([
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Descrição obrigatória'),
  body('amount').isFloat({ min: 0 }).withMessage('Valor inválido'),
]);



export async function classifyTransaction(req: Request, res: Response): Promise<void> {
  try {
    const { description, amount, context } = req.body;

    const result = await aiService.classifyTransaction(description, Math.round(amount * 100), context);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('AI classify error:', error);
    res.status(500).json({ success: false, message: 'Erro ao classificar transação' });
  }
}

export async function generateInsights(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const now = new Date();
    const startDate = (req.query.startDate as string) || new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
    const endDate = (req.query.endDate as string) || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Fetch financial summary for context
    const summary = await transactionService.getFinancialSummary(companyId, startDate, endDate);
    const categoryBreakdown = await transactionService.getCategoryBreakdown(companyId, startDate, endDate);

    const financialData = {
      period: `${startDate} a ${endDate}`,
      summary,
      topCategories: categoryBreakdown.slice(0, 10),
    };

    const insights = await aiService.generateInsights(financialData as unknown as Record<string, unknown>);

    res.json({
      success: true,
      data: {
        insights,
        period: financialData.period,
        summary,
      },
    });
  } catch (error) {
    logger.error('AI insights error:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar insights' });
  }
}

export async function analyzeDocument(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Arquivo não enviado' });
      return;
    }

    const text = req.file.buffer.toString('utf-8');
    const fileType = req.file.mimetype.includes('pdf') ? 'PDF extrato bancário' : 'arquivo de texto com transações';

    const transactions = await aiService.parseDocument(text, fileType);

    res.json({
      success: true,
      data: {
        parsedTransactions: transactions,
        count: transactions.length,
      },
    });
  } catch (error) {
    logger.error('AI analyze document error:', error);
    res.status(500).json({ success: false, message: 'Erro ao analisar documento' });
  }
}

export async function detectAnomalies(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || req.body.companyId;
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const now = new Date();
    const startDate = req.body.startDate || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const endDate = req.body.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: transactions } = await transactionService.getTransactions(companyId, {
      startDate,
      endDate,
      limit: 100,
    });

    const formattedTxs = transactions.map((t) => ({
      id: t.id as string,
      description: t.description as string,
      amount: Math.round((t.amount as number) * 100),
      type: t.type as string,
      date: (t.date instanceof Date ? t.date : new Date(t.date as string)).toISOString().split('T')[0],
      category: t.category as string | undefined,
    }));

    const anomalies = await aiService.detectAnomalies(formattedTxs);

    res.json({
      success: true,
      data: {
        anomalies,
        count: anomalies.length,
        period: `${startDate} a ${endDate}`,
      },
    });
  } catch (error) {
    logger.error('AI detect anomalies error:', error);
    res.status(500).json({ success: false, message: 'Erro ao detectar anomalias' });
  }
}
