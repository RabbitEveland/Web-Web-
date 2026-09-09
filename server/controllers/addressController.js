import pool from '../config/db.js'
import { fail, success } from '../utils/response.js'

export async function getAddresses(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [req.user.id])
    return success(res, rows)
  } catch (error) { next(error) }
}

export async function createAddress(req, res, next) {
  try {
    const { receiver, phone, province, city, district, detail, is_default = 0 } = req.body
    if (![receiver, phone, province, city, district, detail].every(Boolean)) return fail(res, '请完整填写收货地址')
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const [existing] = await conn.execute('SELECT COUNT(*) AS count FROM addresses WHERE user_id = ?', [req.user.id])
      const defaultValue = (Number(is_default) || existing[0].count === 0) ? 1 : 0
      if (defaultValue) await conn.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id])
      await conn.execute(`INSERT INTO addresses (user_id, receiver, phone, province, city, district, detail, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [req.user.id, receiver, phone, province, city, district, detail, defaultValue])
      await conn.commit()
    } catch (error) { await conn.rollback(); throw error } finally { conn.release() }
    return getAddresses(req, res, next)
  } catch (error) { next(error) }
}

export async function updateAddress(req, res, next) {
  try {
    const { receiver, phone, province, city, district, detail, is_default = 0 } = req.body
    if (![receiver, phone, province, city, district, detail].every(Boolean)) return fail(res, '请完整填写收货地址')
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const [exists] = await conn.execute('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
      if (!exists[0]) { const err = new Error('地址不存在'); err.status = 404; throw err }
      if (Number(is_default)) await conn.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id])
      await conn.execute(`UPDATE addresses SET receiver=?, phone=?, province=?, city=?, district=?, detail=?, is_default=? WHERE id=?`,
        [receiver, phone, province, city, district, detail, Number(is_default) ? 1 : 0, req.params.id])
      await conn.commit()
    } catch (error) { await conn.rollback(); throw error } finally { conn.release() }
    return getAddresses(req, res, next)
  } catch (error) { next(error) }
}

export async function deleteAddress(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
    if (!result.affectedRows) return fail(res, '地址不存在', 404)
    return success(res, null, '地址已删除')
  } catch (error) { next(error) }
}
