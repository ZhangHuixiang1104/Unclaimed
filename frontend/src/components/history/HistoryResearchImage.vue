<script setup lang="ts">
import { computed, ref, watch } from 'vue'
const props = defineProps<{ chapter: string; imageKey: string; caption: string; fallback: string; fallbackAlt: string }>()
const failed = ref(false)
const preview = import.meta.env.DEV
const src = computed(() => preview && !failed.value ? `/__research/${props.chapter}-history/${props.imageKey}` : props.fallback)
watch(() => props.imageKey, () => { failed.value = false })
</script>

<template>
  <figure>
    <img :src="src" :alt="preview && !failed ? caption : fallbackAlt" @error="failed = true">
    <figcaption>{{ preview && !failed ? caption : '据公开报道编绘 · 原创示意，非历史照片或馆藏原件' }}</figcaption>
  </figure>
</template>

<style scoped>
figure{margin:0}img{display:block;width:100%;max-height:540px;object-fit:contain}figcaption{padding:10px 12px;color:#574b3d;background:#eee3cd;font-size:12px;line-height:1.6;text-align:left}
</style>
