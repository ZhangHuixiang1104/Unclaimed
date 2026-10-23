import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/global.scss'
import './styles/home.scss'
import './styles/archive-room.scss'
import './styles/object-room.scss'
import './styles/history-room.scss'
import './styles/about.scss'
import './styles/design-system.scss'
import './styles/inspection-workspace.scss'
import './styles/history-reader.scss'
import './styles/app-polish.scss'
import './styles/route-workspace.scss'
import { clearLegacyLocalRecords } from './services/progress'

clearLegacyLocalRecords()
createApp(App).use(createPinia()).use(router).mount('#app')
