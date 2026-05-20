# 地图文件说明

## 文件夹结构

将 Tiled 导出的地图 JSON 文件放在此文件夹中：

```
src/maps/
├── map1/
│   ├── map1.json          # Tiled 导出的地图 JSON
│   └── tileset.png        # 地图使用的瓦片图片（如果有）
├── map2/
│   ├── map2.json
│   └── tileset.png
└── README.md
```

## Tiled 地图制作要求

### 1. 图层命名规范

**必须包含以下图层：**

| 图层名称 | 类型 | 说明 |
|---------|------|------|
| `ground` | 瓦片图层 | 地面（草地、道路等），玩家可通行 |
| `collision` | 瓦片图层 | 碰撞层（树木、石头等），阻挡玩家 |
| `objects` | 对象图层 | 可交互对象（草药、NPC等） |

### 2. 对象层属性设置

在对象图层中，为每个对象设置以下自定义属性：

| 属性名 | 类型 | 说明 | 示例 |
|-------|------|------|------|
| `type` | string | 对象类型 | `herb`, `npc`, `portal` |
| `herbId` | string | 草药ID（type=herb时） | `gancao`, `dingxiang` |
| `targetMap` | string | 目标地图（type=portal时） | `village` |
| `targetX` | int | 传送目标X | 100 |
| `targetY` | int | 传送目标Y | 200 |

### 3. 碰撞图层设置

在 Tiled 中为碰撞图层设置 `collides: true` 属性，或使用 Phaser 的碰撞检测。

### 4. 导出设置

导出为 JSON 格式：
- 编码：UTF-8
- 格式：JSON
- 嵌入的图块数据：不嵌入（使用外部瓦片集）
- 保存瓦片图像为 Base64：否

### 5. 地图配置示例

在 `config.js` 中配置：

```javascript
maps: {
    'hanyao': {
        key: 'hanyao',           // Phaser 缓存键名
        jsonPath: 'src/maps/hanyao/hanyao.json',  // JSON 路径
        tileImages: [            // 瓦片图片路径数组
            'src/assets/tileset1.png',
            'src/assets/tileset2.png'
        ],
        playerStart: { x: 400, y: 300 },
        bgm: 'hanyao_bgm.mp3'
    }
}
```

## 快速开始

1. 在 Tiled 中制作地图并导出 JSON
2. 将 JSON 文件和瓦片图片放到 `src/maps/地图名/` 文件夹
3. 在 `config.js` 中添加地图配置
4. 运行游戏即可自动加载

## 注意事项

- 瓦片尺寸建议 32×32 或 64×64
- 确保瓦片图片路径与 Tiled 中的相对路径一致
- 对象图层的坐标是像素坐标，不是瓦片坐标
