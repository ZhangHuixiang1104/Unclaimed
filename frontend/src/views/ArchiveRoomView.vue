<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../components/common/AppShell.vue'
import ArchiveDossier from '../components/archive/ArchiveDossier.vue'
import ArchiveIndex from '../components/archive/ArchiveIndex.vue'
import DutyBoard from '../components/archive/DutyBoard.vue'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from '../stores/archive'
import type { EvidenceLevel } from '../types/archive'

const archive = useArchiveStore()
const route = useRoute()
const router = useRouter()

const validKey = (value: unknown) => typeof value === 'string' && archiveObjects.some((item) => item.key === value)
const firstUnfinishedKey = archive.nextObjectKey ?? archiveObjects[0].key
const initialKey = validKey(route.query.focus)
  ? String(route.query.focus)
  : validKey(archive.selectedObjectKey)
    ? String(archive.selectedObjectKey)
    : firstUnfinishedKey

const selectedKey = ref(initialKey)
const previewKey = ref<string | null>(null)
const activeKey = computed(() => previewKey.value ?? selectedKey.value)
const activeItem = computed(() => archiveObjects.find((item) => item.key === activeKey.value) ?? archiveObjects[0])
const activeRecord = computed(() => archive.getRecord(activeItem.value.key))
const activeStatus = computed(() => archive.getObjectStatus(activeItem.value.key))

const evidenceCounts = computed(() => {
  const counts: Record<EvidenceLevel, number> = { confirmed: 0, inferred: 0, unknown: 0 }
  Object.values(archive.records).forEach((record) => {
    if (!record.evidenceVerified && record.status !== 'archived') return
    Object.values(record.classified).forEach((level) => { counts[level] += 1 })
  })
  return counts
})

const preview = (key: string | null) => { previewKey.value = key }

const select = (key: string) => {
  selectedKey.value = key
  previewKey.value = null
  archive.chooseObject(key)
  void router.replace({ query: { ...route.query, focus: key } })
}

watch(() => route.query.focus, (value) => {
  if (validKey(value)) selectedKey.value = String(value)
})

archive.chooseObject(selectedKey.value)
</script>

<template>
  <AppShell>
    <section class="archive-room">
      <header class="archive-room-header">
        <div class="archive-room-heading">
          <span class="archive-time">23:51 / 档案箱已接收</span>
          <h1>今晚，从哪一件开始？</h1>
          <p>它们没有留下主人姓名，只留下了可以被检查的痕迹。选择一份档案，先观察，再归档。</p>
        </div>
        <div class="archive-room-progress">
          <span>值守进度</span>
          <strong>{{ String(archive.archivedCount).padStart(2, '0') }} <i>/ 05</i></strong>
          <small>已归档 · {{ archive.progressPercent }}%</small>
        </div>
      </header>

      <div class="archive-workbench">
        <ArchiveIndex
          :items="archiveObjects"
          :active-key="activeKey"
          :selected-key="selectedKey"
          :status-for="archive.getObjectStatus"
          @preview="preview"
          @select="select"
        />

        <ArchiveDossier
          :item="activeItem"
          :status="activeStatus"
          :found-count="activeRecord.foundClueIds.length"
        />

        <DutyBoard :current-key="activeKey" :evidence-counts="evidenceCounts" />
      </div>

      <footer class="archive-room-footer">
        <span>UNCLAIMED / NIGHT ARCHIVE ROOM</span>
        <p>主人未知。经历真实。共同保存。</p>
        <span>LZ-1936-07 / 01—05</span>
      </footer>
    </section>
  </AppShell>
</template>
