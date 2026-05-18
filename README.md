# 百草行 - 中医药文化解谜游戏

## 项目结构（重构后的开发级架构）

```
Game1/
├── index.html              # 🎯 主入口文件
├── styles.css              # 🎨 游戏样式表
│
├── src/                    # 📁 源代码目录
│   ├── config.js           # ⚙️  游戏配置模块 (常量、参数)
│   ├── data.js             # 📊 游戏数据模块 (草药、任务数据)
│   ├── gameState.js        # 🔧 状态管理模块 (运行时状态)
│   ├── ui.js               # 🖥️  UI管理模块 (HTML交互)
│   ├── GameScene.js        # 🎮 Phaser游戏场景 (核心逻辑)
│   └── main.js             # 🚀 入口模块 (初始化、启动)
│
└── src/assets/             # 🖼️ 资源文件目录
    └── picture/            # 图片资源
```

---

## 模块依赖关系

```
index.html (入口)
    │
    ├── styles.css (样式)
    │
    ├── phaser.min.js (CDN) ← Phaser 引擎
    │
    ├── config.js     ← 无依赖（配置常量）
    │       ↓
    ├── data.js       ← 无依赖（静态数据）
    │       ↓
    ├── gameState.js  ← 依赖 config.js
    │       ↓
    ├── ui.js         ← 依赖 gameState.js, config.js, data.js
    │       ↓
    ├── GameScene.js  ← 依赖 config.js, data.js, gameState.js, ui.js
    │       ↓
    ├── main.js       ← 依赖所有模块
    │       ↓
    └── startLoadingSequence() → 启动游戏
```

---

## 各模块职责说明

### 1. `config.js` - 游戏配置
**职责**: 定义所有游戏常量和可调参数

```javascript
// 主要包含:
window.GameConfig = {
    GAME_WIDTH: 1280,           // 画布宽度
    GAME_HEIGHT: 720,           // 画布高度
    WORLD_WIDTH: 1600,          // 世界宽度
    player: { ... },            // 玩家参数
    herbColors: [...],          // 草药颜色
    rarityColors: {...},        // 稀有度颜色
    timeSystem: {...},          // 时辰系统配置
    herbPositions: [...],       // 草药位置
    obstacles: [...],           // 障碍物
    camera: {...}               // 摄像机设置
};
```

### 2. `data.js` - 游戏数据
**职责**: 定义所有静态游戏数据

```javascript
// 主要包含:
window.GameData = {
    HERBS_DATA: [ ... ],  // 12种草药的详细数据
    TASKS: [ ... ]        // 任务列表
};
```

### 3. `gameState.js` - 状态管理
**职责**: 管理运行时游戏状态，提供状态操作API

```javascript
class GameStateManager {
    addHerbToBackpack(herbId)      // 添加到背包
    getHerbCount(herbId)           // 获取数量
    isHerbUnlocked(herbId)         // 检查解锁状态
    toggleDebugMode()              // 切换调试模式
    serialize() / deserialize()    // 存档功能（预留）
}
window.gameStateManager = new GameStateManager();
```

### 4. `ui.js` - UI 管理
**职责**: 处理所有 HTML DOM 操作

```javascript
class UIManager {
    updateProgress(value, text)    // 加载进度条
    openModal(modalId)             // 打开弹窗
    closeAllModals()               // 关闭所有弹窗
    updateMinimap(x, y)           // 更新小地图
    showCollectPrompt(name)       // 显示采集提示
    updateBackpackUI()            // 更新背包界面
    updateHerbGuideUI()           // 更新图鉴界面
    updateTaskProgress()          // 更新任务进度
    updateDebugInfo(params)       // 更新调试信息
    toggleDebugPanel(show)        // 切换调试面板
}
window.uiManager = new UIManager();
```

### 5. `GameScene.js` - Phaser 场景
**职责**: 核心游戏逻辑

```javascript
class GameScene extends Phaser.Scene {
    preload()                     // 加载资源
    create()                      // 创建游戏对象
    update()                      // 每帧更新
    
    createPlayer()                // 创建玩家
    createHerbs()                 // 创建草药
    createObstacles()             // 创建障碍物
    setupCamera()                 // 配置摄像机
    setupInput()                  // 设置输入控制
    updatePlayerMovement()        // 更新移动
    checkHerbCollection()         // 检测采集
    collectHerb(herb)             // 执行采集
}
```

### 6. `main.js` - 入口模块
**职责**: 初始化和启动游戏

```javascript
initGame()                    // 创建 Phaser.Game 实例
startTimeSystem()             // 启动时辰定时器
startLoadingSequence()        // 启动加载动画序列
```

---

## 开发指南

### 如何添加新草药？

1. 在 **`src/data.js`** 的 `HERBS_DATA` 数组中添加新草药数据
2. 在 **`src/config.js`** 的 `herbPositions` 中添加位置
3. 如果需要新颜色，在 **`config.js`** 的 `herbColors` 中添加

### 如何修改玩家速度？

在 **`src/config.js`** 中修改：
```javascript
player: {
    speed: 160  // 改为其他值
}
```

### 如何添加新的UI组件？

1. 在 **`styles.css`** 中添加样式
2. 在 **`index.html`** 中添加 HTML 结构
3. 在 **`src/ui.js`** 的 `cacheElements()` 和对应方法中添加逻辑

### 如何添加新的游戏场景？

创建新的 Scene 类文件，在 `main.js` 的 `initGame()` 中注册：
```javascript
scene: [GameScene, NewScene]
```

---

## 本地开发

### 使用 Node.js 启动本地服务器：

```bash
cd Game1
npm install
node static-server.js
```

然后访问：http://localhost:3000

### 或直接用浏览器打开

由于使用了 CDN 加载 Phaser，可以直接双击 `index.html` 运行。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Phaser | 3.60.0 | 游戏引擎 |
| JavaScript | ES6+ | 编程语言 |
| CSS3 | - | 样式设计 |
| Google Fonts | - | 字体 |

---

## 重构对比

### 重构前 ❌
- 所有代码在 `index.html` 中（~1280行）
- 难以维护和扩展
- 无法复用代码
- 没有清晰的模块边界

### 重构后 ✅
- 清晰的模块化结构
- 单一职责原则
- 易于扩展和维护
- 完整的类型注释
- 支持未来存档功能（GameState 序列化）
