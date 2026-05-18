// 百草行 - 主游戏入口
// Phase 1 MVP: HTML5 Canvas + Vanilla JS

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0D1A0D',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // 改为true可查看碰撞体
        }
    },
    scene: [BootScene, GameScene]
};

// 启动游戏
const game = new Phaser.Game(config);

// 全局游戏对象
window.BaiCaoXing = {
    game: game,
    config: config
};

// ============================================
// 启动场景 - 加载资源
// ============================================
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 创建加载进度条
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: '百草行 - loading...',
            style: {
                font: '20px Microsoft YaHei',
                fill: '#F2EAD3'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px Microsoft YaHei',
                fill: '#F2EAD3'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0x3A6B45, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // 生成玩家Sprite Sheet
        this.generatePlayerSprite();
        
        // 生成测试Tiles
        this.generateTiles();
    }

    create() {
        console.log('百草行 - 游戏加载完成');
        console.log('提示：按F12打开调试面板');
        this.scene.start('GameScene');
    }

    generatePlayerSprite() {
        // 使用PlayerSpriteGenerator生成Sprite Sheet
        if (typeof PlayerSpriteGenerator === 'undefined') {
            console.error('PlayerSpriteGenerator未加载！');
            return;
        }

        const generator = new PlayerSpriteGenerator(this);
        generator.generatePlayerSpriteSheet();
        generator.generateTestTiles();
    }

    generateTiles() {
        // 生成地图Tile（草地、石头）
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // 草地Tile
        ctx.fillStyle = '#5A8A5A';
        ctx.fillRect(0, 0, 32, 32);
        
        // 草地纹理
        ctx.fillStyle = '#6A9A6A';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 28;
            const y = Math.random() * 28;
            ctx.fillRect(x, y, 2, 3);
        }

        const image = new Image();
        image.src = canvas.toDataURL();
        image.onload = () => {
            this.textures.addImage('tile_grass', image);
        };

        // 石头Tile（障碍物）
        const canvas2 = document.createElement('canvas');
        canvas2.width = 32;
        canvas2.height = 32;
        const ctx2 = canvas2.getContext('2d');
        
        ctx2.fillStyle = '#6A6A6A';
        ctx2.beginPath();
        ctx2.arc(16, 16, 14, 0, Math.PI * 2);
        ctx2.fill();
        
        ctx2.fillStyle = '#7A7A7A';
        ctx2.beginPath();
        ctx2.arc(12, 12, 4, 0, Math.PI * 2);
        ctx2.fill();

        const image2 = new Image();
        image2.src = canvas2.toDataURL();
        image2.onload = () => {
            this.textures.addImage('tile_rock', image2);
        };

        console.log('✅ Tiles生成成功');
    }
}

// ============================================
// 主游戏场景
// ============================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.cursors = null;
        this.herbs = null;
        this.collectedHerbs = [];
        this.cameraFollowSpeed = 0.05; // lerp速度
    }

    create() {
        console.log('🎮 主游戏场景启动');

        // 创建Tilemap
        this.createTilemap();

        // 创建玩家（使用生成的Sprite）
        this.createPlayer();

        // 创建草药（测试用）
        this.createTestHerbs();

        // 创建HUD
        this.createHUD();

        // 设置摄像机跟随
        this.setupCamera();

        // 键盘输入
        this.setupInput();

        // 调试信息
        this.setupDebug();
    }

    update() {
        if (!this.player) return;

        // 玩家移动
        this.handlePlayerMovement();

        // 检测草药采集
        this.checkHerbCollection();
    }

    // ============================================
    // Tilemap创建
    // ============================================
    createTilemap() {
        // 创建地图（40x30格，每格32px = 1280x960px）
        this.mapWidth = 40;
        this.mapHeight = 30;
        this.tileSize = 32;

        // 创建静态地图（使用图形代替Tilemap，简化实现）
        this.groundLayer = this.add.container(0, 0);
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.add.image(x * this.tileSize, y * this.tileSize, 'tile_grass');
                tile.setOrigin(0, 0);
                tile.setDisplaySize(this.tileSize, this.tileSize);
                this.groundLayer.add(tile);
            }
        }

        // 创建障碍物（石头）
        this.obstacles = this.physics.add.staticGroup();
        
        const rockPositions = [
            { x: 5, y: 5 },
            { x: 15, y: 8 },
            { x: 25, y: 12 },
            { x: 10, y: 18 },
            { x: 30, y: 20 },
            { x: 20, y: 25 }
        ];

        rockPositions.forEach(pos => {
            const rock = this.obstacles.create(
                pos.x * this.tileSize + this.tileSize / 2,
                pos.y * this.tileSize + this.tileSize / 2,
                'tile_rock'
            );
            rock.setDisplaySize(this.tileSize, this.tileSize);
            rock.body.updateFromGameObject();
        });

        console.log('✅ Tilemap创建成功', `${this.mapWidth}x${this.mapHeight}`);
    }

    // ============================================
    // 玩家创建
    // ============================================
    createPlayer() {
        // 玩家起始位置（地图中心）
        const startX = (this.mapWidth * this.tileSize) / 2;
        const startY = (this.mapHeight * this.tileSize) / 2;

        // 创建玩家Sprite
        if (this.textures.exists('player')) {
            // 使用生成的Sprite Sheet
            this.player = this.physics.add.sprite(startX, startY, 'player');
            this.player.setCollideWorldBounds(true);

            // 创建四方向行走动画
            this.createPlayerAnimations();

            console.log('✅ 玩家Sprite创建成功（使用Sprite Sheet）');
        } else {
            // 降级方案：使用圆形代替
            console.warn('⚠️ Player Sprite Sheet未找到，使用占位符');
            this.player = this.add.circle(startX, startY, 16, 0x3A6B45);
            this.physics.add.existing(this.player);
            this.player.body.setCollideWorldBounds(true);
        }

        // 设置玩家碰撞体
        if (this.player.body) {
            this.player.body.setSize(24, 24);
            this.player.body.setOffset(4, 4);
        }

        // 玩家属性
        this.player.speed = 160;
        this.player.direction = 'down'; // down, up, left, right
    }

    createPlayerAnimations() {
        // 下方向（第0行）
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        // 左方向（第1行）
        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        // 右方向（第2行）
        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });

        // 上方向（第3行）
        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });

        console.log('✅ 玩家动画创建成功');
    }

    // ============================================
    // 摄像机系统
    // ============================================
    setupCamera() {
        // 设置摄像机边界（整个地图）
        this.cameras.main.setBounds(
            0, 0,
            this.mapWidth * this.tileSize,
            this.mapHeight * this.tileSize
        );

        // 摄像机跟随玩家（使用lerp实现平滑效果）
        this.cameras.main.startFollow(this.player, true, this.cameraFollowSpeed, this.cameraFollowSpeed);
        
        // 设置死区（玩家在死区内时摄像机不移动）
        this.cameras.main.setDeadzone(100, 100);

        console.log('✅ 摄像机跟随系统启动');
    }

    // ============================================
    // 玩家移动控制
    // ============================================
    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        // 交互键 E
        this.input.keyboard.on('keydown-E', () => {
            this.tryCollectHerb();
        });

        // 背包键 B
        this.input.keyboard.on('keydown-B', () => {
            this.toggleBackpack();
        });

        // 调试键 F12
        this.input.keyboard.on('keydown-F12', () => {
            this.toggleDebug();
        });
    }

    handlePlayerMovement() {
        if (!this.player || !this.player.body) return;

        const speed = this.player.speed;
        let velocityX = 0;
        let velocityY = 0;
        let currentDirection = this.player.direction;

        // 检测输入
        const isLeft = this.cursors.left.isDown || this.wasd.left.isDown;
        const isRight = this.cursors.right.isDown || this.wasd.right.isDown;
        const isUp = this.cursors.up.isDown || this.wasd.up.isDown;
        const isDown = this.cursors.down.isDown || this.wasd.down.isDown;

        if (isLeft) {
            velocityX = -speed;
            currentDirection = 'left';
            this.player.flipX = true;
        } else if (isRight) {
            velocityX = speed;
            currentDirection = 'right';
            this.player.flipX = false;
        }

        if (isUp) {
            velocityY = -speed;
            currentDirection = 'up';
        } else if (isDown) {
            velocityY = speed;
            currentDirection = 'down';
        }

        // 设置速度
        this.player.setVelocity(velocityX, velocityY);
        this.player.direction = currentDirection;

        // 播放动画
        const isMoving = velocityX !== 0 || velocityY !== 0;

        if (isMoving && this.player.anims) {
            const animKey = `walk-${currentDirection}`;
            if (this.player.anims.currentAnim?.key !== animKey) {
                this.player.anims.play(animKey);
            }
        } else if (this.player.anims) {
            this.player.anims.stop();
            // 显示静止帧（每方向第0帧）
            const frameMap = { down: 0, left: 4, right: 8, up: 12 };
            this.player.setFrame(frameMap[currentDirection] || 0);
        }
    }

    // ============================================
    // 草药系统
    // ============================================
    createTestHerbs() {
        this.herbs = this.physics.add.group();

        const positions = [
            { x: 3, y: 3, name: '甘草' },
            { x: 8, y: 5, name: '黄芪' },
            { x: 15, y: 10, name: '当归' },
            { x: 22, y: 15, name: '枸杞' },
            { x: 30, y: 20, name: '金银花' },
            { x: 10, y: 25, name: '菊花' },
            { x: 35, y: 8, name: '陈皮' }
        ];

        positions.forEach(pos => {
            const worldX = pos.x * this.tileSize + this.tileSize / 2;
            const worldY = pos.y * this.tileSize + this.tileSize / 2;

            // 创建草药Sprite
            const herb = this.add.circle(worldX, worldY, 12, 0x2E6B45);
            this.physics.add.existing(herb);
            
            herb.name = pos.name;
            herb.setData('collected', false);
            
            // 添加标签
            const label = this.add.text(worldX, worldY - 20, pos.name, {
                fontSize: '12px',
                fontFamily: 'Microsoft YaHei',
                fill: '#1A1209',
                backgroundColor: '#F2EAD3',
                padding: { x: 3, y: 1 }
            }).setOrigin(0.5);
            
            herb.label = label;
            herb.body.setSize(24, 24);
            
            this.herbs.add(herb);
        });

        // 玩家与障碍物碰撞
        this.physics.add.collider(this.player, this.obstacles);

        console.log('✅ 草药系统创建成功', `${positions.length}个草药`);
    }

    checkHerbCollection() {
        // 在tryCollectHerb()中处理
    }

    tryCollectHerb() {
        if (!this.player || !this.herbs) return;

        let nearestHerb = null;
        let minDistance = 50; // 采集距离

        this.herbs.getChildren().forEach(herb => {
            if (herb.getData('collected')) return;

            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                herb.x, herb.y
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestHerb = herb;
            }
        });

        if (nearestHerb) {
            this.collectHerb(nearestHerb);
        } else {
            this.showMessage('附近没有可采集的草药');
        }
    }

    collectHerb(herb) {
        herb.setData('collected', true);
        herb.setVisible(false);
        herb.body.enable = false;
        herb.label.setVisible(false);

        this.collectedHerbs.push(herb.name);
        
        // 显示采集提示
        this.showMessage(`采集了：${herb.name}`);
        
        // 更新HUD
        this.updateHUD();
        
        console.log(`采集了：${herb.name}，当前背包：[${this.collectedHerbs.join(', ')}]`);
    }

    // ============================================
    // HUD界面
    // ============================================
    createHUD() {
        // HUD固定在摄像机视图
        this.hudContainer = this.add.container(0, 0);
        this.hudContainer.setScrollFactor(0);

        // 顶部状态栏背景
        const hudBg = this.add.rectangle(400, 20, 800, 40, 0x000000, 0.6);
        hudBg.setOrigin(0.5);
        
        // 药材数量
        this.herbCountText = this.add.text(20, 10, '药材: 0', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            fill: '#F2EAD3'
        });

        // 时辰
        this.timeText = this.add.text(700, 10, '时辰: 卯时', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            fill: '#F2EAD3'
        });

        // 操作提示
        const tipText = this.add.text(400, 580, 'WASD/方向键移动 | E采集 | B背包 | F12调试', {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            fill: '#999999'
        }).setOrigin(0.5);

        this.hudContainer.add([hudBg, this.herbCountText, this.timeText, tipText]);
        
        console.log('✅ HUD创建成功');
    }

    updateHUD() {
        if (this.herbCountText) {
            this.herbCountText.setText(`药材: ${this.collectedHerbs.length}`);
        }
    }

    showMessage(text) {
        const message = this.add.text(400, 550, text, {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            fill: '#F2EAD3',
            backgroundColor: '#3A6B45',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        message.setScrollFactor(0);

        this.time.delayedCall(1500, () => {
            message.destroy();
        });
    }

    toggleBackpack() {
        this.showMessage('背包系统 - 开发中...');
        console.log('当前背包内容:', this.collectedHerbs);
    }

    // ============================================
    // 调试功能
    // ============================================
    setupDebug() {
        this.debugMode = false;
        
        // 显示玩家坐标
        this.coordText = this.add.text(10, 50, '', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            fill: '#00ff00'
        });
        this.coordText.setScrollFactor(0);
        this.coordText.setVisible(false);
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        this.coordText.setVisible(this.debugMode);
        
        // 切换物理调试
        this.physics.world.debugGraphic?.clear();
        this.physics.world.drawDebug = this.debugMode;
        
        console.log('调试模式:', this.debugMode ? '开启' : '关闭');
    }

    update() {
        if (!this.player) return;

        // 更新调试信息
        if (this.debugMode && this.coordText) {
            this.coordText.setText(
                `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})\n` +
                `Camera: (${Math.round(this.cameras.main.scrollX)}, ${Math.round(this.cameras.main.scrollY)})\n` +
                `Direction: ${this.player.direction}`
            );
        }

        // 调用父类update
        super.update();
    }
}

// 导出到全局
window.BaiCaoXing = {
    game: game,
    scenes: { BootScene, GameScene }
};

console.log('🚀 百草行 - 游戏脚本加载完成');
console.log('📝 控制说明：');
console.log('   WASD/方向键 - 移动');
console.log('   E - 采集草药');
console.log('   B - 打开背包');
console.log('   F12 - 调试模式');
