/**
 * TypewriterSystem.js
 * 打字机效果系统
 * 支持打字速度控制、立即完成、换行符处理、文字颜色渐变
 */

class TypewriterSystem {
    /**
     * @param {Phaser.Scene} scene - 所属场景
     * @param {Object} config - 配置项
     * @param {number} config.speed - 每字符毫秒数（默认50）
     * @param {Function} config.onComplete - 打字完成回调
     * @param {Function} config.onChar - 每打一个字符回调
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        this.speed = config.speed || 50;
        this.onComplete = config.onComplete || null;
        this.onChar = config.onChar || null;

        // 内部状态
        this.targetText = '';
        this.currentText = '';
        this.charIndex = 0;
        this.isTyping = false;
        this.isComplete = false;
        this.timer = null;

        // 颜色渐变支持
        this.colorGradient = null; // { start: 0xRRGGBB, end: 0xRRGGBB }

        // 显示目标（Phaser Text 对象）
        this.targetTextField = null;
    }

    /**
     * 启动打字机效果
     * @param {string} text - 目标文本
     * @param {Object} options - 选项
     * @param {Phaser.GameObjects.Text} options.targetField - 显示文本的对象
     * @param {number} options.speed - 覆盖默认速度
     * @param {Object} options.colorGradient - 颜色渐变 { start, end }
     * @param {boolean} options.instant - 是否立即显示全部
     */
    start(text, options = {}) {
        // 停止之前的打字
        this.stop();

        this.targetText = text || '';
        this.currentText = '';
        this.charIndex = 0;
        this.isTyping = true;
        this.isComplete = false;

        // 应用选项
        this.targetTextField = options.targetField || null;
        const speed = options.speed || this.speed;
        this.colorGradient = options.colorGradient || null;

        // 立即显示模式
        if (options.instant) {
            this.complete();
            return;
        }

        // 启动定时器
        this.timer = this.scene.time.addEvent({
            delay: speed,
            callback: this._onTick,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * 每帧回调（每个字符）
     */
    _onTick() {
        if (this.charIndex >= this.targetText.length) {
            // 打字完成
            this._finish();
            return;
        }

        // 获取下一个字符
        let char = this.targetText[this.charIndex];

        // 处理换行符
        if (char === '\n') {
            this.currentText += '\n';
        } else {
            this.currentText += char;
        }

        // 更新显示
        this._updateDisplay();

        // 字符回调
        if (this.onChar) {
            this.onChar(char, this.charIndex);
        }

        this.charIndex++;
    }

    /**
     * 更新显示文本
     */
    _updateDisplay() {
        if (!this.targetTextField) return;

        // 设置文本
        this.targetTextField.setText(this.currentText);

        // 颜色渐变
        if (this.colorGradient && this.targetText.length > 0) {
            const progress = this.charIndex / this.targetText.length;
            const color = this._interpolateColor(this.colorGradient.start, this.colorGradient.end, progress);
            this.targetTextField.setFill(color);
        }
    }

    /**
     * 颜色插值
     * @param {number} startColor - 起始颜色（0xRRGGBB）
     * @param {number} endColor - 结束颜色（0xRRGGBB）
     * @param {number} t - 插值比例 (0-1)
     * @returns {string} - 颜色字符串 (#RRGGBB)
     */
    _interpolateColor(startColor, endColor, t) {
        const r1 = (startColor >> 16) & 0xFF;
        const g1 = (startColor >> 8) & 0xFF;
        const b1 = startColor & 0xFF;

        const r2 = (endColor >> 16) & 0xFF;
        const g2 = (endColor >> 8) & 0xFF;
        const b2 = endColor & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    /**
     * 立即完成当前文本显示
     */
    complete() {
        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }

        this.currentText = this.targetText;
        this.charIndex = this.targetText.length;
        this._updateDisplay();
        this._finish();
    }

    /**
     * 打字完成
     */
    _finish() {
        this.isTyping = false;
        this.isComplete = true;

        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }

        // 完成回调
        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * 停止打字
     */
    stop() {
        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }

        this.isTyping = false;
        this.isComplete = false;
        this.currentText = '';
        this.charIndex = 0;
    }

    /**
     * 销毁系统
     */
    destroy() {
        this.stop();
        this.targetTextField = null;
        this.onComplete = null;
        this.onChar = null;
    }
}

// 导出
window.TypewriterSystem = TypewriterSystem;
