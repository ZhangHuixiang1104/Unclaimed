import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ArchiveRoomView from '../views/ArchiveRoomView.vue'
import ObjectView from '../views/ObjectView.vue'
import HistoryView from '../views/HistoryView.vue'
import HistoryDetailView from '../views/HistoryDetailView.vue'
import EndingView from '../views/EndingView.vue'
import TicketView from '../views/TicketView.vue'
import AboutView from '../views/AboutView.vue'
import AccountView from '../views/AccountView.vue'
import { useArchiveStore } from '../stores/archive'
import { useAccountStore } from '../stores/account'
import { canEnterProject } from './access'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/archive', name: 'archive', component: ArchiveRoomView },
    { path: '/object/:objectKey', name: 'object', component: ObjectView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/history/:objectKey', name: 'history-detail', component: HistoryDetailView },
    { path: '/ending', name: 'ending', component: EndingView },
    { path: '/ticket', name: 'ticket', component: TicketView },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/account', name: 'account', component: AccountView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const account = useAccountStore()
  await account.initialize()
  if (to.name !== 'account' && !canEnterProject(account.signedIn, account.cloudReady, account.syncState)) {
    return { name: 'account', query: { next: to.fullPath } }
  }
  const archive = useArchiveStore()
  if (to.name === 'ending' && !archive.endingUnlocked) return '/history'
  if (to.name === 'ticket') {
    if (!archive.endingUnlocked) return '/history'
  }
})

export default router
