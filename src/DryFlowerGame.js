/**
 * 山野晒菊 — 拖拽晾晒小游戏
 * 将菊花从背篓拖到竹匾上晾晒，5朵全放置即完成
 *
 * 适配：1280×720，古风水墨雅致画风
 */
class DryFlowerGame extends Phaser.Scene {

    constructor() {
        super({ key: 'DryFlowerGame' });
    }

    /* ============================================================
     * 常量
     * ============================================================ */
    TOTAL_FLOWERS = 5;
    FLOWER_SIZE = 48;

    get L() {
        return {
            W: 1280, H: 720,
            BASKET_X: 220, BASKET_Y: 460,
            SIEVE_CX: 920, SIEVE_CY: 400,
            SIEVE_RX: 280, SIEVE_RY: 200,
            TITLE_Y: 52,
        };
    }

    /* ============================================================
     * 生命周期
     * ============================================================ */

    init(data) {
        this._sceneData = data || {};
        console.log('[DryFlowerGame] init:', this._sceneData);
    }

    preload() {
        console.log('[DryFlowerGame] preload 开始...');
        this.load.image('dry_basket', 'src/assets/picture/晒菊游戏-背篓.webp');
        this.load.image('dry_flower', 'src/assets/picture/晒菊游戏-菊花.webp');
    }

    create() {
        try {
            console.log('[DryFlowerGame] create 开始...');
            const L = this.L;
            this.placedCount = 0;
            this._slotUsed = new Array(this.TOTAL_FLOWERS).fill(false); // 筛位占用

            // ★ 确保渲染在最顶层
            this.scene.bringToTop();

            // === 背景 ===
            const bg = this.add.graphics().setDepth(0);
            bg.fillStyle(0x1E2A14, 1);
            bg.fillRect(0, 0, L.W, L.H);

            // === 四角装饰 ===
            this._drawCorners();

            // === 标题 ===
            this._createTitle();

            // === 竹匾（晾晒区） ===
            this._drawSieve();

            // === 背篓 ===
            this._drawBasket();

            // === 菊花（可拖拽） ===
            this._createFlowers();

            // === 完成提示（初始隐藏） ===
            this._createCompleteTip();

            // === 重置按钮 ===
            this._createResetBtn();

            console.log('[DryFlowerGame] create 完成');
        } catch (err) {
            console.error('[DryFlowerGame] create 出错:', err.message, err.stack);
        }
    }

    /* ============================================================
     * UI 构建
     * ============================================================ */

    _drawCorners() {
        const g = this.add.graphics().setDepth(1);
        const len = 60, pad = 24, color = 0x6B7A4A, alpha = 0.35;
        const L = this.L;
        g.lineStyle(1.5, color, alpha);
        const pts = [
            [pad, pad, pad + len, pad], [pad, pad, pad, pad + len],
            [L.W - pad - len, pad, L.W - pad, pad], [L.W - pad, pad, L.W - pad, pad + len],
            [pad, L.H - pad, pad + len, L.H - pad], [pad, L.H - pad - len, pad, L.H - pad],
            [L.W - pad - len, L.H - pad, L.W - pad, L.H - pad], [L.W - pad, L.H - pad - len, L.W - pad, L.H - pad],
        ];
        pts.forEach(([x1, y1, x2, y2]) => {
            g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath();
        });
    }

    _createTitle() {
        const L = this.L;

        const titleBg = this.add.graphics().setDepth(5);
        titleBg.fillStyle(0x2E3A1E, 0.7);
        titleBg.fillRoundedRect(L.W / 2 - 180, 20, 360, 54, 10);
        titleBg.lineStyle(1, 0x8B9A6C, 0.5);
        titleBg.strokeRoundedRect(L.W / 2 - 180, 20, 360, 54, 10);

        this.add.text(L.W / 2, L.TITLE_Y, '山 野 晒 菊', {
            fontFamily: '"KaiTi", "STKaiti", "FangSong", "SimSun", serif',
            fontSize: '38px', color: '#C8D8B0',
            stroke: '#1A2016', strokeThickness: 2,
            letterSpacing: 8,
        }).setOrigin(0.5).setDepth(10);

        this.add.text(L.W / 2, 124, '将菊花拖至竹匾中晾晒', {
            fontFamily: '"KaiTi", "STKaiti", serif',
            fontSize: '18px', color: '#B0B898',
            stroke: '#1A2016', strokeThickness: 1,
            letterSpacing: 4,
        }).setOrigin(0.5).setDepth(10);
    }

    _drawSieve() {
        const L = this.L;
        const g = this.add.graphics().setDepth(5);
        const { SIEVE_CX: cx, SIEVE_CY: cy, SIEVE_RX: rx, SIEVE_RY: ry } = L;

        // 竹匾主体 — 浅竹色椭圆
        g.fillStyle(0xC8B878, 0.5);
        g.fillEllipse(cx, cy, rx * 2, ry * 2);

        // 竹匾边框
        g.lineStyle(4, 0xA08848, 0.8);
        g.strokeEllipse(cx, cy, rx * 2, ry * 2);

        // 内圈纹理
        g.lineStyle(2, 0xB8A460, 0.3);
        g.strokeEllipse(cx, cy, rx * 2 - 14, ry * 2 - 14);
        g.strokeEllipse(cx, cy, rx * 2 - 32, ry * 2 - 30);

        // 竹编纹理线
        g.lineStyle(1, 0x9A8A50, 0.18);
        for (let i = -3; i <= 3; i++) {
            const ox = cx + i * 80;
            g.beginPath();
            g.moveTo(ox, cy - ry + 20);
            g.lineTo(ox, cy + ry - 20);
            g.strokePath();
        }
        for (let j = -2; j <= 2; j++) {
            const oy = cy + j * 60;
            g.beginPath();
            g.moveTo(cx - rx + 30, oy);
            g.lineTo(cx + rx - 30, oy);
            g.strokePath();
        }

        // 网格提示点（淡色小圈，标记放置位）
        this._sieveSlots = [];
        this._slotHintGfx = this.add.graphics().setDepth(6);
        const slotPositions = this._getSlotPositions();
        slotPositions.forEach(({ x: sx, y: sy }) => {
            this._slotHintGfx.fillStyle(0xB8A878, 0.2);
            this._slotHintGfx.fillCircle(sx, sy, 18);
            this._slotHintGfx.lineStyle(1, 0x9A8A50, 0.3);
            this._slotHintGfx.strokeCircle(sx, sy, 18);
            this._sieveSlots.push({ x: sx, y: sy, used: false });
        });

        // 竹匾标签
        this.add.text(cx, cy + ry + 28, '竹 匾', {
            fontFamily: '"KaiTi", "STKaiti", serif',
            fontSize: '16px', color: '#A09870',
        }).setOrigin(0.5).setDepth(10);
    }

    _getSlotPositions() {
        const L = this.L;
        const { SIEVE_CX: cx, SIEVE_CY: cy } = L;
        // 在竹匾内均匀排布 5 个放置位
        return [
            { x: cx - 100, y: cy - 50 },
            { x: cx + 100, y: cy - 50 },
            { x: cx,       y: cy + 20 },
            { x: cx - 100, y: cy + 70 },
            { x: cx + 100, y: cy + 70 },
        ];
    }

    _drawBasket() {
        const L = this.L;
        const { BASKET_X: bx, BASKET_Y: by } = L;

        if (this.textures.exists('dry_basket')) {
            const basketImg = this.add.image(bx, by, 'dry_basket')
                .setDisplaySize(160, 160)
                .setDepth(10);
            console.log('[DryFlowerGame] 背篓图片已加载');
        } else {
            // 占位图形
            const g = this.add.graphics().setDepth(10);
            g.fillStyle(0x8C7040, 0.7);
            g.fillRoundedRect(bx - 80, by - 70, 160, 140, 12);
            g.lineStyle(3, 0x6B5230, 0.8);
            g.strokeRoundedRect(bx - 80, by - 70, 160, 140, 12);
            this.add.text(bx, by, '背篓', {
                fontSize: '20px', color: '#C8B898',
            }).setOrigin(0.5).setDepth(11);
        }

        // 标签
        this.add.text(bx, by + 110, '花 篓', {
            fontFamily: '"KaiTi", "STKaiti", serif',
            fontSize: '16px', color: '#A09870',
        }).setOrigin(0.5).setDepth(10);
    }

    _createFlowers() {
        const L = this.L;
        const { BASKET_X: bx, BASKET_Y: by } = L;
        this._flowers = [];

        for (let i = 0; i < this.TOTAL_FLOWERS; i++) {
            // 随机散布在背篓内
            const fx = bx + (Math.random() - 0.5) * 80;
            const fy = by + (Math.random() - 0.5) * 60;

            let flower;
            if (this.textures.exists('dry_flower')) {
                flower = this.add.image(fx, fy, 'dry_flower')
                    .setDisplaySize(this.FLOWER_SIZE, this.FLOWER_SIZE);
            } else {
                // 占位：黄色圆形
                const g = this.add.graphics();
                g.fillStyle(0xD8A820, 1);
                g.fillCircle(fx, fy, this.FLOWER_SIZE / 2);
                flower = this.add.container(fx, fy).add(g);
            }
            flower.setDepth(20).setInteractive({ draggable: true, useHandCursor: true });
            flower.flowerIndex = i;  // 标记索引

            this.input.setDraggable(flower);

            // ★ 拖拽事件（用相对缩放，避免覆盖 setDisplaySize 的缩放）
            flower._dragScaleX = flower.scaleX;
            flower._dragScaleY = flower.scaleY;

            flower.on('dragstart', () => {
                flower.setDepth(100);
                flower.scaleX = flower._dragScaleX * 1.15;
                flower.scaleY = flower._dragScaleY * 1.15;
            });

            flower.on('drag', (_pointer, dragX, dragY) => {
                flower.x = dragX;
                flower.y = dragY;
            });

            flower.on('dragend', () => {
                flower.scaleX = flower._dragScaleX;
                flower.scaleY = flower._dragScaleY;
                this._onFlowerDrop(flower);
            });

            this._flowers.push(flower);
        }
    }

    _createCompleteTip() {
        const L = this.L;
        this._completeTip = this.add.container(L.W / 2, L.H / 2).setDepth(200).setVisible(false);

        const tipBg = this.add.graphics();
        tipBg.fillStyle(0x252A14, 0.95);
        tipBg.fillRoundedRect(-160, -40, 320, 80, 14);
        tipBg.lineStyle(2, 0xB8C488, 0.8);
        tipBg.strokeRoundedRect(-160, -40, 320, 80, 14);
        this._completeTip.add(tipBg);

        this._completeTip.add(this.add.text(0, 0, '🌼 菊花晾晒完毕！', {
            fontFamily: '"KaiTi", "STKaiti", serif',
            fontSize: '26px', color: '#D8E8B8',
            letterSpacing: 4,
        }).setOrigin(0.5));
    }

    _createResetBtn() {
        const L = this.L;
        const btnX = L.W / 2, btnY = L.H - 44;

        this._resetBtnBg = this.add.graphics().setDepth(150);
        this._resetBtnBg.fillStyle(0x5A4A2E, 0.9);
        this._resetBtnBg.fillRoundedRect(btnX - 70, btnY - 18, 140, 36, 10);
        this._resetBtnBg.lineStyle(1.5, 0xA09860, 0.6);
        this._resetBtnBg.strokeRoundedRect(btnX - 70, btnY - 18, 140, 36, 10);

        this.add.text(btnX, btnY, '重新晾晒', {
            fontFamily: '"KaiTi", "STKaiti", serif',
            fontSize: '18px', color: '#D8C8A8',
            letterSpacing: 4,
        }).setOrigin(0.5).setDepth(151);

        const btnZone = this.add.zone(btnX, btnY, 140, 36)
            .setInteractive({ useHandCursor: true }).setDepth(152);

        btnZone.on('pointerover', () => {
            this._resetBtnBg.clear();
            this._resetBtnBg.fillStyle(0x7A6A3E, 0.95);
            this._resetBtnBg.fillRoundedRect(btnX - 70, btnY - 18, 140, 36, 10);
            this._resetBtnBg.lineStyle(2, 0xC8B868, 0.8);
            this._resetBtnBg.strokeRoundedRect(btnX - 70, btnY - 18, 140, 36, 10);
        });
        btnZone.on('pointerout', () => {
            this._resetBtnBg.clear();
            this._resetBtnBg.fillStyle(0x5A4A2E, 0.9);
            this._resetBtnBg.fillRoundedRect(btnX - 70, btnY - 18, 140, 36, 10);
            this._resetBtnBg.lineStyle(1.5, 0xA09860, 0.6);
            this._resetBtnBg.strokeRoundedRect(btnX - 70, btnY - 18, 140, 36, 10);
        });
        btnZone.on('pointerdown', () => this._resetGame());
    }

    /* ============================================================
     * 核心逻辑
     * ============================================================ */

    _onFlowerDrop(flower) {
        const L = this.L;
        const { SIEVE_CX: cx, SIEVE_CY: cy, SIEVE_RX: rx, SIEVE_RY: ry } = L;

        // 检查是否落在竹匾区域内（椭圆判断）
        const dx = flower.x - cx;
        const dy = flower.y - cy;
        const inSieve = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;

        if (inSieve && this.placedCount < this.TOTAL_FLOWERS) {
            // ★ 吸附到最近的空位
            let bestSlotIdx = -1;
            let bestDist = Infinity;
            this._sieveSlots.forEach((slot, idx) => {
                if (slot.used) return;
                const slotDx = flower.x - slot.x;
                const slotDy = flower.y - slot.y;
                const dist = slotDx * slotDx + slotDy * slotDy;
                if (dist < bestDist) {
                    bestDist = dist;
                    bestSlotIdx = idx;
                }
            });

            if (bestSlotIdx >= 0) {
                const slot = this._sieveSlots[bestSlotIdx];
                slot.used = true;
                flower.slotIndex = bestSlotIdx;

                // 吸附动画
                this.tweens.add({
                    targets: flower,
                    x: slot.x, y: slot.y,
                    duration: 200, ease: 'Back.easeOut',
                });

                flower.disableInteractive();
                flower.setDepth(30);
                this.placedCount++;
                console.log('[DryFlowerGame] 菊花就位:', this.placedCount, '/', this.TOTAL_FLOWERS);

                // 清除该位置的提示点
                this._slotHintGfx.clear();
                this._sieveSlots.forEach(s => {
                    if (!s.used) {
                        this._slotHintGfx.fillStyle(0xB8A878, 0.2);
                        this._slotHintGfx.fillCircle(s.x, s.y, 18);
                        this._slotHintGfx.lineStyle(1, 0x9A8A50, 0.3);
                        this._slotHintGfx.strokeCircle(s.x, s.y, 18);
                    }
                });

                if (this.placedCount >= this.TOTAL_FLOWERS) {
                    this._onAllPlaced();
                }
            } else {
                this._snapBackToBasket(flower);
            }
        } else if (inSieve && this.placedCount >= this.TOTAL_FLOWERS) {
            this._snapBackToBasket(flower);
        } else {
            this._snapBackToBasket(flower);
        }
    }

    _snapBackToBasket(flower) {
        const L = this.L;
        const { BASKET_X: bx, BASKET_Y: by } = L;
        this.tweens.add({
            targets: flower,
            x: bx + (Math.random() - 0.5) * 60,
            y: by + (Math.random() - 0.5) * 45,
            duration: 300, ease: 'Sine.easeOut',
        });
    }

    _onAllPlaced() {
        console.log('[DryFlowerGame] ✅ 全部就位！');
        this._completeTip.setVisible(true);
        this._completeTip.setAlpha(0);
        this._completeTip.setScale(0.7);

        this.tweens.add({
            targets: this._completeTip,
            alpha: 1,
            scaleX: 1, scaleY: 1,
            duration: 500, ease: 'Back.easeOut',
            onComplete: () => {
                // 2秒后自动关闭
                this.time.delayedCall(2500, () => {
                    this._notifyIntroScene(true);
                });
            },
        });
    }

    _resetGame() {
        console.log('[DryFlowerGame] 重新晾晒');
        this.placedCount = 0;
        this._completeTip.setVisible(false);

        // 重置筛位
        this._sieveSlots.forEach(s => { s.used = false; });

        // 重置花朵位置
        const L = this.L;
        const { BASKET_X: bx, BASKET_Y: by } = L;
        this._flowers.forEach(flower => {
            this.tweens.add({
                targets: flower,
                x: bx + (Math.random() - 0.5) * 80,
                y: by + (Math.random() - 0.5) * 60,
                duration: 350, ease: 'Sine.easeOut',
            });
            flower.setInteractive({ draggable: true, useHandCursor: true });
            this.input.setDraggable(flower);
            flower.setDepth(20);
        });

        // 恢复提示点
        this._slotHintGfx.clear();
        this._sieveSlots.forEach(s => {
            this._slotHintGfx.fillStyle(0xB8A878, 0.2);
            this._slotHintGfx.fillCircle(s.x, s.y, 18);
            this._slotHintGfx.lineStyle(1, 0x9A8A50, 0.3);
            this._slotHintGfx.strokeCircle(s.x, s.y, 18);
        });
    }

    /* ============================================================
     * 场景退出 & 通信
     * ============================================================ */

    _notifyIntroScene(success) {
        console.log('[DryFlowerGame] 通知 IntroScene 晾晒结果:', success);

        this.cameras.main.fadeOut(500, 26, 34, 22);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (window.gameStateManager && window.gameStateManager.state) {
                window.gameStateManager.state.__dryFlowerResult = {
                    success, timestamp: Date.now(),
                };
                console.log('[DryFlowerGame] 结果已写入 gameState');
            }
            this.scene.stop();
        });
    }

    shutdown() {
        console.log('[DryFlowerGame] shutdown() 场景关闭');
    }
}

// 导出全局类
window.DryFlowerGame = DryFlowerGame;
console.log('[DryFlowerGame] 类已注册到 window.DryFlowerGame');
