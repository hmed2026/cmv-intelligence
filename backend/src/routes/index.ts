import { Router } from 'express';
import { authenticate, requireCompany } from '../middleware/auth.middleware';
import { upload, uploadMemory } from '../middleware/upload.middleware';

// Controllers
import * as authController from '../controllers/auth.controller';
import * as companyController from '../controllers/company.controller';
import * as transactionController from '../controllers/transaction.controller';
import * as uploadController from '../controllers/upload.controller';
import * as reportController from '../controllers/report.controller';
import * as aiController from '../controllers/ai.controller';

const router = Router();

// ─── Auth Routes ──────────────────────────────────────────────────────────────
const authRouter = Router();
authRouter.post('/register', authController.registerValidation, authController.register);
authRouter.post('/login', authController.loginValidation, authController.login);
authRouter.post('/refresh', authController.refreshToken);
authRouter.post('/logout', authenticate, authController.logout);
authRouter.get('/me', authenticate, authController.getMe);

// ─── Company Routes ───────────────────────────────────────────────────────────
const companyRouter = Router();
companyRouter.use(authenticate);
companyRouter.get('/', companyController.getCompanies);
companyRouter.post('/', companyController.createCompanyValidation, companyController.createCompany);
companyRouter.get('/:id', companyController.getCompany);
companyRouter.put('/:id', companyController.updateCompanyValidation, companyController.updateCompany);
companyRouter.post('/:id/logo', upload.single('logo'), companyController.uploadLogo);
companyRouter.get('/:id/stats', companyController.getCompanyStats);

// ─── Transaction Routes ───────────────────────────────────────────────────────
const transactionRouter = Router();
transactionRouter.use(authenticate);
transactionRouter.get('/summary', transactionController.getSummary);
transactionRouter.get('/chart/monthly', transactionController.getMonthlyChart);
transactionRouter.get('/chart/categories', transactionController.getCategoriesChart);
transactionRouter.get('/', transactionController.getTransactions);
transactionRouter.post('/', transactionController.createTransactionValidation, transactionController.createTransaction);
transactionRouter.get('/:id', transactionController.getTransaction);
transactionRouter.put('/:id', transactionController.updateTransactionValidation, transactionController.updateTransaction);
transactionRouter.delete('/:id', transactionController.deleteTransaction);

// ─── Upload Routes ────────────────────────────────────────────────────────────
const uploadRouter = Router();
uploadRouter.use(authenticate);
uploadRouter.post('/', upload.single('file'), uploadController.uploadFile);
uploadRouter.get('/history', uploadController.getUploadHistory);
uploadRouter.get('/:id', uploadController.getUploadById);

// ─── Report Routes ────────────────────────────────────────────────────────────
const reportRouter = Router();
reportRouter.use(authenticate);
reportRouter.get('/dre', reportController.getDRE);
reportRouter.get('/cmv', reportController.getCMVReport);
reportRouter.get('/fluxo-caixa', reportController.getFluxoCaixa);
reportRouter.get('/top-expenses', reportController.getTopExpenses);
reportRouter.get('/revenue-growth', reportController.getRevenueGrowth);
reportRouter.get('/export', reportController.exportReport);

// ─── AI Routes ────────────────────────────────────────────────────────────────
const aiRouter = Router();
aiRouter.use(authenticate);
aiRouter.post('/classify', aiController.classifyValidation, aiController.classifyTransaction);
aiRouter.get('/insights', aiController.generateInsights);
aiRouter.post('/insights', aiController.generateInsights);
aiRouter.post('/analyze-document', uploadMemory.single('file'), aiController.analyzeDocument);
aiRouter.post('/anomalies', aiController.detectAnomalies);

// ─── Mount all routers ────────────────────────────────────────────────────────
router.use('/auth', authRouter);
router.use('/companies', companyRouter);
router.use('/transactions', transactionRouter);
router.use('/upload', uploadRouter);
router.use('/reports', reportRouter);
router.use('/ai', aiRouter);

export default router;
