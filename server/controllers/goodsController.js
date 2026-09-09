import pool from '../config/db.js'
import { fail, success } from '../utils/response.js'

const goodsFields = `g.id, g.name, g.category_id, c.name AS category_name, g.price, g.original_price,
  g.stock, g.sales, g.image, g.description, g.status, g.created_at, g.updated_at`

export async function getCategories(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT id, name, icon, sort FROM categories ORDER BY sort, id')
    return success(res, rows)
  } catch (error) { next(error) }
}

export async function getGoods(req, res, next) {
  try {
    const { keyword = '', category = '', sort = 'default' } = req.query
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 12, 1), 50)
    const conditions = ['g.status = 1']
    const params = []
    if (keyword.trim()) { conditions.push('(g.name LIKE ? OR g.description LIKE ?)'); params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`) }
    if (category) { conditions.push('g.category_id = ?'); params.push(Number(category)) }
    const where = `WHERE ${conditions.join(' AND ')}`
    const orderMap = { price_asc: 'g.price ASC', price_desc: 'g.price DESC', sales: 'g.sales DESC', default: 'g.id DESC' }
    const orderBy = orderMap[sort] || orderMap.default
    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM goods g ${where}`, params)
    const [list] = await pool.execute(
      `SELECT ${goodsFields} FROM goods g JOIN categories c ON c.id = g.category_id ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    )
    return success(res, { list, total: countRows[0].total, page, pageSize })
  } catch (error) { next(error) }
}

export async function getGoodsDetail(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT ${goodsFields} FROM goods g JOIN categories c ON c.id = g.category_id WHERE g.id = ? AND g.status = 1`, [req.params.id]
    )
    if (!rows[0]) return fail(res, '商品不存在或已下架', 404)
    return success(res, rows[0])
  } catch (error) { next(error) }
}
