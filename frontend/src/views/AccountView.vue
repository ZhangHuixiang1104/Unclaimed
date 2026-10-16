<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from '../stores/account'
import { useArchiveStore } from '../stores/archive'

const route = useRoute()
const router = useRouter()
const account = useAccountStore()
const archive = useArchiveStore()
const mode = ref<'register' | 'login'>('register')
const name = ref('')
const password = ref('')
const busy = ref(false)
const currentCount = computed(() => Object.keys(archive.records).length)
const cloudCount = computed(() => Object.keys(account.cloudProgress?.records ?? {}).length)
const updatedLabel = computed(() => account.cloudUpdatedAt
  ? new Date(account.cloudUpdatedAt * 1000).toLocaleString('zh-CN') : '尚未保存')

const destination = computed(() => {
  const next = route.query.next
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/account')
    ? next : '/'
})

const enterArchive = () => router.replace(destination.value)

const submit = async () => {
  if (busy.value) return
  busy.value = true
  try {
    const success = await account.authenticate(mode.value, name.value.trim(), password.value)
    password.value = ''
    if (success && account.syncState === 'synced') await enterArchive()
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
    if (account.syncState === 'synced') await enterArchive()
  } finally {
    busy.value = false
  }
}

const signOut = async () => {
  if (busy.value) return
  busy.value = true
  try { await account.logout() }
  catch { account.error = '退出请求失败，请检查后端连接后重试。' }
  finally { busy.value = false }
}
</script>

<template>
  <main class="entry-page">
    <div class="entry-grid" aria-hidden="true"></div>
    <div class="entry-light" aria-hidden="true"></div>

    <header class="entry-header">
      <div class="entry-brand"><span class="entry-brand-mark">拾</span><span><strong>长征失物招领处</strong><small>数字档案箱 LZ-1936-07</small></span></div>
      <div class="entry-duty"><span class="entry-duty-dot"></span>档案室状态：等待值守 <i></i> 23:47</div>
    </header>

    <div class="entry-layout">
      <section class="entry-story" aria-label="作品引言">
        <span class="entry-kicker">ARCHIVE CASE / LZ-1936-07</span>
        <h1>有人把故事<br><em>留在这里。</em></h1>
        <p class="entry-lead">五件没有主人的物件，一晚尚未完成的整理。请先留下你的档案员编号，再打开箱子，看看它们自己留下了什么。</p>
        <div class="entry-story-line"><span>01</span><i></i><span>领取档案</span><span>02</span><i></i><span>寻找线索</span><span>03</span><i></i><span>核对史实</span></div>
        <blockquote>“别先问它们属于谁。先问，它们经历过什么。”</blockquote>
        <div class="entry-story-foot"><span>主人未知 · 经历真实 · 共同保存</span><span>LONG MARCH ARCHIVE</span></div>
      </section>

      <section class="entry-desk" aria-label="档案员账号">
        <div class="entry-card-top"><span>值班登记 / 01</span><span>请勿替未知填写姓名</span></div>

        <template v-if="account.syncState === 'conflict'">
          <div class="entry-card-body">
            <span class="entry-card-kicker">RECORD CONFLICT / 存档校对</span>
            <h2>两份未完的档案</h2>
            <p class="entry-card-copy">当前页面和云端都有记录。选择后将以其中一份继续，不会自动覆盖。</p>
            <div class="entry-compare">
              <div><span>当前页面</span><strong>{{ currentCount }} 件有记录</strong><small>档案员 {{ archive.keeperNumber }}</small></div>
              <div><span>云端档案</span><strong>{{ cloudCount }} 件有记录</strong><small>{{ updatedLabel }}</small></div>
            </div>
            <p v-if="account.error" class="entry-error" role="alert">{{ account.error }}</p>
            <div class="entry-button-row"><button type="button" class="entry-outline" :disabled="busy" @click="resolveConflict('cloud')">使用云端</button><button type="button" class="entry-primary" :disabled="busy" @click="resolveConflict('current')">保留当前页面</button></div>
          </div>
        </template>

        <template v-else-if="account.signedIn">
          <div class="entry-card-body">
            <span class="entry-card-kicker">ARCHIVIST ON DUTY / 已登记</span>
            <h2>欢迎回来，{{ account.username }}</h2>
            <p class="entry-card-copy">你的调查记录已与这个账号关联。打开档案箱，继续完成未归档的部分。</p>
            <dl class="entry-details">
              <div><dt>档案员编号</dt><dd>{{ archive.keeperNumber }}</dd></div>
              <div><dt>已整理物件</dt><dd>{{ archive.archivedCount }} / 05</dd></div>
              <div><dt>最近云端保存</dt><dd>{{ updatedLabel }}</dd></div>
              <div><dt>当前状态</dt><dd>{{ account.syncState === 'synced' ? '已同步' : account.syncState === 'saving' ? '保存中…' : '等待重新连接' }}</dd></div>
            </dl>
            <p v-if="account.error" class="entry-error" role="alert">{{ account.error }}</p>
            <button v-if="account.syncState === 'offline'" type="button" class="entry-primary" :disabled="busy" @click="account.retry">重新连接存档服务</button>
            <button v-else type="button" class="entry-primary" @click="enterArchive">打开档案箱 <span>→</span></button>
            <button type="button" class="entry-quiet" :disabled="busy || account.syncState === 'saving'" @click="signOut">退出当前账号</button>
          </div>
        </template>

        <template v-else>
          <div class="entry-card-body">
            <span class="entry-card-kicker">ARCHIVIST REGISTRATION / 领取值班</span>
            <h2>{{ mode === 'register' ? '登记档案员身份' : '取回你的档案' }}</h2>
            <p class="entry-card-copy">{{ mode === 'register' ? '创建账号，才能接收这只档案箱。已有账号可直接登录。' : '输入已有账号，接着上次的线索继续。' }}</p>
            <div class="entry-tabs" role="tablist" aria-label="账号操作"><button type="button" :class="{ active: mode === 'register' }" :aria-selected="mode === 'register'" @click="mode = 'register'">首次登记</button><button type="button" :class="{ active: mode === 'login' }" :aria-selected="mode === 'login'" @click="mode = 'login'">已有账号</button></div>
            <form class="entry-form" @submit.prevent="submit">
              <label><span>账号名</span><input v-model="name" autocomplete="username" minlength="3" maxlength="24" pattern="[A-Za-z0-9_-]+" required placeholder="3—24 位字母、数字、_ 或 -"></label>
              <label><span>密码</span><input v-model="password" type="password" :autocomplete="mode === 'register' ? 'new-password' : 'current-password'" minlength="8" maxlength="128" required placeholder="至少 8 位"></label>
              <p v-if="account.error" class="entry-error" role="alert">{{ account.error }}</p>
              <button type="submit" class="entry-primary" :disabled="busy || account.syncState === 'loading'">{{ busy ? '正在核对档案…' : mode === 'register' ? '创建账号，接收档案箱' : '登录，继续值班' }} <span>→</span></button>
            </form>
            <p class="entry-privacy">无需邮箱。密码不会写入浏览器本地存储。</p>
          </div>
        </template>

        <div class="entry-card-bottom"><span>登记号 LZ-1936-07</span><span>主人未知 / 经历真实</span></div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.entry-page{--paper:#ece6d7;--dim:#b9b8af;--red:#b95448;min-height:100vh;position:relative;overflow:hidden;isolation:isolate;color:var(--paper);background:radial-gradient(circle at 73% 36%,rgba(110,101,74,.29),transparent 32%),linear-gradient(112deg,#0d100d 0%,#151814 52%,#1d211b 100%);font-family:var(--font-sans)}
.entry-grid,.entry-light{position:absolute;inset:0;pointer-events:none;z-index:-1}.entry-grid{opacity:.2;background-image:linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(90deg,#000,transparent 55%,#000)}.entry-light{background:radial-gradient(ellipse at 75% 32%,rgba(205,182,130,.13),transparent 47%)}
.entry-header{min-height:98px;margin:0 clamp(50px,7vw,140px);display:flex;align-items:center;justify-content:space-between;gap:24px;border-bottom:1px solid rgba(222,211,185,.14)}
.entry-brand{display:flex;align-items:center;gap:13px}.entry-brand-mark{width:40px;height:40px;display:grid;place-items:center;background:#71332d;border-radius:50% 42% 48% 44%;font-family:var(--font-display);font-size:20px;transform:rotate(-4deg)}.entry-brand strong,.entry-brand small{display:block}.entry-brand strong{font-size:15px;letter-spacing:.08em}.entry-brand small{margin-top:4px;color:#a7a79f;font-size:11px;letter-spacing:.04em}.entry-duty{display:flex;align-items:center;gap:9px;color:#a3a69b;font-size:11px;letter-spacing:.06em}.entry-duty-dot{width:6px;height:6px;border-radius:50%;background:#87916d;box-shadow:0 0 9px rgba(135,145,109,.5)}.entry-duty i{width:28px;height:1px;background:rgba(222,211,185,.24);margin:0 6px}
.entry-layout{width:min(1640px,100%);min-height:calc(100vh - 98px);margin:auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,510px);align-items:center;gap:clamp(60px,8vw,145px);padding:60px clamp(50px,7vw,140px) 70px}
.entry-story{max-width:700px}.entry-kicker,.entry-card-kicker{color:#d38b7e;font-size:11px;font-weight:700;letter-spacing:.2em}.entry-story h1{font-family:var(--font-display);font-size:clamp(52px,5.3vw,82px);font-weight:600;letter-spacing:-.045em;line-height:1.16;margin:24px 0 30px}.entry-story h1 em{font-style:normal;color:var(--red)}.entry-lead{max-width:620px;color:#c0c0b7;font-size:17px;line-height:1.95;letter-spacing:.02em}.entry-story-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:42px;padding:17px 0;border-top:1px solid rgba(222,211,185,.16);border-bottom:1px solid rgba(222,211,185,.16);color:#c5b9a4;font-size:11px;letter-spacing:.04em}.entry-story-line span:nth-of-type(odd){color:#d38b7e;font-family:var(--font-mono)}.entry-story-line i{width:13px;height:1px;background:#706f61}.entry-story blockquote{margin:43px 0 0;padding-left:18px;border-left:2px solid #a95047;color:#e0d8c8;font-family:var(--font-display);font-size:19px;line-height:1.7}.entry-story-foot{display:flex;justify-content:space-between;gap:15px;margin-top:65px;color:#8e9288;font-size:10px;letter-spacing:.14em}
.entry-desk{position:relative;background:#e9e1cf;border:1px solid #b9aa8c;box-shadow:0 35px 75px rgba(0,0,0,.33),8px 8px 0 rgba(202,190,161,.08);color:#302e29;transform:rotate(.3deg)}.entry-desk:before{content:'';position:absolute;width:84px;height:23px;top:-11px;left:calc(50% - 42px);background:rgba(202,187,151,.55);transform:rotate(-3deg);box-shadow:0 1px 4px rgba(0,0,0,.12)}.entry-card-top,.entry-card-bottom{display:flex;justify-content:space-between;gap:10px;padding:16px 28px;color:#7a6f5e;font-family:var(--font-mono);font-size:9px;letter-spacing:.06em}.entry-card-top{border-bottom:1px solid rgba(72,61,45,.18)}.entry-card-bottom{border-top:1px solid rgba(72,61,45,.18)}.entry-card-body{padding:26px 34px 28px}.entry-card-kicker{color:#8f342d;font-size:10px}.entry-card-body h2{margin:12px 0 11px;font-family:var(--font-display);font-size:31px;line-height:1.3;color:#302e29}.entry-card-copy{margin:0;color:#625c51;font-size:13px;line-height:1.75}.entry-tabs{display:grid;grid-template-columns:1fr 1fr;margin:24px 0 22px;border-bottom:1px solid rgba(72,61,45,.24)}.entry-tabs button{padding:11px 4px;border:0;border-bottom:2px solid transparent;background:transparent;color:#625c51;font-size:13px}.entry-tabs button.active{border-bottom-color:#7c3731;color:#702e29;font-weight:700}.entry-form{display:grid;gap:15px}.entry-form label{display:grid;gap:8px;color:#38342e;font-size:12px;font-weight:700}.entry-form input{height:46px;width:100%;padding:0 13px;border:1px solid #b8ab95;border-radius:0;outline-offset:2px;background:#f8f3e9;color:#302e29;font-size:13px}.entry-form input::placeholder{color:#817b71;opacity:1}.entry-form input:focus{outline:2px solid #8f342d;border-color:#8f342d}.entry-primary,.entry-outline{min-height:49px;display:inline-flex;align-items:center;justify-content:center;gap:16px;padding:10px 16px;border:1px solid #71332d;font-size:14px;font-weight:700;transition:background .2s,transform .2s}.entry-primary{width:100%;background:#71332d;color:#f5ead7}.entry-primary:hover:not(:disabled){background:#8f4339;transform:translateY(-2px)}.entry-primary span{font-size:19px;font-weight:400}.entry-outline{background:transparent;color:#71332d}.entry-outline:hover:not(:disabled){background:#f8f1e3}.entry-primary:disabled,.entry-outline:disabled{opacity:.55;cursor:wait}.entry-privacy{margin:17px 0 0;color:#726a5f;font-size:11px;line-height:1.6}.entry-error{margin:0;padding:10px 12px;border-left:3px solid #8f342d;background:#f6dbd1;color:#6d2824;font-size:12px;line-height:1.6}
.entry-compare{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:24px 0}.entry-compare div{display:grid;gap:8px;padding:14px;border:1px solid #b9aa8c;background:#f7f0e1}.entry-compare span,.entry-compare small{font-size:11px;color:#625c51}.entry-compare strong{font-size:16px;color:#71332d}.entry-button-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}.entry-details{margin:23px 0}.entry-details div{display:flex;justify-content:space-between;gap:15px;padding:11px 0;border-top:1px solid rgba(72,61,45,.18);font-size:12px}.entry-details dt{color:#625c51}.entry-details dd{margin:0;color:#302e29;font-weight:700}.entry-quiet{display:block;margin:16px auto 0;padding:7px;border:0;background:transparent;color:#71332d;font-size:12px;text-decoration:underline;text-underline-offset:4px}
@media(max-width:1000px){.entry-layout{grid-template-columns:1fr;gap:50px}.entry-story{max-width:720px}.entry-desk{width:min(510px,100%)}.entry-story-foot{margin-top:35px}}@media(max-width:600px){.entry-header{margin:0 24px}.entry-duty{display:none}.entry-layout{padding:42px 24px}.entry-story h1{font-size:50px}.entry-story-line{gap:7px}.entry-card-body{padding:24px}.entry-story-foot{display:none}}
.entry-card-top,.entry-card-bottom{font-size:10px;color:#6f6658}
.entry-card-kicker{font-size:11px}
.entry-card-copy{font-size:14px;color:#514b42}
.entry-tabs button{font-size:14px;color:#514b42}
.entry-form label{font-size:13px}
.entry-form input{font-size:14px}
.entry-form input::placeholder{color:#696257}
.entry-privacy{font-size:12px;color:#625c51}
</style>
