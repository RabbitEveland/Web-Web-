import { Router } from 'express'
import { getCategories, getGoods, getGoodsDetail } from '../controllers/goodsController.js'
const router = Router()
router.get('/categories', getCategories)
router.get('/', getGoods)
router.get('/:id', getGoodsDetail)
export default router
