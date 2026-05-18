# 百草行 - 中医药文化解谜游戏

> **项目类型**: 像素风中医药文化解谜游戏  
> **游戏引擎**: Phaser.js 3.60  
> **技术栈**: HTML5 + Canvas + Node.js + Express  
> **AI功能**: LLM API (Claude/GPT)  
> **开发周期**: 14天MVP冲刺 (2026-05-18 ~ 2026-05-31)

---

## 📖 项目简介

**百草行**是一款以中医药文化为背景的像素风解谜游戏。玩家将扮演一名年轻的中医师，在百草村中探索、采集草药、问诊病人，通过学习中医药知识来解开各种谜题。

### 核心玩法
- 🚶 **自由探索** - WASD移动，探索百草村地图
- 🌿 **草药采集** - 靠近草药按E键采集
- 🎒 **背包系统** - 管理采集的草药
- 💬 **对话系统** - 与NPC对话，了解病情
- 🤖 **AI问诊** - 通过LLM API生成个性化问诊对话
- 📝 **处方验证** - 根据病情配制正确处方

---

## 🚀 快速开始

### 方式一：纯前端模式（无需安装依赖）

```bash
# 直接打开 index.html
start d:\Game for Tecent\Game1\index.html
```

**特点**:
- ✅ 无需安装任何依赖
- ✅ 可玩核心玩法（移动、采集）
- ❌ 无法使用AI问诊功能

---

### 方式二：完整功能模式（需要Node.js）

#### 1. 安装依赖
```bash
cd "d:\Game for Tecent\Game1"
npm install
```

#### 2. 配置环境变量
```bash
copy .env.example .env
# 编辑 .env 文件，填入 LLM API Key
```

#### 3. 启动服务器
```bash
npm start
# 或
node server/index.js
```

#### 4. 访问游戏
打开浏览器访问: http://localhost:3000

---

### 方式三：静态服务器模式（轻量级）

```bash
cd "d:\Game for Tecent\Game1"
node static-server.js
# 访问: http://localhost:8080
```

---

## 🎮 操作说明

| 按键 | 功能 |
|------|------|
| **WASD** 或 **方向键** | 玩家移动 |
| **E** | 采集草药 |
| **B** | 打开/关闭背包 |
| **F12** | 调试模式（显示坐标） |
| **Space** | 确认/交互 |

---

## 📁 项目结构

```
Game1/
├── index.html                  # 游戏入口（Phaser CDN）
├── package.json                # 项目配置
├── package-lock.json          # 依赖锁文件
├── README.md                  # 项目说明（本文件）
├── TODO.md                    # 开发任务清单
├── .env.example               # 环境变量模板
├── .gitignore                 # Git忽略配置
├── static-server.js           # 轻量级静态服务器
│
├── src/                       # 前端源码
│   ├── main.js                # 游戏主文件
│   ├── systems/               # 游戏系统
│   │   ├── MockAPI.js         # 模拟API（无需后端）
│   │   └── PlayerSpriteGenerator.js  # 玩家Sprite生成器
│   └── data/                  # 游戏数据
│       ├── herbs.json         # 草药数据（20种）
│       └── patients.json      # 患者数据（5位）
│
│
└── node_modules/              # 依赖库（104 packages）
```

---

## 🛠️ 技术栈

### 前端
- **游戏引擎**: Phaser.js 3.60 (CDN引入)
- **渲染**: Canvas 2D
- **动画**: Sprite帧动画
- **地图**: Tilemap (Tiled Editor)

### 后端
- **运行环境**: Node.js v26.1.0
- **Web框架**: Express 5.x
- **跨域处理**: CORS
- **环境变量**: dotenv
- **HTTP请求**: node-fetch

### AI功能
- **API**: LLM API (Claude/GPT)
- **功能**: 
  - 智能问诊对话生成
  - 草药知识问答
  - 处方验证反馈

---

## ✅ 当前进度

### 已实现功能 ✅
- [x] 项目初始化与核心框架
- [x] 玩家移动（WASD/方向键）
- [x] Sprite动画（4方向×4帧）
- [x] 摄像机跟随系统（lerp惯性）
- [x] Tilemap碰撞检测
- [x] 草药采集系统（E键）
- [x] HUD显示（药材数量、时辰、节气）
- [x] 后端服务搭建（Express）
- [x] LLM客户端封装
- [x] 草药数据（20种）
- [x] 患者数据（5位）
- [x] MockAPI系统

### 开发中 🚧
- [ ] 背包UI系统
- [ ] 对话系统
- [ ] 节气时辰系统

### 待实现 📋
- [ ] 碾药小游戏
- [ ] AI问诊界面
- [ ] 处方验证系统
- [ ] 剧情实现（序章+第一幕）
- [ ] 任务系统

> 📝 详细任务清单请查看 [TODO.md](./TODO.md)

---

## 🎯 开发计划

| 日期 | 任务 | 状态 |
|------|------|------|
| Day 1 (05-18) | 项目初始化与核心框架 | ✅ 完成 |
| Day 2 (05-18) | 后端服务与AI接入 | ✅ 完成 |
| Day 3 (05-18) | 主角移动与摄像机系统 | 🚧 进行中 |
| Day 4 (05-19) | 草药采集与背包系统 | 📋 待开始 |
| Day 5 (05-20) | 对话系统与节气时辰 | 📋 待开始 |
| Day 6-14 (05-21~31) | 地图、剧情、测试、部署 | 📋 待开始 |

---

## 🐛 调试模式

按 **F12** 开启调试模式，可查看：
- 玩家坐标
- 碰撞体范围
- FPS帧率
- 游戏状态

---

## 📝 开发日志

### 2026-05-18
- ✅ 创建项目基础结构
- ✅ 实现玩家移动和摄像机跟随
- ✅ 实现草药采集系统
- ✅ 创建草药和患者数据
- ✅ 配置Node.js环境
- ✅ 安装后端依赖（104 packages）

---

## 📚 相关文档

- [游戏设计文档 (GDD)](./docs/百草行_GDD.html)
- [Phase 1 实施方案](./docs/百草行_Phase1实施方案.html)
- [腾讯云Hackathon参赛指南](./docs/Tencent_Cloud_Hackathon_ZH.pdf)
- [开发任务清单](./TODO.md)

---

## 📄 许可证

MIT License

---

## 👥 开发团队

**开发者**: [您的名字]  
**参赛项目**: 腾讯云Hackathon  
**最后更新**: 2026-05-18
