<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import { useGoodsStore } from '@/stores/goodsStore'

const route = useRoute(); const router = useRouter(); const goodsStore = useGoodsStore()
const query = reactive({ keyword: '', category: '', sort: 'default', page: 1, pageSize: 12 })
const activeTitle = computed(() => query.keyword ? `“${query.keyword}” 的搜索结果` : '发现精选好物')
function syncQuery() { query.keyword = route.query.keyword || ''; query.category = route.query.category ? Number(route.query.category) : ''; query.sort = route.query.sort || 'default'; query.page = Number(route.query.page) || 1 }
async function load() { await goodsStore.fetchGoods({ ...query, category: query.category || undefined, keyword: query.keyword || undefined }) }
function apply() { router.replace({ path: route.path, query: Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value !== 'default' && value !== 1 && value !== 12)) }) }
function changePage(page) { query.page = page; apply() }
watch(() => route.fullPath, async () => { syncQuery(); await load() })
onMounted(async () => { syncQuery(); await Promise.all([goodsStore.fetchCategories(), load()]) })
</script>

<template>
  <div class="page-shell">
    <section class="listing-head"><div><span class="eyebrow orange">EXPLORE STORE</span><h1>{{ activeTitle }}</h1><p>为你挑选 {{ goodsStore.total }} 件可靠又有趣的商品</p></div></section>
    <section class="filters content-card"><div class="filter-row"><span>商品分类</span><el-radio-group v-model="query.category" @change="query.page = 1; apply()"><el-radio-button label="">全部</el-radio-button><el-radio-button v-for="category in goodsStore.categories" :key="category.id" :label="category.id">{{ category.name }}</el-radio-button></el-radio-group></div><div class="filter-row"><span>排序方式</span><el-select v-model="query.sort" style="width: 10rem" @change="query.page = 1; apply()"><el-option label="默认排序" value="default" /><el-option label="价格从低到高" value="price_asc" /><el-option label="价格从高到低" value="price_desc" /><el-option label="销量优先" value="sales" /></el-select></div></section>
    <section v-loading="goodsStore.loading" class="product-grid list-grid"><ProductCard v-for="goods in goodsStore.list" :key="goods.id" :goods="goods" /><el-empty v-if="!goodsStore.loading && !goodsStore.list.length" class="empty-list" description="没有找到相关商品"><el-button type="primary" @click="router.push('/goods')">查看全部商品</el-button></el-empty></section>
    <div v-if="goodsStore.total" class="pagination"><el-pagination background layout="prev, pager, next" :current-page="query.page" :page-size="query.pageSize" :total="goodsStore.total" @current-change="changePage" /></div>
  </div>
</template>

<style scoped>
.listing-head { padding: 1rem 0 1.25rem; }.eyebrow { display: block; margin-bottom: .35rem; font-size: .7rem; font-weight: 800; letter-spacing: .14em; }.orange { color: #ec6a42; }.listing-head h1 { margin: 0; font-size: 2rem; letter-spacing: -.06em; }.listing-head p { margin: .45rem 0 0; color: #98a2b3; }.filters { padding: 1rem 1.25rem; }.filter-row { display: flex; align-items: center; gap: 1.25rem; min-height: 3rem; }.filter-row > span { width: 4.5rem; color: #475467; font-size: .9rem; font-weight: 700; }.list-grid { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; min-height: 15rem; margin-top: 1.25rem; }.empty-list { grid-column: 1 / -1; }.pagination { display: flex; justify-content: center; padding-top: 2rem; }
@media (max-width: 760px) { .filter-row { align-items: flex-start; flex-direction: column; gap: .5rem; padding: .4rem 0; }.filter-row :deep(.el-radio-group) { display: flex; flex-wrap: wrap; gap: .35rem; }.filter-row :deep(.el-radio-button__inner) { border: 1px solid #d0d5dd !important; border-radius: .35rem !important; box-shadow: none !important; }.list-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
