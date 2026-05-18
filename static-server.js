// 百草行 - 静态文件服务器
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/js',
    '.json': 'application/json',
    '.css': 'text/css'
};

const server = http.createServer((req, res) => {
    let filePath = path.join('d:/Game for Tecent', req.url === '/' ? '/index.html' : req.url);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File Not Found');
            return;
        }
        
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'text/plain';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🎮 百草行游戏服务器已启动！');
    console.log('====================================');
    console.log('📡 本地访问: http://localhost:' + PORT);
    console.log('====================================');
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
    console.log('');
});
