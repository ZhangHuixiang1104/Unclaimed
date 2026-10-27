<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '../stores/account'
import { useArchiveStore } from '../stores/archive'
import AppShell from '../components/common/AppShell.vue'
import { objectArtwork } from '../data/objectArtwork'
import { useContinueInvestigation } from '../composables/useContinueInvestigation'

const router = useRouter()
const account = useAccountStore()
const archive = useArchiveStore()
const { item: currentItem, to: resumeTo, label: resumeLabel, task: currentTask } = useContinueInvestigation()
const mode = ref<'register' | 'login'>('register')
const name = ref('')
const password = ref('')
const busy = ref(false)
const legacyBackupDownloaded = ref(false)
const saveFeedback = ref('')
watch(() => account.reauthUsername, (username) => {
  if (username) { mode.value = 'login'; name.value = username; password.value = '' }
}, { immediate: true })
const syncLabel = computed(() => account.syncState === 'synced' && !account.pendingUpload ? '云端已保存' : account.syncState === 'saving' ? '正在保存…' : account.syncState === 'loading' ? '正在连接…' : account.pendingSafe && account.pendingUpload ? '本机暂存 · 待同步' : '等待同步')
const canContinue = computed(() => account.cloudReady && !['loading', 'conflict', 'upgrade'].includes(account.syncState))
const currentCount = computed(() => Object.keys(archive.records).length)
const cloudCount = computed(() => Object.keys(account.cloudProgress?.records ?? {}).length)
const updatedLabel = computed(() => account.cloudUpdatedAt
  ? new Date(account.cloudUpdatedAt * 1000).toLocaleString('zh-CN')
  : account.syncState === 'offline' || account.syncState === 'loading' ? '尚未确认' : '尚未保存')

// Signing in always starts at the home scene, including account switches and
// protected-page redirects. The home scene then resumes that account's progress.
const enterHome = () => router.replace('/')
const continueInvestigation = () => { if (canContinue.value && !busy.value) void router.push(resumeTo.value) }
const retryConnection = async () => {
  if (busy.value) return
  busy.value = true
  try { await account.retry() } finally { busy.value = false }
}
const saveAccount = async () => {
  if (busy.value) return
  busy.value = true
  saveFeedback.value = ''
  try { saveFeedback.value = await account.saveNow() ? '进度已保存。' : '尚未同步，请检查连接后重试。' }
  finally { busy.value = false }
}

const submit = async () => {
  if (busy.value) return
  legacyBackupDownloaded.value = false
  busy.value = true
  try {
    const success = await account.authenticate(mode.value, name.value.trim(), password.value)
    password.value = ''
    if (success && canContinue.value) await enterHome()
  } finally {
    busy.value = false
  }
}

const resolveConflict = async (choice: 'cloud' | 'current') => {
  if (busy.value) return
  busy.value = true
  try {
    if (choice === 'cloud') await account.chooseCloud()
    else await account.chooseCurrent()
    if (canContinue.value) await enterHome()
  } finally {
    busy.value = false
  }
}

const signOut = async () => {
  if (busy.value) return
  busy.value = true
  try {
    await account.logout()
    legacyBackupDownloaded.value = false
    mode.value = 'login'
    name.value = ''
    password.value = ''
  }
  catch (cause) { account.error = cause instanceof Error ? cause.message : '退出请求失败，请检查后端连接后重试。' }
  finally { busy.value = false }
}

const downloadLegacySave = () => {
  if (!account.cloudProgress) return
  const snapshot = { edition: account.cloudProgress.contentVersion ?? 'legacy-v1', downloadedAt: new Date().toISOString(), progress: account.cloudProgress }
  const file = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = `unclaimed-legacy-save-${account.username ?? 'archivist'}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  legacyBackupDownloaded.value = true
}

const beginNewEdition = async () => {
  if (!legacyBackupDownloaded.value || busy.value) return
  busy.value = true
  try { if (await account.startNewEdition()) await enterHome() }
  finally { busy.value = false }
}
</script>

<template>
  <component :is="account.signedIn ? AppShell : 'div'">
    <section class="account-scene" :class="{ guest: !account.signedIn }">
      <header v-if="!account.signedIn" class="account-guest-header"><span class="account-brand"><i>拾</i><strong>长征失物招领处</strong></span><small>数字档案箱 LZ-1936-07</small></header>
      <div class="account-layout">
        <div class="account-copy">
          <template v-if="account.syncState === 'upgrade'">
            <span class="account-eyebrow">旧档保护</span><h1>先留下旧档，<br>再开启新故事。</h1>
            <p class="account-description">旧版线索与当前章节不兼容。旧存档仍在云端，尚未覆盖；先下载备份，再决定是否开始新版调查。</p>
            <p v-if="account.error" class="account-message error" role="alert">{{ account.error }}</p>
            <div class="account-actions"><button type="button" class="account-text-action" :disabled="busy" @click="downloadLegacySave">{{ legacyBackupDownloaded ? '重新下载旧档' : '下载旧版存档' }} ↓</button><button type="button" class="account-cta" :disabled="!legacyBackupDownloaded || busy" @click="beginNewEdition">{{ busy ? '正在创建…' : '确认开始新版' }} <span>→</span></button></div>
            <p class="account-note">确认后，云端将替换为新版空白进度。下载的旧档可留存。</p><button type="button" class="account-text-action" :disabled="busy || account.pendingUpload" @click="signOut">暂不迁移，退出账号</button>
          </template>
          <template v-else-if="account.syncState === 'conflict'">
            <span class="account-eyebrow">存档核对</span><h1>从哪一份记录，<br>继续调查？</h1>
            <p class="account-description">当前页面与云端都有更新。请核对后选择一份继续，系统不会替你决定。</p>
            <dl class="account-comparison"><div><dt>当前页面</dt><dd>{{ currentCount }} 件有记录 <small>档案员 {{ archive.keeperNumber }}</small></dd></div><div><dt>云端档案</dt><dd>{{ cloudCount }} 件有记录 <small>{{ updatedLabel }}</small></dd></div></dl>
            <p v-if="account.error" class="account-message error" role="alert">{{ account.error }}</p>
            <div class="account-actions"><button type="button" class="account-text-action" :disabled="busy" @click="resolveConflict('cloud')">使用云端档案</button><button type="button" class="account-cta" :disabled="busy" @click="resolveConflict('current')">保留当前页面 <span>→</span></button></div>
          </template>
          <template v-else-if="account.signedIn">
            <div class="account-meta" aria-label="账号与进度"><span>{{ account.username }}</span><span>已归档 {{ archive.archivedCount }} / 5</span><span role="status">{{ syncLabel }}</span></div>
            <h1>{{ archive.endingUnlocked ? '把这次调查，郑重留下。' : '继续你的调查。' }}</h1>
            <div class="account-current"><span>{{ archive.endingUnlocked ? '五件档案已完成' : '当前物品 · ' + String(currentItem.order).padStart(2, '0') }}</span><h2>{{ archive.endingUnlocked ? '为物件留下你的陈列说明' : currentItem.name }}</h2><p>{{ currentTask }}</p></div>
            <p v-if="account.syncState === 'offline'" class="account-message" role="status">{{ account.error ? account.error + ' ' : '' }}{{ account.pendingSafe && account.pendingUpload ? '新进度已暂存本机，等待连接后上传。请保留本站数据。' : account.cloudReady ? '云端暂时不可用，当前页面的调查仍可继续。' : '请先连接存档服务，取回账号中的调查记录。' }} <button type="button" :disabled="busy" @click="retryConnection">{{ busy ? '正在连接…' : '重新连接 ↗' }}</button></p>
            <p v-if="account.error && account.syncState !== 'offline'" class="account-message error" role="alert">{{ account.error }}</p>
            <button type="button" class="account-cta" :disabled="!canContinue || busy" @click="continueInvestigation">{{ account.syncState === 'loading' ? '正在核对存档…' : resumeLabel }} <span>→</span></button>
            <details class="account-settings"><summary>账号设置与存档</summary><div class="account-settings-body"><dl><div><dt>档案员编号</dt><dd>{{ archive.keeperNumber }}</dd></div><div><dt>最近云端保存</dt><dd>{{ updatedLabel }}</dd></div></dl><div class="account-setting-actions"><button type="button" :disabled="busy || account.syncState === 'loading'" @click="saveAccount">{{ busy ? '正在处理…' : '立即保存进度' }}</button><button type="button" :disabled="busy || account.syncState === 'saving'" @click="signOut">退出当前账号</button></div><p v-if="saveFeedback" role="status">{{ saveFeedback }}</p></div></details>
          </template>
          <template v-else>
            <span class="account-eyebrow">长征失物招领处</span><h1>从一件失物，<br>读起。</h1><p class="account-description">观察五件物品留下的痕迹，整理有依据的故事，再翻阅它们各自关联的长征史实。</p><figure class="account-guest-art"><img :src="objectArtwork.list" alt="原创虚构物件：被雨水浸过的名单"></figure><p class="account-note">游戏故事为原创虚构，历史资料独立核验。</p>
          </template>
        </div>
        <figure v-if="account.signedIn" class="account-art"><span>{{ currentItem.archiveNo }} · 原创虚构物件</span><img :src="objectArtwork[currentItem.key]" :alt="currentItem.name"><figcaption>{{ currentItem.subtitle }}</figcaption></figure>
        <section v-else class="account-form-panel" aria-label="档案员账号">
          <h2>{{ mode === 'register' ? '登记档案员' : '取回你的档案' }}</h2><p>{{ mode === 'register' ? '创建账号，保存你的调查记录。' : '登录后，接着上次的痕迹继续。' }}</p>
          <div class="account-form-modes" aria-label="账号操作"><button type="button" :aria-pressed="mode === 'register'" @click="mode = 'register'">首次登记</button><button type="button" :aria-pressed="mode === 'login'" @click="mode = 'login'">已有账号</button></div>
          <form @submit.prevent="submit"><label>账号名<input v-model="name" autocomplete="username" minlength="3" maxlength="24" pattern="[A-Za-z0-9_-]+" required placeholder="3—24 位字母、数字、_ 或 -"></label><label>密码<input v-model="password" type="password" :autocomplete="mode === 'register' ? 'new-password' : 'current-password'" minlength="8" maxlength="128" required placeholder="至少 8 位"></label><p v-if="account.error" class="account-form-error" role="alert">{{ account.error }}</p><button v-if="account.syncState === 'offline'" type="button" class="account-form-retry" :disabled="busy" @click="retryConnection">重新检测登录与存档 ↗</button><button type="submit" class="account-cta" :disabled="busy || account.syncState === 'loading'">{{ busy ? '正在核对…' : mode === 'register' ? '创建账号，进入首页' : '登录，进入首页' }} <span>→</span></button></form><small>无需邮箱。密码不会写入浏览器本地存储。</small>
        </section>
      </div>
    </section>
  </component>
</template>

<style scoped>
.account-scene{color:#eee3ce;font-family:var(--font-sans);min-height:calc(100svh - 220px);display:flex;align-items:center}.account-scene.guest{display:block;min-height:100svh;padding:0 clamp(24px,6vw,100px);background:radial-gradient(ellipse at 65% 35%,#524a2c26,transparent 58%),#10130f}.account-guest-header{display:flex;align-items:center;justify-content:space-between;gap:20px;max-width:1280px;min-height:80px;margin:auto;border-bottom:1px solid #b9a88126}.account-brand{display:flex;align-items:center;gap:12px}.account-brand i{display:grid;place-items:center;flex:none;width:38px;height:38px;border-radius:50%;background:#79392f;font:20px var(--font-display);font-style:normal}.account-brand strong{font-size:16px}.account-guest-header>small{color:#9ea58f;font-size:11px}.account-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:clamp(40px,6vw,110px);width:100%;max-width:1280px;margin:auto;padding:36px 0}.guest .account-layout{min-height:calc(100svh - 80px);grid-template-columns:minmax(0,1fr) minmax(320px,390px)}.account-copy{min-width:0;max-width:610px}.account-eyebrow,.account-current>span{display:block;color:#c1a174;font-size:11px;letter-spacing:.08em}.account-copy h1{margin:19px 0 28px;color:#f0e6d0;font:600 clamp(32px,3.3vw,48px)/1.4 var(--font-display);letter-spacing:0;text-wrap:balance}.account-description,.account-current p{max-width:530px;margin:0;color:#bdc3ad;font-size:15px;line-height:1.9}.account-meta{display:flex;flex-wrap:wrap;gap:8px 16px;color:#a5ae95;font-size:12px;line-height:1.7}.account-meta>span:first-child{color:#ddd3ba}.account-current h2{margin:9px 0 13px;font:600 24px/1.5 var(--font-display);color:#d9c19b}.account-cta{display:inline-flex;align-items:center;justify-content:space-between;gap:36px;min-width:225px;min-height:46px;margin-top:27px;padding:12px 18px;border:1px solid #9e6b50;background:#7c4033;color:#fff0d6;font:600 14px var(--font-sans);cursor:pointer}.account-cta:hover:not(:disabled){background:#91503f}.account-cta:disabled{opacity:.5;cursor:wait}.account-cta>span{font-size:20px;font-weight:400}.account-art{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;min-height:390px;margin:0;padding:24px 28px 20px;background:radial-gradient(ellipse,#e6dcc6,#cec0a3);color:#5b5140;border:1px solid #a7987959}.account-art>span{align-self:flex-start;font:10px var(--font-mono);line-height:1.7}.account-art>img{display:block;flex:none;min-width:0;width:100%;height:300px;object-fit:contain;margin:18px 0}.account-art>figcaption{font-size:12px;line-height:1.7;text-align:center}.account-guest-art{margin:25px 0 0;max-width:390px}.account-guest-art img{display:block;width:100%;height:220px;object-fit:contain;filter:drop-shadow(0 15px 15px #0005)}.account-note{margin:17px 0 0;color:#9ea78e;font-size:12px;line-height:1.8}.account-settings{max-width:530px;margin-top:28px;border-top:1px solid #b9a88133;padding-top:16px}.account-settings>summary{width:fit-content;color:#aeb49e;font-size:12px;cursor:pointer}.account-settings-body{padding-top:12px}.account-settings dl,.account-comparison{margin:0}.account-settings dl>div,.account-comparison>div{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid #b9a88124;font-size:12px;line-height:1.7}.account-settings dt,.account-comparison dt{color:#9da78f}.account-settings dd,.account-comparison dd{margin:0;color:#d9d6c0;text-align:right}.account-setting-actions,.account-actions{display:flex;align-items:center;flex-wrap:wrap;gap:18px}.account-setting-actions{margin-top:15px}.account-setting-actions button,.account-text-action,.account-message button{padding:5px 0;border:0;background:none;color:#d0b18b;font-size:12px;text-decoration:underline;text-underline-offset:4px;cursor:pointer}.account-settings-body>p{color:#b9c5a6;font-size:12px;line-height:1.7}.account-message{max-width:540px;margin:17px 0 0;padding-left:12px;border-left:2px solid #b29062;color:#d7c7a6;font-size:13px;line-height:1.8}.account-message.error{border-color:#ba7e63;color:#e8b499}.account-message button{margin-left:8px}.account-actions{margin-top:22px}.account-actions .account-cta{margin:0}.account-comparison{margin-top:22px}.account-comparison dd small{display:block;color:#aab49b;font-size:11px}.account-form-panel{width:100%;padding:30px 32px;background:#e6dcc7;border:1px solid #b9a98b;color:#332e26}.account-form-panel h2{margin:0 0 10px;font:600 28px/1.4 var(--font-display)}.account-form-panel>p{margin:0;color:#615844;font-size:13px;line-height:1.8}.account-form-modes{display:flex;gap:24px;margin:20px 0;border-bottom:1px solid #a593734d}.account-form-modes button{padding:9px 0;border:0;border-bottom:2px solid transparent;background:none;color:#756a54;font-size:13px}.account-form-modes button[aria-pressed=true]{color:#7c4033;border-bottom-color:#7c4033;font-weight:600}.account-form-panel form{display:grid;gap:17px}.account-form-panel label{display:grid;gap:8px;min-width:0;color:#4d4436;font-size:13px}.account-form-panel input{min-width:0;width:100%;height:44px;padding:10px 12px;border:1px solid #b5a78a;border-radius:0;background:#f8f2e6;color:#302a22;font-size:14px}.account-form-panel input::placeholder{color:#81745e;font-size:12px}.account-form-panel .account-cta{width:100%;min-width:0;margin-top:4px}.account-form-panel>small{display:block;margin-top:17px;font-size:11px;line-height:1.7;color:#76694f}.account-form-error{margin:0;color:#8a3b2b;font-size:13px;line-height:1.7}.account-form-retry{padding:0;border:0;background:none;color:#7c4033;font-size:12px;text-align:left;text-decoration:underline}.account-scene :is(button,input,summary):focus-visible{outline:2px solid #ce9e6d;outline-offset:4px}
@media(max-width:850px){.account-layout,.guest .account-layout{grid-template-columns:minmax(0,1fr);gap:28px;min-height:0}.account-scene{min-height:0}.account-art{grid-row:2;min-height:310px;max-width:640px;width:100%}.account-art>img{height:250px}.guest .account-layout{grid-template-columns:minmax(0,1fr) minmax(280px,360px);gap:26px}.account-copy h1{font-size:34px}.account-guest-art img{height:180px}}
@media(max-width:650px){.account-layout,.guest .account-layout{grid-template-columns:minmax(0,1fr);padding:14px 0 26px;gap:26px}.account-scene.guest{padding:0 20px}.account-guest-header{min-height:68px}.account-guest-header>small{display:none}.account-copy h1{margin:16px 0 22px;font-size:32px}.account-description,.account-current p{font-size:14px}.account-current h2{font-size:21px}.account-meta{gap:6px 12px;font-size:11px}.account-art{min-height:280px;padding:18px}.account-art>img{height:210px;margin:15px 0}.account-cta{min-width:0;width:100%}.account-guest-art{display:none}.guest .account-copy h1 br{display:none}.guest .account-copy h1{font-size:30px;margin:14px 0}.guest .account-note{margin-top:12px;font-size:11px}.account-form-panel{padding:24px}.account-settings{margin-top:24px}.account-actions{align-items:stretch;flex-direction:column}.account-comparison>div{flex-wrap:wrap}.account-comparison dd{text-align:left}}
</style>
