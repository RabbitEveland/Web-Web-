<script setup>
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <el-config-provider size="default">
    <AppHeader />
    <main class="app-main"><router-view /></main>
    <footer class="site-footer">© 2026 橙心商城 · Web 全栈课程设计项目</footer>
  </el-config-provider>
</template>
