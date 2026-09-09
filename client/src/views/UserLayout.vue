<script setup>
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Avatar, Location, List, Star, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/userStore'
import { useCartStore } from '@/stores/cartStore'
const router = useRouter(); const userStore = useUserStore(); const cartStore = useCartStore()
async function logout() { await ElMessageBox.confirm('确认退出当前账号吗？', '退出登录', { type: 'warning' }); userStore.logout(); cartStore.clear(); router.push('/') }
</script>

<template><div class="page-shell"><div class="user-layout"><aside class="user-side content-card"><div class="user-summary"><el-avatar :size="52" :src="userStore.user?.avatar">{{ userStore.user?.username?.slice(0, 1) }}</el-avatar><div><b>{{ userStore.user?.username }}</b><p>{{ userStore.user?.email }}</p></div></div><el-menu :default-active="$route.path" router><el-menu-item index="/user/profile"><el-icon><Avatar /></el-icon>个人资料</el-menu-item><el-menu-item index="/user/address"><el-icon><Location /></el-icon>收货地址</el-menu-item><el-menu-item index="/user/orders"><el-icon><List /></el-icon>我的订单</el-menu-item><el-menu-item index="/user/favorites"><el-icon><Star /></el-icon>我的收藏</el-menu-item></el-menu><el-button class="logout-btn" text @click="logout"><el-icon><SwitchButton /></el-icon>退出登录</el-button></aside><section class="user-content"><router-view /></section></div></div></template>

<style scoped>
.user-layout { display: grid; grid-template-columns: 14.5rem minmax(0, 1fr); gap: 1.25rem; }.user-side { align-self: start; overflow: hidden; padding: 1rem .65rem; }.user-summary { display: flex; align-items: center; gap: .7rem; padding: .55rem .65rem 1.1rem; }.user-summary b { display: block; color: #344054; }.user-summary p { overflow: hidden; max-width: 9rem; margin: .25rem 0 0; color: #98a2b3; font-size: .72rem; text-overflow: ellipsis; white-space: nowrap; }.user-side :deep(.el-menu) { border: 0; }.user-side :deep(.el-menu-item) { border-radius: .55rem; margin: .15rem 0; }.logout-btn { width: 100%; justify-content: flex-start; margin-top: .65rem; padding-left: 1.2rem; color: #d92d20; }.user-content { min-width: 0; }
@media (max-width: 720px) { .user-layout { grid-template-columns: 1fr; }.user-side { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: .5rem; padding: .65rem; }.user-summary { padding: 0; }.user-side :deep(.el-menu) { display: flex; overflow-x: auto; }.user-side :deep(.el-menu-item) { flex: 0 0 auto; }.user-summary div, .user-side :deep(.el-menu-item span), .logout-btn { display: none; }.user-side :deep(.el-menu-item) { padding: 0 .65rem; }.user-side :deep(.el-menu-item .el-icon) { margin: 0; } }
</style>
