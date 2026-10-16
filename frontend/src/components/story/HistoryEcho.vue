<script setup lang="ts">
import type { ArchiveObject } from '../../types/archive'

defineProps<{ item: ArchiveObject }>()
</script>

<template>
  <section class="history-echo panel">
    <span class="eyebrow">史实回声占位</span>
    <div class="history-echo-grid">
      <div>
        <span class="history-year">1934—1936</span>
        <h2>{{ item.historicalLabel }}</h2>
      </div>
      <div>
        <p>这里将填入80至120字的可靠历史背景，并明确区分真实史实、合理推测与艺术化叙事。</p>
        <a href="#source-placeholder" @click.prevent>资料来源待填入</a>
      </div>
    </div>
  </section>
</template>
