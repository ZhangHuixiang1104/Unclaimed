<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../components/common/AppShell.vue'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const archive = useArchiveStore()
const router = useRouter()
const note = ref(archive.keeperNote)
const available = computed(() => archiveObjects.filter((item) => archive.getRecord(item.key).status === 'archived'))
const chosenKey = ref(available.value.some((item) => item.key === archive.selectedObjectKey)
  ? archive.selectedObjectKey
  : available.value[0]?.key)

const continueToTicket = () => {
  if (!archive.endingUnlocked || !chosenKey.value) return
  archive.chooseObject(chosenKey.value)
  archive.keeperNote = note.value.slice(0, 50)
  router.push('/ticket')
}
</script>

<template>
  <AppShell>
    <section class="ending-page">
      <span class="eyebrow light">无人认领终章</span>
      <h1>把已知的，郑重留下。</h1>
      <div class="owner-field"><span>五份物件档案</span><strong>已完成调查</strong></div>
      <p class="ending-lead">五件物品各自留下了可确认的痕迹，也留下不能替人回答的问题。把能核对的写清楚，把不知道的留白；真实历史资料另页保存。</p>

      <div class="ending-choice">
        <h2>选择一件最想保存的物品</h2>
        <div class="choice-grid">
          <button
            v-for="item in available"
            :key="item.key"
            type="button"
            :class="{ selected: chosenKey === item.key }"
            :aria-pressed="chosenKey === item.key"
            @click="chosenKey = item.key"
          >
            <span>{{ item.silhouette }}</span>
            <strong>{{ item.name }}</strong>
          </button>
        </div>
        <label>
          <span>写下一句陈列说明 <small>{{ note.length }}/50</small></span>
          <textarea v-model="note" maxlength="50" placeholder="例如：请保留那些无法辨认的空格。"></textarea>
        </label>
        <button class="primary-button light-button" type="button" :disabled="!archive.endingUnlocked || !chosenKey" @click="continueToTicket">生成这份故事档案的展签</button>
      </div>
    </section>
  </AppShell>
</template>
