/**
 * convert-to-webp.js
 * 将 src/assets 下所有 PNG 转为 WebP（保留透明通道），转换成功后删除原 PNG。
 * 背景/CG 质量 82；带 alpha 的立绘同样质量，sharp 自动保留透明。
 * 用法：node scripts/convert-to-webp.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'src', 'assets');
const QUALITY = 82;

function walk(dir, out = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full, out);
        else if (/\.png$/i.test(name)) out.push(full);
    }
    return out;
}

(async () => {
    const files = walk(ROOT);
    console.log(`找到 ${files.length} 个 PNG，开始转换...`);
    let before = 0, after = 0, ok = 0, fail = 0;

    for (const png of files) {
        const webp = png.replace(/\.png$/i, '.webp');
        try {
            const srcSize = fs.statSync(png).size;
            await sharp(png).webp({ quality: QUALITY, effort: 5 }).toFile(webp);
            const dstSize = fs.statSync(webp).size;
            before += srcSize;
            after += dstSize;
            fs.unlinkSync(png); // 删除原 PNG
            ok++;
            console.log(`✓ ${path.relative(ROOT, png)}  ${(srcSize/1048576).toFixed(2)}MB → ${(dstSize/1048576).toFixed(2)}MB`);
        } catch (e) {
            fail++;
            console.error(`✗ 转换失败: ${png}`, e.message);
        }
    }

    console.log('\n===== 完成 =====');
    console.log(`成功 ${ok} / 失败 ${fail}`);
    console.log(`总体积: ${(before/1048576).toFixed(1)}MB → ${(after/1048576).toFixed(1)}MB (减少 ${(100*(1-after/before)).toFixed(1)}%)`);
})();
