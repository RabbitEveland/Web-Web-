<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, ShoppingCart } from '@element-plus/icons-vue'
import { addFavorite } from '@/api/user'
import { useGoodsStore } from '@/stores/goodsStore'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/userStore'

const route = useRoute(); const router = useRouter(); const goodsStore = useGoodsStore(); const cartStore = useCartStore(); const userStore = useUserStore(); const quantity = ref(1)
const goods = computed(() => goodsStore.detail)
async function load() { quantity.value = 1; try { await goodsStore.fetchDetail(route.params.id) } catch { router.replace('/goods') } }
async function addToCart(buyNow = false) { if (!userStore.isLoggedIn) return router.push({ name: 'login', query: { redirect: route.fullPath } }); await cartStore.addCart({ goods_id: goods.value.id, quantity: quantity.value }); ElMessage.success('已加入购物车'); if (buyNow) router.push('/cart') }
async function favorite() { if (!userStore.isLoggedIn) return router.push({ name: 'login', query: { redirect: route.fullPath } }); await addFavorite(goods.value.id); ElMessage.success('已收藏，可在个人中心查看') }
watch(() => route.params.id, load); onMounted(load)
</script>

<template>
  <div class="page-shell" v-loading="!goods">
    <section v-if="goods" class="detail-card content-card"><div class="detail-image"><img :src="goods.image" :alt="goods.name" /></div><div class="detail-info"><el-tag effect="light">{{ goods.category_name }}</el-tag><h1>{{ goods.name }}</h1><p class="description">{{ goods.description }}</p><div class="price-panel"><span class="price detail-price">{{ Number(goods.price).toFixed(2) }}</span><del v-if="Number(goods.original_price) > Number(goods.price)">¥{{ Number(goods.original_price).toFixed(2) }}</del></div><div class="facts"><span>库存 <b>{{ goods.stock }}</b> 件</span><span>已售 <b>{{ goods.sales }}</b> 件</span><span>全场满 99 元包邮</span></div><el-divider /><div class="buy-row"><span>数量</span><el-input-number v-model="quantity" :min="1" :max="goods.stock" :disabled="!goods.stock" /><span v-if="!goods.stock" class="out-stock">暂时缺货</span></div><div class="actions"><el-button type="primary" size="large" :disabled="!goods.stock" @click="addToCart(true)">立即购买</el-button><el-button size="large" :disabled="!goods.stock" @click="addToCart()"><el-icon><ShoppingCart /></el-icon>加入购物车</el-button><el-button circle size="large" aria-label="收藏商品" @click="favorite"><el-icon><Star /></el-icon></el-button></div></div></section>
  </div>
</template>

<style scoped>
.detail-card { display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); gap: 2.5rem; padding: clamp(1rem, 3vw, 2rem); }.detail-image { overflow: hidden; aspect-ratio: 1 / .9; border-radius: 1rem; background: #f2f4f7; }.detail-image img { width: 100%; height: 100%; object-fit: cover; }.detail-info { align-self: center; }.detail-info h1 { margin: .7rem 0; font-size: clamp(1.6rem, 3vw, 2.3rem); letter-spacing: -.06em; line-height: 1.2; }.description { margin: 0 0 1rem; color: #667085; line-height: 1.75; }.price-panel { display: flex; align-items: baseline; gap: .6rem; padding: 1.1rem 1.2rem; border-radius: .75rem; background: #fff3ef; }.detail-price { font-size: 2rem; }.price-panel del { color: #98a2b3; }.facts { display: flex; flex-wrap: wrap; gap: 1.3rem; margin-top: 1rem; color: #667085; font-size: .85rem; }.facts b { color: #344054; }.buy-row { display: flex; align-items: center; gap: 1rem; color: #475467; font-size: .9rem; }.out-stock { color: #d92d20; }.actions { display: flex; gap: .75rem; margin-top: 1.4rem; }.actions :deep(.el-button--primary) { min-width: 9rem; background: #ec552f; border-color: #ec552f; }
@media (max-width: 700px) { .detail-card { grid-template-columns: 1fr; gap: 1.25rem; }.facts { gap: .75rem; }.actions { flex-wrap: wrap; }.actions :deep(.el-button--primary) { flex: 1; } }
</style>
