import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import 'dotenv/config'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import goodsRoutes from './routes/goods.js'
import cartRoutes from './routes/cart.js'
import favoriteRoutes from './routes/favorite.js'
import addressRoutes from './routes/address.js'
import orderRoutes from './routes/order.js'
import adminRoutes from './routes/admin.js'
import { errorMiddleware, notFoundMiddleware } from './middleware/error.js'
import { success } from './utils/response.js'

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))
app.get('/api/health', (req, res) => success(res, { status: 'ok' }, '商城 API 服务正常'))
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/goods', goodsRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)
app.use(notFoundMiddleware)
app.use(errorMiddleware)

const port = Number(process.env.PORT || 3000)
app.listen(port, () => console.log(`商城 API 已启动：http://localhost:${port}`))
