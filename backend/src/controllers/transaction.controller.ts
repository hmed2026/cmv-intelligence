import { Request, Response } from 'express';
import { body, query, param } from 'express-validator';
import { TransactionType } from '@prisma/client';
import * as transactionService from '../services/transaction.service';
import { validate } from '../middleware/validate.middleware';
import { logger } from '../config/logger';

export const createTransactionValidation = validate([
  body('date').isISO8601().withMessage('Data inválida (use YYYY-MM-DD)'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Descrição obrigatória'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
  body('type')
    .isIn(['REVENUE', 'EXPENSE', 'TAX', 'WITHDRAWAL', 'TRANSFER', 'CMV'])
    .withMessage('Tipo inválido'),
  body('category').optional().isLength({ max: 100 }),
  body('bankAccount').optional().isLength({ max: 100 }),
  body('tags').optional().isArray(),
]);

export const updateTransactionValidation = validate([
  param('id').isUUID().withMessage('ID inválido'),
  body('date').optional().isISO8601().withMessage('Data inválida'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Valor inválido'),
  body('type')
    .optional()
    .isIn(['REVENUE', 'EXPENSE', 'TAX', 'WITHDRAWAL', 'TRANSFER', 'CMV'])
    .withMessage('Tipo inválido'),
]);

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);

    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const filters: transactionService.TransactionFilters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      type: req.query.type as TransactionType,
      category: req.query.category as string,
      bankAccount: req.query.bankAccount as string,
      search: req.query.search as string,
    };

    const result = await transactionService.getTransactions(companyId, filters);

    // Return PaginatedResponse structure so frontend can access data.data, data.total, etc.
    res.json({
      success: true,
      data: {
        data: result.data,
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      },
    });
  } catch (error) {
    logger.error('getTransactions error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar transações' });
  }
}

export async function getTransaction(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const transaction = await transactionService.getTransaction(req.params.id, companyId);

    res.json({ success: true, data: transaction });
  } catch (error) {
    if (error instanceof Error && error.message === 'TRANSACTION_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Transação não encontrada' });
      return;
    }
    logger.error('getTransaction error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar transação' });
  }
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || req.body.companyId;
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const transaction = await transactionService.createTransaction(req.body, companyId);

    res.status(201).json({
      success: true,
      message: 'Transação criada com sucesso',
      data: transaction,
    });
  } catch (error) {
    logger.error('createTransaction error:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar transação' });
  }
}

export async function updateTransaction(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const transaction = await transactionService.updateTransaction(req.params.id, req.body, companyId);

    res.json({
      success: true,
      message: 'Transação atualizada com sucesso',
      data: transaction,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'TRANSACTION_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Transação não encontrada' });
      return;
    }
    logger.error('updateTransaction error:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar transação' });
  }
}

export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    await transactionService.deleteTransaction(req.params.id, companyId);

    res.json({
      success: true,
      message: 'Transação removida com sucesso',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'TRANSACTION_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Transação não encontrada' });
      return;
    }
    logger.error('deleteTransaction error:', error);
    res.status(500).json({ success: false, message: 'Erro ao remover transação' });
  }
}

export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const now = new Date();
    const startDate = (req.query.startDate as string) || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = (req.query.endDate as string) || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const summary = await transactionService.getFinancialSummary(companyId, startDate, endDate);

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('getSummary error:', error);
    res.status(500).json({ success: false, message: 'Erro ao calcular resumo financeiro' });
  }
}

export async function getMonthlyChart(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const data = await transactionService.getFlowByMonth(companyId, year);

    res.json({ success: true, data });
  } catch (error) {
    logger.error('getMonthlyChart error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar dados do gráfico' });
  }
}

export async function getCategoriesChart(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const now = new Date();
    const startDate = (req.query.startDate as string) || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = (req.query.endDate as string) || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const data = await transactionService.getCategoryBreakdown(companyId, startDate, endDate);

    res.json({ success: true, data });
  } catch (error) {
    logger.error('getCategoriesChart error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar categorias' });
  }
}
