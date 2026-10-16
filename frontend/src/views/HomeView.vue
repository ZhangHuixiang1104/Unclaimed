<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useArchiveStore } from '../stores/archive'

const router = useRouter()
const archive = useArchiveStore()

const enter = () => router.push('/archive')
</script>

<template>
  <main class="home-page">
    <div class="home-noise" aria-hidden="true"></div>
    <section class="home-copy">
      <span class="eyebrow light">数字档案箱 LZ-1936-07</span>
      <h1>长征<br /><em>失物招领处</em></h1>
      <p class="home-lead">五件没有主人的物件，一晚尚未完成的整理。先别急着写故事，看看它们自己留下了什么。</p>
      <div class="home-actions">
        <button class="primary-button light-button" type="button" @click="enter">开始今晚的值班</button>
        <RouterLink to="/about">查看作品说明</RouterLink>
      </div>
      <div class="home-meta">
        <span>临时档案员</span>
        <strong>{{ archive.keeperNumber }}</strong>
        <span>本地进度自动保存</span>
      </div>
    </section>

    <section class="archive-box" aria-label="档案箱视觉占位">
      <div class="box-lid"><span>请勿替未知填写姓名</span></div>
      <div class="box-body">
        <span v-for="index in 5" :key="index" class="paper-tab">0{{ index }}</span>
      </div>
      <p>今晚最后一个档案箱</p>
    </section>
  </main>
</template>
