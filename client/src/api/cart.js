import request from '@/utils/request'
export const getCart = () => request.get('/cart')
export const addCart = (data) => request.post('/cart', data)
export const updateCart = (id, data) => request.put(`/cart/${id}`, data)
export const deleteCart = (id) => request.delete(`/cart/${id}`)
