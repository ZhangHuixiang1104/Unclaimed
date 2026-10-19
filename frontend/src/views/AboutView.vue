<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '../components/common/AppShell.vue'
import { useArchiveStore } from '../stores/archive'

const archive = useArchiveStore()
const activeTrace = ref(0)
const activePrinciple = ref(0)

const traces = [
  { code: '01', glyph: '名', title: '被雨水浸过的名单', line: '缺了一角的纸，究竟记录着什么？' },
  { code: '02', glyph: '图', title: '停在河前的行军图', line: '最后一笔为什么没有过河？' },
  { code: '03', glyph: '电', title: '用布缠过的电池盒', line: '固定带少掉的一段去了哪里？' },
  { code: '04', glyph: '鞋', title: '用旧背带补过的草鞋', line: '鞋底的补料能说明什么？' },
  { code: '05', glyph: '碗', title: '有两个刻痕的饭碗', line: '同一只碗上为何有两种记号？' },
]

const principles = [
  { code: '01', title: '让物件先说话', detail: '先观察道具上的文字与修补，再开始讲述。微小痕迹引出问题，真正的历史答案仍要回到史料。' },
  { code: '02', title: '不替未知签名', detail: '没有证据的姓名宁愿保持空白。动人的猜想可以存在，但不能被写成确定答案。' },
  { code: '03', title: '把史实交还给史料', detail: '史实、合理推测与艺术化表达各自标注，让玩家知道每一句话从哪里来。' },
]

const actionLabel = computed(() => archive.archivedCount > 0 ? '继续今晚的整理' : '接收第一份档案')
const nextTrace = () => { activeTrace.value = (activeTrace.value + 1) % traces.length }
</script>

<template>
  <AppShell>
    <article class="about-compact">
      <section class="about-focus">
        <div class="about-focus-copy">
          <span class="about-label">ABOUT / 作品说明</span>
          <h1>先看见痕迹，<br><em>再讲述他们。</em></h1>
          <p>五件游戏物品承载原创故事，其中的任务、人物与物证不能当作真实馆藏。我们邀请你逐件观察、核对判断，再走入独立呈现的长征史实材料；能确认的写清楚，仍未知的留白。</p>
          <div class="about-focus-actions"><RouterLink to="/archive">{{ actionLabel }} →</RouterLink><button type="button" @click="nextTrace">换一件物品看看</button></div>
          <div class="about-focus-note"><i></i><span>五件失物均为艺术化叙事设定，史实内容将明确标注来源与边界。</span></div>
        </div>

        <div class="trace-explorer">
          <header><span>UNCLAIMED OBJECTS / 01—05</span><strong>物件留下的话</strong></header>
          <Transition name="about-swap" mode="out-in">
            <div :key="traces[activeTrace].code" class="trace-stage">
              <span class="trace-glyph">{{ traces[activeTrace].glyph }}</span>
              <div><small>ARCHIVE {{ traces[activeTrace].code }}</small><h2>{{ traces[activeTrace].title }}</h2><blockquote>“{{ traces[activeTrace].line }}”</blockquote></div>
            </div>
          </Transition>
          <div class="trace-selector" role="tablist" aria-label="查看五件物品">
            <button v-for="(trace, index) in traces" :key="trace.code" type="button" :class="{ active: activeTrace === index }" role="tab" :aria-selected="activeTrace === index" @click="activeTrace = index"><span>{{ trace.code }}</span><strong>{{ trace.glyph }}</strong></button>
          </div>
        </div>
      </section>

      <section class="about-core">
        <header><div><span class="about-label">WHY WE MADE IT</span><h2>宏大的路，也由普通人的物件留下。</h2></div><p>这不是替无名者编写传奇的游戏，而是一场关于观察、判断与克制的互动体验。</p></header>

        <div class="about-core-grid">
          <div class="compact-principles" role="tablist" aria-label="创作原则">
            <button v-for="(principle, index) in principles" :key="principle.code" type="button" :class="{ active: activePrinciple === index }" role="tab" :aria-selected="activePrinciple === index" @click="activePrinciple = index"><span>{{ principle.code }}</span><strong>{{ principle.title }}</strong><i>＋</i></button>
          </div>
          <Transition name="about-swap" mode="out-in">
            <div :key="principles[activePrinciple].code" class="compact-principle-detail" role="tabpanel"><span>RULE / {{ principles[activePrinciple].code }}</span><div class="compact-seal">守</div><h3>{{ principles[activePrinciple].title }}</h3><p>{{ principles[activePrinciple].detail }}</p></div>
          </Transition>
          <div class="about-boundary-compact">
            <span>真实性边界</span>
            <ul><li><strong>史实</strong><small>提供可核验来源</small></li><li><strong>推测</strong><small>说明证据与限度</small></li><li><strong>虚构</strong><small>明确标注艺术表达</small></li></ul>
          </div>
        </div>

        <div class="about-play-flow" aria-label="玩家体验流程"><span>今晚的工作</span><ol><li><i>01</i>接收失物</li><li><i>02</i>寻找痕迹</li><li><i>03</i>筛选证据</li><li><i>04</i>阅读史实</li></ol><RouterLink to="/history">查看章节与史实索引 →</RouterLink></div>
      </section>

      <footer class="about-compact-closing"><div><span>UNCLAIMED / ARCHIVES OF THE LONG MARCH</span><strong>姓名留白，证据说话；故事与史实分别保存。</strong></div><RouterLink to="/archive"><small>已归档 {{ archive.archivedCount }} / 05</small>{{ actionLabel }} →</RouterLink></footer>
    </article>
  </AppShell>
</template>
