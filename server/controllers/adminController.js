import pool from '../config/db.js'
import { fail, success } from '../utils/response.js'

const orderStatusText = { pending: '待付款', paid: '待发货', shipped: '待收货', completed: '已完成', cancelled: '已取消' }

const validGoods = (body) => {
  const { name, category_id, price, original_price, stock, image, description, status = 1 } = body
  if (!name || !category_id || !Number.isFinite(Number(price)) || !Number.isFinite(Number(stock)) || Number(price) < 0 || Number(stock) < 0) return null
  return [name, Number(category_id), Number(price), Number(original_price || price), Number(stock), Number(body.sales || 0), image || '', description || '', Number(status) ? 1 : 0]
}

export async function adminGoods(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
    const keyword = (req.query.keyword || '').trim()
    const where = keyword ? 'WHERE g.name LIKE ?' : ''
    const params = keyword ? [`%${keyword}%`] : []
    const [counts] = await pool.execute(`SELECT COUNT(*) AS total FROM goods g ${where}`, params)
    const [list] = await pool.execute(`SELECT g.*, c.name AS category_name FROM goods g JOIN categories c ON c.id = g.category_id ${where}
      ORDER BY g.id DESC LIMIT ? OFFSET ?`, [...params, pageSize, (page - 1) * pageSize])
    return success(res, { list, total: counts[0].total, page, pageSize })
  } catch (error) { next(error) }
}

export async function createGoods(req, res, next) {
  try {
    const values = validGoods(req.body)
    if (!values) return fail(res, '请完整填写商品名称、分类、价格和库存')
    const [result] = await pool.execute(`INSERT INTO goods (name, category_id, price, original_price, stock, sales, image, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, values)
    const [rows] = await pool.execute('SELECT * FROM goods WHERE id = ?', [result.insertId])
    return success(res, rows[0], '商品已新增')
  } catch (error) { next(error) }
}

export async function updateGoods(req, res, next) {
  try {
    const values = validGoods(req.body)
    if (!values) return fail(res, '请完整填写商品名称、分类、价格和库存')
    const [result] = await pool.execute(`UPDATE goods SET name=?, category_id=?, price=?, original_price=?, stock=?, sales=?, image=?, description=?, status=?
      WHERE id=?`, [...values, req.params.id])
    if (!result.affectedRows) return fail(res, '商品不存在', 404)
    const [rows] = await pool.execute('SELECT * FROM goods WHERE id = ?', [req.params.id])
    return success(res, rows[0], '商品已更新')
  } catch (error) { next(error) }
}

export async function deleteGoods(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM goods WHERE id = ?', [req.params.id])
    if (!result.affectedRows) return fail(res, '商品不存在', 404)
    return success(res, null, '商品已删除')
  } catch (error) { next(error) }
}

// 管理员订单列表：只读展示用户、收货信息和下单时的商品快照。
export async function adminOrders(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
    const status = req.query.status || ''
    const where = status ? 'WHERE o.status = ?' : ''
    const params = status ? [status] : []
    const [counts] = await pool.execute(`SELECT COUNT(*) AS total FROM orders o ${where}`, params)
    const [orders] = await pool.execute(`SELECT o.*, u.username, u.email, a.receiver, a.phone, a.province, a.city, a.district, a.detail
      FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN addresses a ON a.id = o.address_id
      ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`, [...params, pageSize, (page - 1) * pageSize])
    if (!orders.length) return success(res, { list: [], total: counts[0].total, page, pageSize })
    const ids = orders.map(order => order.id)
    const [items] = await pool.execute(`SELECT * FROM order_items WHERE order_id IN (${ids.map(() => '?').join(',')}) ORDER BY id`, ids)
    const grouped = items.reduce((result, item) => { (result[item.order_id] ||= []).push(item); return result }, {})
    const list = orders.map(order => ({ ...order, status_text: orderStatusText[order.status], items: grouped[order.id] || [] }))
    return success(res, { list, total: counts[0].total, page, pageSize })
  } catch (error) { next(error) }
}

// 模拟发货：仅允许将已付款订单改为待收货，避免跳过支付步骤。
export async function shipOrder(req, res, next) {
  try {
    const [result] = await pool.execute("UPDATE orders SET status = 'shipped' WHERE id = ? AND status = 'paid'", [req.params.id])
    if (!result.affectedRows) return fail(res, '订单不存在，或当前状态不能发货', 400)
    return success(res, null, '模拟发货成功，订单已进入待收货状态')
  } catch (error) { next(error) }
}
