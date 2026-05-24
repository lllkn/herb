// ============================================
// 古风问诊小游戏 - 示例数据（16:9适配）
// 文件名：patientData.js
// ============================================

// 游戏整体配置
const GAME_CONFIG = {
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    title: "杏林问诊录",
    version: "1.0.0"
};

// 五大步骤（含开药）
const DIAGNOSIS_STEPS = [
    "望",
    "闻",
    "问",
    "切",
    "药"
];

// 药材库
const HERB_LIBRARY = [
    {
        id: 1,
        name: "甘草",
        type: "补气",
        effect: "调和诸药，补脾益气",
        temperature: "平"
    },
    {
        id: 2,
        name: "黄芪",
        type: "补气",
        effect: "补气升阳",
        temperature: "温"
    },
    {
        id: 3,
        name: "当归",
        type: "补血",
        effect: "补血活血",
        temperature: "温"
    },
    {
        id: 4,
        name: "金银花",
        type: "清热",
        effect: "清热解毒",
        temperature: "寒"
    },
    {
        id: 5,
        name: "连翘",
        type: "清热",
        effect: "散结消肿",
        temperature: "微寒"
    },
    {
        id: 6,
        name: "陈皮",
        type: "理气",
        effect: "理气健脾",
        temperature: "温"
    },
    {
        id: 7,
        name: "川芎",
        type: "活血",
        effect: "活血行气",
        temperature: "温"
    },
    {
        id: 8,
        name: "薄荷",
        type: "解表",
        effect: "疏风散热",
        temperature: "凉"
    }
];

// 病例数据
const PATIENT_CASES = [
    {
        id: 1001,

        // 基础信息
        patientInfo: {
            name: "柳清婉",
            age: 22,
            gender: "女",
            occupation: "书院女先生",
            avatar: "assets/patients/patient_01.png"
        },

        // 背景故事
        background: `
            近日春雨连绵，柳姑娘夜间备课至深夜，
            感风寒后身体不适，已持续三日。
        `,

        // =========================
        // 望诊
        // =========================
        inspection: {
            complexion: "面色微红，略显疲惫",
            tongue: "舌尖偏红，舌苔薄白",
            eyes: "眼神倦怠",
            posture: "偶有轻咳，以袖掩口",

            clues: [
                "面色发红",
                "轻微咳嗽",
                "精神不足"
            ],

            image: "assets/inspection/face_01.png",

            quiz: {
                question: "根据患者面色与神态，应优先怀疑？",
                options: [
                    "风热犯肺",
                    "寒湿入体",
                    "脾胃虚寒",
                    "气血两虚"
                ],
                correct: 0,
                explainCorrect: "面红、咽干、轻咳，多属风热之象，肺气失宣。",
                explainWrong: "患者面色偏红且伴随轻咳，更偏向外感风热，而非寒证。"
            }
        },

        // =========================
        // 闻诊
        // =========================
        listening: {
            voice: "声音略沙哑",
            breathing: "呼吸稍急",
            cough: "偶有干咳",

            audio: {
                cough: "assets/audio/cough_01.mp3",
                voice: "assets/audio/voice_01.mp3"
            },

            clues: [
                "嗓音干涩",
                "咳声轻短"
            ],

            quiz: {
                question: "患者声音沙哑、干咳，说明哪一脏腑受影响？",
                options: ["肝", "肺", "脾", "肾"],
                correct: 1,
                explainCorrect: "肺主气司呼吸，声音与咳嗽变化多与肺相关。",
                explainWrong: "此症状核心在呼吸与咳嗽，应首先考虑肺。"
            }
        },

        // =========================
        // 问诊
        // =========================
        inquiry: {
            questions: [
                {
                    id: 1,
                    question: "近日可有畏寒发热？",
                    answer: "昨夜微微发热，但未至高烧。"
                },
                {
                    id: 2,
                    question: "饮食如何？",
                    answer: "食欲不佳，只饮清粥。"
                },
                {
                    id: 3,
                    question: "可有头痛胸闷？",
                    answer: "偶有头昏。"
                },
                {
                    id: 4,
                    question: "夜间睡眠如何？",
                    answer: "夜咳影响安眠。"
                }
            ],

            quiz: {
                question: "夜咳影响安眠，最符合以下哪种病机？",
                options: ["肺失宣降", "肝火旺盛", "脾胃不和", "肾阳不足"],
                correct: 0,
                explainCorrect: "夜咳、咽干，多为肺气失宣。",
                explainWrong: "患者主要症状集中于肺系，而非脾肾问题。"
            }
        },

        // =========================
        // 切诊
        // =========================
        pulse: {
            pulseType: "浮数",
            description: "脉象略浮而偏快",

            pulseAnimation: {
                speed: 1.2,
                intensity: 0.7
            },

            clues: [
                "外感风热",
                "肺气不畅"
            ],

            quiz: {
                question: "浮数脉通常提示？",
                options: ["寒证", "热证", "血瘀", "气虚"],
                correct: 1,
                explainCorrect: "数脉主热，浮脉主表，因此多见风热表证。",
                explainWrong: "浮数脉并非寒证，而更偏向外感热邪。"
            }
        },

        // =========================
        // 正确诊断
        // =========================
        diagnosis: {
            syndrome: "风热犯肺",
            difficulty: 2,

            analysis: `
                患者春日感邪，肺气失宣，
                故见咳嗽、咽干、脉浮数之象。
            `
        },

        // =========================
        // 正确药方
        // =========================
        prescription: {
            name: "银翘散加减",

            herbs: [
                {
                    herbId: 4,
                    dosage: "10g"
                },
                {
                    herbId: 5,
                    dosage: "8g"
                },
                {
                    herbId: 8,
                    dosage: "6g"
                },
                {
                    herbId: 1,
                    dosage: "5g"
                }
            ],

            effect: "疏风清热，宣肺止咳",

            tips: [
                "忌辛辣",
                "早睡静养",
                "温水频饮"
            ]
        },

        // 玩家评分标准
        scoreRule: {
            correctDiagnosis: 50,
            correctHerbs: 30,
            correctOrder: 10,
            quickFinish: 10
        }
    },

    // ======================================
    // 第二个病例
    // ======================================
    {
        id: 1002,

        patientInfo: {
            name: "周远山",
            age: 47,
            gender: "男",
            occupation: "镖局护卫",
            avatar: "assets/patients/patient_02.png"
        },

        background: `
            长途押镖归来后，饮酒受寒，
            腰背酸痛，已有五日。
        `,

        inspection: {
            complexion: "面色偏白",
            tongue: "舌苔白腻",
            eyes: "神色疲乏",
            posture: "扶腰而坐",

            clues: [
                "气色虚弱",
                "腰背不适"
            ],

            image: "assets/inspection/face_02.png",

            quiz: {
                question: "面色偏白、扶腰而坐，最可能提示？",
                options: [
                    "寒湿痹阻经络",
                    "肝阳上亢",
                    "心火旺盛",
                    "阴虚内热"
                ],
                correct: 0,
                explainCorrect: "面白、腰痛多为寒湿阻滞经络之象。",
                explainWrong: "面白无华兼腰痛，应优先考虑寒湿痹证。"
            }
        },

        listening: {
            voice: "声音低沉",
            breathing: "呼吸平缓",
            cough: "无明显咳嗽",

            audio: {
                voice: "assets/audio/voice_02.mp3"
            },

            clues: [
                "中气不足"
            ],

            quiz: {
                question: "声音低沉、中气不足，多与哪两脏有关？",
                options: [
                    "心与肝",
                    "肺与脾",
                    "脾与肾",
                    "肝与胆"
                ],
                correct: 2,
                explainCorrect: "脾主运化、肾主纳气，中气不足常源于脾肾。",
                explainWrong: "声音低沉多非心肺之变，而常责之脾肾。"
            }
        },

        inquiry: {
            questions: [
                {
                    id: 1,
                    question: "腰痛可遇寒加重？",
                    answer: "正是，夜间尤甚。"
                },
                {
                    id: 2,
                    question: "平日饮食如何？",
                    answer: "常年饮酒。"
                },
                {
                    id: 3,
                    question: "是否乏力？",
                    answer: "近日四肢困倦。"
                }
            ],

            quiz: {
                question: "腰痛遇寒加重、常年饮酒，说明体内以何种邪气为主？",
                options: ["暑邪", "燥邪", "寒湿之邪", "火邪"],
                correct: 2,
                explainCorrect: "遇寒加重为寒象，饮酒助湿，故为寒湿之邪。",
                explainWrong: "遇寒加重且饮酒史，首先考虑寒湿之邪。"
            }
        },

        pulse: {
            pulseType: "沉迟",
            description: "脉沉而缓",

            pulseAnimation: {
                speed: 0.6,
                intensity: 0.8
            },

            clues: [
                "寒湿内侵",
                "阳气不足"
            ],

            quiz: {
                question: "沉迟脉通常提示？",
                options: [
                    "表热证",
                    "里寒证",
                    "气滞证",
                    "阴虚证"
                ],
                correct: 1,
                explainCorrect: "沉脉主里、迟脉主寒，合为里寒之象。",
                explainWrong: "沉迟脉非热、非阴虚，而多提示里寒。"
            }
        },

        diagnosis: {
            syndrome: "寒湿痹阻",
            difficulty: 3,

            analysis: `
                饮酒受寒，寒湿侵袭经络，
                故腰背酸痛，脉沉迟。
            `
        },

        prescription: {
            name: "独活寄生汤",

            herbs: [
                {
                    herbId: 2,
                    dosage: "12g"
                },
                {
                    herbId: 3,
                    dosage: "10g"
                },
                {
                    herbId: 6,
                    dosage: "6g"
                },
                {
                    herbId: 7,
                    dosage: "8g"
                }
            ],

            effect: "祛风除湿，补气养血",

            tips: [
                "避免受寒",
                "减少饮酒",
                "热敷腰部"
            ]
        },

        scoreRule: {
            correctDiagnosis: 50,
            correctHerbs: 30,
            correctOrder: 10,
            quickFinish: 10
        }
    }
];

// UI古风主题配置
const UI_THEME = {
    primaryColor: "#7A4F2A",
    secondaryColor: "#D8C3A5",
    accentColor: "#B23A48",

    fonts: {
        title: "STKaiti",
        content: "SimSun"
    },

    background: {
        main: "assets/bg/main_bg.jpg",
        panel: "assets/bg/panel_bg.png"
    },

    sounds: {
        bgm: "assets/audio/bgm.mp3",
        click: "assets/audio/click.wav",
        success: "assets/audio/success.wav"
    }
};

// ============================================
// 全局导出（兼容 script 标签加载）
// ============================================
window.GAME_CONFIG    = GAME_CONFIG;
window.DIAGNOSIS_STEPS = DIAGNOSIS_STEPS;
window.HERB_LIBRARY   = HERB_LIBRARY;
window.PATIENT_CASES  = PATIENT_CASES;
window.UI_THEME       = UI_THEME;

// ============================================
// Phaser 场景类 —— 在剧情中作为覆盖层运行
// 符合 IntroScene 的 launch('DiagnosisMinigame', data) / shutdown 协议
// ============================================
class DiagnosisMinigame extends Phaser.Scene {
    constructor() {
        super({ key: 'DiagnosisMinigame' });
    }

    /* -------- init：接收 IntroScene 传入的数据 -------- */
    init(data) {
        this._sceneData = data || {};
        console.log('[DiagnosisMinigame] init:', this._sceneData);
    }

    /* -------- create：构建面板 UI -------- */
    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        // 半透明遮罩
        this.add.rectangle(W / 2, H / 2, W, H, 0x0A0604, 0.75).setDepth(0);

        // 面板尺寸
        const pw = Math.min(860, W - 60);
        const ph = Math.min(620, H - 80);
        const px = (W - pw) / 2;
        const py = (H - ph) / 2;
        this._PX = px; this._PY = py; this._PW = pw; this._PH = ph;
        this._CX = W / 2;

        // 面板背景
        const bg = this.add.graphics().setDepth(1);
        bg.fillStyle(0x3C2415, 0.96);
        bg.fillRoundedRect(px, py, pw, ph, 16);
        bg.lineStyle(3, 0x7A5C3A, 1);
        bg.strokeRoundedRect(px, py, pw, ph, 16);
        bg.lineStyle(1, 0x907040, 0.35);
        bg.strokeRoundedRect(px + 10, py + 10, pw - 20, ph - 20, 12);

        // 标题栏
        bg.fillStyle(0x2A1808, 1);
        bg.fillRoundedRect(px + 8, py + 8, pw - 16, 52, { tl: 12, tr: 12, bl: 0, br: 0 });

        this.add.text(W / 2, py + 34, '🌿 杏林问诊录', {
            fontSize: '28px', fontFamily: 'serif', color: '#FFDD66',
            stroke: '#100804', strokeThickness: 3
        }).setOrigin(0.5).setDepth(2);

        // 根据 sceneData 选择病例
        const pname = this._sceneData.patientName || '';
        const caseInfo = PATIENT_CASES.find(c => c.patientInfo.name === pname) || PATIENT_CASES[0];
        this._caseInfo = caseInfo;

        this.add.text(W / 2, py + 80, [
            `患者：${caseInfo.patientInfo.name}`,
            `年龄：${caseInfo.patientInfo.age}岁`,
            `性别：${caseInfo.patientInfo.gender}`
        ].join('　　'), {
            fontSize: '18px', fontFamily: 'serif', color: '#D8C898'
        }).setOrigin(0.5).setDepth(2);

        // 步骤标签栏
        const tabW = 134, tabH = 34;
        const steps = DIAGNOSIS_STEPS;
        const tabStartX = W / 2 - (steps.length * tabW) / 2;
        const tabY = py + 110;
        this._tabY = tabY;
        this._tabW = tabW;

        this._currentStep = 0;
        this._score = 0;
        this._answeredSteps = {};
        this._tabs = [];

        steps.forEach((name, i) => {
            const tx = tabStartX + i * tabW + tabW / 2;
            const tab = this.add.graphics().setDepth(2);
            const drawTab = (active) => {
                tab.clear();
                tab.fillStyle(active ? 0x5A3820 : 0x302010, active ? 0.9 : 0.7);
                tab.fillRoundedRect(tx - tabW / 2 + 3, tabY, tabW - 6, tabH, 8);
                if (active) {
                    tab.lineStyle(2, 0xD4A040, 0.8);
                    tab.strokeRoundedRect(tx - tabW / 2 + 3, tabY, tabW - 6, tabH, 8);
                }
            };
            drawTab(i === 0);
            this._tabs.push({ gfx: tab, draw: drawTab, tx, name });

            this.add.text(tx, tabY + tabH / 2, name, {
                fontSize: '20px', fontFamily: 'serif',
                color: i === 0 ? '#FFDD66' : '#8B7355'
            }).setOrigin(0.5).setDepth(3).setName(`tabT${i}`);
        });

        // 内容区
        const cy = tabY + tabH + 16;
        const ch = ph - (cy - py) - 72;
        this._contentRect = { x: px + 14, y: cy, w: pw - 28, h: ch, cx: px + 14 + (pw - 28) / 2 };

        const cb = this.add.graphics().setDepth(1);
        cb.fillStyle(0x201508, 0.5);
        cb.fillRoundedRect(this._contentRect.x, cy, this._contentRect.w, ch, 10);

        // 内容组（depth 需高于内容背景的 1，否则文字被遮挡）
        this._cg = this.add.group();
        this._cg.setDepth(2);

        // 显示首步
        this._showStep(0);

        // 按钮
        this._btnPrev = this._mkBtn(W / 2 - 150, py + ph - 38, '← 上一步', () => {
            if (this._currentStep > 0) { this._currentStep--; this._showStep(this._currentStep); this._refreshTabs(); }
        });
        this._btnNext = this._mkBtn(W / 2 + 150, py + ph - 38, '下一步 →', () => {
            if (this._currentStep < 4) { this._currentStep++; this._showStep(this._currentStep); this._refreshTabs(); }
            else this._finish();
        });
    }

    /* -------- 标签刷新 -------- */
    _refreshTabs() {
        this._tabs.forEach((t, i) => {
            const active = i === this._currentStep;
            t.draw(active);
            const txt = this.children.getByName(`tabT${i}`);
            if (txt) {
                txt.setColor(active ? '#FFDD66' : (i < this._currentStep ? '#D4A060' : '#8B7355'));
                txt.setAlpha(i < this._currentStep ? 0.6 : 1);
            }
        });
    }

    /* -------- 步骤内容（互动版 · 左右两栏布局） -------- */
    _showStep(idx) {
        this._cg.clear(true, true);

        // ── 开药环节走独立渲染 ──
        if (idx === 4) { this._showPrescriptionStep(); return; }

        const box = this._contentRect;
        const ci = this._caseInfo;
        const sd = this._stepData(idx, ci);

        // 两栏分割（左40% : 右58%）
        const pad = 16;
        const leftMaxW = Math.floor(box.w * 0.40);       // 左栏最大宽度
        const splitX = box.x + leftMaxW;                  // 分割线 X
        const rightLx = splitX + 18;                      // 右栏起点（留间距）
        const rightMaxW = box.w - leftMaxW - pad * 2 - 18; // 右栏最大宽度（确保不越界）

        // ── 标题（跨栏居中） ──
        const stepT = this.add.text(box.cx, box.y + 14, `【${DIAGNOSIS_STEPS[idx]}诊】 ${sd.title}`, {
            fontSize: '21px', fontFamily: 'serif', color: '#FFDD66', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(2);
        this._cg.add(stepT);

        const bodyY = stepT.y + stepT.height + 12;

        // ════════════════════════
        //  左栏：医理判断
        // ════════════════════════
        if (sd.quiz) {
            const leftCx = box.x + leftMaxW / 2;

            // 分割竖线（从标题下方到底部）
            const sepG = this.add.graphics().setDepth(2);
            sepG.lineStyle(1.5, 0x907040, 0.35);
            sepG.lineBetween(splitX, bodyY - 4, splitX, box.y + box.h - 10);
            this._cg.add(sepG);

            const qTitle = this.add.text(leftCx, bodyY, `【医理判断】`, {
                fontSize: '15px', fontFamily: 'serif', color: '#FFD98A', fontStyle: 'bold'
            }).setOrigin(0.5, 0).setDepth(2);
            this._cg.add(qTitle);

            const qText = this.add.text(leftCx, qTitle.y + qTitle.height + 6, sd.quiz.question, {
                fontSize: '14px', fontFamily: 'serif', color: '#F6E4B2',
                align: 'center', wordWrap: { width: leftMaxW - 24 }
            }).setOrigin(0.5, 0).setDepth(2);
            this._cg.add(qText);

            const optStartY = qText.y + qText.height + 14;
            const btnW = Math.max(200, leftMaxW - 36);
            const btnH = 38;
            const btnGap = 44;

            sd.quiz.options.forEach((opt, i) => {
                const by = optStartY + i * btnGap;
                const btn = this._createOptionBtn(leftCx, by, btnW, btnH, opt, () => {
                    if (this._answeredSteps[idx]) return;
                    this._answeredSteps[idx] = true;
                    const ok = i === sd.quiz.correct;
                    if (ok) this._score += 25;
                    this._showExplainPopup(ok,
                        ok ? sd.quiz.explainCorrect : sd.quiz.explainWrong
                    );
                });
                btn.all.forEach(el => this._cg.add(el));
            });
        }

        // ════════════════════════
        //  右栏：描述与线索（严格限宽）
        // ════════════════════════
        let ry = bodyY;

        const desc = this.add.text(rightLx, ry, sd.description, {
            fontSize: '15px', fontFamily: 'serif', color: '#EED0A0',
            wordWrap: { width: rightMaxW }, lineSpacing: 6
        }).setDepth(2);
        this._cg.add(desc);
        ry += desc.height + 14;

        if (sd.clues && sd.clues.length > 0 && sd.clues[0] !== '') {
            const ct = this.add.text(rightLx, ry, '\uD83D\uDD0D \u89C2\u5BDF\u6240\u5F97\uFF1A', {
                fontSize: '14px', fontFamily: 'serif', color: '#D8C898', fontStyle: 'italic'
            }).setDepth(2);
            this._cg.add(ct);
            ry += 24;
            const cs = this.add.text(rightLx + 8, ry, '\u2022 ' + sd.clues.join('\n\u2022 '), {
                fontSize: '14px', fontFamily: 'serif', color: '#90E090',
                wordWrap: { width: rightMaxW - 12 }, lineSpacing: 5
            }).setDepth(2);
            this._cg.add(cs);
        }
    }

    /* -------- 开药环节（第5步） -------- */
    _showPrescriptionStep() {
        const box = this._contentRect;
        const ci = this._caseInfo;
        const rx = ci.prescription;

        // 初始化选药状态
        if (!this._selectedHerbs) this._selectedHerbs = [];

        // 标题
        const stepT = this.add.text(box.cx, box.y + 14, `\u3010\u836F\u3011 \u5F00\u65B9\u70BC\u85CD`, {
            fontSize: '21px', fontFamily: 'serif', color: '#FFDD66', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(2);
        this._cg.add(stepT);

        // 病机摘要
        const summary = this.add.text(box.cx, stepT.y + stepT.height + 10,
            `\u75C7\u72B6\uFF1A${ci.diagnosis.syndrome}\u3000\u3000\u6CB9\u7403\uFF1A${rx ? rx.effect : '\u8C03\u7406\u8EAB\u4F53'}`,
            { fontSize: '15px', fontFamily: 'serif', color: '#D8C898' }
        ).setOrigin(0.5, 0).setDepth(2);
        this._cg.add(summary);

        // 提示文字
        const tip = this.add.text(box.cx, summary.y + summary.height + 8,
            '\u2838 \u4ECE\u4E0B\u65B9\u836F\u6750\u4E2D\u9009\u62E9 ' + rx.herbs.length + ' \u5473\u7EC4\u6210\u5BF9\u8BC1\u836F\u65B9',
            { fontSize: '13px', fontFamily: 'serif', color: '#AAA088', fontStyle: 'italic' }
        ).setOrigin(0.5, 0).setDepth(2);
        this._cg.add(tip);

        // ══ 药材网格（2列 x N行）═
        const herbs = HERB_LIBRARY;
        const gridTop = tip.y + tip.height + 18;
        const colW = (box.w - 30) / 2;
        const cellH = 48;
        const gap = 8;

        this._herbCells = [];   // 存引用供后续更新状态

        herbs.forEach((h, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cx = box.x + colW / 2 + col * (colW + gap);
            const cy = gridTop + row * (cellH + gap);

            const selected = this._selectedHerbs.includes(h.id);
            const cell = this._mkHerbCell(cx, cy, colW - 10, cellH, h, selected);
            cell.all.forEach(el => this._cg.add(el));
            this._herbCells.push(cell);
        });

        // 已选计数显示
        const countY = gridTop + Math.ceil(herbs.length / 2) * (cellH + gap) + 12;
        this._rxCountTxt = this.add.text(box.cx, countY,
            `\u5DF2\u9009\u836F\u6750\uFF1A${this._selectedHerbs.length} / ${rx.herbs.length}`,
            { fontSize: '15px', fontFamily: 'serif', color: '#FFE4A0' }
        ).setOrigin(0.5, 0).setDepth(2);
        this._cg.add(this._rxCountTxt);

        // ══ 确认按钮 ══
        const confirmBtn = this._mkBtn(box.cx, countY + 36, '\u786E\u8BA4\u5F00\u65B9', () => {
            if (this._selectedHerbs.length === 0) return;
            if (this._answeredSteps[4]) return;
            this._answeredSteps[4] = true;
            this._checkPrescription();
        });
        [confirmBtn.g, confirmBtn.t, confirmBtn.hit].forEach(el => this._cg.add(el));
    }

    /* -------- 药材选择单元格 -------- */
    _mkHerbCell(x, y, w, h, herb, selected) {
        const g = this.add.graphics().setDepth(3);
        const draw = (sel, hover) => {
            g.clear();
            if (sel) {
                g.fillStyle(0x4A6030, 0.92);
            } else {
                g.fillStyle(hover ? 0x503015 : 0x302010, hover ? 0.95 : 0.88);
            }
            g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            g.lineStyle(sel ? 2.5 : 1.2, sel ? 0x80D860 : (hover ? 0xD4A050 : 0x8A6838), 1);
            g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        };
        draw(selected, false);

        const t = this.add.text(x, y,
            `${selected ? '\u2713 ' : ''}${herb.name}  (${herb.type})`,
            { fontSize: '14px', fontFamily: 'serif',
              color: selected ? '#90EE90' : '#E8D8B8' }
        ).setOrigin(0.5).setDepth(4);

        const zone = this.add.zone(x, y, w, h)
            .setInteractive({ useHandCursor: true })
            .setDepth(5);
        zone.on('pointerover', () => draw(this._selectedHerbs.includes(herb.id), true));
        zone.on('pointerout', () => draw(this._selectedHerbs.includes(herb.id), false));
        zone.on('pointerdown', () => {
            if (this._answeredSteps[4]) return;
            const idx = this._selectedHerbs.indexOf(herb.id);
            if (idx >= 0) this._selectedHerbs.splice(idx, 1);
            else this._selectedHerbs.push(herb.id);
            // 重绘当前格子
            const sel = this._selectedHerbs.includes(herb.id);
            draw(sel, false);
            t.setText(`${sel ? '\u2713 ' : ''}${herb.name}  (${herb.type})`);
            t.setColor(sel ? '#90EE90' : '#E8D8B8');
            // 更新计数
            if (this._rxCountTxt) {
                const rx = this._caseInfo.prescription;
                this._rxCountTxt.setText(
                    `\u5DF2\u9009\u836F\u6750\uFF1A${this._selectedHerbs.length} / ${rx.herbs.length}`
                );
            }
        });

        return { all: [g, t, zone], herbId: herb.id };
    }

    /* -------- 校验药方并结算 -------- */
    _checkPrescription() {
        const rx = this._caseInfo.prescription;
        const correctIds = rx.herbs.map(h => h.herbId).sort((a,b)=>a-b);
        const picked = [...this._selectedHerbs].sort((a,b)=>a-b);

        const allHit = correctIds.every(id => picked.includes(id));
        const noExtra = picked.length === correctIds.length;
        const perfect = allHit && noExtra;

        let scoreAdd = 0;
        let feedback = '';

        if (perfect) {
            scoreAdd = 25;
            feedback = `\u2714 \u836F\u65B9\u51C6\u786E\uFF01\n\n${rx.name}\n${rx.effect}`;
        } else if (allHit && !noExtra) {
            scoreAdd = 15;
            feedback = `\u25A1 \u836F\u6750\u57FA\u672C\u6B63\u786E\uFF0C\u4F46\u591A\u52A0\u4E86\u591A\u4F59\u836F\u6750\u3002\n\n\u6B63\u786E\u836F\u65B9\u5E94\u542B\uFF1A${correctIds.map(id=>HERB_LIBRARY.find(h=>h===id||h.id===id)?HERB_LIBRARY.find(h=>(typeof id==='number'?h.id:id)===id)?.name:'').filter(Boolean).join('\u3001')}`;
        } else if (!allHit && picked.some(id => correctIds.includes(id))) {
            scoreAdd = 8;
            const missing = correctIds.filter(id => !picked.includes(id));
            const missingNames = missing.map(id => {
                const hb = HERB_LIBRARY.find(h => h.id === id);
                return hb ? hb.name : id;
            });
            feedback = `\u25A1 \u90E8\u5206\u836F\u6750\u6B63\u786E\uFF0C\u4F46\u7F3A\u5C11\uFF1A${missingNames.join('\u3001')}`;
        } else {
            scoreAdd = 0;
            feedback = `\u2718 \u836F\u65B9\u4E0D\u5BF9\uFF0C\u9700\u91CD\u65B0\u8003\u8651\u3002`;
        }

        this._score += scoreAdd;
        this._showExplainPopup(perfect, feedback);
    }

    /* -------- 步骤数据提取 -------- */
    _stepData(idx, ci) {
        switch (idx) {
        case 0: return {
            title: '\u89C2\u5175\u5F62\u8272',
            description: `${ci.inspection.complexion}\uFF1B${ci.inspection.tongue}\uFF1B${ci.inspection.eyes}\uFF1B${ci.inspection.posture}\u3002`,
            clues: ci.inspection.clues || [],
            quiz: ci.inspection.quiz || null
        };
        case 1: return {
            title: '\u542C\u5176\u58F0\u606F',
            description: `${ci.listening.voice}\uFF0C${ci.listening.breathing}\u3002${ci.listening.cough || '\u65E0\u54B3\u55FD'}\u3002`,
            clues: ci.listening.clues || [],
            quiz: ci.listening.quiz || null
        };
        case 2: {
            const qs = (ci.inquiry && ci.inquiry.questions) ? ci.inquiry.questions : [];
            const qa = qs.map(q => `\u3010\u95EE\u3011${q.question}\n\u56DE\u7B54\uFF1A${q.answer}`).join('\n\n');
            return {
                title: '\u8BE2\u5176\u75C5\u7531',
                description: qa || '\uFF08\u65E0\u5177\u4F53\u95EE\u7B54\u8BB0\u5F55\uFF09',
                clues: [],
                quiz: ci.inquiry.quiz || null
            };
        }
        case 3: return {
            title: '\u5BDF\u5176\u8109\u8C61',
            description: `\u8109\u8C61\uFF1A${ci.pulse.pulseType} \u2014\u2014 ${ci.pulse.description}`,
            clues: ci.pulse.clues || [],
            quiz: ci.pulse.quiz || null
        };
        default: return { title: '', description: '\uFF08\u6570\u636E\u6682\u7F3A\uFF09', clues: [], quiz: null };
        }
    }

    /* -------- 选项按钮（显式宽高，确保文字在框内） -------- */
    _createOptionBtn(x, y, w, h, text, callback) {
        const g = this.add.graphics().setDepth(3);
        const draw = (hover) => {
            g.clear();
            g.fillStyle(hover ? 0x6A4020 : 0x402010, hover ? 1 : 0.88);
            g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
            g.lineStyle(2, hover ? 0xFFD060 : 0xA07030, 1);
            g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        };
        draw(false);

        // 文字严格限制在框内
        const t = this.add.text(x, y, text, {
            fontSize: '14px', fontFamily: 'serif', color: '#F6E4B2',
            wordWrap: { width: w - 16 }, align: 'center',
            lineSpacing: 0
        }).setOrigin(0.5).setDepth(4);

        const zone = this.add.zone(x, y, w, h)
            .setInteractive({ useHandCursor: true })
            .setDepth(5);
        zone.on('pointerover', () => draw(true));
        zone.on('pointerout', () => draw(false));
        zone.on('pointerdown', callback);
        return { all: [g, t, zone] };
    }

    /* -------- 正确/错误解释弹窗 -------- */
    _showExplainPopup(correct, text) {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        const bg = this.add.rectangle(W / 2, H / 2, 520, 200, correct ? 0x203820 : 0x402020, 0.96).setDepth(20);
        bg.setStrokeStyle(3, correct ? 0x90FF90 : 0xFF9090);

        const title = this.add.text(W / 2, H / 2 - 60, correct ? '✔ 辨证正确' : '✘ 辨证有误', {
            fontSize: '28px', fontFamily: 'serif',
            color: correct ? '#90FF90' : '#FF9090'
        }).setOrigin(0.5).setDepth(21);

        const desc = this.add.text(W / 2, H / 2 + 5, text, {
            fontSize: '17px', fontFamily: 'serif', color: '#F5E6C8',
            align: 'center', wordWrap: { width: 420 }
        }).setOrigin(0.5).setDepth(21);

        const tip = this.add.text(W / 2, H / 2 + 75, '点击任意处继续', {
            fontSize: '14px', color: '#AAAAAA'
        }).setOrigin(0.5).setDepth(21);

        this.input.once('pointerdown', () => {
            bg.destroy(); title.destroy(); desc.destroy(); tip.destroy();
        });
    }

    /* -------- 按钮工具 -------- */
    _mkBtn(x, y, label, cb) {
        const bw = 140, bh = 32;
        const g = this.add.graphics().setDepth(5);
        const draw = (hov) => {
            g.clear();
            g.fillStyle(hov ? 0x5A3010 : 0x402008, hov ? 1 : 0.85);
            g.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
            g.lineStyle(1.5, 0xD4A040, hov ? 0.9 : 0.6);
            g.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
        };
        draw(false);
        const t = this.add.text(x, y, label, {
            fontSize: '16px', fontFamily: 'serif', color: '#FFDD66'
        }).setOrigin(0.5).setDepth(6);
        const hit = this.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(7);
        hit.on('pointerover', () => draw(true));
        hit.on('pointerout', () => draw(false));
        hit.on('pointerdown', cb);
        return { g, t, hit, setVisible: v => { g.setVisible(v); t.setVisible(v); hit.setVisible(v); } };
    }

    /* -------- 完成：评分结算并关闭场景 -------- */
    _finish() {
        const ci = this._caseInfo;
        const rx = ci.prescription;

        // 开药环节得分（如果已答）

        const finalText = [
            `\u75C7\u72B6\uFF1A${ci.diagnosis.syndrome}`,
            ``,
            `\u836F\u65B9\uFF1A${rx ? rx.name : '\u672A\u5F00'}`,
            rx ? `\u529F\u6548\uFF1A${rx.effect}` : '',
            ``,
            `\u6700\u7EC8\u5F97\u5206\uFF1A${this._score} / 125 \u5206`,
            ``,
            `\u533B\u7406\u8BC4\u8BED\uFF1A`,
            ci.diagnosis.analysis.trim()
        ].join('\n');

        this._showExplainPopup(true, finalText);

        this.time.delayedCall(2800, () => {
            const result = {
                patientName: ci.patientInfo.name,
                syndrome: ci.diagnosis.syndrome,
                score: this._score,
                prescription: rx ? { name: rx.name, herbsSelected: this._selectedHerbs || [] } : null,
                completed: true,
                timestamp: Date.now()
            };

            if (window.gameStateManager && window.gameStateManager.state) {
                window.gameStateManager.state.__diagnosisResult = result;
            }
            console.log('[DiagnosisMinigame] \u8BCA\u65AD\u5B8C\u6210 \u2192', result);

            this.cameras.main.fadeOut(500, 10, 10, 10);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.stop();
            });
        });
    }
}

// 注册到全局（供 main.js 的 scenes 数组引用）
window.DiagnosisMinigame = DiagnosisMinigame;