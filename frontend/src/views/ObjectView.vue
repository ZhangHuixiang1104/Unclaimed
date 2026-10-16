<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../components/common/AppShell.vue'
import ObjectInspector from '../components/investigation/ObjectInspector.vue'
import EvidenceBoard from '../components/investigation/EvidenceBoard.vue'
import SignalNetwork from '../components/interactions/SignalNetwork.vue'
import HistoryEcho from '../components/story/HistoryEcho.vue'
import { objectByKey } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const route = useRoute()
const router = useRouter()
const archive = useArchiveStore()
const interactionComplete = ref(false)
const justArchived = ref(false)
const item = computed(() => objectByKey(String(route.params.objectKey)))

watch(item, (value) => {
  if (value) archive.startObject(value.key)
}, { immediate: true })

const finishArchive = () => {
  if (!item.value) return
  archive.archiveObject(item.value.key)
  justArchived.value = true
}
</script>

<template>
  <AppShell>
    <section v-if="item" class="object-page" :style="{ '--object-accent': item.accent }">
      <header class="object-header">
        <button class="text-button" type="button" @click="router.push('/archive')">← 返回档案室</button>
        <div>
          <span class="eyebrow">{{ item.historicalLabel }} · {{ item.archiveNo }}</span>
          <h1>{{ item.name }}</h1>
          <p>{{ item.intro }}</p>
        </div>
        <div class="stage-indicator">
          <span class="active">观察</span><i></i><span>验证</span><i></i><span>建档</span>
        </div>
      </header>

      <div class="investigation-layout">
        <ObjectInspector :item="item" />
        <EvidenceBoard :item="item" @complete="finishArchive" />
      </div>

      <SignalNetwork v-if="item.interactionType === 'signal-network'" @complete="interactionComplete = true" />
      <section v-else class="interaction-placeholder panel">
        <span class="eyebrow">{{ item.interactionType }}</span>
        <h2>专属互动组件占位</h2>
        <p>公共调查流程已经可用。此处后续接入该物件的专属小游戏，不影响先行填充图片、线索和史实内容。</p>
        <button class="secondary-button" type="button" @click="interactionComplete = true">
          {{ interactionComplete ? '占位互动已完成' : '模拟完成互动' }}
        </button>
      </section>

      <HistoryEcho :item="item" />

      <section v-if="justArchived || archive.getRecord(item.key).status === 'archived'" class="archive-success">
        <span>档案已建立</span>
        <h2>{{ item.name }}已进入陈列柜</h2>
        <p>历史路线中的“{{ item.historicalLabel }}”节点已经点亮。</p>
        <div>
          <RouterLink class="secondary-button" to="/archive">整理下一件物品</RouterLink>
          <RouterLink class="text-button" to="/history">查看路线档案 →</RouterLink>
        </div>
      </section>
    </section>

    <section v-else class="not-found panel">
      <h1>没有找到这件物品</h1>
      <RouterLink class="primary-button" to="/archive">返回档案室</RouterLink>
    </section>
  </AppShell>
</template>
