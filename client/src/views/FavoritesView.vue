<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProductCard from '@/components/ProductCard.vue'
import { deleteFavorite, getFavorites } from '@/api/user'
const list = ref([]); const loading = ref(false)
async function load() { loading.value = true; try { list.value = await getFavorites() } finally { loading.value = false } }
async function remove(goodsId) { await deleteFavorite(goodsId); list.value = list.value.filter(item => item.goods_id !== goodsId); ElMessage.success('已取消收藏') }
onMounted(load)
</script>

<template><section class="content-card panel"><div class="panel-title"><div><h1>我的收藏</h1><p>留下那些令你心动的好物</p></div></div><div v-loading="loading" class="favorite-grid"><div v-for="goods in list" :key="goods.goods_id" class="favorite-item"><ProductCard :goods="goods" /><el-button link type="danger" @click="remove(goods.goods_id)">取消收藏</el-button></div><el-empty v-if="!loading && !list.length" class="empty-favorite" description="还没有收藏商品" /></div></section></template>

<style scoped>
.panel { padding: clamp(1.2rem, 3vw, 2rem); }.panel-title { padding-bottom: 1.2rem; border-bottom: 1px solid #edf0f4; }.panel-title h1 { margin: 0; font-size: 1.4rem; letter-spacing: -.05em; }.panel-title p { margin: .35rem 0 0; color: #98a2b3; font-size: .85rem; }.favorite-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; padding-top: 1.2rem; }.favorite-item { display: grid; gap: .3rem; }.favorite-item :deep(.el-button) { justify-self: end; }.empty-favorite { grid-column: 1 / -1; }
@media (max-width: 860px) { .favorite-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 440px) { .favorite-grid { grid-template-columns: 1fr; } }
</style>
