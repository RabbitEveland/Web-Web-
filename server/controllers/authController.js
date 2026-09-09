import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'
import { fail, success } from '../utils/response.js'

const publicUser = (user) => ({
  id: user.id, username: user.username, email: user.email, avatar: user.avatar,
  phone: user.phone, role: user.role, created_at: user.created_at
})

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password) return fail(res, '用户名、邮箱和密码均不能为空')
    if (username.length < 2 || username.length > 30) return fail(res, '用户名长度应为 2-30 位')
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, '邮箱格式不正确')
    if (password.length < 6) return fail(res, '密码至少 6 位')
    const [exists] = await pool.execute('SELECT id FROM users WHERE username = ? OR email = ?', [username, email])
    if (exists.length) return fail(res, '用户名或邮箱已被使用', 409)
    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, passwordHash]
    )
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId])
    return success(res, publicUser(rows[0]), '注册成功，请登录')
  } catch (error) { next(error) }
}

export async function login(req, res, next) {
  try {
    const { account, password } = req.body
    if (!account || !password) return fail(res, '请输入账号和密码')
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1', [account, account])
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password))) return fail(res, '账号或密码错误', 401)
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'mall_demo_secret_change_me', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })
    return success(res, { token, user: publicUser(user) }, '登录成功')
  } catch (error) { next(error) }
}
