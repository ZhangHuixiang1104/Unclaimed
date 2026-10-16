# Unclaimed

> 主人未知，经历真实，共同保存。

**Unclaimed**（中文名：长征失物招领处）是一款以长征历史为背景的互动数字档案作品。玩家以档案保管员的身份观察遗留物件、修复线索、判断证据并完成归档，在无法确认物件主人身份时，依然保存真实发生过的经历。

## 当前进度

- 已完成 Vue 3 前端框架与整体视觉风格
- 已接通首页、档案室、物件调查、路线档案、终章与保管员票据
- 已实现线索发现、证据分类、账号注册/登录与云端存档
- 账号为进入作品的前置步骤；未登录时访问任意剧情页面都会先进入注册/登录页
- 当前使用占位素材，后续将逐件补充正式史料、图像、声音与专属互动

## 本地运行

项目需要 Node.js、Python 3.11+。前后端分别启动；本次交付保持前端服务关闭。

先在项目根目录启动后端：

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

再在另一个终端启动前端：

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 `http://127.0.0.1:4173`。前端开发服务把 `/api` 请求转发到后端的 8000 端口。

检查并构建：

```bash
npm run test
npm run build
python -m unittest discover -s backend -p 'test_*.py' -v
```

## 账号与存档

- 首次打开作品先注册或登录，验证成功后进入首页；已有登录会话可直接继续。账号名为 3—24 位字母、数字、下划线或短横线；密码至少 8 位。不收集邮箱。
- 登录后，物件、线索、证据判断、路线、档案员编号及终章留言写入后端 SQLite 数据库 `backend/data/archive.db`。密码使用加盐 scrypt 哈希，登录凭证保存在 HttpOnly Cookie 中。
- 自动保存采用版本号；云端存档被其他设备更新时，不会静默覆盖，而是让玩家选择当前页面或云端进度。
- 退出账号会清空当前页面里的账号进度。旧版浏览器本地进度与临时剧情记录在新版页面首次打开时删除；新版不再向浏览器本地存储写游戏进度。
- 目前是本地演示配置。公开部署前需要 HTTPS、`ARCHIVE_COOKIE_SECURE=1`、数据库备份，以及登录限流和密码找回方案。

## 项目结构

```text
frontend/                       Vue 3 前端项目
backend/                        FastAPI 账号与云存档服务
要求/                           大赛通知、参赛须知与说明文档模板
长征失物招领处参赛设计与开发计划.md  完整设计方案与开发计划
```

## 内容原则

作品将“已确认事实”“合理推测”“仍然未知”明确区分。虚构复合物件不会被描述成真实馆藏，所有正式历史内容与素材将在补充时注明来源。

## 技术栈

Vue 3、TypeScript、Vite、Vue Router、Pinia、SCSS、Howler.js；FastAPI、SQLAlchemy、SQLite。

