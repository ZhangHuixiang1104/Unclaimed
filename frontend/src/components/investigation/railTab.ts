import type { InjectionKey, Ref } from 'vue'

export type RailTab = 'notes' | 'caption'
export const railTabKey: InjectionKey<Ref<RailTab>> = Symbol('inspection-rail-tab')
