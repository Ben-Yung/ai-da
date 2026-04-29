# 👺 愛打 — Beat with Love

香港傳統習俗「打小人」社交娛樂平台

**打者愛也** — 有打有愛，發洩兼祝福

## MVP v1 — 已完成 ✅

> 單人 Web App，包含打小人與愛的抱抱兩種模式。

### 🏠 功能列表

| 功能 | 狀態 |
|------|------|
| 用戶註冊/登入 (JWT + bcrypt) | ✅ |
| Splash 動畫 (~12s Canvas) | ✅ |
| 主頁 Icon 導航 | ✅ |
| 打小人遊戲 (Canvas 點擊拍打) | ✅ |
| 愛的抱抱遊戲 | ✅ |
| 紙人命名系統 (DB 儲存) | ✅ |
| 音樂系統 (Web Audio API) | ✅ |
| 8 款預設紙人 (JSON config) | ✅ |
| 7 款工具 (打4+抱3) | ✅ |
| 口訣逐句同步顯示 | ✅ |
| 排行榜 & 戰績記錄 | ✅ |
| 典故頁面 | ✅ |
| 設定 (音效/音樂/震動) | ✅ |
| PWA Ready | ✅ |

### 遊戲模式

**👊 打小人（發洩模式）**
- 30 秒限時，Canvas 點擊拍打
- 連擊加成計分
- 低頻 beats + 碎裂特效

**💕 愛的抱抱（祝福模式）**
- 相同引擎不同 theme
- 柔和音效 + 心型粒子
- 祝福口訣顯示

### 技術棧

- **後端：** Python FastAPI + Uvicorn
- **前端：** Vanilla JS + Canvas API（零框架）
- **資料庫：** PostgreSQL（SQLAlchemy + Alembic）
- **認證：** JWT + bcrypt
- **音效：** Web Audio API（即時生成）
- **圖片：** SVG/CSS 繪製（零外部資源）

### 專案結構

```
ai-da/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry
│   │   ├── config.py        # Settings
│   │   ├── database.py      # DB connection
│   │   ├── models.py        # ORM models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT + bcrypt
│   │   ├── routers/
│   │   │   ├── auth.py      # Register/Login
│   │   │   ├── game.py      # Game endpoints
│   │   │   └── users.py     # Profile
│   │   └── utils/
│   │       └── tools.py     # Config presets
│   ├── alembic/             # DB migrations
│   └── requirements.txt
├── frontend/
│   ├── index.html           # SPA shell
│   ├── css/                 # Styles
│   ├── js/                  # Game engine & app
│   └── manifest.json        # PWA
└── docs/                    # Documentation
```

## 本地開發

```bash
# 後端
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # 設定 DATABASE_URL
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 前端（由 FastAPI 直接 serve）
# 打開 http://localhost:8000
```

## 部署 (Render.com)

1. Fork / Push 到 GitHub
2. Render 建立 Web Service
3. Build Command: `cd backend && pip install -r requirements.txt`
4. Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. 設定 Environment Variable: `DATABASE_URL`
6. 建立 PostgreSQL database (Render 免費 1GB)

---

*⚡ 由閃電 × 快閃軟件客 共同打造*
