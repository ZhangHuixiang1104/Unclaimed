<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../components/common/AppShell.vue'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const archive = useArchiveStore()
const router = useRouter()
const note = ref('')
const available = computed(() => archiveObjects.filter((item) => archive.getRecord(item.key).status === 'archived'))

const continueToTicket = () => {
  if (!archive.selectedObjectKey && available.value[0]) archive.chooseObject(available.value[0].key)
  sessionStorage.setItem('keeper-note', note.value.slice(0, 50))
  router.push('/ticket')
}
</script>

<template>
  <AppShell>
    <section class="ending-page">
      <span class="eyebrow light">无人认领终章</span>
      <h1>请填写物主姓名</h1>
      <div class="owner-field"><span>物主姓名</span><strong>仍无法确认</strong></div>
      <p class="ending-lead">找不到名字，不代表没有人来过。把知道的写清楚，把不知道的留下来。</p>

      <div class="ending-choice">
        <h2>选择一件最想保存的物品</h2>
        <div class="choice-grid">
          <button
            v-for="item in available"
            :key="item.key"
            type="button"
            :class="{ selected: archive.selectedObjectKey === item.key }"
            @click="archive.chooseObject(item.key)"
          >
            <span>{{ item.silhouette }}</span>
            <strong>{{ item.name }}</strong>
          </button>
        </div>
        <label>
          <span>写下一句陈列说明 <small>{{ note.length }}/50</small></span>
          <textarea v-model="note" maxlength="50" placeholder="例如：请保留那些无法辨认的空格。"></textarea>
        </label>
        <button class="primary-button light-button" type="button" :disabled="!available.length" @click="continueToTicket">以无名长征参与者名义共同入藏</button>
      </div>
    </section>
  </AppShell>
</template>
