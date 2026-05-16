import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import * as companyService from '../services/company.service';
import { validate } from '../middleware/validate.middleware';
import { logger } from '../config/logger';

export const createCompanyValidation = validate([
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Nome deve ter entre 2 e 200 caracteres'),
  body('cnpj').optional().matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/).withMessage('CNPJ inválido'),
  body('email').optional().isEmail().withMessage('E-mail inválido'),
  body('phone').optional().isLength({ max: 20 }).withMessage('Telefone inválido'),
]);

export const updateCompanyValidation = validate([
  param('id').isUUID().withMessage('ID inválido'),
  body('name').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Nome inválido'),
  body('cnpj').optional().matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/).withMessage('CNPJ inválido'),
  body('email').optional().isEmail().withMessage('E-mail inválido'),
]);

export async function getCompanies(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Não autenticado' });
      return;
    }

    const companies = await companyService.getCompanies(req.user.userId);

    res.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    logger.error('getCompanies error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar empresas' });
  }
}

export async function getCompany(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Não autenticado' });
      return;
    }

    const company = await companyService.getCompany(req.params.id, req.user.userId);

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'COMPANY_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Empresa não encontrada' });
      return;
    }
    logger.error('getCompany error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar empresa' });
  }
}

export async function createCompany(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Não autenticado' });
      return;
    }

    const company = await companyService.createCompany(req.body, req.user.userId);

    res.status(201).json({
      success: true,
      message: 'Empresa criada com sucesso',
      data: company,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'CNPJ_ALREADY_EXISTS') {
      res.status(409).json({ success: false, message: 'CNPJ já cadastrado' });
      return;
    }
    logger.error('createCompany error:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar empresa' });
  }
}

export async function updateCompany(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Não autenticado' });
      return;
    }

    const company = await companyService.updateCompany(req.params.id, req.body, req.user.userId);

    res.json({
      success: true,
      message: 'Empresa atualizada com sucesso',
      data: company,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        res.status(403).json({ success: false, message: 'Sem permissão para editar esta empresa' });
        return;
      }
      if (error.message === 'CNPJ_ALREADY_EXISTS') {
        res.status(409).json({ success: false, message: 'CNPJ já cadastrado' });
        return;
      }
    }
    logger.error('updateCompany error:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar empresa' });
  }
}

export async function uploadLogo(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Não autenticado' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Arquivo não enviado' });
      return;
    }

    const filePath = `/uploads/${req.file.filename}`;
    const result = await companyService.uploadLogo(req.params.id, filePath, req.user.userId);

    res.json({
      success: true,
      message: 'Logo atualizado com sucesso',
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      res.status(403).json({ success: false, message: 'Sem permissão' });
      return;
    }
    logger.error('uploadLogo error:', error);
    res.status(500).json({ success: false, message: 'Erro ao fazer upload do logo' });
  }
}

export async function getCompanyStats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Não autenticado' });
      return;
    }

    const stats = await companyService.getCompanyStats(req.params.id, req.user.userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'COMPANY_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Empresa não encontrada' });
      return;
    }
    logger.error('getCompanyStats error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
  }
}
