// 百草行 - 玩家Sprite生成器（Canvas绘制，无需外部图片）
// 生成四方向行走动画帧

class PlayerSpriteGenerator {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * 生成玩家Sprite Sheet
     * 布局：4行×4列（4个方向，每个方向4帧）
     * 方向顺序：下、左、右、上
     */
    generatePlayerSpriteSheet() {
        const frameWidth = 32;
        const frameHeight = 32;
        const cols = 4;
        const rows = 4;
        const width = frameWidth * cols;
        const height = frameHeight * rows;

        // 创建Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 生成每一帧
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * frameWidth;
                const y = row * frameHeight;
                
                this.drawPlayerFrame(ctx, x, y, frameWidth, frameHeight, row, col);
            }
        }

        // 转换为Phaser Texture
        const textureKey = 'player';
        const image = new Image();
        image.src = canvas.toDataURL();
        
        image.onload = () => {
            if (this.scene.textures.exists(textureKey)) {
                this.scene.textures.remove(textureKey);
            }
            this.scene.textures.addImage(textureKey, image);
            console.log('✅ 玩家Sprite Sheet生成成功');
        };

        return textureKey;
    }

    /**
     * 绘制单帧玩家
     */
    drawPlayerFrame(ctx, x, y, width, height, direction, frame) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // 根据方向和帧数调整姿势
        const sway = Math.sin(frame * Math.PI / 2) * 2; // 行走摇摆

        // 清空背景（透明）
        ctx.clearRect(x, y, width, height);

        // 绘制阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(centerX, y + height - 4, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 根据方向绘制玩家
        ctx.save();
        ctx.translate(centerX, centerY - 4);

        // 身体颜色（青色汉服）
        const bodyColor = '#3A6B45';
        const skinColor = '#F2EAD3';
        const hairColor = '#1A1209';

        switch (direction) {
            case 0: // 向下
                this.drawPlayerDown(ctx, bodyColor, skinColor, hairColor, sway, frame);
                break;
            case 1: // 向左
                this.drawPlayerLeft(ctx, bodyColor, skinColor, hairColor, sway, frame);
                break;
            case 2: // 向右
                this.drawPlayerRight(ctx, bodyColor, skinColor, hairColor, sway, frame);
                break;
            case 3: // 向上
                this.drawPlayerUp(ctx, bodyColor, skinColor, hairColor, sway, frame);
                break;
        }

        ctx.restore();
    }

    drawPlayerDown(ctx, bodyColor, skinColor, hairColor, sway, frame) {
        // 头
        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(0, -12, 6, 0, Math.PI * 2);
        ctx.fill();

        // 脸
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, -10, 5, 0, Math.PI * 2);
        ctx.fill();

        // 身体（汉服）
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-8, -6, 16, 12);

        // 衣袖（行走动画）
        const sleeveOffset = sway;
        ctx.fillRect(-10 + sleeveOffset, -6, 4, 10);
        ctx.fillRect(6 - sleeveOffset, -6, 4, 10);

        // 腿（行走动画）
        const legOffset = frame % 2 === 0 ? -2 : 2;
        ctx.fillStyle = '#2E6B45';
        ctx.fillRect(-4, 6, 3, 6);
        ctx.fillRect(1 + legOffset, 6, 3, 6);
    }

    drawPlayerLeft(ctx, bodyColor, skinColor, hairColor, sway, frame) {
        // 左侧视角（简化）
        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(-4, -12, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(-4, -10, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = bodyColor;
        ctx.fillRect(-12, -6, 12, 12);

        const legOffset = frame % 2 === 0 ? -2 : 2;
        ctx.fillStyle = '#2E6B45';
        ctx.fillRect(-10, 6, 3, 6);
        ctx.fillRect(-6 + legOffset, 6, 3, 6);
    }

    drawPlayerRight(ctx, bodyColor, skinColor, hairColor, sway, frame) {
        // 右侧视角（简化）
        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(4, -12, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(4, -10, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = bodyColor;
        ctx.fillRect(0, -6, 12, 12);

        const legOffset = frame % 2 === 0 ? 2 : -2;
        ctx.fillStyle = '#2E6B45';
        ctx.fillRect(7, 6, 3, 6);
        ctx.fillRect(3 + legOffset, 6, 3, 6);
    }

    drawPlayerUp(ctx, bodyColor, skinColor, hairColor, sway, frame) {
        // 背面视角
        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(0, -12, 6, 0, Math.PI * 2);
        ctx.fill();

        // 身体背面（汉服）
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-8, -6, 16, 12);

        // 发髻
        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(0, -14, 4, 0, Math.PI * 2);
        ctx.fill();

        // 腿（行走动画）
        const legOffset = frame % 2 === 0 ? -2 : 2;
        ctx.fillStyle = '#2E6B45';
        ctx.fillRect(-4, 6, 3, 6);
        ctx.fillRect(1 + legOffset, 6, 3, 6);
    }

    /**
     * 生成简单地图Tile（用于测试）
     */
    generateTestTiles() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // 草地Tile
        ctx.fillStyle = '#3A6B45';
        ctx.fillRect(0, 0, 32, 32);

        // 草地纹理
        ctx.fillStyle = '#2E6B45';
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 28;
            const y = Math.random() * 28;
            ctx.fillRect(x, y, 2, 4);
        }

        const image = new Image();
        image.src = canvas.toDataURL();
        
        image.onload = () => {
            if (this.scene.textures.exists('tile_grass')) {
                this.scene.textures.remove('tile_grass');
            }
            this.scene.textures.addImage('tile_grass', image);
        };

        // 障碍物Tile（石头/树木）
        const canvas2 = document.createElement('canvas');
        canvas2.width = 32;
        canvas2.height = 32;
        const ctx2 = canvas2.getContext('2d');

        // 石头
        ctx2.fillStyle = '#666666';
        ctx2.beginPath();
        ctx2.arc(16, 16, 14, 0, Math.PI * 2);
        ctx2.fill();

        ctx2.fillStyle = '#777777';
        ctx2.beginPath();
        ctx2.arc(12, 12, 4, 0, Math.PI * 2);
        ctx2.fill();

        const image2 = new Image();
        image2.src = canvas2.toDataURL();
        
        image2.onload = () => {
            if (this.scene.textures.exists('tile_rock')) {
                this.scene.textures.remove('tile_rock');
            }
            this.scene.textures.addImage('tile_rock', image2);
        };

        console.log('✅ 测试Tiles生成成功');
    }
}

// 导出到全局
window.PlayerSpriteGenerator = PlayerSpriteGenerator;
