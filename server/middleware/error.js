import { fail } from '../utils/response.js'

export function notFoundMiddleware(req, res) {
  return fail(res, `接口不存在：${req.method} ${req.originalUrl}`, 404)
}

export function errorMiddleware(error, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('API error:', error)
  if (error.code === 'ER_DUP_ENTRY') return fail(res, '数据已存在，请勿重复提交', 409)
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return fail(res, '关联数据不存在', 400)
  if (error.code === 'ER_ROW_IS_REFERENCED_2') return fail(res, '该商品已有订单记录，无法删除，可改为下架', 409)
  return fail(res, error.message || '服务器内部错误', error.status || 500)
}
