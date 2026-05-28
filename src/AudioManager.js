/**
 * AudioManager.js - 背景音乐 & 音效管理
 * 
 * 职责：
 *  1. BGM 加载与播放（支持淡入淡出/交叉淡入淡出）
 *  2. 音量控制（响应设置面板的滑块变化）
 *  3. JSON bgm 字段到实际文件的映射
 * 
 * 使用方式：
 *   window.audioManager.playBGM('school');        // 播学堂 BGM
 *   window.audioManager.playBGM('plain');         // 播平原 BGM
 *   window.audioManager.crossfadeBGM('village');  // 交叉淡入到翠竹村 BGM
 *   window.audioManager.stopBGM();                // 停止 BGM
 *   window.audioManager.setBGMVolume(0.8);        // 设置 BGM 音量
 */

class AudioManager {
    constructor() {
        /** @type {Phaser.Scene|null} 持有 Phaser SoundManager 的场景引用 */
        this._scene = null;

        /** @type {Phaser.Sound.BaseSound|null} 当前播放的 BGM */
        this._currentBGM = null;

        /** @type {string|null} 当前播放的 BGM ID */
        this._currentBGMId = null;

        /** @type {number} BGM 音量 (0.0 - 1.0) */
        this._bgmVolume = 0.8;

        /** @type {number} SFX 音量 (0.0 - 1.0) */
        this._sfxVolume = 0.9;

        /** @type {boolean} 是否静音 */
        this._muted = false;

        /** @type {number} 淡入淡出默认时长 (ms) */
        this._fadeDuration = 1000;

        /** @type {boolean} 是否已初始化 */
        this._initialized = false;

        // ============================================================
        // BGM ID 映射表
        // JSON bgm 字段 → 内部 BGM ID
        // ============================================================
        this._bgmMapping = {
            // === 序章 ===
            'bgm_school.mp3':    'school',
            'bgm_spirit.mp3':    'school',
            'bgm_journey.mp3':   'plain',
            // === 第一章 ===
            'bgm_village.mp3':   'village',
            'bgm_valley.mp3':    'valley',
            'bgm_valley_dark.mp3': 'valley',
            'bgm_victory.mp3':   'valley',
            // === 地图别名 ===
            'school':  'school',
            'plain':   'plain',
            'village': 'village',
            'valley':  'valley',
            'side':    'side',
        };

        // ============================================================
        // BGM ID → 音频文件 key（在 Phaser loader 中的 key）
        // ============================================================
        this._bgmFileKeys = {
            'school':  'bgm_school',
            'plain':   'bgm_plain',
            'village': 'bgm_village',
            'valley':  'bgm_valley',
            'side':    'bgm_side',
        };

        console.log('[AudioManager] 实例已创建（等待 attachScene）');
    }

    // ============================================================
    // 初始化
    // ============================================================

    /**
     * 绑定 Phaser 场景（仅在 IntroScene 或 GameScene 启动后调用一次）
     * @param {Phaser.Scene} scene - 活跃的 Phaser 场景
     */
    attachScene(scene) {
        if (this._initialized) {
            console.log('[AudioManager] 已初始化，复用现有绑定');
            this._scene = scene;
            return;
        }
        this._scene = scene;
        this._initialized = true;
        console.log('[AudioManager] 已绑定 Phaser 场景');
    }

    // ============================================================
    // BGM 加载（供 BootScene preload 调用）
    // ============================================================

    /**
     * 在 BootScene.preload() 中预加载所有 BGM 文件
     * @param {Phaser.Scene} bootScene - BootScene 实例
     */
    static preloadBGM(bootScene) {
        console.log('[AudioManager] 预加载 BGM 文件...');
        bootScene.load.audio('bgm_school',  'src/assets/bgm/学堂.mp3');
        bootScene.load.audio('bgm_plain',   'src/assets/bgm/平原.mp3');
        bootScene.load.audio('bgm_village', 'src/assets/bgm/翠竹村.mp3');
        bootScene.load.audio('bgm_valley',  'src/assets/bgm/溪流山谷.mp3');
        bootScene.load.audio('bgm_side',    'src/assets/bgm/支线.mp3');
    }

    // ============================================================
    // BGM 播放
    // ============================================================

    /**
     * 解析 JSON bgm 字段 → 内部 BGM ID
     * @param {string} bgmKey - JSON 中的 bgm 字段值（如 "bgm_school.mp3"）
     * @returns {string|null} 内部 BGM ID（如 'school'）
     */
    _resolveBGMId(bgmKey) {
        if (!bgmKey) return null;
        // 先查映射表
        if (this._bgmMapping[bgmKey]) {
            return this._bgmMapping[bgmKey];
        }
        // 直接匹配（已经是内部 ID）
        if (this._bgmFileKeys[bgmKey]) {
            return bgmKey;
        }
        console.warn('[AudioManager] 未知的 BGM key:', bgmKey);
        return null;
    }

    /**
     * 播放 BGM（带淡入效果）
     * @param {string} bgmKey - JSON bgm 字段值或内部 ID（如 'school', 'plain', 'bgm_school.mp3'）
     * @param {Object} [options] - 配置选项
     * @param {number} [options.fadeDuration] - 淡入时长 (ms)，默认 1000
     * @param {number} [options.volume] - 音量 (0-1)，默认使用全局设置
     * @param {boolean} [options.loop] - 是否循环，默认 true
     */
    playBGM(bgmKey, options = {}) {
        const id = this._resolveBGMId(bgmKey);
        if (!id) {
            console.warn('[AudioManager] 无法解析 BGM key:', bgmKey);
            return;
        }

        const fileKey = this._bgmFileKeys[id];
        if (!fileKey) {
            console.warn('[AudioManager] BGM file key 未找到:', id);
            return;
        }

        // 如果已经在播同一个 BGM，不重复播放
        if (this._currentBGMId === id && this._currentBGM && this._currentBGM.isPlaying) {
            console.log('[AudioManager] BGM 已在播放，跳过:', id);
            return;
        }

        // 停止当前 BGM
        if (this._currentBGM) {
            this._currentBGM.stop();
            this._currentBGM.destroy();
            this._currentBGM = null;
        }

        // 确保有活跃的场景
        if (!this._scene || !this._scene.sound) {
            console.warn('[AudioManager] 没有可用的 Phaser SoundManager');
            return;
        }

        // 检查音频文件是否已加载
        if (!this._scene.cache.audio.exists(fileKey)) {
            console.warn('[AudioManager] BGM 音频未载入缓存:', fileKey);
            console.log('[AudioManager] 缓存中的音频 key 列表:', this._scene.cache.audio.getKeys());
            return;
        }

        // ★ 处理 Phaser Sound Lock（浏览器自动播放策略）
        const doPlay = () => {
            try {
                const fadeDuration = options.fadeDuration || this._fadeDuration;
                const volume = (options.volume !== undefined ? options.volume : this._bgmVolume) * (this._muted ? 0 : 1);
                const loop = options.loop !== undefined ? options.loop : true;

                this._currentBGM = this._scene.sound.add(fileKey, {
                    volume: 0,     // 从 0 开始淡入
                    loop: loop,
                });
                this._currentBGM.play();

                // 淡入效果
                if (this._scene.tweens) {
                    this._scene.tweens.add({
                        targets: this._currentBGM,
                        volume: volume,
                        duration: fadeDuration,
                        ease: 'Sine.easeIn',
                    });
                }

                this._currentBGMId = id;
                console.log('[AudioManager] ✅ BGM 开始播放:', id, '(file:', fileKey, ') volume:', volume);
            } catch (e) {
                console.error('[AudioManager] BGM 播放失败:', e.message);
            }
        };

        // ★ Phaser 3 的 SoundManager 可能被浏览器锁定
        if (this._scene.sound.locked) {
            console.warn('[AudioManager] ⚠️ Phaser SoundManager 已锁定，等待用户交互后自动播放...');
            this._scene.sound.once('unlocked', () => {
                console.log('[AudioManager] 🔓 Phaser SoundManager 已解锁，播放 BGM');
                doPlay();
            });
        } else {
            doPlay();
        }
    }

    /**
     * 交叉淡入淡出切换到新 BGM
     * @param {string} bgmKey - 目标 BGM ID
     * @param {Object} [options] - 同 playBGM
     */
    crossfadeBGM(bgmKey, options = {}) {
        const id = this._resolveBGMId(bgmKey);
        if (!id) return;

        // 如果已经在播同一个 BGM，不重复切换
        if (this._currentBGMId === id && this._currentBGM && this._currentBGM.isPlaying) {
            console.log('[AudioManager] BGM 已在播放，跳过 crossfade:', id);
            return;
        }

        // 如果没有场景引用，直接播放
        if (!this._scene || !this._scene.sound) {
            this.playBGM(bgmKey, options);
            return;
        }

        const fileKey = this._bgmFileKeys[id];
        if (!fileKey || !this._scene.cache.audio.exists(fileKey)) {
            // 文件未加载，仅停止当前
            if (this._currentBGM) {
                this._currentBGM.stop();
                this._currentBGM.destroy();
                this._currentBGM = null;
                this._currentBGMId = null;
            }
            return;
        }

        const fadeDuration = options.fadeDuration || this._fadeDuration;
        const targetVolume = (options.volume !== undefined ? options.volume : this._bgmVolume) * (this._muted ? 0 : 1);
        const loop = options.loop !== undefined ? options.loop : true;

        // 保存旧 BGM 引用
        const oldBGM = this._currentBGM;

        try {
            // 创建新 BGM
            const newBGM = this._scene.sound.add(fileKey, {
                volume: 0,
                loop: loop,
            });
            newBGM.play();

            // 新 BGM 淡入
            this._scene.tweens.add({
                targets: newBGM,
                volume: targetVolume,
                duration: fadeDuration,
                ease: 'Sine.easeIn',
            });

            // 旧 BGM 淡出并销毁
            if (oldBGM && oldBGM.isPlaying) {
                this._scene.tweens.add({
                    targets: oldBGM,
                    volume: 0,
                    duration: fadeDuration * 0.8,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        oldBGM.stop();
                        oldBGM.destroy();
                    },
                });
            }

            this._currentBGM = newBGM;
            this._currentBGMId = id;
            console.log('[AudioManager] BGM 交叉淡入淡出:', this._currentBGMId, '←', id);
        } catch (e) {
            console.error('[AudioManager] Crossfade 播放失败:', e.message);
            // 回退：恢复旧 BGM
            if (oldBGM && oldBGM.isPlaying) {
                this._currentBGM = oldBGM;
            }
        }
    }

    /**
     * 停止 BGM（带淡出效果）
     * @param {Object} [options] - 配置
     * @param {number} [options.fadeDuration] - 淡出时长 (ms)
     */
    stopBGM(options = {}) {
        if (!this._currentBGM) return;

        const fadeDuration = options.fadeDuration || this._fadeDuration * 0.6;
        const bgm = this._currentBGM;

        if (fadeDuration > 0 && bgm.isPlaying) {
            this._scene?.tweens?.add({
                targets: bgm,
                volume: 0,
                duration: fadeDuration,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    bgm.stop();
                    bgm.destroy();
                },
            });
        } else {
            bgm.stop();
            bgm.destroy();
        }

        this._currentBGM = null;
        this._currentBGMId = null;
        console.log('[AudioManager] BGM 已停止');
    }

    /**
     * 暂停 BGM
     */
    pauseBGM() {
        if (this._currentBGM && this._currentBGM.isPlaying) {
            this._currentBGM.pause();
            console.log('[AudioManager] BGM 已暂停');
        }
    }

    /**
     * 恢复 BGM
     */
    resumeBGM() {
        if (this._currentBGM && this._currentBGM.isPaused) {
            this._currentBGM.resume();
            console.log('[AudioManager] BGM 已恢复');
        }
    }

    // ============================================================
    // 音量控制
    // ============================================================

    /**
     * 设置 BGM 音量
     * @param {number} volume - 0.0 ~ 1.0
     */
    setBGMVolume(volume) {
        this._bgmVolume = Math.max(0, Math.min(1, volume));
        if (this._currentBGM && this._currentBGM.isPlaying && !this._muted) {
            this._currentBGM.setVolume(this._bgmVolume);
        }
        console.log('[AudioManager] BGM 音量:', Math.round(this._bgmVolume * 100) + '%');
    }

    /**
     * 设置 SFX 音量
     * @param {number} volume - 0.0 ~ 1.0
     */
    setSFXVolume(volume) {
        this._sfxVolume = Math.max(0, Math.min(1, volume));
        console.log('[AudioManager] SFX 音量:', Math.round(this._sfxVolume * 100) + '%');
    }

    /**
     * 静音/取消静音
     * @param {boolean} muted
     */
    setMuted(muted) {
        this._muted = muted;
        if (this._currentBGM && this._currentBGM.isPlaying) {
            this._currentBGM.setVolume(muted ? 0 : this._bgmVolume);
        }
        console.log('[AudioManager] 静音:', muted);
    }

    /**
     * 切换静音
     */
    toggleMute() {
        this.setMuted(!this._muted);
    }

    /**
     * 获取当前 BGM 状态（调试用）
     */
    getStatus() {
        return {
            currentBGM: this._currentBGMId,
            isPlaying: this._currentBGM ? this._currentBGM.isPlaying : false,
            bgmVolume: this._bgmVolume,
            sfxVolume: this._sfxVolume,
            muted: this._muted,
            initialized: this._initialized,
        };
    }
}

// ============================================================
// 导出全局实例
// ============================================================
window.AudioManager = AudioManager;
window.audioManager = new AudioManager();
console.log('[AudioManager] 全局实例已创建 window.audioManager');
