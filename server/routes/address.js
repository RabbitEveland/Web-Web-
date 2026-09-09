import { Router } from 'express'
import { createAddress, deleteAddress, getAddresses, updateAddress } from '../controllers/addressController.js'
import { authMiddleware } from '../middleware/auth.js'
const router = Router()
router.use(authMiddleware)
router.get('/', getAddresses)
router.post('/', createAddress)
router.put('/:id', updateAddress)
router.delete('/:id', deleteAddress)
export default router
