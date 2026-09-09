import pool from '../config/db.js'
import { fail, success } from '../utils/response.js'

export const statusMap = { pending: '待付款', paid: '待发货', shipped: '待收货', completed: '已完成', cancelled: '已取消' }

async function appendOrderItems(orders, connection = pool) {
  if (!orders.length) return orders
  const ids = orders.map(item => item.id)
  const placeholders = ids.map(() => '?').join(',')
  const [items] = await connection.execute(`SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`, ids)
  // reduce 写法兼容 Node.js 18，避免依赖较新的 Object.groupBy。
  const grouped = items.reduce((result, item) => {
    (result[item.order_id] ||= []).push(item)
    return result
  }, {})
  return orders.map(order => ({ ...order, status_text: statusMap[order.status], items: grouped[order.id] || [] }))
}

export async function createOrder(req, res, next) {
  let conn
  try {
    const { address_id: addressId, items } = req.body
    if (!Array.isArray(items) || !items.length) return fail(res, '请选择需要结算的商品')
    const normalized = items.map(item => ({ goods_id: Number(item.goods_id), quantity: Number(item.quantity), cart_id: Number(item.cart_id) || null }))
    if (normalized.some(item => !item.goods_id || !Number.isInteger(item.quantity) || item.quantity < 1)) return fail(res, '订单商品参数错误')
    conn = await pool.getConnection()
    await conn.beginTransaction()
    if (addressId) {
      const [address] = await conn.execute('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [addressId, req.user.id])
      if (!address[0]) { const err = new Error('收货地址不存在'); err.status = 400; throw err }
    }
    let total = 0
    const snapshots = []
    for (const item of normalized) {
      const [rows] = await conn.execute('SELECT * FROM goods WHERE id = ? FOR UPDATE', [item.goods_id])
      const goods = rows[0]
      if (!goods || !goods.status) { const err = new Error('存在已下架商品'); err.status = 400; throw err }
      if (goods.stock < item.quantity) { const err = new Error(`${goods.name} 库存不足`); err.status = 400; throw err }
      const subtotal = Number(goods.price) * item.quantity
      total += subtotal
      snapshots.push({ ...item, goods, subtotal })
    }
    const orderNo = `M${Date.now()}${Math.floor(Math.random() * 900 + 100)}`
    const [orderResult] = await conn.execute('INSERT INTO orders (order_no, user_id, address_id, total_price, status) VALUES (?, ?, ?, ?, ?)',
      [orderNo, req.user.id, addressId || null, total.toFixed(2), 'pending'])
    for (const item of snapshots) {
      await conn.execute(`INSERT INTO order_items (order_id, goods_id, goods_name, goods_image, price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [orderResult.insertId, item.goods.id, item.goods.name, item.goods.image, item.goods.price, item.quantity, item.subtotal.toFixed(2)])
      await conn.execute('UPDATE goods SET stock = stock - ?, sales = sales + ? WHERE id = ?', [item.quantity, item.quantity, item.goods.id])
      if (item.cart_id) await conn.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [item.cart_id, req.user.id])
    }
    await conn.commit()
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderResult.insertId])
    return success(res, (await appendOrderItems(orders))[0], '订单创建成功')
  } catch (error) {
    if (conn) await conn.rollback()
    next(error)
  } finally { if (conn) conn.release() }
}

export async function getOrders(req, res, next) {
  try {
    const status = req.query.status
    const params = [req.user.id]
    const condition = status ? 'AND status = ?' : ''
    if (status) params.push(status)
    const [orders] = await pool.execute(`SELECT * FROM orders WHERE user_id = ? ${condition} ORDER BY id DESC`, params)
    return success(res, await appendOrderItems(orders))
  } catch (error) { next(error) }
}

export async function getOrderDetail(req, res, next) {
  try {
    const [orders] = await pool.execute(`SELECT o.*, a.receiver, a.phone, a.province, a.city, a.district, a.detail
      FROM orders o LEFT JOIN addresses a ON a.id = o.address_id WHERE o.id = ? AND o.user_id = ?`, [req.params.id, req.user.id])
    if (!orders[0]) return fail(res, '订单不存在', 404)
    return success(res, (await appendOrderItems(orders))[0])
  } catch (error) { next(error) }
}

export async function cancelOrder(req, res, next) {
  let conn
  try {
    conn = await pool.getConnection()
    await conn.beginTransaction()
    const [orders] = await conn.execute('SELECT * FROM orders WHERE id = ? AND user_id = ? FOR UPDATE', [req.params.id, req.user.id])
    const order = orders[0]
    if (!order) { const err = new Error('订单不存在'); err.status = 404; throw err }
    if (order.status !== 'pending') { const err = new Error('仅待付款订单可取消'); err.status = 400; throw err }
    const [items] = await conn.execute('SELECT goods_id, quantity FROM order_items WHERE order_id = ?', [order.id])
    for (const item of items) await conn.execute('UPDATE goods SET stock = stock + ?, sales = GREATEST(sales - ?, 0) WHERE id = ?', [item.quantity, item.quantity, item.goods_id])
    await conn.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", [order.id])
    await conn.commit()
    return success(res, null, '订单已取消')
  } catch (error) {
    if (conn) await conn.rollback()
    next(error)
  } finally { if (conn) conn.release() }
}

// 模拟支付只改变订单状态，不会接入真实支付网关或发生资金交易。
export async function payOrder(req, res, next) {
  try {
    const { payment_brand: paymentBrand, payment_last4: paymentLast4 } = req.body || {}
    if (!['Visa', 'Mastercard'].includes(paymentBrand) || !/^\d{4}$/.test(paymentLast4 || '')) {
      return fail(res, '请填写有效的模拟信用卡信息')
    }
    // 完整卡号、有效期和 CVV 只在浏览器内校验，后端绝不接收或存储。
    const [result] = await pool.execute(`UPDATE orders SET status = 'paid', payment_method = 'card', payment_brand = ?,
      payment_last4 = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND status = 'pending'`,
    [paymentBrand, paymentLast4, req.params.id, req.user.id])
    if (!result.affectedRows) return fail(res, '订单不存在，或当前状态不能付款', 400)
    return success(res, null, '模拟支付成功，订单已进入待发货状态')
  } catch (error) { next(error) }
}

// 只有已发货订单可以由买家确认收货，状态流转为已完成。
export async function completeOrder(req, res, next) {
  try {
    const [result] = await pool.execute("UPDATE orders SET status = 'completed' WHERE id = ? AND user_id = ? AND status = 'shipped'", [req.params.id, req.user.id])
    if (!result.affectedRows) return fail(res, '订单不存在，或当前状态不能确认收货', 400)
    return success(res, null, '已确认收货，订单已完成')
  } catch (error) { next(error) }
}
