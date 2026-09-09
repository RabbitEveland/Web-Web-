import { Router } from 'express'
import { addCart, deleteCart, getCart, updateCart } from '../controllers/cartController.js'
import { authMiddleware } from '../middleware/auth.js'
const router = Router()
router.use(authMiddleware)
router.get('/', getCart)
router.post('/', addCart)
router.put('/:id', updateCart)
router.delete('/:id', deleteCart)
export default router
