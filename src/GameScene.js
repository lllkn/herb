/**
 * 游戏场景模块 - GameScene
 * Phaser 游戏核心逻辑：预加载、创建、更新
 */

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // 游戏对象引用
        this.player = null;
        this.herbs = [];
        this.cursors = null;
        this.wasd = null;
        this.eKey = null;

        // 配置引用
        this.config = window.GameConfig;
        this.gameData = window.GameData;
    }

    /**
     * 预加载资源
     */
    preload() {
        // TODO: 在这里加载图片、音频等资源
        // 示例:
        // this.load.image('player', 'src/assets/player.png');
        // this.load.image('herb', 'src/assets/herb.png');
        console.log('GameScene: 预加载资源');
    }

    /**
     * 创建游戏对象
     */
    create() {
        const cfg = this.config;

        // 设置世界边界
        this.physics.world.setBounds(0, 0, cfg.WORLD_WIDTH, cfg.WORLD_HEIGHT);

        // 创建玩家角色
        this.createPlayer();

        // 创建草药
        this.createHerbs();

        // 创建障碍物
        this.createObstacles();

        // 配置摄像机
        this.setupCamera();

        // 设置输入控制
        this.setupInput();

        // 初始化 UI
        window.uiManager.updateBackpackUI();
        window.uiManager.updateHerbGuideUI();

        console.log('GameScene: 场景创建完成');
    }

    /**
     * 创建玩家角色
     */
    createPlayer() {
        const cfg = this.config;
        const playerCfg = cfg.player;

        // 使用 Graphics 绘制玩家外观
        const graphics = this.add.graphics();
        graphics.fillStyle(0x4a7c28, 1);
        graphics.fillCircle(0, 0, playerCfg.radius);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeCircle(0, 0, playerCfg.radius);

        // 方向指示器（三角形箭头）
        const directionIndicator = this.add.triangle(
            0, -25,
            8, 0,
            0, 15,
            16, 15,
            0xffffff
        );

        // 使用容器组合图形（放在屏幕中心位置）
        this.player = this.add.container(cfg.GAME_WIDTH / 2, cfg.GAME_HEIGHT / 2, [graphics, directionIndicator]);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(playerCfg.size, playerCfg.size);
    }

    /**
     * 创建草药对象
     */
    createHerbs() {
        const herbPositions = this.config.herbPositions;
        const HERBS_DATA = this.gameData.HERBS_DATA;

        herbPositions.forEach((pos) => {
            const herbData = HERBS_DATA[pos.type];
            
            // 绘制草药圆圈
            const herb = this.add.circle(pos.x, pos.y, 15, this.getHerbColor(pos.type));
            herb.setStrokeStyle(2, 0xffffff);

            // 草药名称标签
            const label = this.add.text(pos.x, pos.y + 25, herbData.name, {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#00000088',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5);

            // 存储到数组
            this.herbs.push({
                sprite: herb,
                label: label,
                data: herbData,
                collected: false
            });
        });
    }

    /**
     * 创建障碍物
     */
    createObstacles() {
        const obstacles = this.config.obstacles;

        obstacles.forEach(obs => {
            const rect = this.add.rectangle(obs.x, obs.y, obs.w, obs.h, 0x666666);
            rect.setStrokeStyle(2, 0x444444);
            this.physics.add.existing(rect, true);  // true = 静态物体
        });
    }

    /**
     * 配置摄像机
     */
    setupCamera() {
        const cameraCfg = this.config.camera;
        this.cameras.main.startFollow(this.player, true, cameraCfg.followLerpX, cameraCfg.followLerpY);
        this.cameras.main.setBounds(0, 0, this.config.WORLD_WIDTH, this.config.WORLD_HEIGHT);
    }

    /**
     * 设置输入控制
     */
    setupInput() {
        // 方向键
        this.cursors = this.input.keyboard.createCursorKeys();

        // WASD 键
        this.wasd = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        // E 键 - 采集
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // F12 - 调试模式
        this.input.keyboard.on('keydown-F12', () => {
            const isDebug = window.gameStateManager.toggleDebugMode();
            window.uiManager.toggleDebugPanel(isDebug);
        });

        // B 键 - 背包
        this.input.keyboard.on('keydown-B', () => {
            window.uiManager.openModal('backpack-modal');
        });

        // T 键 - 图鉴
        this.input.keyboard.on('keydown-T', () => {
            window.uiManager.openModal('herb-guide-modal');
        });

        // ESC 关闭弹窗
        this.input.keyboard.on('keydown-ESC', () => {
            window.uiManager.closeAllModals();
        });
    }

    /**
     * 每帧更新
     */
    update() {
        if (!this.player || !this.player.body) return;

        // 更新玩家移动
        this.updatePlayerMovement();

        // 更新方向指示器
        this.updateDirectionIndicator();

        // 更新小地图
        window.uiManager.updateMinimap(this.player.x, this.player.y);

        // 检测草药采集
        this.checkHerbCollection();

        // 更新调试信息
        if (window.gameStateManager.state.debugMode) {
            window.uiManager.updateDebugInfo({
                x: this.player.x,
                y: this.player.y,
                time: window.gameStateManager.state.currentTime,
                fps: this.game?.loop?.actualFps
            });
        }
    }

    /**
     * 更新玩家移动
     */
    updatePlayerMovement() {
        const speed = this.config.player.speed;
        let velocityX = 0;
        let velocityY = 0;

        // 检测方向键/WASD输入
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            velocityX = -speed;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            velocityX = speed;
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            velocityY = speed;
        }

        // 对角线移动速度修正
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= this.config.player.diagonalFactor;
            velocityY *= this.config.player.diagonalFactor;
        }

        this.player.body.setVelocity(velocityX, velocityY);
    }

    /**
     * 更新方向指示器旋转角度
     */
    updateDirectionIndicator() {
        if (!this.player || this.player.length < 2) return;

        const directionIndicator = this.player.getAt(1);
        const body = this.player.body;

        if (body.velocity.x > 0) {
            directionIndicator.setRotation(0);
        } else if (body.velocity.x < 0) {
            directionIndicator.setRotation(Math.PI);
        } else if (body.velocity.y < 0) {
            directionIndicator.setRotation(-Math.PI / 2);
        } else if (body.velocity.y > 0) {
            directionIndicator.setRotation(Math.PI / 2);
        }
    }

    /**
     * 检测并处理草药采集
     */
    checkHerbCollection() {
        if (!this.player) return;

        let nearHerb = null;
        const collectDistance = this.config.player.collectDistance;

        this.herbs.forEach(herb => {
            if (herb.collected) return;

            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                herb.sprite.x, herb.sprite.y
            );

            if (distance < collectDistance) {
                nearHerb = herb;
            }
        });

        if (nearHerb) {
            window.uiManager.showCollectPrompt(nearHerb.data.name);

            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.collectHerb(nearHerb);
            }
        } else {
            window.uiManager.hideCollectPrompt();
        }
    }

    /**
     * 执行采集操作
     * @param {Object} herb - 草药对象
     */
    collectHerb(herb) {
        // 标记为已采集
        herb.collected = true;
        herb.sprite.setVisible(false);
        herb.label.setVisible(false);

        // 更新游戏状态
        window.gameStateManager.addHerbToBackpack(herb.data.id);

        // 显示成功提示
        window.uiManager.showCollectSuccess(herb.data.name);

        // 更新所有相关 UI
        window.uiManager.updateBackpackUI();
        window.uiManager.updateHerbGuideUI();
        window.uiManager.updateTaskProgress();
    }

    /**
     * 根据类型获取草药颜色
     * @param {number} type - 草药类型索引
     * @returns {number} 颜色值
     */
    getHerbColor(type) {
        const colors = this.config.herbColors;
        return colors[type] || colors[0];
    }
}

// 导出供其他模块使用
window.GameScene = GameScene;
