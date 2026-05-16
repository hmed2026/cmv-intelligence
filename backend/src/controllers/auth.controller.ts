import { Request, Response } from 'express';
import { body } from 'express-validator';
import * as authService from '../services/auth.service';
import { validate } from '../middleware/validate.middleware';
import { logger } from '../config/logger';

export const registerValidation = validate([
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter letras maiúsculas, minúsculas e números'),
]);

export const loginValidation = validate([
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido'),
  body('password').notEmpty().withMessage('Senha obrigatória'),
]);

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.register({
      email: req.body.email,
      name: req.body.name,
      password: req.body.password,
    });

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso',
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      res.status(409).json({
        success: false,
        message: 'Este e-mail já está cadastrado',
      });
      return;
    }

    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar conta. Tente novamente.',
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.login(req.body.email, req.body.password);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({
        success: false,
        message: 'E-mail ou senha incorretos',
      });
      return;
    }

    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar login. Tente novamente.',
    });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token não fornecido',
      });
      return;
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_REFRESH_TOKEN' || error.message === 'REFRESH_TOKEN_REVOKED') {
        res.status(401).json({
          success: false,
          message: 'Token de renovação inválido ou expirado',
        });
        return;
      }
    }

    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao renovar token',
    });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.userId) {
      await authService.logout(req.user.userId);
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar logout',
    });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Não autenticado' });
      return;
    }

    const user = await authService.getMe(req.user.userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      return;
    }

    logger.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário',
    });
  }
}
