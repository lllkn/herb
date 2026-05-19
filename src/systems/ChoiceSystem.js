/**
 * ChoiceSystem.js
 * 选择分支系统
 * 支持显示选项、选择回调、影响 gameState.playerTrait
 */

class ChoiceSystem {
    /**
     * @param {Phaser.Scene} scene - 所属场景
     * @param {Object} config - 配置项
     * @param {number} config.x - 选项列表X坐标（默认居中）
     * @param {number} config.y - 选项列表起始Y坐标（默认居中）
     * @param {number} config.spacing - 选项间距（默认50）
     * @param {Function} config.onChoiceSelected - 选择回调 (option, index) => {}
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = {
            x: config.x || (scene.cameras.main.width / 2),
            y: config.y || (scene.cameras.main.height / 2 - 100),
            spacing: config.spacing || 50,
            onChoiceSelected: config.onChoiceSelected || null
        };

        // UI 容器
        this.container = null;
        this.optionTexts = [];
        this.selectedIndex = -1;
        this.isActive = false;

        // 样式配置
        this.style = {
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif',
            fontSize: '26px',
            color: '#e8d8b8',
            selectedColor: '#ffcc00',
            backgroundColor: '#00000088',
            padding: { x: 20, y: 12 },
            align: 'center'
        };
    }

    /**
     * 显示选项列表
     * @param {Array} options - 选项数组 [{ text, next, flag }]
     * @param {Object} displayConfig - 显示配置
     * @param {boolean} displayConfig.centerVertical - 是否垂直居中
     */
    show(options, displayConfig = {}) {
        if (!options || options.length === 0) {
            console.warn('ChoiceSystem: 没有选项可显示');
            return;
        }

        this.hide(); // 先隐藏之前的选项

        this.isActive = true;
        this.selectedIndex = -1;
        this.optionTexts = [];
        this.options = options; // 保存选项供 _selectOption 使用

        // 创建容器
        this.container = this.scene.add.container(0, 0).setDepth(100);
        this.scene.children.bringToTop(this.container);

        // 计算起始位置
        let startY = this.config.y;
        if (displayConfig.centerVertical) {
            const totalHeight = options.length * this.config.spacing;
            startY = (this.scene.cameras.main.height - totalHeight) / 2;
        }

        // 创建选项
        options.forEach((option, index) => {
            const y = startY + index * this.config.spacing;

            // 选项背景（不可见，用于交互）
            const hitArea = this.scene.add.rectangle(
                this.config.x, y,
                400, 44,
                0x000000, 0
            )
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this._selectOption(index))
                .on('pointerover', () => this._onOptionHover(index, true))
                .on('pointerout', () => this._onOptionHover(index, false));

            // 选项文本
            const text = this.scene.add.text(this.config.x, y, option.text, {
                fontFamily: this.style.fontFamily,
                fontSize: this.style.fontSize,
                color: this.style.color,
                backgroundColor: this.style.backgroundColor,
                padding: this.style.padding,
                align: this.style.align,
                lineSpacing: 4
            })
                .setOrigin(0.5)
                .setDepth(1);

            // 前缀符号
            const prefix = this.scene.add.text(
                this.config.x - (text.width / 2) - 25, y,
                '▷', {
                    fontSize: '22px',
                    color: '#8b7355'
                }
            )
                .setOrigin(0.5, 0.5)
                .setDepth(1);

            this.container.add([hitArea, text, prefix]);
            this.optionTexts.push({ text, prefix, hitArea });
        });

        // 添加提示文字
        const hint = this.scene.add.text(
            this.config.x, startY + options.length * this.config.spacing + 40,
            '点击选择，或按数字键 1-' + Math.min(options.length, 9),
            {
                fontSize: '16px',
                color: '#8b7355',
                align: 'center',
                fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif'
            }
        )
            .setOrigin(0.5)
            .setDepth(1);
        this.container.add(hint);
        this.hintText = hint;

        // 键盘选择支持
        this._setupKeyboard(options.length);
    }

    /**
     * 设置键盘选择
     * @param {number} optionCount - 选项数量
     */
    _setupKeyboard(optionCount) {
        this.keyboardListeners = [];

        for (let i = 0; i < Math.min(optionCount, 9); i++) {
            const key = (i + 1).toString();
            const listener = this.scene.input.keyboard.on('keydown-' + key, () => {
                if (this.isActive) {
                    this._selectOption(i);
                }
            });
            this.keyboardListeners.push(listener);
        }
    }

    /**
     * 选项悬停效果
     * @param {number} index - 选项索引
     * @param {boolean} isHover - 是否悬停
     */
    _onOptionHover(index, isHover) {
        if (!this.optionTexts[index]) return;

        if (isHover) {
            this.optionTexts[index].text.setScale(1.05);
            this.optionTexts[index].text.setColor('#ffffff');
        } else if (this.selectedIndex !== index) {
            this.optionTexts[index].text.setScale(1.0);
            this.optionTexts[index].text.setColor(this.style.color);
        }
    }

    /**
     * 选择选项
     * @param {number} index - 选项索引
     */
    _selectOption(index) {
        if (!this.isActive) return;

        this.isActive = false;
        this.selectedIndex = index;

        // 更新选项样式
        this.optionTexts.forEach((opt, i) => {
            if (i === index) {
                opt.text.setColor(this.style.selectedColor);
                opt.prefix.setText('▶');
                opt.prefix.setColor('#a8e860');
            } else {
                opt.text.setColor('#555555');
                opt.prefix.setText('');
            }
        });

        // 短暂延迟后回调
        const option = this.options[index];

        this.scene.time.delayedCall(300, () => {
            // 保存标记到 gameState
            if (option.flag) {
                if (!window.gameState) window.gameState = {};
                window.gameState.playerTrait = option.flag;
                console.log('ChoiceSystem: 设置 playerTrait =', option.flag);
            }

            // 回调
            if (this.config.onChoiceSelected) {
                this.config.onChoiceSelected(option, index);
            }

            // 隐藏选项
            this.hide();
        });
    }

    /**
     * 隐藏选项列表
     */
    hide() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }

        this.optionTexts = [];
        this.hintText = null;
        this.isActive = false;

        // 移除键盘监听
        if (this.keyboardListeners) {
            this.keyboardListeners.forEach(listener => {
                if (listener && listener.remove) listener.remove();
            });
            this.keyboardListeners = [];
        }
    }

    /**
     * 销毁系统
     */
    destroy() {
        this.hide();
    }
}

// 导出
window.ChoiceSystem = ChoiceSystem;
