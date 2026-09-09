<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { useCartStore } from '@/stores/cartStore'

const route = useRoute(); const router = useRouter(); const userStore = useUserStore(); const cartStore = useCartStore(); const formRef = ref(); const loading = ref(false)
const form = reactive({ account: '', password: '' })
const rules = { account: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少 6 位', trigger: 'blur' }] }
async function submit() { await formRef.value.validate(); loading.value = true; try { await userStore.login(form); await cartStore.fetchCart(); ElMessage.success('欢迎回来！'); router.replace(route.query.redirect || '/') } finally { loading.value = false } }
</script>

<template><div class="auth-page"><section class="auth-intro"><router-link to="/" class="auth-brand"><span>C</span>橙心商城</router-link><div><span>WELCOME BACK</span><h1>好物与生活，<br />都在这里等你。</h1><p>登录后即可管理收藏、购物车和订单。</p></div></section><section class="auth-form-wrap"><el-form ref="formRef" :model="form" :rules="rules" class="auth-form" @submit.prevent="submit"><div class="form-heading"><h2>登录账号</h2><p>还没有账号？<router-link to="/register">立即注册</router-link></p></div><el-form-item prop="account"><el-input v-model="form.account" size="large" placeholder="用户名或邮箱" /></el-form-item><el-form-item prop="password"><el-input v-model="form.password" type="password" show-password size="large" placeholder="密码" @keyup.enter="submit" /></el-form-item><el-button type="primary" size="large" native-type="submit" :loading="loading" class="auth-submit">登录</el-button><p class="demo-tip">演示账号：demo_user / password</p></el-form></section></div></template>

<style scoped>
.auth-page { display: grid; grid-template-columns: 1fr 1fr; min-height: calc(100vh - 4.25rem); }.auth-intro { display: flex; flex-direction: column; justify-content: space-between; padding: 2.2rem clamp(2rem, 8vw, 8rem) 4rem; background: linear-gradient(135deg, #173152, #2d5d90); color: #fff; }.auth-brand { display: inline-flex; align-items: center; gap: .5rem; color: #fff; font-weight: 800; }.auth-brand span { display: grid; width: 1.8rem; height: 1.8rem; place-items: center; border-radius: .55rem; background: #ff7544; font-family: Georgia, serif; font-size: 1.2rem; }.auth-intro > div > span { color: #aac7e8; font-size: .72rem; font-weight: 800; letter-spacing: .14em; }.auth-intro h1 { margin: .65rem 0 1rem; font-size: clamp(2rem, 4vw, 3.3rem); letter-spacing: -.07em; line-height: 1.15; }.auth-intro p { color: #ccdaea; }.auth-form-wrap { display: grid; place-items: center; padding: 2rem; background: #fff; }.auth-form { width: min(100%, 25rem); }.form-heading { margin-bottom: 2rem; }.form-heading h2 { margin: 0; font-size: 1.8rem; letter-spacing: -.05em; }.form-heading p { color: #667085; }.form-heading a { color: #ec552f; font-weight: 700; }.auth-submit { width: 100%; margin-top: .7rem; background: #ec552f; border-color: #ec552f; }.demo-tip { color: #98a2b3; font-size: .8rem; text-align: center; }
@media (max-width: 700px) { .auth-page { grid-template-columns: 1fr; }.auth-intro { min-height: 13rem; padding: 1.5rem 1.5rem 2rem; }.auth-intro h1 { margin-bottom: .4rem; }.auth-intro p { display: none; }.auth-form-wrap { align-items: start; padding-top: 3rem; } }
</style>
