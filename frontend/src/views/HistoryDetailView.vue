<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../components/common/AppShell.vue'
import { historyRecords } from '../data/historyRecords'
import { archiveObjects, objectByKey } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const route = useRoute()
const archive = useArchiveStore()
const item = computed(() => objectByKey(String(route.params.objectKey)))
const record = computed(() => item.value ? archive.getRecord(item.value.key) : undefined)
const unlocked = computed(() => record.value?.status === 'archived')
const content = computed(() => item.value ? historyRecords[item.value.key] : undefined)
const currentIndex = computed(() => item.value ? archiveObjects.findIndex((entry) => entry.key === item.value?.key) : -1)
const previousUnlocked = computed(() => archiveObjects.slice(0, currentIndex.value).reverse().find((entry) => archive.getRecord(entry.key).status === 'archived'))
const nextUnlocked = computed(() => archiveObjects.slice(currentIndex.value + 1).find((entry) => archive.getRecord(entry.key).status === 'archived'))
const nextChapter = computed(() => archiveObjects[currentIndex.value + 1])
const activeMaterialCode = ref<string | null>(null)
const activeMaterial = computed(() => content.value?.materials.find((material) => material.code === activeMaterialCode.value))
</script>

<template>
  <AppShell>
    <section v-if="item && content && unlocked" class="history-detail-page">
      <header class="history-detail-cover">
        <div class="history-detail-index"><RouterLink to="/history">← 返回路线档案</RouterLink><span>HISTORY RECORD / 0{{ item.order }}</span></div>
        <div class="history-detail-title"><span>{{ content.period }} · {{ item.archiveNo }}</span><h1>{{ item.historicalLabel }}</h1><p>{{ content.summary }}</p></div>
        <div class="history-verified-seal"><span>史实</span><small>已公开</small></div>
      </header>
      <section class="history-detail-ledger">
        <aside class="history-ledger-index"><span>档案目录</span><a href="#context">01 / 历史背景</a><a href="#evidence">02 / 调查对照</a><a href="#materials">03 / 材料袋</a><a href="#boundary">04 / 真实性边界</a></aside>
        <div class="history-ledger-content">
          <article id="context" class="history-ledger-section history-context-section"><span>01 / HISTORICAL CONTEXT</span><h2>一件物品，如何抵达这段历史</h2><p>{{ content.relation }}</p><blockquote>史实不是谜题的标准答案，而是证据能够抵达的边界。</blockquote></article>
          <article id="evidence" class="history-ledger-section"><span>02 / INVESTIGATION COMPARISON</span><h2>调查结论对照</h2><div class="history-conclusion-grid"><section v-for="conclusion in item.conclusions" :key="conclusion.id" :class="conclusion.expectedLevel"><small>{{ conclusion.expectedLevel === 'confirmed' ? '可以确认' : conclusion.expectedLevel === 'inferred' ? '合理推测' : '仍然未知' }}</small><strong>{{ conclusion.text }}</strong><p>{{ conclusion.explanation }}</p></section></div></article>
          <article id="materials" class="history-ledger-section"><span>03 / MATERIAL ENVELOPES</span><h2>调查记录与待核史料</h2><div class="history-material-grid"><button v-for="material in content.materials" :key="material.code" type="button" :class="['history-material-card', { active: activeMaterialCode === material.code }]" @click="activeMaterialCode = activeMaterialCode === material.code ? null : material.code"><small>{{ material.code }} / {{ material.type }}</small><strong>{{ material.title }}</strong><p>{{ material.description }}</p><i>{{ activeMaterialCode === material.code ? '收起材料说明 ↑' : '点击展开材料说明 ↗' }}</i></button></div>
            <div v-if="activeMaterial" class="history-material-reader">
              <header><span>{{ activeMaterial.code }} / DECLASSIFIED MATERIAL</span><button type="button" @click="activeMaterialCode = null">关闭 ×</button></header>
              <div>
                <section><small>材料名称</small><h3>{{ activeMaterial.title }}</h3><p>{{ activeMaterial.description }}</p></section>
                <section v-if="activeMaterial.code === 'A-01'" class="material-reader-list"><small>本次调查记录</small><p v-for="clue in item.clues" :key="clue.id"><strong>{{ clue.title }}</strong><span>{{ clue.description }}</span></p></section>
                <section v-else-if="activeMaterial.code === 'A-02'" class="material-reader-list"><small>证据边界记录</small><p v-for="conclusion in item.conclusions" :key="conclusion.id"><strong>{{ conclusion.expectedLevel === 'confirmed' ? '可以确认' : conclusion.expectedLevel === 'inferred' ? '合理推测' : '仍然未知' }}</strong><span>{{ conclusion.text }}</span></p></section>
                <section v-else class="material-source-slot"><small>史实材料接入位</small><strong>等待团队核验原始材料</strong><p>后续在此补充历史照片、路线图、文献页码、出处链接与图片授权说明；未核验内容不会作为正式史实展示。</p></section>
              </div>
            </div>
          </article>
          <article id="boundary" class="history-ledger-section history-boundary-note"><span>04 / AUTHENTICITY BOUNDARY</span><h2>真实性与创作边界</h2><p>{{ content.boundary }}</p><div><strong>资料状态</strong><span>正式图片、文献页码与授权信息等待团队核验后接入。</span></div></article>
        </div>
      </section>
      <footer class="history-detail-navigation"><RouterLink v-if="previousUnlocked" :to="`/history/${previousUnlocked.key}`">← 上一份公开档案</RouterLink><span v-else>路线起点</span><RouterLink to="/history">查看已恢复路线</RouterLink><RouterLink v-if="nextUnlocked" :to="`/history/${nextUnlocked.key}`">下一份公开档案 →</RouterLink><RouterLink v-else-if="nextChapter" :to="{ path: '/archive', query: { focus: nextChapter.key } }">接收下一件物品 →</RouterLink><RouterLink v-else to="/ending">进入终章 →</RouterLink></footer>
    </section>
    <section v-else-if="item" class="history-sealed-page">
      <RouterLink to="/history">← 返回路线档案</RouterLink><div class="history-sealed-emblem">封</div><span>HISTORY RECORD / SEALED / 0{{ item.order }}</span><h1>这段史实仍在封存</h1><p>对应物件尚未完成调查与归档。地点、时间和材料将在证据核验完成后公开。</p><RouterLink class="history-sealed-action" :to="record?.status === 'investigating' ? `/object/${item.key}` : '/archive'">{{ record?.status === 'investigating' ? '继续完成调查' : '返回档案室' }} →</RouterLink>
    </section>
    <section v-else class="history-sealed-page"><div class="history-sealed-emblem">?</div><h1>没有找到这份路线档案</h1><RouterLink class="history-sealed-action" to="/history">返回路线总览 →</RouterLink></section>
  </AppShell>
</template>
