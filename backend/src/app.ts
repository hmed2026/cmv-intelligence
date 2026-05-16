import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { logger } from './config/logger';
import routes from './routes/index';

const app: Application = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',');

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Id'],
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
});

app.use(globalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// ─── Request Logging ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (message: string) => logger.info(message.trim()) },
    })
  );
}

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files (uploads) ───────────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error & { status?: number; code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', { message: err.message, stack: err.stack });

  if (err.message?.includes('CORS')) {
    res.status(403).json({ success: false, message: 'CORS: origem não permitida' });
    return;
  }

  if (err.message?.includes('File too large') || err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ success: false, message: 'Arquivo muito grande. Máximo 50MB.' });
    return;
  }

  if (err.message?.includes('Tipo de arquivo não suportado')) {
    res.status(415).json({ success: false, message: err.message });
    return;
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
  });
});

export default app;
