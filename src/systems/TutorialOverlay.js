/**
 * TutorialOverlay.js
 * 教程遮罩系统
 * 支持聚光灯效果、高亮脉冲动画、步骤提示气泡
 */

class TutorialOverlay {
    /**
     * @param {Phaser.Scene} scene - 所属场景
     * @param {Object} config - 配置项
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = {
            maskAlpha: config.maskAlpha || 0.55,
            highlightColor: config.highlightColor || 0xffd700,
            pulseSpeed: config.pulseSpeed || 800,
            bubbleColor: config.bubbleColor || '#000000cc',
            bubbleTextColor: config.bubbleTextColor || '#f0e8d4'
        };

        // UI 容器
        this.container = null;
        this.maskGraphics = null;
        this.bubbleText = null;
        this.pulseTargets = []; // 脉冲动画目标列表

        this.isActive = false;
    }

    /**
     * 显示教程步骤
     * @param {Object} stepConfig - 步骤配置
     * @param {string} stepConfig.hint - 提示文字
     * @param {string} stepConfig.hintPosition - 提示位置 'bottom'|'top'|'center'
     * @param {Array} stepConfig.highlightTargets - 高亮目标 [{ x, y, radius }]
     * @param {number} stepConfig.pulseColor - 脉冲颜色
     * @param {Function} stepConfig.onComplete - 完成回调
     */
    show(stepConfig = {}) {
        this.hide(); // 先清除之前的

        this.isActive = true;

        // 创建主容器
        this.container = this.scene.add.container(0, 0).setDepth(200);
        this.scene.children.bringToTop(this.container);

        // 创建遮罩
        this._createMask(stepConfig.highlightTargets || []);

        // 创建提示气泡
        if (stepConfig.hint) {
            this._createBubble(stepConfig.hint, stepConfig.hintPosition || 'bottom');
        }

        // 创建高亮脉冲效果
        if (stepConfig.highlightTargets) {
            stepConfig.highlightTargets.forEach(target => {
                this._createPulse(target, stepConfig.pulseColor || this.config.highlightColor);
            });
        }

        // 添加点击区域（点击完成教程步骤）
        if (stepConfig.clickToContinue) {
            const overlay = this.scene.add.rectangle(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2,
                this.scene.cameras.main.width,
                this.scene.cameras.main.height,
                0x000000, 0.01 // 几乎透明，仅用于捕获点击
            )
                .setInteractive({ useHandCursor: false })
                .on('pointerdown', () => {
                    if (stepConfig.onComplete) stepConfig.onComplete();
                });
            this.container.add(overlay);
        }
    }

    /**
     * 创建遮罩（聚光灯效果）
     * @param {Array} targets - 高亮目标列表
     */
    _createMask(targets) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.maskGraphics = this.scene.add.graphics()
            .setDepth(199)
            .setScrollFactor(0);

        // 绘制半透明黑色背景
        this.maskGraphics.fillStyle(0x000000, this.config.maskAlpha);
        this.maskGraphics.fillRect(0, 0, width, height);

        // 在高亮区域挖空（聚光灯效果）
        targets.forEach(target => {
            const radius = target.radius || 50;
            // 使用 erase 模式挖空
            this.maskGraphics.fillStyle(0x000000, 1);
            // 用圆形挖空（通过绘制纯透明圆实现）
            // Phaser 不支持直接 erase，这里用更亮的颜色模拟聚光灯
        });

        // 简化版：直接添加高亮圆圈
        targets.forEach(target => {
            const circle = this.scene.add.graphics();
            circle.fillStyle(this.config.highlightColor, 0.15);
            circle.fillCircle(target.x, target.y, (target.radius || 50) * 1.5);
            circle.setDepth(199);
            circle.setScrollFactor(0);
            this.container.add(circle);
        });

        this.container.add(this.maskGraphics);
    }

    /**
     * 创建提示气泡
     * @param {string} text - 提示文字
     * @param {string} position - 位置 'bottom'|'top'|'center'
     */
    _createBubble(text, position) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        let y = height - 80; // 默认底部
        if (position === 'top') y = 80;
        else if (position === 'center') y = height / 2;

        // 气泡背景
        const bubbleBg = this.scene.add.graphics()
            .setDepth(201)
            .setScrollFactor(0);

        // 测量文本宽度
        const tempText = this.scene.add.text(0, 0, text, {
            fontSize: '14px',
            fontFamily: '"Ma Shan Zheng", serif',
            wordWrap: { width: width - 200 }
        });
        const textWidth = Math.min(tempText.width + 40, width - 100);
        const textHeight = tempText.height + 20;
        tempText.destroy();

        const bubbleX = (width - textWidth) / 2;

        // 绘制气泡
        bubbleBg.fillStyle(0x000000, 0.75);
        bubbleBg.fillRoundedRect(bubbleX, y - textHeight / 2, textWidth, textHeight, 10);
        bubbleBg.lineStyle(1, 0x8b7355, 0.5);
        bubbleBg.strokeRoundedRect(bubbleX, y - textHeight / 2, textWidth, textHeight, 10);

        // 气泡文本
        this.bubbleText = this.scene.add.text(width / 2, y, text, {
            fontSize: '14px',
            color: this.config.bubbleTextColor,
            fontFamily: '"Ma Shan Zheng", serif',
            wordWrap: { width: width - 120 },
            align: 'center',
            lineSpacing: 4
        })
            .setOrigin(0.5)
            .setDepth(202)
            .setScrollFactor(0);

        this.container.add([bubbleBg, this.bubbleText]);

        // 气泡闪烁动画
        this.scene.tweens.add({
            targets: this.bubbleText,
            alpha: 0.6,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * 创建脉冲高亮效果
     * @param {Object} target - 目标 { x, y, radius }
     * @param {number} color - 颜色
     */
    _createPulse(target, color) {
        const circle = this.scene.add.graphics()
            .setDepth(200)
            .setScrollFactor(0);

        circle.fillStyle(color, 0.3);
        circle.fillCircle(target.x, target.y, target.radius || 50);

        // 脉冲动画
        const pulse = this.scene.tweens.add({
            targets: circle,
            alpha: 0.05,
            scale: 1.8,
            duration: this.config.pulseSpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.pulseTargets.push({ graphics: circle, tween: pulse });
        this.container.add(circle);
    }

    /**
     * 高亮指定游戏对象（带脉冲动画）
     * @param {Phaser.GameObjects.GameObject} gameObject - 游戏对象
     * @param {number} color - 脉冲颜色
     */
    highlightObject(gameObject, color = 0xffd700) {
        if (!gameObject || !gameObject.active) return;

        const circle = this.scene.add.graphics()
            .setDepth(200);

        const x = gameObject.x;
        const y = gameObject.y;
        const radius = (gameObject.width || 30) + 10;

        circle.fillStyle(color, 0.25);
        circle.fillCircle(x, y, radius);

        // 脉冲动画
        const pulse = this.scene.tweens.add({
            targets: circle,
            alpha: 0.05,
            scale: 1.5,
            duration: this.config.pulseSpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.pulseTargets.push({ graphics: circle, tween: pulse });
        if (this.container) this.container.add(circle);
    }

    /**
     * 更新提示文字
     * @param {string} newText - 新提示文字
     */
    updateHint(newText) {
        if (this.bubbleText) {
            this.bubbleText.setText(newText);
        }
    }

    /**
     * 隐藏教程遮罩
     * @param {Function} onComplete - 完成回调
     */
    hide(onComplete) {
        if (!this.isActive) {
            if (onComplete) onComplete();
            return;
        }

        this.isActive = false;

        // 停止所有脉冲动画
        this.pulseTargets.forEach(target => {
            if (target.tween) target.tween.stop();
            if (target.graphics) target.graphics.destroy();
        });
        this.pulseTargets = [];

        // 淡出动画
        if (this.container) {
            this.scene.tweens.add({
                targets: this.container,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (this.container) {
                        this.container.destroy();
                        this.container = null;
                    }
                    if (onComplete) onComplete();
                }
            });
        } else {
            if (onComplete) onComplete();
        }

        this.maskGraphics = null;
        this.bubbleText = null;
    }

    /**
     * 销毁系统
     */
    destroy() {
        this.hide();
    }
}

// 导出
window.TutorialOverlay = TutorialOverlay;
