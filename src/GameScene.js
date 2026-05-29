/**
 * 游戏场景模块 - GameScene
 * Phaser 游戏核心逻辑
 */
console.log('GameScene.js: script loaded');

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.player = null;
        this.herbs = [];
        this.npcs = [];      // NPC 交互数据：{ name, x, y, w, h, storyIdx }
        this.portals = [];   // 传送门数据：{ sprite, targetMap }
        this.cursors = null;
        this.wasd = null;
        this.eKey = null;
        this.tiledMap = null;

        this.config = window.GameConfig;
        this.gameData = window.GameData;

        this.walkCollisionData = null;
        this.walkCollisionTileWidth = null;
        this.walkCollisionTileHeight = null;
        this._walkColliderBound = false;   // 场景重启时重置

        // NPC/交互物 → 第一章剧情场景索引映射
        // 索引对应 story_chapter1.json.scenes 数组位置
        this._npcStorySceneMap = {
            'woodcutter_npc': 2,       // C03 砍柴老汉问路
            'washerwoman_npc': 4,      // C05 洗衣村妇
            'merchant_npc': 5,         // C06 行商王掌柜
            'abandoned_basket': 3,     // C04 废弃草药篓
            'gancao': 1,               // C02 第一株甘草
            'cuizhu_gate': 6,          // C07 翠竹村牌坊
        };
    }

    /**
     * 判断指定世界坐标是否被行走层阻挡
     */
    isWalkBlockedAtWorldXY(x, y) {
        if (!this.walkCollisionData || !this.walkCollisionTileWidth || !this.walkCollisionTileHeight) {
            return false;
        }

        const tx = Math.floor(x / this.walkCollisionTileWidth);
        const ty = Math.floor(y / this.walkCollisionTileHeight);
        if (tx < 0 || ty < 0 || ty >= this.walkCollisionData.length || tx >= this.walkCollisionData[0].length) {
            return true;
        }
        return this.walkCollisionData[ty][tx] === 1;
    }

    /**
     * 根据当前玩家候选移动速度，应答 x/y 轴的碰撞约束
     */
    applyWalkCollision(vx, vy) {
        if (!this.player || !this.player.body || !this.walkCollisionData) {
            return { vx, vy };
        }

        const body = this.player.body;
        const delta = this.game.loop.delta / 1000;
        const nextX = body.x + vx * delta;
        const nextY = body.y + vy * delta;
        const width = body.width;
        const height = body.height;

        const checkTile = (wx, wy) => this.isWalkBlockedAtWorldXY(wx, wy);

        let canMoveX = true;
        let canMoveY = true;

        if (vx !== 0) {
            const signX = Math.sign(vx);
            const testX = signX > 0 ? nextX + width - 1 : nextX;
            const topY = nextY + 2;
            const bottomY = nextY + height - 2;
            if (checkTile(testX, topY) || checkTile(testX, bottomY)) {
                canMoveX = false;
            }
        }

        if (vy !== 0) {
            const signY = Math.sign(vy);
            const testY = signY > 0 ? nextY + height - 1 : nextY;
            const leftX = nextX + 2;
            const rightX = nextX + width - 2;
            if (checkTile(leftX, testY) || checkTile(rightX, testY)) {
                canMoveY = false;
            }
        }

        if (!canMoveX) vx = 0;
        if (!canMoveY) vy = 0;

        return { vx, vy };
    }

    /**
     * ★ 场景重启时重置状态（Phaser scene.start() 不会调用 constructor）
     */
    init() {
        console.log('GameScene: init() - 重置场景状态');
        this.player = null;
        this.herbs = [];
        this.npcs = [];
        this.portals = [];
        this.cursors = null;
        this.wasd = null;
        this.eKey = null;
        this.tiledMap = null;
        this.walkCollisionData = null;
        this.walkCollisionTileWidth = null;
        this.walkCollisionTileHeight = null;
        this._walkColliderBound = false;
        this._walkColliderRetryEvent = null;
        this.collisionLayer = null;
        this.collisionMap = null;
        this._rawMapJson = null;
        this._shutdownRegistered = false;
        this._gancaoStoryTriggering = false;
        this._gidTextureMap = null;
        this._streamTriggers = [];      // 溪流地图区域触发器
        // _streamTriggered 现在持久化到 window，避免场景重启后丢失
        if (!window._streamTriggered) {
            window._streamTriggered = new Set();
        }
        this._guideOverlay = null;     // C15b后的指引遮罩
        this._guideArrow = null;       // 指引箭头
        this._guideHint = null;        // 指引文字
        this._guideTarget = null;      // 指引目标坐标
        this._guideActive = false;     // 指引是否激活
    }

    /**
     * 预加载资源
     */
    preload() {
        console.log('GameScene: 预加载资源...');

        // ★ 显示转场遮罩，遮住资源加载期间的空白
        if (window.showSceneTransition) window.showSceneTransition();

        // ★ 强制村庄地图标志（双重保险：C08 show_village_map 和翠竹村剧情返回两种来源）
        if (window._forceVillageMap || window._returnToVillageMap) {
            console.log('[GameScene preload] 检测到村庄地图标志，强制使用 village 地图');
            this.config.currentMapId = 'village';
            window._forceVillageMap = false;
            window._returnToVillageMap = false;
        }

        // ★ C15a 结束后返回溪谷地图（非翠竹村）
        if (window._returnToStreamMap) {
            console.log('[GameScene preload] 检测到溪谷地图标志，强制使用 stream 地图');
            this.config.currentMapId = 'stream';
            window._returnToStreamMap = false;
            window._returnToVillageMap = false;  // 清除冲突标志
        }

        // ★ 兜底防护：如果没有有效地图配置，默认使用平原
        if (!this.config.maps[this.config.currentMapId]) {
            console.warn('[GameScene preload] currentMapId 无效(' + this.config.currentMapId + ')，回退到 plain');
            this.config.currentMapId = 'plain';
        }
        
        const mapId = this.config.currentMapId;
        console.log('[GameScene preload] currentMapId =', mapId);
        const mapConfig = this.config.maps[mapId];

        if (mapConfig) {
            // ★ 图片式地图（非 Tilemap）：直接加载背景图片
            if (mapConfig.isImageMap && mapConfig.imagePath) {
                console.log(`[图片地图] 加载图片: ${mapConfig.imagePath}`);
                this.load.image('_image_map_bg', mapConfig.imagePath);
            } else {
                // 清除旧的瓦片纹理缓存
                const maxTilesets = 10;
                for (let i = 0; i < maxTilesets; i++) {
                    const key = `tileset_${i}`;
                    if (this.textures.exists(key)) {
                        this.textures.remove(key);
                        console.log('已清除旧纹理:', key);
                    }
                }

                // ★ 清除旧的碰撞纹理，确保重启时重新生成
                if (this.textures.exists('_collision_tile')) {
                    this.textures.remove('_collision_tile');
                }
                
                // ★ JSON 不在 preload 加载，由 tryLoadMap() 同步 XHR 直接读取最新文件
                
                // 加载瓦片图片
                if (mapConfig.tileImages) {
                    mapConfig.tileImages.forEach((imgPath, index) => {
                        const key = `tileset_${index}`;
                        this.load.image(key, imgPath + '?v=' + Date.now());
                    });
                }
                console.log(`预加载地图: ${mapId} - ${mapConfig.jsonPath}`);
            }
        }

        // ── 清除旧玩家纹理和动画缓存 ──
        if (this.textures.exists('player')) {
            this.textures.remove('player');
        }
        ['walk_down', 'walk_left', 'walk_right', 'walk_up', 'idle'].forEach(k => {
            if (this.anims.exists(k)) this.anims.remove(k);
        });

        // ── 加载新角色精灵表（终稿.png，1920×1920，480px/帧，4×4=16帧）──
        this.load.spritesheet('player', 'src/assets/sprites/player_final.png', {
            frameWidth: 480,
            frameHeight: 480
        });

        // ── 加载草药纹理（按 herbId 查找 assets/pictures/herbs/<id>.png）──
        const herbTextures = [
            { id: 'gancao', file: 'gancao.png' },
            { id: 'jinyinhua', file: 'jinyinhua.png' },
            { id: 'hongjingtian', file: 'hongjingtian.png' },
            { id: 'heshouwu', file: 'heshouwu.png' },
            { id: 'shichangpu', file: '石菖蒲.png' },
            { id: 'fuling', file: '茯苓.png' },
            { id: 'shanyao', file: '山药.png' }
        ];
        herbTextures.forEach(h => {
            this.load.image(`herb_${h.id}`, `src/assets/pictures/herbs/${h.file}`);
        });

        // ── 加载 NPC 纹理 ──
        const npcTextures = ['washerwoman_npc', 'woodcutter_npc', 'merchant_npc'];
        npcTextures.forEach(id => {
            this.load.image(`npc_${id}`, `src/assets/pictures/herbs/${id}.png`);
        });

        // ── 加载交互物纹理 ──
        const objTextures = ['abandoned_basket', 'plain'];
        objTextures.forEach(id => {
            this.load.image(`obj_${id}`, `src/assets/pictures/herbs/${id}.png`);
        });
    }

    /**
     * 创建游戏
     */
    create() {
        console.log('GameScene: 开始创建...');

        // ★ 场景渲染完首帧后隐藏转场遮罩（覆盖图片地图/普通地图所有路径）
        this.events.once(Phaser.Scenes.Events.UPDATE, () => {
            if (window.hideSceneTransition) window.hideSceneTransition();
        });

        // ★ 绑定 AudioManager 到当前 Phaser 场景
        if (window.audioManager) {
            window.audioManager.attachScene(this);
        }

        // ★ 每次创建时重置状态（scene.start 不重置实例属性）
        this._isImageMapMode = false;
        this._imageMapBg = null;
        this._villageHotspots = [];
        // ★ 清除强制标志（防止后续地图切换时残留）
        window._forceVillageMap = false;

        // 生成对象纹理（草药/NPC/传送门图标，替代圆圈）
        this.generateObjectTextures();

        // 加载地图（需要先加载，以便确定世界边界）
        this.tryLoadMap();
        
        // ★ 图片式地图：跳过玩家、碰撞、摄像机跟随等，直接初始化交互UI
        if (this._isImageMapMode) {
            this._ensureMainUI();       // ★ 关键：恢复主UI，隐藏IntroScene的遮罩层
            this._setupImageMapUI();
            this._playMapBGM();         // ★ 村庄地图播放对应 BGM

            // ★ 刷新背包/图鉴/情籍（从剧情返回时可能获得物品）
            if (window.uiManager) {
                window.uiManager.updateBackpackUI();
                window.uiManager.updateHerbGuideUI();
                window.uiManager.updateAttributesUI();
            }

            this._processQuestCompletions(); // ★ 处理待完成的任务
            if (window.uiManager && window.uiManager.refreshQuestPanel) {
                window.uiManager.refreshQuestPanel();
            }
            return;
        }
        
        // 创建玩家
        this.createPlayer();
        console.log('玩家创建后，准备绑定碰撞', {
            hasPlayer: !!this.player,
            hasBody: !!(this.player && this.player.body),
            bodySize: this.player && this.player.body ? { width: this.player.body.width, height: this.player.body.height } : null,
            bodyOffset: this.player && this.player.body ? { x: this.player.body.offset.x, y: this.player.body.offset.y } : null
        });

        // 玩家创建后，绑定行走层碰撞（仅 initTiledMap/Phaser缓存路径）
        this.bindWalkCollider();
        
        // 如果没地图，用默认
        if (!this.tiledMap) {
            console.log('使用默认地图设置');
            this.physics.world.setBounds(0, 0, this.config.WORLD_WIDTH, this.config.WORLD_HEIGHT);
            this.createHerbs();
        }
        
        // 设置玩家初始位置（优先使用剧情返回位置）
        const mapConfig = this.config.maps[this.config.currentMapId];
        const returnPos = window._returnPlayerPos;
        if (returnPos && returnPos.mapId === this.config.currentMapId && this.player) {
            this.player.x = returnPos.x;
            this.player.y = returnPos.y;
            window._returnPlayerPos = null;  // 仅用一次，用完清除
            console.log('玩家位置恢复:', this.player.x, this.player.y);
        } else if (mapConfig && mapConfig.playerStart && this.player) {
            this.player.x = mapConfig.playerStart.x;
            this.player.y = mapConfig.playerStart.y;
            console.log('玩家初始位置:', this.player.x, this.player.y);
        }
        
        // ★ 流地图区域触发器（剧情 C15b / C15c / C15d）
        if (this.config.currentMapId === 'stream') {
            this._streamTriggers = [
                {
                    id: 'c15b',
                    x: 1050, y: 850, w: 800, h: 600,   // 桥右侧大范围 → C15b
                    sceneIdx: 15,
                    require: null
                },
                {
                    id: 'c15c',
                    x: 500, y: 850, w: 500, h: 450,    // 桥左侧靠近石菖蒲 → C15c
                    sceneIdx: 16,
                    require: 'c15b'
                },
                {
                    id: 'c15d',
                    x: 50, y: 850, w: 100, h: 600,     // 道路尽头 → C15d
                    sceneIdx: 17,
                    require: 'c15c'
                }
            ];
            this._streamTriggered = window._streamTriggered;

            console.log('流地图区域触发器已设置:', this._streamTriggers.length, '个区域');

            // ★ C15b 剧情返回后激活过桥指引
            if (window._streamGuideActive) {
                this.time.delayedCall(200, () => this._setupGuideOverlay());
            }
        }
        
        // 摄像机
        this.setupCamera();
        
        // 输入
        this.setupInput();
        
        // UI — 更新内容
        window.uiManager.updateBackpackUI();
        window.uiManager.updateHerbGuideUI();
        window.uiManager.updateMinimapTitle();

        // ★ 确保主页面所有UI面板可见（防御性措施：即使IntroScene未正确恢复，此处保证显示）
        this._ensureMainUI();

        // 生成小地图缩略图并初始化玩家位置
        this.generateMinimap();
        if (this.player) {
            window.uiManager.updateMinimap(this.player.x, this.player.y);
        }

        console.log('GameScene: 创建完成');

        // ★ 根据当前地图播放对应 BGM
        this._playMapBGM();

        // ★ 处理待完成的任务（从剧情/事件返回时）
        this._processQuestCompletions();

        // ★ 刷新任务面板 UI
        if (window.uiManager && window.uiManager.refreshQuestPanel) {
            window.uiManager.refreshQuestPanel();
        }

        // ★ 注册 shutdown 事件处理器：当 GameScene 被停止时（如进入剧情），确保下次重启时状态正确
        if (!this._shutdownRegistered) {
            this.events.on('shutdown', () => {
                console.log('GameScene: shutdown 事件触发，清理场景...');
                // ★ 释放键盘输入，防止按键状态残留
                if (this.input && this.input.keyboard) {
                    this.input.keyboard.enabled = false;
                }
                // 停止重试定时器
                if (this._walkColliderRetryEvent) {
                    this._walkColliderRetryEvent.remove(false);
                    this._walkColliderRetryEvent = null;
                }
            });
            this._shutdownRegistered = true;
        }
    }

    /**
     * ★ 确保主页面所有UI面板可见（防御性措施）
     * 当从剧情场景返回到主游戏场景时，确保所有HUD元素正确显示
     */
    _ensureMainUI() {
        try {
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.style.display = 'block';  // CSS 默认 display:none，必须显式设 block
            }

            // ★ 确保 Phaser canvas 可以接收键盘焦点（修复从剧情返回后按键失效的问题）
            if (this.game && this.game.canvas) {
                this.game.canvas.focus();
            }

            // 确保所有永久HUD面板可见
            const uiElements = [
                'top-left-panel',     // 左上角：小地图 + 时间日期
                'task-panel',         // 任务栏
                'top-right-buttons',  // 顶部右侧功能按钮
                'controls-hint',      // 底部操作提示
                'debug-panel',        // 调试面板
                'modal-overlay'       // 模态框遮罩
            ];

            uiElements.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.display = '';
                }
            });

            // ★ 清除 modal-overlay 的 active 状态，防止遮罩层残留导致画面变暗
            // （场景切换时如果 overlay 残留 active class，会显示半透明黑色遮罩遮挡画面）
            const overlay = document.getElementById('modal-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
        } catch (e) {
            console.warn('GameScene: _ensureMainUI 失败:', e.message);
        }
    }

    /**
     * 尝试加载 Tiled 地图
     * ★ 始终使用同步 XHR 直接从磁盘读取，绝对不走任何缓存
     */
    tryLoadMap() {
        const mapId = this.config.currentMapId;
        const mapConfig = this.config.maps[mapId];

        if (!mapConfig) {
            console.warn('未找到地图配置');
            return;
        }

        // ★ 图片式地图：走图片渲染路径
        if (mapConfig.isImageMap) {
            this._isImageMapMode = true;
            this._initImageMap(mapConfig);
            return;
        }

        // ★ 非图片式地图：重置标志
        this._isImageMapMode = false;

        // ★ 始终同步 XHR 直接读取磁盘，URL 加随机参数确保绕过所有缓存层
        console.log('tryLoadMap: 同步 XHR 强制读取最新 JSON...');
        try {
            const xhr = new XMLHttpRequest();
            const cacheBuster = '_=' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
            xhr.open('GET', mapConfig.jsonPath + '?' + cacheBuster, false);
            xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            xhr.send(null);
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                this._rawMapJson = data;
                const objLayer = data.layers.find(l => l.type === 'objectgroup');
                console.log('tryLoadMap: JSON 加载成功, 对象层',
                    objLayer ? objLayer.objects.length + '个对象' : '无',
                    objLayer ? JSON.stringify(objLayer.objects.map(o => ({name:o.name, x:Math.round(o.x), y:Math.round(o.y)}))) : '');
                this.initTiledMap();
                return;
            }
        } catch (e) {
            console.error('同步 XHR 失败:', e.message);
        }

        this.showError('地图加载失败');
        this.tiledMap = null;
    }

    /**
     * 备用加载地图 JSON（Fetch 回退）
     */
    loadMapFallback(mapConfig) {
        console.warn('地图 JSON 未加载，尝试备用加载...');
        fetch(mapConfig.jsonPath + '?v=' + Date.now(), { cache: 'no-cache' })
            .then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(data => {
                console.log('fetch 加载成功，手动创建地图...');
                this._rawMapJson = data;
                this.initTiledMap();
            })
            .catch(err => {
                console.error('fetch 加载失败:', err);
                this.showError('地图加载失败: ' + err.message);
                this.tiledMap = null;
            });
    }

    /**
     * 解析 tileset source 路径，优先提取实际可访问的 src/ 路径
     */
    resolveTilesetSourcePath(source, mapJsonPath) {
        if (!source) {
            return null;
        }
        const normalized = source.replace(/\\/g, '/');
        const srcMatch = normalized.match(/(src\/.*)$/);
        if (srcMatch) {
            return srcMatch[1];
        }
        if (!mapJsonPath) {
            return normalized;
        }
        const mapDir = mapJsonPath.replace(/\\/g, '/').replace(/\/[^/]*$/, '/');
        const combined = `${mapDir}${normalized}`;
        const segments = combined.split('/');
        const resolved = [];
        for (const segment of segments) {
            if (segment === '' || segment === '.') {
                continue;
            }
            if (segment === '..') {
                resolved.pop();
            } else {
                resolved.push(segment);
            }
        }
        return resolved.join('/');
    }

    /**
     * 从 TSX 文件中读取 tilewidth/tileheight 和 image source 元数据
     */
    loadTilesetMetadataFromTsx(tsxPath) {
        try {
            const xhr = new XMLHttpRequest();
            const requestPath = encodeURI(tsxPath) + '?_=' + Date.now();
            xhr.open('GET', requestPath, false);
            xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            xhr.send(null);
            if (xhr.status !== 200) {
                console.warn('TSX 读取失败:', tsxPath, 'status=', xhr.status);
                return null;
            }
            const text = xhr.responseText;
            const tilesetMatch = text.match(/<tileset[^>]*tilewidth="(\d+)"[^>]*tileheight="(\d+)"/i);
            const imageMatch = text.match(/<image[^>]*source="([^"]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"/i);
            const metadata = {};
            if (tilesetMatch) {
                metadata.tileWidth = parseInt(tilesetMatch[1], 10);
                metadata.tileHeight = parseInt(tilesetMatch[2], 10);
            }
            if (imageMatch) {
                metadata.imageSource = imageMatch[1];
                if (!metadata.tileWidth) {
                    metadata.tileWidth = parseInt(imageMatch[2], 10);
                }
                if (!metadata.tileHeight) {
                    metadata.tileHeight = parseInt(imageMatch[3], 10);
                }
            }
            if (Object.keys(metadata).length > 0) {
                return metadata;
            }
            console.warn('TSX metadata 未找到 tilewidth/tileheight 或 image source:', tsxPath);
        } catch (error) {
            console.warn('loadTilesetMetadataFromTsx 错误:', error.message, tsxPath);
        }
        return null;
    }

    getTilesetMetadata(tsInfo, mapConfig) {
        if (!tsInfo || !tsInfo.source || !mapConfig) {
            return null;
        }
        const sourcePath = this.resolveTilesetSourcePath(tsInfo.source, mapConfig.jsonPath);
        if (!sourcePath) {
            return null;
        }
        return this.loadTilesetMetadataFromTsx(sourcePath);
    }

    getTilesetImageBase(tsInfo, mapConfig) {
        const metadata = this.getTilesetMetadata(tsInfo, mapConfig);
        if (metadata && metadata.imageSource) {
            return metadata.imageSource.split('/').pop().replace(/\.[^.]+$/, '');
        }
        return null;
    }

    /**
     * 获取 tileset 的真实瓦片尺寸，优先使用 TSX 元数据
     */
    getTilesetTileSize(tsInfo, mapConfig) {
        if (!tsInfo || !mapConfig) {
            return null;
        }

        if (tsInfo.tilewidth && tsInfo.tileheight) {
            return {
                tileWidth: tsInfo.tilewidth,
                tileHeight: tsInfo.tileheight
            };
        }

        if (tsInfo.source) {
            const sourcePath = this.resolveTilesetSourcePath(tsInfo.source, mapConfig.jsonPath);
            if (sourcePath) {
                const metadata = this.loadTilesetMetadataFromTsx(sourcePath);
                if (metadata) {
                    return metadata;
                }
            }
        }

        return null;
    }

    /**
     * 从 JSON 数据手动创建地图
     */
    createMapFromData(mapData, mapConfig) {
        try {
            console.log('===== 手动创建地图 =====');
            console.log('地图尺寸:', mapData.width, 'x', mapData.height);
            console.log('瓦片尺寸:', mapData.tilewidth, 'x', mapData.tileheight);
            
            // 1. 手动创建 tilemap
            this.tiledMap = this.make.tilemap({
                tileWidth: mapData.tilewidth || 16,
                tileHeight: mapData.tileheight || 16,
                width: mapData.width,
                height: mapData.height
            });
            
            if (!this.tiledMap) {
                throw new Error('make.tilemap 返回 null');
            }
            
            console.log('Tilemap 手动创建成功');
            
            // 2. 添加瓦片集图片
            const loadedTilesets = [];

            if (mapConfig.tileImages && Array.isArray(mapConfig.tileImages)) {
                mapConfig.tileImages.forEach((imgPath, index) => {
                    const key = `tileset_${index}`;
                    if (!this.textures.exists(key)) {
                        console.warn('  ✗ 纹理不存在:', key);
                        return;
                    }

                    const base = imgPath.split('/').pop().replace(/\.[^.]+$/, '');
                    const tsInfo = (mapData.tilesets || []).find(ts => {
                        if (!ts) return false;
                        const srcBase = ts.source ? ts.source.split('/').pop().replace(/\.[^.]+$/, '') : '';
                        if (ts.name === base || srcBase === base) {
                            return true;
                        }
                        const tsImageBase = this.getTilesetImageBase(ts, mapConfig);
                        return tsImageBase === base;
                    });

                    if (!tsInfo) {
                        console.warn(`  ✗ 未找到 tileset 匹配: ${base}，已跳过该 tileImages 入口`);
                        return;
                    }

                    const firstgid = tsInfo.firstgid;
                    let tsName = `tileset_${index}`;
                    if (tsInfo.name) {
                        tsName = tsInfo.name;
                    } else if (tsInfo.source) {
                        tsName = tsInfo.source.split('/').pop().replace(/\.[^.]+$/, '');
                    }

                    const tileSize = this.getTilesetTileSize(tsInfo, mapConfig) || {
                        tileWidth: this.tiledMap.tileWidth,
                        tileHeight: this.tiledMap.tileHeight
                    };

                    console.log(`手动模式: 关联 ${tsName} -> ${key}, firstgid=${firstgid}, tileSize=${tileSize.tileWidth}x${tileSize.tileHeight}`);
                    const ts = this.tiledMap.addTilesetImage(
                        tsName,
                        key,
                        tileSize.tileWidth,
                        tileSize.tileHeight,
                        0,
                        0,
                        firstgid
                    );

                    if (ts) {
                        loadedTilesets.push(ts);
                        console.log('  ✓ 成功, tileCount=' + (ts.total || 'unknown'));
                    } else {
                        console.warn('  ✗ addTilesetImage 失败:', tsName, key);
                    }
                });
            }
            
            if (loadedTilesets.length !== (mapConfig.tileImages ? mapConfig.tileImages.length : 0)) {
                console.warn('瓦片集加载数量与配置不一致:', loadedTilesets.length, 'vs', mapConfig.tileImages ? mapConfig.tileImages.length : 0);
            }
            console.log('成功加载瓦片集数量:', loadedTilesets.length);
            
            // ★ 构建 gid → 纹理key 映射（用于渲染 objects 层中没有 type 的装饰物，如土坑）
            this._gidTextureMap = {};
            if (mapConfig.tileImages && mapData.tilesets) {
                mapConfig.tileImages.forEach((imgPath, index) => {
                    const key = `tileset_${index}`;
                    const base = imgPath.split('/').pop().replace(/\.[^.]+$/, '');
                    const tsEntry = (mapData.tilesets || []).find(ts => {
                        if (!ts) return false;
                        const srcBase = ts.source ? ts.source.split('/').pop().replace(/\.[^.]+$/, '') : '';
                        if (ts.name === base || srcBase === base) return true;
                        const tsImageBase = this.getTilesetImageBase(ts, mapConfig);
                        return tsImageBase === base;
                    });
                    if (tsEntry && tsEntry.firstgid) {
                        this._gidTextureMap[tsEntry.firstgid] = key;
                        console.log(`  gidMap: ${tsEntry.firstgid} → ${key} (${base})`);
                    }
                });
            }
            
            // 3. 创建图层
            if (mapData.layers) {
                let layerCount = 0;

                // 找到行走层索引，用于把它对齐到深度 0，保持其它图层相对顺序
                const walkLayerIndex = mapData.layers.findIndex(l => l.name === '行走层' || (typeof l.name === 'string' && /行走层/i.test(l.name)) || (typeof l.name === 'string' && /walk/i.test(l.name)));
                const depthShift = walkLayerIndex >= 0 ? -walkLayerIndex : 0;

                mapData.layers.forEach((layer, index) => {
                    console.log(`图层[${index}]:`, layer.name, '类型:', layer.type);

                    if (layer.type === 'tilelayer' && layer.data) {
                        const layerName = layer.name || 'Layer_' + index;
                        const tileLayer = loadedTilesets.length > 0 
                            ? this.tiledMap.createBlankLayer(layerName, loadedTilesets, 0, 0, layer.width, layer.height, this.tiledMap.tileWidth, this.tiledMap.tileHeight)
                            : null;

                        if (tileLayer) {
                            const depth = index + depthShift;
                            tileLayer.setDepth(depth);
                            const visible = layer.visible !== false || (Array.isArray(layer.data) && layer.data.some(gid => gid > 0));
                            tileLayer.setVisible(visible);
                            tileLayer.setAlpha(typeof layer.opacity === 'number' ? layer.opacity : 1);

                            const dataLen = layer.data.length;
                            const expectedLen = layer.width * layer.height;
                            if (dataLen !== expectedLen) {
                                console.warn('图层数据长度不匹配:', dataLen, '!=', expectedLen);
                            }

                            const rows = [];
                            for (let y = 0; y < layer.height; y++) {
                                const row = layer.data.slice(y * layer.width, (y + 1) * layer.width);
                                if (row.length < layer.width) {
                                    row.push(...Array(layer.width - row.length).fill(0));
                                }
                                rows.push(row);
                            }

                            try {
                                tileLayer.putTilesAt(rows, 0, 0);
                            } catch (e) {
                                console.warn('tileLayer.putTilesAt 失败，回退到逐瓦片填充:', e.message);
                                for (let y = 0; y < layer.height; y++) {
                                    for (let x = 0; x < layer.width; x++) {
                                        const idx = y * layer.width + x;
                                        const gid = idx < dataLen ? layer.data[idx] : 0;
                                        if (gid > 0) {
                                            try {
                                                tileLayer.putTileAt(gid, x, y);
                                            } catch (innerErr) {
                                                // 忽略单个瓦片放置错误
                                            }
                                        }
                                    }
                                }
                            }
                            
                            layerCount++;
                            console.log('✓ 图层创建成功:', layerName, '瓦片数:', dataLen, '深度:', depth);
                        } else {
                            console.warn('✗ createBlankLayer 失败:', layerName);
                        }
                    }
                });
                
                console.log(`成功创建 ${layerCount} 个图层`);
                
                // 加载对象层
                mapData.layers.forEach(layer => {
                    if (layer.type === 'objectgroup' && layer.objects) {
                        this.loadObjects(layer);
                    }
                });
            }
            
            // 4. 设置世界边界
            const w = this.tiledMap.widthInPixels;
            const h = this.tiledMap.heightInPixels;
            this.physics.world.setBounds(0, 0, w, h);
            this.cameras.main.setBounds(0, 0, w, h);
            
            console.log(`===== 手动地图创建完成: ${w} x ${h} =====`);

            // 保存地图实际尺寸供小地图使用
            this.config.currentMapWidth = w;
            this.config.currentMapHeight = h;

            // 设置背景色
            this.cameras.main.setBackgroundColor('#1a3a0a');

            // 生成小地图缩略图（异步加载完成后）
            this.generateMinimap();

            // 保存地图 JSON 供 setupWalkCollision 使用
            this._rawMapJson = mapData;

            // 设置行走层碰撞
            this.setupWalkCollision();
            // 绑定碰撞（fetch异步回调此时玩家已创建）
            this.bindWalkCollider();
            console.log('createMapFromData: 已调用 setupWalkCollision 和 bindWalkCollider', {
                hasCollisionLayer: !!this.collisionLayer,
                bindStatus: this._walkColliderBound
            });

        } catch (e) {
            console.error('===== 手动创建地图失败 =====');
            console.error(e);
            this.showError('地图创建失败: ' + e.message);
            this.tiledMap = null;
        }
    }

    /**
     * 从缓存 tilemap 直接创建地图，优先使用 Phaser 内置解析而非手动填充。
     */
    createMapFromCachedTilemap(mapConfig) {
        try {
            // ★ 使用 _rawMapJson 直接创建，不再依赖预加载的 'gameMap' key
            const map = this.make.tilemap({ data: this._rawMapJson });
            if (!map) {
                throw new Error('make.tilemap(data) 返回 null');
            }

            this.tiledMap = map;
            // _rawMapJson 已由 tryLoadMap() 设置，不再从缓存读取
            console.log('✅ 缓存 tilemap 创建成功，图层:', map.layers.map(l => l.name).join(', '));

            const loadedTilesets = [];
            const mapData = this._rawMapJson;
            if (mapConfig.tileImages) {
                mapConfig.tileImages.forEach((imgPath, index) => {
                    const key = `tileset_${index}`;
                    if (!this.textures.exists(key)) {
                        console.warn('  ✗ 纹理不存在:', key);
                        return;
                    }

                    const base = imgPath.split('/').pop().replace(/\.[^.]+$/, '');
                    const tsInfo = (mapData.tilesets || []).find(ts => {
                        if (!ts) return false;
                        const srcBase = ts.source ? ts.source.split('/').pop().replace(/\.[^.]+$/, '') : '';
                        if (ts.name === base || srcBase === base) {
                            return true;
                        }
                        const tsImageBase = this.getTilesetImageBase(ts, mapConfig);
                        return tsImageBase === base;
                    });

                    if (!tsInfo) {
                        console.warn(`  ✗ 未找到 tileset 匹配: ${base}，已跳过该 tileImages 入口`);
                        return;
                    }

                    const firstgid = tsInfo.firstgid;
                    let tsName = `tileset_${index}`;
                    if (tsInfo.name) {
                        tsName = tsInfo.name;
                    } else if (tsInfo.source) {
                        const fileName = tsInfo.source.split('/').pop();
                        tsName = fileName ? fileName.replace(/\.[^.]+$/, '') : tsName;
                    }

                    const tileSize = this.getTilesetTileSize(tsInfo, mapConfig) || {
                        tileWidth: map.tileWidth,
                        tileHeight: map.tileHeight
                    };
                    console.log(`加载缓存 tilemap 瓦片集: ${tsName} -> ${key}, firstgid=${firstgid}, tileSize=${tileSize.tileWidth}x${tileSize.tileHeight}`);
                    const ts = map.addTilesetImage(
                        tsName,
                        key,
                        tileSize.tileWidth,
                        tileSize.tileHeight,
                        0,
                        0,
                        firstgid
                    );
                    if (ts) {
                        loadedTilesets.push(ts);
                    } else {
                        console.warn('  ✗ addTilesetImage 失败:', tsName, key);
                    }
                });
            }

            if (loadedTilesets.length === 0) {
                throw new Error('未能加载任何 tileset');
            }

            // ★ 构建 gid → 纹理key 映射（用于渲染 objects 层中没有 type 的装饰物，如土坑）
            this._gidTextureMap = {};
            if (mapConfig.tileImages && mapData.tilesets) {
                mapConfig.tileImages.forEach((imgPath, index) => {
                    const key = `tileset_${index}`;
                    const base = imgPath.split('/').pop().replace(/\.[^.]+$/, '');
                    const tsEntry = (mapData.tilesets || []).find(ts => {
                        if (!ts) return false;
                        const srcBase = ts.source ? ts.source.split('/').pop().replace(/\.[^.]+$/, '') : '';
                        if (ts.name === base || srcBase === base) return true;
                        const tsImageBase = this.getTilesetImageBase(ts, mapConfig);
                        return tsImageBase === base;
                    });
                    if (tsEntry && tsEntry.firstgid) {
                        this._gidTextureMap[tsEntry.firstgid] = key;
                    }
                });
            }

            let layerCount = 0;

            // 计算行走层索引并做深度偏移，使行走层在深度 0
            const walkLayerIndexCached = map.layers.findIndex(l => l.name === '行走层' || (typeof l.name === 'string' && /行走层/i.test(l.name)) || (typeof l.name === 'string' && /walk/i.test(l.name)));
            const depthShiftCached = walkLayerIndexCached >= 0 ? -walkLayerIndexCached : 0;

            map.layers.forEach((layer, index) => {
                if (layer.type === 'tilelayer') {
                    const tileLayer = map.createLayer(layer.name, loadedTilesets, 0, 0);
                    if (!tileLayer) {
                        console.warn('✗ createLayer 失败:', layer.name);
                        return;
                    }
                    const rawLayer = this._rawMapJson && this._rawMapJson.layers
                        ? this._rawMapJson.layers.find(l => l.name === layer.name)
                        : null;
                    const visible = rawLayer
                        ? (rawLayer.visible !== false || (Array.isArray(rawLayer.data) && rawLayer.data.some(gid => gid > 0)))
                        : (layer.visible !== false);
                    const depth = index + depthShiftCached;
                    tileLayer.setDepth(depth);
                    tileLayer.setVisible(visible);
                    tileLayer.setAlpha(typeof layer.opacity === 'number' ? layer.opacity : 1);
                    layerCount++;
                    console.log('✓ createLayer:', layer.name, 'index:', index, 'depth:', depth);
                }
            });

            console.log(`成功创建缓存 tilemap 图层: ${layerCount}`);

            map.layers.forEach(layer => {
                if (layer.type === 'objectgroup' && layer.objects) {
                    this.loadObjects(layer);
                }
            });

            const w = map.widthInPixels;
            const h = map.heightInPixels;
            this.physics.world.setBounds(0, 0, w, h);
            this.cameras.main.setBounds(0, 0, w, h);
            this.config.currentMapWidth = w;
            this.config.currentMapHeight = h;
            this.cameras.main.setBackgroundColor('#1a3a0a');
            this.generateMinimap();
            this.setupWalkCollision();
            this.bindWalkCollider();
            console.log('createMapFromCachedTilemap: 已调用 setupWalkCollision 和 bindWalkCollider');
        } catch (e) {
            console.warn('缓存 tilemap 创建失败，回退到手动创建:', e.message);
            if (this._rawMapJson) {
                this.createMapFromData(this._rawMapJson, mapConfig);
            } else {
                this.showError('无法创建地图: JSON 数据不可用');
            }
        }
    }
    
    /**
     * 显示错误信息到游戏画面
     */
    showError(msg) {
        console.error(msg);
        this.add.text(this.config.GAME_WIDTH / 2, this.config.GAME_HEIGHT / 2, msg, {
            fontSize: '20px',
            color: '#ff4444',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
    }

    /**
     * 初始化 Tiled 地图
     */
    initTiledMap() {
        const mapId = this.config.currentMapId;
        const mapConfig = this.config.maps[mapId];

        if (!mapConfig) {
            console.warn('未找到地图配置');
            return;
        }

        try {
            console.log('===== 初始化 Tiled 地图 =====');

            // 0. 使用 tryLoadMap() 已经通过 XHR 加载的 JSON 数据
            if (!this._rawMapJson) {
                console.warn('_rawMapJson 为空，尝试备用加载...');
                this.loadMapFallback(mapConfig);
                return;
            }
            console.log('✅ _rawMapJson 已获取，图层:', this._rawMapJson.layers.map(l => l.name).join(', '));

            const hasExternalTileset = Array.isArray(this._rawMapJson.tilesets) && this._rawMapJson.tilesets.some(ts => ts && ts.source);
            if (hasExternalTileset) {
                console.warn('检测到外部 tileset，使用手动 mapData 创建路径');
                this.createMapFromData(this._rawMapJson, mapConfig);
            } else {
                // 1. 尝试使用缓存 tilemap 创建地图，避免手动空层填充错误
                this.createMapFromCachedTilemap(mapConfig);
            }

        } catch (e) {
            console.error('===== 地图初始化失败 =====');
            console.error(e);
            this.showError('地图初始化失败: ' + e.message);
            this.tiledMap = null;
        }
    }

    /**
     * 根据"行走层"设置碰撞
     * 行走层有瓦片 = 玩家可走，无瓦片 = 阻挡
     * 创建反向碰撞层：在行走层为空的位置放置碰撞瓦片
     * 读取 this._rawMapJson（由 initTiledMap / createMapFromData 在调用前存入）
     */
    setupWalkCollision() {
        console.log('🔍 setupWalkCollision 被调用', {
            hasTiledMap: !!this.tiledMap,
            hasCachedRaw: !!this._rawMapJson
        });

        if (!this.tiledMap) {
            console.warn('❌ setupWalkCollision: no tiledMap');
            return;
        }

        const rawJson = this._rawMapJson;
        if (!rawJson) {
            console.warn('❌ 未找到地图JSON缓存（this._rawMapJson 为空），跳过碰撞');
            return;
        }

        // 列出所有图层名，方便调试
        console.log('📋 地图图层:', rawJson.layers.map(l => `"${l.name}"(${l.type})`).join(', '));

        const walkLayer = rawJson.layers.find(l => l.name === '行走层')
            || rawJson.layers.find(l => typeof l.name === 'string' && /行走层/i.test(l.name))
            || rawJson.layers.find(l => typeof l.name === 'string' && /walk/i.test(l.name));

        if (!walkLayer || !Array.isArray(walkLayer.data)) {
            console.warn('❌ 未找到有效的行走层，跳过碰撞。已检查图层:',
                rawJson.layers.map(l => `"${l.name}"(${l.type})`).join(', ')
            );
            return;
        }

        const data = walkLayer.data;
        const mapW = this.tiledMap.width;
        const mapH = this.tiledMap.height;
        const tileW = this.tiledMap.tileWidth;
        const tileH = this.tiledMap.tileHeight;

        if (data.length !== mapW * mapH) {
            console.warn('行走层数据长度与地图尺寸不匹配:', data.length, '!=', mapW * mapH,
                `layerWidth=${walkLayer.width}, layerHeight=${walkLayer.height}`);
        }

        const collisionData = [];
        let blocked = 0;
        for (let y = 0; y < mapH; y++) {
            const row = [];
            for (let x = 0; x < mapW; x++) {
                const idx = y * mapW + x;
                const gid = idx < data.length ? data[idx] : 0;
                const v = (gid === 0 || gid === undefined) ? 1 : 0;
                row.push(v);
                if (v === 1) blocked++;
            }
            collisionData.push(row);
        }
        this.walkCollisionData = collisionData;
        this.walkCollisionTileWidth = tileW;
        this.walkCollisionTileHeight = tileH;
        console.log(`行走层碰撞: ${blocked}/${mapW * mapH} 阻挡瓦片 (${((blocked / (mapW * mapH)) * 100).toFixed(1)}%)`);

        if (!this.textures.exists('_collision_tile')) {
            const gfx = this.make.graphics({ add: false });
            gfx.fillStyle(0xff0000, 1);
            gfx.fillRect(0, 0, tileW, tileH);
            gfx.generateTexture('_collision_tile', tileW, tileH);
            gfx.destroy();
        }

        this.collisionMap = this.make.tilemap({
            data: collisionData,
            tileWidth: tileW,
            tileHeight: tileH,
            width: mapW,
            height: mapH
        });

        const ts = this.collisionMap.addTilesetImage(
            '_collision_tile',
            '_collision_tile',
            tileW,
            tileH,
            0,
            0,
            1
        );

        this.collisionLayer = this.collisionMap.createLayer(0, ts, 0, 0);
        if (this.collisionLayer) {
            const usedIndexes = new Set();
            this.collisionLayer.layer.data.forEach(row => {
                row.forEach(tile => {
                    if (tile && tile.index > 0) {
                        usedIndexes.add(tile.index);
                    }
                });
            });

            const collisionIndexes = [...usedIndexes].sort((a, b) => a - b);
            if (collisionIndexes.length > 0) {
                this.collisionLayer.setCollision(collisionIndexes, true, true);
                this.collisionLayer.setCollisionBetween(collisionIndexes[0], collisionIndexes[collisionIndexes.length - 1], true, true);
                console.log('collisionLayer setCollision indexes:', collisionIndexes);
            } else {
                this.collisionLayer.setCollision(1, true, true);
                this.collisionLayer.setCollisionBetween(1, 1, true, true);
                console.log('collisionLayer setCollision default: [1]');
            }

            this.collisionLayer.setCollisionByExclusion([-1], true, true);
            this.collisionLayer.setVisible(false);

            const collisionTiles = this.collisionLayer.layer.data.reduce((sum, row) => {
                return sum + row.filter(tile => tile && tile.index > 0).length;
            }, 0);
            console.log('collisionLayer 已创建，碰撞瓦片数量:', collisionTiles);

            console.log('行走层碰撞层创建完成，等待 bindWalkCollider() 绑定');
        } else {
            console.warn('❌ 无法创建 collisionLayer');
        }
    }

    /**
     * 绑定行走层碰撞器（防重复，只绑一次）
     */
    bindWalkCollider() {
        if (this._walkColliderBound) return;
        console.log('bindWalkCollider: 尝试绑定', {
            hasLayer: !!this.collisionLayer,
            hasPlayer: !!this.player,
            hasBody: !!(this.player && this.player.body)
        });
        if (!this.collisionLayer || !this.player || !this.player.body) {
            console.warn('bindWalkCollider: 条件未满足（collisionLayer/player/body）', {
                hasLayer: !!this.collisionLayer,
                hasPlayer: !!this.player,
                hasBody: !!(this.player && this.player.body)
            });
            if (!this._walkColliderRetryEvent) {
                this._walkColliderRetryEvent = this.time.addEvent({
                    delay: 100,
                    callback: this.bindWalkCollider,
                    callbackScope: this,
                    loop: true
                });
            }
            return;
        }
        if (this.collisionLayer.setCollisionBetween) {
            this.collisionLayer.setCollisionBetween(1, 1, true, true);
            console.log('collisionLayer.setCollisionBetween(1,1) 已调用');
        }
        const colliderCallback = window.gameStateManager && window.gameStateManager.state.debugMode
            ? () => console.log('walk tile collision callback触发')
            : null;
        this.physics.add.collider(this.player, this.collisionLayer, colliderCallback, null, this);
        this._walkColliderBound = true;
        if (this._walkColliderRetryEvent) {
            this._walkColliderRetryEvent.remove(false);
            this._walkColliderRetryEvent = null;
        }

        const playerTile = this.collisionLayer.getTileAtWorldXY(this.player.x, this.player.y, true);
        console.log('✅ 行走层碰撞已绑定', {
            layerType: this.collisionLayer.constructor.name,
            tilemapLayer: !!this.collisionLayer.layer,
            tileCount: this.collisionLayer.layer ? this.collisionLayer.layer.data.reduce((sum,row) => sum + row.filter(tile => tile && tile.index > 0).length, 0) : 0,
            playerTileIndex: playerTile ? playerTile.index : null,
            playerTileHasCollision: playerTile ? (playerTile.collideUp || playerTile.collideDown || playerTile.collideLeft || playerTile.collideRight) : false
        });
    }

    /**
     * 加载对象
     */
    loadObjects(layer) {
        if (!layer.objects) return;
        console.log('对象层:', layer.name, layer.objects.length, '个对象');
        
        // ★ 应用图层的 offsetx/offsety 偏移（Tiled 中设置的视觉偏移，修复错位问题）
        const offsetX = layer.offsetx || 0;
        const offsetY = layer.offsety || 0;
        if (offsetX !== 0 || offsetY !== 0) {
            console.log(`  图层偏移: offsetx=${offsetX}, offsety=${offsetY}`);
        }
        
        layer.objects.forEach(obj => {
            const type = (obj.type || obj.class || '').toLowerCase();
            
            if (type === 'herb') {
                this.createHerb(obj, offsetX, offsetY);
            } else if (type === 'herbs') {
                // 地图中 type="herbs" 的实际是剧情触发甘草（非采集）
                this.createStoryHerb(obj, offsetX, offsetY);
            } else if (type === 'portal') {
                // ★ 翠竹村牌坊：触发剧情 C07，而非传送
                if (obj.name && obj.name.includes('翠竹村')) {
                    console.log(`翠竹村牌坊 → 剧情触发模式`);
                    this.createNPC(obj, offsetX, offsetY);  // 复用 NPC 创建逻辑
                } else {
                    this.createPortal(obj, offsetX, offsetY);
                }
            } else if (type === 'npc') {
                this.createNPC(obj, offsetX, offsetY);
            } else if (type === 'object') {
                // 交互物（废弃药篓等），直接复用 createNPC 的交互逻辑
                this.createNPC(obj, offsetX, offsetY);
            } else if (obj.gid) {
                // 只有 gid 没有 type 的装饰物（如土坑），渲染为静态精灵
                this.createDecorativeObj(obj, offsetX, offsetY);
            }
        });
    }

    /**
     * 生成对象的纹理（草药 / NPC / 传送门）
     * 替代之前的纯色圆圈，用像素风小图标
     */
    generateObjectTextures() {
        // ── 草药图标 (28×28 像素风植物) ──
        if (!this.textures.exists('_herb_icon')) {
            const g = this.make.graphics({ add: false });
            // 茎
            g.fillStyle(0x2d5a1e);
            g.fillRect(13, 14, 3, 14);
            // 左叶
            g.fillStyle(0x4a8c2a);
            g.fillCircle(8, 10, 7);
            g.fillStyle(0x3d7020);
            g.fillCircle(9, 9, 4);
            // 右叶
            g.fillStyle(0x5a9c35);
            g.fillCircle(20, 6, 7);
            g.fillStyle(0x4a8c2a);
            g.fillCircle(19, 5, 4);
            // 花苞
            g.fillStyle(0x88cc44);
            g.fillCircle(14, 3, 4);
            g.fillStyle(0xaaee55);
            g.fillCircle(14, 2, 2);
            // 根部
            g.fillStyle(0x6b4423);
            g.fillRect(12, 26, 6, 3);
            g.generateTexture('_herb_icon', 28, 28);
            g.destroy();
        }

        // ── NPC 图标已由地图 tileset 层绘制，不再生成程序化图标 ──

        // ── 传送门图标 (50×50 像素风漩涡) ──
        if (!this.textures.exists('_portal_icon')) {
            const g = this.make.graphics({ add: false });
            // 外圈
            g.lineStyle(3, 0x4466cc, 1);
            g.strokeCircle(25, 25, 22);
            // 内圈
            g.lineStyle(2, 0x6688ee, 0.8);
            g.strokeCircle(25, 25, 14);
            // 中心
            g.fillStyle(0x88aaff, 0.7);
            g.fillCircle(25, 25, 8);
            // 螺旋光点
            g.fillStyle(0xccddff, 0.9);
            g.fillCircle(25, 15, 3);
            g.fillCircle(31, 20, 2);
            g.fillCircle(30, 30, 2);
            g.fillCircle(19, 28, 3);
            g.fillCircle(18, 18, 2);
            g.generateTexture('_portal_icon', 50, 50);
            g.destroy();
        }
    }

    /**
     * 创建草药
     */
    createHerb(obj, offsetX, offsetY) {
        const props = this._parseProps(obj);

        // ★ 优先从 properties.herbId 获取；否则从 gid 映射到 tileset 名称再匹配 HERBS_DATA
        let herbId = props.herbId;
        if (!herbId && obj.gid) {
            const tsName = this._getTilesetNameByGid(obj.gid);
            if (tsName) {
                const matched = this.gameData.HERBS_DATA.find(h => h.name === tsName);
                if (matched) {
                    herbId = matched.id;
                    console.log(`createHerb: gid=${obj.gid} → tileset="${tsName}" → herbId="${herbId}"`);
                }
            }
        }
        if (!herbId) {
            herbId = 'gancao';
        }
        const herbData = this.gameData.HERBS_DATA.find(h => h.id === herbId);
        if (!herbData) return;

        const x = obj.x + (offsetX || 0);
        const y = obj.y + (offsetY || 0);

        // ★ 跳过已采集的草药位置（防止场景重启后复现）
        if (window._collectedHerbPositions) {
            const posKey = `${herbId}_${Math.round(x)}_${Math.round(y)}`;
            if (window._collectedHerbPositions.has(posKey)) {
                console.log(`${herbData.name} (${x},${y}) 已采集，跳过创建`);
                return;
            }
        }

        let herbSprite;

        // 优先使用 Tiled tileset 里加载的真实图片纹理
        const texKey = `herb_${herbId}`;
        if (this.textures.exists(texKey)) {
            herbSprite = this.add.image(x, y, texKey);
            // 使用 Tiled 里设置的对象宽高，保持原始比例
            const tw = obj.width;
            const th = obj.height;
            if (tw && th) {
                const imgSrc = this.textures.get(texKey).getSourceImage();
                const scaleX = tw / imgSrc.width;
                const scaleY = th / imgSrc.height;
                herbSprite.setScale(scaleX, scaleY).setOrigin(0.5, 1);
            } else {
                herbSprite.setOrigin(0.5, 1);
            }
        } else {
            herbSprite = this.add.image(x, y, '_herb_icon');
            herbSprite.setDisplaySize(28, 28);
        }

        // ★ 设置深度在地面图层之上（图块层 depth=0/1/2），玩家/NPC 之下（depth=5/10）
        herbSprite.setDepth(4);

        this.herbs.push({ sprite: herbSprite, data: herbData, collected: false });
    }

    /**
     * 创建传送门
     */
    createPortal(obj, offsetX, offsetY) {
        const props = this._parseProps(obj);
        const targetMap = props.targetMap || '';
        const x = obj.x + (offsetX || 0) + (obj.width || 0) / 2;
        const y = obj.y + (offsetY || 0) + (obj.height || 0) / 2;

        console.log(`传送门: "${obj.name}" → ${targetMap}, 位置: (${x}, ${y})`);

        // 优先使用对象 tileset 图片（如翠竹村牌坊 plain.png）
        let portalSprite = null;
        const tsName = this._getTilesetNameByGid(obj.gid || 0);
        console.log(`  gid=${obj.gid} → tileset="${tsName || 'unknown'}"`);

        if (tsName) {
            // 尝试多种可能的纹理 key
            const texKeys = [`obj_${tsName}`, `npc_${tsName}`, `${tsName}`];
            let foundKey = null;
            for (const k of texKeys) {
                if (this.textures.exists(k)) { foundKey = k; break; }
            }
            if (foundKey) {
                portalSprite = this.add.image(x, y, foundKey);
                console.log(`  ✓ 传送门纹理: ${foundKey}`);
            }
        }

        if (!portalSprite) {
            // 兜底：程序漩涡图标
            portalSprite = this.add.image(x, y, '_portal_icon');
            portalSprite.setDisplaySize(50, 50);
            portalSprite.setAlpha(0.85);
            this.tweens.add({
                targets: portalSprite, scaleX: 1.15, scaleY: 1.15,
                alpha: 0.6, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut'
            });
            console.log(`  ⚠ 兜底漩涡图标`);
        }

        portalSprite.setOrigin(0.5, 0.5);
        portalSprite.setDepth(5);  // 与 NPC 同层，确保在地面之上

        // 标签
        this.add.text(x, obj.y - 22, (obj.name || '传送门'), {
            fontSize: '14px', color: '#ffdd88',
            backgroundColor: '#332211cc', padding: { x: 8, y: 4 }
        }).setOrigin(0.5, 1).setDepth(10);

        // 存储传送数据（供 E 键交互和 click 使用）
        const portalData = {
            sprite: portalSprite,
            name: obj.name || '传送门',
            targetMap: targetMap,
            x: x, y: y
        };
        this.portals.push(portalData);

        // 点击传送
        portalSprite.setInteractive();
        portalSprite.on('pointerdown', () => {
            window._returnPlayerPos = null;  // 传送不保留位置
            this.config.currentMapId = targetMap;
            this.scene.restart();
        });
    }

    /**
     * 根据 gid 查找 tileset 名称
     */
    _getTilesetNameByGid(gid) {
        if (!this._rawMapJson || !this._rawMapJson.tilesets) return null;
        const tilesets = this._rawMapJson.tilesets;
        for (let i = 0; i < tilesets.length; i++) {
            const ts = tilesets[i];
            const nextGid = (i + 1 < tilesets.length) ? tilesets[i + 1].firstgid : Infinity;
            if (gid >= ts.firstgid && gid < nextGid) {
                const source = ts.source || '';
                return source.replace(/^.*[\\/]/, '').replace(/\.tsx$/i, '');
            }
        }
        return null;
    }

    /**
     * 根据 gid 查找对应的 Phaser 纹理 key（用于渲染 objects 层中的装饰物）
     */
    _getTextureKeyForGid(gid) {
        if (!this._gidTextureMap) return null;
        const gids = Object.keys(this._gidTextureMap).map(Number).sort((a, b) => a - b);
        for (let i = 0; i < gids.length; i++) {
            const startGid = gids[i];
            const endGid = (i + 1 < gids.length) ? gids[i + 1] - 1 : Infinity;
            if (gid >= startGid && gid <= endGid) {
                return this._gidTextureMap[startGid];
            }
        }
        return null;
    }

    /**
     * 创建装饰物精灵（objects 层中只有 gid 但没有 type 的对象）
     */
    createDecorativeObj(obj, offsetX, offsetY) {
        const gid = obj.gid;
        if (!gid) return;

        const texKey = this._getTextureKeyForGid(gid);
        if (!texKey || !this.textures.exists(texKey)) {
            console.warn(`createDecorativeObj: 纹理不存在, gid=${gid}, key=${texKey || 'null'}`);
            return;
        }

        const x = obj.x + (offsetX || 0) + (obj.width || 0) / 2;
        const y = obj.y + (offsetY || 0) + (obj.height || 0) / 2;

        const sprite = this.add.image(x, y, texKey);
        sprite.setOrigin(0.5, 0.5);
        // ★ 深度设为 2（地面装饰，在地面 tile层之上，玩家/NPC/草药之下）
        sprite.setDepth(2);
        sprite.setVisible(obj.visible !== false);

        console.log(`装饰物: gid=${gid} 创建于 (${Math.round(x)}, ${Math.round(y)})`);
    }

    /**
     * 创建 NPC / 交互物（加载图片并显示在地图上）
     * 存储交互数据用于 E 键触发第一章剧情
     */
    createNPC(obj, offsetX, offsetY) {
        const props = this._parseProps(obj);
        let npcId = props.npc_id || '';
        const name = (obj.name || props.name || 'NPC').trim();

        // 对于没有 npc_id 的交互物（如药篓、翠竹村牌坊），从名称映射
        const nameToId = {
            '药篓': 'abandoned_basket',
            '翠竹村': 'cuizhu_gate',
        };
        if (!npcId && nameToId[name]) {
            npcId = nameToId[name];
        }

        const storyIdx = this._npcStorySceneMap[npcId] !== undefined
            ? this._npcStorySceneMap[npcId]
            : -1;

        // 精灵锚点(0.5, 1) → 底部中心对齐对象中心
        const spriteX = obj.x + (offsetX || 0) + (obj.width || 0) / 2;
        const spriteY = obj.y + (offsetY || 0) + (obj.height || 0) / 2;

        // 交互检测坐标（与精灵位置一致）
        const interactX = spriteX;
        const interactY = spriteY;

        console.log(`NPC/交互物: "${name}" (${npcId}) → 剧情索引: ${storyIdx}, 位置: (${spriteX}, ${spriteY})`);

        // 创建精灵（先尝试 npc_ 前缀，再尝试 obj_ 前缀，最后尝试 tileset 纹理回退）
        const texKeyNpc = `npc_${npcId}`;
        const texKeyObj = `obj_${npcId}`;
        let npcSprite = null;

        if (npcId && this.textures.exists(texKeyNpc)) {
            npcSprite = this.add.image(spriteX, spriteY, texKeyNpc);
            npcSprite.setOrigin(0.5, 1);   // 底部中心锚点，脚踩地面
            npcSprite.setDepth(5);
            console.log(`  ✓ 精灵已创建: ${texKeyNpc}`);
        } else if (npcId && this.textures.exists(texKeyObj)) {
            npcSprite = this.add.image(spriteX, spriteY, texKeyObj);
            npcSprite.setOrigin(0.5, 1);
            npcSprite.setDepth(5);
            console.log(`  ✓ 精灵已创建: ${texKeyObj}`);
        } else if (npcId) {
            // ★ 回退1：尝试通过 tileset GID 查找纹理（如翠竹村牌坊用 plain.png）
            const tsName = this._getTilesetNameByGid(obj.gid || 0);
            if (tsName) {
                const fallbackKeys = [`obj_${tsName}`, `npc_${tsName}`, tsName];
                let foundKey = null;
                for (const k of fallbackKeys) {
                    if (this.textures.exists(k)) { foundKey = k; break; }
                }
                if (foundKey) {
                    npcSprite = this.add.image(spriteX, spriteY, foundKey);
                    npcSprite.setOrigin(0.5, 1);
                    npcSprite.setDepth(5);
                    console.log(`  ✓ 精灵已创建（tileset回退）: ${foundKey}`);
                }
            }
            
            // ★ 回退2：如果仍没有纹理，生成一个占位图标
            if (!npcSprite) {
                console.warn(`  ⚠ 纹理不存在: ${texKeyNpc} / ${texKeyObj}，使用占位图标`);
                const g = this.make.graphics({ add: false });
                g.fillStyle(0xcc8844);
                g.fillCircle(16, 16, 14);
                g.fillStyle(0x664422);
                g.fillCircle(12, 12, 4);
                g.fillCircle(20, 12, 4);
                g.fillCircle(16, 16, 3);
                g.generateTexture(`_npc_fallback_${npcId}`, 32, 32);
                g.destroy();
                npcSprite = this.add.image(spriteX, spriteY, `_npc_fallback_${npcId}`);
                npcSprite.setOrigin(0.5, 1);
                npcSprite.setDepth(5);
            }
        } else {
            console.warn(`  ⚠ 缺少可识别 ID，跳过精灵创建: "${name}"`);
        }

        // 存储 NPC 交互数据（交互距离用对象中心，精灵用底部锚点）
        this.npcs.push({
            name: name,
            npcId: npcId,
            x: interactX,
            y: interactY,
            w: obj.width || 60,
            h: obj.height || 60,
            storyIdx: storyIdx,
            interacted: false,
            sprite: npcSprite
        });
    }

    /**
     * 创建剧情甘草（地图中 type="herbs" 的对象，触发 C02 第一株甘草剧情）
     */
    createStoryHerb(obj, offsetX, offsetY) {
        const props = this._parseProps(obj);
        const herbId = props.herbId || 'gancao';
        const storyIdx = this._npcStorySceneMap[herbId] !== undefined
            ? this._npcStorySceneMap[herbId]
            : -1;

        console.log(`剧情交互物: ${herbId} → 剧情索引: ${storyIdx}`);

        this.npcs.push({
            name: '甘草',
            npcId: herbId,
            x: obj.x + (offsetX || 0) + (obj.width || 0) / 2,
            y: obj.y + (offsetY || 0) + (obj.height || 0) / 2,
            w: obj.width || 60,
            h: obj.height || 100,
            storyIdx: storyIdx,
            interacted: false
        });
    }

    /**
     * 解析 Tiled 对象属性（兼容数组格式和对象格式）
     */
    _parseProps(obj) {
        if (!obj.properties) return {};
        if (Array.isArray(obj.properties)) {
            const result = {};
            obj.properties.forEach(p => {
                if (p.name) result[p.name] = p.value;
            });
            return result;
        }
        return obj.properties;
    }

    /**
     * 初始化图片式地图（非 Tilemap，静态背景图+可点击交互点）
     * @param {Object} mapConfig - 地图配置（含 imagePath）
     */
    _initImageMap(mapConfig) {
        console.log('[图片地图] 初始化:', mapConfig.name);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        if (!this.textures.exists('_image_map_bg')) {
            console.error('[图片地图] 纹理未加载');
            return;
        }

        // === 显示地图背景图 ===
        const bg = this.add.image(width / 2, height / 2, '_image_map_bg')
            .setOrigin(0.5, 0.5)
            .setDepth(1);
        
        // 自适应屏幕缩放
        const tex = this.textures.get('_image_map_bg');
        const src = tex.source[0];
        const imgRatio = src.width / src.height;
        const screenRatio = width / height;
        let dw, dh;
        if (imgRatio > screenRatio) { dw = width; dh = width / imgRatio; }
        else { dh = height; dw = height * imgRatio; }
        bg.setDisplaySize(dw, dh);
        this._imageMapBg = bg;

        // 设置世界边界为屏幕大小
        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.setBounds(0, 0, width, height);

        // 标记 tiledMap 为空（避免后续报错）
        this.tiledMap = null;

        // 保存尺寸供热点使用
        this._imageMapW = dw;
        this._imageMapH = dh;
    }

    /**
     * ★ 初始化/重置村庄事件状态（持久化到 window，跨场景不丢失）
     */
    _initVillageEventState() {
        if (!window._villageEventState) {
            window._villageEventState = {
                herb_garden: 'pending',      // pending → completed (C09)
                well: 'pending',             // pending → completed (C10)
                workshop: 'c11_pending',     // c11_pending → completed (C11·晒药台)
                herb_shop: 'locked',         // locked → pending → completed（作坊完成后解锁 C12·药铺）
                residence: 'pending',        // pending → completed (C13)（水井完成后才显示!）
                valley_entrance: 'locked',   // locked → pending（C14完成后解锁 → 点击进入溪谷）
            };
        }
        // ★ 处理刚从剧情返回的完成标记
        if (window._pendingVillageEvent) {
            const evt = window._pendingVillageEvent;
            const st = window._villageEventState;
            st[evt.spotId] = evt.nextState;
            console.log(`[村庄事件] ✅ ${evt.spotId} → ${evt.nextState}`, st);

            // ★ 任务系统：地点完成 → 完成对应 quest
            this._completeQuestForLocation(evt.spotId, evt.locKey);

            // ★ 作坊(C11)完成后 → 解锁药铺(C12)
            if (evt.spotId === 'workshop' && evt.nextState === 'completed') {
                st.herb_shop = 'pending';
                console.log('[村庄事件] 🔓 作坊完成，药铺已解锁');
            }

            delete window._pendingVillageEvent;

            // ★ 检查是否全部完成 → 自动触发 C14
            const allCompleted =
                st.herb_garden === 'completed' &&
                st.well === 'completed' &&
                st.workshop === 'completed' &&
                st.herb_shop === 'completed' &&
                st.residence === 'completed';
            if (allCompleted && !window._c14Triggered) {
                window._c14Triggered = true;
                window._c14JustCompleted = true;  // ★ 标记：C14结束后解锁溪谷
                console.log('[村庄事件] 🎉 翠竹村探索全部完成！自动触发 C14');
                // C14 在 chapter1 场景数组中索引为 13
                this._triggerVillageEvent(13, 'EVT_VILLAGE_COMPLETE');
            }
        }

        // ★ C14 完成后恢复 → 解锁溪谷入口
        if (window._c14JustCompleted) {
            window._villageEventState.valley_entrance = 'pending';
            delete window._c14JustCompleted;
            console.log('[村庄事件] 🔓 C14完成，溪谷入口已解锁');
        }
    }

    /**
     * ★ 获取村庄热点的剧情事件配置
     * @returns {Object|null} 事件配置，无剧情则 null
     */
    _getVillageEventConfig(spotId) {
        const configs = {
            herb_garden: { eventId: 'EVT_LAOLI_HERB_GARDEN', sceneIdx: 8,  locKey: 'loc_herb_garden',    name: 'C09·药圃辨药' },
            well:        { eventId: 'EVT_WELL_VILLAGER',      sceneIdx: 9,  locKey: 'loc_well',           name: 'C10·水井线索' },
            workshop:    { eventId: 'EVT_DRYING_PLATFORM',    sceneIdx: 10, locKey: 'loc_drying_platform',name: 'C11·晒药台' },
            herb_shop:   { eventId: 'EVT_EMPTY_SHOP',         sceneIdx: 11, locKey: 'loc_empty_shop',     name: 'C12·空置药铺' },
            residence:   { eventId: 'EVT_ZHANG_DIAGNOSIS',    sceneIdx: 12, locKey: 'loc_zhang_home',     name: 'C13·张大娘问诊' },
        };
        return configs[spotId] || null;
    }

    /**
     * ★ 触发村庄剧情事件（模拟 DebugManager 的跳转逻辑）
     */
    _triggerVillageEvent(sceneIdx, eventName) {
        this.time.delayedCall(150, () => {
            // ★ 确保第一章数据已加载（优先用 window 缓存，否则直接 fetch）
            const chapter1Data = window._chapter1Data;
            if (!chapter1Data) {
                console.error('[村庄事件] ✗ window._chapter1Data 未加载，无法触发剧情');
                return;
            }

            const startData = {
                debugMode: true,
                debugTargetIdx: sceneIdx,
                returnToGame: true,
                forceChapter1: chapter1Data,  // ★ 直接传入第一章数据，不走 _loadChapter 判断
            };
            // ★ 标记：剧情结束后必须回到翠竹村地图
            window._returnToVillageMap = true;
            console.log(`[村庄事件] ▶ 触发 ${eventName}（索引=${sceneIdx}，对应 ${chapter1Data.scenes[sceneIdx]?.id}），forceChapter1 已传递`);

            // ★ 使用 this.scene.start 而非 this.game.scene.start：
            this.scene.start('IntroScene', startData);
        });
    }

    _setupImageMapUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const dw = this._imageMapW || width;
        const dh = this._imageMapH || height;

        // ★ 确保 Canvas 在最顶层可见
        this.scene.bringToTop();
        const canvas = this.game.canvas;
        if (canvas) {
            canvas.style.display = 'block';
            canvas.style.visibility = 'visible';
        }

        // ★ 确保背景图直接可见
        if (this._imageMapBg) {
            this._imageMapBg.setAlpha(1);
            this._imageMapBg.setVisible(true);
        }

        // ★ 初始化村庄事件状态（并消费上次完成的标记）
        this._initVillageEventState();

        // === 顶部标题栏 ===
        const titleBar = this.add.rectangle(width / 2, 28, width, 56, 0x1a1a2e, 0.85)
            .setScrollFactor(0).setDepth(10);
        this.add.text(width / 2, 28, '翠竹村', {
            fontSize: '24px',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", serif',
            color: '#d4af37',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(11);

        // === 定义可点击地点（比例坐标 0~1，自动映射到实际显示尺寸）===
        const locations = [
            { id: 'plains_exit',   name: '城郊平原',   x: 0.05, y: 0.55, label: '城郊平原' },
            { id: 'village_gate',  name: '翠竹村牌坊', x: 0.22, y: 0.48, label: '牌坊' },
            { id: 'cunzhang_home', name: '村长家',     x: 0.50, y: 0.12, label: '村长家' },
            { id: 'herb_garden',   name: '药圃',       x: 0.36, y: 0.38, label: '药圃',    hasStory: true, storyKey: 'C09' },
            { id: 'well',          name: '水井',       x: 0.54, y: 0.48, label: '水井',    hasStory: true, storyKey: 'C10' },
            { id: 'residence',     name: '民居',       x: 0.32, y: 0.72, label: '民居',    hasStory: true, storyKey: 'C13' },
            { id: 'workshop',      name: '作坊',       x: 0.65, y: 0.72, label: '作坊',    hasStory: true, storyKey: 'C11' },
            { id: 'herb_shop',     name: '药铺',       x: 0.76, y: 0.72, label: '药铺',    hasStory: true, storyKey: 'C12' },
            { id: 'ancient_tree',  name: '古树',       x: 0.76, y: 0.30, label: '古树' },
            { id: 'valley_entrance',name: '溪流山谷',  x: 0.94, y: 0.45, label: '溪谷',   hasStory: true, storyKey: 'C15a' },
        ];

        this._villageHotspots = [];

        locations.forEach(loc => {
            const spotX = width / 2 + (loc.x - 0.5) * dw;
            const spotY = height / 2 + (loc.y - 0.5) * dh;

            // ── 判断该地点是否有未完成的剧情（决定是否显示 "!"）──
            let showExclamation = false;
            if (loc.hasStory) {
                const st = window._villageEventState;
                const s = st[loc.id];
                if (loc.id === 'residence') {
                    // 民居：水井(C10)完成后才显示 "!"
                    showExclamation = (s !== 'completed' && st.well === 'completed');
                } else if (loc.id === 'herb_shop') {
                    // 药铺：作坊(C11)完成后才解锁，解锁后(pending)才显示 "!"
                    showExclamation = (s === 'pending');
                } else if (loc.id === 'valley_entrance') {
                    // 溪谷：C14完成后解锁，解锁后(pending)才显示 "!"
                    showExclamation = (s === 'pending');
                } else {
                    showExclamation = (s !== 'completed');
                }
            }

            // 点击区域（透明圆形）
            const hitArea = this.add.circle(spotX, spotY, 28, 0xffffff, 0)
                .setInteractive({ useHandCursor: true })
                .setDepth(8)
                .setScrollFactor(0);

            // 地点标记
            let dot, pulseRing;
            if (showExclamation) {
                // ★ 有剧情 → 红色叹号标记
                dot = this.add.text(spotX, spotY, '❗', {
                    fontSize: '22px',
                }).setOrigin(0.5, 0.5).setDepth(9).setScrollFactor(0);

                pulseRing = this.add.circle(spotX, spotY, 10, 0xff4444, 0)
                    .setStrokeStyle(2, 0xff6666, 0.7)
                    .setDepth(8)
                    .setScrollFactor(0);
                this.tweens.add({
                    targets: pulseRing,
                    radius: 24,
                    alpha: 0,
                    duration: 1200,
                    repeat: -1,
                    ease: 'Sine.easeOut'
                });
            } else {
                // 无剧情或已完成 → 金色圆点
                dot = this.add.circle(spotX, spotY, 6, 0xd4af37, 0.9)
                    .setStrokeStyle(2, 0xffffff, 0.8)
                    .setDepth(9)
                    .setScrollFactor(0);

                pulseRing = this.add.circle(spotX, spotY, 6, 0xd4af37, 0)
                    .setStrokeStyle(1.5, 0xd4af37, 0.5)
                    .setDepth(8)
                    .setScrollFactor(0);
                this.tweens.add({
                    targets: pulseRing,
                    radius: 20,
                    alpha: 0,
                    duration: 1500,
                    repeat: -1,
                    ease: 'Sine.easeOut'
                });
            }

            // 地名标签
            const label = this.add.text(spotX, spotY - 22, loc.label, {
                fontSize: '13px',
                fontFamily: '"FangSong", "STFangsong", serif',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2,
                backgroundColor: '#00000066',
                padding: { x: 4, y: 1 }
            }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

            // 点击事件
            hitArea.on('pointerdown', () => {
                console.log(`[村庄地图] 点击了: ${loc.name} (${loc.id}) hasStory=${loc.hasStory}`);

                if (!loc.hasStory) {
                    // ── 城郊平原：切换到 plain 地图 ──
                    if (loc.id === 'plains_exit') {
                        console.log('[村庄地图] ▶ 前往城郊平原');
                        this.config.currentMapId = 'plain';
                        window._currentVillageSpotCoords = null;
                        this.scene.start('GameScene');
                        return;
                    }
                    // 无剧情 → 仅浮动文字
                    this._showVillageFloatText(`${loc.name}`, spotX, spotY);
                    return;
                }

                // ★ 检查事件状态
                const st = window._villageEventState;
                const currentState = st[loc.id];

                // ── 民居：水井未完成 → 提示先做水井 ──
                if (loc.id === 'residence' && st.well !== 'completed') {
                    this._showVillageFloatText('先看看水井那边的线索', spotX, spotY);
                    return;
                }

                // ── 药铺：作坊未完成 → 提示先做作坊 ──
                if (loc.id === 'herb_shop' && st.workshop !== 'completed') {
                    this._showVillageFloatText('作坊那边还没有忙完', spotX, spotY);
                    return;
                }

                // ── 溪谷入口：C14完成后解锁 → 触发 C15a + 切换到溪谷地图 ──
                if (loc.id === 'valley_entrance') {
                    if (currentState === 'locked') {
                        this._showVillageFloatText('村长说还不能去溪谷', spotX, spotY);
                        return;
                    }
                    if (currentState === 'completed') {
                        this._showVillageFloatText('已经探索过了', spotX, spotY);
                        return;
                    }
                    const chapter1Data = window._chapter1Data;
                    if (!chapter1Data) {
                        this._showVillageFloatText('剧情数据加载失败', spotX, spotY);
                        return;
                    }
                    // 标记：C15a 结束后返回溪谷地图（非翠竹村）
                    window._returnToStreamMap = true;
                    window._villageEventState.valley_entrance = 'completed';
                    console.log('[村庄事件] ▶ 进入溪谷！触发 C15a，结束后进入溪谷地图');

                    this.time.delayedCall(150, () => {
                        this.scene.start('IntroScene', {
                            debugMode: true,
                            debugTargetIdx: 14,       // C15a 在 chapter1 场景数组中索引为 14
                            returnToGame: true,
                            forceChapter1: chapter1Data,
                        });
                    });
                    return;
                }

                // ── 已完成 ──
                if (currentState === 'completed' || currentState === 'locked') {
                    this._showVillageFloatText('已经探索完毕了', spotX, spotY);
                    return;
                }

                const cfg = this._getVillageEventConfig(loc.id);
                if (cfg) {
                    window._pendingVillageEvent = {
                        spotId: loc.id, locKey: cfg.locKey,
                        eventIdx: cfg.sceneIdx, nextState: 'completed'
                    };
                    this._triggerVillageEvent(cfg.sceneIdx, cfg.name);
                }
            });

            // 悬停高亮
            hitArea.on('pointerover', () => {
                if (showExclamation) {
                    dot.setScale(1.3);
                    this.tweens.killTweensOf(pulseRing);
                    pulseRing.setStrokeStyle(2.5, 0xff8888, 0.9);
                } else {
                    dot.setFillStyle(0xffd700, 1); dot.setScale(1.3);
                    this.tweens.killTweensOf(pulseRing);
                    pulseRing.setStrokeStyle(2, 0xffd700, 0.7);
                }
                label.setColor('#ffdd44');
            });
            hitArea.on('pointerout', () => {
                if (showExclamation) {
                    dot.setScale(1);
                    pulseRing.setStrokeStyle(2, 0xff6666, 0.7);
                    this.tweens.add({ targets: pulseRing, radius: 24, alpha: 0, duration: 1200, repeat: -1, ease: 'Sine.easeOut' });
                } else {
                    dot.setFillStyle(0xd4af37, 0.9); dot.setScale(1);
                    pulseRing.setStrokeStyle(1.5, 0xd4af37, 0.5);
                    this.tweens.add({ targets: pulseRing, radius: 20, alpha: 0, duration: 1500, repeat: -1, ease: 'Sine.easeOut' });
                }
                label.setColor('#ffffff');
            });

            // 储存引用（如果是文本类型的 dot，需要特殊处理悬停动画）
            const isTextDot = (showExclamation);
            this._villageHotspots.push({ hitArea, dot, pulseRing, label, locId: loc.id, isTextDot });
        });

        // === 底部提示文字 ===
        const state = window._villageEventState;
        const completedCount = [state.herb_garden, state.well, state.residence]
            .filter(s => s === 'completed').length
            + (state.workshop === 'completed' ? 1 : 0);
        const totalTasks = 4;
        const hintText = completedCount >= totalTasks
            ? '🎉 翠竹村探索完成！返回村长家推进主线'
            : `点击地图上 ❗ 标记处探索村庄 · 已完成 ${completedCount}/${totalTasks}`;
        this.add.text(width / 2, height - 28, hintText, {
            fontSize: '14px',
            fontFamily: '"FangSong", serif',
            color: completedCount >= totalTasks ? '#ffd700' : '#cccccc',
            backgroundColor: '#00000088',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setDepth(11).setScrollFactor(0);

        console.log('[图片地图] UI 初始化完成');

        // 更新UI
        if (window.uiManager) {
            window.uiManager.updateMinimapTitle();
            window.uiManager.updateBackpackUI();
        }
    }

    /**
     * 村庄地图：显示浮动文字反馈
     */
    _showVillageFloatText(text, x, y) {
        const floatText = this.add.text(x, y - 40, text, {
            fontSize: '18px',
            fontFamily: '"FangSong", serif',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(20).setScrollFactor(0);

        this.tweens.add({
            targets: floatText,
            y: floatText.y - 50,
            alpha: 0,
            duration: 1200,
            ease: 'Cubic.easeOut',
            onComplete: () => floatText.destroy()
        });
    }

    /**
     * 生成小地图缩略图
     */
    generateMinimap() {
        if (!this.tiledMap || !this.player) return;

        const mapW = this.tiledMap.widthInPixels;
        const mapH = this.tiledMap.heightInPixels;
        if (!mapW || !mapH) return;

        // 保存当前摄像机状态
        const oldZoom = this.cameras.main.zoom;
        const oldScrollX = this.cameras.main.scrollX;
        const oldScrollY = this.cameras.main.scrollY;

        // 停止跟随玩家并隐藏玩家和草药
        this.cameras.main.stopFollow();
        this.player.setVisible(false);
        this.herbs.forEach(h => { if (!h.collected && h.sprite) h.sprite.setVisible(false); });

        // 计算能显示完整地图的缩放比例
        const viewW = this.cameras.main.width;
        const viewH = this.cameras.main.height;
        const zoom = Math.min(viewW / mapW, viewH / mapH);

        // 设置摄像机查看完整地图
        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapW / 2, mapH / 2);

        // 截取一帧作为缩略图
        this.game.renderer.snapshot((image) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');

                if (window.uiManager && typeof window.uiManager.setMinimapBackground === 'function') {
                    window.uiManager.setMinimapBackground(dataUrl, image.width, image.height, mapW, mapH);
                }
            } catch (e) {
                console.warn('小地图缩略图生成失败:', e);
            }

            // 恢复摄像机状态
            this.player.setVisible(true);
            this.herbs.forEach(h => { if (!h.collected && h.sprite) h.sprite.setVisible(true); });
            this.cameras.main.setZoom(oldZoom);
            this.cameras.main.setScroll(oldScrollX, oldScrollY);
            const cam = this.config.camera;
            this.cameras.main.startFollow(this.player, true, cam.followLerpX, cam.followLerpY);
        });
    }

    /**
     * 创建玩家
     */
    createPlayer() {
        const cfg = this.config;
        const startX = cfg.GAME_WIDTH / 2;
        const startY = cfg.GAME_HEIGHT / 2;

        const COLS = 4; // 4列4行

        // ── 注册四方向走路动画 ──
        this.anims.create({
            key: 'walk_down',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'walk_left',
            frames: this.anims.generateFrameNumbers('player', { start: COLS, end: COLS + 3 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'walk_right',
            frames: this.anims.generateFrameNumbers('player', { start: COLS * 2, end: COLS * 2 + 3 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'walk_up',
            frames: this.anims.generateFrameNumbers('player', { start: COLS * 3, end: COLS * 3 + 3 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 1, repeat: 0
        });

        // ── 创建物理精灵 ──
        this.player = this.physics.add.sprite(startX, startY, 'player', 0);
        this.player.setScale(0.4);
        this.player.body.setCollideWorldBounds(true);

        const bodyWidth = 80;
        const bodyHeight = 100;
        this.player.body.setSize(bodyWidth, bodyHeight, true);

        this.player.setDepth(10);
        this.player.anims.play('idle');

        console.log('✅ 玩家创建完成');
    }

    /**
     * 创建默认草药
     */
    createHerbs() {
        const positions = this.config.herbPositions;
        const HERBS = this.gameData.HERBS_DATA;

        positions.forEach(pos => {
            const data = HERBS[pos.type];
            if (!data) return;

            const herb = this.add.circle(pos.x, pos.y, 15, this.getHerbColor(pos.type));
            herb.setStrokeStyle(2, 0xffffff);
            herb.setDepth(4);

            const label = this.add.text(pos.x, pos.y + 25, data.name, {
                fontSize: '12px', color: '#ffffff',
                backgroundColor: '#00000088', padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(5);

            this.herbs.push({ sprite: herb, label, data, collected: false });
        });
    }

    /**
     * 摄像机
     */
    setupCamera() {
        const cam = this.config.camera;
        this.cameras.main.startFollow(this.player, true, cam.followLerpX, cam.followLerpY);

        // 溪流地图缩小显示
        const mapId = this.config.currentMapId;
        if (mapId === 'stream') {
            this.cameras.main.setZoom(0.55);
            console.log('溪流地图：摄像机缩放 0.55');
        }
    }

    /**
     * 输入
     */
    setupInput() {
        if (!this.input || !this.input.keyboard) {
            console.warn('GameScene: 输入插件未初始化，跳过键盘设置');
            return;
        }

        this.input.keyboard.enabled = true;
        this.input.keyboard.resetKeys();

        this.cursors = this.input.keyboard.createCursorKeys();

        this.wasd = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        this.input.keyboard.on('keydown-F12', () => {
            const isDebug = window.gameStateManager.toggleDebugMode();
            window.uiManager.toggleDebugPanel(isDebug);
        });

        this.input.keyboard.on('keydown-B', () => window.uiManager.openModal('backpack-modal'));
        this.input.keyboard.on('keydown-T', () => window.uiManager.openModal('herb-guide-modal'));
        this.input.keyboard.on('keydown-ESC', () => window.uiManager.closeAllModals());

        console.log('GameScene: 键盘输入设置完成');
    }

    /**
     * 每帧更新
     */
    update() {
        if (!this.player || !this.player.body) return;

        this.updateMovement();
        window.uiManager.updateMinimap(this.player.x, this.player.y);
        this.checkCollection();
        this.checkNPCInteraction();
        this.checkPortalInteraction();
        this.checkStreamTriggers();
        this._updateGuideOverlay();

        if (window.gameStateManager.state.debugMode) {
            window.uiManager.updateDebugInfo({
                x: this.player.x, y: this.player.y,
                time: window.gameStateManager.state.currentTime,
                fps: this.game?.loop?.actualFps
            });
        }
    }

    /**
     * 移动 + 方向动画
     */
    updateMovement() {
        const speed = this.config.player.speed;
        let vx = 0, vy = 0;
        let animKey = null;

        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            vx = -speed;
            animKey = 'walk_left';
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            vx = speed;
            animKey = 'walk_right';
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            vy = -speed;
            if (!vx) animKey = 'walk_up';
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            vy = speed;
            if (!vx) animKey = 'walk_down';
        }

        if (vx && vy) { vx *= 0.707; vy *= 0.707; }

        const movement = this.applyWalkCollision(vx, vy);
        this.player.body.setVelocity(movement.vx, movement.vy);

        if (animKey) {
            this.player.anims.play(animKey, true);
        } else {
            this.player.anims.stop();
            this.player.setFrame(0);
        }
    }

    /**
     * 检测采集
     */
    checkCollection() {
        if (!this.player) return;

        let near = null;
        const dist = this.config.player.collectDistance;

        this.herbs.forEach(h => {
            if (h.collected) return;
            const d = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, h.sprite.x, h.sprite.y
            );
            if (d < dist) near = h;
        });

        if (near) {
            if (near.data.id === 'gancao') {
                const gancaoCompleted = window._completedNpcs && window._completedNpcs.has('gancao');
                if (!gancaoCompleted && !this._gancaoStoryTriggering) {
                    this._gancaoStoryTriggering = true;
                    console.log('▶ 靠近甘草，自动采集并触发 C02 第一株甘草剧情');
                    this.collect(near);
                    this.triggerStoryScene({
                        name: '甘草',
                        npcId: 'gancao',
                        storyIdx: this._npcStorySceneMap['gancao'] || 1
                    });
                    return;
                }
            }
            window.uiManager.showCollectPrompt(near.data.name);
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.collect(near);
            }
        } else {
            window.uiManager.hideCollectPrompt();
        }
    }

    /**
     * 采集
     */
    collect(herb) {
        herb.collected = true;
        herb.sprite.setVisible(false);
        if (herb.label) herb.label.setVisible(false);

        window.gameStateManager.addHerbToBackpack(herb.data.id);
        window.uiManager.showCollectSuccess(herb.data.name);
        window.uiManager.updateBackpackUI();
        window.uiManager.updateHerbGuideUI();
        // ★ 任务系统：采集甘草 → 完成 Q_PLAIN_HERB
        if (window.gameStateManager) {
            window.gameStateManager.completeQuestByEvent('EVT_FIRST_HERB');
            if (window.uiManager.refreshQuestPanel) {
                window.uiManager.refreshQuestPanel();
            }
        }

        // ★ 溪流采集计数：山药 / 茯苓
        if (herb.data.id === 'shanyao') {
            window._shanyaoCollected = (window._shanyaoCollected || 0) + 1;
            console.log(`[Quest] 山药采集进度: ${window._shanyaoCollected}/3`);
            if (window._shanyaoCollected >= 3 && window.gameStateManager) {
                window.gameStateManager.completeQuestByEvent('EVT_SHANYAO_3_COLLECTED');
                if (window.uiManager.refreshQuestPanel) {
                    window.uiManager.refreshQuestPanel();
                }
            }
        }
        if (herb.data.id === 'fuling') {
            window._fulingCollected = (window._fulingCollected || 0) + 1;
            console.log(`[Quest] 茯苓采集进度: ${window._fulingCollected}/3`);
            if (window._fulingCollected >= 3 && window.gameStateManager) {
                window.gameStateManager.completeQuestByEvent('EVT_FULING_3_COLLECTED');
                if (window.uiManager.refreshQuestPanel) {
                    window.uiManager.refreshQuestPanel();
                }
            }
        }

        console.log(`[collect] herbId=${herb.data.id}, name=${herb.data.name}`);
        if (!window._collectedHerbPositions) window._collectedHerbPositions = new Set();
        const posKey = `${herb.data.id}_${Math.round(herb.sprite.x)}_${Math.round(herb.sprite.y)}`;
        window._collectedHerbPositions.add(posKey);
        if (herb.data.id === 'gancao') {
            window._gancaoCollected = (window._gancaoCollected || 0) + 1;
            const remaining = this.herbs.filter(h => h.data.id === 'gancao' && !h.collected).length;
            console.log(`甘草采集进度: ${window._gancaoCollected}/3, 剩余: ${remaining}, 位置已保存: ${posKey}`);
        } else {
            console.log(`草药持久化: ${herb.data.name} 位置已保存: ${posKey}`);
        }
    }

    /**
     * 检测 NPC 交互
     */
    checkNPCInteraction() {
        if (!this.player || !this.eKey) return;
        const interactDist = 80;

        let nearNpc = null;
        this.npcs.forEach(npc => {
            if (npc.storyIdx < 0) return;
            const d = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, npc.x, npc.y
            );
            if (d < interactDist) nearNpc = npc;
        });

        if (nearNpc) {
            window.uiManager.showCollectPrompt(`与${nearNpc.name}对话`);
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.triggerStoryScene(nearNpc);
            }
        }
    }

    /**
     * 检测传送门交互
     */
    checkPortalInteraction() {
        if (!this.player || !this.eKey || this.portals.length === 0) return;
        const interactDist = 100;

        let nearPortal = null;
        this.portals.forEach(p => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y);
            if (d < interactDist) nearPortal = p;
        });

        if (nearPortal) {
            window.uiManager.showCollectPrompt(`前往${nearPortal.name}`);
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                window._returnPlayerPos = null;
                this.config.currentMapId = nearPortal.targetMap;
                this.scene.restart();
            }
        }
    }

    /**
     * ★ 流地图区域触发器检测
     */
    checkStreamTriggers() {
        if (!this._streamTriggers || this._streamTriggers.length === 0) return;
        if (!this.player) return;

        const px = this.player.x;
        const py = this.player.y;

        for (const zone of this._streamTriggers) {
            if (this._streamTriggered.has(zone.id)) continue;
            if (zone.require && !this._streamTriggered.has(zone.require)) continue;

            if (px >= zone.x && px <= zone.x + zone.w &&
                py >= zone.y && py <= zone.y + zone.h) {
                console.log(`▶ 流地图触发器: 进入区域 ${zone.id}，触发场景索引 ${zone.sceneIdx}`);
                this._streamTriggered.add(zone.id);

                if (zone.id === 'c15c') {
                    this._deactivateGuide();
                }

                this.triggerStorySceneByIndex(zone.sceneIdx);
                return;
            }
        }
    }

    // ===================== 过桥指引系统 =====================

    /**
     * ★ 设置 C15b 之后的过桥指引遮罩
     * 升级版：使用 HTML5 Canvas 动态生成具有气团微粒质感的有机的“真实迷雾背景”代替原本生硬的黑框
     */
    _setupGuideOverlay() {
        if (!window._streamGuideActive || !this.player) return;

        this._guideActive = true;
        this._guideTarget = window._streamGuideTarget || { x: 750, y: 1075 };

        // ── 1. 动态生成迷雾纹理（全局仅生成一次，保证高性能） ──
        if (!this.textures.exists('fog_mist_texture')) {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 2048;
            const ctx = canvas.getContext('2d');
            const cx = 1024;
            const cy = 1024;

            // 创建核心环形渐变：控出玩家周围的视野，向外羽化并逐渐融入深邃环境
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1024);
            grad.addColorStop(0, 'rgba(15, 24, 20, 0)');         // 玩家核心区完全晴朗
            grad.addColorStop(0.06, 'rgba(15, 24, 20, 0)');       // 晴朗舒适圈
            grad.addColorStop(0.12, 'rgba(15, 24, 20, 0.55)');    // 边缘羽化过渡区
            grad.addColorStop(0.32, 'rgba(12, 18, 15, 0.94)');    // 渐入迷雾主干
            grad.addColorStop(1, 'rgba(8, 12, 10, 1)');           // 最外围遮罩绝对浓雾

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 2048, 2048);

            // 叠加算法：绘制散落的半透明气体微粒团，营造真实迷雾的有机烟雾颗粒感
            for (let i = 0; i < 350; i++) {
                const angle = Math.random() * Math.PI * 2;
                // 确保微粒主要堆积在视野舒适圈以外（r > 110）
                const r = 110 + Math.random() * 950;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                const size = 60 + Math.random() * 140;

                const cloudGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
                cloudGrad.addColorStop(0, 'rgba(24, 34, 28, 0.16)'); // 烟雾轻微堆叠
                cloudGrad.addColorStop(1, 'rgba(24, 34, 28, 0)');

                ctx.fillStyle = cloudGrad;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            this.textures.addCanvas('fog_mist_texture', canvas);
        }

        // ── 2. 创建迷雾图片精灵对象 ──
        // 代替原本的 Graphics 黑框，挂载到世界坐标系（setScrollFactor(1)），完美跟随玩家平移
        this._guideOverlay = this.add.image(this.player.x, this.player.y, 'fog_mist_texture');
        this._guideOverlay.setDepth(20);
        this._guideOverlay.setScrollFactor(1);

        // 指引箭头保持使用 Graphics 绘制
        this._guideArrow = this.add.graphics();
        this._guideArrow.setDepth(25);
        this._guideArrow.setScrollFactor(1);

        // 提示文字
        this._guideHint = this.add.text(
            this.cameras.main.centerX, 50,
            '◈ 跟随指引，穿过石桥 ◈',
            {
                fontSize: '18px',
                color: '#ffeebb',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3,
                shadow: { blur: 8, color: '#ffaa00', fill: true }
            }
        ).setOrigin(0.5, 0).setDepth(25).setScrollFactor(0);

        console.log('过桥指引：流体烟雾微粒感迷雾背景已成功激活');
    }

    /**
     * ★ 每帧更新指引迷雾和箭头
     * 实时计算并同步迷雾的坐标及摄像机缩放因数，确保完美铺满且视野大小恒定
     */
    _updateGuideOverlay() {
        if (!this._guideActive || !this.player) return;

        const cam = this.cameras.main;
        const scale = 1 / cam.zoom;

        // 1. ── 实时同步迷雾精灵的坐标与摄像机缩放 ──
        if (this._guideOverlay && this._guideOverlay.setPosition) {
            this._guideOverlay.setPosition(this.player.x, this.player.y);
            // 关键逻辑：随着大地图整体 Zoom 缩小，迷雾图片需要扩大 1 / zoom 倍
            // 从而保证中央亮区在屏幕上的物理直径始终维持 100px 左右，且边缘绝不露底
            this._guideOverlay.setScale(scale);
        }

        // 2. ── 指引箭头（世界坐标渲染） ──
        if (this._guideArrow) {
            this._guideArrow.clear();
            if (!this._guideTarget) return;

            const cx = this.player.x;
            const cy = this.player.y;
            const tx = this._guideTarget.x;
            const ty = this._guideTarget.y;

            const worldArrowDist = 85 * scale;
            const angle = Phaser.Math.Angle.Between(cx, cy, tx, ty);
            const aX = cx + Math.cos(angle) * worldArrowDist;
            const aY = cy + Math.sin(angle) * worldArrowDist;

            // 脉冲动态效果
            const t = this.time.now / 400;
            const pulse = 0.8 + 0.2 * Math.sin(t * Math.PI * 2);

            // 箭头主体（三角形），根据缩放因数自适应调整世界大小，确保物理视觉大小恒定
            const tipX = aX + Math.cos(angle) * 20 * pulse * scale;
            const tipY = aY + Math.sin(angle) * 20 * pulse * scale;
            const perpX = Math.cos(angle + Math.PI / 2) * 10 * scale;
            const perpY = Math.sin(angle + Math.PI / 2) * 10 * scale;
            const baseCX = aX - Math.cos(angle) * 10 * scale;
            const baseCY = aY - Math.sin(angle) * 10 * scale;

            this._guideArrow.fillStyle(0xffcc00, 0.9);
            this._guideArrow.fillTriangle(
                tipX, tipY,
                baseCX + perpX, baseCY + perpY,
                baseCX - perpX, baseCY - perpY
            );

            // 箭头光晕效果
            this._guideArrow.fillStyle(0xffcc00, 0.2);
            const glowSize = 1.6;
            this._guideArrow.fillTriangle(
                aX + Math.cos(angle) * 35 * pulse * scale, aY + Math.sin(angle) * 35 * pulse * scale,
                baseCX + perpX * glowSize, baseCY + perpY * glowSize,
                baseCX - perpX * glowSize, baseCY - perpY * glowSize
            );
        }
    }

    /**
     * ★ 关闭过桥指引
     */
    _deactivateGuide() {
        this._guideActive = false;
        window._streamGuideActive = false;
        window._streamGuideTarget = null;

        if (this._guideOverlay) { this._guideOverlay.destroy(); this._guideOverlay = null; }
        if (this._guideArrow) { this._guideArrow.destroy(); this._guideArrow = null; }
        if (this._guideHint) { this._guideHint.destroy(); this._guideHint = null; }

        console.log('过桥指引已关闭');
    }

    // ===================== 剧情触发 =====================

    /**
     * ★ 通过场景索引触发剧情
     */
    triggerStorySceneByIndex(sceneIdx) {
        const chapter1Data = window._chapter1Data;
        if (!chapter1Data || !chapter1Data.scenes) {
            console.error('第一章剧情数据未加载，无法触发剧情');
            return;
        }
        if (sceneIdx < 0 || sceneIdx >= chapter1Data.scenes.length) {
            console.error('场景索引无效:', sceneIdx);
            return;
        }

        console.log(`触发剧情: 场景索引 ${sceneIdx}`);
        window.uiManager.hideCollectPrompt();

        window._returnPlayerPos = {
            x: this.player.x,
            y: this.player.y,
            mapId: this.config.currentMapId
        };
        window._returnToStreamMap = true;

        // ★ 设置待处理的任务完成标记（剧情返回后由 _processQuestCompletions 处理）
        window._pendingQuestStoryIdx = sceneIdx;

        if (sceneIdx === 15) {
            window._streamGuideActive = true;
            window._streamGuideTarget = { x: 750, y: 1075 };
            console.log('▶ 激活过桥指引：目标 (750, 1075)');
        }

        // ★ C15d 结束后自动衔接 C16
        if (sceneIdx === 17) {
            window._chainC16AfterC15d = true;
            console.log('▶ C15d 结束后将自动衔接 C16');
        }

        // ★ C16 第一章结局 → 提示支线选择
        if (sceneIdx === 18) {
            window._chapter1Complete = true;
            console.log('▶ 第一章结束，返回后将提示支线选择');
        }

        this.scene.start('IntroScene', {
            debugMode: true,
            debugTargetIdx: sceneIdx,
            forceChapter1: chapter1Data,
            returnToGame: true
        });
    }

    /**
     * 触发第一章剧情场景
     */
    triggerStoryScene(npcData) {
        const chapter1Data = window._chapter1Data;
        if (!chapter1Data || !chapter1Data.scenes) {
            console.error('第一章剧情数据未加载，无法触发剧情');
            return;
        }
        if (npcData.storyIdx < 0 || npcData.storyIdx >= chapter1Data.scenes.length) {
            console.error('场景索引无效:', npcData.storyIdx);
            return;
        }

        console.log(`触发剧情: ${npcData.name} → 场景索引 ${npcData.storyIdx}`);
        npcData.interacted = true;

        if (!window._completedNpcs) window._completedNpcs = new Set();
        window._completedNpcs.add(npcData.npcId);

        // ★ 设置待处理的任务完成标记（剧情返回后由 _processQuestCompletions 处理）
        if (npcData.storyIdx !== undefined) {
            window._pendingQuestStoryIdx = npcData.storyIdx;
        }

        // 隐藏采集提示
        window.uiManager.hideCollectPrompt();

        window._returnPlayerPos = {
            x: this.player.x,
            y: this.player.y,
            mapId: this.config.currentMapId
        };

        this.scene.start('IntroScene', {
            debugMode: true,
            debugTargetIdx: npcData.storyIdx,
            forceChapter1: chapter1Data,
            returnToGame: true
        });
    }

    /**
     * ★ 处理待完成的任务（从剧情/事件返回时调用）
     * 根据 pendingQuestStoryIdx 查找并完成对应 quest
     */
    _processQuestCompletions() {
        const gsm = window.gameStateManager;
        if (!gsm) return;

        // 1. 处理 NPC/对象交互触发的任务完成
        if (window._pendingQuestStoryIdx !== undefined) {
            const storyIdx = window._pendingQuestStoryIdx;
            delete window._pendingQuestStoryIdx;
            this._completeQuestForStoryIdx(storyIdx);
        }

        // 2. ★ 首次进入平原时初始化任务
        if (this.config.currentMapId === 'plain') {
            const activeQuests = gsm.getActiveQuests('plain');
            if (activeQuests.length === 0 && gsm.getCompletedQuests('plain').length === 0) {
                console.log('[Quest] 🌿 首次进入平原，初始化任务');
                gsm.initQuests();
            }
        }

        // 3. 首次进入翠竹村时也确保任务已初始化
        if (this.config.currentMapId === 'village') {
            const hasAnyQuest = [...(window.QUESTS_DATA || [])].some(q => 
                q.mapId === 'village' && gsm.getQuestState(q.id) !== 'locked'
            );
            if (!hasAnyQuest) {
                console.log('[Quest] 🏘️ 首次进入翠竹村，初始化任务');
                gsm.initQuests();
            }
        }

        // 4. ★ 首次进入溪流地图时初始化溪流任务
        if (this.config.currentMapId === 'stream') {
            const hasAnyStreamQuest = [...(window.QUESTS_DATA || [])].some(q => 
                q.mapId === 'stream' && gsm.getQuestState(q.id) !== 'locked'
            );
            if (!hasAnyStreamQuest) {
                console.log('[Quest] 🏞️ 首次进入溪流山谷，初始化任务');
                gsm.initQuests();
            }
        }

        // 5. ★ C15d → C16 自动衔接
        if (window._chainC16AfterC15d) {
            delete window._chainC16AfterC15d;
            console.log('[Story] C15d 结束，自动衔接 C16...');
            this.time.delayedCall(300, () => {
                this.triggerStorySceneByIndex(18);
            });
        }

        // 6. ★ 第一章结局 → 提示是否开启支线「以毒攻毒」
        if (window._chapter1Complete) {
            delete window._chapter1Complete;
            console.log('[Story] 第一章完成，弹出支线选择...');
            this.time.delayedCall(500, () => {
                this._showSideStoryPrompt();
            });
        }
    }

    /**
     * ★ 第一章结局后弹出支线选择提示
     */
    _showSideStoryPrompt() {
        // 移除已有弹窗（防止重叠）
        const existing = document.getElementById('side_story_prompt_overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'side_story_prompt_overlay';
        overlay.style.cssText = [
            'position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:9999;',
            'display:flex; align-items:center; justify-content:center;',
            'background:rgba(0,0,0,0.75);',
            'font-family:"Microsoft YaHei","PingFang SC",sans-serif;'
        ].join('');

        const panel = document.createElement('div');
        panel.style.cssText = [
            'background:linear-gradient(135deg, #1a2a1a 0%, #0d1f0d 100%);',
            'border:2px solid #8b7355; border-radius:16px; padding:32px 40px;',
            'max-width:460px; width:90%; text-align:center;',
            'box-shadow:0 0 40px rgba(139,115,85,0.3);'
        ].join('');

        const title = document.createElement('div');
        title.textContent = '第一章 结束';
        title.style.cssText = 'color:#e8d8b8; font-size:24px; font-weight:bold; margin-bottom:8px;';

        const subtitle = document.createElement('div');
        subtitle.textContent = '翠竹村的春天';
        subtitle.style.cssText = 'color:#8b7355; font-size:14px; margin-bottom:20px;';

        const desc = document.createElement('div');
        desc.textContent = '是否开启支线剧情「以毒攻毒」？';
        desc.style.cssText = 'color:#c8b898; font-size:16px; line-height:1.6; margin-bottom:24px;';

        const hint = document.createElement('div');
        hint.textContent = '王大壮家·蟾酥与阴虚血瘀辨证';
        hint.style.cssText = 'color:#6b5b4b; font-size:13px; margin-bottom:24px;';

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex; gap:16px; justify-content:center;';

        const btnYes = document.createElement('button');
        btnYes.textContent = '是，开启支线';
        btnYes.style.cssText = [
            'padding:10px 28px; font-size:16px; border:none; border-radius:8px; cursor:pointer;',
            'background:#2a5a2a; color:#e8d8b8; font-weight:bold;',
            'transition:all 0.2s; border:1px solid #3a7a3a;'
        ].join('');

        const btnNo = document.createElement('button');
        btnNo.textContent = '稍后再说';
        btnNo.style.cssText = [
            'padding:10px 28px; font-size:16px; border:none; border-radius:8px; cursor:pointer;',
            'background:transparent; color:#8b7355;',
            'border:1px solid #5a4a3a; transition:all 0.2s;'
        ].join('');

        const self = this;
        const close = () => { overlay.remove(); };

        btnYes.addEventListener('mouseenter', () => { btnYes.style.background = '#3a7a3a'; });
        btnYes.addEventListener('mouseleave', () => { btnYes.style.background = '#2a5a2a'; });
        btnYes.addEventListener('click', () => {
            close();
            self._startSideStoryFlow();
        });

        btnNo.addEventListener('mouseenter', () => { btnNo.style.background = 'rgba(90,74,58,0.3)'; });
        btnNo.addEventListener('mouseleave', () => { btnNo.style.background = 'transparent'; });
        btnNo.addEventListener('click', () => {
            close();
            console.log('[Story] 玩家选择稍后开启支线');
        });

        btnRow.appendChild(btnYes);
        btnRow.appendChild(btnNo);
        panel.appendChild(title);
        panel.appendChild(subtitle);
        panel.appendChild(desc);
        panel.appendChild(hint);
        panel.appendChild(btnRow);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }

    /**
     * ★ 启动支线「以毒攻毒」
     */
    _startSideStoryFlow() {
        // 确保支线草药定义已注入图鉴
        if (window.SideStoryAPI && window.SideStoryAPI.ensureHerbDefinitions) {
            window.SideStoryAPI.ensureHerbDefinitions();
        }

        const url = 'src/data/side_story_poison_counter_poison.json';
        console.log('[SideStory] 加载支线数据:', url);

        fetch(`${url}?_=${Date.now()}`, { cache: 'no-cache' })
            .then(res => res.json())
            .then(storyData => {
                console.log('[SideStory] 支线数据已加载，启动 IntroScene');
                this.scene.start('IntroScene', {
                    debugMode: true,
                    debugTargetIdx: 0,
                    forceChapter1: storyData,
                    returnToGame: true
                });
            })
            .catch(err => {
                console.error('[SideStory] 支线数据加载失败:', err);
                // 兜底：用 SideStoryAPI
                if (window.SideStoryAPI && window.SideStoryAPI.start) {
                    window.SideStoryAPI.start('poison_counter_poison');
                }
            });
    }

    /**
     * 根据剧情索引完成对应 quest
     * @param {number} storyIdx - 在 story_chapter1.json.scenes 中的索引
     */
    _completeQuestForStoryIdx(storyIdx) {
        const gsm = window.gameStateManager;
        if (!gsm) return;

        // storyIdx → eventId 映射
        const idxToEvent = {
            1: 'EVT_FIRST_HERB',       // C02
            2: 'EVT_WOODCUTTER',       // C03
            3: 'EVT_ABANDONED_BASKET', // C04
            4: 'EVT_WASHERWOMAN',      // C05
            5: 'EVT_MERCHANT',         // C06
            6: 'EVT_VILLAGE_GATE',     // C07
            8: 'EVT_LAOLI_HERB_GARDEN',  // C09
            9: 'EVT_WELL_VILLAGER',      // C10
            10:'EVT_DRYING_PLATFORM',    // C11
            11:'EVT_EMPTY_SHOP',         // C12
            12:'EVT_ZHANG_DIAGNOSIS',    // C13
            // 溪流山谷 (stream)
            14:'EVT_VALLEY_ENTRY',       // C15a 进入溪谷
            15:'EVT_SHANYAO_COLLECTED',  // C15b 采集完山药
            16:'EVT_FOLLOWED_QINGMIAO',  // C15c 跟随青苗
            17:'EVT_VALLEY_CLEARING',    // C15d 发现蛊根草
            18:'EVT_RETURN_VILLAGE',      // C16 第一章结局
        };

        const eventId = idxToEvent[storyIdx];
        if (eventId) {
            const questId = gsm.completeQuestByEvent(eventId);
            if (questId) {
                console.log(`[Quest] ✅ 任务完成: ${questId} (scene ${storyIdx})`);
                if (window.uiManager && window.uiManager.flashQuestComplete) {
                    window.uiManager.flashQuestComplete(questId);
                }
            }
        }
    }

    /**
     * 根据地点的 locKey 完成对应 quest（村庄用）
     * @param {string} spotId - 地点 ID (如 'herb_garden')
     * @param {string} locKey - 地点完成 key (如 'loc_herb_garden')
     */
    _completeQuestForLocation(spotId, locKey) {
        const gsm = window.gameStateManager;
        if (!gsm || !locKey) return;

        const questId = gsm.completeQuestByLocation(locKey);
        if (questId) {
            console.log(`[Quest] ✅ 地点任务完成: ${questId} (${spotId})`);
            if (window.uiManager && window.uiManager.flashQuestComplete) {
                window.uiManager.flashQuestComplete(questId);
            }
        }
    }

    /**
     * 草药颜色
     */
    getHerbColor(type) {
        return this.config.herbColors[type] || this.config.herbColors[0];
    }

    /**
     * 根据当前地图 ID 播放对应 BGM
     * 映射：plain → 平原.mp3, village → 翠竹村.mp3, stream → 溪流山谷.mp3
     */
    _playMapBGM() {
        if (!window.audioManager) return;

        const mapId = this.config.currentMapId;
        let bgmKey = null;

        switch (mapId) {
            case 'plain':
                bgmKey = 'plain';
                break;
            case 'village':
                bgmKey = 'village';
                break;
            case 'stream':
                bgmKey = 'valley';
                break;
            default:
                console.log('[GameScene] 未知地图 ID，无对应 BGM:', mapId);
                return;
        }

        console.log('[GameScene] 播放地图 BGM:', mapId, '→', bgmKey);
        window.audioManager.playBGM(bgmKey);
    }
}

window.GameScene = GameScene;
console.log('GameScene.js: GameScene assigned to window');
