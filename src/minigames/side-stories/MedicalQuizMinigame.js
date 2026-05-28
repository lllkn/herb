(function () {
    function ensureStyle() {
        if (document.getElementById('medical-quiz-style')) return;
        const style = document.createElement('style');
        style.id = 'medical-quiz-style';
        style.textContent = `
            .medical-quiz-root {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: grid;
                place-items: center;
                background: rgba(5, 8, 6, .82);
                font-family: "Microsoft YaHei", "SimSun", sans-serif;
                color: #f0e6d3;
            }
            .medical-quiz-panel {
                width: min(900px, 92vw);
                max-height: 86vh;
                overflow: auto;
                background: #151d12;
                border: 1px solid rgba(200, 168, 75, .55);
                box-shadow: 0 20px 70px rgba(0,0,0,.55);
                padding: 26px;
            }
            .medical-quiz-kicker {
                color: #c8a84b;
                font-size: 13px;
                letter-spacing: 2px;
                margin-bottom: 8px;
            }
            .medical-quiz-title {
                margin: 0 0 12px;
                font-size: 24px;
                font-weight: 700;
            }
            .medical-quiz-prompt {
                color: #d8ccb8;
                line-height: 1.75;
                white-space: pre-line;
                margin-bottom: 18px;
            }
            .medical-quiz-options {
                display: grid;
                gap: 10px;
            }
            .medical-quiz-option,
            .medical-quiz-match-row {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: 10px;
                align-items: center;
                min-height: 42px;
                padding: 10px 12px;
                background: rgba(240, 230, 211, .06);
                border: 1px solid rgba(200, 168, 75, .22);
                cursor: pointer;
            }
            .medical-quiz-option:hover {
                border-color: rgba(200, 168, 75, .62);
                background: rgba(240, 230, 211, .09);
            }
            .medical-quiz-option input {
                width: 16px;
                height: 16px;
            }
            .medical-quiz-match-row {
                grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr);
                cursor: default;
            }
            .medical-quiz-match-row select {
                width: 100%;
                padding: 8px;
                background: #0d150a;
                color: #f0e6d3;
                border: 1px solid rgba(200, 168, 75, .35);
            }
            .medical-quiz-feedback {
                display: none;
                margin-top: 18px;
                padding: 16px;
                line-height: 1.7;
                white-space: pre-line;
                background: rgba(6, 12, 4, .76);
                border-left: 3px solid #c8a84b;
            }
            .medical-quiz-feedback.active {
                display: block;
            }
            .medical-quiz-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                margin-top: 20px;
            }
            .medical-quiz-btn {
                background: #2d6018;
                border: 1px solid #6aaa3a;
                color: #f0e6d3;
                padding: 9px 22px;
                border-radius: 4px;
                cursor: pointer;
                font: 14px "Microsoft YaHei", sans-serif;
            }
            .medical-quiz-btn.secondary {
                background: rgba(14,24,9,.92);
                border-color: rgba(200,168,75,.5);
            }
        `;
        document.head.appendChild(style);
    }

    class MedicalQuizMinigame {
        constructor(options) {
            this.options = options || {};
            this.quiz = this.options.quiz || {};
            this.selected = new Set();
            this.matchValues = {};
            this.completed = false;
        }

        mount(host) {
            ensureStyle();
            this.host = host || document.body;
            this.root = document.createElement('div');
            this.root.className = 'medical-quiz-root';
            this.root.innerHTML = `
                <section class="medical-quiz-panel" role="dialog" aria-modal="true">
                    <div class="medical-quiz-kicker">${this.quiz.kicker || '辨证互动'}</div>
                    <h2 class="medical-quiz-title">${this.quiz.title || '问答'}</h2>
                    <div class="medical-quiz-prompt">${this.quiz.prompt || ''}</div>
                    <div class="medical-quiz-options"></div>
                    <div class="medical-quiz-feedback"></div>
                    <div class="medical-quiz-actions">
                        <button class="medical-quiz-btn secondary" data-action="cancel" type="button">跳过</button>
                        <button class="medical-quiz-btn" data-action="submit" type="button">确认</button>
                    </div>
                </section>
            `;
            this.host.appendChild(this.root);
            this.optionsEl = this.root.querySelector('.medical-quiz-options');
            this.feedbackEl = this.root.querySelector('.medical-quiz-feedback');
            this.submitBtn = this.root.querySelector('[data-action="submit"]');
            this.cancelBtn = this.root.querySelector('[data-action="cancel"]');
            this._renderOptions();
            this.submitBtn.addEventListener('click', () => this._submit());
            this.cancelBtn.addEventListener('click', () => this._finish(false, { skipped: true }));
        }

        destroy() {
            if (this.root && this.root.parentNode) this.root.parentNode.removeChild(this.root);
        }

        _renderOptions() {
            const type = this.quiz.type || 'single';
            if (type === 'matching') return this._renderMatching();

            const inputType = type === 'multi' || type === 'herbSelect' ? 'checkbox' : 'radio';
            const options = this.quiz.options || [];
            this.optionsEl.innerHTML = options.map((opt) => `
                <label class="medical-quiz-option">
                    <input type="${inputType}" name="medical-quiz-option" value="${opt.id}">
                    <span>${opt.text}</span>
                </label>
            `).join('');
            this.optionsEl.querySelectorAll('input').forEach(input => {
                input.addEventListener('change', () => {
                    if (inputType === 'radio') this.selected.clear();
                    if (input.checked) this.selected.add(input.value);
                    else this.selected.delete(input.value);
                });
            });
        }

        _renderMatching() {
            const left = this.quiz.left || [];
            const right = this.quiz.right || [];
            this.optionsEl.innerHTML = left.map(item => `
                <div class="medical-quiz-match-row">
                    <strong>${item.text}</strong>
                    <select data-left="${item.id}">
                        <option value="">请选择病机</option>
                        ${right.map(r => `<option value="${r.id}">${r.text}</option>`).join('')}
                    </select>
                </div>
            `).join('');
            this.optionsEl.querySelectorAll('select').forEach(select => {
                select.addEventListener('change', () => {
                    this.matchValues[select.dataset.left] = select.value;
                });
            });
        }

        _submit() {
            if (this.completed) {
                this._finish(true, this.lastResult || {});
                return;
            }
            const result = this._grade();
            this.lastResult = result;
            this.completed = true;
            this.feedbackEl.classList.add('active');
            this.feedbackEl.textContent = `${result.success ? '判断正确。' : '判断有误。'}\n\n${this.quiz.explanation || ''}`;
            this.submitBtn.textContent = '继续剧情';
            this.cancelBtn.style.display = 'none';
        }

        _grade() {
            const type = this.quiz.type || 'single';
            if (type === 'freeChoice') return { success: true, selected: Array.from(this.selected) };
            if (type === 'matching') {
                const correctMap = this.quiz.correctMap || {};
                const keys = Object.keys(correctMap);
                const correctCount = keys.filter(k => this.matchValues[k] === correctMap[k]).length;
                return { success: correctCount === keys.length, score: correctCount, total: keys.length, answers: this.matchValues };
            }
            const correct = (this.quiz.options || []).filter(o => o.correct).map(o => o.id).sort();
            const selected = Array.from(this.selected).sort();
            const success = correct.length === selected.length && correct.every((id, i) => id === selected[i]);
            return { success, selected };
        }

        _finish(success, extra) {
            const result = Object.assign({
                id: this.options.id,
                success: !!success,
                timestamp: Date.now()
            }, extra || {});
            if (window.gameStateManager && window.gameStateManager.state) {
                window.gameStateManager.state.__medicalQuizResult = result;
                if (this.options.resultFlag) window.gameStateManager.state[this.options.resultFlag] = result;
            }
            if (typeof this.options.onComplete === 'function') this.options.onComplete(result);
        }
    }

    window.MedicalQuizMinigame = MedicalQuizMinigame;
})();
