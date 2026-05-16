import { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import { logger } from '../config/logger';

export async function getDRE(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();

    if (month < 1 || month > 12) {
      res.status(400).json({ success: false, message: 'Mês deve ser entre 1 e 12' });
      return;
    }

    const dre = await reportService.getDRE(companyId, month, year);

    res.json({ success: true, data: dre });
  } catch (error) {
    logger.error('getDRE error:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar DRE' });
  }
}

export async function getCMVReport(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const now = new Date();
    const startDate = (req.query.startDate as string) || new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
    const endDate = (req.query.endDate as string) || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const report = await reportService.getCMVReport(companyId, startDate, endDate);

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('getCMVReport error:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar relatório CMV' });
  }
}

export async function getFluxoCaixa(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const now = new Date();
    const startDate = (req.query.startDate as string) || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = (req.query.endDate as string) || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const fluxo = await reportService.getFluxoCaixa(companyId, startDate, endDate);

    res.json({ success: true, data: fluxo });
  } catch (error) {
    logger.error('getFluxoCaixa error:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar fluxo de caixa' });
  }
}

export async function getTopExpenses(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const data = await reportService.getTopExpenses(companyId, limit);

    res.json({ success: true, data });
  } catch (error) {
    logger.error('getTopExpenses error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar principais despesas' });
  }
}

export async function getRevenueGrowth(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const months = req.query.months ? parseInt(req.query.months as string) : 6;
    const data = await reportService.getRevenueGrowth(companyId, months);

    res.json({ success: true, data });
  } catch (error) {
    logger.error('getRevenueGrowth error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar crescimento de receita' });
  }
}

export async function exportReport(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);
    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const reportType = (req.query.type as string) || 'dre';
    const now = new Date();

    let data: Record<string, unknown>[] = [];

    if (reportType === 'dre') {
      const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
      const dre = await reportService.getDRE(companyId, month, year);

      data = [
        { item: 'Receita Bruta', valor: dre.revenue },
        { item: 'CMV', valor: dre.cmv },
        { item: 'Lucro Bruto', valor: dre.grossProfit },
        { item: 'Margem Bruta (%)', valor: dre.grossMargin },
        ...Object.entries(dre.expenses).map(([k, v]) => ({ item: k, valor: v })),
        { item: 'Total Despesas', valor: dre.totalExpenses },
        { item: 'Impostos', valor: dre.taxes },
        { item: 'EBITDA', valor: dre.ebitda },
        { item: 'Retiradas', valor: dre.withdrawals },
        { item: 'Lucro Líquido', valor: dre.netProfit },
        { item: 'Margem Líquida (%)', valor: dre.netMargin },
      ];
    } else if (reportType === 'growth') {
      const months = req.query.months ? parseInt(req.query.months as string) : 6;
      data = (await reportService.getRevenueGrowth(companyId, months)) as Record<string, unknown>[];
    }

    const csv = reportService.exportToCSV(data);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${now.toISOString().split('T')[0]}.csv"`);
    res.send('﻿' + csv); // BOM for Excel compatibility
  } catch (error) {
    logger.error('exportReport error:', error);
    res.status(500).json({ success: false, message: 'Erro ao exportar relatório' });
  }
}
