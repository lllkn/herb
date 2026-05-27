/**
 * IntroScene.js - 序章完整剧情场景
 * 整合所有子系统，实现S01-S09分镜切换
 * 支持打字机效果、选择分支、教程遮罩、CG演出
 */

// 引入子系统（通过 window 访问，确保加载顺序正确）
// TypewriterSystem, ChoiceSystem, TutorialOverlay, CGDisplaySystem

class IntroScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IntroScene' });

        // 剧情数据
        this.prologueData = null;
        this.currentSceneIndex = 0;   // 当前场景索引（S01-S09）
        this.currentStepIndex = 0;     // 当前步骤索引
        this.currentSteps = [];         // 当前场景的步骤列表
        this._attributesInitialized = false; // ★ 属性是否已初始化（防止C01 end重复init）

        // 子系统实例
        this.typewriter = null;
        this.choiceSystem = null;
        this.tutorialOverlay = null;
        this.cgDisplay = null;

        // UI 元素
        this.dialogBox = null;
        this.avatarImage = null;   // 头像图片精灵（优先）
        this.avatarSprite = null;  // 头像 Emoji 文字（兜底）
        this.nameText = null;
        this.contentText = null;
        this.continueHint = null;
        this.skipButton = null;

        // 旁白文本（居中显示，用于S01等独白场景）
        this.narrationText = null;

        // 角色立绘（全身体像）
        this.characterPortrait = null;

        // 当前立绘角色（用于避免连续多幕重复播放出现特效）
        this._currentPortraitCharacter = null;

        // 当前特写图片key（用于避免连续多幕重复播放出现动画）
        this._currentOverlayImageKey = null;

        // 弹窗已关闭但教程待确认的标记（用于背包/图鉴交互）
        this._modalClosedPendingConfirm = false;

        // 背景色覆盖激活标记（用于信纸等场景结束后恢复原图）
        this._bgColorOverrideActive = false;

        // 背景
        this.bgImage = null;
        this.bgMusic = null;

        // 特写图片覆盖层（用于草药特写等）
        this.overlayImage = null;

        // 状态
        this.isTyping = false;
        this.waitingForInput = false;
        this.currentOptions = [];    // 当前选项（用于回调）
        this.tutorialActive = false;

        // 游戏状态
        this.gameState = {
            playerTrait: null,
            pet: null,
            inventory: {},
            flags: {}
        };

        // 保存全局 gameState
        window.gameState = this.gameState;
    }

    /**
     * 预加载资源
     */
    preload() {
        console.log('IntroScene: 预加载资源');

        // 加载序章剧情数据（先清除旧缓存，防止 BootScene 传过来的缓存在场景切换时丢失）
        if (this.cache.json.exists('prologue_data')) {
            this.cache.json.remove('prologue_data');
        }
        this.load.json('prologue_data', 'src/data/story_prologue.json');

        // 加载第一章剧情数据
        this.load.json('chapter1_data', 'src/data/story_chapter1.json');

        // 加载地图事件配置（供调试管理器使用）
        this.load.json('map_events_data', 'src/data/map_events.json');

        // 加载CG图片（如果有的话）
        this._loadCGImages();

        // 加载立绘图片（如果有的话）
        this._loadCharacterImages();

        // 加载背景图片
        this._loadBackgroundImages();

        // 加载音效
        // this.load.audio('bgm_school', 'src/assets/audio/bgm_school.mp3');
        // this.load.audio('typewriter_sfx', 'src/assets/audio/typewriter.wav');
    }

    /**
     * 加载CG图片
     */
    _loadCGImages() {
        const cgList = [
            'cg_01_school.png',
            'cg_02_spirit_room.png',
            'cg_03_awakening.png',
            'cg_04_departure.png'
        ];

        cgList.forEach(file => {
            const path = `src/assets/pictures/prologue/${file}`;
            // 检查文件是否存在（简单方式：尝试加载，失败也不报错）
            this.load.image(file.replace('.png', ''), path);
        });
    }

    /**
     * 加载立绘图片
     */
    _loadCharacterImages() {
        // === 序章角色 ===
        const prologueCharacters = [
            'bai.png',
            'xiaolan.png',
            'qingmiao.png'
        ];

        prologueCharacters.forEach(file => {
            const path = `src/assets/pictures/characters/${file}`;
            this.load.image(file.replace('.png', ''), path);
        });

        // 加载师傅立绘（全身体像）- PNG透明背景版本
        // 注意：中文命名资源放在 picture/ 目录下（与 pictures/characters/ 区分）
        this.load.image('bai_standing', 'src/assets/picture/师傅立绘1.png');

        // 加载小兰立绘（全身体像）
        this.load.image('xiaolan_standing', 'src/assets/picture/小兰.png');

        // 加载灵宠立绘
        this.load.image('lingchong_portrait', 'src/assets/picture/灵宠.png');

        // 加载青苗精灵图（用于粒子效果）
        this.load.image('pet_qingmiao', 'src/assets/pictures/characters/pet_qingmiao.png');

        // === 第一章 NPC 头像 ===
        const chapter1Characters = [
            'woodcutter.png',       // 砍柴老汉
            'washerwoman.png',      // 洗衣村妇
            'merchant.png',         // 行商王掌柜
            'village_chief.png',    // 村长张老汉
            'laoli.png',            // 药农老李
            'villager_b.png',       // 村民乙
            'zhangdaniang.png',     // 张大娘
            'traveler.png',         // 旅人
            'zhurengong.png'        // 主人公
        ];

        chapter1Characters.forEach(file => {
            const key = file.replace('.png', '');
            const path = `src/assets/pictures/characters/${file}`;
            // 如果已加载则跳过
            if (!this.textures.exists(key)) {
                this.load.image(key, path);
            }
        });
    }

    /**
     * 加载背景图片
     */
    _loadBackgroundImages() {
        const backgrounds = [
            'bg_school_yard.png',
            'bg_herb_garden.png',
            'bg_spirit_room.png',
            'bg_school_gate.png',
            'bg_dean_room.png',
            'bg_processing_room.png',
            '牛车赶路.png'              // S10 搭车路途背景
        ];

        backgrounds.forEach(file => {
            const path = `src/assets/pictures/backgrounds/${file}`;
            this.load.image(file.replace('.png', ''), path);
        });

        // 加载药圃专用图片
        this.load.image('herb_garden_bg', 'src/assets/picture/药圃背景.png');
        this.load.image('gancao_closeup', 'src/assets/picture/甘草特写.png');
        this.load.image('juhua_closeup', 'src/assets/picture/菊花特写.png');

        // 加载药房专用图片
        this.load.image('yaofang_bg', 'src/assets/picture/药房.png');
        this.load.image('eshi_closeup', 'src/assets/picture/鹅卵石特写.png');

        // 加载学堂门口背景
        this.load.image('xuetang_menkou', 'src/assets/picture/学堂门口.png');

        // 加载炮制间专用背景
        this.load.image('paozhijian_bg', 'src/assets/picture/炮制间.png');
        this.load.image('guodao_bg', 'src/assets/picture/过道.png');

        // 加载内室背景
        this.load.image('neishi_bg', 'src/assets/picture/内室.png');

        // === 第一章背景图片 ===
        const ch1Backgrounds = [
            'bg_plains_entry.png',     // 平原入口
            'bg_plains_road.png',      // 平原山路
            'bg_plains_woods.png',     // 平原树林
            'bg_plains_river.png',     // 平原溪岸
            'bg_plains_south.png',     // 平原村前
            'bg_village_gate.png',    // 翠竹村牌坊
            'bg_village_entrance.png',// 翠竹村口
            'bg_village_center.png',  // 翠竹村中心
            // bg_herb_garden.png 已在上方 backgrounds 列表中加载（第187行），此处复用 key
            'bg_village_well.png',    // 水井边
            'bg_drying_platform.png', // 晒药台
            'bg_empty_shop.png',     // 空置铺面
            'bg_patient_room.png',    // 张大娘家
            'bg_valley_entry.png',   // 山谷入口 / C15d蛊根草
            'bg_valley_exit.png',    // 山谷出口
            'c15_a.png',             // C15a 山药采集
            'c15_b.png',             // C15b 迷雾松林
            'c15_c.png'              // C15c 石菖蒲
        ];

        ch1Backgrounds.forEach(file => {
            const name = file.replace('.png', '');
            const path = `src/assets/pictures/backgrounds/${file}`;
            // 已加载的跳过
            if (!this.textures.exists(name)) {
                this.load.image(name, path);
            }
        });

        // 加载CG图片（第一章）
        this.load.image('cg_06_gugen_discovery', 'src/assets/pictures/cg/cg_06_gugen.png');

        // 加载翠竹村地图全景图
        this.load.image('village_map_full', 'src/assets/picture/翠竹村地图.png');
    }

    /**
     * 创建场景
     */
    create() {
        console.log('IntroScene: 创建场景');

        // ★ 注册 Phaser 场景生命周期事件：确保场景销毁时执行清理
        this.events.on('shutdown', this._onSceneShutdown, this);
        this.events.on('destroy', this._onSceneShutdown, this);

        try {
            // === 检查是否从调试器启动（携带调试参数） ===
            const initData = this.scene.settings.data;
            const isDebugLaunch = initData && initData.debugMode === true;
            console.log('[诊断] create() 启动参数:', JSON.stringify(initData), '| isDebugLaunch:', isDebugLaunch);

            if (isDebugLaunch) {
                console.log('[调试] ★★ IntroScene 以调试模式启动 ★★', initData);
                this._debugMode = true;
                this._debugTargetSceneIdx = initData.debugTargetIdx || 0;
                this._returnToGame = initData.returnToGame || false;  // ★ NPC 交互模式：剧情结束自动返回游戏

                // 隐藏 GameScene 的 HTML UI（地图、背包等）
                this._hideHTMLUI();

                // 如果有强制传入的章节数据，直接使用
                if (initData.forceChapter1) {
                    this.prologueData = initData.forceChapter1;
                    this._isChapter1 = true;
                    console.log('[调试] 使用强制传入的第一章数据:', this.prologueData.title);
                }
            }

        /**
         * 初始化场景（数据就绪后调用）
         */
        this._initScene = function() {
        console.log('IntroScene: 初始化场景 -', this.prologueData.title);

            // 初始化子系统
            console.log('[诊断] 正在初始化子系统...');
            this._initSubsystems();
            console.log('[诊断] 子系统初始化完成');

            // 创建UI
            console.log('[诊断] 正在创建UI...');
            this._createUI();
            console.log('[诊断] UI创建完成');

            // 设置输入
            console.log('[诊断] 正在设置输入...');
            this._setupInput();
            console.log('[诊断] 输入设置完成');

            // 启动调试管理器（F3）
            if (window.DebugManager) {
                // ★ 清理上一次 IntroScene 遗留的 DebugManager DOM 元素（防止重复面板）
                const oldOverlay = document.getElementById('debug-chapter1-overlay');
                const oldPanel = document.getElementById('debug-chapter1-panel');
                if (oldOverlay && oldOverlay.parentNode) oldOverlay.parentNode.removeChild(oldOverlay);
                if (oldPanel && oldPanel.parentNode) oldPanel.parentNode.removeChild(oldPanel);

                this.debugManager = new window.DebugManager(this);
                this.debugManager.createUI();
                console.log('IntroScene: 调试管理器已启动（F3 打开）, panel=', !!this.debugManager.panel);
            } else {
                console.warn('IntroScene: DebugManager 类未找到！');
            }

            // 开始场景：调试模式跳到目标场景，否则从第一个开始
            console.log('[诊断] 正在启动场景 _startScene(0)...');
            if (isDebugLaunch && this._debugTargetSceneIdx !== undefined) {
                console.log(`[调试] 直接跳转到目标场景索引 ${this._debugTargetSceneIdx}`);
                this._startScene(this._debugTargetSceneIdx);
            } else {
                this._startScene(0);
            }

            console.log('IntroScene: 场景创建成功');

            // === 最终诊断：确认关键UI元素存在 ===
            console.log('[诊断] UI元素检查:', {
                dialogBox: !!this.dialogBox,
                contentText: !!this.contentText,
                narrationText: !!this.narrationText,
                bgImage: !!this.bgImage,
                typewriter: !!this.typewriter,
                canvasWidth: this.cameras.main.width,
                canvasHeight: this.cameras.main.height
            });
        };

            // 根据 window._loadChapter 决定加载哪章剧情（非调试启动时）
            if (!this.prologueData) {
                const loadChapter = window._loadChapter || 0;

                if (loadChapter >= 1 && window._chapter1Data) {
                    this.prologueData = window._chapter1Data;
                    this._isChapter1 = true;
                    console.log('IntroScene: 加载第一章剧情', this.prologueData.title);
                } else {
                    this._isChapter1 = false;
                    this.prologueData = this.cache.json.get('prologue_data');
                    if (!this.prologueData || !this.prologueData.scenes) {
                        console.warn('IntroScene: Phaser缓存中无剧情数据，尝试fetch兜底加载...');
                        // fetch 兜底：直接加载 JSON 再初始化
                        fetch('src/data/story_prologue.json')
                            .then(r => {
                                if (!r.ok) throw new Error('HTTP ' + r.status);
                                return r.json();
                            })
                            .then(data => {
                                console.log('IntroScene: fetch兜底加载成功');
                                this.prologueData = data;
                                this._initScene();
                            })
                            .catch(err => {
                                console.error('IntroScene: fetch兜底加载失败', err);
                                this.prologueData = this._getFallbackData();
                                this._initScene();
                            });
                        return; // 等待 fetch 完成后再初始化
                    }
                    console.log('IntroScene: 加载序章剧情', this.prologueData.title);
                }
                this._initScene();
            } else {
                // prologueData 已在调试模式中设置（如 forceChapter1），直接初始化
                this._initScene();
            }

        } catch (error) {
            console.error('!!! IntroScene.create() 发生致命错误 !!!', error);
            console.error('错误堆栈:', error.stack);

            // 显示错误信息到屏幕上（便于用户看到）
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;

            this.add.text(width / 2, height / 2 - 40, '❌ 游戏启动失败', {
                fontSize: '32px',
                color: '#ff4444',
                fontFamily: '"FangSong", serif',
                backgroundColor: '#000000dd',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setDepth(9999);

            this.add.text(width / 2, height / 2 + 20, error.message, {
                fontSize: '18px',
                color: '#ffaa00',
                fontFamily: 'monospace',
                backgroundColor: '#000000dd',
                padding: { x: 16, y: 8 },
                wordWrap: { width: width * 0.8, useAdvancedWrap: true }
            }).setOrigin(0.5).setDepth(9999);

            this.add.text(width / 2, height /2 + 80, '请按 F12 打开控制台查看详细错误', {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(9999);
        }
    }

    /**
     * 初始化子系统
     */
    _initSubsystems() {
        // 打字机系统
        this.typewriter = new window.TypewriterSystem(this, {
            speed: 50,
            onComplete: () => {
                this.waitingForInput = true;
                this._showContinueHint(true);
            }
        });

        // 选择系统
        this.choiceSystem = new window.ChoiceSystem(this, {
            x: this.cameras.main.width / 2,
            y: this.cameras.main.height / 2 + 50,
            spacing: 55,
            onChoiceSelected: (option, index) => {
                this.currentOptions = [];
                this._onChoiceSelected(option, index);
            }
        });

        // 教程遮罩系统
        this.tutorialOverlay = new window.TutorialOverlay(this, {
            maskAlpha: 0.55,
            highlightColor: 0xffd700,
            pulseSpeed: 800
        });

        // CG演出系统
        this.cgDisplay = new window.CGDisplaySystem(this, {
            fadeInDuration: 1000,
            fadeOutDuration: 800
        });
    }

    /**
     * 创建UI元素
     */
    _createUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 隐藏HTML UI元素（地图、背包等）
        this._hideHTMLUI();

        // 居中旁白文本（用于S01等独白场景）— 提高到100确保覆盖GameScene
        this.narrationText = this.add.text(width / 2, height / 2, '', {
            fontSize: '32px',
            color: '#e8d8b8',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif',
            align: 'center',
            lineSpacing: 12,
            wordWrap: { width: width * 0.8, useAdvancedWrap: true }
        })
            .setOrigin(0.5)
            .setDepth(100)   // ★ 从15提升到100，确保在GameScene之上
            .setVisible(false);

        // 角色立绘（全身体像，居中显示）
        // 使用 Graphics.generateTexture() 创建透明占位纹理（兼容所有 Phaser 3 版本）
        const placeholderKey = '__intro_portrait_placeholder__';
        
        // 检查是否已有该纹理（避免重复生成）
        if (!this.textures.exists(placeholderKey)) {
            const gfx = this.make.graphics({ x: 0, y: 0, add: false });
            gfx.fillStyle(0x000000, 0);  // 完全透明
            gfx.fillRect(0, 0, 2, 2);
            gfx.generateTexture(placeholderKey, 2, 2);  // 使用 graphics 对象的方法
            gfx.destroy();  // 销毁临时 graphics 对象
        }
        
        this.characterPortrait = this.add.image(width / 2, height * 0.5, placeholderKey)
            .setDisplaySize(20, 32)
            .setOrigin(0.5, 0.5)
            .setDepth(30)    // ★ 从8提升到30
            .setVisible(false);

        // ===== 对话框系统：不使用 Container（避免 Phaser 3 Container 渲染兼容性问题） =====
        // 每个组件独立管理 depth，直接添加到场景
        
        // 计算对话框尺寸位置
        this._dialogW = Math.max(200, Math.floor((width - 100) * 3 / 4));
        this._dialogX = Math.floor((width - this._dialogW) / 2);
        this._dialogY = height - 250;
        this._dialogH = 200;

        // 对话框背景图形（独立 Graphics 对象）
        if (this.dialogBg) { this.dialogBg.destroy(); }
        this.dialogBg = this.add.graphics().setDepth(110).setVisible(false);  // ★ 从50→110
        
        // 头像背景框
        if (this.avatarBg) { this.avatarBg.destroy(); }
        this.avatarBg = this.add.graphics().setDepth(111).setVisible(false);  // ★ 从51→111

        // 头像图片精灵（真实肖像，优先显示）
        if (this.avatarImage) { this.avatarImage.destroy(); }
        this.avatarImage = this.add.image(this._dialogX + 54, this._dialogY + 52, '__BLANK')
            .setDisplaySize(72, 72)
            .setDepth(112)
            .setVisible(false);

        // 创建空白纹理（用于初始占位）
        if (!this.textures.exists('__BLANK')) {
            const canvas = this.textures.createCanvas('__BLANK', 1, 1);
            canvas.context.fillStyle = 'rgba(0,0,0,0)';
            canvas.context.fillRect(0, 0, 1, 1);
            canvas.refresh();
        }

        // 头像 Emoji 文字（兜底），当没有真实图片时使用
        if (this.avatarSprite) { this.avatarSprite.destroy(); }
        this.avatarSprite = this.add.text(this._dialogX + 54, this._dialogY + 52, '👤', {
            fontSize: '36px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(113).setVisible(false);

        // 名称文本
        if (this.nameText) { this.nameText.destroy(); }
        this.nameText = this.add.text(this._dialogX + 108, this._dialogY + 20, '', {
            fontSize: '28px', color: '#ffcc00', fontStyle: 'bold',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif'
        }).setDepth(112).setVisible(false);  // ★ 从52→112

        // 内容文本（对话正文）
        if (this.contentText) { this.contentText.destroy(); }
        this.contentText = this.add.text(this._dialogX + 108, this._dialogY + 52, '', {
            fontSize: '24px', color: '#ffffff',
            wordWrap: { width: Math.max(100, this._dialogW - 168), useAdvancedWrap: true },
            lineSpacing: 8,
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif'
        }).setDepth(112).setVisible(false);  // ★ 从52→112

        // 保留旧 dialogBox 引用用于兼容检查（标记为废弃）
        this.dialogBox = { 
            setVisible: (v) => { this._setDialogVisible(v); }, 
            visible: false,
            // 兼容 list 属性访问
            list: []
        };

        // 跳过按钮
        this.skipButton = this.add.text(width - 80, 30, '跳过 ▸', {
            fontSize: '14px',
            color: '#8b7355',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 }
        })
            .setOrigin(0.5)
            .setDepth(120)   // ★ 从20→120
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._skipPrologue())
            .on('pointerover', () => this.skipButton.setColor('#ffcc00'))
            .on('pointerout', () => this.skipButton.setColor('#8b7355'));

        // 继续提示
        this.continueHint = this.add.text(width - 80, height - 70, '', {
            fontSize: '14px',
            color: '#8b7355'
        })
            .setOrigin(0.5)
            .setDepth(120)   // ★ 从15→120
            .setVisible(false);

        // 闪烁动画
        this.tweens.add({
            targets: this.continueHint,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * 设置输入事件
     */
    _setupInput() {
        // 点击屏幕继续
        this.input.on('pointerdown', () => {
            // 忽略点击UI元素
            if (this.choiceSystem && this.choiceSystem.isActive) return;
            if (this.tutorialActive) {
                this._onTutorialClick();
                return;
            }
            this._handleClick();
        });

        // 键盘
        this.input.keyboard.on('keydown-SPACE', () => this._handleClick());
        this.input.keyboard.on('keydown-ENTER', () => this._handleClick());
        this.input.keyboard.on('keydown-ESC', () => this._skipPrologue());

        // F3 调试面板（Phaser 键盘绑定 — 当 Phaser 有焦点时生效）
        // 注意：全局 F3 DOM 监听器在 main.js 中注册，此处为 Phaser 层面的补充绑定
        this.input.keyboard.on('keydown-F3', () => {
            console.log('IntroScene: F3 按下（Phaser）');
            if (this.debugManager) { this.debugManager.toggle(); }
        });

        // 数字键选择
        for (let i = 1; i <= 9; i++) {
            this.input.keyboard.on(`keydown-${i}`, () => {
                if (this.choiceSystem && this.choiceSystem.isActive) {
                    // 选项系统自己处理
                }
            });
        }
    }

    /**
     * 开始指定场景
     * @param {number} sceneIndex - 场景索引
     */
    _startScene(sceneIndex) {
        try {
            console.log(`[诊断] _startScene(${sceneIndex}) 开始 | scenes总数: ${this.prologueData?.scenes?.length} | isActive: ${this.scene.isActive()} | isPaused: ${this.scene.isPaused()}`);

            // 验证 prologueData 是否有效
            if (!this.prologueData || !this.prologueData.scenes || !Array.isArray(this.prologueData.scenes)) {
                throw new Error(`prologueData 无效: ${JSON.stringify(this.prologueData)}`);
            }

            // ★ NPC 交互模式：只播放目标场景，跳过后续场景直接返回游戏
            // 特殊：部分场景标记了 autoChainToNext，允许自动衔接下一个场景（如 C07→C08）
            if (this._returnToGame && this._debugTargetSceneIdx !== null && sceneIndex > this._debugTargetSceneIdx) {
                const triggerScene = this.prologueData.scenes[this._debugTargetSceneIdx];
                if (triggerScene && triggerScene.autoChainToNext && sceneIndex === this._debugTargetSceneIdx + 1) {
                    console.log(`[NPC剧情] autoChainToNext - 从${triggerScene.id}自动推进到${sceneIndex}`);
                    this._debugTargetSceneIdx = sceneIndex;
                    // 放行，继续执行（不 return）
                } else {
                    console.log(`[NPC剧情] 目标场景（索引${this._debugTargetSceneIdx}）已播完，不继续场景${sceneIndex}，返回 GameScene`);
                    // ★ 如果是从翠竹村地图交互触发的（_returnToVillageMap），确保回到村庄地图
                    if (window._returnToVillageMap) {
                        console.log('[NPC剧情] ★ 村庄事件完成，返回翠竹村地图');
                        if (window.GameConfig) {
                            window.GameConfig.currentMapId = 'village';
                        }
                        window._forceVillageMap = true;
                        window._returnToVillageMap = false;
                    } else if (triggerScene && triggerScene.id === 'C08' && window.GameConfig) {
                        console.log('[NPC剧情] ★ C08完成，设置翠竹村地图');
                        window.GameConfig.currentMapId = 'village';
                        window._forceVillageMap = true;
                    }
                    this._debugMode = false;
                    this._returnToGame = false;
                    this._debugTargetSceneIdx = null;
                    this._showHTMLUI();
                    this.time.delayedCall(300, () => {
                        this.scene.start('GameScene');
                    });
                    return;
                }
            }

            // === 关键修复：确保 IntroScene 渲染在最顶层（覆盖 GameScene 地图） ===
            this.scene.bringToTop();
            console.log('[诊断] IntroScene 已 bringToTop，当前场景栈:', this.scene.manager.getScenes(true).map(s => s.sceneKey));

            // === 可视化诊断：强制确保 canvas 可见 ===
            const canvas = this.game.canvas;
            if (canvas) {
                console.log('[诊断] canvas 状态:', {
                    display: getComputedStyle(canvas).display,
                    visibility: getComputedStyle(canvas).visibility,
                    zIndex: getComputedStyle(canvas).zIndex,
                    width: canvas.width,
                    height: canvas.height,
                    offsetWidth: canvas.offsetWidth,
                    offsetHeight: canvas.offsetHeight
                });
                // 强制确保 canvas 可见
                canvas.style.display = 'block';
                canvas.style.visibility = 'visible';
                canvas.style.zIndex = '1000';
            }

            // 隐藏所有可能的遮罩层
            document.querySelectorAll('.modal, [id*="overlay"], [id*="mask"]').forEach(el => {
                if (el.id !== 'debug-chapter1-overlay' && el.id !== 'debug-jump-overlay') {
                    el.style.display = 'none';
                    console.log('[诊断] 隐藏了遮罩层:', el.id || el.className);
                }
            });

            if (sceneIndex >= this.prologueData.scenes.length) {
            // === 调试模式检查：不自动跳转到 GameScene ===
            if (this._debugMode) {
                // ★ NPC 交互模式：剧情结束自动返回游戏
                if (this._returnToGame) {
                    console.log('[NPC剧情] 场景播放完毕，自动返回 GameScene');
                    // ★ 如果是从翠竹村地图交互触发的，确保回到村庄地图
                    if (window._returnToVillageMap) {
                        console.log('[NPC剧情] ★ 村庄事件全部完成，返回翠竹村地图');
                        if (window.GameConfig) window.GameConfig.currentMapId = 'village';
                        window._forceVillageMap = true;
                        window._returnToVillageMap = false;
                    } else if (!window._forceVillageMap && window.GameConfig) {
                        const lastScene = this.prologueData.scenes[sceneIndex - 1];
                        if (lastScene && lastScene.id === 'C08') {
                            console.log('[NPC剧情] C08自然结束，强制切换到翠竹村地图');
                            window.GameConfig.currentMapId = 'village';
                            window._forceVillageMap = true;
                        }
                    }
                    this._debugMode = false;
                    this._debugTargetSceneIdx = null;
                    this._returnToGame = false;
                    this._showHTMLUI();
                    this.time.delayedCall(300, () => {
                        this.scene.start('GameScene');
                    });
                    return;
                }
                console.log('[调试] 场景已全部播完（调试模式），停在最后一幕');
                this._debugMode = false;
                this._debugTargetSceneIdx = null;  // 清理调试目标索引
                // 保持在当前画面，显示调试结束提示
                this._showDebugEndHint();
                return;
            }
            this._endPrologue();
            return;
        }

        // 清理特写图片（场景切换时）
        if (this.overlayImage) {
            this.overlayImage.destroy();
            this.overlayImage = null;
        }
        if (this.overlayBorder) {
            this.overlayBorder.destroy();
            this.overlayBorder = null;
        }

        // 隐藏旁白文本（防止信纸等文字残留在新场景）
        if (this.narrationText) {
            this.narrationText.setVisible(false);
        }

        // 销毁CG旁白文本（防止CG文字残留到后续步骤/场景）
        if (this._cgNarrationBox) {
            this._cgNarrationBox.destroy();
            this._cgNarrationBox = null;
        }

        // 隐藏角色立绘（场景切换时必须清除旧立绘）
        this._hideCharacterPortrait();

        // 清除立绘角色记录（新场景需要重新播放出现动画）
        this._currentPortraitCharacter = null;

        // 清除特写记录（新场景需要重新播放出现动画）
        this._currentOverlayImageKey = null;

        this.currentSceneIndex = sceneIndex;
        const scene = this.prologueData.scenes[sceneIndex];
        this.currentSteps = scene.steps || [];
        this.currentStepIndex = 0;

        console.log(`IntroScene: 开始场景 ${scene.id} - ${scene.name}`);

        // 设置背景
            this._setBackground(scene);

            // 设置BGM
            this._setBGM(scene);

            // 执行步骤
            this._executeStep();

        } catch (error) {
            console.error(`!!! _startScene(${sceneIndex}) 发生错误 !!!`, error);
            console.error('错误堆栈:', error.stack);

            // 显示错误信息
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;

            const errorText = this.add.text(width / 2, height / 2, `❌ 场景启动失败 (索引 ${sceneIndex})\n\n${error.message}`, {
                fontSize: '24px',
                color: '#ff4444',
                fontFamily: '"FangSong", serif',
                backgroundColor: '#000000ee',
                padding: { x: 20, y: 16 },
                align: 'center',
                wordWrap: { width: width * 0.8, useAdvancedWrap: true }
            }).setOrigin(0.5).setDepth(9999);

            // 5秒后自动隐藏错误信息
            this.time.delayedCall(5000, () => {
                if (errorText) errorText.destroy();
            });
        }
    }

    /**
     * 设置背景
     * @param {Object} scene - 场景数据
     */
    _setBackground(scene) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 清除旧背景
        if (this.bgImage) {
            this.bgImage.destroy();
            this.bgImage = null;
        }

        // 根据场景类型设置背景
        const bgColor = scene.type === 'monologue' ? 0x000000 :
            scene.type === 'cg' ? 0x0a0a0a : 0x1a2a1a;

        this.bgImage = this.add.rectangle(0, 0, width, height, bgColor)
            .setOrigin(0, 0)
            .setDepth(0);

        console.log(`[诊断] 背景已创建 | type: ${scene.type} | 颜色: ${bgColor.toString(16)} | 尺寸: ${width}x${height}`);

        // 如果有背景图片
        if (scene.background && this.textures.exists(scene.background.replace('.png', ''))) {
            this.bgImage.destroy();
            this.bgImage = this.add.image(width / 2, height / 2, scene.background.replace('.png', ''))
                .setDisplaySize(width, height)
                .setDepth(0);
            console.log(`[诊断] ✓ 背景图加载成功: ${scene.background}`);
        } else if (scene.background) {
            console.warn(`[诊断] ✗ 背景图不存在: ${scene.background} | 已有纹理列表:`, 
                this.textures.getTextureKeys().filter(k => k.includes('bg_')).join(', ') || '(无)');
        }
    }

    /**
     * 应用步骤级别的背景覆盖（用于场景中途的过场切换）
     * @param {string} backgroundKey - 背景图片key（不含.png后缀）
     */
    _applyBackgroundOverride(backgroundKey) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 清除旧背景
        if (this.bgImage) {
            this.bgImage.destroy();
            this.bgImage = null;
        }

        // 检查纹理是否存在
        const textureKey = backgroundKey.replace('.png', '');
        if (this.textures.exists(textureKey)) {
            this.bgImage = this.add.image(width / 2, height / 2, textureKey)
                .setDisplaySize(width, height)
                .setDepth(0)
                .setAlpha(0);

            // 淡入新背景
            this.tweens.add({
                targets: this.bgImage,
                alpha: 1,
                duration: 600,
                ease: 'Power2Out'
            });

            console.log('IntroScene: 背景已切换为', textureKey);
        } else {
            console.warn('IntroScene: 背景覆盖图片不存在', textureKey);
            // 使用默认背景色
            this.bgImage = this.add.rectangle(0, 0, width, height, 0x1a2a1a)
                .setOrigin(0, 0)
                .setDepth(0);
        }
    }

    /**
     * 设置BGM
     * @param {Object} scene - 场景数据
     */
    _setBGM(scene) {
        if (scene.bgm) {
            // BGM 功能暂未实现，静默跳过（避免误导）
            // TODO: 当有音频资源后启用此功能
            // console.log('IntroScene: 切换BGM', scene.bgm);
        }
    }

    /**
     * 执行当前步骤
     */
    _executeStep() {
        if (this.currentStepIndex >= this.currentSteps.length) {
            // 当前场景结束，进入下一个场景（调试模式允许连续播放）
            this._startScene(this.currentSceneIndex + 1);
            return;
        }

        const step = this.currentSteps[this.currentStepIndex];

        console.log(`IntroScene: 执行步骤 ${step.id} (${step.type})`);

        switch (step.type) {
            case 'narration':
                this._showNarration(step);
                break;
            case 'dialogue':
                this._showDialogue(step);
                break;
            case 'choice':
                this._showChoice(step);
                break;
            case 'tutorial':
                this._showTutorial(step);
                break;
            case 'stepAlias':
                // 步骤别名：跳转到指定步骤ID（用于多分支汇聚）
                if (step.aliasTo) {
                    const targetStep = this._findStepById(step.aliasTo);
                    if (targetStep) {
                        this.currentStepIndex = this.currentSteps.indexOf(targetStep);
                        this._executeStep();
                        return;
                    }
                }
                this._nextStep();
                break;
            case 'cg':
            case 'cg_display':
                this._showCG(step);
                break;
            case 'pet_selection':
                this._showPetSelection(step);
                break;
            case 'reward':
                this._showReward(step);
                break;
            case 'title_card':
                this._showTitleCard(step);
                break;
            case 'show_village_map':
                // ★ C08 完成后自动切换到 GameScene 翠竹村图片地图
                console.log('[剧情] ★★★ C08完成，准备跳转翠竹村地图 ★★★');
                console.log('[剧情] 当前场景key:', this.scene.key);
                console.log('[剧情] GameScene存在:', !!this.game.scene.getScene('GameScene'));
                if (window.GameConfig) {
                    window.GameConfig.currentMapId = 'village';
                    console.log('[剧情] currentMapId 已设为:', window.GameConfig.currentMapId);
                }
                // ★ 设置强制标志（双保险，防止 currentMapId 被覆盖）
                window._forceVillageMap = true;
                // 清理 NPC 模式状态
                this._debugMode = false;
                this._returnToGame = false;
                this._debugTargetSceneIdx = null;
                // 恢复 UI 并跳转
                this._showHTMLUI();
                // ★ 使用 RAF + 微延时，确保不在 Phaser 步骤处理中同步切换场景
                const game = this.game;
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        console.log('[剧情] ★ 执行 scene.start(GameScene)...');
                        try {
                            game.scene.start('GameScene');
                            console.log('[剧情] ✅ scene.start(GameScene) 已调用');
                        } catch(e) {
                            console.error('[剧情] ❌ scene.start 失败:', e);
                            // 兜底：直接启动
                            game.scene.stop('IntroScene');
                            game.scene.start('GameScene');
                        }
                    }, 50);
                });
                break;
            case 'end':
                // === NPC 交互模式：剧情结束自动返回游戏 ===
                if (this._debugMode && this._returnToGame) {
                    console.log('[NPC剧情] 遇到 end 步骤，自动返回 GameScene');
                    this._debugMode = false;
                    this._debugTargetSceneIdx = null;
                    this._returnToGame = false;
                    this._showHTMLUI();
                    this.time.delayedCall(300, () => {
                        this.scene.start('GameScene');
                    });
                    break;
                }
                // === 调试模式下不跳转到 GameScene，显示调试结束提示 ===
                if (this._debugMode) {
                    console.log('[调试] 遇到 end 步骤，显示调试结束提示（不跳转 GameScene）');
                    this._debugMode = false;
                    this._debugTargetSceneIdx = null;
                    this._showDebugEndHint();
                    break;
                }
                this._endPrologue(step);
                break;
            // === 第一章小游戏模拟（dialogue + choice 模拟）===
            case 'minigame_herb_id':
                this._showHerbIdMinigame(step);
                break;
            case 'minigame_process':
                this._showProcessMinigame(step);
                break;
            case 'minigame_diagnosis':
                this._showDiagnosisMinigame(step);
                break;
            case 'minigame_prescription':
                this._showPrescriptionMinigame(step);
                break;
            // === 药圃辨花小游戏（真实卡片交互） ===
            case 'minigame_flower_id':
                this._showFlowerIdMinigame(step);
                break;
            // === 山野晒菊小游戏（拖拽交互） ===
            case 'minigame_dry_flower':
                this._showDryFlowerMinigame(step);
                break;
            default:
                console.warn('IntroScene: 未知步骤类型', step.type);
                this._nextStep();
        }
    }

    /**
     * 显示旁白
     * @param {Object} step - 步骤数据
     */
    _showNarration(step) {
        console.log(`[诊断] _showNarration | step: ${step.id} | text: "${(step.text || '').substring(0, 40)}"`);
        
        // 隐藏对话框，显示居中旁白
        this.dialogBox.setVisible(false);
        this.narrationText.setVisible(true);
        
        // 诊断：确认 narrationText 状态
        console.log(`[诊断] narrationText: visible=${this.narrationText.visible} depth=${this.narrationText.depth} x=${Math.round(this.narrationText.x)} y=${Math.round(this.narrationText.y)}`);
        
        // 强制确保 narrationText 在最顶层（防御性措施）
        this.narrationText.setDepth(100);

        // 旁白时不显示任何头像（_setDialogVisible(false) 已隐藏全部对话UI，无需 _updateAvatar）
        this._updateName('');

        // 隐藏特写图片和角色立绘
        this._hideOverlayImage();
        this._hideCharacterPortrait();

        // 支持步骤级别的背景覆盖（用于过场切换）
        if (step.backgroundOverride) {
            this._applyBackgroundOverride(step.backgroundOverride);
        }

        const currentScene = this.prologueData.scenes[this.currentSceneIndex];
        const hasBackgroundImage = currentScene && currentScene.background;

        // 根据背景类型设置默认文字颜色
        if (!step.textColorStart && !step.textColorEnd) {
            if (hasBackgroundImage) {
                // 有背景图片时：使用深色文字 + 描边效果
                this.narrationText.setColor('#2a1810');
                this.narrationText.setStroke('#ffffff', 4);
            } else {
                // 黑屏背景时：使用浅色文字（恢复默认）
                this.narrationText.setColor('#e8d8b8');
                this.narrationText.setStroke('#000000', 0);
            }
        } else {
            this.narrationText.setStroke('#000000', 0);
        }

        // 文字颜色渐变
        let colorGradient = null;
        if (step.textColorStart && step.textColorEnd) {
            colorGradient = {
                start: parseInt(step.textColorStart.replace('#', '0x')),
                end: parseInt(step.textColorEnd.replace('#', '0x'))
            };
        }

        // 设置背景色（用于信纸等特殊场景）
        if (step.bgColor) {
            const color = parseInt(step.bgColor.replace('#', '0x'));
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;

            if (this.bgImage) {
                this.bgImage.destroy();
            }

            this.bgImage = this.add.rectangle(0, 0, width, height, color)
                .setOrigin(0, 0)
                .setDepth(0);

            // 标记：下一步需恢复原图背景
            this._bgColorOverrideActive = true;
        }

        // 打字机效果（输出到居中文本）
        this.typewriter.start(step.text, {
            targetField: this.narrationText,
            colorGradient: colorGradient,
            speed: 60
        });
        
        console.log(`[诊断] narration typewriter已启动 | isTyping=${this.typewriter.isTyping} | target=${!!this.typewriter.targetTextField}`);
        
        // 500ms 后用 setTimeout 检查旁白文字是否显示
        setTimeout(() => {
            if (!this.narrationText) return;
            const txt = this.narrationText.text || '(空)';
            console.log(`[诊断] narration 500ms后 | text="${txt.substring(0,40)}" | visible=${this.narrationText.visible} depth=${this.narrationText.depth}`);
            
            // 终极备用方案：打字机未输出则强制写入
            if (!this.typewriter?.isTyping && txt.length === 0 && step.text) {
                console.warn('[诊断] !!! Narration打字机未输出，强制写入文本 !!!');
                this.narrationText.setText(step.text);
                this.narrationText.setDepth(100);  // 再次确保深度
            }
        }, 500);

        // 隐藏角色立绘（旁白时不需要显示）
        this._hideCharacterPortrait();

        this.waitingForInput = false;
        this._showContinueHint(false);
    }

    /**
     * 对话框统一显隐控制（替代 Container.setVisible）
     * @param {boolean} visible - 是否可见
     */
    _setDialogVisible(visible) {
        this.dialogBox.visible = visible;
        
        // 绘制或清除对话框背景
        if (visible && this.dialogBg) {
            this.dialogBg.clear();
            this.dialogBg.fillStyle(0x1a1a2e, 0.95);
            this.dialogBg.fillRoundedRect(this._dialogX, this._dialogY, this._dialogW, this._dialogH, 16);
            this.dialogBg.lineStyle(3, 0xffcc00, 1);
            this.dialogBg.strokeRoundedRect(this._dialogX, this._dialogY, this._dialogW, this._dialogH, 16);
            this.dialogBg.setVisible(true);
        } else if (this.dialogBg) {
            this.dialogBg.setVisible(false);
        }

        // 头像框
        if (visible && this.avatarBg) {
            this.avatarBg.clear();
            this.avatarBg.fillStyle(0x8b7355, 1);
            this.avatarBg.fillRoundedRect(this._dialogX + 16, this._dialogY + 14, 76, 76, 8);
            this.avatarBg.lineStyle(2, 0xffffff, 0.5);
            this.avatarBg.strokeRoundedRect(this._dialogX + 14, this._dialogY + 14, 76, 76, 8);
            this.avatarBg.setVisible(true);
        } else if (this.avatarBg) {
            this.avatarBg.setVisible(false);
        }

        // 各文本组件
        if (this.avatarSprite) this.avatarSprite.setVisible(visible);
        if (this.avatarImage) this.avatarImage.setVisible(visible);
        if (this.nameText) this.nameText.setVisible(visible);
        if (this.contentText) this.contentText.setVisible(visible);
    }

    /**
     * 绘制对话框背景（位置/尺寸变化时调用，如窗口resize）
     */
    _refreshDialogBackground() {
        if (!this.dialogBg || !this.dialogBox.visible) return;
        this._setDialogVisible(true);  // 重绘
    }

    /**
     * 显示对话
     * @param {Object} step - 步骤数据
     */
    _showDialogue(step) {
        // 隐藏旁白，显示对话框
        this.narrationText.setVisible(false);
        this._setDialogVisible(true);

        console.log(`[诊断] _showDialogue | step: ${step.id} | text: "${(step.text || '').substring(0, 40)}"`);

        // 更新头像和名称
        this._updateAvatar(step.character, step.avatar);
        this._updateName(step.name || '');

        // 显示角色立绘（除非步骤要求隐藏，如特写时）
        if (step.hidePortrait) {
            this._hideCharacterPortrait();
        } else {
            this._showCharacterPortrait(step.character);
        }

        // 显示特写图片（如果有）
        if (step.overlayImage) {
            this._showOverlayImage(step.overlayImage);
        } else {
            this._hideOverlayImage();
        }

        // 打字机效果
        this.typewriter.start(step.text, {
            targetField: this.contentText,
            speed: 50
        });

        console.log(`[诊断] typewriter已启动 | isTyping=${this.typewriter.isTyping} | targetTextField=${!!this.typewriter?.targetTextField}`);

        // 500ms 后用 setTimeout 检查文字是否开始显示（避免场景时钟问题）
        setTimeout(() => {
            if (!this.contentText) return;
            const txt = this.contentText.text || '(空)';
            console.log(`[诊断] 打字机500ms后 | contentText="${txt.substring(0, 40)}" | isTyping=${this.typewriter?.isTyping} | visible=${this.contentText.visible}`);
            
            // 如果打字机没在打字且内容为空 → 强制写入完整文本（终极备用方案）
            if (!this.typewriter?.isTyping && txt.length === 0 && step.text) {
                console.warn('[诊断] !!! 打字机未输出文字，强制写入完整文本 !!!');
                this.contentText.setText(step.text);
            }
        }, 500);

        this.waitingForInput = false;
        this._showContinueHint(false);

        // 解锁图鉴
        if (step.unlockHerb) { this._unlockHerb(step.unlockHerb); }

        // 设置灵宠
        if (step.setPet) {
            this.gameState.pet = { id: step.setPet, name: '青苗', type: 'plant', level: 1 };
        }

        // 设置标记
        if (step.setFlag) { this._setFlag(step.setFlag, true); }
    }

    /**
     * 显示选择分支
     * @param {Object} step - 步骤数据
     */
    _showChoice(step) {
        this.dialogBox.setVisible(false);

        // 隐藏特写图片（选择时不需要显示）
        this._hideOverlayImage();

        this.currentOptions = step.options;

        // 延迟显示选择（让之前的文本先显示完）
        this.time.delayedCall(300, () => {
            this.choiceSystem.show(step.options, { centerVertical: true });
        });
    }

    /**
     * 选择回调
     * @param {Object} option - 选中的选项
     * @param {number} index - 选项索引
     */
    _onChoiceSelected(option, index) {
        void index; // 消除未使用参数警告
        console.log('IntroScene: 选择', option.text, option.flag);

        // 保存标记
        if (option.flag) {
            this.gameState.playerTrait = option.flag;
        }

        // 显示该选项对应的回复（如果有）
        if (option.response) {
            // 隐藏选择系统
            this.choiceSystem.hide();

            // 显示回复对话
            this.dialogBox.setVisible(true);
            this._updateAvatar(option.response.character, option.response.avatar);
            this._updateName(option.response.name || '');

            // 打字机效果显示回复
            this.typewriter.start(option.response.text, {
                targetField: this.contentText,
                speed: 50
            });

            this.waitingForInput = false;
            this._showContinueHint(false);

            // 设置下一步
            if (option.response.nextStep) {
                this._pendingNextStep = option.response.nextStep;
            }

            return;
        }

        // 如果没有回复，直接找下一步
        const nextStepId = option.next;
        if (nextStepId) {
            const nextStep = this._findStepById(nextStepId);
            if (nextStep) {
                this.currentStepIndex = this.currentSteps.indexOf(nextStep);
                this._executeStep();
                return;
            }
        }

        // 默认：下一步
        this._nextStep();
    }

    /**
     * 根据ID查找步骤
     * @param {string} stepId - 步骤ID
     * @returns {Object|null}
     */
    _findStepById(stepId) {
        return this.currentSteps.find(s => s.id === stepId) || null;
    }

    /**
     * 显示教程
     * @param {Object} step - 步骤数据
     */
    _showTutorial(step) {
        this.tutorialActive = true;

        // 保存当前教程步骤（用于点击跳过）
        this._currentTutorialStep = step;

        // 隐藏特写图片（教程时通常不需要显示）
        this._hideOverlayImage();

        const tutorialAction = step.tutorialAction || '';
        const hint = step.hint || '';

        console.log('IntroScene: 教程步骤', tutorialAction, step.skippable ? '(可跳过)' : '');

        // === 第一章模式：所有教程默认可点击跳过 ===
        // 在剧情模式下，交互类教程（采集、探索等）应变为"提示+点击继续"
        const isChapter1 = this._isChapter1;
        const isSkippable = !!step.skippable || isChapter1;

        // 显示教程遮罩
        this.tutorialOverlay.show({
            hint: hint,
            hintPosition: step.hintPosition || 'bottom',
            highlightTargets: step.highlightTargets || [],
            clickToContinue: isSkippable,  // 第一章模式下全部允许点击继续
            onComplete: () => this._onTutorialComplete(step)
        });

        // 根据动作类型执行不同逻辑
        switch (tutorialAction) {
            case 'highlight_herb':
                this._tutorialHighlightHerb(step);
                break;
            case 'show_collect_prompt':
                this._tutorialShowCollectPrompt(step);
                break;
            case 'play_collect_animation':
                this._tutorialPlayCollectAnimation(step);
                break;
            case 'open_backpack':
            case 'open_backpack_tutorial':
                this._tutorialOpenBackpack(step);
                break;
            case 'highlight_herb_info':
                this._tutorialHighlightHerbInfo(step);
                break;
            case 'open_herb_pedia':
                this._tutorialOpenHerbPedia(step);
                break;
            case 'close_backpack':
                this._tutorialCloseBackpack(step);
                break;
            case 'collect_juhua':
                this._tutorialCollectJuhua(step);
                break;
            // === 第一章新增教程动作 ===
            case 'movement_hint':           // 移动操作提示（C01）
            case 'collect_gancao':           // 采集甘草（C02）
            case 'shop_price_hint':         // 药店价格提示（C06）
            case 'village_explore':         // 村庄探索（C08）
            case 'unlock_shop':             // 解锁药铺（C12）
            case 'unlock_valley_portal':     // 解锁溪谷传送门（C14）
            case 'valley_explore':          // 溪谷探索（C15）
            case 'collect_yinchen':         // 采集茵陈（C15）
            case 'follow_qingmiao':         // 跟随青苗（C15）
            case 'collect_shichangpu':      // 采集石菖蒲（C15）
                // 这些都是"提示类"教程，显示提示后点击即完成
                console.log(`[第一章] 提示类教程: ${tutorialAction}，isSkippable=${isSkippable}`);
                if (isSkippable) {
                    // 可跳过模式：玩家点击 overlay 即关闭
                } else {
                    // ★ 不可跳过模式（如 C01 从跨JSON加载时 _isChapter1=false）：
                    // 自动在延迟后完成，确保教程不会卡住
                    const autoDelay = Math.max(step.nextDelay || 3000, 2000);
                    this.time.delayedCall(autoDelay, () => {
                        if (this.tutorialActive) {
                            this._onTutorialComplete(step);
                        }
                    });
                }
                break;
            // === 序章原有占位符 ===
            case 'sun_drying':
            case 'drag_herb_to_tray':
            case 'wait_drying':
            case 'grind_herb':
            case 'complete_grinding':
                this._tutorialPlaceholder(step);
                break;
            default:
                // 没有特殊动作的教程，短暂延迟后自动完成（同时支持点击跳过）
                console.log(`[教程] 未实现的教程动作: ${tutorialAction}，${isSkippable ? '可点击' : '自动'}完成`);
                if (!isSkippable) {
                    // 仅在非跳过模式下自动完成
                    this.time.delayedCall(Math.max(step.nextDelay || 500, 500), () => {
                        this._onTutorialComplete(step);
                    });
                }
                // 如果可跳过（第一章模式），则依赖点击继续，不自动完成
        }
    }

    /**
     * 教程：高亮草药
     */
    _tutorialHighlightHerb(step) {
        // TODO: 实际游戏中需要高亮场景中的草药对象
        // 这里先显示提示
        console.log('IntroScene: 教程 - 高亮草药', step.herbId);
        void step; // 消除未使用参数警告
    }

    /**
     * 教程：显示采集提示
     */
    _tutorialShowCollectPrompt(step) {
        console.log('IntroScene: 教程 - 显示采集提示');
        void step;
    }

    /**
     * 教程：播放采集动画（真实添加到背包）
     */
    _tutorialPlayCollectAnimation(step) {
        console.log('IntroScene: 教程 - 播放采集动画', step.herbId);

        const herbId = step.herbId || 'gancao';
        const herbName = herbId === 'gancao' ? '甘草' : herbId === 'juhua' ? '菊花' : herbId;

        // 真实添加到背包
        if (window.gameStateManager) {
            const isNewUnlock = window.gameStateManager.addHerbToBackpack(herbId);
            if (isNewUnlock) {
                console.log('IntroScene: 解锁新草药图鉴', herbId);
                // 更新图鉴UI（如果图谱窗口已打开）
                if (window.uiManager) {
                    window.uiManager.updateHerbGuideUI();
                }
            }
        }

        // 显示浮动文字
        this._showFloatingText(`+${herbName}×1`, 0xa8e860);

        // 延迟完成教程
        this.time.delayedCall(1000, () => {
            this._onTutorialComplete(step);
        });
    }

    /**
     * 教程：打开背包（真实联动）
     */
    _tutorialOpenBackpack(step) {
        console.log('IntroScene: 教程 - 打开背包');

        // 先显示UI元素（序章期间被隐藏了）
        const topRightButtons = document.getElementById('top-right-buttons');
        if (topRightButtons) {
            topRightButtons.style.display = '';
        }

        // 真实打开背包弹窗
        if (window.uiManager) {
            // 刷新背包数据
            window.uiManager.updateBackpackUI();

            // 打开背包弹窗
            window.uiManager.openModal('backpack-modal');

            // 监听关闭事件：关闭后恢复对话框，等待玩家再点一次确认
            this._setupModalCloseCallback(() => {
                console.log('IntroScene: 背包已关闭，等待玩家点击确认');
                this._modalClosedPendingConfirm = true;

                // 隐藏UI元素（恢复序章隐藏状态）
                const buttons = document.getElementById('top-right-buttons');
                if (buttons) {
                    buttons.style.display = 'none';
                }

                // 恢复对话框显示（让玩家看到"点击继续"提示）
                this.dialogBox.setVisible(true);
                this.waitingForInput = true;
                this._showContinueHint(true);
            });

            return; // 不自动完成，等待玩家关闭背包后再点一次
        }

        // 如果uiManager不存在，直接完成
        this.time.delayedCall(500, () => {
            this._onTutorialComplete(step);
        });
    }

    /**
     * 教程：高亮草药信息（显示详情）
     */
    _tutorialHighlightHerbInfo(step) {
        console.log('IntroScene: 教程 - 高亮草药信息', step.herbId);

        const herbId = step.herbId || 'gancao';

        // 如果背包弹窗已打开，选中该物品并显示详情
        if (window.uiManager && typeof window.uiManager.selectItem === 'function') {
            window.uiManager.selectItem(herbId);
            if (typeof window.uiManager.showDetailPanel === 'function') {
                window.uiManager.showDetailPanel(herbId);
            }
        }

        // 延迟完成教程
        this.time.delayedCall(1500, () => {
            this._onTutorialComplete(step);
        });
    }

    /**
     * 教程：打开图鉴（真实联动）
     */
    _tutorialOpenHerbPedia(step) {
        console.log('IntroScene: 教程 - 打开图鉴');

        // 先显示UI元素
        const topRightButtons = document.getElementById('top-right-buttons');
        if (topRightButtons) {
            topRightButtons.style.display = '';
        }

        // 真实打开图鉴弹窗
        if (window.uiManager) {
            // 刷新图谱数据（确保刚解锁的甘草已显示）
            window.uiManager.updateHerbGuideUI();

            // 打开图鉴弹窗
            window.uiManager.openModal('herb-guide-modal');

            // 监听关闭事件：关闭后恢复对话框，等待玩家再点一次确认
            this._setupModalCloseCallback(() => {
                console.log('IntroScene: 图鉴已关闭，等待玩家点击确认');
                this._modalClosedPendingConfirm = true;

                // 隐藏UI元素（恢复序章隐藏状态）
                const buttons = document.getElementById('top-right-buttons');
                if (buttons) {
                    buttons.style.display = 'none';
                }

                // 恢复对话框显示（让玩家看到"点击继续"提示）
                this.dialogBox.setVisible(true);
                this.waitingForInput = true;
                this._showContinueHint(true);
            });

            return; // 不自动完成，等待玩家关闭图鉴后再点一次
        }

        // 如果uiManager不存在，直接完成
        this.time.delayedCall(500, () => {
            this._onTutorialComplete(step);
        });
    }

    /**
     * 教程：关闭背包/图鉴（真实联动）
     */
    _tutorialCloseBackpack(step) {
        console.log('IntroScene: 教程 - 关闭背包/图鉴');

        // 真实关闭所有弹窗
        if (window.uiManager) {
            window.uiManager.closeAllModals();
        }

        // 隐藏UI元素（恢复序章隐藏状态）
        const topRightButtons = document.getElementById('top-right-buttons');
        if (topRightButtons) {
            topRightButtons.style.display = 'none';
        }

        // 延迟完成
        this.time.delayedCall(300, () => {
            this._onTutorialComplete(step);
        });
    }

    /**
     * 教程：采集菊花（真实采集）
     */
    _tutorialCollectJuhua(step) {
        console.log('IntroScene: 教程 - 采集菊花', step.requiredCount);

        const requiredCount = step.requiredCount || 2;
        let collectedCount = 0;

        // 模拟采集过程（实际游戏中应该等待玩家操作）
        const collectOne = () => {
            if (collectedCount < requiredCount) {
                collectedCount++;

                // 真实添加到背包
                if (window.gameStateManager) {
                    window.gameStateManager.addHerbToBackpack('juhua');
                    if (window.uiManager) {
                        window.uiManager.updateBackpackUI();
                    }
                }

                // 显示浮动文字
                this._showFloatingText(`+菊花×1`, 0xa8e860);

                // 继续采集下一株
                if (collectedCount < requiredCount) {
                    this.time.delayedCall(800, collectOne);
                } else {
                    // 全部采集完成
                    console.log(`IntroScene: 菊花采集完成，共${requiredCount}株`);
                    this.time.delayedCall(500, () => {
                        this._onTutorialComplete(step);
                    });
                }
            }
        };

        // 开始采集
        this.time.delayedCall(500, collectOne);
    }

    /**
     * 教程占位符（未实现的功能）
     */
    _tutorialPlaceholder(step) {
        console.log('IntroScene: 教程占位符', step.tutorialAction);
        void step;
        this.time.delayedCall(2000, () => {
            this._onTutorialComplete(step);
        });
    }

    /**
     * 教程点击回调
     */
    _onTutorialClick() {
        console.log('[诊断] _onTutorialClick 被调用 | tutorialActive:', this.tutorialActive, '| currentTutorialStep:', this._currentTutorialStep?.id, '| _isChapter1:', this._isChapter1);

        // 优先检查：弹窗已关闭，等待玩家点击确认完成教程
        if (this._modalClosedPendingConfirm) {
            console.log('[诊断] 弹窗已关闭，确认完成教程');
            this._modalClosedPendingConfirm = false;
            this._onTutorialComplete(this._currentTutorialStep);
            return;
        }

        // 主动检测：背包/图鉴弹窗是否已被用户手动关闭
        // （兼容 MutationObserver 未及时触发的边界情况）
        if (this._currentTutorialStep) {
            const action = this._currentTutorialStep.tutorialAction;
            if (action === 'open_backpack' || action === 'open_backpack_tutorial' || action === 'open_herb_pedia') {
                const overlay = document.getElementById('modal-overlay');
                const isOverlayHidden = !overlay ||
                    overlay.style.display === 'none' ||
                    overlay.classList.contains('hidden') ||
                    overlay.offsetParent === null;

                if (isOverlayHidden) {
                    console.log('[诊断] 检测到弹窗已关闭，完成教程', action);
                    this._modalClosedPendingConfirm = false;
                    // 清理监听器
                    this._modalCloseCallback = null;
                    if (this._modalObserver) {
                        this._modalObserver.disconnect();
                        this._modalObserver = null;
                    }
                    // 隐藏UI元素
                    const buttons = document.getElementById('top-right-buttons');
                    if (buttons) buttons.style.display = 'none';
                    this._onTutorialComplete(this._currentTutorialStep);
                    return;
                }
            }
        }

        // 检查当前教程是否可跳过（支持第一章模式）
        if (this._currentTutorialStep) {
            const isSkippable = this._currentTutorialStep.skippable || this._isChapter1;
            console.log(`[诊断] 检查跳过条件 | skippable=${!!this._currentTutorialStep.skippable} | _isChapter1=${this._isChapter1} | isSkippable=${isSkippable}`);
            if (isSkippable) {
                console.log('[诊断] ✅ 执行教程完成！stepId=', this._currentTutorialStep.id, this._isChapter1 ? '(第一章模式)' : '');
                this._onTutorialComplete(this._currentTutorialStep);
                return;
            }
        }

        console.warn('[诊断] ⚠️ 教程不可跳过，忽略点击');
    }

    /**
     * 教程完成回调
     * @param {Object} step - 完成的步骤
     */
    _onTutorialComplete(step) {
        console.log('[诊断] _onTutorialComplete 被调用 | step:', step?.id, '| tutorialOverlay存在:', !!this.tutorialOverlay);

        void step; // 消除未使用参数警告

        // 清理弹窗关闭回调（如果存在）
        this._modalCloseCallback = null;

        // 清理 MutationObserver
        if (this._modalObserver) {
            this._modalObserver.disconnect();
            this._modalObserver = null;
        }

        this.tutorialActive = false;
        console.log('[诊断] 调用 tutorialOverlay.hide()...');
        try {
            this.tutorialOverlay.hide(() => {
                console.log('[诊断] tutorialOverlay.hide 回调执行 → _nextStep()');
                this._nextStep();
            });
        } catch (error) {
            console.error('[诊断] !!! tutorialOverlay.hide 失败 !!!', error);
            // 强制继续下一步
            this.time.delayedCall(100, () => {
                console.log('[诊断] 强制执行 _nextStep()');
                this._nextStep();
            });
        }
    }

    /**
     * 设置弹窗关闭回调（用于等待玩家关闭背包/图鉴后继续剧情）
     * @param {Function} callback - 关闭后的回调函数
     */
    _setupModalCloseCallback(callback) {
        // 保存回调
        this._modalCloseCallback = callback;

        // 防止重复触发（同一回调只执行一次）
        let callbackFired = false;
        const fireOnce = () => {
            if (callbackFired) return;
            callbackFired = true;
            this._handleModalClosed();
        };

        // 1. 监听ESC键关闭弹窗
        const escHandler = (event) => {
            if (event.key === 'Escape') {
                fireOnce();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 2. 监听遮罩层点击关闭
        setTimeout(() => {
            const overlay = document.getElementById('modal-overlay');
            if (overlay) {
                const clickHandler = () => {
                    fireOnce();
                    overlay.removeEventListener('click', clickHandler);
                };
                overlay.addEventListener('click', clickHandler);
            }
        }, 100);

        // 3. 使用 MutationObserver 检测弹窗被隐藏/移除（最可靠）
        setTimeout(() => {
            const modalOverlay = document.getElementById('modal-overlay');
            const targetNode = modalOverlay || document.body;

            this._modalObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    // 检查弹窗是否变为不可见或被移除
                    const overlay = document.getElementById('modal-overlay');
                    if (!overlay || overlay.style.display === 'none' || overlay.classList.contains('hidden')) {
                        fireOnce();
                        break;
                    }
                }
            });

            this._modalObserver.observe(targetNode, {
                childList: true,
                attributes: true,
                subtree: true,
                attributeFilter: ['style', 'class']
            });
        }, 200);
    }

    /**
     * 处理弹窗被关闭的事件
     */
    _handleModalClosed() {
        if (this._modalCloseCallback) {
            console.log('IntroScene: 弹窗已关闭，执行回调');
            const cb = this._modalCloseCallback;
            this._modalCloseCallback = null;
            cb();
        }
    }

    /**
     * 显示CG演出
     * @param {Object} step - 步骤数据
     */
    _showCG(step) {
        // 隐藏特写图片（CG显示时不需要）
        this._hideOverlayImage();

        const cgId = step.cgId || (step.cgConfig && step.cgConfig.image);
        const cgKey = cgId ? cgId.replace('.png', '') : 'cg_01_school';

        console.log('IntroScene: 显示CG', cgKey);

        // 隐藏对话框
        this.dialogBox.setVisible(false);

        // 显示旁白文本（如果有）
        if (step.text) {
            this._showCGNarration(step);
            return;
        }

        // 显示CG
        this.cgDisplay.show(cgKey, {
            fadeInDuration: (step.cgConfig && step.cgConfig.fadeInDuration) || 1000,
            kenBurns: step.cgConfig && step.cgConfig.kenBurns && step.cgConfig.kenBurns.enabled,
            kenBurnsDirection: step.cgConfig && step.cgConfig.kenBurns && step.cgConfig.kenBurns.direction,
            onComplete: () => {
                this.time.delayedCall(step.nextDelay || 2000, () => {
                    this._nextStep();
                });
            }
        });
    }

    /**
     * 显示CG旁白
     * @param {Object} step - 步骤数据
     */
    _showCGNarration(step) {
        // 先销毁旧的CG旁白（防止残留）
        if (this._cgNarrationBox) {
            this._cgNarrationBox.destroy();
            this._cgNarrationBox = null;
        }

        // 创建CG旁白文本框
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this._cgNarrationBox = this.add.text(width / 2, height - 100, '', {
            fontSize: '24px',
            color: '#f0e8d4',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif',
            align: 'center',
            wordWrap: { width: width - 200 }
        })
            .setOrigin(0.5)
            .setDepth(60);

        // 打字机效果
        this.typewriter.start(step.text, {
            targetField: this._cgNarrationBox,
            speed: 60,
            onComplete: () => {
                this.time.delayedCall(step.textDelay || 1000, () => {
                    if (this._cgNarrationBox) {
                        this._cgNarrationBox.destroy();
                        this._cgNarrationBox = null;
                    }
                    this._nextStep();
                });
            }
        });
    }

    /**
     * 显示灵宠选择
     * @param {Object} step - 步骤数据
     */
    _showPetSelection(step) {
        console.log('IntroScene: 灵宠选择');

        // 隐藏特写图片（灵宠选择时不需要）
        this._hideOverlayImage();

        const pets = step.pets || [];
        const availablePets = pets.filter(p => p.available !== false);

        // 简化：直接选择第一个可用的灵宠（青苗）
        if (availablePets.length > 0) {
            const selectedPet = availablePets[0];

            // 显示觉醒CG
            this.time.delayedCall(500, () => {
                this.cgDisplay.showAwakening(selectedPet.id, () => {
                    // 保存灵宠
                    this.gameState.pet = {
                        id: selectedPet.id,
                        name: selectedPet.name,
                        type: selectedPet.type,
                        level: 1
                    };
                    console.log('IntroScene: 灵宠选择完成', this.gameState.pet);

                    // 继续下一步
                    this._nextStep();
                });
            });
        } else {
            // 没有可用灵宠，跳过
            this._nextStep();
        }
    }

    /**
     * 显示奖励（真实添加到背包/游戏状态）
     * @param {Object} step - 步骤数据
     */
    _showReward(step) {
        console.log('IntroScene: 显示奖励');

        // 隐藏特写图片（奖励显示时不需要）
        this._hideOverlayImage();

        const items = step.items || [];
        let rewardText = '获得：\n';

        // 获取草药ID列表，用于判断奖励类型
        const HERB_IDS = (window.GameData && window.GameData.HERBS_DATA)
            ? window.GameData.HERBS_DATA.map(h => h.id) : [];

        // 数值类物品（不入背包，写入属性系统 + 展示）
        const ATTR_IDS = ['reputation', 'achievement'];

        // 状态管理器引用（统一写入目标）
        const gsmState = window.gameStateManager ? window.gameStateManager.state : this.gameState;

        items.forEach(item => {
            const count = item.count ? `×${item.count}` : '';
            rewardText += `${item.icon || '📦'} ${item.name}${count}\n`;

            // 属性类（声望等）：写入 state.attributes 并跳过背包入库
            if (ATTR_IDS.includes(item.id)) {
                if (window.gameStateManager) {
                    const oldVal = window.gameStateManager.getAttribute(item.id) || 0;
                    window.gameStateManager.addAttribute(item.id, item.count || 0);
                    console.log(`IntroScene: 属性 ${item.id} 已更新: ${oldVal} → ${window.gameStateManager.getAttribute(item.id)}`);
                }
                return;
            }

            // 判断是草药还是物资
            const isHerb = HERB_IDS.includes(item.id);

            if (isHerb && window.gameStateManager) {
                // 草药：通过 gameStateManager 添加（自动解锁图鉴）
                for (let i = 0; i < (item.count || 1); i++) {
                    window.gameStateManager.addHerbToBackpack(item.id);
                }
            } else if (item.id === 'copper') {
                // 铜钱：写入 gameStateManager.state.copper
                gsmState.copper = (gsmState.copper || 0) + item.count;
            } else {
                // 其他物资：写入 gameStateManager.state.inventory
                if (!gsmState.inventory) gsmState.inventory = {};
                gsmState.inventory[item.id] = (gsmState.inventory[item.id] || 0) + (item.count || 1);
            }

            console.log('IntroScene: 物品已添加', item.id, '→', isHerb ? 'backpack' : 'inventory');
        });

        // 刷新UI（背包、图鉴、情籍属性面板）
        if (window.uiManager) {
            window.uiManager.updateBackpackUI();
            window.uiManager.updateHerbGuideUI();
            window.uiManager.updateAttributesUI();
        }

        // 显示奖励文本
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const rewardDisplay = this.add.text(width / 2, height / 2, rewardText, {
            fontSize: '26px',
            color: '#ffcc00',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif',
            align: 'center',
            lineSpacing: 10,
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 15 }
        })
            .setOrigin(0.5)
            .setDepth(60);

        // 日志输出获得的物资
        console.log('IntroScene: 奖励已添加到背包', this.gameState);

        // 等待后消失
        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: rewardDisplay,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    rewardDisplay.destroy();
                    this._nextStep();
                }
            });
        });
    }

    /**
     * 显示标题卡
     * @param {Object} step - 步骤数据
     */
    _showTitleCard(step) {
        console.log('IntroScene: 显示标题卡', step.text);

        // 隐藏对话框和旁白文本
        this.dialogBox.setVisible(false);
        this.narrationText.setVisible(false);

        // 隐藏特写图片（标题卡显示时不需要）
        this._hideOverlayImage();

        this.cgDisplay.showTitleCard(step.text, {
            textColor: step.textColor || '#f0e8d4',
            fontSize: '38px',
            duration: step.duration || 2000,
            onComplete: () => {
                this._nextStep();
            }
        });
    }

    /**
     * 处理点击事件
     */
    _handleClick() {
        // ★ 小游戏场景激活时，忽略所有 IntroScene 输入
        if (this._flowerGameActive) return;
        if (this._diagnosisGameActive) return;
        if (this.choiceSystem && this.choiceSystem.isActive) return;
        if (this.tutorialActive) return;

        // 小游戏：处方/辨药小游戏的选择确认（打字完成后点击推进）
        if (this._pendingMinigameAdvance && this.waitingForInput) {
            this._pendingMinigameAdvance = false;
            this._nextStep();
            return;
        }

        if (this.typewriter && this.typewriter.isTyping) {
            // 立即完成打字
            this.typewriter.complete();
        } else if (this.waitingForInput) {
            // 检查是否有待处理的下一步（选择回复后）
            if (this._pendingNextStep) {
                const nextStepId = this._pendingNextStep;
                this._pendingNextStep = null;

                // 查找并执行下一步
                const nextStep = this._findStepById(nextStepId);
                if (nextStep) {
                    this.currentStepIndex = this.currentSteps.indexOf(nextStep);
                    this._executeStep();
                    return;
                }
            }

            // 进入下一步
            this._nextStep();
        }
    }

    /**
     * 推进诊断小游戏到下一轮
     */
    _advanceDiagnosisPhase() {
        const phase = this._diagnosisPhases && this._diagnosisPhases[this._diagnosisPhaseIndex];
        if (!phase) return;

        const questionText = `【${phase.label}】${phase.question}\n\n${phase.options.map((o, i) => `${i + 1}. ${o.text}`).join('\n')}\n\n（输入数字键 1-${phase.options.length} 选择）`;

        this.typewriter.start(questionText, {
            targetField: this.contentText,
            speed: 40,
            onComplete: () => {
                this.waitingForInput = true;
                this._showContinueHint(true);
                this._setupDiagnosisPhaseInput(phase);
            }
        });
    }

    /**
     * 设置诊断阶段输入
     */
    _setupDiagnosisPhaseInput(phase) {
        if (this._minigameKeyHandler) {
            this.input.keyboard.off('keydown', this._minigameKeyHandler);
        }

        this._minigameKeyHandler = (event) => {
            const num = parseInt(event.key);
            if (isNaN(num) || num < 1 || num > phase.options.length) return;

            const selected = phase.options[num - 1];
            console.log('IntroScene: 诊断选择', phase.phase, num, selected.text, selected.correct ? '✓' : '✗');

            if (selected.correct) this._diagnosisScore = (this._diagnosisScore || 0) + 2;

            // 显示本轮结果
            this._updateName(phase.label);
            this._updateAvatar(null, null);
            this.typewriter.start(`选择：${selected.text}\n线索：${selected.clue}`, {
                targetField: this.contentText,
                speed: 40,
                onComplete: () => {
                    this._diagnosisPhaseIndex++;
                    if (this._diagnosisPhaseIndex >= this._diagnosisPhases.length) {
                        // 所有阶段完成
                        this._finishDiagnosis();
                    } else {
                        this.waitingForInput = true;
                        this._showContinueHint(true);
                        this._pendingDiagnosisNext = true;
                    }
                }
            });
        };

        this.input.keyboard.on('keydown', this._minigameKeyHandler);
    }

    /**
     * 完成诊断小游戏
     */
    _finishDiagnosis() {
        const step = this._diagnosisStep;
        const score = this._diagnosisScore || 0;
        const threshold = (step && step.scoreThreshold) || 3;
        let feedback = '';
        let reward = null;

        if (score >= (step ? step.perfectScore || 8 : 8)) {
            feedback = step ? step.perfectFeedback : '诊断精准！';
            reward = step ? step.rewardOnPerfect : null;
        } else if (score >= threshold) {
            feedback = step ? step.passFeedback : '诊断基本正确。';
            reward = step ? step.rewardOnPass : null;
        } else {
            feedback = step ? step.failFeedback : '诊断有待提高。';
            reward = step ? step.rewardOnFail : null;
        }

        const resultText = `${step ? step.diagnosisResult : '诊断完成'}\n\n得分：${score}\n${feedback}`;

        this.typewriter.start(resultText, {
            targetField: this.contentText,
            speed: 40,
            onComplete: () => {
                // 应用奖励
                if (reward) {
                    if (reward.diagnosis) this._applyAttributeDelta('diagnosis', reward.diagnosis);
                    if (reward.reputation) this._applyAttributeDelta('reputation', reward.reputation);
                }

                // 清理
                if (this._minigameKeyHandler) {
                    this.input.keyboard.off('keydown', this._minigameKeyHandler);
                    this._minigameKeyHandler = null;
                }

                this.waitingForInput = true;
                this._showContinueHint(true);
                this.time.delayedCall(500, () => this._nextStep());
            }
        });
    }

    /**
     * 进入下一步
     */
    _nextStep() {
        this.waitingForInput = false;
        this._showContinueHint(false);

        // 如果上一步用了 bgColor 覆盖背景（如信纸），恢复当前场景的原图
        if (this._bgColorOverrideActive) {
            this._bgColorOverrideActive = false;
            const currentScene = this.prologueData.scenes[this.currentSceneIndex];
            if (currentScene) {
                this._setBackground(currentScene);
            }
        }

        this.currentStepIndex++;

        // 检查是否有 nextScene 跳转
        const currentStep = this.currentSteps[this.currentStepIndex - 1];
        if (currentStep && currentStep.nextScene) {
            // === 调试模式检查：阻止跨场景跳转 ===
            if (this._debugMode) {
                console.log('[调试] 步骤有 nextScene 跳转，但调试模式已阻止（停在当前场景）');
                // 不跳转，当作普通下一步处理
            } else {
                // ★ 场景切换前：处理当前场景的 unlockSystems（如 S09 毕业奖励）
                const currentScene = this.prologueData.scenes[this.currentSceneIndex];
                if (currentScene && currentScene.unlockSystems) {
                    console.log(`[奖励] 场景 ${currentScene.id} 结束时解锁系统:`, currentScene.unlockSystems);
                    currentScene.unlockSystems.forEach(system => {
                        console.log('[奖励] 解锁系统:', system);
                    });
                }

                // 跳转到指定场景
                let nextSceneIndex = this.prologueData.scenes.findIndex(s => s.id === currentStep.nextScene);

                // ★ 跨JSON查找：当前数据中找不到 → 尝试 chapter1 缓存
                if (nextSceneIndex < 0) {
                    const ch1Data = this.cache.json.get('chapter1_data') || window._chapter1Data;
                    if (ch1Data && ch1Data.scenes) {
                        nextSceneIndex = ch1Data.scenes.findIndex(s => s.id === currentStep.nextScene);
                        if (nextSceneIndex >= 0) {
                            console.log(`[跨JSON] 从序章跳转到第一章场景 ${currentStep.nextScene}（索引 ${nextSceneIndex}）`);
                            this.prologueData = ch1Data;
                            this._isChapter1 = false;  // C01是序章衔接第一章的过场，非章节完结
                            this._returnToGame = false;
                            this.currentSceneIndex = -1; // _startScene 会 +1 设为 0
                            this._startScene(nextSceneIndex);
                            return;
                        }
                    }
                }

                if (nextSceneIndex >= 0) {
                    this._startScene(nextSceneIndex);
                    return;
                }
            }
        }

        // 执行下一步
        this.time.delayedCall(currentStep ? (currentStep.nextDelay || 500) : 500, () => {
            this._executeStep();
        });
    }

    /**
     * 更新头像显示
     * @param {string} character - 角色ID
     * @param {string} avatarKey - 头像texture key
     */
    _updateAvatar(character, avatarKey) {
        if (!this.avatarSprite || !this.avatarImage) return;

        const avatarX = this._dialogX + 54;
        const avatarY = this._dialogY + 52;

        if (!character) {
            // 无角色 → 显示旁白图标
            this.avatarImage.setVisible(false);
            this.avatarSprite.setText('📖').setPosition(avatarX, avatarY).setVisible(true);
            return;
        }

        // 尝试使用真实头像图片
        const textureKey = avatarKey ? avatarKey.replace('.png', '') : null;
        const hasImage = textureKey && this.textures.exists(textureKey);

        if (hasImage) {
            // 显示真实头像图片
            this.avatarSprite.setVisible(false);
            this.avatarImage.setTexture(textureKey)
                .setDisplaySize(72, 72)
                .setPosition(avatarX, avatarY)
                .setVisible(true);
        } else {
            // 兜底：Emoji 文字
            this.avatarImage.setVisible(false);
            this.avatarSprite.setText(this._getCharacterEmoji(character))
                .setPosition(avatarX, avatarY)
                .setVisible(true);
        }
    }

    /**
     * 获取角色Emoji占位符
     * @param {string} character - 角色ID
     * @returns {string}
     */
    _getCharacterEmoji(character) {
        const emojiMap = {
            // 序章
            'bai': '👴',
            'xiaolan': '👧',
            'qingmiao': '🌱',
            'narrator': '📖',
            'player': '😊',
            // 第一章 NPC
            'woodcutter': '🪓',
            'washerwoman': '👩',
            'merchant': '🧳',
            'cunzhang': '🏘',
            'laoli': '🌿',
            'villager_b': '👩',
            'zhangdaniang': '👵',
            'lvren': '🚶'
        };
        return emojiMap[character] || '❓';
    }

    /**
     * 更新名称显示
     * @param {string} name - 名称
     */
    _updateName(name) {
        if (this.nameText) {
            this.nameText.setText(name || '');
            this.nameText.setPosition(this._dialogX + 108, this._dialogY + 20);
        }
    }

    /**
     * 显示角色立绘
     * @param {string} character - 角色ID
     */
    _showCharacterPortrait(character) {
        if (!this.characterPortrait || !character) {
            this._hideCharacterPortrait();
            return;
        }

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 角色立绘映射表（角色ID -> {纹理key, 位置, 大小}）
        const portraitMap = {
            'bai': { texture: 'bai_standing', position: 'center', scale: 1 },       // 白师傅居中，标准大小
            'xiaolan': { texture: 'xiaolan_standing', position: 'center', scale: 0.5 }, // 小兰居中，缩小一半
            'qingmiao': { texture: 'lingchong_portrait', position: 'center', scale: 0.5, offsetY: -80 }, // 灵宠居中，缩小一半且上移
            'player': { texture: null, position: 'right' }     // 玩家在右侧
        };

        const config = portraitMap[character];

        if (config && config.texture && this.textures.exists(config.texture)) {
            // 根据位置设置坐标
            let targetX;
            if (config.position === 'center') {
                targetX = width / 2;
            } else if (config.position === 'right') {
                targetX = width - 150;
            } else {
                targetX = 120;
            }
            const targetY = height * 0.6 + (config.offsetY || 0);
            const scale = config.scale || 1;

            // 判断是否需要播放出现动画
            // 同一角色连续出场 + 立绘已可见 → 跳过动画，直接持续显示
            const isSameCharacter = (this._currentPortraitCharacter === character);
            const isAlreadyVisible = this.characterPortrait.visible && this.characterPortrait.alpha > 0.9;

            if (isSameCharacter && isAlreadyVisible) {
                // 同一角色连续多幕：仅更新位置和缩放，不播放动画
                this.characterPortrait.setPosition(targetX, targetY);
                this.characterPortrait.setScale(scale);
                return;
            }

            // 新角色或立绘不可见：设置纹理并播放滑入+淡入动画
            this.characterPortrait.setTexture(config.texture);
            this.characterPortrait.setScale(scale);

            // 先设置最终位置，再显示
            this.characterPortrait.setPosition(targetX, targetY);
            this.characterPortrait.setAlpha(0);
            this.characterPortrait.setVisible(true);

            // 从下方滑入 + 淡入动画
            this.characterPortrait.y += 30;  // 起始位置稍下

            this.tweens.add({
                targets: this.characterPortrait,
                alpha: 1,
                y: targetY,
                duration: 400,
                ease: 'Power2Out'
            });

            // 记录当前角色
            this._currentPortraitCharacter = character;
        } else {
            // 没有立绘资源，隐藏
            this._hideCharacterPortrait();
        }
    }

    /**
     * 隐藏角色立绘
     */
    _hideCharacterPortrait() {
        // 清除当前角色记录（隐藏后下次出现需要重新播放动画）
        this._currentPortraitCharacter = null;

        if (this.characterPortrait && this.characterPortrait.visible) {
            this.tweens.add({
                targets: this.characterPortrait,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    if (this.characterPortrait) {
                        this.characterPortrait.setVisible(false);
                    }
                }
            });
        }
    }

    /**
     * 显示特写图片（草药特写等）
     * @param {string} imageKey - 图片的 texture key
     */
    _showOverlayImage(imageKey) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 检查纹理是否存在
        if (!this.textures.exists(imageKey)) {
            console.warn('IntroScene: 特写图片不存在', imageKey);
            return;
        }

        // 判断是否需要播放出现动画
        // 同一特写连续多幕 + 已完全可见 → 跳过动画，直接持续显示
        const isSameImage = (this._currentOverlayImageKey === imageKey);
        const isAlreadyVisible = this.overlayImage && this.overlayImage.visible && this.overlayImage.alpha > 0.9;

        if (isSameImage && isAlreadyVisible) {
            // 同一张特写连续出现：保持现状，不重建不播动画
            return;
        }

        // 新特写或之前被隐藏：销毁旧的，创建新的并播放淡入动画
        if (this.overlayImage) {
            this.overlayImage.destroy();
            this.overlayImage = null;
        }
        if (this.overlayBorder) {
            this.overlayBorder.destroy();
            this.overlayBorder = null;
        }

        // 创建特写图片（右侧显示）
        this.overlayImage = this.add.image(width * 0.75, height * 0.4, imageKey)
            .setDisplaySize(400, 300)
            .setOrigin(0.5, 0.5)
            .setDepth(7)
            .setAlpha(0);

        // 添加边框效果
        const overlayBorder = this.add.graphics()
            .lineStyle(3, 0xffd700, 0.8)
            .strokeRoundedRect(width * 0.75 - 205, height * 0.4 - 155, 410, 310, 12)
            .setDepth(8)
            .setAlpha(0);

        // 淡入动画
        this.tweens.add({
            targets: [this.overlayImage, overlayBorder],
            alpha: 1,
            duration: 500,
            ease: 'Power2Out'
        });

        // 保存引用和记录当前key
        this.overlayBorder = overlayBorder;
        this._currentOverlayImageKey = imageKey;
    }

    /**
     * 隐藏特写图片
     */
    _hideOverlayImage() {
        // 清除当前特写记录（隐藏后下次出现需要重新播放动画）
        this._currentOverlayImageKey = null;

        // 立即停止所有相关动画
        if (this.overlayImage) {
            this.tweens.killTweensOf(this.overlayImage);
        }
        if (this.overlayBorder) {
            this.tweens.killTweensOf(this.overlayBorder);
        }

        // 立即销毁（不使用动画，避免残留）
        if (this.overlayImage) {
            this.overlayImage.destroy();
            this.overlayImage = null;
        }
        if (this.overlayBorder) {
            this.overlayBorder.destroy();
            this.overlayBorder = null;
        }

        // 确保引用已清空
        this.overlayImage = null;
        this.overlayBorder = null;
    }

    /**
     * 显示继续提示
     * @param {boolean} show - 是否显示
     */
    _showContinueHint(show) {
        if (this.continueHint) {
            this.continueHint.setVisible(show);
            if (show) {
                this.continueHint.setText('点击继续 ▾');
            }
        }
    }

    /**
     * 显示浮动文字
     * @param {string} text - 文字
     * @param {number} color - 颜色
     */
    _showFloatingText(text, color = 0xffffff) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const floatingText = this.add.text(width / 2, height / 2 - 50, text, {
            fontSize: '28px',
            color: `#${(color >>> 0).toString(16).padStart(6, '0')}`,
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 }
        })
            .setOrigin(0.5)
            .setDepth(100);

        // 上浮消失动画
        this.tweens.add({
            targets: floatingText,
            y: floatingText.y - 80,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => floatingText.destroy()
        });
    }

    /**
     * 解锁草药图鉴（真实联动）
     * @param {string} herbId - 草药ID
     */
    _unlockHerb(herbId) {
        console.log('IntroScene: 解锁草药图鉴', herbId);

        // 使用 gameStateManager 真实解锁
        if (window.gameStateManager) {
            // 先添加到背包（会自动解锁图鉴）
            window.gameStateManager.addHerbToBackpack(herbId);
        }

        // 保存到本地 gameState（兼容旧逻辑）
        if (!this.gameState.unlockedHerbs) {
            this.gameState.unlockedHerbs = [];
        }
        if (!this.gameState.unlockedHerbs.includes(herbId)) {
            this.gameState.unlockedHerbs.push(herbId);
        }

        // 刷新UI
        if (window.uiManager) {
            window.uiManager.updateBackpackUI();
            window.uiManager.updateHerbGuideUI();
        }
    }

    /**
     * 设置游戏标记
     * @param {string} flag - 标记名
     * @param {*} value - 标记值
     */
    _setFlag(flag, value) {
        this.gameState.flags[flag] = value;
        console.log('IntroScene: 设置标记', flag, value);
    }

    /**
     * 隐藏HTML UI元素（地图、背包、指南等）
     */
    _hideHTMLUI() {
        // 隐藏主要HUD面板
        const uiElements = [
            'top-left-panel',     // 左上角：小地图 + 时间日期
            'task-panel',         // 任务栏
            'top-right-buttons',  // 顶部右侧功能按钮
            'controls-hint',      // 底部操作提示
            'debug-panel',        // 调试面板
            'collect-prompt',     // 采集提示
            'collect-success',    // 采集成功提示
            'modal-overlay'       // 模态框遮罩
        ];

        uiElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
            }
        });

        // 隐藏所有模态框
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });

        console.log('IntroScene: 已隐藏HTML UI元素');
    }

    /**
     * 显示HTML UI元素（序章结束后恢复）
     */
    _showHTMLUI() {
        // ★ 恢复所有被 _hideHTMLUI() 隐藏的永久UI面板
        // 注意：ephemeral 元素（collect-prompt, collect-success, .modal）由各自的逻辑控制，此处不恢复
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

        // 确保 game-container 也可见（CSS 默认 display:none，必须显式设 block）
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }

        // ★ 重置 canvas z-index（剧情中设成了 1000，会盖住 z-index: 100 的 HTML UI）
        if (this.game && this.game.canvas) {
            this.game.canvas.style.zIndex = '';
        }

        console.log('IntroScene: 已恢复所有HTML UI元素');
    }

    /**
     * 初始化《本草情籍》属性（序章结束时调用）
     * 基于初始值 + 序章剧情中的学习/经历给予额外加成
     */
    _initPrologueAttributes() {
        if (!window.gameStateManager) return;

        // 1. 先用 data.js 中的 initialValue 初始化所有属性
        window.gameStateManager.initAttributes();

        // 2. 序章剧情加成 —— 根据序章中的学习经历额外增加属性值
        const bonusChanges = [
            // 草药学识+8（白院长药圃识药教学、图谱托付）
            { id: 'herb_knowledge', delta: 8 },
            // 采药技艺+10（亲手采集甘草、菊花教程）
            { id: 'gathering', delta: 10 },
            // 炮制药能+5（炮制间晾晒、碾磨教程）
            { id: 'crafting', delta: 5 },
            // 望闻问切+3（白院长诊断思路熏陶）
            { id: 'diagnosis', delta: 3 },
            // 医者声望+10（学堂毕业身份，来自S09奖励的reputation）
            { id: 'reputation', delta: 10 },
            // 交际人脉+3（白院长推荐信、小兰送信）
            { id: 'social', delta: 3 },
            // 灵宠羁绊+25（灵药房缔结灵契，与青苗初次相遇）
            { id: 'spirit_bond', delta: 25 },
            // 行医机缘+2（踏上旅程，机缘初开）
            { id: 'luck', delta: 2 }
        ];

        window.gameStateManager.batchAddAttributes(bonusChanges);

        console.log('《本草情籍》属性初始化完成:', { ...window.gameStateManager.state.attributes });
    }

    /**
     * 结束序章
     * @param {Object} step - 结束步骤数据
     * 显示辨药小游戏（模拟：dialogue + choice）
     * @param {Object} step - 步骤数据
     */
    _showHerbIdMinigame(step) {
        console.log('IntroScene: 辨药小游戏（模拟）', step.question);

        this.dialogBox.setVisible(false);
        this._hideOverlayImage();
        this.waitingForInput = false;
        this._showContinueHint(false);

        // 显示问题旁白
        this.narrationText.setVisible(true);
        this.narrationText.setColor('#e8d8b8');
        this.narrationText.setStroke('#000000', 0);

        const questionText = `${step.question}\n\n${step.options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')}\n\n（输入数字键 1-${step.options.length} 选择，或点击选择）`;

        this.typewriter.start(questionText, {
            targetField: this.narrationText,
            speed: 40,
            onComplete: () => {
                this.waitingForInput = true;
                this._showContinueHint(true);
                this._setupMinigameInput(step, step.options);
            }
        });
    }

    /**
     * 显示炮制小游戏（模拟：dialogue + reward）
     * @param {Object} step - 步骤数据
     */
    _showProcessMinigame(step) {
        console.log('IntroScene: 炮制小游戏（模拟）', step.processType);

        this.dialogBox.setVisible(true);
        this._hideOverlayImage();

        const processTexts = {
            'dry': '（把菊花轻轻铺在竹匾上，摊开，让每朵花都能接触到空气……）\n\n（等待晾晒……三日后的清晨，菊花已完全干燥，轻轻一捏便碎）\n\n获得：【晒菊花 ×1】',
            'honey': '（将蜂蜜倒入锅中，小火加热至微沸，放入甘草翻炒……）\n\n（蜜炙完成！甘草表面金黄油润，药香四溢）\n\n获得：【蜜炙甘草 ×1】',
            'vinegar': '（将醋喷入药锅，与药材一同翻炒，醋香与药香交织……）\n\n（醋制完成！药性更趋收敛，增强止痛效果）\n\n获得：【醋制药材 ×1】'
        };

        const processText = processTexts[step.processType] || '（按照炮制规范操作……）\n\n（炮制完成！）';

        this._updateAvatar(step.character || 'laoli', step.avatar || 'laoli.png');
        this._updateName(step.name || '药农 老李');

        this.typewriter.start(processText, {
            targetField: this.contentText,
            speed: 45
        });

        this.waitingForInput = false;
        this._showContinueHint(false);

        // 保存step引用用于完成回调
        this._currentMinigameStep = step;
        this.time.delayedCall(500, () => {
            this.waitingForInput = true;
            this._showContinueHint(true);
        });
    }

    /**
     * 显示四诊小游戏 —— 启动 DiagnosisMinigame 覆盖层场景
     * 场景内部完成「望→闻→问→切→开药」全流程
     * @param {Object} step - 步骤数据（包含 phases、syndrome、scoringRules 等）
     */
    _showDiagnosisMinigame(step) {
        console.log('IntroScene: 启动四诊小游戏 DiagnosisMinigame', step.patientName);

        // ★ 合并后续开方步骤的数据（minigame_prescription）
        const mergedStep = Object.assign({}, step);
        const nextStep = this.currentSteps[this.currentStepIndex + 1];
        if (nextStep && nextStep.type === 'minigame_prescription') {
            if (nextStep.minCount !== undefined)    mergedStep.minCount = nextStep.minCount;
            if (nextStep.maxCount !== undefined)    mergedStep.maxCount = nextStep.maxCount;
            if (nextStep.scoringRules)              mergedStep.scoringRules = nextStep.scoringRules;
            if (nextStep.forbiddenHerbs)            mergedStep.forbiddenHerbs = nextStep.forbiddenHerbs;
            if (nextStep.perfectScore !== undefined) mergedStep.perfectScore = nextStep.perfectScore;
            if (nextStep.passScore !== undefined)   mergedStep.passScore = nextStep.passScore;
            if (nextStep.feedbackPerfect)           mergedStep.feedbackPerfect = nextStep.feedbackPerfect;
            if (nextStep.feedbackPass)              mergedStep.feedbackPass = nextStep.feedbackPass;
            if (nextStep.feedbackFail)              mergedStep.feedbackFail = nextStep.feedbackFail;
            console.log('IntroScene: 已合并开方步骤数据到诊断场景');
        }

        // 标记小游戏激活，阻止所有输入
        this._diagnosisGameActive = true;
        this.waitingForInput = false;
        this._showContinueHint(false);
        this.dialogBox.setVisible(false);
        this.narrationText.setVisible(false);
        if (this.skipButton) this.skipButton.setVisible(false);
        if (this.bgImage) this.bgImage.setVisible(false);
        if (this.overlayImage) { this.overlayImage.destroy(); this.overlayImage = null; }
        if (this.overlayBorder) { this.overlayBorder.destroy(); this.overlayBorder = null; }
        if (this.choiceSystem) this.choiceSystem.hide();
        if (this.typewriter && this.typewriter.isTyping) this.typewriter.complete();

        // 保存步骤引用，用于 shutdown 回调读取结果
        this._diagnosisMinigameStep = mergedStep;

        // 启动 DiagnosisMinigame 场景作为覆盖层
        this.scene.launch('DiagnosisMinigame', mergedStep);
        console.log('IntroScene: DiagnosisMinigame scene.launch 已调用');

        // 绑定 shutdown 监听，读取结果并推进剧情
        const diagnosisScene = this.scene.get('DiagnosisMinigame');
        if (!diagnosisScene) {
            console.error('IntroScene: DiagnosisMinigame 场景未注册！');
            this._diagnosisGameActive = false;
            this._nextStep();
            return;
        }

        diagnosisScene.events.once('shutdown', () => {
            console.log('IntroScene: DiagnosisMinigame shutdown，读取结果...');
            this._diagnosisGameActive = false;

            let result = null;
            try {
                if (window.gameStateManager && window.gameStateManager.state) {
                    result = window.gameStateManager.state.__diagnosisResult;
                    window.gameStateManager.state.__diagnosisResult = null;
                }
            } catch (e) {
                console.warn('IntroScene: 读取诊断结果失败', e.message);
            }

            // 恢复UI
            if (this.bgImage) this.bgImage.setVisible(true);
            this.dialogBox.setVisible(true);
            if (this.skipButton) this.skipButton.setVisible(true);

            // 应用奖励
            if (result && step) {
                this._applyDiagnosisReward(result, step);
            }

            // 推进到下一步
            this.time.delayedCall(200, () => this._nextStep());
        });
    }

    /**
     * 根据诊断结果应用对应奖励
     */
    _applyDiagnosisReward(result, step) {
        const score = result.score || 0;
        const threshold = step.scoreThreshold || 3;
        const perfectScore = step.perfectScore || 8;  // for phases, 4 phases × 2 = 8 max
        let reward = null;

        if (score >= perfectScore) {
            reward = step.rewardOnPerfect;
        } else if (score >= threshold) {
            reward = step.rewardOnPass;
        } else {
            reward = step.rewardOnFail;
        }

        if (reward) {
            if (reward.diagnosis) this._applyAttributeDelta('diagnosis', reward.diagnosis);
            if (reward.reputation) this._applyAttributeDelta('reputation', reward.reputation);
            console.log(`IntroScene: 诊断奖励 applied, score=${score}`, reward);
        }
    }

    /**
     * 开方小游戏 —— 已由 DiagnosisMinigame 场景一并处理
     * 这里直接跳过，推进到下一步骤
     * @param {Object} step - 步骤数据
     */
    _showPrescriptionMinigame(step) {
        console.log('IntroScene: 开方小游戏（已在四诊场景中完成），跳过');
        this._nextStep();
    }

    /**
     * ★ 药圃辨花小游戏（真实卡片交互）
     * 启动 FlowerIdGame 场景作为覆盖层，玩家点击卡片判定对错
     * - 答对（金银花）→ 场景自动关闭，继续剧情
     * - 答错（菊花/绣球花）→ 场景内弹出药宠科普，可重试
     * @param {Object} step - 剧情步骤数据
     */
    _showFlowerIdMinigame(step) {
        console.log('IntroScene: 启动药圃辨花小游戏（FlowerIdGame）, step:', step);
        console.log('IntroScene: 当前活跃场景:', this.scene.manager.getScenes(true).map(s => s.sceneKey));

        // ★ 标记小游戏激活，阻止 IntroScene 的所有输入处理
        this._flowerGameActive = true;

        // 暂停等待输入，隐藏所有剧情UI元素
        this.waitingForInput = false;
        this._showContinueHint(false);
        this.dialogBox.setVisible(false);
        this.narrationText.setVisible(false);

        // 隐藏跳过按钮
        if (this.skipButton) this.skipButton.setVisible(false);

        // 隐藏背景CG图层（如果有）
        if (this.bgImage) this.bgImage.setVisible(false);
        if (this.overlayImage) { this.overlayImage.destroy(); this.overlayImage = null; }
        if (this.overlayBorder) { this.overlayBorder.destroy(); this.overlayBorder = null; }

        // 停用选择系统
        if (this.choiceSystem) this.choiceSystem.hide();

        // 停用打字机
        if (this.typewriter && this.typewriter.isTyping) {
            this.typewriter.complete();
        }

        // 启动 FlowerIdGame 覆盖层
        this.scene.launch('FlowerIdGame', step.flowerData || {});
        console.log('IntroScene: FlowerIdGame scene.launch 已调用');

        // ★ 获取场景引用并安全绑定 shutdown 监听
        // 处理竞态条件：如果图片已缓存，ready 可能在 launch 内就触发了
        const flowerScene = this.scene.get('FlowerIdGame');
        if (!flowerScene) {
            console.error('IntroScene: FlowerIdGame 场景未注册！');
            this._flowerGameActive = false;
            if (this.skipButton) this.skipButton.setVisible(true);
            if (this.bgImage) this.bgImage.setVisible(true);
            this.dialogBox.setVisible(true);
            this._nextStep();
            return;
        }

        const bindShutdown = () => {
            console.log('IntroScene: 绑定 FlowerIdGame shutdown 监听');
            flowerScene.events.once('shutdown', () => {
                console.log('IntroScene: FlowerIdGame shutdown，检查结果...');
                this._flowerGameActive = false;

                this.time.delayedCall(50, () => {
                    if (window.gameStateManager && window.gameStateManager.state) {
                        const result = window.gameStateManager.state.__flowerIdResult;
                        if (result) {
                            console.log('IntroScene: 收到辨花小游戏结果', result);
                            window.gameStateManager.state.__flowerIdResult = null;
                            if (step.rewardOnCorrect) {
                                this._applyReward(step.rewardOnCorrect);
                            }
                        }
                    }
                    // 恢复剧情对话UI
                    if (this.skipButton) this.skipButton.setVisible(true);
                    if (this.bgImage) this.bgImage.setVisible(true);
                    this.dialogBox.setVisible(true);
                    this.narrationText.setVisible(false);
                    this.waitingForInput = false;
                    this._nextStep();
                });
            });
        };

        // 检查场景是否已 ready（图片缓存时 create 在 launch 内部同步完成）
        if (flowerScene.sys && flowerScene.sys.isActive && flowerScene.sys.isActive()) {
            console.log('IntroScene: FlowerIdGame 已就绪（同步完成），直接绑定');
            bindShutdown();
        } else {
            console.log('IntroScene: FlowerIdGame 还在加载，等待 ready 事件...');
            flowerScene.events.once('ready', bindShutdown);
        }
    }

    /**
     * 山野晒菊小游戏 — 启动 DryFlowerGame 场景
     */
    _showDryFlowerMinigame(step) {
        console.log('IntroScene: 启动山野晒菊小游戏（DryFlowerGame）, step:', step);

        this._flowerGameActive = true;

        // 暂停所有 IntroScene UI
        this.waitingForInput = false;
        this._showContinueHint(false);
        this.dialogBox.setVisible(false);
        this.narrationText.setVisible(false);
        if (this.skipButton) this.skipButton.setVisible(false);
        if (this.bgImage) this.bgImage.setVisible(false);
        if (this.overlayImage) { this.overlayImage.destroy(); this.overlayImage = null; }
        if (this.overlayBorder) { this.overlayBorder.destroy(); this.overlayBorder = null; }
        if (this.choiceSystem) this.choiceSystem.hide();
        if (this.typewriter && this.typewriter.isTyping) this.typewriter.complete();

        // 启动晒菊小游戏
        this.scene.launch('DryFlowerGame', step.dryData || {});
        console.log('IntroScene: DryFlowerGame scene.launch 已调用');

        const dryScene = this.scene.get('DryFlowerGame');
        if (!dryScene) {
            console.error('IntroScene: DryFlowerGame 场景未注册！');
            this._flowerGameActive = false;
            if (this.skipButton) this.skipButton.setVisible(true);
            if (this.bgImage) this.bgImage.setVisible(true);
            this.dialogBox.setVisible(true);
            this._nextStep();
            return;
        }

        const bindShutdown = () => {
            console.log('IntroScene: 绑定 DryFlowerGame shutdown 监听');
            dryScene.events.once('shutdown', () => {
                console.log('IntroScene: DryFlowerGame shutdown，检查结果...');
                this._flowerGameActive = false;

                this.time.delayedCall(50, () => {
                    if (window.gameStateManager && window.gameStateManager.state) {
                        const result = window.gameStateManager.state.__dryFlowerResult;
                        if (result) {
                            console.log('IntroScene: 收到晒菊小游戏结果', result);
                            window.gameStateManager.state.__dryFlowerResult = null;
                            if (step.rewardOnCorrect) {
                                this._applyReward(step.rewardOnCorrect);
                            }
                        }
                    }
                    if (this.skipButton) this.skipButton.setVisible(true);
                    if (this.bgImage) this.bgImage.setVisible(true);
                    this.dialogBox.setVisible(true);
                    this.narrationText.setVisible(false);
                    this.waitingForInput = false;
                    this._nextStep();
                });
            });
        };

        if (dryScene.sys && dryScene.sys.isActive && dryScene.sys.isActive()) {
            console.log('IntroScene: DryFlowerGame 已就绪，直接绑定');
            bindShutdown();
        } else {
            console.log('IntroScene: DryFlowerGame 还在加载，等待 ready 事件...');
            dryScene.events.once('ready', bindShutdown);
        }
    }

    /**
     * 应用属性奖励
     * @param {Object} reward - { attr: string, delta: number }
     */
    _applyReward(reward) {
        if (!reward) return;
        // 使用 batchAddAttributes 统一接口（{ id, delta } 格式）
        if (window.gameStateManager && typeof window.gameStateManager.batchAddAttributes === 'function') {
            const change = { id: reward.attr || reward.id, delta: reward.delta || 0 };
            window.gameStateManager.batchAddAttributes([change]);
            console.log(`IntroScene: 属性 ${change.id} ${change.delta >= 0 ? '+' : ''}${change.delta}`);
        } else {
            console.log(`IntroScene: [奖励记录] ${reward.attr || reward.id} ${reward.delta >= 0 ? '+' : ''}${reward.delta}`);
        }
    }

    /**
     * 设置小游戏数字键输入
     */
    _setupMinigameInput(step, options) {
        // 清理旧监听
        if (this._minigameKeyHandler) {
            this.input.keyboard.off('keydown', this._minigameKeyHandler);
        }

        this._minigameKeyHandler = (event) => {
            const num = parseInt(event.key);
            if (isNaN(num) || num < 1 || num > options.length) return;

            const selected = options[num - 1];
            console.log('IntroScene: 小游戏选择', num, selected.label, selected.correct ? '✓' : '✗');

            // 显示反馈
            this.narrationText.setVisible(false);
            this.dialogBox.setVisible(true);

            const feedback = selected.correct ? (step.correctFeedback || '回答正确！') : (step.wrongFeedback || '回答错误。');
            this._updateAvatar(step.character || 'laoli', step.avatar || 'laoli.png');
            this._updateName(step.name || '药农 老李');

            this.typewriter.start(feedback, {
                targetField: this.contentText,
                speed: 45,
                onComplete: () => {
                    // 属性奖励/惩罚
                    if (selected.correct && step.rewardOnCorrect) {
                        this._applyAttributeDelta(step.rewardOnCorrect.attr, step.rewardOnCorrect.delta);
                    } else if (!selected.correct && step.penaltyOnWrong) {
                        this._applyAttributeDelta(step.penaltyOnWrong.attr, step.penaltyOnWrong.delta);
                    }

                    this.waitingForInput = true;
                    this._showContinueHint(true);

                    // 清理按键监听
                    if (this._minigameKeyHandler) {
                        this.input.keyboard.off('keydown', this._minigameKeyHandler);
                        this._minigameKeyHandler = null;
                    }

                    this.time.delayedCall(500, () => {
                        this._nextStep();
                    });
                }
            });
        };

        this.input.keyboard.on('keydown', this._minigameKeyHandler);
    }

    /**
     * 设置开方小游戏输入
     */
    _setupPrescriptionInput(step) {
        if (this._minigameKeyHandler) {
            this.input.keyboard.off('keydown', this._minigameKeyHandler);
        }

        this._minigameKeyHandler = (event) => {
            const num = parseInt(event.key);
            if (isNaN(num) || num < 1 || num > 4) return;

            console.log('IntroScene: 开方选择', num);

            const feedbackMap = {
                1: step.feedbackPerfect || '处方精当！',
                2: step.feedbackPass || '处方可行，经验积累后会更精准。',
                3: step.feedbackPass || '处方可行。',
                4: step.feedbackFail || '（青苗托起叶子，上面印着正确用药……）'
            };

            const scoreMap = { 1: step.perfectScore || 8, 2: step.passScore || 5, 3: step.passScore || 5, 4: 1 };
            const rewardMap = { 1: step.rewardOnPerfect, 2: step.rewardOnPass, 3: step.rewardOnPass, 4: step.rewardOnFail };

            this.dialogBox.setVisible(true);
            this._updateAvatar('laoli', 'laoli.png');
            this._updateName('药农 老李');

            this.typewriter.start(feedbackMap[num], {
                targetField: this.contentText,
                speed: 45,
                onComplete: () => {
                    // 应用奖励
                    const reward = rewardMap[num];
                    if (reward) {
                        if (reward.diagnosis) this._applyAttributeDelta('diagnosis', reward.diagnosis);
                        if (reward.reputation) this._applyAttributeDelta('reputation', reward.reputation);
                    }

                    this.waitingForInput = true;
                    this._showContinueHint(true);

                    if (this._minigameKeyHandler) {
                        this.input.keyboard.off('keydown', this._minigameKeyHandler);
                        this._minigameKeyHandler = null;
                    }

                    this.time.delayedCall(500, () => {
                        this._nextStep();
                    });
                }
            });
        };

        this.input.keyboard.on('keydown', this._minigameKeyHandler);
    }

    /**
     * 应用属性变化
     */
    _applyAttributeDelta(attrId, delta) {
        const gsmState = window.gameStateManager ? window.gameStateManager.state : this.gameState;
        if (!gsmState.attributes) gsmState.attributes = {};
        if (typeof gsmState.attributes[attrId] !== 'number') gsmState.attributes[attrId] = 0;
        gsmState.attributes[attrId] += delta;
        console.log(`IntroScene: 属性变化 ${attrId} ${delta > 0 ? '+' : ''}${delta} →`, gsmState.attributes[attrId]);
    }

    /**
     * 显示翠竹村地图全景（C08 结束后展示村庄总览）
     * @param {Object} step - 步骤数据
     */
    _showVillageMap(step) {
        console.log('IntroScene: 显示翠竹村地图全景', step);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // === 清理所有现有UI ===
        if (this.dialogBox) this.dialogBox.setVisible(false);
        if (this.narrationText) this.narrationText.setVisible(false);
        if (this.avatarImage) this.avatarImage.setVisible(false);
        if (this.avatarSprite) this.avatarSprite.setVisible(false);
        if (this.nameText) this.nameText.setVisible(false);
        if (this.contentText) this.contentText.setVisible(false);
        if (this.continueHint) this.continueHint.setVisible(false);
        if (this.skipButton) this.skipButton.setVisible(false);
        this._hideOverlayImage();
        this._hideCharacterPortrait();
        if (this.cgDisplay) this.cgDisplay.hide();

        // 隐藏当前背景图
        if (this.bgImage) {
            this.bgImage.setVisible(false);
            this.bgImage.setAlpha(0);
        }

        const mapKey = step.mapImage || 'village_map_full';
        if (!this.textures.exists(mapKey)) {
            console.error('IntroScene: 地图图片纹理不存在', mapKey);
            this._nextStep();
            return;
        }

        // === 显示地图图片（适配屏幕） ===
        const mapImg = this.add.image(width / 2, height / 2, mapKey)
            .setOrigin(0.5, 0.5)
            .setDepth(5);

        // 按比例缩放以适应屏幕（保持宽高比，不留白边）
        const tex = this.textures.get(mapKey);
        const imgRatio = tex.source[0] / tex.source[1]; // 图片宽高比
        const screenRatio = width / height;
        let displayWidth, displayHeight;
        if (imgRatio > screenRatio) {
            displayWidth = width;
            displayHeight = width / imgRatio;
        } else {
            displayHeight = height;
            displayWidth = height * imgRatio;
        }
        mapImg.setDisplaySize(displayWidth, displayHeight);
        this._villageMapImg = mapImg;

        // === 顶部标题栏 ===
        const titleBar = this.add.rectangle(width / 2, 28, width, 56, 0x1a1a2e, 0.85)
            .setOrigin(0.5, 0.5)
            .setDepth(10);
        const titleText = this.add.text(width / 2, 28, '翠竹村', {
            fontSize: '24px',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", serif',
            color: '#d4af37',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5).setDepth(11);

        // === 提示文字 ===
        const hintText = step.hint || '点击地图上的地点进行探索';
        const hintLabel = this.add.text(width / 2, height - 30, hintText, {
            fontSize: '16px',
            fontFamily: '"FangSong", serif',
            color: '#cccccc',
            backgroundColor: '#00000088',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5, 0.5).setDepth(11).setScrollFactor(0);

        // === 定义可点击的地点（坐标基于图片比例 0~1，会自动映射到实际显示尺寸）===
        // 这些坐标是相对于地图图片中心的偏移比例
        const locations = [
            { id: 'plains_exit',   name: '城郊平原',   x: 0.08,  y: 0.35, label: '城郊平原' },
            { id: 'village_gate',  name: '翠竹村牌坊', x: 0.22,  y: 0.48, label: '牌坊' },
            { id: 'cunzhang_home', name: '村长家',     x: 0.50,  y: 0.12, label: '村长家' },
            { id: 'herb_garden',   name: '药圃',       x: 0.36,  y: 0.38, label: '药圃' },
            { id: 'well',          name: '水井',       x: 0.54,  y: 0.48, label: '水井' },
            { id: 'residence',     name: '民居',       x: 0.32,  y: 0.72, label: '民居' },
            { id: 'workshop',      name: '作坊',       x: 0.70,  y: 0.72, label: '作坊' },
            { id: 'ancient_tree',  name: '古树',       x: 0.76,  y: 0.30, label: '古树' },
            { id: 'valley_entrance',name: '溪流山谷',   x: 0.94,  y: 0.45, label: '溪谷' },
        ];

        // 保存引用以便清理
        this._villageMapHotspots = [];

        // 为每个地点创建可点击区域
        locations.forEach(loc => {
            // 将比例坐标转换为屏幕绝对坐标（基于地图显示位置）
            const spotX = width / 2 + (loc.x - 0.5) * displayWidth;
            const spotY = height / 2 + (loc.y - 0.5) * displayHeight;

            // 创建点击区域（透明圆形）
            const hitArea = this.add.circle(spotX, spotY, 28, 0xffffff, 0)
                .setInteractive({ useHandCursor: true })
                .setDepth(8);

            // 地点标记图标（小圆点+脉冲动画）
            const dot = this.add.circle(spotX, spotY, 6, 0xd4af37, 0.9)
                .setStrokeStyle(2, 0xffffff, 0.8)
                .setDepth(9);

            // 脉冲扩散动画（吸引注意力）
            const pulseRing = this.add.circle(spotX, spotY, 6, 0xd4af37, 0)
                .setStrokeStyle(1.5, 0xd4af37, 0.5)
                .setDepth(8);

            this.tweens.add({
                targets: pulseRing,
                radius: 20,
                alpha: 0,
                duration: 1500,
                repeat: -1,
                ease: 'Sine.easeOut'
            });

            // 地名标签
            const label = this.add.text(spotX, spotY - 22, loc.label, {
                fontSize: '13px',
                fontFamily: '"FangSong", "STFangsong", serif',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2,
                backgroundColor: '#00000066',
                padding: { x: 4, y: 1 }
            }).setOrigin(0.5, 0.5).setDepth(10);

            // 点击事件
            hitArea.on('pointerdown', () => {
                console.log(`[村庄地图] 点击了地点: ${loc.name} (${loc.id})`);

                // ★ 点击反馈：浮动提示（后续可扩展为跳转到对应剧情/场景）
                this._showFloatingText(`${loc.name}`, 0xd4af37);

                // TODO: 后续扩展 — 根据地点ID触发对应剧情或切换场景
                // 例如：loc.id === 'cunzhang_home' → 触发C09等
            });

            // 悬停高亮
            hitArea.on('pointerover', () => {
                dot.setFillStyle(0xffd700, 1);
                dot.setScale(1.3);
                label.setColor('#ffd700');
                this.tweens.killTweensOf(pulseRing);
                pulseRing.setStrokeStyle(2, 0xffd700, 0.7);
            });
            hitArea.on('pointerout', () => {
                dot.setFillStyle(0xd4af37, 0.9);
                dot.setScale(1);
                label.setColor('#ffffff');
                pulseRing.setStrokeStyle(1.5, 0xd4af37, 0.5);
                this.tweens.add({
                    targets: pulseRing,
                    radius: 20,
                    alpha: 0,
                    duration: 1500,
                    repeat: -1,
                    ease: 'Sine.easeOut'
                });
            });

            // 保存所有创建的对象以便清理
            this._villageMapHotspots.push({ hitArea, dot, pulseRing, label });
        });

        // === 底部"继续"按钮（点击后推进剧情/返回游戏）===
        const continueBtn = this.add.text(width - 80, height - 30, '进入村子 ▸', {
            fontSize: '16px',
            fontFamily: '"FangSong", serif',
            color: '#d4af37',
            backgroundColor: '#000000aa',
            padding: { x: 14, y: 8 },
            borderRadius: 6
        }).setOrigin(0.5, 0.5).setDepth(12).setInteractive({ useHandCursor: true });

        continueBtn.on('pointerover', () => continueBtn.setColor('#ffdd44'));
        continueBtn.on('pointerout', () => continueBtn.setColor('#d4af37'));
        continueBtn.on('pointerdown', () => {
            console.log('[村庄地图] 点击继续 → 进入翠竹村地图');
            this._cleanupVillageMap();
            // ★ 切换到翠竹村图片地图后返回游戏
            if (window.GameConfig) {
                window.GameConfig.currentMapId = 'village';
            }
            this._nextStep();
        });

        this._villageMapContinueBtn = continueBtn;

        // 淡入效果
        mapImg.setAlpha(0);
        titleBar.setAlpha(0);
        titleText.setAlpha(0);
        this.tweens.add({
            targets: [mapImg, titleBar, titleText],
            alpha: 1,
            duration: 600,
            ease: 'Power2Out'
        });
    }

    /**
     * 清理村庄地图UI元素
     */
    _cleanupVillageMap() {
        if (this._villageMapImg) { this._villageMapImg.destroy(); this._villageMapImg = null; }
        if (this._villageMapContinueBtn) { this._villageMapContinueBtn.destroy(); this._villageMapContinueBtn = null; }

        if (this._villageMapHotspots) {
            this._villageMapHotspots.forEach(h => {
                if (h.hitArea) h.hitArea.destroy();
                if (h.dot) h.dot.destroy();
                if (h.pulseRing) h.pulseRing.destroy();
                if (h.label) h.label.destroy();
            });
            this._villageMapHotspots = [];
        }

        // 恢复背景图
        if (this.bgImage) {
            this.bgImage.setVisible(true);
            this.bgImage.setAlpha(1);
        }
    }

    /**
     * 结束序章/第一章
     * @param {Object} step - 步骤数据
     */
    _endPrologue(step) {
        const isChapter1 = this._isChapter1 === true;
        console.log(`IntroScene: ${isChapter1 ? '第一章结束' : '序章结束'}`);

        // 立即隐藏所有文字和UI（防止与淡出效果重叠）
        if (this.dialogBox) this.dialogBox.setVisible(false);
        if (this.narrationText) this.narrationText.setVisible(false);
        if (this._cgNarrationBox) { this._cgNarrationBox.destroy(); this._cgNarrationBox = null; }
        if (this.characterPortrait) this.characterPortrait.setVisible(false);
        // 隐藏CG容器（含标题卡文字、CG图片等）
        if (this.cgDisplay) this.cgDisplay.hide();

        // 清理特写图片
        this._hideOverlayImage();

        if (isChapter1) {
            // === 第一章结束：设置章节状态，保存，进入GameScene ===
            console.log('IntroScene: 第一章「翠竹村的春天」完成！');

            // 设置章节进度
            if (window.gameStateManager) {
                window.gameStateManager.state.currentChapter = 1;
                window.gameStateManager.save();
            }

            // 恢复HTML UI元素
            this._showHTMLUI();

            // 直接跳转GameScene
            this.time.delayedCall(1500, () => {
                this.scene.start('GameScene');
            });
            return;
        }

        // === 序章结束逻辑 ===
        // ★ 只在序章本体结束时初始化属性；C01等跨JSON衔接场景不重复初始化
        if (!this._attributesInitialized) {
            this._initPrologueAttributes();
            this._attributesInitialized = true;
        }

        // 保存游戏状态
        this._saveGameState();

        // 解锁系统
        if (step && step.unlockSystems) {
            step.unlockSystems.forEach(system => {
                console.log('IntroScene: 解锁系统', system);
            });
        }

        // 恢复HTML UI元素
        this._showHTMLUI();

        // ★ S10/C01 完成后跳转平原地图
        // 显式设置地图为平原，确保 GameScene 加载正确地图
        if (window.GameConfig) {
            window.GameConfig.currentMapId = 'plain';
            console.log('[剧情] currentMapId 已设为: plain（平原地图）');
        }
        // 清除可能残留的村庄/溪流强制标志
        window._forceVillageMap = false;
        window._returnToVillageMap = false;
        window._returnToStreamMap = false;

        const fadeMs = (step && step.fadeOutDuration) || 1500;
        requestAnimationFrame(() => {
            setTimeout(() => {
                console.log('[剧情] ★ C01完成，执行 this.scene.start(GameScene)...');
                try {
                    this.scene.start('GameScene');
                    console.log('[剧情] ✅ scene.start(GameScene) 已调用');
                } catch (e) {
                    console.error('[剧情] ❌ scene.start 失败:', e);
                    this.game.scene.stop('IntroScene');
                    this.game.scene.start('GameScene');
                }
            }, fadeMs);
        });
    }

    /**
     * 保存游戏状态
     */
    _saveGameState() {
        // 保存到 localStorage
        try {
            localStorage.setItem('baicao_game_state', JSON.stringify(this.gameState));
            console.log('IntroScene: 游戏状态已保存', this.gameState);
        } catch (e) {
            console.warn('IntroScene: 保存游戏状态失败', e);
        }
        
        // 注意：window.gameState 已在 constructor 中绑定（第74行），
        // 同一引用无需重复赋值，避免误导
    }

    /**
     * 调试模式结束提示（停在当前画面，不跳转 GameScene）
     */
    _showDebugEndHint() {
        console.log('[调试] ========== 场景播放完毕（调试停止）=========');
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 显示"调试结束"提示
        const hint = this.add.text(width / 2, height - 60, '✓ [调试] 场景播完 — 按 F3 继续测试其他场景', {
            fontSize: '18px',
            color: '#ffcc00',
            fontFamily: '"FangSong", "KaiTi", serif',
            backgroundColor: '#000000cc',
            padding: { x: 16, y: 8 },
            borderRadius: 8
        }).setOrigin(0.5).setDepth(100);
        
        // 5秒后淡出
        this.tweens.add({
            targets: hint,
            alpha: 0,
            delay: 5000,
            duration: 1500,
            onComplete: () => hint.destroy()
        });
    }

    /**
     * 跳过序章
     */
    _skipPrologue() {
        console.log('IntroScene: 跳过序章，准备返回游戏');

        // 确保键盘输入在返回前恢复
        if (this.input && this.input.keyboard) {
            this.input.keyboard.enabled = true;
            this.input.keyboard.removeAllListeners();
        }

        // 恢复HTML UI元素
        this._showHTMLUI();

        // 清理所有子系统
        this._cleanupSubsystems();

        // 直接跳转到游戏场景
        this.scene.start('GameScene');
    }

    /**
     * 清理子系统
     */
    _cleanupSubsystems() {
        if (this.typewriter) {
            this.typewriter.destroy();
            this.typewriter = null;
        }
        if (this.choiceSystem) {
            this.choiceSystem.destroy();
            this.choiceSystem = null;
        }
        if (this.tutorialOverlay) {
            this.tutorialOverlay.destroy();
            this.tutorialOverlay = null;
        }
        if (this.cgDisplay) {
            this.cgDisplay.destroy();
            this.cgDisplay = null;
        }

        // 清理CG旁白文字
        if (this._cgNarrationBox) {
            this._cgNarrationBox.destroy();
            this._cgNarrationBox = null;
        }

        // 清理弹窗监听器
        if (this._modalObserver) {
            this._modalObserver.disconnect();
            this._modalObserver = null;
        }

        // 清理特写图片
        if (this.overlayImage) {
            this.overlayImage.destroy();
            this.overlayImage = null;
        }
        if (this.overlayBorder) {
            this.overlayBorder.destroy();
            this.overlayBorder = null;
        }
    }

    /**
     * 获取备用数据（如果JSON加载失败）
     * @returns {Object}
     */
    _getFallbackData() {
        // 返回一个最小化的序章数据
        return {
            version: '1.0',
            title: '序章·结业·灵宠·启程',
            scenes: [
                {
                    id: 'S01',
                    name: '开场',
                    type: 'monologue',
                    steps: [
                        {
                            id: 'fallback_001',
                            type: 'narration',
                            text: '（剧情数据加载失败，使用备用剧情）',
                            nextDelay: 2000
                        },
                        {
                            id: 'fallback_end',
                            type: 'end',
                            nextScene: 'GameScene'
                        }
                    ]
                }
            ]
        };
    }

    /**
     * 场景关闭时的生命周期回调（由 Phaser shutdown 事件自动触发）
     * 负责：恢复主页面UI + 清理所有子系统（不销毁 DebugManager，F3 需全局可用）
     */
    _onSceneShutdown() {
        console.log('IntroScene: shutdown 事件触发，正在清理...');

        try {
            // ★ 安全恢复所有主页面UI（即使 _endPrologue 已调用，重复调用也无害）
            this._showHTMLUI();
        } catch (e) {
            console.warn('IntroScene: _showHTMLUI 在 shutdown 中失败:', e.message);
        }

        // ★ DebugManager 保留不销毁 — 其 F3 全局监听需要在 GameScene 中也可用
        // scene 引用保留（即使已销毁，scene.game 仍然是有效的 Phaser.Game 实例）
        // 下一次 IntroScene.create() 会清理旧 DOM 并创建新 DebugManager
        this.debugManager = null;

        // 清理子系统（打字机、选择系统、CG、overlay 等 Phaser 对象）
        try {
            this._cleanupSubsystems();
        } catch (e) {
            console.warn('IntroScene: _cleanupSubsystems 在 shutdown 中失败:', e.message);
        }

        // 移除事件监听，防止重复注册
        this.events.off('shutdown', this._onSceneShutdown, this);
        this.events.off('destroy', this._onSceneShutdown, this);

        console.log('IntroScene: 清理完成（DebugManager 已保留）');
    }

    /**
     * 场景销毁时清理（保留显式调用的入口，内部委托给 _onSceneShutdown）
     */
    shutdown() {
        this._onSceneShutdown();
    }
}

// 导出
window.IntroScene = IntroScene;
