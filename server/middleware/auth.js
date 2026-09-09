import jwt from 'jsonwebtoken'
import { fail } from '../utils/response.js'

export function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) return fail(res, '请先登录', 401)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'mall_demo_secret_change_me')
    next()
  } catch {
    return fail(res, '登录已过期，请重新登录', 401)
  }
}

export function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') return fail(res, '仅管理员可执行此操作', 403)
  next()
}
