/**
 * 识花辨影 — 药圃辨花小游戏
 * 三选一卡片点击判定：找出金银花
 * 正确 → 继续剧情；错误 → 药宠立绘 + 科普教学
 *
 * 适配：1280×720，古风水墨雅致画风
 */
class FlowerIdGame extends Phaser.Scene {

    constructor() {
        super({ key: 'FlowerIdGame' });
    }

    /* ================================================================
     * 数据定义
     * ================================================================ */

    FLOWERS = {
        juhua: {
            id: 'juhua',
            name: '菊花',
            imageKey: 'flower_juhua',
            imagePath: 'src/assets/picture/小游戏-菊花.webp',
            isCorrect: false,
            descHeader: '菊花 — 秋霜君子',
            descBody: '菊花性甘苦微寒，入肺肝二经，\n善散风清热、平肝明目。\n杭白菊、亳菊、滁菊、贡菊\n并称四大名菊。',
            descTip: '💡 菊花多半在秋季绽放，\n金银花开于初夏，叶对生，\n花初白后黄，故名"金银"。'
        },
        xiuqiu: {
            id: 'xiuqiu',
            name: '黄色绣球花',
            imageKey: 'flower_xiuqiu',
            imagePath: 'src/assets/picture/小游戏-绣球.webp',
            isCorrect: false,
            descHeader: '绣球花 — 花团锦簇',
            descBody: '绣球花虽花色丰富、花团饱满，\n但多作观赏之用，\n并非中药材。\n古人云"梅兰竹菊"四君子，\n绣球不在其列。',
            descTip: '💡 绣球花无药用价值，\n金银花则清热解毒、\n疏散风热，自古入药。'
        },
        jinyinhua: {
            id: 'jinyinhua',
            name: '金银花',
            imageKey: 'flower_jinyinhua',
            imagePath: 'src/assets/picture/小游戏-金银花.webp',
            isCorrect: true,
            descHeader: '金银花 — 清热解毒圣品',
            descBody: '金银花性甘寒，入肺心胃经，\n清热解毒、疏散风热、\n凉血止痢。初花洁白，\n后转金黄，故名"金银"。',
            descTip: '✨ 您答对了！此即金银花。'
        }
    };

    CARD_ORDER = ['juhua', 'xiuqiu', 'jinyinhua'];

    get L() {
        return { W: 1280, H: 720, CARD_W: 280, CARD_H: 360, CARD_GAP: 60,
            TITLE_Y: 55, SUBTITLE_Y: 108, CARDS_Y: 375, FEEDBACK_Y: 630 };
    }

    /* ================================================================
     * Phaser 生命周期
     * ================================================================ */

    init(data) {
        this._sceneData = data || {};
        console.log('[FlowerIdGame] init 收到数据:', this._sceneData);
    }

    preload() {
        console.log('[FlowerIdGame] preload 开始加载图片...');
        this.load.image(this.FLOWERS.juhua.imageKey, this.FLOWERS.juhua.imagePath);
        this.load.image(this.FLOWERS.xiuqiu.imageKey, this.FLOWERS.xiuqiu.imagePath);
        this.load.image(this.FLOWERS.jinyinhua.imageKey, this.FLOWERS.jinyinhua.imagePath);
        this.load.image('lingchong', 'src/assets/picture/灵宠.webp');

        this.load.on('complete', () => {
            console.log('[FlowerIdGame] 所有图片加载完成');
        });
        this.load.on('loaderror', (file) => {
            console.error('[FlowerIdGame] 图片加载失败:', file.key, file.src);
        });
    }

    create() {
        try {
            console.log('[FlowerIdGame] create 开始构建UI...');
            const L = this.L;
            this.hasAnswered = false;

            // ★ 关键：确保本场景渲染在最顶层
            this.scene.bringToTop();
            console.log('[FlowerIdGame] bringToTop, active scenes:',
                this.scene.manager.getScenes(true).map(s => s.sceneKey));

            // === 1) 全屏遮罩背景 ===
            const bg = this.add.graphics().setDepth(0);
            bg.fillStyle(0x1A1E14, 1);
            bg.fillRect(0, 0, L.W, L.H);

            // === 2) 四角装饰 ===
            this._drawCorners();

            // === 3) 顶部标题 ===
            this._createTitle();

            // === 4) 三张花卉卡片 ===
            this._createCards();

            // === 5) 反馈文字区（初始隐藏） ===
            this.feedbackContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
            this._buildFeedbackUI();

            // === 6) 药宠科普弹窗（初始隐藏） ===
            this.petOverlay = this.add.container(0, 0).setDepth(200).setVisible(false);
            this._buildPetOverlay();

            // === 7) 键盘快捷操作 ===
            this.input.keyboard.on('keydown-ONE', () => this._onCardClick('juhua'));
            this.input.keyboard.on('keydown-TWO', () => this._onCardClick('xiuqiu'));
            this.input.keyboard.on('keydown-THREE', () => this._onCardClick('jinyinhua'));

            console.log('[FlowerIdGame] create 完成，场景就绪');
        } catch (err) {
            console.error('[FlowerIdGame] create 出错:', err.message, err.stack);
        }
    }

    /* ================================================================
     * UI 构建
     * ================================================================ */

    _drawCorners() {
        const g = this.add.graphics().setDepth(1);
        const len = 60, pad = 24, color = 0x6B5E4A, alpha = 0.4;
        const L = this.L;
        g.lineStyle(1.5, color, alpha);
        const lines = [
            [pad, pad, pad + len, pad],
            [pad, pad, pad, pad + len],
            [L.W - pad - len, pad, L.W - pad, pad],
            [L.W - pad, pad, L.W - pad, pad + len],
            [pad, L.H - pad, pad + len, L.H - pad],
            [pad, L.H - pad - len, pad, L.H - pad],
            [L.W - pad - len, L.H - pad, L.W - pad, L.H - pad],
            [L.W - pad, L.H - pad - len, L.W - pad, L.H - pad],
        ];
        lines.forEach(([x1, y1, x2, y2]) => {
            g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath();
        });
    }

    _createTitle() {
        const L = this.L;

        // 标题底框
        const titleBg = this.add.graphics().setDepth(5);
        titleBg.fillStyle(0x3A382E, 0.7);
        titleBg.fillRoundedRect(L.W / 2 - 220, 20, 440, 62, 10);
        titleBg.lineStyle(1, 0x8B7A5C, 0.6);
        titleBg.strokeRoundedRect(L.W / 2 - 220, 20, 440, 62, 10);

        // 主标题
        this.add.text(L.W / 2, L.TITLE_Y, '识花辨影', {
            fontFamily: '"KaiTi", "STKaiti", "FangSong", "SimSun", serif',
            fontSize: '44px', color: '#B8C9B0',
            stroke: '#1A1D16', strokeThickness: 2,
            letterSpacing: 8,
        }).setOrigin(0.5).setDepth(10);

        // 副标题
        this.add.text(L.W / 2, L.SUBTITLE_Y, '三花选一，找出金银花', {
            fontFamily: '"KaiTi", "STKaiti", "FangSong", "SimSun", serif',
            fontSize: '20px', color: '#C8BFA0',
            stroke: '#1A1D16', strokeThickness: 1,
            letterSpacing: 4,
        }).setOrigin(0.5).setDepth(10);
    }

    _createCards() {
        const L = this.L;
        const { CARD_W: cw, CARD_H: ch, CARD_GAP: gap } = L;
        const totalW = cw * 3 + gap * 2;
        const startX = (L.W - totalW) / 2;

        this.cards = {};

        this.CARD_ORDER.forEach((flowerId, i) => {
            const flower = this.FLOWERS[flowerId];
            const cx = startX + cw / 2 + i * (cw + gap);
            const cy = L.CARDS_Y;

            const container = this.add.container(cx, cy).setDepth(20);

            // ★ 先加底板（最底层）
            const cardBg = this.add.graphics();
            cardBg.fillStyle(0xE8DFC8, 0.95);
            cardBg.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 12);
            cardBg.lineStyle(2, 0xB8A878, 0.7);
            cardBg.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 12);
            container.add(cardBg);

            // ★ 花卉图片（在底板之上，撑满卡片）
            const pad = 16;
            const imgW = cw - pad * 2;
            const imgH = ch - pad * 2;

            if (this.textures.exists(flower.imageKey)) {
                const img = this.add.image(0, 0, flower.imageKey)
                    .setDisplaySize(imgW, imgH);
                container.add(img);
                console.log('[FlowerIdGame] 图片已加载:', flower.imageKey);
            } else {
                console.warn('[FlowerIdGame] 图片未加载，显示占位:', flower.imageKey);
                const ph = this.add.graphics();
                ph.fillStyle(0xD8CFB8, 1);
                ph.fillRoundedRect(-imgW / 2, -imgH / 2, imgW, imgH, 8);
                ph.lineStyle(1, 0xA09878, 0.5);
                ph.strokeRoundedRect(-imgW / 2, -imgH / 2, imgW, imgH, 8);
                container.add(ph);
            }

            // ★ 序号（最顶层，左上角小标）
            const idx = this.add.text(-cw / 2 + 14, -ch / 2 + 10, `${i + 1}`, {
                fontSize: '14px', color: '#8B7A5C', fontFamily: 'monospace',
            }).setOrigin(0, 0).setAlpha(0.6);
            container.add(idx);

            // ★ 交互区域
            const hitArea = new Phaser.Geom.Rectangle(-cw / 2, -ch / 2, cw, ch);
            container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

            // hover 效果
            container.on('pointerover', () => {
                if (this.hasAnswered) return;
                cardBg.clear();
                cardBg.fillStyle(0xF5EDD8, 0.98);
                cardBg.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 12);
                cardBg.lineStyle(2.5, 0xC4A870, 0.9);
                cardBg.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 12);
                this.tweens.add({
                    targets: container,
                    scaleX: 1.04, scaleY: 1.04,
                    duration: 150, ease: 'Sine.easeOut',
                });
            });
            container.on('pointerout', () => {
                if (this.hasAnswered) return;
                cardBg.clear();
                cardBg.fillStyle(0xE8DFC8, 0.95);
                cardBg.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 12);
                cardBg.lineStyle(2, 0xB8A878, 0.7);
                cardBg.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 12);
                this.tweens.add({
                    targets: container,
                    scaleX: 1, scaleY: 1,
                    duration: 150, ease: 'Sine.easeOut',
                });
            });
            container.on('pointerdown', () => {
                console.log('[FlowerIdGame] 点击卡片:', flowerId);
                this._onCardClick(flowerId);
            });

            this.cards[flowerId] = container;
            console.log('[FlowerIdGame] 卡片已创建:', flowerId);
        });
    }

    _buildFeedbackUI() {
        const L = this.L;
        const cont = this.feedbackContainer;

        const bgBar = this.add.graphics();
        bgBar.fillStyle(0x1F2118, 0.9);
        bgBar.fillRoundedRect(L.W / 2 - 260, L.FEEDBACK_Y - 24, 520, 48, 12);
        bgBar.lineStyle(1, 0x8B7A5C, 0.6);
        bgBar.strokeRoundedRect(L.W / 2 - 260, L.FEEDBACK_Y - 24, 520, 48, 12);
        cont.add(bgBar);

        this.feedbackText = this.add.text(L.W / 2, L.FEEDBACK_Y, '', {
            fontFamily: '"KaiTi", "STKaiti", "FangSong", serif',
            fontSize: '22px', color: '#C8BFA0', letterSpacing: 3,
        }).setOrigin(0.5);
        cont.add(this.feedbackText);
    }

    _buildPetOverlay() {
        const L = this.L;
        const cont = this.petOverlay;

        // 全屏遮罩
        const mask = this.add.graphics();
        mask.fillStyle(0x0A0A08, 0.7);
        mask.fillRect(0, 0, L.W, L.H);
        mask.setInteractive(new Phaser.Geom.Rectangle(0, 0, L.W, L.H),
            Phaser.Geom.Rectangle.Contains);
        cont.add(mask);

        // 弹窗
        const pw = 700, ph = 420, px = L.W / 2, py = L.H / 2 - 10;
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x2D2A1E, 0.97);
        panelBg.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 16);
        panelBg.lineStyle(2, 0x8B7A5C, 0.8);
        panelBg.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 16);
        cont.add(panelBg);

        // 标题
        cont.add(this.add.text(px, py - ph / 2 + 30, '🌿 药宠 · 青苗', {
            fontFamily: '"KaiTi", "STKaiti", "FangSong", serif',
            fontSize: '24px', color: '#E8D8B8', letterSpacing: 4,
        }).setOrigin(0.5));

        // 灵宠立绘
        const petX = px - 220, petY = py + 10;
        if (this.textures.exists('lingchong')) {
            cont.add(this.add.image(petX, petY, 'lingchong').setDisplaySize(160, 220));
        } else {
            const ph = this.add.graphics();
            ph.fillStyle(0x252318, 1);
            ph.fillRoundedRect(petX - 80, petY - 110, 160, 220, 10);
            ph.lineStyle(1, 0x8B7A5C, 0.5);
            ph.strokeRoundedRect(petX - 80, petY - 110, 160, 220, 10);
            cont.add(ph);
            cont.add(this.add.text(petX, petY, '🐾', { fontSize: '48px' }).setOrigin(0.5));
        }

        // 科普文字
        this.petDescHeader = this.add.text(px + 30, py - ph / 2 + 72, '', {
            fontFamily: '"KaiTi", "STKaiti", "FangSong", serif',
            fontSize: '18px', color: '#D4A857', letterSpacing: 2,
        }).setOrigin(0, 0.5);
        cont.add(this.petDescHeader);

        this.petDescBody = this.add.text(px + 30, py - ph / 2 + 108, '', {
            fontFamily: '"Microsoft YaHei", "SimHei", sans-serif',
            fontSize: '14px', color: '#C0B898', lineSpacing: 6,
            wordWrap: { width: 320, useAdvancedWrap: true },
        }).setOrigin(0, 0);
        cont.add(this.petDescBody);

        this.petDescTip = this.add.text(px + 30, py + 56, '', {
            fontFamily: '"KaiTi", "STKaiti", serif',
            fontSize: '13px', color: '#9A8E70', lineSpacing: 4,
            wordWrap: { width: 320, useAdvancedWrap: true },
            fontStyle: 'italic',
        }).setOrigin(0, 0);
        cont.add(this.petDescTip);

        // 重新尝试按钮
        const btnW = 140, btnH = 40, btnY = py + ph / 2 - 48;
        const retryBtn = this.add.graphics();
        retryBtn.fillStyle(0x5A4A2E, 0.9);
        retryBtn.fillRoundedRect(px - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        retryBtn.lineStyle(1.5, 0xC4A870, 0.7);
        retryBtn.strokeRoundedRect(px - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        cont.add(retryBtn);

        cont.add(this.add.text(px, btnY, '再试一次', {
            fontFamily: '"KaiTi", "STKaiti", "FangSong", serif',
            fontSize: '20px', color: '#E8D8B8', letterSpacing: 4,
        }).setOrigin(0.5));

        const retryZone = this.add.zone(px, btnY, btnW, btnH)
            .setInteractive({ useHandCursor: true });
        retryZone.on('pointerover', () => {
            retryBtn.clear();
            retryBtn.fillStyle(0x7A6A3E, 0.95);
            retryBtn.fillRoundedRect(px - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
            retryBtn.lineStyle(2, 0xE8C870, 0.9);
            retryBtn.strokeRoundedRect(px - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        });
        retryZone.on('pointerout', () => {
            retryBtn.clear();
            retryBtn.fillStyle(0x5A4A2E, 0.9);
            retryBtn.fillRoundedRect(px - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
            retryBtn.lineStyle(1.5, 0xC4A870, 0.7);
            retryBtn.strokeRoundedRect(px - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        });
        retryZone.on('pointerdown', () => this._closePetOverlay());
        cont.add(retryZone);
    }

    /* ================================================================
     * 核心交互逻辑
     * ================================================================ */

    _onCardClick(flowerId) {
        if (this.hasAnswered) return;
        this.hasAnswered = true;
        console.log('[FlowerIdGame] 判定卡片:', flowerId);

        const flower = this.FLOWERS[flowerId];
        this._highlightCard(flowerId);

        if (flower.isCorrect) {
            this._showCorrectFeedback(flowerId);
        } else {
            this._showWrongFeedback(flowerId);
        }
    }

    _highlightCard(flowerId) {
        Object.entries(this.cards).forEach(([id, cont]) => {
            cont.disableInteractive();
            if (id === flowerId) {
                this.tweens.add({
                    targets: cont,
                    scaleX: 1.06, scaleY: 1.06,
                    duration: 200, ease: 'Back.easeOut',
                });
            } else {
                cont.setAlpha(0.35);
            }
        });
    }

    _resetCards() {
        const L = this.L;
        Object.entries(this.cards).forEach(([id, cont]) => {
            cont.setAlpha(1);
            cont.setScale(1);
            const hitArea = new Phaser.Geom.Rectangle(-L.CARD_W / 2, -L.CARD_H / 2, L.CARD_W, L.CARD_H);
            cont.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        });
    }

    /* ================================================================
     * 反馈系统
     * ================================================================ */

    _showCorrectFeedback(flowerId) {
        console.log('[FlowerIdGame] ✅ 答对！');

        this.feedbackContainer.setVisible(true);
        this.feedbackText.setText('✨ 慧眼识花 — 答对啦！');
        this.feedbackText.setColor('#7AAA5A');
        this.feedbackContainer.setAlpha(0);
        this.tweens.add({
            targets: this.feedbackContainer,
            alpha: 1, duration: 400, ease: 'Sine.easeOut',
        });

        this.time.delayedCall(1800, () => {
            this._notifyIntroScene(true);
        });
    }

    _showWrongFeedback(flowerId) {
        console.log('[FlowerIdGame] ❌ 答错:', flowerId);

        const flower = this.FLOWERS[flowerId];

        this.feedbackContainer.setVisible(true);
        this.feedbackText.setText('并非此物，再试试……');
        this.feedbackText.setColor('#D4A857');
        this.feedbackContainer.setAlpha(0);
        this.tweens.add({
            targets: this.feedbackContainer,
            alpha: 1, duration: 300, ease: 'Sine.easeOut',
        });

        this.time.delayedCall(1200, () => {
            this.feedbackContainer.setVisible(false);
            this._showPetOverlay(flower);
        });
    }

    _showPetOverlay(flower) {
        this.petDescHeader.setText(flower.descHeader);
        this.petDescBody.setText(flower.descBody);
        this.petDescTip.setText(flower.descTip);

        this.petOverlay.setVisible(true);
        this.petOverlay.setAlpha(0);
        this.tweens.add({
            targets: this.petOverlay,
            alpha: 1, duration: 350, ease: 'Sine.easeOut',
        });
    }

    _closePetOverlay() {
        this.tweens.add({
            targets: this.petOverlay,
            alpha: 0, duration: 250, ease: 'Sine.easeIn',
            onComplete: () => {
                this.petOverlay.setVisible(false);
                this.feedbackContainer.setVisible(false);
                this._resetCards();
                this.hasAnswered = false;
                console.log('[FlowerIdGame] 科普面板关闭，可重新选择');
            },
        });
    }

    /* ================================================================
     * 场景退出 & 通信
     * ================================================================ */

    _notifyIntroScene(success) {
        console.log('[FlowerIdGame] 通知 IntroScene 答题结果:', success);
        console.log('[FlowerIdGame] 当前活跃场景:', this.scene.manager.getScenes(true).map(s => s.sceneKey));

        this.cameras.main.fadeOut(500, 26, 34, 22);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (window.gameStateManager && window.gameStateManager.state) {
                window.gameStateManager.state.__flowerIdResult = {
                    success, correctAnswer: 'jinyinhua', timestamp: Date.now(),
                };
                console.log('[FlowerIdGame] 结果已写入 gameState');
            }
            console.log('[FlowerIdGame] 即将 stop 场景...');
            this.scene.stop();
        });
    }

    shutdown() {
        console.log('[FlowerIdGame] shutdown() 场景关闭');
    }
}

// 导出全局类
window.FlowerIdGame = FlowerIdGame;
console.log('[FlowerIdGame] 类已注册到 window.FlowerIdGame');
