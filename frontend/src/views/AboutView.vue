<script setup lang="ts">
import AppShell from '../components/common/AppShell.vue'
import { archiveObjects } from '../data/objects'
import { objectArtwork } from '../data/objectArtwork'
import { useArchiveStore } from '../stores/archive'
import { useContinueInvestigation } from '../composables/useContinueInvestigation'

const archive = useArchiveStore()
const { to: resumeTo, label: resumeLabel } = useContinueInvestigation()
const objectNames: Record<string, string> = { list: '名单', map: '行军图', battery: '电池盒', shoes: '草鞋', bowl: '饭碗' }
const principles = [
  { title: '让物件先说话', detail: '先看纸上的文字、器物的修补与使用痕迹，再整理它们能够支持的故事。' },
  { title: '不替未知填写姓名', detail: '没有证据的身份和结局，留在空白处；动人的猜想，也需要说明它的限度。' },
  { title: '把史实交还给史料', detail: '真实历史另页呈现，标注可核对的来源。物件的原创故事，不作为真实文物或事件的证明。' },
]
</script>

<template>
  <AppShell>
    <article class="about-statement">
      <section class="about-introduction" aria-label="作品介绍">
        <div class="about-introduction-copy"><span class="about-eyebrow">作品说明</span><h1>先看见痕迹，<br>再读懂故事。</h1><p>从一张缺角的纸、一只修补过的盒子开始，观察五件物品留下的痕迹，写下有依据的判断，再走进它们各自关联的长征史实。</p><RouterLink class="about-continue" :to="resumeTo">{{ resumeLabel }} <span>→</span></RouterLink><small>五件物品 · 已归档 {{ archive.archivedCount }} / 5</small></div>
        <div class="about-collection" role="group" aria-label="五件原创虚构物件的美术陈列"><figure v-for="item in archiveObjects" :key="item.key" :class="'collection-' + item.key"><img :src="objectArtwork[item.key]" :alt="item.name"><figcaption>{{ objectNames[item.key] }}</figcaption></figure></div>
      </section>
      <section class="about-principles" aria-labelledby="about-principles-title"><h2 id="about-principles-title">我们怎样讲这些故事</h2><ol><li v-for="(principle, index) in principles" :key="principle.title"><span>{{ String(index + 1).padStart(2, '0') }}</span><h3>{{ principle.title }}</h3><p>{{ principle.detail }}</p></li></ol></section>
      <p class="about-truth-note"><span aria-hidden="true"></span>游戏故事为原创虚构，历史资料独立核验。</p>
    </article>
  </AppShell>
</template>
