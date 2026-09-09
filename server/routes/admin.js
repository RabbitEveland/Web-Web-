import { Router } from 'express'
import { adminGoods, adminOrders, createGoods, deleteGoods, shipOrder, updateGoods } from '../controllers/adminController.js'
import { adminMiddleware, authMiddleware } from '../middleware/auth.js'
const router = Router()
router.use(authMiddleware, adminMiddleware)
router.get('/goods', adminGoods)
router.post('/goods', createGoods)
router.put('/goods/:id', updateGoods)
router.delete('/goods/:id', deleteGoods)
router.get('/orders', adminOrders)
router.put('/orders/:id/ship', shipOrder)
export default router
