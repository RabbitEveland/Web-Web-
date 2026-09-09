import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getProfile, login as loginApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('mall_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('mall_user') || 'null'))
  const isLoggedIn = computed(() => Boolean(token.value))
  const isAdmin = computed(() => user.value?.role === 'admin')
  const persist = () => {
    token.value ? localStorage.setItem('mall_token', token.value) : localStorage.removeItem('mall_token')
    user.value ? localStorage.setItem('mall_user', JSON.stringify(user.value)) : localStorage.removeItem('mall_user')
  }
  async function login(payload) { const result = await loginApi(payload); token.value = result.token; user.value = result.user; persist(); return result }
  async function fetchProfile() { if (!token.value) return null; user.value = await getProfile(); persist(); return user.value }
  function logout() { token.value = ''; user.value = null; persist() }
  return { token, user, isLoggedIn, isAdmin, login, fetchProfile, logout }
})
