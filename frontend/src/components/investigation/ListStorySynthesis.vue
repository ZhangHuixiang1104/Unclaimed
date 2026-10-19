<script setup lang="ts">
defineProps<{ saved: boolean }>()
const emit = defineEmits<{ review: [clueId: string]; save: [] }>()
const beats = [
  { id: 'list-task', label: '01 / 正面', title: '物品之后，是人', text: '第三行写着「后随二人」，姓名处却缺了一角。' },
  { id: 'list-key', label: '02 / 背面', title: '笔停在交接之前', text: '开口的方框表示：这一项尚待接收。' },
  { id: 'list-stub', label: '03 / 纸边', title: '还有另一页', text: '「回执另存」指向了不在场的记录。' },
]
</script>

<template>
  <section class="list-story-synthesis" aria-labelledby="list-story-title">
    <div class="synthesis-heading">
      <span>虚构名单 / 故事收束</span>
      <h2 id="list-story-title">这一页，停在交接之前</h2>
      <p>你找到了三处记录。点开任意一幕，可以再看一眼纸面。</p>
    </div>
    <div class="synthesis-chain">
      <button v-for="(beat, index) in beats" :key="beat.id" type="button" @click="emit('review', beat.id)">
        <small>{{ String(index + 1).padStart(2, '0') }} / {{ beat.label }}</small>
        <strong>{{ beat.title }}</strong>
        <span>{{ beat.text }}</span>
        <em>回看纸面 ↗</em>
      </button>
    </div>
    <div class="synthesis-conclusion">
      <span>本章结语 / 虚构故事</span>
      <p>物品有接收的一笔；两个人，还没有。</p>
      <small>这张纸没有写下他们的姓名和后来。真实史料也不能替虚构人物补上结局。</small>
      <button type="button" :disabled="saved" @click="emit('save')">{{ saved ? '故事已保存 ✓' : '保存故事，准备翻阅史实 →' }}</button>
    </div>
  </section>
</template>

<style scoped>
.list-story-synthesis { margin-top: 20px; border: 1px solid rgba(197,171,129,.32); color: #eee5d4; background: linear-gradient(130deg, #242820, #191d18); box-shadow: 0 22px 48px rgba(0,0,0,.18); }
.synthesis-heading { padding: 25px 30px 18px; border-bottom: 1px solid rgba(197,171,129,.18); }
.synthesis-heading > span, .synthesis-conclusion > span { color: #d68f7e; font-size: 11px; font-weight: 700; letter-spacing: .1em; }
.synthesis-heading h2 { margin: 8px 0 6px; font-size: 25px; }
.synthesis-heading p { margin: 0; color: #c2c0b5; font-size: 13px; line-height: 1.6; }
.synthesis-chain { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; padding: 20px 24px; }
.synthesis-chain button { min-height: 172px; padding: 17px; text-align: left; color: inherit; border: 1px solid rgba(206,189,156,.25); background: rgba(234,219,188,.055); cursor: pointer; transition: transform .2s ease, border-color .2s ease, background .2s ease; }
.synthesis-chain button:hover { transform: translateY(-4px); border-color: rgba(214,143,126,.65); background: rgba(234,219,188,.1); }
.synthesis-chain small { display: block; color: #d49684; font-size: 11px; }
.synthesis-chain strong { display: block; margin: 10px 0 7px; color: #f1e8d7; font-size: 17px; }
.synthesis-chain span { display: block; color: #c5c4b9; font-size: 12px; line-height: 1.65; }
.synthesis-chain em { display: block; margin-top: 11px; color: #d6b2a2; font-size: 11px; font-style: normal; }
.synthesis-conclusion { margin: 0 24px 24px; padding: 17px 20px; border-left: 3px solid #a25347; background: rgba(181,91,74,.09); }
.synthesis-conclusion p { margin: 8px 0; color: #f3e7d5; font-size: 21px; font-weight: 650; line-height: 1.55; }
.synthesis-conclusion small { display: block; max-width: 650px; color: #c9c8bd; font-size: 13px; line-height: 1.7; }
.synthesis-conclusion button { display: block; min-height: 43px; margin-top: 16px; padding: 0 20px; border: 1px solid #b38473; color: #f5eadd; background: #7c3d32; font-size: 13px; font-weight: 700; cursor: pointer; }
.synthesis-conclusion button:hover:not(:disabled) { background: #965044; }
.synthesis-conclusion button:disabled { opacity: .7; cursor: default; }
@media (max-width: 1180px) { .synthesis-chain { grid-template-columns: 1fr; } .synthesis-chain button { min-height: 0; } }
.list-story-synthesis { box-shadow: none; }
.list-story-synthesis { margin-top: 14px; }
.synthesis-heading { padding: 17px 24px 13px; }
.synthesis-heading h2 { margin: 5px 0 4px; font: 700 25px/1.3 var(--font-display); }
.synthesis-heading p,.synthesis-conclusion small { font-size: 14px; }
.synthesis-heading > span,.synthesis-conclusion > span,.synthesis-chain small { font-size: 12px; }
.synthesis-chain { gap: 0; padding: 9px 24px; }
.synthesis-chain button { min-height: 120px; padding: 9px 18px; border: 0; border-right: 1px solid rgba(206,189,156,.25); background: transparent; }
.synthesis-chain button:last-child { border-right: 0; }
.synthesis-chain button:hover { border-right-color: #d68f7e; background: rgba(234,219,188,.045); transform: none; }
.synthesis-chain strong { margin: 6px 0 4px; font: 700 17px/1.35 var(--font-sans); }
.synthesis-chain span { font-size: 14px; }
.synthesis-chain em { margin-top: 5px; font-size: 12px; }
.synthesis-conclusion { margin: 0 24px 18px; padding: 12px 0 0; border: 0; border-top: 1px solid rgba(197,171,129,.32); background: transparent; }
.synthesis-conclusion p { margin: 5px 0; color: #f6dfc7; font: 700 23px/1.4 var(--font-display); }
.synthesis-conclusion button { font-size: 14px; }
@media (max-width: 1180px) { .synthesis-chain button { border-right: 0; border-bottom: 1px solid rgba(206,189,156,.25); } }
</style>
