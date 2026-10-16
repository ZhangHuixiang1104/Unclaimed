<script setup lang="ts">
const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 17) % 84)}%`,
  top: `${4 + ((index * 29) % 88)}%`,
  delay: `${(index % 7) * -1.3}s`,
  duration: `${9 + (index % 5) * 2}s`,
  size: `${1 + (index % 3) * 0.6}px`,
}))
</script>

<template>
  <div class="home-atmosphere" aria-hidden="true">
    <div class="home-vignette"></div>
    <div class="home-grid"></div>
    <div class="lamp-pool"></div>
    <span
      v-for="particle in particles"
      :key="particle.id"
      class="dust-particle"
      :style="{
        left: particle.left,
        top: particle.top,
        width: particle.size,
        height: particle.size,
        animationDelay: particle.delay,
        animationDuration: particle.duration,
      }"
    ></span>
  </div>
</template>

