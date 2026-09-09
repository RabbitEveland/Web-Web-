import request from '@/utils/request'
export const getGoodsList = (params) => request.get('/goods', { params })
export const getGoodsDetail = (id) => request.get(`/goods/${id}`)
export const getCategories = () => request.get('/goods/categories')
