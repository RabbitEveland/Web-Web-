<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api/user'
const router = useRouter(); const formRef = ref(); const loading = ref(false); const form = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const validateConfirm = (rule, value, callback) => value === form.password ? callback() : callback(new Error('两次输入的密码不一致'))
const rules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 2, max: 30, message: '用户名长度为 2-30 位', trigger: 'blur' }], email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少 6 位', trigger: 'blur' }], confirmPassword: [{ required: true, message: '请再次输入密码', trigger: 'blur' }, { validator: validateConfirm, trigger: 'blur' }] }
async function submit() { await formRef.value.validate(); loading.value = true; try { await register(form); ElMessage.success('注册成功，请登录'); router.push('/login') } finally { loading.value = false } }
</script>

<template><div class="register-page"><section class="register-card content-card"><router-link to="/" class="mini-brand"><span>C</span>橙心商城</router-link><div class="form-heading"><h1>创建账号</h1><p>开始发现更好的日常。</p></div><el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="submit"><el-form-item prop="username"><el-input v-model="form.username" size="large" placeholder="用户名" /></el-form-item><el-form-item prop="email"><el-input v-model="form.email" size="large" placeholder="邮箱" /></el-form-item><el-form-item prop="password"><el-input v-model="form.password" type="password" show-password size="large" placeholder="密码（至少 6 位）" /></el-form-item><el-form-item prop="confirmPassword"><el-input v-model="form.confirmPassword" type="password" show-password size="large" placeholder="确认密码" @keyup.enter="submit" /></el-form-item><el-button class="register-btn" type="primary" size="large" native-type="submit" :loading="loading">注册账号</el-button></el-form><p class="login-tip">已有账号？<router-link to="/login">去登录</router-link></p></section></div></template>

<style scoped>
.register-page { display: grid; min-height: calc(100vh - 4.25rem); place-items: center; padding: 2rem 1rem; background: radial-gradient(circle at 85% 10%, #ffd8c8, transparent 27rem), #f6f8fc; }.register-card { width: min(100%, 29rem); padding: 2rem; }.mini-brand { display: inline-flex; align-items: center; gap: .45rem; color: #172b4d; font-weight: 800; }.mini-brand span { display: grid; width: 1.7rem; height: 1.7rem; place-items: center; border-radius: .5rem; background: #ec552f; color: #fff; font-family: Georgia, serif; }.form-heading { margin: 1.6rem 0; }.form-heading h1 { margin: 0; font-size: 1.9rem; letter-spacing: -.06em; }.form-heading p { margin: .45rem 0 0; color: #98a2b3; }.register-btn { width: 100%; background: #ec552f; border-color: #ec552f; }.login-tip { margin: 1.25rem 0 0; color: #667085; text-align: center; font-size: .9rem; }.login-tip a { color: #ec552f; font-weight: 700; }
</style>
