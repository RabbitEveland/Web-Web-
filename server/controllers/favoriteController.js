import pool from '../config/db.js'
import { fail, success } from '../utils/response.js'

export async function getFavorites(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT f.goods_id, f.created_at, g.name, g.price, g.original_price, g.stock, g.image, g.description, g.status
      FROM favorites f JOIN goods g ON g.id = f.goods_id WHERE f.user_id = ? ORDER BY f.id DESC`, [req.user.id])
    return success(res, rows)
  } catch (error) { next(error) }
}

export async function addFavorite(req, res, next) {
  try {
    const goodsId = Number(req.body.goods_id)
    const [goods] = await pool.execute('SELECT id FROM goods WHERE id = ?', [goodsId])
    if (!goods[0]) return fail(res, '商品不存在', 404)
    await pool.execute('INSERT IGNORE INTO favorites (user_id, goods_id) VALUES (?, ?)', [req.user.id, goodsId])
    return success(res, null, '收藏成功')
  } catch (error) { next(error) }
}

export async function deleteFavorite(req, res, next) {
  try {
    await pool.execute('DELETE FROM favorites WHERE user_id = ? AND goods_id = ?', [req.user.id, req.params.goodsId])
    return success(res, null, '已取消收藏')
  } catch (error) { next(error) }
}
