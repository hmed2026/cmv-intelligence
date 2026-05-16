import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { logger } from './config/logger';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function bootstrap(): Promise<http.Server> {
  // Connect to database
  await connectDatabase();

  // Connect to Redis (non-fatal if it fails)
  await connectRedis();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`API available at http://localhost:${PORT}/api/v1`);
    logger.info(`Health check at http://localhost:${PORT}/health`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
    } else {
      logger.error('Server error:', error);
    }
    process.exit(1);
  });

  return server;
}

async function gracefulShutdown(server: http.Server, signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await disconnectDatabase();
      await disconnectRedis();
      logger.info('All connections closed. Exiting.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

bootstrap()
  .then((server) => {
    process.on('SIGTERM', () => gracefulShutdown(server, 'SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown(server, 'SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown(server, 'uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      gracefulShutdown(server, 'unhandledRejection');
    });
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
