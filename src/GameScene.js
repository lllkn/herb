/**
 * 游戏场景模块 - GameScene
 * Phaser 游戏核心逻辑
 */

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.player = null;
        this.herbs = [];
        this.cursors = null;
        this.wasd = null;
        this.eKey = null;
        this.tiledMap = null;

        this.config = window.GameConfig;
        this.gameData = window.GameData;
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
                console.log('已清除旧地图JSON缓存');
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
            
            // 使用 Phaser 内置的 Tiled JSON 加载
            this.load.tilemapTiledJSON('gameMap', mapConfig.jsonPath);
            
            // 加载瓦片图片
            if (mapConfig.tileImages) {
                mapConfig.tileImages.forEach((imgPath, index) => {
                    const key = `tileset_${index}`;
                    this.load.image(key, imgPath);
                });
            }
            console.log(`预加载地图: ${mapId} - ${mapConfig.jsonPath}`);
        }
    }

    /**
     * 创建游戏
     */
    create() {
        console.log('GameScene: 开始创建...');
        
        // 加载地图（需要先加载，以便确定世界边界）
        this.tryLoadMap();
        
        // 创建玩家
        this.createPlayer();
        
        // 如果没地图，用默认
        if (!this.tiledMap) {
            console.log('使用默认地图设置');
            this.physics.world.setBounds(0, 0, this.config.WORLD_WIDTH, this.config.WORLD_HEIGHT);
            this.createHerbs();
        }
        
        // 设置玩家初始位置
        const mapConfig = this.config.maps[this.config.currentMapId];
        if (mapConfig && mapConfig.playerStart && this.player) {
            this.player.x = mapConfig.playerStart.x;
            this.player.y = mapConfig.playerStart.y;
            console.log('玩家初始位置:', this.player.x, this.player.y);
        }
        
        // 摄像机
        this.setupCamera();
        
        // 输入
        this.setupInput();
        
        // UI
        window.uiManager.updateBackpackUI();
        window.uiManager.updateHerbGuideUI();
        window.uiManager.updateMinimapTitle();

        // 生成小地图缩略图并初始化玩家位置
        this.generateMinimap();
        if (this.player) {
            window.uiManager.updateMinimap(this.player.x, this.player.y);
        }

        console.log('GameScene: 创建完成');
    }

    /**
     * 尝试加载 Tiled 地图
     */
    tryLoadMap() {
        const mapId = this.config.currentMapId;
        const mapConfig = this.config.maps[mapId];

        if (!mapConfig) {
            console.error('未找到地图配置:', mapId);
            this.showError('未找到地图配置: ' + mapId);
            return;
        }

        // 检查缓存中是否有地图数据
        if (!this.cache.json.exists('gameMap')) {
            console.warn('地图 JSON 未加载，尝试备用加载...');
            this.loadMapFallback(mapConfig);
            return;
        }

        this.initTiledMap();
    }
    
    /**
     * 备用加载方案：使用 fetch
     */
    loadMapFallback(mapConfig) {
        console.log('使用 fetch 加载地图 JSON...');
        
        fetch(mapConfig.jsonPath)
            .then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(data => {
                console.log('fetch 加载成功，手动创建地图...');
                this.createMapFromData(data, mapConfig);
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
            
            if (mapConfig.tileImages) {
                mapConfig.tileImages.forEach((imgPath, index) => {
                    const key = `tileset_${index}`;
                    
                    // 检查图片是否已加载
                    if (this.textures.exists(key)) {
                        const tsName = 'tileset_' + index;
                        
                        // 从 mapData.tilesets 获取 firstgid
                        const tsInfo = mapData.tilesets ? mapData.tilesets[index] : null;
                        const firstgid = tsInfo ? tsInfo.firstgid : (index === 0 ? 1 : 0);
                        
                        console.log(`手动模式: 关联 ${tsName} -> ${key}, firstgid=${firstgid}`);
                        
                        // 传入完整的 addTilesetImage 参数，包括 firstgid
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
                            console.log('  ✓ 成功, tileCount=' + ts.total);
                        } else {
                            console.warn('  ✗ addTilesetImage 失败');
                        }
                    } else {
                        console.warn('  ✗ 纹理不存在:', key);
                    }
                });
            }
            
            console.log('成功加载瓦片集数量:', loadedTilesets.length);
            
            // 3. 创建图层
            if (mapData.layers) {
                let layerCount = 0;
                
                mapData.layers.forEach((layer, index) => {
                    console.log(`图层[${index}]:`, layer.name, '类型:', layer.type);
                    
                    if (layer.type === 'tilelayer' && layer.data) {
                        // 创建空白图层 - 传入所有瓦片集
                        const layerName = layer.name || 'Layer_' + index;
                        
                        // 使用所有加载的瓦片集
                        const tileLayer = loadedTilesets.length > 0 
                            ? this.tiledMap.createBlankLayer(layerName, loadedTilesets, 0, 0)
                            : null;
                        
                        if (tileLayer) {
                            // 填充瓦片数据
                            const dataLen = layer.data ? layer.data.length : 0;
                            const expectedLen = layer.width * layer.height;
                            
                            if (dataLen !== expectedLen) {
                                console.warn('图层数据长度不匹配:', dataLen, '!=', expectedLen);
                            }
                            
                            for (let y = 0; y < layer.height; y++) {
                                for (let x = 0; x < layer.width; x++) {
                                    const idx = y * layer.width + x;
                                    if (idx < dataLen) {
                                        const gid = layer.data[idx];
                                        if (gid > 0) {
                                            try {
                                                tileLayer.putTileAt(gid, x, y);
                                            } catch(e) {
                                                // 忽略单个瓦片放置错误
                                            }
                                        }
                                    }
                                }
                            }
                            
                            layerCount++;
                            console.log('✓ 图层创建成功:', layerName, '瓦片数:', dataLen);
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
            
            console.log('===== 手动地图创建完成:', w, 'x', h, '=====');

            // 保存地图实际尺寸供小地图使用
            this.config.currentMapWidth = w;
            this.config.currentMapHeight = h;

            // 5. 设置背景色
            this.cameras.main.setBackgroundColor('#1a3a0a');

            // 生成小地图缩略图（异步加载完成后）
            this.generateMinimap();

        } catch (e) {
            console.error('===== 手动创建地图失败 =====');
            console.error(e);
            this.showError('地图创建失败: ' + e.message);
            this.tiledMap = null;
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

            // 1. 创建 tilemap
            this.tiledMap = this.make.tilemap({ key: 'gameMap' });

            if (!this.tiledMap) {
                console.error('Tilemap 创建失败');
                this.tiledMap = null;
                return;
            }

            console.log('Tilemap 创建成功');
            console.log('  尺寸:', this.tiledMap.width, 'x', this.tiledMap.height);
            console.log('  瓦片:', this.tiledMap.tileWidth, 'x', this.tiledMap.tileHeight);

            // 2. 加载瓦片集图片
            const jsonTilesets = this.tiledMap.tilesets;
            console.log('JSON 中瓦片集数量:', jsonTilesets.length);

            const loadedTilesets = [];

            for (let i = 0; i < jsonTilesets.length; i++) {
                const tsInfo = jsonTilesets[i];

                // 从 JSON 获取名称（外部引用只有 source，需要提取文件名）
                let tsName = tsInfo.name;
                if (!tsName && tsInfo.source) {
                    tsName = tsInfo.source.replace(/^.*[\\/]/, '').replace('.tsx', '');
                }
                if (!tsName) {
                    tsName = 'tileset_' + i;
                }

                const imgKey = `tileset_${i}`;

                console.log(`[${i}] 瓦片集: name="${tsName}", firstgid=${tsInfo.firstgid || 'unknown'}`);

                // 检查纹理是否存在
                if (!this.textures.exists(imgKey)) {
                    console.warn(`  ✗ 纹理不存在: ${imgKey}`);
                    continue;
                }

                // 获取纹理尺寸（调试用）
                const texture = this.textures.get(imgKey);
                const src = texture.getSourceImage();
                console.log(`  图片尺寸: ${src.width}x${src.height}`);

                // 关联图片 - 传入完整参数（tileWidth, tileHeight, margin, spacing, gid）
                // gid 就是 JSON 中的 firstgid，确保瓦片ID正确映射
                const ts = this.tiledMap.addTilesetImage(
                    tsName,
                    imgKey,
                    this.tiledMap.tileWidth,   // 16
                    this.tiledMap.tileHeight,  // 16
                    0,                         // margin
                    0,                         // spacing
                    tsInfo.firstgid || 1       // 关键：传入正确的 firstgid
                );

                if (ts) {
                    loadedTilesets.push(ts);
                    console.log(`  ✓ 关联成功, tileCount=${ts.total}`);
                } else {
                    console.warn(`  ✗ 关联失败`);
                }
            }

            console.log('成功关联瓦片集:', loadedTilesets.length, '/', jsonTilesets.length);

            // 3. 创建图层
            const layers = this.tiledMap.layers;
            console.log('图层数量:', layers.length);

            let layerCount = 0;
            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];

                if (layer.type === 'TileLayer') {
                    console.log(`创建图层[${i}]: "${layer.name}"`);

                    // 传入所有已加载的 tilesets
                    const tileLayer = loadedTilesets.length > 0
                        ? this.tiledMap.createLayer(layer.name, loadedTilesets, 0, 0)
                        : this.tiledMap.createLayer(layer.name);

                    if (tileLayer) {
                        layerCount++;
                        tileLayer.setDepth(i);
                        console.log(`  ✓ 成功`);
                    } else {
                        console.warn(`  ✗ 失败`);
                    }
                }
            }

            console.log(`成功创建 ${layerCount} 个图层`);

            // 4. 加载对象层（草药、传送门、NPC）
            const objectLayers = this.tiledMap.layers.filter(l =>
                l.type === 'ObjectLayer' || l.type === 'objectgroup'
            );
            console.log('对象层数量:', objectLayers.length);
            objectLayers.forEach(layer => this.loadObjects(layer));

            // 5. 设置世界边界
            const w = this.tiledMap.widthInPixels;
            const h = this.tiledMap.heightInPixels;
            this.physics.world.setBounds(0, 0, w, h);
            this.cameras.main.setBounds(0, 0, w, h);

            console.log('===== 地图加载完成:', w, 'x', h, '=====');

            // 保存地图实际尺寸供小地图使用
            this.config.currentMapWidth = w;
            this.config.currentMapHeight = h;

        } catch (e) {
            console.error('===== 地图初始化失败 =====');
            console.error(e);
            this.showError('地图初始化失败: ' + e.message);
            this.tiledMap = null;
        }
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
            } else if (type === 'portal') {
                this.createPortal(obj);
            } else if (type === 'npc') {
                this.createNPC(obj);
            }
        });
    }

    /**
     * 创建草药
     */
    createHerb(obj) {
        const props = obj.properties || {};
        const herbId = props.herbId || 'gancao';
        const herbData = this.gameData.HERBS_DATA.find(h => h.id === herbId);
        if (!herbData) return;

        const x = obj.x;
        const y = (obj.y || 0) - (obj.height || 30) / 2;
        
        const herb = this.add.circle(x, y, 15, 0x4a7c28);
        herb.setStrokeStyle(2, 0xffffff);
        
        const label = this.add.text(x, y + 25, herbData.name, {
            fontSize: '12px', color: '#ffffff',
            backgroundColor: '#00000088', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.herbs.push({ sprite: herb, label, data: herbData, collected: false });
    }

    /**
     * 创建传送门
     */
    createPortal(obj) {
        const props = obj.properties || {};
        const x = obj.x;
        const y = (obj.y || 0) - (obj.height || 40) / 2;
        
        const portal = this.add.circle(x, y, 25, 0x6644ff, 0.6);
        portal.setStrokeStyle(3, 0xaa88ff);
        portal.portalData = {
            targetMap: props.targetMap || '',
            targetX: props.targetX || 100,
            targetY: props.targetY || 100
        };
        
        portal.setInteractive();
        portal.on('pointerdown', () => {
            if (portal.portalData.targetMap) {
                this.config.currentMapId = portal.portalData.targetMap;
                this.scene.restart();
            }
        });
    }

    /**
     * 创建 NPC
     */
    createNPC(obj) {
        const props = obj.properties || {};
        const name = props.name || 'NPC';
        const x = obj.x;
        const y = (obj.y || 0) - (obj.height || 36) / 2;
        
        const npc = this.add.circle(x, y, 18, 0xffcc44);
        npc.setStrokeStyle(2, 0xaa8800);
        
        const label = this.add.text(x, y - 35, name, {
            fontSize: '12px', color: '#ffcc00',
            backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        
        npc.setInteractive();
        npc.on('pointerdown', () => console.log('与', name, '对话'));
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

        // 停止跟随玩家并隐藏玩家
        this.cameras.main.stopFollow();
        this.player.setVisible(false);

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
        const p = cfg.player;

        const graphics = this.add.graphics();
        graphics.fillStyle(0x4a7c28, 1);
        graphics.fillCircle(0, 0, p.radius);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeCircle(0, 0, p.radius);

        const arrow = this.add.triangle(0, -25, 8, 0, 0, 15, 16, 15, 0xffffff);

        this.player = this.add.container(cfg.GAME_WIDTH / 2, cfg.GAME_HEIGHT / 2, [graphics, arrow]);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(p.size, p.size);
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

            const label = this.add.text(pos.x, pos.y + 25, data.name, {
                fontSize: '12px', color: '#ffffff',
                backgroundColor: '#00000088', padding: { x: 4, y: 2 }
            }).setOrigin(0.5);

            this.herbs.push({ sprite: herb, label, data, collected: false });
        });
    }

    /**
     * 摄像机
     */
    setupCamera() {
        const cam = this.config.camera;
        this.cameras.main.startFollow(this.player, true, cam.followLerpX, cam.followLerpY);
    }

    /**
     * 输入
     */
    setupInput() {
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
    }

    /**
     * 每帧更新
     */
    update() {
        if (!this.player || !this.player.body) return;

        this.updateMovement();
        this.updateArrow();
        window.uiManager.updateMinimap(this.player.x, this.player.y);
        this.checkCollection();

        if (window.gameStateManager.state.debugMode) {
            window.uiManager.updateDebugInfo({
                x: this.player.x, y: this.player.y,
                time: window.gameStateManager.state.currentTime,
                fps: this.game?.loop?.actualFps
            });
        }
    }

    /**
     * 移动
     */
    updateMovement() {
        const speed = this.config.player.speed;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
        else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;

        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
        else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;

        if (vx && vy) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.body.setVelocity(vx, vy);
    }

    /**
     * 箭头方向
     */
    updateArrow() {
        if (this.player.length < 2) return;
        const arrow = this.player.getAt(1);
        const b = this.player.body;

        if (b.velocity.x > 0) arrow.setRotation(0);
        else if (b.velocity.x < 0) arrow.setRotation(Math.PI);
        else if (b.velocity.y < 0) arrow.setRotation(-Math.PI / 2);
        else if (b.velocity.y > 0) arrow.setRotation(Math.PI / 2);
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
        herb.label.setVisible(false);

        window.gameStateManager.addHerbToBackpack(herb.data.id);
        window.uiManager.showCollectSuccess(herb.data.name);
        window.uiManager.updateBackpackUI();
        window.uiManager.updateHerbGuideUI();
        window.uiManager.updateTaskProgress();
    }

    /**
     * 草药颜色
     */
    getHerbColor(type) {
        return this.config.herbColors[type] || this.config.herbColors[0];
    }
}

window.GameScene = GameScene;
