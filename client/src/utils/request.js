import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({ baseURL: '/api', timeout: 10000 })

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('mall_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body?.code === 0) return body.data
    ElMessage.error(body?.message || '请求失败')
    return Promise.reject(new Error(body?.message || '请求失败'))
  },
  (error) => {
    const { status, data } = error.response || {}
    const message = data?.message || (status === 500 ? '服务器繁忙，请稍后重试' : '网络连接失败')
    if (status === 401) {
      localStorage.removeItem('mall_token')
      localStorage.removeItem('mall_user')
      if (!location.pathname.startsWith('/login')) location.href = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
    } else ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request
