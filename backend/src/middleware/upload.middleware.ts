import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage: StorageEngine = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const allowedMimeTypes = [
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
  'application/octet-stream',
];

const allowedExtensions = ['.csv', '.xlsx', '.xls', '.pdf', '.txt', '.ofx', '.qif'];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = allowedMimeTypes.includes(file.mimetype);
  const extOk = allowedExtensions.includes(ext);

  if (mimeOk || extOk) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de arquivo não suportado. Permitidos: ${allowedExtensions.join(', ')}`
      )
    );
  }
};

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800', 10); // 50MB default

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 1,
  },
});

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 1,
  },
});
