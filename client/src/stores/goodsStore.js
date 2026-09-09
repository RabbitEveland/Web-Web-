import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getCategories, getGoodsDetail, getGoodsList } from '@/api/goods'

export const useGoodsStore = defineStore('goods', () => {
  const list = ref([]), categories = ref([]), total = ref(0), detail = ref(null), loading = ref(false)
  async function fetchGoods(params = {}) { loading.value = true; try { const data = await getGoodsList(params); list.value = data.list; total.value = data.total; return data } finally { loading.value = false } }
  async function fetchCategories() { categories.value = await getCategories(); return categories.value }
  async function fetchDetail(id) { detail.value = await getGoodsDetail(id); return detail.value }
  return { list, categories, total, detail, loading, fetchGoods, fetchCategories, fetchDetail }
})
