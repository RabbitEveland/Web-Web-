import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
  { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },
  { path: '/goods', name: 'goods', component: () => import('@/views/GoodsListView.vue') },
  { path: '/detail/:id', name: 'detail', component: () => import('@/views/GoodsDetailView.vue'), props: true },
  { path: '/search', name: 'search', component: () => import('@/views/GoodsListView.vue') },
  { path: '/cart', name: 'cart', component: () => import('@/views/CartView.vue'), meta: { requiresAuth: true } },
  {
    path: '/user', component: () => import('@/views/UserLayout.vue'), meta: { requiresAuth: true }, redirect: '/user/profile',
    children: [
      { path: 'profile', name: 'profile', component: () => import('@/views/UserProfileView.vue') },
      { path: 'address', name: 'address', component: () => import('@/views/AddressView.vue') },
      { path: 'orders', name: 'orders', component: () => import('@/views/OrdersView.vue') },
      { path: 'orders/:id', name: 'order-detail', component: () => import('@/views/OrderDetailView.vue') },
      { path: 'favorites', name: 'favorites', component: () => import('@/views/FavoritesView.vue') }
    ]
  },
  {
    path: '/admin', component: () => import('@/views/AdminLayout.vue'), meta: { requiresAuth: true, requiresAdmin: true }, redirect: '/admin/goods',
    children: [
      { path: 'goods', name: 'admin-goods', component: () => import('@/views/AdminGoodsView.vue') },
      { path: 'orders', name: 'admin-orders', component: () => import('@/views/AdminOrdersView.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })

router.beforeEach((to) => {
  const token = localStorage.getItem('mall_token')
  const user = JSON.parse(localStorage.getItem('mall_user') || 'null')
  if (to.meta.requiresAuth && !token) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.requiresAdmin && user?.role !== 'admin') return { name: 'home' }
  if (to.meta.guest && token) return { name: 'home' }
  return true
})

export default router
