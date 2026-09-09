import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { addCart as addCartApi, deleteCart as deleteCartApi, getCart, updateCart as updateCartApi } from '@/api/cart'

export const useCartStore = defineStore('cart', () => {
  const items = ref([]), loading = ref(false)
  const cartCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const totalPrice = computed(() => items.value.reduce((sum, item) => sum + Number(item.subtotal), 0))
  async function fetchCart() { loading.value = true; try { items.value = await getCart(); return items.value } finally { loading.value = false } }
  async function addCart(data) { items.value = await addCartApi(data); return items.value }
  async function updateCart(id, quantity) { items.value = await updateCartApi(id, { quantity }); return items.value }
  async function removeCart(id) { await deleteCartApi(id); items.value = items.value.filter(item => item.id !== id) }
  function clear() { items.value = [] }
  return { items, loading, cartCount, totalPrice, fetchCart, addCart, updateCart, removeCart, clear }
})
