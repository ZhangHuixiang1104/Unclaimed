import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ArchiveRoomView from '../views/ArchiveRoomView.vue'
import ObjectView from '../views/ObjectView.vue'
import HistoryView from '../views/HistoryView.vue'
import EndingView from '../views/EndingView.vue'
import TicketView from '../views/TicketView.vue'
import AboutView from '../views/AboutView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/archive', name: 'archive', component: ArchiveRoomView },
    { path: '/object/:objectKey', name: 'object', component: ObjectView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/ending', name: 'ending', component: EndingView },
    { path: '/ticket', name: 'ticket', component: TicketView },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
