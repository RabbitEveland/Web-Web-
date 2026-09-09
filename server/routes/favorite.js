import { Router } from 'express'
import { addFavorite, deleteFavorite, getFavorites } from '../controllers/favoriteController.js'
import { authMiddleware } from '../middleware/auth.js'
const router = Router()
router.use(authMiddleware)
router.get('/', getFavorites)
router.post('/', addFavorite)
router.delete('/:goodsId', deleteFavorite)
export default router
