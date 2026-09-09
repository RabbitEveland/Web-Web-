import { Router } from 'express'
import { cancelOrder, completeOrder, createOrder, getOrderDetail, getOrders, payOrder } from '../controllers/orderController.js'
import { authMiddleware } from '../middleware/auth.js'
const router = Router()
router.use(authMiddleware)
router.post('/', createOrder)
router.get('/', getOrders)
router.get('/:id', getOrderDetail)
router.put('/:id/cancel', cancelOrder)
router.put('/:id/pay', payOrder)
router.put('/:id/complete', completeOrder)
export default router
