<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import ProductCard from '@/components/ProductCard.vue'
import { useGoodsStore } from '@/stores/goodsStore'

const router = useRouter()
const goodsStore = useGoodsStore()
onMounted(async () => { await Promise.all([goodsStore.fetchCategories(), goodsStore.fetchGoods({ page: 1, pageSize: 12, sort: 'sales' })]) })
</script>

<template>
  <div class="page-shell home-page">
    <section class="hero">
      <div class="hero-copy"><span class="eyebrow">CURATED FOR EVERYDAY</span><h1>把日常，<em>挑得更好一点</em></h1><p>从数码新意到生活好物，严选实用、耐看的每一件商品。</p><el-button type="primary" size="large" @click="router.push('/goods')">去逛一逛 <el-icon><ArrowRight /></el-icon></el-button></div>
      <div class="hero-visual"><div class="hero-circle circle-one"></div><div class="hero-circle circle-two"></div><div class="hero-statement"><span>本周优选</span><strong>300+</strong><small>值得带回家的好物</small></div><img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85" alt="本周精选商品" /></div>
    </section>

    <section class="category-strip content-card"><button class="category-item active" @click="router.push('/goods')"><span class="category-icon">✦</span><span>全部商品</span></button><button v-for="category in goodsStore.categories" :key="category.id" class="category-item" @click="router.push({ path: '/goods', query: { category: category.id } })"><span class="category-icon">{{ category.name.slice(0, 1) }}</span><span>{{ category.name }}</span></button></section>

    <div class="section-heading"><div><span class="eyebrow orange">POPULAR PICKS</span><h2>热门推荐</h2></div><el-button link type="primary" @click="router.push('/goods')">查看全部 <el-icon><ArrowRight /></el-icon></el-button></div>
    <section v-loading="goodsStore.loading" class="product-grid"><ProductCard v-for="goods in goodsStore.list.slice(0, 8)" :key="goods.id" :goods="goods" /></section>
  </div>
</template>

<style scoped>
.hero { position: relative; overflow: hidden; display: grid; grid-template-columns: 1.08fr .92fr; min-height: 23rem; border-radius: 1.5rem; background: linear-gradient(118deg, #152d50 0%, #274f7f 52%, #f7824a 150%); color: #fff; }.hero-copy { z-index: 1; align-self: center; max-width: 33rem; padding: 3.4rem clamp(1.75rem, 5vw, 4.6rem); }.eyebrow { display: block; margin-bottom: .45rem; font-size: .7rem; font-weight: 800; letter-spacing: .14em; color: #b6d4f8; }.eyebrow.orange { color: #ec6a42; }.hero h1 { margin: 0; font-size: clamp(2.3rem, 5vw, 4rem); letter-spacing: -.07em; line-height: 1.08; }.hero h1 em { color: #ffad72; font-style: normal; }.hero p { max-width: 26rem; margin: 1.1rem 0 1.65rem; color: #d6e3f4; line-height: 1.75; }.hero :deep(.el-button) { border: 0; background: #ff7544; }.hero-visual { position: relative; min-height: 100%; }.hero-visual img { position: absolute; right: 11%; bottom: 0; z-index: 1; width: min(23rem, 90%); height: 83%; object-fit: cover; border-radius: 9rem 9rem 1.2rem 1.2rem; filter: saturate(.9); }.hero-circle { position: absolute; border-radius: 50%; }.circle-one { top: 8%; right: -5%; width: 14rem; height: 14rem; border: 1px solid rgb(255 255 255 / 25%); }.circle-two { bottom: -30%; left: -17%; width: 22rem; height: 22rem; background: rgb(255 188 133 / 16%); }.hero-statement { position: absolute; right: 2%; bottom: 10%; z-index: 2; display: grid; padding: 1rem 1.15rem; border: 1px solid rgb(255 255 255 / 22%); border-radius: .85rem; background: rgb(15 39 75 / 70%); backdrop-filter: blur(.75rem); }.hero-statement span, .hero-statement small { font-size: .72rem; color: #cfe0f4; }.hero-statement strong { margin: .05rem 0; font-size: 1.8rem; }.category-strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: .25rem; padding: .8rem; margin-top: 1.25rem; }.category-item { display: grid; justify-items: center; gap: .5rem; padding: .65rem .25rem; border: 0; border-radius: .75rem; background: transparent; color: #667085; cursor: pointer; font-size: .8rem; }.category-item:hover, .category-item.active { background: #fff0ea; color: #e85b34; }.category-icon { display: grid; width: 2.1rem; height: 2.1rem; place-items: center; border-radius: .65rem; background: #f2f4f7; font-size: .8rem; font-weight: 800; }.category-item.active .category-icon, .category-item:hover .category-icon { background: #ffcfbd; }.product-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
@media (max-width: 800px) { .hero { grid-template-columns: 1fr; min-height: 30rem; }.hero-copy { padding-top: 2.4rem; }.hero-visual { min-height: 13rem; }.hero-visual img { right: 8%; width: 15rem; height: 14rem; }.category-strip { grid-template-columns: repeat(4, minmax(0, 1fr)); }.product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }.home-page :deep(.el-loading-mask) { border-radius: 1rem; }
</style>
