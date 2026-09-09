<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { updateProfile } from '@/api/user'
import { useUserStore } from '@/stores/userStore'
const userStore = useUserStore(); const formRef = ref(); const loading = ref(false); const form = reactive({ username: '', email: '', phone: '', avatar: '' })
const rules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }] }
function setForm(user) { Object.assign(form, { username: user?.username || '', email: user?.email || '', phone: user?.phone || '', avatar: user?.avatar || '' }) }
async function save() { await formRef.value.validate(); loading.value = true; try { userStore.user = await updateProfile(form); localStorage.setItem('mall_user', JSON.stringify(userStore.user)); ElMessage.success('资料已保存') } finally { loading.value = false } }
watch(() => userStore.user, setForm, { immediate: true }); onMounted(() => userStore.fetchProfile().catch(() => {}))
</script>

<template><section class="content-card panel"><div class="panel-title"><div><h1>个人资料</h1><p>更新你的基本信息</p></div></div><el-form ref="formRef" :model="form" :rules="rules" label-width="5.5rem" class="profile-form"><el-form-item label="头像"><div class="avatar-row"><el-avatar :size="56" :src="form.avatar">{{ form.username.slice(0, 1) }}</el-avatar><el-input v-model="form.avatar" placeholder="头像图片 URL（可选）" /></div></el-form-item><el-form-item label="用户名" prop="username"><el-input v-model="form.username" /></el-form-item><el-form-item label="邮箱" prop="email"><el-input v-model="form.email" /></el-form-item><el-form-item label="手机号"><el-input v-model="form.phone" placeholder="可选" /></el-form-item><el-form-item><el-button type="primary" :loading="loading" @click="save">保存修改</el-button></el-form-item></el-form></section></template>

<style scoped>
.panel { padding: clamp(1.2rem, 3vw, 2rem); }.panel-title { display: flex; align-items: center; justify-content: space-between; padding-bottom: 1.25rem; border-bottom: 1px solid #edf0f4; }.panel-title h1 { margin: 0; font-size: 1.4rem; letter-spacing: -.05em; }.panel-title p { margin: .35rem 0 0; color: #98a2b3; font-size: .85rem; }.profile-form { max-width: 36rem; padding-top: 1.5rem; }.avatar-row { display: flex; align-items: center; width: 100%; gap: .8rem; }.profile-form :deep(.el-button--primary) { background: #ec552f; border-color: #ec552f; }
</style>
