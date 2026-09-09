import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createOrder as createOrderApi, getOrderDetail, getOrders } from '@/api/order'

export const useOrderStore = defineStore('order', () => {
  const list = ref([]), currentOrder = ref(null), loading = ref(false)
  async function fetchOrders(params = {}) { loading.value = true; try { list.value = await getOrders(params); return list.value } finally { loading.value = false } }
  async function createOrder(data) { currentOrder.value = await createOrderApi(data); return currentOrder.value }
  async function fetchOrderDetail(id) { currentOrder.value = await getOrderDetail(id); return currentOrder.value }
  return { list, currentOrder, loading, fetchOrders, createOrder, fetchOrderDetail }
})
