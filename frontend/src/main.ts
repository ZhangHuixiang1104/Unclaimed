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
import { clearLegacyLocalRecords } from './services/progress'

clearLegacyLocalRecords()
createApp(App).use(createPinia()).use(router).mount('#app')
