<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Search, ShoppingCart, UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/userStore'
import { useCartStore } from '@/stores/cartStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()
const keyword = ref(route.query.keyword || '')
const active = computed(() => route.path.startsWith('/goods') || route.path === '/search' ? '/goods' : route.path === '/' ? '/' : '')

function search() { if (keyword.value.trim()) router.push({ path: '/search', query: { keyword: keyword.value.trim() } }); else router.push('/goods') }
async function logout() {
  await ElMessageBox.confirm('确认退出当前账号吗？', '退出登录', { type: 'warning' })
  userStore.logout(); cartStore.clear(); router.push('/')
}
onMounted(() => { if (userStore.isLoggedIn) cartStore.fetchCart().catch(() => {}) })
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <router-link class="brand" to="/"><span class="brand-mark">C</span><span>橙心商城</span></router-link>
      <nav class="main-nav"><router-link :class="{ active: active === '/' }" to="/">首页</router-link><router-link :class="{ active: active === '/goods' }" to="/goods">精选商品</router-link></nav>
      <el-input v-model="keyword" class="header-search" placeholder="搜索商品" clearable @keyup.enter="search"><template #suffix><el-icon class="search-icon" @click="search"><Search /></el-icon></template></el-input>
      <div class="header-actions">
        <el-badge :value="cartStore.cartCount" :hidden="!cartStore.cartCount" class="cart-badge"><el-button circle aria-label="购物车" @click="router.push('/cart')"><el-icon><ShoppingCart /></el-icon></el-button></el-badge>
        <el-dropdown v-if="userStore.isLoggedIn" trigger="click">
          <button class="user-trigger"><el-avatar :size="30" :src="userStore.user?.avatar"><el-icon><UserFilled /></el-icon></el-avatar><span>{{ userStore.user?.username }}</span></button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item @click="router.push('/user/profile')">个人中心</el-dropdown-item><el-dropdown-item v-if="userStore.isAdmin" @click="router.push('/admin/goods')">后台管理</el-dropdown-item><el-dropdown-item divided @click="logout">退出登录</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
        <router-link v-else class="login-link" to="/login">登录 / 注册</router-link>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar { position: sticky; top: 0; z-index: 20; background: rgb(255 255 255 / 94%); border-bottom: 1px solid #eef1f5; backdrop-filter: blur(16px); }
.topbar-inner { width: min(1200px, calc(100% - 2rem)); min-height: 4.25rem; margin: auto; display: flex; align-items: center; gap: 1.5rem; }
.brand { display: inline-flex; align-items: center; gap: .5rem; color: #172b4d; font-size: 1.1rem; font-weight: 800; letter-spacing: -.04em; white-space: nowrap; }
.brand-mark { display: grid; width: 1.9rem; height: 1.9rem; place-items: center; color: #fff; border-radius: .62rem; background: linear-gradient(135deg, #ff7a45, #ed4936); font-family: Georgia, serif; font-size: 1.25rem; }
.main-nav { display: flex; gap: 1.25rem; color: #667085; font-size: .92rem; white-space: nowrap; }.main-nav a { padding: 1.45rem 0 1.25rem; border-bottom: .15rem solid transparent; }.main-nav a.active { color: #ec552f; border-color: #ec552f; font-weight: 700; }
.header-search { max-width: 22rem; margin-left: auto; }.search-icon { cursor: pointer; color: #667085; }
.header-actions { display: flex; align-items: center; gap: .85rem; white-space: nowrap; }.user-trigger { display: flex; align-items: center; gap: .45rem; border: 0; background: transparent; color: #344054; cursor: pointer; font-size: .9rem; }.login-link { color: #ec552f; font-weight: 700; font-size: .9rem; }
@media (max-width: 760px) { .topbar-inner { width: calc(100% - 1rem); gap: .75rem; min-height: 3.7rem; }.brand { font-size: 1rem; }.brand-mark { width: 1.7rem; height: 1.7rem; }.main-nav { display: none; }.header-search { max-width: none; }.user-trigger span { display: none; } }
</style>
