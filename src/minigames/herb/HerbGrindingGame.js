(function () {
    class HerbGrindingGame extends window.HerbCanvasGame {
        reset() {
            this.progressValue = 0;
            this.quality = 45;
            this.totalDist = 0;
            this.dragging = false;
            this.successTimer = 0;
            this.herbs = [];
            for (let i = 0; i < 18; i++) {
                this.herbs.push({ a: Math.random() * Math.PI * 2, r: Math.random() * 42, s: 4 + Math.random() * 8 });
            }
        }

        draw() {
            this.clear();
            this.title('研磨药粉', '在药钵内按住鼠标画圆，保持匀速研磨');
            this._drawMortar();
            this._drawHud();
            this.drawParticles();
            if (this.progressValue >= 1) {
                this._drawComplete();
                this.successTimer++;
                if (this.successTimer === 70) this.finish(true, { score: this.quality, quality: this._qualityName() });
            }
        }

        _drawMortar() {
            const ctx = this.ctx;
            const cx = this.width / 2, cy = this.height / 2 + 10, r = 92;
            ctx.fillStyle = 'rgba(80,50,20,.22)';
            ctx.fillRect(0, this.height * .45, this.width, this.height * .55);
            ctx.fillStyle = 'rgba(0,0,0,.32)';
            ctx.beginPath();
            ctx.ellipse(cx, cy + r * .6, r * .9, r * .22, 0, 0, Math.PI * 2);
            ctx.fill();
            const mg = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, r * 1.1);
            mg.addColorStop(0, '#a09888');
            mg.addColorStop(.65, this.palette.stone);
            mg.addColorStop(1, '#605850');
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r * .55, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,.25)';
            ctx.lineWidth = 2;
            ctx.stroke();

            const innerR = r * .72, innerDepth = r * .3;
            ctx.fillStyle = 'rgba(30,22,14,.85)';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 8, innerR, innerDepth, 0, 0, Math.PI * 2);
            ctx.fill();
            const herbCol = `hsl(90, ${60 - this.progressValue * 35}%, ${32 + this.progressValue * 18}%)`;
            this.herbs.forEach(h => {
                ctx.save();
                ctx.globalAlpha = 1 - this.progressValue * .55;
                ctx.fillStyle = herbCol;
                ctx.beginPath();
                ctx.ellipse(cx + Math.cos(h.a) * h.r, cy - 8 + Math.sin(h.a) * h.r * .45, h.s * (1 - this.progressValue * .7), h.s * .4, h.a, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            if (this.progressValue > .1) {
                ctx.save();
                ctx.globalAlpha = this.progressValue * .65;
                ctx.fillStyle = 'rgba(220,210,180,.55)';
                ctx.beginPath();
                ctx.ellipse(cx, cy - 8, innerR * .95, innerDepth * .9, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            const inMortar = this.dist(this.mouse.x, this.mouse.y, cx, cy) < innerR;
            const px = inMortar ? this.mouse.x : cx;
            const py = inMortar ? this.mouse.y : cy;
            ctx.strokeStyle = 'rgba(60,48,34,.9)';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(px, py - 60);
            ctx.lineTo(px, py - 20);
            ctx.stroke();
            ctx.strokeStyle = this.dragging && inMortar ? this.palette.goldLight : 'rgba(90,75,55,.95)';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(px, py - 58);
            ctx.lineTo(px, py - 22);
            ctx.stroke();
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.ellipse(px, py - 10, 14, 9, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        _drawHud() {
            const qualityColor = this.quality > 75 ? this.palette.greenLight : this.quality > 45 ? this.palette.gold : '#e07030';
            this.progress(this.width / 2 - 200, this.height - 55, 400, 22, this.progressValue, `研磨进度 ${Math.floor(this.progressValue * 100)}%  品质：${this._qualityName()}`, qualityColor);
            this.ctx.fillStyle = this.palette.muted;
            this.ctx.font = '11px "Microsoft YaHei", sans-serif';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`品质 ${Math.round(this.quality)}`, this.width - 22, this.height - 34);
        }

        _drawComplete() {
            const ctx = this.ctx;
            ctx.fillStyle = 'rgba(8,16,5,.86)';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.fillStyle = 'rgba(220,210,180,.9)';
            ctx.beginPath();
            ctx.ellipse(this.width / 2, this.height / 2 - 12, 72, 22, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.palette.greenLight;
            ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('药粉制成', this.width / 2, this.height / 2 + 52);
            ctx.fillStyle = this.palette.muted;
            ctx.font = '13px "Microsoft YaHei", sans-serif';
            ctx.fillText(`品质评定：${this._qualityName()} · ${Math.round(this.quality)}分`, this.width / 2, this.height / 2 + 80);
        }

        _qualityName() {
            if (this.quality > 75) return '优良';
            if (this.quality > 45) return '合格';
            return '粗糙';
        }

        onDown() {
            this.dragging = true;
        }

        onMove() {
            if (!this.dragging || this.progressValue >= 1) return;
            const cx = this.width / 2, cy = this.height / 2 + 10, innerR = 92 * .72;
            if (this.dist(this.mouse.x, this.mouse.y, cx, cy) >= innerR) return;
            const step = this.dist(this.mouse.x, this.mouse.y, this.mouse.lastX, this.mouse.lastY);
            this.totalDist += step;
            this.progressValue = Math.min(1, this.totalDist / 3900);
            if (step > 1 && step < 12) this.quality = Math.min(100, this.quality + .08);
            if (step > 15) this.quality = Math.max(0, this.quality - .16);
            if (Math.floor(this.totalDist) % 80 < step) this.burst(this.mouse.x, this.mouse.y, this.palette.goldLight, 3);
        }

        onUp() {
            this.dragging = false;
        }
    }

    window.HerbGrindingGame = HerbGrindingGame;
})();
