import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
  const soundEnabled = ref(true)
  const reducedMotion = ref(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  return { soundEnabled, reducedMotion }
})
