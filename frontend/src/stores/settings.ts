import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
  const soundEnabled = ref(localStorage.getItem('archive-sound') !== 'off')
  const reducedMotion = ref(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  watch(soundEnabled, (value) => localStorage.setItem('archive-sound', value ? 'on' : 'off'))

  return { soundEnabled, reducedMotion }
})
