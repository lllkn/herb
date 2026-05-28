(function () {
    const DEFAULT_OPTIONS = {
        width: 800,
        height: 450,
        title: '本草技艺',
        subtitle: '',
        palette: {
            bg: '#08120a',
            bg2: '#13270e',
            panel: 'rgba(12, 22, 8, .92)',
            gold: '#c8a84b',
            goldLight: '#e8c870',
            paper: '#f0e6d3',
            muted: '#9a8060',
            green: '#4a8830',
            greenLight: '#6aaa3a',
            red: '#c84028',
            soil: '#5a3c20',
            soilDark: '#2a180c',
            root: '#c8a060',
            stone: '#888078'
        }
    };

    class HerbCanvasGame {
        constructor(options) {
            this.options = Object.assign({}, DEFAULT_OPTIONS, options || {});
            this.palette = Object.assign({}, DEFAULT_OPTIONS.palette, this.options.palette || {});
            this.width = this.options.width;
            this.height = this.options.height;
            this.mouse = { x: 0, y: 0, lastX: 0, lastY: 0, down: false };
            this.parts = [];
            this.done = false;
            this.cancelled = false;
            this._raf = 0;
            this._listeners = [];
        }

        mount(host) {
            this.host = host;
            this.root = document.createElement('div');
            this.root.className = 'herb-minigame-root';
            this.root.innerHTML = `
                <div class="herb-minigame-shell">
                    <canvas class="herb-minigame-canvas" width="${this.width}" height="${this.height}"></canvas>
                    <div class="herb-minigame-overlay">
                        <button class="herb-minigame-close" type="button">返回剧情</button>
                    </div>
                </div>
            `;
            host.appendChild(this.root);
            this.canvas = this.root.querySelector('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.overlay = this.root.querySelector('.herb-minigame-overlay');
            this.root.querySelector('.herb-minigame-close').addEventListener('click', () => this.finish(false, { cancelled: true }));

            this._bind(this.canvas, 'mousemove', (e) => this._setMouse(e, true));
            this._bind(this.canvas, 'mousedown', (e) => {
                this._setMouse(e, false);
                this.mouse.down = true;
                this.onDown();
            });
            this._bind(window, 'mouseup', () => {
                this.mouse.down = false;
                this.onUp();
            });
            this._bind(this.canvas, 'mouseleave', () => {
                this.mouse.down = false;
                this.onUp();
            });

            this.reset();
            this._loop();
        }

        _bind(target, event, handler) {
            target.addEventListener(event, handler);
            this._listeners.push(() => target.removeEventListener(event, handler));
        }

        _setMouse(e, moved) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.lastX = this.mouse.x;
            this.mouse.lastY = this.mouse.y;
            this.mouse.x = (e.clientX - rect.left) * (this.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.height / rect.height);
            if (moved) this.onMove();
        }

        _loop() {
            this.draw();
            this._raf = requestAnimationFrame(() => this._loop());
        }

        destroy() {
            cancelAnimationFrame(this._raf);
            this._listeners.forEach(fn => fn());
            this._listeners = [];
            if (this.root && this.root.parentNode) this.root.parentNode.removeChild(this.root);
        }

        finish(success, extra) {
            if (this.done) return;
            this.done = true;
            const result = Object.assign({
                id: this.options.id,
                success: !!success,
                timestamp: Date.now()
            }, extra || {});
            if (typeof this.options.onComplete === 'function') this.options.onComplete(result);
        }

        reset() {}
        draw() {}
        onDown() {}
        onMove() {}
        onUp() {}

        clear() {
            const g = this.ctx.createLinearGradient(0, 0, 0, this.height);
            g.addColorStop(0, this.palette.bg);
            g.addColorStop(1, this.palette.bg2);
            this.ctx.fillStyle = g;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        title(title, subtitle) {
            const ctx = this.ctx;
            ctx.textAlign = 'center';
            ctx.fillStyle = this.palette.gold;
            ctx.font = '12px "Microsoft YaHei", sans-serif';
            ctx.fillText(title || this.options.title, this.width / 2, 28);
            if (subtitle || this.options.subtitle) {
                ctx.fillStyle = this.palette.muted;
                ctx.font = '12px "Microsoft YaHei", sans-serif';
                ctx.fillText(subtitle || this.options.subtitle, this.width / 2, 50);
            }
        }

        roundRect(x, y, w, h, r) {
            const ctx = this.ctx;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, r || 8);
        }

        button(x, y, w, h, label, active) {
            const ctx = this.ctx;
            this.roundRect(x, y, w, h, 6);
            ctx.fillStyle = active ? 'rgba(40, 72, 24, .96)' : this.palette.panel;
            ctx.fill();
            ctx.strokeStyle = active ? this.palette.goldLight : 'rgba(200,168,75,.35)';
            ctx.lineWidth = active ? 2 : 1;
            ctx.stroke();
            ctx.fillStyle = this.palette.paper;
            ctx.font = '14px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y + h / 2 + 5);
        }

        progress(x, y, w, h, value, label, color) {
            const ctx = this.ctx;
            this.roundRect(x, y, w, h, 6);
            ctx.fillStyle = 'rgba(5, 10, 4, .8)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(200,168,75,.28)';
            ctx.stroke();
            const pct = Math.max(0, Math.min(1, value));
            if (pct > 0) {
                this.roundRect(x + 2, y + 2, (w - 4) * pct, h - 4, 4);
                ctx.fillStyle = color || this.palette.greenLight;
                ctx.fill();
            }
            ctx.fillStyle = this.palette.paper;
            ctx.font = '11px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y + h / 2 + 4);
        }

        burst(x, y, color, count) {
            for (let i = 0; i < (count || 20); i++) {
                this.parts.push({
                    x, y,
                    vx: (Math.random() - .5) * 6,
                    vy: -1 - Math.random() * 5,
                    r: 2 + Math.random() * 3,
                    color,
                    life: 35 + Math.random() * 20,
                    max: 55
                });
            }
        }

        drawParticles() {
            const ctx = this.ctx;
            this.parts = this.parts.filter(p => p.life > 0);
            this.parts.forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.life / p.max;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                p.x += p.vx;
                p.y += p.vy;
                p.vy += .2;
                p.life--;
            });
        }

        dist(x1, y1, x2, y2) {
            return Math.hypot(x2 - x1, y2 - y1);
        }
    }

    window.HerbCanvasGame = HerbCanvasGame;
})();
