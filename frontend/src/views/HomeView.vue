<script lang="ts">
let introPlayedInVisit = false
</script>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ArchiveCase from '../components/home/ArchiveCase.vue'
import HomeAtmosphere from '../components/home/HomeAtmosphere.vue'
import NightDutyHeader from '../components/home/NightDutyHeader.vue'
import { homeArchivePreviews } from '../data/homeArchives'
import { useArchiveStore } from '../stores/archive'

const router = useRouter()
const archive = useArchiveStore()

type HomeStage = 'arriving' | 'ready' | 'peeking' | 'opening' | 'leaving'

const hasPlayedIntro = introPlayedInVisit
const stage = ref<HomeStage>(hasPlayedIntro ? 'ready' : 'arriving')
const hoveredId = ref<string | null>(null)
const selectedId = ref<string | null>(archive.nextObjectKey ?? archive.selectedObjectKey ?? null)
const timers: number[] = []

const archivedKeys = computed(() => homeArchivePreviews.filter((item) => archive.getRecord(item.key).status === 'archived').map((item) => item.key))
const currentItem = computed(() => homeArchivePreviews.find((item) => item.key === (hoveredId.value ?? selectedId.value)) ?? null)
const remainingObject = computed(() => homeArchivePreviews.find((item) => archive.getRecord(item.key).status !== 'archived') ?? homeArchivePreviews[0])
const foundClueCount = computed(() => Object.values(archive.records).reduce((sum, record) => sum + record.foundClueIds.length, 0))
const hasProgress = computed(() => archive.archivedCount > 0 || foundClueCount.value > 0 || Object.values(archive.records).some(record => record.status === 'investigating'))

const homeLead = computed(() => archive.endingUnlocked
  ? '五件物品的故事与史实已分别归档。那些没有答案的空白，仍被妥善保留。'
  : hasProgress.value
  ? '档案箱仍停在昨晚的位置。还有一些痕迹，尚未被妥善保存。'
  : '五件等待整理的物品，各自留下不同的疑问。按顺序查找痕迹，再阅读独立的历史材料。')

const actionLabel = computed(() => {
  if (stage.value === 'opening' || stage.value === 'leaving') return '正在打开档案箱…'
  if (selectedId.value) {
    const item = homeArchivePreviews.find((entry) => entry.key === selectedId.value)
    if (archive.getRecord(selectedId.value).status === 'archived') return `回看 ${item?.index ?? ''} 号档案 →`
    if (!archive.isObjectUnlocked(selectedId.value)) return `查看封存的 ${item?.index ?? ''} 号档案 →`
    return `${archive.getRecord(selectedId.value).status === 'investigating' ? '继续' : '接收'} ${item?.index ?? ''} 号档案 →`
  }
  if (archive.endingUnlocked) return '重访档案箱 →'
  if (hasProgress.value) return `继续第 ${remainingObject.value.index} 份档案 →`
  return '接收档案箱 →'
})

const setHover = (key: string | null) => {
  if (stage.value === 'opening' || stage.value === 'leaving') return
  hoveredId.value = key
  stage.value = key ? 'peeking' : 'ready'
}

const selectArchive = (key: string) => {
  if (stage.value === 'opening' || stage.value === 'leaving') return
  if (selectedId.value === key) {
    void enter()
    return
  }
  selectedId.value = key
}

const enter = async () => {
  if (stage.value === 'opening' || stage.value === 'leaving') return
  const focusKey = selectedId.value ?? (hasProgress.value ? remainingObject.value.key : null)
  if (focusKey) archive.chooseObject(focusKey)
  stage.value = 'opening'
  await new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, 780)))
  stage.value = 'leaving'
  await new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, 160)))
  await router.push({ path: '/archive', query: focusKey ? { focus: focusKey } : {} })
}

onMounted(() => {
  if (hasPlayedIntro) return
  timers.push(window.setTimeout(() => {
    stage.value = 'ready'
    introPlayedInVisit = true
  }, 2700))
})

onBeforeUnmount(() => timers.forEach((timer) => window.clearTimeout(timer)))
</script>

<template>
  <main class="home-page" :class="[`stage-${stage}`, { 'has-selection': selectedId }]">
    <HomeAtmosphere />
    <div class="home-transition-curtain" aria-hidden="true"></div>

    <section class="home-copy">
      <NightDutyHeader />
      <span class="home-archive-number">数字档案箱　LZ-1936-07</span>
      <h1><span>长征</span><em>失物招领处</em></h1>
      <p class="home-lead">{{ homeLead }}</p>

      <div class="current-trace" :class="{ visible: currentItem }" aria-live="polite">
        <span>{{ currentItem?.index ?? '00' }} / {{ currentItem?.shortTitle ?? '等待检查' }}</span>
        <strong>{{ currentItem?.teaser ?? '移动光标查看箱内档案' }}</strong>
        <p>{{ currentItem?.detail ?? '每一件物品都只陈述它能够证明的部分。' }}</p>
      </div>

      <div class="home-actions">
        <button class="home-primary-action" type="button" :disabled="stage === 'opening' || stage === 'leaving'" @click="enter">
          <span>{{ actionLabel }}</span>
          <i aria-hidden="true"></i>
        </button>
        <RouterLink to="/about">查看作品说明</RouterLink>
      </div>
      <div class="home-meta">
        <span>临时档案员 <strong>{{ archive.keeperNumber }}</strong></span>
        <i></i>
        <span>账号进度自动保存</span>
      </div>
    </section>

    <section class="home-case-column">
      <ArchiveCase
        :items="homeArchivePreviews"
        :hovered-id="hoveredId"
        :selected-id="selectedId"
        :archived-keys="archivedKeys"
        :opening="stage === 'opening' || stage === 'leaving'"
        @hover="setHover"
        @select="selectArchive"
      />

      <div class="case-statistics" aria-label="档案箱统计">
        <div><span>箱内物件</span><strong>05</strong></div>
        <div><span>已归档</span><strong>{{ String(archive.archivedCount).padStart(2, '0') }}</strong></div>
        <div><span>确认姓名</span><strong>00</strong></div>
      </div>
    </section>

    <footer class="home-principle">
      <span>UNCLAIMED / ARCHIVES OF THE LONG MARCH</span>
      <p>姓名留白，证据说话；故事与史实分别保存。</p>
      <span>保管规则 01—03</span>
    </footer>
  </main>
</template>
