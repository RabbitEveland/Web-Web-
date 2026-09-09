<script setup>
import { useRouter } from 'vue-router'
const props = defineProps({ goods: { type: Object, required: true } })
const router = useRouter()
const emit = defineEmits(['add-cart'])
const goDetail = () => router.push(`/detail/${props.goods.id || props.goods.goods_id}`)
</script>

<template>
  <article class="product-card">
    <button class="product-image" :aria-label="`查看 ${goods.name}`" @click="goDetail"><img :src="goods.image" :alt="goods.name" loading="lazy" /></button>
    <div class="product-info"><p class="product-name" :title="goods.name" @click="goDetail">{{ goods.name }}</p><p class="product-desc">{{ goods.description || '精选好物，品质保障' }}</p><div class="product-bottom"><div><span class="price">{{ Number(goods.price).toFixed(2) }}</span><del v-if="Number(goods.original_price) > Number(goods.price)">¥{{ Number(goods.original_price).toFixed(2) }}</del></div><span class="sales">已售 {{ goods.sales || 0 }}</span></div><el-button type="primary" plain size="small" @click="goDetail">查看详情</el-button></div>
  </article>
</template>

<style scoped>
.product-card { overflow: hidden; display: flex; flex-direction: column; background: #fff; border: 1px solid #e9edf4; border-radius: 1rem; transition: transform .2s, box-shadow .2s; }.product-card:hover { transform: translateY(-.25rem); box-shadow: 0 .8rem 1.5rem rgb(16 24 40 / 10%); }
.product-image { aspect-ratio: 1 / .78; overflow: hidden; padding: 0; border: 0; background: #f2f4f7; cursor: pointer; }.product-image img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s; }.product-card:hover img { transform: scale(1.05); }
.product-info { display: flex; flex: 1; flex-direction: column; padding: .85rem; }.product-name { overflow: hidden; margin: 0; color: #1d2939; font-weight: 700; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }.product-desc { display: -webkit-box; overflow: hidden; min-height: 2.5rem; margin: .45rem 0 .6rem; color: #98a2b3; font-size: .78rem; line-height: 1.55; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }.product-bottom { display: flex; align-items: end; justify-content: space-between; min-height: 1.6rem; margin-top: auto; margin-bottom: .65rem; }.sales, del { color: #98a2b3; font-size: .72rem; } del { margin-left: .35rem; }
</style>
