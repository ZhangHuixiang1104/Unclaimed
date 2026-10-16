<script setup lang="ts">
import AppShell from '../components/common/AppShell.vue'
</script>

<template>
  <AppShell>
    <article class="about-page">
      <span class="eyebrow">作品说明</span>
      <h1>这是一套等待被填充的互动档案框架。</h1>
      <p class="about-lead">当前版本已经建立完整页面结构、物件数据模型、调查状态、证据分类、本地存档和一个可操作的通信关卡样板。</p>

      <section>
        <h2>内容边界</h2>
        <p>数字档案箱、五件物品和人物片段均为艺术化叙事设定，不代表真实馆藏。正式版本必须逐项补充历史来源，并明确区分史实、合理推测和虚构表达。</p>
      </section>

      <section>
        <h2>后续填充顺序</h2>
        <ol>
          <li>先替换电池盒正式素材并完成通信玩法；</li>
          <li>再填入名单、行军图和草鞋；</li>
          <li>最后完成饭碗、跨物件线索和终章；</li>
          <li>确认内容后再加入配音、环境声和正式动画。</li>
        </ol>
      </section>

      <section>
        <h2>资料来源占位</h2>
        <p id="source-placeholder">在这里列出书籍、档案馆、纪念馆或权威网站资料。不要把AI生成文本作为历史来源。</p>
      </section>
    </article>
  </AppShell>
</template>
