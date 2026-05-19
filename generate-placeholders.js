/**
 * 生成占位图片 - 用纯色矩形 PNG 替代
 * 运行: node generate-placeholders.js
 */

const fs = require('fs');
const path = require('path');

// 最小的有效 1x1 PNG（灰色）- Base64 解码
const minimalPNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);

// 生成简单的 PNG（使用预计算的 PNG 二进制数据）
function createSimplePNG(width, height, r, g, b) {
    // PNG 文件结构：
    // 1. PNG Signature (8 bytes)
    // 2. IHDR chunk
    // 3. IDAT chunk (图片数据)
    // 4. IEND chunk
    
    // 为简化，我们创建一个最小的 PNG，然后用 Canvas 调整大小
    // 但实际上，浏览器会缩放 1x1 的图片
    
    // 更好的方案：创建一个真正大小的 PNG
    // 这需要 zlib 压缩，太复杂了
    
    // 最简单的方案：返回 1x1 PNG，让浏览器缩放
    return minimalPNG;
}

// 图片定义
const images = [
    // CG图片 (800x600)
    { path: 'src/assets/pictures/prologue/cg_01_school.png', color: [74, 124, 89] },
    { path: 'src/assets/pictures/prologue/cg_02_spirit_room.png', color: [139, 92, 246] },
    { path: 'src/assets/pictures/prologue/cg_03_awakening.png', color: [245, 158, 11] },
    { path: 'src/assets/pictures/prologue/cg_04_departure.png', color: [59, 130, 246] },
    
    // 背景图片
    { path: 'src/assets/pictures/backgrounds/bg_school_yard.png', color: [107, 142, 35] },
    { path: 'src/assets/pictures/backgrounds/bg_herb_garden.png', color: [34, 139, 34] },
    { path: 'src/assets/pictures/backgrounds/bg_spirit_room.png', color: [147, 112, 219] },
    { path: 'src/assets/pictures/backgrounds/bg_school_gate.png', color: [139, 69, 19] },
    { path: 'src/assets/pictures/backgrounds/bg_dean_room.png', color: [101, 67, 33] },
    { path: 'src/assets/pictures/backgrounds/bg_processing_room.png', color: [160, 82, 45] },
    
    // 白院长立绘
    { path: 'src/assets/pictures/characters/bai_smile.png', color: [65, 105, 225] },
    { path: 'src/assets/pictures/characters/bai_thoughtful.png', color: [65, 105, 225] },
    { path: 'src/assets/pictures/characters/bai_serious.png', color: [65, 105, 225] },
    
    // 小兰立绘
    { path: 'src/assets/pictures/characters/xiaolan_anxious.png', color: [255, 99, 71] },
    { path: 'src/assets/pictures/characters/xiaolan_grateful.png', color: [255, 99, 71] },
    
    // 青苗立绘
    { path: 'src/assets/pictures/characters/qingmiao_surprised.png', color: [50, 205, 50] },
    { path: 'src/assets/pictures/characters/qingmiao_happy.png', color: [50, 205, 50] },
    
    // 灵宠图片
    { path: 'src/assets/pictures/characters/pet_qingmiao.png', color: [144, 238, 144] },
    { path: 'src/assets/pictures/characters/pet_chiyun.png', color: [255, 107, 107] },
    { path: 'src/assets/pictures/characters/pet_yinxue.png', color: [192, 192, 192] }
];

// 创建目录并写入文件
let created = 0;
let skipped = 0;

images.forEach(img => {
    const fullPath = path.join(__dirname, img.path);
    const dir = path.dirname(fullPath);
    
    // 创建目录
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 创建目录: ${path.relative(__dirname, dir)}`);
    }
    
    // 检查文件是否存在
    if (fs.existsSync(fullPath)) {
        console.log(`⏭️  跳过: ${img.path} (已存在)`);
        skipped++;
        return;
    }
    
    // 写入 1x1 PNG（浏览器会缩放）
    fs.writeFileSync(fullPath, minimalPNG);
    console.log(`✅ 创建: ${img.path}`);
    created++;
});

console.log(`\n完成! 创建 ${created} 个文件, 跳过 ${skipped} 个文件`);
console.log('提示: 这些是 1x1 像素的占位图, 浏览器会自动缩放');
console.log('建议: 用真实图片替换这些占位图以获得最佳效果');
