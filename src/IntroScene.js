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

        // 子系统实例
        this.typewriter = null;
        this.choiceSystem = null;
        this.tutorialOverlay = null;
        this.cgDisplay = null;

        // UI 元素
        this.dialogBox = null;
        this.avatarSprite = null;
        this.nameText = null;
        this.contentText = null;
        this.continueHint = null;
        this.skipButton = null;

        // 旁白文本（居中显示，用于S01等独白场景）
        this.narrationText = null;

        // 角色立绘（全身体像）
        this.characterPortrait = null;

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

        // 加载序章剧情数据
        this.load.json('prologue_data', 'src/data/story_prologue.json');

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
        const characters = [
            'bai_smile.png',
            'bai_thoughtful.png',
            'bai_serious.png',
            'xiaolan_anxious.png',
            'xiaolan_grateful.png',
            'qingmiao_surprised.png',
            'qingmiao_happy.png'
        ];

        characters.forEach(file => {
            const path = `src/assets/pictures/characters/${file}`;
            this.load.image(file.replace('.png', ''), path);
        });

        // 加载师傅立绘（全身体像）- PNG透明背景版本
        this.load.image('bai_standing', 'src/assets/picture/师傅立绘1.png');

        // 加载青苗精灵图（用于粒子效果）
        this.load.image('pet_qingmiao', 'src/assets/pictures/characters/pet_qingmiao.png');
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
            'bg_processing_room.png'
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
    }

    /**
     * 创建场景
     */
    create() {
        console.log('IntroScene: 创建场景');

        // 获取剧情数据
        this.prologueData = this.cache.json.get('prologue_data');

        if (!this.prologueData || !this.prologueData.scenes) {
            console.error('IntroScene: 剧情数据加载失败，使用内嵌数据');
            this.prologueData = this._getFallbackData();
        }

        console.log('IntroScene: 剧情数据加载成功', this.prologueData.title);

        // 初始化子系统
        this._initSubsystems();

        // 创建UI
        this._createUI();

        // 设置输入
        this._setupInput();

        // 开始第一个场景（S01）
        this._startScene(0);

        console.log('IntroScene: 场景创建完成');
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

        // 居中旁白文本（用于S01等独白场景）
        this.narrationText = this.add.text(width / 2, height / 2, '', {
            fontSize: '32px',
            color: '#e8d8b8',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif',
            align: 'center',
            lineSpacing: 12,
            wordWrap: { width: width * 0.8, useAdvancedWrap: true }
        })
            .setOrigin(0.5)
            .setDepth(15)
            .setVisible(false);

        // 角色立绘（全身体像，居中显示）
        // 位置：画面正中央
        this.characterPortrait = this.add.image(width / 2, height * 0.5, null)
            .setDisplaySize(20, 32)     // 缩小到1/4
            .setOrigin(0.5, 0.5)        // 锚点设为正中心
            .setDepth(8)                // 在背景之上，对话框之下
            .setVisible(false);

        // 对话框容器
        this.dialogBox = this.add.container(0, 0).setDepth(10).setVisible(false);

        // 对话框背景
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0x000000, 0.85);
        dialogBg.fillRoundedRect(50, height - 250, width - 100, 200, 16);
        dialogBg.lineStyle(3, 0x8b7355, 1);
        dialogBg.strokeRoundedRect(50, height - 250, width - 100, 200, 16);
        this.dialogBox.add(dialogBg);

        // 头像框
        const avatarBg = this.add.graphics();
        avatarBg.fillStyle(0x8b7355, 1);
        avatarBg.fillRoundedRect(70, height - 230, 80, 80, 8);
        avatarBg.lineStyle(2, 0xffffff, 0.5);
        avatarBg.strokeRoundedRect(70, height - 230, 80, 80, 8);
        this.dialogBox.add(avatarBg);

        // 头像精灵
        this.avatarSprite = this.add.text(110, height - 190, '', {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
        this.dialogBox.add(this.avatarSprite);

        // 名称文本
        this.nameText = this.add.text(170, height - 230, '', {
            fontSize: '26px',
            color: '#ffcc00',
            fontStyle: 'bold',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif'
        }).setDepth(11);
        this.dialogBox.add(this.nameText);

        // 内容文本
        this.contentText = this.add.text(170, height - 200, '', {
            fontSize: '24px',
            color: '#ffffff',
            wordWrap: { width: width - 280, useAdvancedWrap: true },
            lineSpacing: 8,
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif'
        }).setDepth(11);
        this.dialogBox.add(this.contentText);

        // 跳过按钮
        this.skipButton = this.add.text(width - 80, 30, '跳过 ▸', {
            fontSize: '14px',
            color: '#8b7355',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 }
        })
            .setOrigin(0.5)
            .setDepth(20)
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
            .setDepth(15)
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
        if (sceneIndex >= this.prologueData.scenes.length) {
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

        // 如果有背景图片
        if (scene.background && this.textures.exists(scene.background.replace('.png', ''))) {
            this.bgImage.destroy();
            this.bgImage = this.add.image(width / 2, height / 2, scene.background.replace('.png', ''))
                .setDisplaySize(width, height)
                .setDepth(0);
        }
    }

    /**
     * 设置BGM
     * @param {Object} scene - 场景数据
     */
    _setBGM(scene) {
        if (scene.bgm) {
            // TODO: 实现BGM切换
            console.log('IntroScene: 切换BGM', scene.bgm);
        }
    }

    /**
     * 执行当前步骤
     */
    _executeStep() {
        if (this.currentStepIndex >= this.currentSteps.length) {
            // 当前场景结束，进入下一个场景
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
            case 'end':
                this._endPrologue(step);
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
        // 隐藏对话框，显示居中旁白
        this.dialogBox.setVisible(false);
        this.narrationText.setVisible(true);

        this._updateAvatar(null, null);
        this._updateName('');

        // 隐藏特写图片和角色立绘
        this._hideOverlayImage();
        this._hideCharacterPortrait();
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

        // 设置背景色（S01黑屏专用）
        if (step.bgColor) {
            const color = parseInt(step.bgColor.replace('#', '0x'));
            if (this.bgImage) {
                this.bgImage.setFillStyle(color);
            }
        }

        // 打字机效果（输出到居中文本）
        this.typewriter.start(step.text, {
            targetField: this.narrationText,
            colorGradient: colorGradient,
            speed: 60
        });

        // 隐藏角色立绘（旁白时不需要显示）
        this._hideCharacterPortrait();

        this.waitingForInput = false;
        this._showContinueHint(false);
    }

    /**
     * 显示对话
     * @param {Object} step - 步骤数据
     */
    _showDialogue(step) {
        // 隐藏旁白，显示对话框
        this.narrationText.setVisible(false);
        this.dialogBox.setVisible(true);

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

        this.waitingForInput = false;
        this._showContinueHint(false);

        // 解锁图鉴
        if (step.unlockHerb) {
            this._unlockHerb(step.unlockHerb);
        }

        // 设置灵宠
        if (step.setPet) {
            this.gameState.pet = { id: step.setPet, name: '青苗', type: 'plant', level: 1 };
        }

        // 设置标记
        if (step.setFlag) {
            this._setFlag(step.setFlag, true);
        }
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

        const tutorialAction = step.tutorialAction;
        const hint = step.hint || '';

        console.log('IntroScene: 教程步骤', tutorialAction, step.skippable ? '(可跳过)' : '');

        // 显示教程遮罩
        this.tutorialOverlay.show({
            hint: hint,
            hintPosition: step.hintPosition || 'bottom',
            highlightTargets: step.highlightTargets || [],
            clickToContinue: !!step.skippable,  // 如果可跳过则允许点击继续
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
            case 'sun_drying':
            case 'drag_herb_to_tray':
            case 'wait_drying':
            case 'grind_herb':
            case 'complete_grinding':
                this._tutorialPlaceholder(step);
                break;
            default:
                // 没有特殊动作的教程，点击继续
                this.time.delayedCall(step.nextDelay || 2000, () => {
                    this._onTutorialComplete(step);
                });
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

            // 监听关闭事件，关闭后继续剧情
            this._setupModalCloseCallback(() => {
                console.log('IntroScene: 背包已关闭，继续剧情');
                this._onTutorialComplete(step);
            });

            return; // 不自动完成，等待玩家关闭背包
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

            // 监听关闭事件，关闭后继续剧情
            this._setupModalCloseCallback(() => {
                console.log('IntroScene: 图鉴已关闭，继续剧情');
                this._onTutorialComplete(step);
            });

            return; // 不自动完成，等待玩家关闭图鉴
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
        // 检查当前教程是否可跳过
        if (this._currentTutorialStep && this._currentTutorialStep.skippable) {
            console.log('IntroScene: 跳过教程', this._currentTutorialStep.id);
            this._onTutorialComplete(this._currentTutorialStep);
            return;
        }
    }

    /**
     * 教程完成回调
     * @param {Object} step - 完成的步骤
     */
    _onTutorialComplete(step) {
        void step; // 消除未使用参数警告

        // 清理弹窗关闭回调（如果存在）
        this._modalCloseCallback = null;

        this.tutorialActive = false;
        this.tutorialOverlay.hide(() => {
            this._nextStep();
        });
    }

    /**
     * 设置弹窗关闭回调（用于等待玩家关闭背包/图鉴后继续剧情）
     * @param {Function} callback - 关闭后的回调函数
     */
    _setupModalCloseCallback(callback) {
        // 保存回调
        this._modalCloseCallback = callback;

        // 监听ESC键关闭弹窗
        const escHandler = (event) => {
            if (event.key === 'Escape') {
                this._handleModalClosed();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 监听遮罩层点击关闭
        setTimeout(() => {
            const overlay = document.getElementById('modal-overlay');
            if (overlay) {
                const clickHandler = () => {
                    this._handleModalClosed();
                    overlay.removeEventListener('click', clickHandler);
                };
                overlay.addEventListener('click', clickHandler);
            }
        }, 100);
    }

    /**
     * 处理弹窗被关闭的事件
     */
    _handleModalClosed() {
        if (this._modalCloseCallback && !this.tutorialActive) {
            console.log('IntroScene: 弹窗已关闭，执行回调');
            const cb = this._modalCloseCallback;
            this._modalCloseCallback = null;
            cb();
        } else if (this._modalCloseCallback) {
            console.log('IntroScene: 弹窗关闭但教程仍激活，稍后处理');
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
        // 创建CG旁白文本框
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const narrationBox = this.add.text(width / 2, height - 100, '', {
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
            targetField: narrationBox,
            speed: 60,
            onComplete: () => {
                this.time.delayedCall(step.textDelay || 1000, () => {
                    narrationBox.destroy();
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

        items.forEach(item => {
            const count = item.count ? `×${item.count}` : '';
            rewardText += `${item.icon || '📦'} ${item.name}${count}\n`;

            // 真实添加到背包/游戏状态
            if (window.gameStateManager) {
                // 使用 gameStateManager 添加草药（会自动解锁图鉴）
                if (['gancao', 'juhua'].includes(item.id)) {
                    for (let i = 0; i < (item.count || 1); i++) {
                        window.gameStateManager.addHerbToBackpack(item.id);
                    }
                }
            }

            // 其他物品直接操作 gameState
            if (item.id === 'copper') {
                this.gameState.copper = (this.gameState.copper || 0) + item.count;
            } else if (!['gancao', 'juhua'].includes(item.id)) {
                // 非草药、非铜钱物品（背包、推荐信、图谱等）
                this.gameState.inventory[item.id] = (this.gameState.inventory[item.id] || 0) + 1;
            }
        });

        // 刷新UI（如果存在）
        if (window.uiManager) {
            window.uiManager.updateBackpackUI();
            window.uiManager.updateHerbGuideUI();
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
        if (this.choiceSystem && this.choiceSystem.isActive) return;
        if (this.tutorialActive) return;

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
     * 进入下一步
     */
    _nextStep() {
        this.waitingForInput = false;
        this._showContinueHint(false);

        this.currentStepIndex++;

        // 检查是否有 nextScene 跳转
        const currentStep = this.currentSteps[this.currentStepIndex - 1];
        if (currentStep && currentStep.nextScene) {
            // 跳转到指定场景
            const nextSceneIndex = this.prologueData.scenes.findIndex(s => s.id === currentStep.nextScene);
            if (nextSceneIndex >= 0) {
                this._startScene(nextSceneIndex);
                return;
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
        const height = this.cameras.main.height;

        if (!character) {
            this.avatarSprite.setText('📖');
            this.avatarSprite.setPosition(110, height - 190);
            return;
        }

        // 尝试使用图片
        if (avatarKey && this.textures.exists(avatarKey.replace('.png', ''))) {
            // TODO: 使用图片精灵
            this.avatarSprite.setText(this._getCharacterEmoji(character));
        } else {
            // 使用Emoji占位
            this.avatarSprite.setText(this._getCharacterEmoji(character));
        }

        this.avatarSprite.setPosition(110, height - 190);
    }

    /**
     * 获取角色Emoji占位符
     * @param {string} character - 角色ID
     * @returns {string}
     */
    _getCharacterEmoji(character) {
        const emojiMap = {
            'bai': '👴',
            'xiaolan': '👧',
            'qingmiao': '🌱',
            'narrator': '📖',
            'player': '😊'
        };
        return emojiMap[character] || '❓';
    }

    /**
     * 更新名称显示
     * @param {string} name - 名称
     */
    _updateName(name) {
        const height = this.cameras.main.height;
        this.nameText.setText(name);
        this.nameText.setPosition(170, height - 230);
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

        // 角色立绘映射表（角色ID -> {纹理key, 位置}）
        const portraitMap = {
            'bai': { texture: 'bai_standing', position: 'center' }, // 白师傅居中显示
            'xiaolan': { texture: null, position: 'left' },    // 可以后续添加
            'qingmiao': { texture: null, position: 'left' },   // 可以后续添加
            'player': { texture: null, position: 'right' }     // 玩家在右侧
        };

        const config = portraitMap[character];

        if (config && config.texture && this.textures.exists(config.texture)) {
            // 设置立绘纹理并显示
            this.characterPortrait.setTexture(config.texture);

            // 根据位置设置X坐标（右侧、左侧或居中）
            let targetX;
            if (config.position === 'center') {
                targetX = width / 2;       // 居中：画面正中央
            } else if (config.position === 'right') {
                targetX = width - 150;     // 右侧：距离右边缘150px
            } else {
                targetX = 120;             // 左侧：距离左边缘120px
            }

            // 立绘位于画面中央垂直位置
            const targetY = height * 0.6;

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
        } else {
            // 没有立绘资源，隐藏
            this._hideCharacterPortrait();
        }
    }

    /**
     * 隐藏角色立绘
     */
    _hideCharacterPortrait() {
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

        // 如果已有特写图片，先销毁
        if (this.overlayImage) {
            this.overlayImage.destroy();
            this.overlayImage = null;
        }

        // 检查纹理是否存在
        if (!this.textures.exists(imageKey)) {
            console.warn('IntroScene: 特写图片不存在', imageKey);
            return;
        }

        // 创建特写图片（右侧显示，半透明背景）
        this.overlayImage = this.add.image(width * 0.75, height * 0.4, imageKey)
            .setDisplaySize(400, 300)
            .setOrigin(0.5, 0.5)
            .setDepth(7)  // 在背景之上，立绘之下
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

        // 保存边框引用，以便后续清理
        this.overlayBorder = overlayBorder;
    }

    /**
     * 隐藏特写图片
     */
    _hideOverlayImage() {
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
        // 恢复主要HUD面板
        const uiElements = [
            'top-left-panel',     // 左上角：小地图 + 时间日期
            'task-panel',         // 任务栏
            'top-right-buttons',  // 顶部右侧功能按钮
            'controls-hint'       // 底部操作提示
        ];

        uiElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = '';
            }
        });

        console.log('IntroScene: 已恢复HTML UI元素');
    }

    /**
     * 结束序章
     * @param {Object} step - 结束步骤数据
     */
    _endPrologue(step) {
        console.log('IntroScene: 序章结束');

        // 清理特写图片
        this._hideOverlayImage();

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

        // 淡出效果
        if (this.cgDisplay) {
            this.cgDisplay.inkFadeOut(() => {
                // 跳转到游戏场景
                this.scene.start('GameScene');
            });
        } else {
            // 直接跳转
            this.time.delayedCall(1500, () => {
                this.scene.start('GameScene');
            });
        }
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

        // 同时保存到全局
        window.gameState = this.gameState;
    }

    /**
     * 跳过序章
     */
    _skipPrologue() {
        console.log('IntroScene: 跳过序章');

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
     * 场景销毁时清理
     */
    shutdown() {
        console.log('IntroScene: 销毁');
        this._cleanupSubsystems();
    }
}

// 导出
window.IntroScene = IntroScene;
