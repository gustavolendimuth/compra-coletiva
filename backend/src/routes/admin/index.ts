/**
 * Admin Routes Index
 * Router principal que agrupa todas as rotas admin
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware';
import { requireAdmin } from '../../middleware/adminMiddleware';
import dashboardRoutes from './dashboard';
import usersRoutes from './users';
import contentRoutes from './content';
import auditRoutes from './audit';

const router = Router();

// Apply authentication and admin check to all admin routes
router.use(requireAuth);
router.use(requireAdmin);

// Mount sub-routers
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/content', contentRoutes);
router.use('/audit', auditRoutes);

export default router;
