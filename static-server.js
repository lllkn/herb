// 百草行 - 静态文件服务器
// 解决 file:// 协议下的 CORS 问题
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT_DIR = __dirname; // 自动使用当前目录

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    // 解析 URL，去除查询参数
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(ROOT_DIR, urlPath === '/' ? '/index.html' : urlPath);

    // 安全检查：防止目录遍历
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`File Not Found: ${req.url}`);
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Internal Server Error');
            }
            return;
        }

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('');
    console.log('🎮 百草行游戏服务器已启动！');
    console.log('====================================');
    console.log(`📡 本地访问: http://localhost:${PORT}`);
    console.log(`📁 服务目录: ${ROOT_DIR}`);
    console.log('====================================');
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
    console.log('');
});

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n服务器已停止');
    process.exit(0);
});
