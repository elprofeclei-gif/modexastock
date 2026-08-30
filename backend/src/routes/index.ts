import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import metaRoutes from './meta.routes';
import uploadRoutes from './upload.routes';
import posRoutes from './pos.routes';
import reportRoutes from './report.routes';
import vendorRoutes from './vendor.routes';
import purchaseRoutes from './purchase.routes';
import saleRoutes from './sale.routes';
import userRoutes from './user.routes';
import categoryRoutes from './category.routes';
import brandRoutes from './brand.routes';
import treasuryRoutes from './treasury.routes';
import clientRoutes from './client.routes';
import dataRoutes from './data.routes';
import settingRoutes from './setting.routes';
import boxRoutes from './box.routes';
import dashboardRoutes from './dashboard.routes';
import auditRoutes from './audit.routes'; // ✅ IMPORTADO

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/meta', metaRoutes);
router.use('/upload', uploadRoutes);
router.use('/pos', posRoutes);
router.use('/reports', reportRoutes);
router.use('/vendors', vendorRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/sales', saleRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/treasury', treasuryRoutes);
router.use('/clients', clientRoutes);
router.use('/data', dataRoutes);
router.use('/settings', settingRoutes);
router.use('/boxes', boxRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/audit', auditRoutes); // ✅ REGISTRADO

export default router;