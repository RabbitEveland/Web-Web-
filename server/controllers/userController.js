import pool from '../config/db.js'
import { fail, success } from '../utils/response.js'

const fields = 'id, username, email, avatar, phone, role, created_at, updated_at'

export async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT ${fields} FROM users WHERE id = ?`, [req.user.id])
    if (!rows[0]) return fail(res, '用户不存在', 404)
    return success(res, rows[0])
  } catch (error) { next(error) }
}

export async function updateProfile(req, res, next) {
  try {
    const { avatar = null, phone = null, email, username } = req.body
    if (!username || !email) return fail(res, '用户名与邮箱不能为空')
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, '邮箱格式不正确')
    const [exists] = await pool.execute(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', [username, email, req.user.id]
    )
    if (exists.length) return fail(res, '用户名或邮箱已被使用', 409)
    await pool.execute('UPDATE users SET username = ?, email = ?, phone = ?, avatar = ? WHERE id = ?', [username, email, phone, avatar, req.user.id])
    return getProfile(req, res, next)
  } catch (error) { next(error) }
}
