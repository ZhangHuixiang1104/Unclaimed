SHELL := /bin/bash
.DEFAULT_GOAL := dev

PYTHON := .venv/bin/python
HEALTH_CHECK = $(PYTHON) -c 'import json, urllib.request; h = json.load(urllib.request.urlopen("http://127.0.0.1:8000/api/v1/health", timeout=1)); assert h.get("status") == "ok" and h.get("saveContract") == "independent-chapters-v6" and h.get("identityContract") == "account-bound-v1"'

.PHONY: dev
dev:
	@test -x "$(PYTHON)" || { echo '缺少 .venv/bin/python，请先准备项目虚拟环境。'; exit 1; }
	@test -x frontend/node_modules/.bin/vite || { echo '缺少前端依赖，请先运行 npm --prefix frontend install。'; exit 1; }
	@set -eu; \
	backend_pid=; frontend_pid=; \
	cleanup() { \
		trap - EXIT INT TERM; \
		if [ -n "$$frontend_pid" ]; then kill "$$frontend_pid" 2>/dev/null || true; wait "$$frontend_pid" 2>/dev/null || true; fi; \
		if [ -n "$$backend_pid" ]; then kill "$$backend_pid" 2>/dev/null || true; wait "$$backend_pid" 2>/dev/null || true; fi; \
	}; \
	trap cleanup EXIT; trap 'exit 130' INT; trap 'exit 143' TERM; \
	if $(HEALTH_CHECK) >/dev/null 2>&1; then \
		echo '复用已运行且版本匹配的后端。'; \
	elif lsof -nP -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then \
		echo '8000 端口已有不兼容的服务，请先关闭旧后端再运行 make dev。'; exit 1; \
	else \
		$(PYTHON) -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 & backend_pid=$$!; \
		for attempt in {1..40}; do \
			if $(HEALTH_CHECK) >/dev/null 2>&1; then break; fi; \
			kill -0 "$$backend_pid" 2>/dev/null || { echo '后端启动失败，请查看上方日志。'; exit 1; }; \
			sleep 0.25; \
		done; \
		$(HEALTH_CHECK) >/dev/null 2>&1 || { echo '后端未就绪或版本不匹配。'; exit 1; }; \
	fi; \
	echo '打开 http://127.0.0.1:5173；按 Ctrl+C 停止本次启动的服务。'; \
	(cd frontend && exec ./node_modules/.bin/vite --host 127.0.0.1 --strictPort) & frontend_pid=$$!; \
	wait "$$frontend_pid"
