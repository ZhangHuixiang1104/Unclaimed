<script setup lang="ts">
import { watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAccountStore } from './stores/account'

const account = useAccountStore()
const router = useRouter()
watch(() => account.signedIn, (signedIn) => {
  if (!signedIn && account.reauthUsername && router.currentRoute.value.name !== 'account') {
    void router.replace('/account')
  }
})
</script>

<template>
  <RouterView v-if="account.ready" />
  <div v-else class="boot-screen" role="status">正在打开档案箱…</div>
</template>

<style scoped>
.boot-screen{min-height:100vh;display:grid;place-items:center;background:#171a16;color:#eee7d8;font-family:var(--font-display);font-size:20px;letter-spacing:.1em}
</style>
