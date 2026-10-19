# Unclaimed｜长征失物招领处

> 姓名留白，证据说话；故事与史实分别保存。

这是一部以长征历史为阅读背景的互动数字档案作品。玩家先注册或登录档案员账号，再按**名单 → 行军图 → 电池盒 → 草鞋 → 饭碗**调查五件**虚构**物品。五件各有自己的故事；“转三”只属于名单章节，不是整部作品的共同任务。名单读完三幕并保存故事后，须主动进入独立史实展柜，翻阅四站材料并建档；其他章节暂沿用证据核验流程。

## 当前可运行范围

前端已有首页、账号、档案室、检查台、章节／史实索引、史实详情、终章与保管凭证，并支持顺序解锁。「名单」已接入散片拖动拼合、正反面手写图层、清泥、纸面三幕故事卡、短篇收束与四站史实展柜；不再要求添加标记、五题筛选和盖章。史实图片仅在本地开发服务中作为待核权研究预览，正式构建不打包。其余四件仍主要为文字／CSS 示意，并暂沿用通用证据判断流程。后端已有注册／登录、HttpOnly Cookie、按账号隔离的 SQLite 云存档与冲突处理。旧版云存档不会自动冒充新版通关；先下载备份，再由玩家确认开启新版。

**尚待制作：**名单拼片／清泥／弹卡的真实浏览器视觉与手感验收、泥点彩边和素材体积优化、其余物件正式图片、饭碗拓印、各件专属互动、四个史实主题的权威来源及图片许可、公开部署安全验收与多人试玩。当前版本不是完整美术或已核验文物照片。

## 本地运行

需要 Node.js 和 Python 3.11+。在项目根目录运行以下命令。

Windows 可以先安装依赖，然后用一个命令同时启动前端和存档服务：

```powershell
python -m pip install -r backend/requirements.txt
npm --prefix frontend install
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

脚本会先确认 8000 端口的存档服务健康且版本匹配，再启动前端；若已有旧后端进程，会明确提示先关闭它。结束前端时也会停止由该脚本启动的后端。若后端已单独运行，脚本不会关闭它。已有账号、`backend/data/archive.db` 和云存档都不会被清除。

也可以分别启动两个终端，在项目根目录启动后端：

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

在另一个终端启动前端：

```powershell
cd frontend
npm install
npm run dev
```

浏览器打开 `http://127.0.0.1:4173`。**两个终端必须同时保持运行**：前端将 `/api` 转发到 `127.0.0.1:8000`，只开前端会出现账号可见但存档同步失败。可先打开 `http://127.0.0.1:8000/api/v1/health`，确认返回 `status: ok` 且 `saveContract: independent-chapters-v3`。如已创建账号但首份存档失败，启动后端后在账号页点“重新连接存档服务”，不要重复注册。不要删除 `backend/data/archive.db`；其中可能包含现有账号及存档。

调查进度修改后，页面会先显示“保存中…”，云端确认后才显示“云端已保存”。若服务临时断开，未同步的**游戏进度**会暂存在当前浏览器（不包含密码）；恢复服务后点击“立即重试”，若云端版本未变化便自动补传。暂存期间不要清理本站浏览器数据；若云端和本机都发生修改，账号页会要求明确选择，不会自动覆盖。进度未确认保存时不能退出账号。正式部署时仍需为 `backend/data/archive.db` 做服务器备份，浏览器暂存不能代替云端备份。

检查：

```powershell
cd frontend
npm run test
npm run build
```

```powershell
python -m unittest discover -s backend -p 'test_*.py' -v
```

## 文档与边界

当前内容口径见[独立章节方案](docs/08当前分章设计与运行口径.md)，文档索引见[docs/README](docs/README.md)，具体玩家流程见[frontend/PLAYER_FLOW](frontend/PLAYER_FLOW.md)。先前把五件串成同一“转三”任务的策划稿只保留为废弃草案，不再指导实现。

名单对应的历史阅读是**土城战役后的伤员救护支线**，不是湘江。历史报道中的手迹、姓名与本游戏名单及回执无关联；章节索引的连线仅表示玩家调查顺序，绝不是五件物品的真实行军路线。正式历史图片、音频、字体和引文须分别核验来源与使用权。

技术栈：Vue 3、TypeScript、Vite、Vue Router、Pinia、SCSS、Howler.js；FastAPI、SQLAlchemy、SQLite。本地配置只供演示；公开部署前须落实 HTTPS、安全 Cookie、数据库备份、登录限流和账号恢复方案。
