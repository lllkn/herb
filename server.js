const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8888;
const ROOT = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.json': 'application/json',
    '.tmj': 'application/json'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    // Double decode to handle potential double-encoding
    let pathname = decodeURIComponent(parsedUrl.pathname);
    try {
        pathname = decodeURIComponent(pathname);
    } catch(e) {
        // Already decoded or invalid, keep as is
    }
    
    // Security: prevent directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.(\/|\|$))+/, '');
    let filePath = path.join(ROOT, safePath);
    
    // Default to index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    
    console.log('Request:', req.url, '->', pathname, '->', filePath);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log('Error:', err.code, filePath);
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found: ' + pathname);
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
    console.log(`Root directory: ${ROOT}`);
});
