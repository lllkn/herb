(function () {
    class LicoriceHarvestGame extends window.HerbCanvasGame {
        reset() {
            this.phase = 'identify';
            this.hover = -1;
            this.chosen = -1;
            this.rootOut = 0;
            this.tension = .5;
            this.dragging = false;
            this.dragY = 0;
            this.breakAcc = 0;
            this.message = '';
            this.messageTimer = 0;
            this.successTimer = 0;
        }

        draw() {
            this.clear();
            if (this.phase === 'identify') this._drawIdentify();
            if (this.phase === 'pull') this._drawPull();
            this.drawParticles();
            this._drawMessage();
        }

        _drawIdentify() {
            this.title('甘草采挖', '先辨认甘草，再稳住力道挖取根部');
            const plants = [
                { name: '菊花', type: 'flower' },
                { name: '甘草', type: 'licorice' },
                { name: '蒲公英', type: 'dandelion' }
            ];
            const xs = [170, this.width / 2, this.width - 170];
            xs.forEach((x, i) => {
                const y = 118, w = 170, h = 230;
                this.roundRect(x - w / 2, y, w, h, 8);
                this.ctx.fillStyle = this.hover === i ? 'rgba(24,42,16,.96)' : this.palette.panel;
                this.ctx.fill();
                this.ctx.strokeStyle = this.chosen === i ? (i === 1 ? this.palette.greenLight : this.palette.red) : 'rgba(200,168,75,.3)';
                this.ctx.lineWidth = this.hover === i || this.chosen === i ? 2 : 1;
                this.ctx.stroke();
                this._drawPlant(x, y + 145, plants[i].type, this.hover === i);
                this.ctx.fillStyle = this.palette.paper;
                this.ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(plants[i].name, x, y + h - 38);
            });
            this.ctx.fillStyle = this.palette.muted;
            this.ctx.font = '12px "Microsoft YaHei", sans-serif';
            this.ctx.fillText('提示：甘草为复叶草本，根部黄褐色，采挖时不可猛拉。', this.width / 2, this.height - 22);
        }

        _drawPull() {
            const ctx = this.ctx;
            const cx = this.width / 2;
            const groundY = 190;
            this.title('挖取甘草根', '按住根柄缓慢向上拖动，让拉力保持在绿色区间');

            ctx.fillStyle = this.palette.soil;
            ctx.fillRect(0, groundY, this.width, this.height - groundY);
            const soil = ctx.createLinearGradient(0, groundY, 0, this.height);
            soil.addColorStop(0, this.palette.soil);
            soil.addColorStop(1, this.palette.soilDark);
            ctx.fillStyle = soil;
            ctx.fillRect(0, groundY, this.width, this.height - groundY);
            for (let i = 0; i < 70; i++) {
                ctx.fillStyle = 'rgba(0,0,0,.14)';
                ctx.beginPath();
                ctx.arc(40 + (i * 113) % 720, groundY + 14 + (i * 71) % 220, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            this._drawLicoriceTop(cx, groundY);
            if (this.rootOut < 1) this._drawRoot(cx, groundY + 6, 1 - this.rootOut * .35);
            const handleY = groundY + 5 - this.rootOut * 56;
            if (this.rootOut < 1) {
                ctx.fillStyle = this.dragging ? this.palette.goldLight : this.palette.gold;
                ctx.beginPath();
                ctx.arc(cx, handleY, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#9a7030';
                ctx.stroke();
            }

            const mx = this.width - 72, my = 100, mh = 210;
            ctx.fillStyle = 'rgba(5,10,4,.88)';
            this.roundRect(mx - 20, my - 10, 48, mh + 20, 6);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,.55)';
            ctx.fillRect(mx - 4, my, 16, mh);
            ctx.fillStyle = 'rgba(74,153,48,.22)';
            ctx.fillRect(mx - 4, my + mh * .25, 16, mh * .5);
            const tp = my + mh * (1 - this.tension);
            ctx.fillStyle = this.tension > .82 ? this.palette.red : this.tension < .18 ? '#4488e0' : this.palette.greenLight;
            ctx.beginPath();
            ctx.roundRect(mx - 6, tp - 7, 22, 14, 3);
            ctx.fill();
            ctx.fillStyle = this.palette.muted;
            ctx.font = '10px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('拉力', mx + 4, my - 18);

            this.progress(48, this.height - 46, 340, 24, this.rootOut, `采挖进度 ${Math.floor(this.rootOut * 100)}%`);

            if (this.rootOut >= 1) {
                ctx.fillStyle = 'rgba(8,18,6,.86)';
                ctx.fillRect(0, 0, this.width, this.height);
                this._drawRoot(cx, 115, 1);
                ctx.fillStyle = this.palette.greenLight;
                ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('采挖成功', cx, 285);
                ctx.fillStyle = this.palette.muted;
                ctx.font = '13px "Microsoft YaHei", sans-serif';
                ctx.fillText('甘草宜取粗壮饱满之根，动作稳则根不断。', cx, 318);
                this.successTimer++;
                if (this.successTimer === 70) this.finish(true, { score: 100, progress: 1 });
            }
        }

        _drawPlant(x, y, type, bright) {
            if (type === 'licorice') return this._drawLicoriceTop(x, y, bright);
            const ctx = this.ctx;
            ctx.strokeStyle = this.palette.green;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y - 70);
            ctx.stroke();
            if (type === 'flower') {
                for (let i = 0; i < 14; i++) {
                    const a = i / 14 * Math.PI * 2;
                    ctx.fillStyle = i % 3 ? '#f4ea40' : '#fff8d0';
                    ctx.beginPath();
                    ctx.ellipse(x + Math.cos(a) * 24, y - 70 + Math.sin(a) * 24, 5, 14, a, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#e07828';
                ctx.beginPath();
                ctx.arc(x, y - 70, 11, 0, Math.PI * 2);
                ctx.fill();
            } else {
                for (let i = 0; i < 18; i++) {
                    const a = i / 18 * Math.PI * 2;
                    ctx.strokeStyle = 'rgba(230,230,180,.85)';
                    ctx.beginPath();
                    ctx.moveTo(x, y - 70);
                    ctx.lineTo(x + Math.cos(a) * 18, y - 70 + Math.sin(a) * 18);
                    ctx.stroke();
                }
            }
        }

        _drawLicoriceTop(x, y, bright) {
            const ctx = this.ctx;
            ctx.strokeStyle = bright ? this.palette.greenLight : this.palette.green;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y - 88);
            ctx.stroke();
            [.28, .54, .78].forEach(t => {
                const ly = y - 88 * t;
                [-1, 1].forEach(s => {
                    ctx.beginPath();
                    ctx.moveTo(x, ly);
                    ctx.lineTo(x + s * 20, ly - 9);
                    ctx.stroke();
                    ctx.fillStyle = bright ? this.palette.greenLight : this.palette.green;
                    ctx.beginPath();
                    ctx.ellipse(x + s * 25, ly - 11, 7, 12, -s * .28, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
        }

        _drawRoot(x, y, pct) {
            const ctx = this.ctx;
            const len = 210 * pct;
            ctx.strokeStyle = '#9a7030';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + len);
            ctx.stroke();
            ctx.strokeStyle = this.palette.root;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x - 1, y);
            ctx.lineTo(x - 1, y + len * .75);
            ctx.stroke();
        }

        _drawMessage() {
            if (this.messageTimer <= 0) return;
            this.ctx.fillStyle = this.message.indexOf('正确') >= 0 ? this.palette.greenLight : this.palette.red;
            this.ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.message, this.width / 2, 78);
            this.messageTimer--;
        }

        onDown() {
            if (this.phase === 'identify') {
                const xs = [170, this.width / 2, this.width - 170];
                xs.forEach((x, i) => {
                    if (this.dist(this.mouse.x, this.mouse.y, x, 232) < 105) {
                        this.chosen = i;
                        if (i === 1) {
                            this.message = '正确，已识别甘草';
                            this.messageTimer = 55;
                            setTimeout(() => { this.phase = 'pull'; }, 700);
                        } else {
                            this.message = '再观察叶形与根部特征';
                            this.messageTimer = 55;
                            setTimeout(() => { this.chosen = -1; }, 700);
                        }
                    }
                });
            } else {
                const cx = this.width / 2, gy = 190, hy = gy + 5 - this.rootOut * 56;
                if (this.dist(this.mouse.x, this.mouse.y, cx, hy) < 25) {
                    this.dragging = true;
                    this.dragY = this.mouse.y;
                }
            }
        }

        onMove() {
            if (this.phase === 'identify') {
                const xs = [170, this.width / 2, this.width - 170];
                this.hover = xs.findIndex(x => this.dist(this.mouse.x, this.mouse.y, x, 232) < 105);
                return;
            }
            if (!this.dragging || this.rootOut >= 1) return;
            const dy = this.dragY - this.mouse.y;
            const speed = dy / 2.5;
            this.tension = Math.max(0, Math.min(1, .5 + speed * .12));
            if (this.tension >= .25 && this.tension <= .75) {
                this.rootOut = Math.min(1, this.rootOut + .004);
                this.breakAcc = Math.max(0, this.breakAcc - .02);
                if (this.rootOut >= 1) this.burst(this.width / 2, 190, this.palette.greenLight, 35);
            } else if (this.tension > .82) {
                this.breakAcc += .06;
                if (this.breakAcc > 1) {
                    this.message = '根部受损，请放慢力道';
                    this.messageTimer = 55;
                    this.rootOut = Math.max(0, this.rootOut - .12);
                    this.breakAcc = 0;
                    this.burst(this.width / 2, 190, this.palette.red, 20);
                }
            }
            this.dragY = this.mouse.y;
        }

        onUp() {
            this.dragging = false;
            this.tension = .5;
        }
    }

    window.LicoriceHarvestGame = LicoriceHarvestGame;
})();
