# Unclaimed｜长征失物招领处

> 姓名留白，证据说话；故事与史实分别保存。

以长征历史为阅读背景的互动数字档案作品。玩家注册或登录后，依次调查 **名单 → 行军图 → 电池盒 → 草鞋 → 饭碗**，观察物件、整理故事展签，再进入各章独立的四站史实展柜。五件建档后进入终章，为选定的物件留下留言并生成保管票据。

五件游戏物品及其故事为原创虚构；史实展柜提供独立来源。“转三”只属于名单章节，章节索引的连线表示调查顺序。

## 本机快速启动

本机 macOS 已有 `.venv` 和前端依赖，在项目根目录运行：

```sh
make dev
```

打开 **http://127.0.0.1:5173**。直接运行 `make` 也会启动开发服务，按 **Ctrl+C** 退出。

- 使用项目内 `.venv/bin/python` 启动后端，前端将 `/api` 代理到 `127.0.0.1:8000`。
- 已有版本匹配的后端会复用；退出只清理本次启动的进程。
- 8000 或 5173 端口冲突时明确报错，保留原服务。
- 账号与存档保存在 `backend/data/archive.db`，启动和退出均保留该文件。

首次在其他 macOS 环境准备依赖时，需要 Node.js、Python 3.11+ 和 Make：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
npm --prefix frontend install
make dev
```

Windows 使用 PowerShell 启动脚本。当前 Makefile 依赖 Bash、macOS 虚拟环境路径和 `lsof`，不适用于原生 Windows；两种平台使用各自入口。

```powershell
python -m pip install -r backend/requirements.txt
npm --prefix frontend install
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
```

需要分别启动时，在两个终端运行后端与前端；两个终端保持运行：

```sh
.venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

```sh
npm --prefix frontend run dev -- --strictPort
```

## 目录与阅读入口

| 路径 | 用途 |
| --- | --- |
| [Makefile](Makefile) | 本机 macOS 一键开发启动 |
| [scripts/start-dev.ps1](scripts/start-dev.ps1) | Windows PowerShell 开发启动 |
| [frontend/](frontend/README.md) | Vue／TypeScript 前端；具体流程见 [PLAYER_FLOW](frontend/PLAYER_FLOW.md) |
| `backend/` | FastAPI／SQLAlchemy／SQLite 账号与存档服务 |
| `backend/data/archive.db` | 本机账号与存档，属于本地数据，不提交 Git |
| [docs/](docs/README.md) | 现行设计、数据契约、交互规范、验收与研究台账 |
| `stuffs/` | 按五件物品整理的章节方案、素材母版、史实研究及来源清单 |
| `scripts/` | Windows 启动脚本、道具图层合成脚本与配置 |
| [比赛要求.md](比赛要求.md) | 比赛规则与说明书栏目，统一维护这一份 |
| [archive/](archive/长征失物招领处参赛设计与开发计划.md) | 历史提案，保留创作过程记录 |

阅读顺序：[当前分章方案](docs/08当前分章设计与运行口径.md) → [总体架构](docs/01总体架构.md) → [数据与状态契约](docs/02数据与状态契约.md) → [开发任务与验收](docs/05开发任务与验收.md)。视觉实现另见 [前端设计系统](frontend/DESIGN_SYSTEM.md)。

`.venv/`、`frontend/node_modules/` 是本机依赖，保留以便直接测试；`frontend/dist/`、`*.tsbuildinfo`、Python 和前端工具缓存均可重新生成，已纳入 Git 忽略。构建产物通过下方构建命令生成。

## 存档与连接

进度先显示“保存中…”，云端确认后显示“云端已保存”。未上传进度按账号和页面实例分别暂存浏览器；冲突期间继续保护本机操作，刷新或重开页面后用现有账号页核对草稿与云端版本。暂存期间请保留本站浏览器数据。

会话过期或其他标签页切换账号后，页面返回原账号登录入口，保留其草稿。旧版云存档保留备份与版本保护；不兼容的旧档先下载备份，再由玩家决定是否开始新版。

连接失败时先检查后端健康接口：**http://127.0.0.1:8000/api/v1/health**。当前应返回：

```json
{
  "status": "ok",
  "saveContract": "independent-chapters-v6",
  "identityContract": "account-bound-v1"
}
```

更新前后端后需重启旧进程。已有账号首次同步失败时，在账号页用原账号重连。

## 检查与当前状态

在项目根目录运行：

```sh
npm --prefix frontend run test
npm --prefix frontend run build
.venv/bin/python -m unittest discover -s backend -p 'test_*.py' -v
```

五章已有专属互动、故事保存与独立史实展柜，账号存档、顺序解锁、终章及票据均已接入。2026-10-26 已通过 **52 项前端测试、13 项后端测试和生产构建**；浏览器检查覆盖首章键盘与鼠标操作、地图正背核对、票据稳定性、会话失效恢复、旧档退出、多页草稿保护和跨账号拒写。Makefile 已用临时数据库验证启动、退出清理、后端复用与端口冲突。

2026-10-27 完成存档恢复的最小修复与声音占位代码清理，前端 **54 项测试及生产构建通过**；隔离数据库浏览器验证暂存失败后重连保留最新操作、恢复来源链完整清理及后续云端保存。

待验收：五章完整真人试玩、其他章节的视觉与手感、素材体积优化、公开部署安全及 Windows 启动脚本实跑。研究照片当前随构建打包，逐图使用许可仍待核验，公开发布前须完成核权。完整记录见[开发任务与验收](docs/05开发任务与验收.md)。

比赛截止 **2026 年 11 月 5 日 23:00**；作品说明书、项目实体与真实运行演示视频的要求见[比赛要求](比赛要求.md)。
