import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import * as importService from '../services/import.service';
import { logger } from '../config/logger';

export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || req.body.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Arquivo não enviado' });
      return;
    }

    const { originalname, filename, path: filePath, mimetype } = req.file;
    const ext = path.extname(originalname).replace('.', '').toLowerCase();

    // Create import record
    const importRecord = await importService.createImport(companyId, originalname, ext);

    // Read file buffer
    const buffer = fs.readFileSync(filePath);

    // Process asynchronously (don't await)
    importService.processFile(importRecord.id, buffer, ext, companyId).catch((err) => {
      logger.error('Async file processing error:', err);
    });

    // Optionally clean up the disk file after reading into memory
    // fs.unlinkSync(filePath);

    res.status(202).json({
      success: true,
      message: 'Arquivo recebido. Processamento iniciado.',
      data: {
        importId: importRecord.id,
        fileName: originalname,
        fileType: ext,
        status: 'PROCESSING',
      },
    });
  } catch (error) {
    logger.error('uploadFile error:', error);

    if (error instanceof Error && error.message.includes('File too large')) {
      res.status(413).json({ success: false, message: 'Arquivo muito grande. Máximo 50MB.' });
      return;
    }

    res.status(500).json({ success: false, message: 'Erro ao processar arquivo' });
  }
}

export async function getUploadHistory(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);

    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const history = await importService.getImportHistory(companyId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('getUploadHistory error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico de importações' });
  }
}

export async function getUploadById(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.companyId || (req.query.companyId as string);

    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId obrigatório' });
      return;
    }

    const importRecord = await importService.getImportById(req.params.id, companyId);

    res.json({
      success: true,
      data: importRecord,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'IMPORT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Importação não encontrada' });
      return;
    }
    logger.error('getUploadById error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar importação' });
  }
}
