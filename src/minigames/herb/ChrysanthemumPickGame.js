(function () {
    class ChrysanthemumPickGame extends window.HerbCanvasGame {
        reset() {
            this.timer = this.options.timer || 30;
            this.tick = 0;
            this.score = 0;
            this.combo = 0;
            this.pickedCount = 0;
            this.respawnDelay = this.options.respawnDelay || 50;
            this.flowers = [];
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 5; c++) {
                    const flower = {
                        c, r,
                        picked: false,
                        shake: 0,
                        flash: 0,
                        respawnAt: 0,
                        nextStage: 2
                    };
                    this._setStage(flower, this._randomStage(c + r < 3));
                    this.flowers.push(flower);
                }
            }
        }

        draw() {
            this.clear();
            this.title('菊花采摘', '点击盛开的菊花，避开花蕾与凋谢花');
            this._drawHud();
            this._updateRespawns();
            this._drawGrid();
            this.drawParticles();
            if (!this.done) {
                this.tick++;
                if (this.tick >= this.timer * 60) this._complete();
            }
        }

        _drawHud() {
            const left = Math.max(0, this.timer - this.tick / 60);
            const ctx = this.ctx;
            ctx.fillStyle = left < 8 ? this.palette.red : left < 15 ? '#e07828' : this.palette.greenLight;
            ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.ceil(left)}秒`, this.width - 28, 48);
            ctx.fillStyle = this.palette.paper;
            ctx.textAlign = 'left';
            ctx.fillText(`得分：${this.score}`, 28, 48);
            if (this.combo > 1) {
                ctx.fillStyle = this.palette.goldLight;
                ctx.font = '13px "Microsoft YaHei", sans-serif';
                ctx.fillText(`连采 x${this.combo}`, 28, 70);
            }
            this.progress(this.width / 2 - 150, this.height - 38, 300, 8, left / this.timer, '', left < 8 ? this.palette.red : this.palette.greenLight);
        }

        _randomStage(preferBloom) {
            if (preferBloom) return 2;
            const roll = Math.random();
            if (roll < .42) return 2;
            if (roll < .64) return 1;
            if (roll < .82) return 0;
            return 3;
        }

        _setStage(flower, stage) {
            flower.stage = Number(stage);
            flower.canPick = flower.stage === 2;
        }

        _updateRespawns() {
            if (this.done) return;

            let hasBloom = false;
            this.flowers.forEach(f => {
                if (!f.picked && f.canPick) hasBloom = true;
                if (!f.picked || this.tick < f.respawnAt) return;
                f.picked = false;
                this._setStage(f, f.nextStage);
                f.flash = 12;
                f.shake = 0;
                if (f.canPick) hasBloom = true;
            });

            if (hasBloom) return;

            const emptyCells = this.flowers.filter(f => f.picked);
            if (emptyCells.length > 0) {
                const next = emptyCells.reduce((best, f) => !best || f.respawnAt < best.respawnAt ? f : best, null);
                next.respawnAt = Math.min(next.respawnAt, this.tick + 18);
                next.nextStage = 2;
                return;
            }

            const candidates = this.flowers.filter(f => !f.canPick);
            const forced = candidates[Math.floor(Math.random() * candidates.length)];
            if (forced) {
                this._setStage(forced, 2);
                forced.flash = 12;
            }
        }

        _drawGrid() {
            const startX = 60, startY = 78, cellW = (this.width - 120) / 5, cellH = 116;
            this.flowers.forEach(f => {
                if (f.picked) return;
                const cx = startX + f.c * cellW + cellW / 2;
                const cy = startY + f.r * cellH + cellH / 2;
                const shake = f.shake > 0 ? Math.sin(f.shake * 1.5) * 6 : 0;
                if (f.flash > 0) {
                    this.ctx.save();
                    this.ctx.globalAlpha = f.flash / 15;
                    this.roundRect(startX + f.c * cellW + 4, startY + f.r * cellH + 4, cellW - 8, cellH - 8, 6);
                    this.ctx.fillStyle = f.canPick ? this.palette.greenLight : this.palette.red;
                    this.ctx.fill();
                    this.ctx.restore();
                    f.flash--;
                }
                f.shake = Math.max(0, f.shake - 1);
                this.ctx.strokeStyle = this.palette.green;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(cx + shake, cy + 34);
                this.ctx.lineTo(cx + shake, cy + 55);
                this.ctx.stroke();
                this._drawFlower(cx + shake, cy, f.stage);
                if (f.canPick) {
                    this.ctx.save();
                    this.ctx.strokeStyle = 'rgba(232, 200, 112, .72)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(cx + shake, cy, 34, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            });
            const labels = ['花蕾', '初开', '盛开', '凋谢'];
            labels.forEach((s, i) => {
                this.ctx.fillStyle = i === 2 ? this.palette.goldLight : this.palette.muted;
                this.ctx.font = i === 2 ? 'bold 11px "Microsoft YaHei", sans-serif' : '11px "Microsoft YaHei", sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(s, 170 + i * 120, this.height - 12);
            });
        }

        _drawFlower(cx, cy, stage) {
            const ctx = this.ctx;
            if (stage === 0) {
                ctx.fillStyle = this.palette.green;
                ctx.beginPath();
                ctx.ellipse(cx, cy, 7, 18, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#d8c040';
                ctx.beginPath();
                ctx.ellipse(cx, cy - 6, 9, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                return;
            }
            const petalCount = stage === 1 ? 10 : stage === 2 ? 18 : 14;
            const radius = stage === 1 ? 24 : 30;
            ctx.save();
            if (stage === 3) ctx.globalAlpha = .55;
            for (let i = 0; i < petalCount; i++) {
                const a = i / petalCount * Math.PI * 2;
                ctx.fillStyle = stage === 3 ? '#a08030' : (i % 3 === 0 ? '#fff8d0' : '#f4ea40');
                ctx.beginPath();
                ctx.ellipse(cx + Math.cos(a) * radius * .75, cy + Math.sin(a) * radius * .75, 4, radius * .42, a, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            ctx.fillStyle = '#e07828';
            ctx.beginPath();
            ctx.arc(cx, cy, stage === 2 ? 11 : 8, 0, Math.PI * 2);
            ctx.fill();
        }

        onDown() {
            if (this.done) return;
            const startX = 60, startY = 78, cellW = (this.width - 120) / 5, cellH = 116;
            this.flowers.forEach(f => {
                if (f.picked) return;
                const cx = startX + f.c * cellW + cellW / 2;
                const cy = startY + f.r * cellH + cellH / 2;
                if (this.dist(this.mouse.x, this.mouse.y, cx, cy) > 35) return;
                if (f.canPick) {
                    f.picked = true;
                    f.respawnAt = this.tick + this.respawnDelay + Math.floor(Math.random() * 35);
                    f.nextStage = this._randomStage(false);
                    this.pickedCount++;
                    this.combo++;
                    const gain = 10 * (this.combo > 2 ? 2 : 1);
                    this.score += gain;
                    this.burst(cx, cy, this.palette.goldLight, 16);
                } else {
                    this.combo = 0;
                    this.score = Math.max(0, this.score - 5);
                    f.shake = 14;
                    f.flash = 15;
                }
            });
        }

        _complete() {
            this.ctx.fillStyle = 'rgba(8,16,5,.82)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.finish(true, { score: this.score, picked: this.pickedCount });
        }
    }

    window.ChrysanthemumPickGame = ChrysanthemumPickGame;
})();
