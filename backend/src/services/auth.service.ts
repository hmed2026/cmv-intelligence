import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { setCache, getCache, deleteCache } from '../config/redis';
import { logger } from '../config/logger';

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
  };
  companies: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export interface TokenPayload {
  userId: string;
  email: string;
  companyId?: string;
  role?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export async function register(data: RegisterData): Promise<LoginResult> {
  const existing = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase(), deletedAt: null },
  });

  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Create a default company for the new user
  const company = await prisma.company.create({
    data: {
      name: `Empresa de ${user.name.split(' ')[0]}`,
      email: user.email,
      active: true,
    },
  });

  await prisma.userCompany.create({
    data: {
      userId: user.id,
      companyId: company.id,
      role: 'OWNER',
    },
  });

  // Create default categories for the new company
  const defaultCategories = [
    { name: 'Vendas de Produtos', type: 'REVENUE' as const, color: '#10b981' },
    { name: 'Prestação de Serviços', type: 'REVENUE' as const, color: '#06b6d4' },
    { name: 'Custo de Mercadorias', type: 'CMV' as const, color: '#f59e0b' },
    { name: 'Salários e Encargos', type: 'EXPENSE' as const, color: '#ef4444' },
    { name: 'Aluguel', type: 'EXPENSE' as const, color: '#f97316' },
    { name: 'Marketing', type: 'EXPENSE' as const, color: '#a855f7' },
    { name: 'Simples Nacional', type: 'TAX' as const, color: '#dc2626' },
    { name: 'Pró-labore', type: 'WITHDRAWAL' as const, color: '#0ea5e9' },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.create({
      data: {
        companyId: company.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        isDefault: true,
      },
    });
  }

  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    companyId: company.id,
    role: 'OWNER',
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token in Redis
  await setCache(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    },
    companies: [{ id: company.id, name: company.name, role: 'OWNER' }],
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
    include: {
      companies: {
        include: {
          company: {
            select: { id: true, name: true, active: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const passwordMatch = await comparePassword(password, user.password);
  if (!passwordMatch) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const activeCompanies = user.companies
    .filter((uc) => uc.company.active)
    .map((uc) => ({
      id: uc.company.id,
      name: uc.company.name,
      role: uc.role,
    }));

  const primaryCompany = activeCompanies[0];

  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    companyId: primaryCompany?.id,
    role: primaryCompany?.role || user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await setCache(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    },
    companies: activeCompanies,
  };
}

export async function refreshAccessToken(token: string): Promise<{ accessToken: string }> {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');

  let decoded: TokenPayload;
  try {
    decoded = jwt.verify(token, secret) as TokenPayload;
  } catch {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const stored = await getCache(`refresh:${decoded.userId}`);
  if (!stored || stored !== token) {
    throw new Error('REFRESH_TOKEN_REVOKED');
  }

  const user = await prisma.user.findFirst({
    where: { id: decoded.userId, deletedAt: null },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    companyId: decoded.companyId,
    role: decoded.role,
  });

  return { accessToken };
}

export async function logout(userId: string): Promise<void> {
  await deleteCache(`refresh:${userId}`);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: {
      companies: {
        include: {
          company: {
            select: { id: true, name: true, logo: true, active: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    companies: user.companies.map((uc) => ({
      id: uc.company.id,
      name: uc.company.name,
      logo: uc.company.logo,
      role: uc.role,
      active: uc.company.active,
    })),
  };
}
