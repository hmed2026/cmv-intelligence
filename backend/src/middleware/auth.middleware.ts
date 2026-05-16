import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';

export interface JwtPayload {
  userId: string;
  email: string;
  companyId?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      companyId?: string;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido',
      });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Erro de configuração do servidor',
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = decoded;
    // X-Company-Id header overrides JWT's companyId (for company switching)
    const headerCompanyId = req.headers['x-company-id'] as string | undefined;
    req.companyId = headerCompanyId || decoded.companyId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expirado, faça login novamente',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'TOKEN_INVALID',
      });
      return;
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno de autenticação',
    });
  }
}

export function requireCompany(req: Request, res: Response, next: NextFunction): void {
  if (!req.companyId) {
    res.status(400).json({
      success: false,
      message: 'Empresa não selecionada. Forneça o companyId no token.',
    });
    return;
  }
  next();
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role || '')) {
      res.status(403).json({
        success: false,
        message: 'Acesso negado: permissão insuficiente',
      });
      return;
    }

    next();
  };
}
