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
    }

    /**
     * 预加载资源
     */
    preload() {
        console.log('GameScene: 预加载资源...');
        
        const mapId = this.config.currentMapId;
        const mapConfig = this.config.maps[mapId];

        if (mapConfig) {
            // 清除旧的地图缓存，防止切换地图时键冲突
            if (this.cache.json.exists('gameMap')) {
                this.cache.json.remove('gameMap');
                console.log('已清除旧缓存: gameMap');
            }
            
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
            
            // 直接加载原始 Tiled JSON 数据，手动解析外部 tileset
            this.load.json('gameMap', mapConfig.jsonPath);
            
            // 加载瓦片图片
            if (mapConfig.tileImages) {
                mapConfig.tileImages.forEach((imgPath, index) => {
                    const key = `tileset_${index}`;
                    this.load.image(key, imgPath);
                });
            }
            console.log(`预加载地图: ${mapId} - ${mapConfig.jsonPath}`);
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
        const herbTextures = ['gancao', 'jinyinhua', 'hongjingtian'];
        herbTextures.forEach(id => {
            this.load.image(`herb_${id}`, `src/assets/pictures/herbs/${id}.png`);
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

        // 生成对象纹理（草药/NPC/传送门图标，替代圆圈）
        this.generateObjectTextures();

        // 加载地图（需要先加载，以便确定世界边界）
        this.tryLoadMap();
        
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
     */
    tryLoadMap() {
        const mapId = this.config.currentMapId;
        const mapConfig = this.config.maps[mapId];

        if (!mapConfig) {
            console.warn('未找到地图配置');
            return;
        }

        if (this.cache.json.exists('gameMap')) {
            console.log('tryLoadMap: 已缓存 gameMap，直接初始化');
            this._rawMapJson = this.cache.json.get('gameMap');
            this.initTiledMap();
            return;
        }

        if (this.cache.json.get('gameMap')) {
            console.log('tryLoadMap: 从缓存 json 创建');
            this._rawMapJson = this.cache.json.get('gameMap');
            this.initTiledMap();
            return;
        }

        this.loadMapFallback(mapConfig);
    }

    /**
     * 备用加载地图 JSON（Fetch 回退）
     */
    loadMapFallback(mapConfig) {
        console.warn('地图 JSON 未加载，尝试备用加载...');
        fetch(mapConfig.jsonPath)
            .then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(data => {
                console.log('fetch 加载成功，手动创建地图...');
                if (!this.cache.json.exists('gameMap')) {
                    this.cache.json.add('gameMap', data);
                }
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
                        return ts.name === base || srcBase === base;
                    });

                    const firstgid = tsInfo ? tsInfo.firstgid : (index === 0 ? 1 : 0);
                    let tsName = `tileset_${index}`;
                    if (tsInfo) {
                        if (tsInfo.name) tsName = tsInfo.name;
                        else if (tsInfo.source) tsName = tsInfo.source.split('/').pop().replace(/\.[^.]+$/, '');
                    }

                    console.log(`手动模式: 关联 ${tsName} -> ${key}, firstgid=${firstgid}`);
                    const ts = this.tiledMap.addTilesetImage(
                        tsName,
                        key,
                        this.tiledMap.tileWidth,
                        this.tiledMap.tileHeight,
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
                            ? this.tiledMap.createBlankLayer(layerName, loadedTilesets, 0, 0)
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
            const map = this.make.tilemap({ key: 'gameMap' });
            if (!map) {
                throw new Error('make.tilemap(key=gameMap) 返回 null');
            }

            this.tiledMap = map;
            this._rawMapJson = this.cache.json.get('gameMap');
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
                        return ts.name === base || srcBase === base;
                    });

                    const firstgid = tsInfo ? tsInfo.firstgid : (index === 0 ? 1 : 0);
                    let tsName = `tileset_${index}`;
                    if (tsInfo) {
                        if (tsInfo.name) {
                            tsName = tsInfo.name;
                        } else if (tsInfo.source) {
                            const fileName = tsInfo.source.split('/').pop();
                            tsName = fileName ? fileName.replace(/\.[^.]+$/, '') : tsName;
                        }
                    }

                    console.log(`加载缓存 tilemap 瓦片集: ${tsName} -> ${key}, firstgid=${firstgid}`);
                    const ts = map.addTilesetImage(
                        tsName,
                        key,
                        map.tileWidth,
                        map.tileHeight,
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
            const mapData = this.cache.json.get('gameMap');
            if (mapData) {
                this.createMapFromData(mapData, mapConfig);
            } else {
                this.showError('无法创建地图: 缓存 tilemap 和 JSON 数据均不可用');
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

            // 0. 获取原始 JSON 数据（缓存区）
            this._rawMapJson = this.cache.json.get('gameMap');
            if (!this._rawMapJson) {
                console.warn('JSON缓存中无 gameMap，尝试备用加载...');
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
        
        layer.objects.forEach(obj => {
            const type = (obj.type || obj.class || '').toLowerCase();
            
            if (type === 'herb') {
                this.createHerb(obj);
            } else if (type === 'herbs') {
                // 地图中 type="herbs" 的实际是剧情触发甘草（非采集）
                this.createStoryHerb(obj);
            } else if (type === 'portal') {
                this.createPortal(obj);
            } else if (type === 'npc') {
                this.createNPC(obj);
            } else if (type === 'object') {
                // 交互物（废弃药篓等），直接复用 createNPC 的交互逻辑
                this.createNPC(obj);
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
    createHerb(obj) {
        const props = this._parseProps(obj);
        const herbId = props.herbId || 'gancao';
        const herbData = this.gameData.HERBS_DATA.find(h => h.id === herbId);
        if (!herbData) return;

        const x = obj.x;
        const y = obj.y;

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
    createPortal(obj) {
        const props = this._parseProps(obj);
        const targetMap = props.targetMap || '';
        const x = obj.x + (obj.width || 0) / 2;
        const y = obj.y + (obj.height || 0) / 2;

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
     * 创建 NPC / 交互物（加载图片并显示在地图上）
     * 存储交互数据用于 E 键触发第一章剧情
     */
    createNPC(obj) {
        const props = this._parseProps(obj);
        let npcId = props.npc_id || '';
        const name = (obj.name || props.name || 'NPC').trim();

        // 对于没有 npc_id 的交互物（如药篓），从名称映射
        const nameToId = {
            '药篓': 'abandoned_basket',
        };
        if (!npcId && nameToId[name]) {
            npcId = nameToId[name];
        }

        const storyIdx = this._npcStorySceneMap[npcId] !== undefined
            ? this._npcStorySceneMap[npcId]
            : -1;

        // ★ 剧情已完成 → 不再创建精灵和交互数据
        if (npcId && window._completedNpcs && window._completedNpcs.has(npcId)) {
            console.log(`NPC/交互物: "${name}" (${npcId}) 剧情已完成，跳过创建`);
            return;
        }

        // 精灵锚点(0.5, 1) → 底部中心对齐对象中心
        const spriteX = obj.x + (obj.width || 0) / 2;
        const spriteY = obj.y + (obj.height || 0) / 2;

        // 交互检测坐标（与精灵位置一致）
        const interactX = spriteX;
        const interactY = spriteY;

        console.log(`NPC/交互物: "${name}" (${npcId}) → 剧情索引: ${storyIdx}, 位置: (${spriteX}, ${spriteY})`);

        // 创建精灵（先尝试 npc_ 前缀，再尝试 obj_ 前缀）
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
            // 如果没有对应纹理，生成一个占位图标
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
    createStoryHerb(obj) {
        const props = this._parseProps(obj);
        const herbId = props.herbId || 'gancao';
        const storyIdx = this._npcStorySceneMap[herbId] !== undefined
            ? this._npcStorySceneMap[herbId]
            : -1;

        console.log(`剧情交互物: ${herbId} → 剧情索引: ${storyIdx}`);

        this.npcs.push({
            name: '甘草',
            npcId: herbId,
            x: obj.x + (obj.width || 0) / 2,
            y: obj.y + (obj.height || 0) / 2,
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
     * 备用：用背景图片
     */
    useBackgroundImage() {
        console.log('使用背景图片模式');
        // 可以用 src/assets/picture/地图.png 作为背景
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

        // 停止跟随玩家并隐藏玩家和草药（小地图只显示地形，不显示草药）
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
     * 创建玩家（精灵表动画版）
     * 精灵表 1920×1920，480px/帧，4列×4行=16帧
     * 行0=下 行1=左 行2=右 行3=上，每行4帧
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

        // ── 创建物理精灵（480px/帧，缩小至约192px显示）──
        this.player = this.physics.add.sprite(startX, startY, 'player', 0);
        this.player.setScale(0.4);
        this.player.body.setCollideWorldBounds(true);

        const bodyWidth = 80;
        const bodyHeight = 100;
        this.player.body.setSize(bodyWidth, bodyHeight, true);

        this.player.setDepth(10);
        this.player.anims.play('idle');

        console.log('✅ 玩家创建完成（终稿精灵表 1920x1920，480px/帧，4×4=16帧）');
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
            herb.setDepth(4);  // ★ 在地面图层之上

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

        // 溪流地图缩小显示（2400×1792，zoom 0.55 使视口 2327px 不超出地图宽度 2400px，避免漏出背景）
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
        // ★ 确保键盘输入处于启用状态（修复从剧情场景返回时键盘被禁用的问题）
        if (!this.input || !this.input.keyboard) {
            console.warn('GameScene: 输入插件未初始化，跳过键盘设置');
            return;
        }

        this.input.keyboard.enabled = true;
        
        // ★ 重置键盘状态，清除场景切换时可能残留的按键按下状态
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
        this.checkPortalInteraction();  // ★ 传送门 E 键交互

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
        window.uiManager.updateTaskProgress();

        // ★ 甘草采集计数 → 采完3株后触发 C02 第一株甘草剧情
        console.log(`[collect] herbId=${herb.data.id}, name=${herb.data.name}`);
        if (herb.data.id === 'gancao') {
            const completed = window._completedNpcs && window._completedNpcs.has('gancao');
            if (completed) return;

            window._gancaoCollected = (window._gancaoCollected || 0) + 1;
            const remaining = this.herbs.filter(h => h.data.id === 'gancao' && !h.collected).length;
            console.log(`甘草采集进度: ${window._gancaoCollected}/3, 剩余: ${remaining}`);

            if (window._gancaoCollected >= 3) {
                this.time.delayedCall(600, () => {
                    console.log('▶ 触发 C02 第一株甘草剧情');
                    this.triggerStoryScene({
                        name: '甘草',
                        npcId: 'gancao',
                        storyIdx: this._npcStorySceneMap['gancao'] || 1
                    });
                });
            }
        }
    }

    /**
     * 检测 NPC 交互（E 键触发第一章剧情）
     */
    checkNPCInteraction() {
        if (!this.player || !this.eKey) return;
        const interactDist = 80; // NPC 交互距离

        let nearNpc = null;
        this.npcs.forEach(npc => {
            if (npc.storyIdx < 0) return;
            const d = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, npc.x, npc.y
            );
            if (d < interactDist) nearNpc = npc;
        });

        if (nearNpc) {
            // 显示 E 键交互提示
            window.uiManager.showCollectPrompt(`与${nearNpc.name}对话`);
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.triggerStoryScene(nearNpc);
            }
        }
        // 注意：如果同时在草药附近，checkCollection 的提示会覆盖此提示，功能正常
    }

    /**
     * 检测传送门交互（E 键传送）
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
     * 触发第一章剧情场景（切换到 IntroScene 播放指定场景）
     * @param {Object} npcData - NPC 交互数据 { name, storyIdx }
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

        // ★ 标记该 NPC 剧情已完成，返回后不再显示
        if (!window._completedNpcs) window._completedNpcs = new Set();
        window._completedNpcs.add(npcData.npcId);

        // 隐藏采集提示
        window.uiManager.hideCollectPrompt();

        // ★ 保存当前玩家位置，剧情结束后恢复
        window._returnPlayerPos = {
            x: this.player.x,
            y: this.player.y,
            mapId: this.config.currentMapId
        };

        // 使用 IntroScene 播放指定剧情场景，播放完毕自动返回 GameScene
        this.scene.start('IntroScene', {
            debugMode: true,
            debugTargetIdx: npcData.storyIdx,
            forceChapter1: chapter1Data,
            returnToGame: true   // ★ 剧情结束后自动返回游戏，不显示调试提示
        });
    }

    /**
     * 草药颜色
     */
    getHerbColor(type) {
        return this.config.herbColors[type] || this.config.herbColors[0];
    }
}

window.GameScene = GameScene;
console.log('GameScene.js: GameScene assigned to window');
