/**
 * CGDisplaySystem.js
 * CG演出系统
 * 支持全屏CG显示、Ken Burns效果、淡入淡出过渡动画
 */

class CGDisplaySystem {
    /**
     * @param {Phaser.Scene} scene - 所属场景
     * @param {Object} config - 配置项
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = {
            fadeInDuration: config.fadeInDuration || 1000,
            fadeOutDuration: config.fadeOutDuration || 1000,
            kenBurnsDuration: config.kenBurnsDuration || 3000,
            cgDepth: config.cgDepth || 50
        };

        // CG 容器
        this.container = null;
        this.cgImage = null;
        this.isPlaying = false;
    }

    /**
     * 显示全屏CG
     * @param {string} cgKey - CG图片的texture key
     * @param {Object} options - 显示选项
     * @param {Function} options.onComplete - 显示完成回调
     * @param {boolean} options.kenBurns - 是否启用Ken Burns效果
     * @param {string} options.kenBurnsDirection - 方向 'right-to-left'|'left-to-right'|'zoom-in'|'zoom-out'
     * @param {number} options.displayDuration - 显示时长（ms），0表示不自动关闭
     * @param {boolean} options.addClickToClose - 点击关闭
     */
    show(cgKey, options = {}) {
        this.hide(); // 先隐藏之前的

        this.isPlaying = true;

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // 创建容器
        this.container = this.scene.add.container(0, 0).setDepth(this.config.cgDepth);
        this.scene.children.bringToTop(this.container);

        // 创建CG图片
        if (this.scene.textures.exists(cgKey)) {
            this.cgImage = this.scene.add.image(width / 2, height / 2, cgKey)
                .setDisplaySize(width, height)
                .setAlpha(0);
            this.container.add(this.cgImage);
        } else {
            // 占位符：纯色背景 + 文字
            const placeholder = this.scene.add.graphics();
            const colors = {
                'CG_01': 0x3a2c44,
                'CG_02': 0x2a3c34,
                'CG_03': 0x2a4020,
                'CG_04': 0x4a3c24
            };
            placeholder.fillStyle(colors[cgKey] || 0x1a2a18, 1);
            placeholder.fillRect(0, 0, width, height);
            placeholder.setAlpha(0);
            this.container.add(placeholder);
            this.cgImage = placeholder;

            // 添加标注文字
            const label = this.scene.add.text(width / 2, height / 2, `CG\n${cgKey}\n(待替换)`, {
                fontSize: '32px',
                color: '#ffffff88',
                fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif',
                align: 'center',
                lineSpacing: 10
            })
                .setOrigin(0.5)
                .setAlpha(0);
            this.container.add(label);
        }

        // 淡入
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: options.fadeInDuration || this.config.fadeInDuration,
            ease: 'Power2',
            onComplete: () => {
                if (options.onComplete) options.onComplete();
            }
        });

        // Ken Burns 效果
        if (options.kenBurns && this.cgImage && this.cgImage.setCrop) {
            this._applyKenBurns(options.kenBurnsDirection || 'right-to-left');
        }

        // 自动关闭
        if (options.displayDuration && options.displayDuration > 0) {
            this.scene.time.delayedCall(options.displayDuration, () => {
                this.hide();
            });
        }

        // 点击关闭
        if (options.addClickToClose) {
            const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.01)
                .setInteractive({ useHandCursor: false })
                .on('pointerdown', () => this.hide());
            this.container.add(overlay);
        }
    }

    /**
     * 应用 Ken Burns 效果
     * @param {string} direction - 移动方向
     */
    _applyKenBurns(direction) {
        if (!this.cgImage) return;

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        let fromX = 0, fromY = 0, toX = 0, toY = 0;

        switch (direction) {
            case 'right-to-left':
                fromX = width * 0.05;
                toX = -width * 0.05;
                break;
            case 'left-to-right':
                fromX = -width * 0.05;
                toX = width * 0.05;
                break;
            case 'zoom-in':
                this.cgImage.setScale(1.0);
                this.scene.tweens.add({
                    targets: this.cgImage,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: this.config.kenBurnsDuration,
                    ease: 'Sine.easeInOut'
                });
                return;
            case 'zoom-out':
                this.cgImage.setScale(1.05);
                this.scene.tweens.add({
                    targets: this.cgImage,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    duration: this.config.kenBurnsDuration,
                    ease: 'Sine.easeInOut'
                });
                return;
        }

        // 平移效果
        this.cgImage.setPosition(width / 2 + fromX, height / 2 + fromY);
        this.scene.tweens.add({
            targets: this.cgImage,
            x: width / 2 + toX,
            y: height / 2 + toY,
            duration: this.config.kenBurnsDuration,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * 显示觉醒动画（灵宠觉醒专用）
     * @param {string} petId - 灵宠ID
     * @param {Function} onComplete - 完成回调
     */
    showAwakening(petId, onComplete) {
        this.hide();
        this.isPlaying = true;

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.container = this.scene.add.container(0, 0).setDepth(this.config.cgDepth);
        this.scene.children.bringToTop(this.container);

        // 背景：暖黄色光晕
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2a2010, 0.8);
        bg.fillRect(0, 0, width, height);
        bg.setAlpha(0);
        this.container.add(bg);

        // 光效：绿色粒子爆发
        // 创建粒子纹理（如果不存在）
        if (!this.scene.textures.exists('particle_green')) {
            const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xa8e860);
            g.fillCircle(4, 4, 4);
            g.generateTexture('particle_green', 8, 8);
        }
        
        const particles = this.scene.add.particles(width / 2, height / 2, 'particle_green', {
            life: 800,
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            quantity: 2,
            frequency: 50,
            alpha: { start: 1, end: 0 }
        });
        this.container.add(particles);

        // 文字：缔结灵契
        const text = this.scene.add.text(width / 2, height / 2 + 100, '—— 缔结灵契 ——', {
            fontSize: '30px',
            color: '#a8e860',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif',
            alpha: 0
        })
            .setOrigin(0.5);
        this.container.add(text);

        // 动画序列
        // 1. 淡入背景
        this.scene.tweens.add({
            targets: bg,
            alpha: 1,
            duration: 500,
            onComplete: () => {
                // 2. 显示文字
                this.scene.tweens.add({
                    targets: text,
                    alpha: 1,
                    duration: 800,
                    onComplete: () => {
                        // 3. 等待后淡出
                        this.scene.time.delayedCall(1500, () => {
                            this.scene.tweens.add({
                                targets: this.container,
                                alpha: 0,
                                duration: 800,
                                onComplete: () => {
                                    this.hide();
                                    if (onComplete) onComplete();
                                }
                            });
                        });
                    }
                });
            }
        });
    }

    /**
     * 显示标题卡（序章结束用）
     * @param {string} text - 标题文字
     * @param {Object} config - 配置
     * @param {Function} config.onComplete - 完成回调
     */
    showTitleCard(text, config = {}) {
        this.hide();
        this.isPlaying = true;

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.container = this.scene.add.container(0, 0).setDepth(this.config.cgDepth);
        this.scene.children.bringToTop(this.container);

        // 文字（逐字显示）
        const titleText = this.scene.add.text(width / 2, height / 2, '', {
            fontSize: config.fontSize || '38px',
            color: config.textColor || '#f0e8d4',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif',
            align: 'center',
            lineSpacing: 10
        })
            .setOrigin(0.5)
            .setAlpha(0);
        this.container.add(titleText);

        // 逐字显示
        let charIndex = 0;
        const typeTimer = this.scene.time.addEvent({
            delay: 150,
            callback: () => {
                if (charIndex < text.length) {
                    titleText.setText(text.substring(0, charIndex + 1));
                    charIndex++;
                } else {
                    typeTimer.remove();
                    // 等待后淡出
                    this.scene.time.delayedCall(config.duration || 2000, () => {
                        this.scene.tweens.add({
                            targets: titleText,
                            alpha: 0,
                            duration: 1000,
                            onComplete: () => {
                                this.hide();
                                if (config.onComplete) config.onComplete();
                            }
                        });
                    });
                }
            },
            loop: true
        });

        // 淡入
        this.scene.tweens.add({
            targets: titleText,
            alpha: 1,
            duration: 500
        });
    }

    /**
     * 水墨晕染淡出效果（序章结束用）
     * @param {Function} onComplete - 完成回调
     */
    inkFadeOut(onComplete) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        const ink = this.scene.add.graphics().setDepth(this.config.cgDepth + 10);

        // 从四角扩散的黑色
        const corners = [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: 0, y: height },
            { x: width, y: height }
        ];

        // 简化：直接淡出到黑色
        const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
            .setDepth(this.config.cgDepth + 10);

        this.scene.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 600,
            onComplete: () => {
                if (onComplete) onComplete();
            }
        });
    }

    /**
     * 隐藏CG
     * @param {Function} onComplete - 完成回调
     */
    hide(onComplete) {
        if (!this.container) {
            if (onComplete) onComplete();
            return;
        }

        // 防止重复调用
        if (this._hiding) {
            if (onComplete) onComplete();
            return;
        }
        this._hiding = true;

        this.isPlaying = false;

        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: this.config.fadeOutDuration,
            ease: 'Power2',
            onComplete: () => {
                if (this.container && !this.container.destroyed) {
                    this.container.destroy();
                }
                this.container = null;
                this.cgImage = null;
                this._hiding = false;
                if (onComplete) onComplete();
            }
        });
    }

    /**
     * 销毁系统
     */
    destroy() {
        this.hide();
    }
}

// 导出
window.CGDisplaySystem = CGDisplaySystem;
