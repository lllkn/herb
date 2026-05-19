/**
 * BootScene.js - 启动场景
 * 负责加载基础资源，然后启动序章剧情
 */

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log('BootScene: 启动场景 - 加载基础资源');

        // 显示加载进度
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 加载进度文本
        const progressText = this.add.text(width / 2, height / 2, '正在加载游戏资源...', {
            fontSize: '18px',
            color: '#8b7355',
            fontFamily: '"Ma Shan Zheng", serif'
        }).setOrigin(0.5).setDepth(10);

        // 加载进度条
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x8b7355, 0.3);
        progressBox.fillRoundedRect(width / 2 - 160, height / 2 + 30, 320, 20, 10);

        // 监听加载进度
        this.load.on('progress', (value) => {
            progressText.setText(`正在加载游戏资源... ${Math.floor(value * 100)}%`);
            progressBar.clear();
            progressBar.fillStyle(0x8b7355, 1);
            progressBar.fillRoundedRect(width / 2 - 158, height / 2 + 32, 316 * value, 16, 8);
        });

        this.load.on('complete', () => {
            console.log('BootScene: 基础资源加载完成');
            progressText.destroy();
            progressBar.destroy();
            progressBox.destroy();
        });

        // 加载序章剧情数据
        this.load.json('prologue_data', 'src/data/story_prologue.json');
    }

    create() {
        console.log('BootScene: 每次启动都显示新手引导剧情');

        // 检查剧情数据是否加载成功
        const prologueData = this.cache.json.get('prologue_data');
        if (prologueData && prologueData.scenes) {
            console.log('BootScene: 序章剧情数据加载成功，共', prologueData.scenes.length, '个场景');
        } else {
            console.warn('BootScene: 序章剧情数据加载失败，将使用内嵌数据');
        }

        // 每次都跳转到引导场景
        this.scene.start('IntroScene');
    }
}

// ✅ 大写 B
window.BootScene = BootScene;
