import request from '@/utils/request'
export const getAdminGoods = (params) => request.get('/admin/goods', { params })
export const createGoods = (data) => request.post('/admin/goods', data)
export const updateGoods = (id, data) => request.put(`/admin/goods/${id}`, data)
export const deleteGoods = (id) => request.delete(`/admin/goods/${id}`)
export const getAdminOrders = (params) => request.get('/admin/orders', { params })
export const shipOrder = (id) => request.put(`/admin/orders/${id}/ship`)
