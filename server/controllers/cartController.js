import pool from '../config/db.js'
import { fail, success } from '../utils/response.js'

async function cartList(userId) {
  const [rows] = await pool.execute(`SELECT ci.id, ci.goods_id, ci.quantity, ci.created_at,
    g.name, g.price, g.original_price, g.stock, g.image, g.status, (ci.quantity * g.price) AS subtotal
    FROM cart_items ci JOIN goods g ON g.id = ci.goods_id WHERE ci.user_id = ? ORDER BY ci.id DESC`, [userId])
  return rows
}

export async function getCart(req, res, next) {
  try { return success(res, await cartList(req.user.id)) } catch (error) { next(error) }
}

export async function addCart(req, res, next) {
  try {
    const goodsId = Number(req.body.goods_id)
    const quantity = Number(req.body.quantity || 1)
    if (!goodsId || !Number.isInteger(quantity) || quantity < 1) return fail(res, '商品或数量参数不正确')
    const [goodsRows] = await pool.execute('SELECT id, stock, status FROM goods WHERE id = ?', [goodsId])
    const goods = goodsRows[0]
    if (!goods || !goods.status) return fail(res, '商品不存在或已下架', 404)
    const [items] = await pool.execute('SELECT id, quantity FROM cart_items WHERE user_id = ? AND goods_id = ?', [req.user.id, goodsId])
    const newQuantity = (items[0]?.quantity || 0) + quantity
    if (newQuantity > goods.stock) return fail(res, '加入数量超过库存')
    if (items[0]) await pool.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQuantity, items[0].id])
    else await pool.execute('INSERT INTO cart_items (user_id, goods_id, quantity) VALUES (?, ?, ?)', [req.user.id, goodsId, quantity])
    return success(res, await cartList(req.user.id), '已加入购物车')
  } catch (error) { next(error) }
}

export async function updateCart(req, res, next) {
  try {
    const quantity = Number(req.body.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) return fail(res, '数量必须为正整数')
    const [rows] = await pool.execute(`SELECT ci.id, g.stock, g.status FROM cart_items ci JOIN goods g ON g.id = ci.goods_id
      WHERE ci.id = ? AND ci.user_id = ?`, [req.params.id, req.user.id])
    if (!rows[0]) return fail(res, '购物车商品不存在', 404)
    if (!rows[0].status || quantity > rows[0].stock) return fail(res, '商品已下架或库存不足')
    await pool.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, req.params.id])
    return success(res, await cartList(req.user.id), '数量已更新')
  } catch (error) { next(error) }
}

export async function deleteCart(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
    if (!result.affectedRows) return fail(res, '购物车商品不存在', 404)
    return success(res, null, '已从购物车移除')
  } catch (error) { next(error) }
}
