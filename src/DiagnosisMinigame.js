// ============================================
// 古风问诊小游戏 v2.2 — 温馨科普版（16:9 | 1280×720）
// ============================================

const GAME_CONFIG = {
    width: 1280, height: 720, aspectRatio: "16:9",
    title: "杏林问诊录", version: "2.2.0"
};

const DIAGNOSIS_STEPS = ["望", "闻", "问", "切", "药"];

const HERB_LIBRARY = [
    { id: 1, name: "甘草", type: "补气", effect: "调和诸药，补脾益气", temperature: "平",
      knowledge: "百药之王，能调和诸药偏性，解毒缓急，为方剂中最常见的使药。" },
    { id: 2, name: "黄芪", type: "补气", effect: "补气升阳，固表止汗", temperature: "温",
      knowledge: "补气要药，善补肺脾之气，又能升举阳气，治气虚证之首选。" },
    { id: 3, name: "当归", type: "补血", effect: "补血活血，调经止痛", temperature: "温",
      knowledge: "补血圣药，既补血又活血，妇科常用要药，有「十方九归」之说。" },
    { id: 4, name: "金银花", type: "清热", effect: "清热解毒，疏散风热", temperature: "寒",
      knowledge: "清热解毒良药，既清气分热又解血分毒，温病初起常用。" },
    { id: 5, name: "连翘", type: "清热", effect: "清热解毒，散结消肿", temperature: "微寒",
      knowledge: "有「疮家圣药」之称，清热解毒，散结消肿，善治痈肿疮毒。" },
    { id: 6, name: "陈皮", type: "理气", effect: "理气健脾，燥湿化痰", temperature: "温",
      knowledge: "理气调中佳品，陈久者更良，行气又燥湿，为脾胃气滞要药。" },
    { id: 7, name: "川芎", type: "活血", effect: "活血行气，祛风止痛", temperature: "温",
      knowledge: "血中气药，上行头目，下行血海，中开郁结，治头痛要药。" },
    { id: 8, name: "薄荷", type: "解表", effect: "疏散风热，清利头目", temperature: "凉",
      knowledge: "轻清上行，善散上焦风热，清利头目咽喉，温病卫分证要药。" },
    { id: 9, name: "山药", type: "补气", effect: "补脾养胃，生津益肺，补肾涩精", temperature: "平",
      knowledge: "薯蓣科植物根茎，补益肺肾要药。味甘性平，霜降后采挖药性最足，肺肾两虚者尤宜。" },
    { id: 10, name: "茯苓", type: "利湿", effect: "利水渗湿，健脾宁心", temperature: "平",
      knowledge: "多孔菌科真菌，寄生于松根。利水不伤正气，健脾安神，为渗湿要药，张大娘方中臣药。" },
    { id: 11, name: "百合", type: "补阴", effect: "润肺止咳，清心安神", temperature: "微寒",
      knowledge: "百合科植物干燥鳞茎，质润味甘。善润肺燥、止干咳，兼清心安神，虚劳久咳常用。" },
    { id: 12, name: "枸杞", type: "补阴", effect: "滋补肝肾，益精明目", temperature: "平",
      knowledge: "茄科植物宁夏枸杞的成熟果实，色红如玛瑙。滋补肝肾、益精明目，久服轻身延年。" }
];

const PATIENT_CASES = [
    {
        id: 1001,
        patientInfo: { name: "柳清婉", age: 22, gender: "女", occupation: "书院女先生",
            avatar: "assets/patients/patient_01.png" },
        background: "近日春雨连绵，柳姑娘夜间备课至深夜，感风寒后身体不适，已持续三日。",
        inspection: {
            complexion: "面色微红，略显疲惫", tongue: "舌尖偏红，舌苔薄白",
            eyes: "眼神倦怠", posture: "偶有轻咳，以袖掩口",
            clues: ["面色发红", "轻微咳嗽", "精神不足"],
            hint: "观察线索：面色发红、轻微咳嗽——这是外感热邪的典型表现哦～",
            quiz: {
                question: "根据患者面色与神态，应优先怀疑？",
                options: ["风热犯肺", "寒湿入体", "脾胃虚寒", "气血两虚"],
                correct: 0,
                explainCorrect: "面红、咽干、轻咳，多属风热之象，肺气失宣。",
                explainWrong: "患者面色偏红且伴随轻咳，更偏向外感风热，而非寒证。"
            }
        },
        listening: {
            voice: "声音略沙哑", breathing: "呼吸稍急", cough: "偶有干咳",
            audio: { cough: "assets/audio/cough_01.mp3", voice: "assets/audio/voice_01.mp3" },
            clues: ["嗓音干涩", "咳声轻短"],
            hint: "声音与咳嗽的变化，往往能反映某个脏腑的状态～肺主气，司呼吸。",
            quiz: {
                question: "患者声音沙哑、干咳，说明哪一脏腑受影响？",
                options: ["肝", "肺", "脾", "肾"], correct: 1,
                explainCorrect: "肺主气司呼吸，声音与咳嗽变化多与肺相关。",
                explainWrong: "此症状核心在呼吸与咳嗽，应首先考虑肺。"
            }
        },
        inquiry: {
            questions: [
                { id: 1, question: "近日可有畏寒发热？", answer: "昨夜微微发热，但未至高烧。" },
                { id: 2, question: "饮食如何？", answer: "食欲不佳，只饮清粥。" },
                { id: 3, question: "可有头痛胸闷？", answer: "偶有头昏。" },
                { id: 4, question: "夜间睡眠如何？", answer: "夜咳影响安眠。" }
            ],
            hint: "夜间咳嗽加重，影响睡眠——这是哪个脏腑功能失调的表现呢？",
            quiz: {
                question: "夜咳影响安眠，最符合以下哪种病机？",
                options: ["肺失宣降", "肝火旺盛", "脾胃不和", "肾阳不足"], correct: 0,
                explainCorrect: "夜咳、咽干，多为肺气失宣所致。",
                explainWrong: "患者主要症状集中于肺系，而非脾肾问题。"
            }
        },
        pulse: {
            pulseType: "浮数", description: "脉象略浮而偏快",
            pulseAnimation: { speed: 1.2, intensity: 0.7 },
            clues: ["外感风热", "肺气不畅"],
            hint: "记住脉象口诀：浮脉主表（外感），数脉主热～",
            quiz: {
                question: "浮数脉通常提示？",
                options: ["寒证", "热证", "血瘀", "气虚"], correct: 1,
                explainCorrect: "数脉主热，浮脉主表，因此多见风热表证。",
                explainWrong: "浮数脉并非寒证，而更偏向外感热邪。"
            }
        },
        diagnosis: { syndrome: "风热犯肺", difficulty: 1,
            analysis: "患者春日感邪，肺气失宣，\n故见咳嗽、咽干、脉浮数之象。" },
        prescription: {
            name: "银翘散加减",
            herbs: [{ herbId: 4, dosage: "10g" }, { herbId: 5, dosage: "8g" },
                    { herbId: 8, dosage: "6g" },  { herbId: 1, dosage: "5g" }],
            effect: "疏风清热，宣肺止咳",
            tips: ["忌辛辣", "早睡静养", "温水频饮"],
            syndromeHint: "风热犯肺 → 需要清热解毒、疏风散热的药材"
        },
        scoreRule: { correctDiagnosis: 50, correctHerbs: 30, correctOrder: 10, quickFinish: 10 }
    },
    {
        id: 1003,
        patientInfo: { name: "张大娘", age: 58, gender: "女", occupation: "农妇",
            avatar: "assets/patients/patient_03.png" },
        background: "张大娘腰膝酸软、夜间咳嗽已有两月有余，近来愈发乏力。",
        inspection: {
            complexion: "面色苍白无华，精神萎靡", tongue: "舌淡苔薄白，舌体偏胖",
            eyes: "目光倦怠，眼睑略肿", posture: "扶腰入座，动作迟缓",
            clues: ["面色苍白", "腰膝无力", "精神萎靡"],
            hint: "面色白、神疲乏力——这些是气虚还是血虚的表现？想想肺与肾的关系哦～",
            quiz: {
                question: "面色苍白、神情萎靡、腰膝无力，最可能提示？",
                options: ["肺肾两虚", "肝阳上亢", "胃火旺盛", "外感风热"],
                correct: 0,
                explainCorrect: "面白无华、腰膝酸软，正是肺肾两虚、气血不足之象。",
                explainWrong: "患者面色苍白、乏力，无热象，应优先考虑虚证。"
            }
        },
        listening: {
            voice: "声音低微细弱", breathing: "呼吸浅短，偶有气促", cough: "夜间干咳，咳声无力",
            audio: { cough: "assets/audio/cough_03.mp3" },
            clues: ["声低气短", "夜咳无力"],
            hint: "夜间咳嗽、声音低微——肺主声，肾主纳气，两脏相互为用哦～",
            quiz: {
                question: "声音低微、夜间干咳无力，主要提示哪两脏虚损？",
                options: ["肺与肾", "心与肝", "脾与胃", "肝与胆"], correct: 0,
                explainCorrect: "肺主声司呼吸，肾主纳气，二者虚损则声低咳弱。",
                explainWrong: "声低干咳主要责之肺肾，而非心肝或脾胃。"
            }
        },
        inquiry: {
            questions: [
                { id: 1, question: "腰膝酸软从何时开始？", answer: "约两月前，先腰酸，后及膝盖。" },
                { id: 2, question: "夜间是否盗汗、多梦？", answer: "偶有盗汗，睡眠不实。" },
                { id: 3, question: "饮食与二便如何？", answer: "食欲尚可，大便偏溏。" },
                { id: 4, question: "是否容易疲劳？", answer: "近两月四肢困倦，稍动即气喘。" }
            ],
            hint: "腰膝酸软从肾虚考虑，夜间盗汗是阴虚内热的线索——肺肾阴虚！",
            quiz: {
                question: "腰膝酸软、夜间盗汗、干咳无力，最符合哪种病机？",
                options: ["肺肾两虚", "心脾两虚", "肝肾阴虚", "寒湿痹阻"], correct: 0,
                explainCorrect: "腰膝属肾，干咳盗汗属肺阴不足，合参为肺肾两虚。",
                explainWrong: "腰膝酸软＋干咳＋盗汗，核心在肺肾，非心脾或寒湿证。"
            }
        },
        pulse: {
            pulseType: "沉细", description: "脉来沉细无力，按之若无",
            pulseAnimation: { speed: 0.65, intensity: 0.55 },
            clues: ["肺肾两虚", "气血不足"],
            hint: "沉脉主里证，细脉主虚证——沉细脉是虚损病证的典型脉象！",
            quiz: {
                question: "沉细无力脉，通常提示？",
                options: ["气血两虚", "外感风寒", "肝阳上亢", "痰热内蕴"], correct: 0,
                explainCorrect: "沉主里、细主虚，沉细无力提示气血亏虚或脏腑虚损。",
                explainWrong: "沉细脉无外感、无实热，当责之气血两虚或脏腑亏虚。"
            }
        },
        diagnosis: { syndrome: "肺肾两虚", difficulty: 2,
            analysis: "肺肾同源，肺失宣降则咳，\n肾虚失摄则腰软，故脉沉细无力。" },
        prescription: {
            name: "补肺益肾饮",
            herbs: [{ herbId: 9, dosage: "15g" }, { herbId: 10, dosage: "12g" },
                    { herbId: 1, dosage: "6g" },  { herbId: 11, dosage: "10g" },
                    { herbId: 12, dosage: "10g" }],
            effect: "补肺益肾，健脾安神",
            tips: ["避风寒", "忌劳累", "温补饮食"],
            syndromeHint: "肺肾两虚 → 需要补肺益肾、健脾安神的药材（共5味）"
        },
        scoreRule: { correctDiagnosis: 50, correctHerbs: 30, correctOrder: 10, quickFinish: 10 }
    },
    {
        id: 1002,
        patientInfo: { name: "周远山", age: 47, gender: "男", occupation: "镖局护卫",
            avatar: "assets/patients/patient_02.png" },
        background: "长途押镖归来后，饮酒受寒，腰背酸痛，已有五日。",
        inspection: {
            complexion: "面色偏白", tongue: "舌苔白腻", eyes: "神色疲乏", posture: "扶腰而坐",
            clues: ["气色虚弱", "腰背不适"],
            hint: "面色白、舌苔白腻——白色在中医往往与寒、虚相关哦～",
            quiz: {
                question: "面色偏白、扶腰而坐，最可能提示？",
                options: ["寒湿痹阻经络", "肝阳上亢", "心火旺盛", "阴虚内热"], correct: 0,
                explainCorrect: "面白、腰痛多为寒湿阻滞经络之象。",
                explainWrong: "面白无华兼腰痛，应优先考虑寒湿痹证。"
            }
        },
        listening: {
            voice: "声音低沉", breathing: "呼吸平缓", cough: "无明显咳嗽",
            audio: { voice: "assets/audio/voice_02.mp3" },
            clues: ["中气不足"],
            hint: "声音低沉、中气不足，常与脾肾两脏有关——脾主运化，肾主纳气。",
            quiz: {
                question: "声音低沉、中气不足，多与哪两脏有关？",
                options: ["心与肝", "肺与脾", "脾与肾", "肝与胆"], correct: 2,
                explainCorrect: "脾主运化、肾主纳气，中气不足常源于脾肾。",
                explainWrong: "声音低沉多非心肺之变，而常责之脾肾。"
            }
        },
        inquiry: {
            questions: [
                { id: 1, question: "腰痛可遇寒加重？", answer: "正是，夜间尤甚。" },
                { id: 2, question: "平日饮食如何？", answer: "常年饮酒。" },
                { id: 3, question: "是否乏力？", answer: "近日四肢困倦。" }
            ],
            hint: "遇寒加重是寒证的特征，饮酒容易助湿——结合这两点思考！",
            quiz: {
                question: "腰痛遇寒加重、常年饮酒，说明体内以何种邪气为主？",
                options: ["暑邪", "燥邪", "寒湿之邪", "火邪"], correct: 2,
                explainCorrect: "遇寒加重为寒象，饮酒助湿，故为寒湿之邪。",
                explainWrong: "遇寒加重且饮酒史，首先考虑寒湿之邪。"
            }
        },
        pulse: {
            pulseType: "沉迟", description: "脉沉而缓，应指无力",
            pulseAnimation: { speed: 0.55, intensity: 0.85 },
            clues: ["寒湿内侵", "阳气不足"],
            hint: "脉象口诀：沉脉主里（内伤），迟脉主寒～对比浮数脉想一想！",
            quiz: {
                question: "沉迟脉通常提示？",
                options: ["表热证", "里寒证", "气滞证", "阴虚证"], correct: 1,
                explainCorrect: "沉脉主里、迟脉主寒，合为里寒之象。",
                explainWrong: "沉迟脉非热、非阴虚，而多提示里寒。"
            }
        },
        diagnosis: { syndrome: "寒湿痹阻", difficulty: 2,
            analysis: "饮酒受寒，寒湿侵袭经络，\n故腰背酸痛，脉沉迟无力。" },
        prescription: {
            name: "独活寄生汤",
            herbs: [{ herbId: 2, dosage: "12g" }, { herbId: 3, dosage: "10g" },
                    { herbId: 6, dosage: "6g" },  { herbId: 7, dosage: "8g" }],
            effect: "祛风除湿，补气养血",
            tips: ["避免受寒", "减少饮酒", "热敷腰部"],
            syndromeHint: "寒湿痹阻 → 需要补气养血、祛湿活血的药材"
        },
        scoreRule: { correctDiagnosis: 50, correctHerbs: 30, correctOrder: 10, quickFinish: 10 }
    }
];

const UI_THEME = {
    primaryColor: "#7A4F2A", secondaryColor: "#D8C3A5", accentColor: "#B23A48",
    fonts: { title: "STKaiti", content: "SimSun" },
    background: { main: "assets/bg/main_bg.jpg", panel: "assets/bg/panel_bg.png" },
    sounds: { bgm: "assets/audio/bgm.mp3", click: "assets/audio/click.wav", success: "assets/audio/success.wav" }
};

window.GAME_CONFIG     = GAME_CONFIG;
window.DIAGNOSIS_STEPS = DIAGNOSIS_STEPS;
window.HERB_LIBRARY    = HERB_LIBRARY;
window.PATIENT_CASES   = PATIENT_CASES;
window.UI_THEME        = UI_THEME;

// ── 主题色常量 ──────────────────────────────────────────────────
const C = {
    panelBg:      0x1C1108,   // 暖棕深色面板
    panelBorder:  0xD4883A,   // 暖金橙色边框
    panelBorder2: 0xEABC78,   // 浅暖金内框
    headerBg:     0x2A1508,   // 标题栏背景
    contentBg:    0x120904,   // 内容区背景
    tabActive:    0x6B3E22,   // 激活标签
    tabDone:      0x2C4A1A,   // 完成标签（橄榄绿）
    tabPending:   0x1C1208,   // 待完成标签
    quizIdle:     0x382012,   // 选项正常
    quizHover:    0x5C3C1C,   // 选项悬停
    quizCorrect:  0x1C5814,   // 答对（绿）
    quizWrong:    0x581414,   // 答错（红）
    quizDimmed:   0x1A1208,   // 其他选项变暗
    btnNormal:    0x4A2410,   // 按钮正常
    btnHover:     0x6E3C1C,   // 按钮悬停
    gold:         '#FFE580',   // 金色文字
    cream:        '#F5E8C8',  // 奶油色文字
    green:        '#8EE870',  // 绿色提示
    red:          '#FF8888',  // 红色提示
    dim:          '#7A6040',  // 暗淡文字
    correct:      '#70EE50',  // 正确高亮
    wrong:        '#FF7070',  // 错误高亮
    hint:         '#F0C060',  // 提示黄
};

// ============================================================
// Phaser 场景类 v2.2
// ============================================================
class DiagnosisMinigame extends Phaser.Scene {
    constructor() { super({ key: 'DiagnosisMinigame' }); }

    init(data) {
        this._sceneData     = data || {};
        this._score         = 0;
        this._answeredSteps = {};
        this._stepChoices   = {};
        this._hintUsed      = {};   // whether hint was used per step
        this._selectedHerbs = [];
        this._currentStep   = 0;
        this._animList      = [];
        this._cg            = null;
        this._revealedQs    = new Set();
        this._tooltipObjs   = null;

        // ★ 店铺模式：轮流切换病例
        this._shopMode = (this._sceneData.mode === 'shop');
        this._shopPatientIndex = typeof this._sceneData.patientIndex === 'number'
            ? this._sceneData.patientIndex : 0;
        this._completedPatients = new Set(
            Array.isArray(this._sceneData.completedPatients) ? this._sceneData.completedPatients : []
        );
    }

    preload() {
        this.load.on('loaderror', () => {});
        PATIENT_CASES.forEach(c => {
            this.load.image(`avatar_${c.id}`, c.patientInfo.avatar);
        });
        PATIENT_CASES.forEach(c => {
            if (c.listening && c.listening.audio) {
                Object.entries(c.listening.audio).forEach(([k, path]) => {
                    this.load.audio(`snd_${c.id}_${k}`, path);
                });
            }
        });
    }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.cameras.main.fadeIn(600, 5, 3, 2);

        this.add.rectangle(W / 2, H / 2, W, H, 0x050302, 0.94).setDepth(0);
        this._spawnParticles(W, H);

        const pw = 1180, ph = 658;
        const px = Math.floor((W - pw) / 2);
        const py = Math.floor((H - ph) / 2);
        this._PX = px; this._PY = py; this._PW = pw; this._PH = ph;
        this._CX = W / 2;

        this._drawPanel(px, py, pw, ph);

        // ★ 根据模式选择病例
        if (this._shopMode) {
            this._caseInfo = PATIENT_CASES[this._shopPatientIndex] || PATIENT_CASES[0];
        } else {
            const pname = this._sceneData.patientName || '';
            this._caseInfo = PATIENT_CASES.find(c => c.patientInfo.name === pname) || PATIENT_CASES[0];
        }

        this._buildHeader(px, py, pw);

        // ★ 店铺模式：构建病人切换器和完成进度
        if (this._shopMode) {
            this._buildPatientSelector(px, py, pw);
        }

        this._tabsY = py + 64;
        this._buildTabs(px, pw);

        const cY = this._tabsY + 47;
        const cH = ph - (cY - py) - 50;
        this._CR = { x: px + 14, y: cY, w: pw - 28, h: cH, cx: px + 14 + (pw - 28) / 2 };

        const cbg = this.add.graphics().setDepth(2);
        cbg.fillStyle(C.contentBg, 0.75);
        cbg.fillRoundedRect(this._CR.x, cY, this._CR.w, cH, 10);
        // subtle inner pattern lines
        for (let i = 1; i < 5; i++) {
            const ly = cY + i * (cH / 5);
            cbg.lineStyle(1, 0x3A2010, 0.08);
            cbg.lineBetween(this._CR.x + 8, ly, this._CR.x + this._CR.w - 8, ly);
        }

        this._cg = this.add.group();

        const btnY = py + ph - 24;
        this._btnPrev = this._mkBtn(W / 2 - 185, btnY, '◀ 上一步', () => this._goPrev());
        this._btnNext = this._mkBtn(W / 2 + 185, btnY, '下一步 ▶', () => this._goNext());
        const closeLabel = this._shopMode ? '🏪 返回药斋' : '✕';
        const closeBtnW = this._shopMode ? 130 : 30;
        this._mkBtn(px + pw - (this._shopMode ? 80 : 24), py + 15, closeLabel,
            () => this._closeScene(),
            { w: closeBtnW, h: 28, fsize: this._shopMode ? '13px' : '15px', depth: 20 });

        this._scoreTxt = this.add.text(W / 2, btnY, '', {
            fontSize: '15px', fontFamily: 'serif', color: C.dim
        }).setOrigin(0.5).setDepth(10);

        this._showStep(0);
    }

    shutdown() {
        this._clearAnimTimers();
        this._hideHerbTooltip();
    }

    // ============================================================
    //  PANEL
    // ============================================================

    _drawPanel(px, py, pw, ph) {
        const g = this.add.graphics().setDepth(1);

        // outer shadow
        g.fillStyle(0x000000, 0.55);
        g.fillRoundedRect(px + 8, py + 8, pw, ph, 18);

        // warm wood-tone fill with layered bands
        g.fillStyle(C.panelBg, 1);
        g.fillRoundedRect(px, py, pw, ph, 16);
        for (let i = 0; i < 5; i++) {
            g.fillStyle(0x7A4018, 0.025 + i * 0.006);
            g.fillRoundedRect(px + 2, py + i * (ph / 5), pw - 4, ph / 5, i===0?14:i===4?14:0);
        }

        // Triple-border frame
        g.lineStyle(3, C.panelBorder, 1);
        g.strokeRoundedRect(px, py, pw, ph, 16);
        g.lineStyle(1.5, C.panelBorder2, 0.4);
        g.strokeRoundedRect(px + 6, py + 6, pw - 12, ph - 12, 12);
        g.lineStyle(1, C.panelBorder, 0.18);
        g.strokeRoundedRect(px + 11, py + 11, pw - 22, ph - 22, 9);

        // Cute plum blossom corners
        [
            [px + 20, py + 20,  1,  1],
            [px + pw - 20, py + 20, -1,  1],
            [px + 20, py + ph - 20,  1, -1],
            [px + pw - 20, py + ph - 20, -1, -1]
        ].forEach(([cx, cy, sx, sy]) => this._drawBlossomCorner(g, cx, cy, sx, sy));
    }

    _drawBlossomCorner(g, cx, cy, sx, sy) {
        const L = 28;
        // Bracket lines
        g.lineStyle(2, C.panelBorder, 0.85);
        g.beginPath(); g.moveTo(cx+sx*L,cy); g.lineTo(cx,cy); g.lineTo(cx,cy+sy*L); g.strokePath();
        g.lineStyle(1, C.panelBorder2, 0.45);
        g.beginPath(); g.moveTo(cx+sx*(L-10),cy+sy*5); g.lineTo(cx+sx*5,cy+sy*5); g.lineTo(cx+sx*5,cy+sy*(L-10)); g.strokePath();

        // 5-petal flower at corner
        const pr = 3, pd = 6;
        g.fillStyle(C.panelBorder2, 0.7);
        g.fillCircle(cx, cy, pr * 0.8); // center
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            g.fillCircle(cx + Math.cos(a) * pd, cy + Math.sin(a) * pd, pr);
        }

        // Line end dots
        g.fillStyle(C.panelBorder, 0.6);
        g.fillCircle(cx + sx * L, cy, 2);
        g.fillCircle(cx, cy + sy * L, 2);
    }

    // ============================================================
    //  HEADER
    // ============================================================

    _buildHeader(px, py, pw) {
        const g = this.add.graphics().setDepth(2);
        const hh = 60;
        g.fillStyle(C.headerBg, 0.92);
        g.fillRoundedRect(px+8, py+8, pw-16, hh, { tl:13, tr:13, bl:0, br:0 });

        // Gold divider with ornament
        g.lineStyle(2, C.panelBorder, 0.75);
        g.lineBetween(px+24, py+8+hh, px+pw-24, py+8+hh);
        // Three diamond accents on divider
        const dY = py+8+hh;
        [this._CX-220, this._CX, this._CX+220].forEach(dx => {
            g.fillStyle(C.panelBorder, 0.7);
            g.fillTriangle(dx, dY-5, dx+5, dY, dx, dY+5);
            g.fillTriangle(dx, dY-5, dx-5, dY, dx, dY+5);
        });

        // Title with floral decoration
        this.add.text(this._CX, py+8+23, '✿  杏林问诊录  ✿', {
            fontSize: '24px', fontFamily: 'serif',
            color: C.gold, stroke: C.headerBg, strokeThickness: 3
        }).setOrigin(0.5).setDepth(3);

        const ci = this._caseInfo ? this._caseInfo.patientInfo : null;
        if (ci) {
            this.add.text(this._CX, py+8+46,
                `患者：${ci.name}　年龄：${ci.age}岁　性别：${ci.gender}　职业：${ci.occupation}`,
                { fontSize: '13px', fontFamily: 'serif', color: '#D4BC8C' }
            ).setOrigin(0.5).setDepth(3);
        }
    }

    // ============================================================
    //  TABS
    // ============================================================

    _buildTabs(px, pw) {
        const ICONS  = ['◉','♩','⁇','♥','✦'];
        const COLORS_ACTIVE = ['#FFE580','#A0E8FF','#FFD0A0','#FF9898','#A0F0A0'];
        const tabW   = Math.floor((pw - 20) / 5);
        const tabH   = 42, tY = this._tabsY;
        this._tabs   = [];

        DIAGNOSIS_STEPS.forEach((name, i) => {
            const tx = px + 10 + i * tabW + tabW / 2;
            const gfx = this.add.graphics().setDepth(2);

            const drawTab = (active, done) => {
                gfx.clear();
                const fillC = active ? C.tabActive : (done ? C.tabDone : C.tabPending);
                const lineC = active ? C.panelBorder : (done ? 0x50A030 : 0x3A2010);
                const lineW = active ? 2 : 1;
                gfx.fillStyle(fillC, active ? 0.96 : 0.82);
                gfx.fillRoundedRect(tx-tabW/2+4, tY, tabW-8, tabH, { tl:10, tr:10, bl:0, br:0 });
                gfx.lineStyle(lineW, lineC, active ? 1 : 0.65);
                gfx.strokeRoundedRect(tx-tabW/2+4, tY, tabW-8, tabH, { tl:10, tr:10, bl:0, br:0 });

                if (done && !active) {
                    // green check dot
                    gfx.fillStyle(0x80E840, 0.8); gfx.fillCircle(tx+tabW/2-15, tY+9, 6);
                    gfx.lineStyle(2, 0x50FF30, 0.9); gfx.beginPath();
                    gfx.moveTo(tx+tabW/2-18, tY+9); gfx.lineTo(tx+tabW/2-15, tY+12.5); gfx.lineTo(tx+tabW/2-11, tY+5.5);
                    gfx.strokePath();
                }
            };
            drawTab(i===0, false);

            const icon  = this.add.text(tx, tY+12, ICONS[i], {
                fontSize: '13px', color: i===0 ? COLORS_ACTIVE[0] : C.dim
            }).setOrigin(0.5).setDepth(3).setName(`tabIcon${i}`);
            const label = this.add.text(tx, tY+29, name, {
                fontSize: '16px', fontFamily: 'serif',
                color: i===0 ? C.gold : C.dim
            }).setOrigin(0.5).setDepth(3).setName(`tabLabel${i}`);

            this._tabs.push({ gfx, drawTab, tx, icon, label, activeColor: COLORS_ACTIVE[i] });
        });
    }

    _refreshTabs() {
        this._tabs.forEach((t, i) => {
            const active = i === this._currentStep;
            const done   = !!this._answeredSteps[i];
            t.drawTab(active, done);
            t.label.setColor(active ? C.gold : (done ? '#A8E080' : C.dim));
            t.label.setAlpha(done && !active ? 0.8 : 1);
            t.icon.setColor(active ? t.activeColor : (done ? '#80D060' : C.dim));
        });
    }

    // ============================================================
    //  STEP DISPATCHER
    // ============================================================

    _showStep(idx) {
        this._clearAnimTimers();
        this._hideHerbTooltip();
        this._cg.clear(true, true);
        this._currentStep = idx;
        this._refreshTabs();
        this._updateNavBtns();

        if      (idx === 0) this._renderInspection();
        else if (idx === 1) this._renderListening();
        else if (idx === 2) this._renderInquiry();
        else if (idx === 3) this._renderPulse();
        else                this._renderPrescription();

        this._updateScoreHUD();
    }

    // ============================================================
    //  TWO-COLUMN BASE LAYOUT
    // ============================================================

    _renderTwoColumn(stepIdx) {
        const ci  = this._caseInfo;
        const sd  = this._stepData(stepIdx, ci);
        const box = this._CR;
        const LCOL_W = Math.floor(box.w * 0.42);
        const RCOL_W = box.w - LCOL_W - 28;
        const splitX = box.x + LCOL_W;
        const LCX    = box.x + LCOL_W / 2;
        const RLX    = splitX + 16;
        const TY     = box.y + 12;

        const stepLabels = ['观色辨神','听声辨气','询其病由','察指辨脉','开方炼藏'];
        const titleT = this.add.text(box.cx, TY,
            `【${DIAGNOSIS_STEPS[stepIdx]}诊】 ${stepLabels[stepIdx]}`, {
                fontSize: '20px', fontFamily: 'serif', color: C.gold,
                fontStyle: 'bold', stroke: '#0A0500', strokeThickness: 2
            }).setOrigin(0.5, 0).setDepth(3);
        this._cg.add(titleT);

        const bodyY = TY + titleT.height + 12;
        // Fancy divider with center flower
        const divG = this.add.graphics().setDepth(2);
        divG.lineStyle(1.5, C.panelBorder, 0.3);
        divG.lineBetween(splitX, bodyY-4, splitX, box.y+box.h-8);
        this._cg.add(divG);

        if (sd.quiz) this._buildQuizBlock(LCX, bodyY, LCOL_W-20, sd.quiz, stepIdx, sd.hint);

        let ry = bodyY;
        if (sd.description) {
            const descT = this.add.text(RLX, ry, sd.description, {
                fontSize: '14px', fontFamily: 'serif', color: C.cream,
                wordWrap: { width: RCOL_W }, lineSpacing: 7
            }).setDepth(3);
            this._cg.add(descT);
            ry += descT.height + 14;
        }
        if (sd.clues && sd.clues.length > 0 && sd.clues[0] !== '') {
            const clLbl = this.add.text(RLX, ry, '🔍 观察所得：', {
                fontSize: '13px', fontFamily: 'serif', color: '#D4A860', fontStyle: 'italic'
            }).setDepth(3);
            this._cg.add(clLbl);
            ry += clLbl.height + 4;
            sd.clues.forEach(clue => {
                const clItem = this.add.text(RLX+10, ry, `• ${clue}`, {
                    fontSize: '13px', fontFamily: 'serif', color: '#8EE88E',
                    wordWrap: { width: RCOL_W-14 }
                }).setDepth(3);
                this._cg.add(clItem);
                ry += clItem.height + 5;
            });
            ry += 8;
        }
        return { LCX, RLX, RCOL_W, ry, bodyY };
    }

    // ============================================================
    //  望诊
    // ============================================================

    _renderInspection() {
        const { RLX, RCOL_W, ry } = this._renderTwoColumn(0);
        const ci  = this._caseInfo;
        const key = `avatar_${ci.id}`;
        const imgCX  = RLX + RCOL_W / 2 - 8;
        const imgTop = ry + 8;
        const maxW   = RCOL_W - 20;
        const maxH   = this._CR.y + this._CR.h - imgTop - 24;

        const _tex = this.textures.exists(key) ? this.textures.get(key) : null;
        const hasImg = _tex && _tex.key !== '__MISSING' &&
                       _tex.source && _tex.source[0] && _tex.source[0].width > 1;

        if (hasImg) {
            const img = this.add.image(imgCX, imgTop + maxH / 2, key);
            const scale = Math.min(maxW / img.width, maxH / img.height, 1);
            img.setScale(scale).setDepth(3);
            this._cg.add(img);
            const fw = img.displayWidth + 14, fh = img.displayHeight + 14;
            const frameG = this.add.graphics().setDepth(4);
            frameG.lineStyle(2, C.panelBorder, 0.6);
            frameG.strokeRoundedRect(imgCX-fw/2, imgTop+maxH/2-fh/2, fw, fh, 8);
            frameG.lineStyle(1, C.panelBorder2, 0.3);
            frameG.strokeRoundedRect(imgCX-fw/2-4, imgTop+maxH/2-fh/2-4, fw+8, fh+8, 11);
            this._cg.add(frameG);
            const capT = this.add.text(imgCX, imgTop+maxH/2+fh/2+9,
                `${ci.patientInfo.name}　${ci.patientInfo.age}岁`, {
                    fontSize: '12px', fontFamily: 'serif', color: '#B09060', fontStyle: 'italic'
                }).setOrigin(0.5, 0).setDepth(4);
            this._cg.add(capT);
        } else {
            this._drawPortraitPlaceholder(imgCX, imgTop + maxH / 2, maxW, maxH, ci);
        }
    }

    _drawPortraitPlaceholder(cx, cy, maxW, maxH, ci) {
        const g = this.add.graphics().setDepth(3);
        const pw = Math.min(maxW-10, 120), ph = Math.min(maxH-10, 155);
        g.fillStyle(0x1E1208, 0.72); g.fillRoundedRect(cx-pw/2, cy-ph/2, pw, ph, 10);
        g.lineStyle(1.5, C.panelBorder, 0.5); g.strokeRoundedRect(cx-pw/2, cy-ph/2, pw, ph, 10);
        const r = pw * 0.22;
        g.fillStyle(0x9A7050, 0.65); g.fillCircle(cx, cy-ph*0.22, r);
        g.lineStyle(1, '#C0A060', 0.4); g.strokeCircle(cx, cy-ph*0.22, r);
        g.fillStyle(0x7A5030, 0.5); g.fillEllipse(cx, cy+ph*0.15, pw*0.58, ph*0.46);
        g.fillStyle(0xFF6050, 0.22);
        g.fillCircle(cx-r*0.58, cy-ph*0.22+r*0.1, r*0.28);
        g.fillCircle(cx+r*0.58, cy-ph*0.22+r*0.1, r*0.28);
        const capT = this.add.text(cx, cy+ph/2+9,
            `${ci.patientInfo.name}　${ci.patientInfo.age}岁`, {
                fontSize: '12px', fontFamily: 'serif', color: '#B09060', fontStyle: 'italic'
            }).setOrigin(0.5, 0).setDepth(3);
        this._cg.add(capT);
        this._cg.add(g);
    }

    // ============================================================
    //  闻诊
    // ============================================================

    _renderListening() {
        const { RLX, RCOL_W, ry } = this._renderTwoColumn(1);
        this._buildSoundBars(RLX, ry + 8, RCOL_W - 8, 58);
        const ci = this._caseInfo;
        const LABELS = { cough: '播放咳嗽声', voice: '播放声音' };
        let audioY = ry + 80;
        if (ci.listening && ci.listening.audio) {
            Object.keys(ci.listening.audio).forEach(type => {
                this._buildAudioBtn(RLX + (RCOL_W-8)/2, audioY, `snd_${ci.id}_${type}`, LABELS[type] || `播放${type}`);
                audioY += 44;
            });
        }
    }

    _buildSoundBars(x, y, maxW, h) {
        const barW = 10, gap = 5;
        const count = Math.floor((maxW-12)/(barW+gap));
        const hs = Array.from({length:count},()=>Math.random()*h*0.65+h*0.12);
        const bg = this.add.graphics().setDepth(2);
        bg.fillStyle(0x080F08, 0.65); bg.fillRoundedRect(x,y,maxW,h+12,8);
        bg.lineStyle(1,0x204018,0.5); bg.strokeRoundedRect(x,y,maxW,h+12,8);
        this._cg.add(bg);
        const barG = this.add.graphics().setDepth(3);
        this._cg.add(barG);
        const draw = () => {
            barG.clear();
            hs.forEach((bh,i)=>{
                const ratio=bh/h;
                const col=ratio>0.72?0xFF6060:ratio>0.44?0xFFAA40:0x50CC50;
                barG.fillStyle(col,0.78);
                barG.fillRoundedRect(x+6+i*(barW+gap),y+6+h-bh,barW,bh,3);
            });
        };
        draw();
        const t = this.time.addEvent({
            delay:110, loop:true,
            callback:()=>{ hs.forEach((_,i)=>{hs[i]=Math.max(h*0.1,Math.min(h,hs[i]+(Math.random()-0.5)*h*0.32));}); draw(); }
        });
        this._animList.push(t);
        const lbl = this.add.text(x+maxW/2, y+h+16, '声息频谱', {
            fontSize: '12px', fontFamily: 'serif', color: '#60A060', fontStyle: 'italic'
        }).setOrigin(0.5,0).setDepth(3);
        this._cg.add(lbl);
    }

    _buildAudioBtn(x, y, audioKey, label) {
        const available = this.cache.audio.exists(audioKey);
        let isPlaying = false, snd = null;
        const btn = this._mkBtn(x, y, available ? `▶ ${label}` : `${label}（暂缺）`, () => {
            if (!available) return;
            if (!snd) snd = this.sound.add(audioKey);
            if (isPlaying) {
                snd.stop(); isPlaying = false;
                btn.t.setText(`▶ ${label}`); btn.t.setColor(C.gold);
            } else {
                snd.play(); isPlaying = true;
                btn.t.setText('■ 停止播放'); btn.t.setColor('#FF9090');
                snd.once('complete', () => { isPlaying=false; if(btn.t&&btn.t.active){btn.t.setText(`▶ ${label}`);btn.t.setColor(C.gold);} });
            }
        }, { w: 168, h: 34 });
        [btn.g, btn.t, btn.hit].forEach(el => this._cg.add(el));
        return btn;
    }

    // ============================================================
    //  问诊  —— 点击揭示
    // ============================================================

    _renderInquiry() {
        const ci  = this._caseInfo;
        const box = this._CR;
        const LCOL_W = Math.floor(box.w * 0.42);
        const RCOL_W = box.w - LCOL_W - 28;
        const splitX = box.x + LCOL_W;
        const LCX    = box.x + LCOL_W / 2;
        const RLX    = splitX + 16;
        const TY     = box.y + 12;

        const titleT = this.add.text(box.cx, TY, '【问诊】 询其病由', {
            fontSize: '20px', fontFamily: 'serif', color: C.gold,
            fontStyle: 'bold', stroke: '#0A0500', strokeThickness: 2
        }).setOrigin(0.5,0).setDepth(3);
        this._cg.add(titleT);

        const bodyY = TY + titleT.height + 12;
        const divG  = this.add.graphics().setDepth(2);
        divG.lineStyle(1.5, C.panelBorder, 0.3);
        divG.lineBetween(splitX, bodyY-4, splitX, box.y+box.h-8);
        this._cg.add(divG);

        if (ci.inquiry && ci.inquiry.quiz) {
            this._buildQuizBlock(LCX, bodyY, LCOL_W-20, ci.inquiry.quiz, 2, ci.inquiry.hint);
        }

        let ry = bodyY;
        const qs = (ci.inquiry && ci.inquiry.questions) ? ci.inquiry.questions : [];

        const promptT = this.add.text(RLX+(RCOL_W-8)/2, ry, '← 点击问题，向患者询问 ～', {
            fontSize: '12px', fontFamily: 'serif', color: '#907058', fontStyle: 'italic'
        }).setOrigin(0.5,0).setDepth(3);
        this._cg.add(promptT);
        ry += promptT.height + 6;

        qs.forEach((qa, qIdx) => {
            const revealed = this._revealedQs.has(qIdx);
            const qBg = this.add.graphics().setDepth(2);
            const qT  = this.add.text(RLX+10, ry+7, `问：${qa.question}`, {
                fontSize: '13px', fontFamily: 'serif',
                color: revealed ? '#FFFFC8' : C.cream,
                wordWrap: { width: RCOL_W-28 }
            }).setDepth(4);
            this._cg.add(qT);
            const qBh = qT.height + 14;

            const drawQBg = (hov) => {
                qBg.clear();
                qBg.fillStyle(hov?0x5E3E1E:0x4A2C10, hov?0.85:0.68);
                qBg.fillRoundedRect(RLX,ry,RCOL_W-8,qBh,8);
                if (!revealed) {
                    qBg.lineStyle(1, hov?C.panelBorder:0x7A5020, hov?0.9:0.45);
                    qBg.strokeRoundedRect(RLX,ry,RCOL_W-8,qBh,8);
                    qBg.fillStyle(C.panelBorder, hov?0.7:0.3);
                    qBg.fillTriangle(RLX+RCOL_W-20,ry+qBh/2-5,RLX+RCOL_W-20,ry+qBh/2+5,RLX+RCOL_W-12,ry+qBh/2);
                }
            };
            drawQBg(false);
            this._cg.add(qBg);

            const aTop = ry+qBh+4;
            const aBg  = this.add.graphics().setDepth(2);
            const aT   = this.add.text(RLX+14, aTop+7, `答：${qa.answer}`, {
                fontSize: '13px', fontFamily: 'serif', color: '#8EE888',
                wordWrap: { width: RCOL_W-28 }
            }).setDepth(4);
            this._cg.add(aT);
            const aBh = aT.height + 14;
            aBg.fillStyle(0x1A3C14, 0.68);
            aBg.fillRoundedRect(RLX,aTop,RCOL_W-8,aBh,8);
            this._cg.add(aBg);

            if (!revealed) {
                aBg.setAlpha(0); aT.setAlpha(0);
                const zone = this.add.zone(RLX,ry,RCOL_W-8,qBh).setInteractive({useHandCursor:true}).setOrigin(0,0).setDepth(5);
                this._cg.add(zone);
                zone.on('pointerover',()=>drawQBg(true));
                zone.on('pointerout',()=>drawQBg(false));
                zone.on('pointerdown',()=>{
                    this._revealedQs.add(qIdx); zone.removeInteractive(); drawQBg(false);
                    qT.setColor('#FFFFC8');
                    this.tweens.add({targets:[aBg,aT],alpha:1,duration:320,ease:'Power2'});
                });
            }
            ry += qBh + 4 + aBh + 8;
        });
    }

    // ============================================================
    //  切诊  —— 动态脉象
    // ============================================================

    _renderPulse() {
        const { RLX, RCOL_W, ry } = this._renderTwoColumn(3);
        const wH=84, wY=ry+8;
        const wBg=this.add.graphics().setDepth(2);
        wBg.fillStyle(0x060F06,0.88); wBg.fillRoundedRect(RLX,wY,RCOL_W-8,wH,8);
        wBg.lineStyle(1.5,0x1A4018,0.7); wBg.strokeRoundedRect(RLX,wY,RCOL_W-8,wH,8);
        this._cg.add(wBg);
        const gridG=this.add.graphics().setDepth(3);
        gridG.lineStyle(1,0x1E3A1A,0.3);
        for(let i=1;i<4;i++) gridG.lineBetween(RLX+4,wY+i*wH/4,RLX+RCOL_W-12,wY+i*wH/4);
        for(let i=1;i<8;i++){const gx=RLX+4+i*(RCOL_W-20)/8; gridG.lineBetween(gx,wY+4,gx,wY+wH-4);}
        this._cg.add(gridG);
        const pType=this._caseInfo.pulse?this._caseInfo.pulse.pulseType:'平';
        const lblT=this.add.text(RLX+(RCOL_W-8)/2,wY+wH+9,`脉象：${pType} ── 指下感应`,{
            fontSize:'13px',fontFamily:'serif',color:'#60C860',fontStyle:'italic'
        }).setOrigin(0.5,0).setDepth(3);
        this._cg.add(lblT);
        const waveG=this.add.graphics().setDepth(4);
        this._cg.add(waveG);
        this._pulseArea={x:RLX+5,y:wY+5,w:RCOL_W-23,h:wH-10};
        const pd=this._caseInfo.pulse;
        const speed=pd&&pd.pulseAnimation?pd.pulseAnimation.speed:1;
        const intensity=pd&&pd.pulseAnimation?pd.pulseAnimation.intensity:0.8;
        let phase=0;
        const pt=this.time.addEvent({delay:38,loop:true,callback:()=>{phase+=0.055*speed;this._drawPulseWave(waveG,this._pulseArea,phase,intensity);}});
        this._animList.push(pt);
    }

    _drawPulseWave(g,area,phase,intensity){
        const{x,y,w,h}=area; g.clear(); const cy=y+h/2;
        g.lineStyle(5,0x306A40,0.18); g.beginPath();
        for(let i=0;i<=w;i+=3){const wy=cy-this._pulseVal(i,w,phase,intensity,h);if(i===0)g.moveTo(x+i,wy);else g.lineTo(x+i,wy);}
        g.strokePath();
        g.lineStyle(2,0x50FF90,0.92); g.beginPath();
        for(let i=0;i<=w;i++){const wy=cy-this._pulseVal(i,w,phase,intensity,h);if(i===0)g.moveTo(x+i,wy);else g.lineTo(x+i,wy);}
        g.strokePath();
        const tipX=x+(phase*75%w),tipY=cy-this._pulseVal(phase*75%w,w,phase,intensity,h);
        g.fillStyle(0xB0FFB8,0.85); g.fillCircle(tipX,tipY,3);
    }

    _pulseVal(px,w,phase,intensity,h){
        let val=Math.sin((px/w)*Math.PI*6-phase*2)*h*0.14*intensity;
        const sC=((phase*75+w*0.5)%w),per=w/3;
        const d=Math.min(Math.abs(px-sC),Math.abs(px-(sC+per)%w),Math.abs(px-((sC-per+w*3)%w)));
        return val+Math.exp(-d*d/170)*h*0.4*intensity;
    }

    // ============================================================
    //  QUIZ BLOCK  —— 含提示按钮，无计时器
    // ============================================================

    _buildQuizBlock(lcx, topY, maxW, quiz, stepIdx, hintText) {
        let y = topY;

        // Section header with cute style
        const hdrBg = this.add.graphics().setDepth(2);
        hdrBg.fillStyle(0x3A2410, 0.6); hdrBg.fillRoundedRect(lcx-maxW/2, y, maxW, 22, 6);
        this._cg.add(hdrBg);
        const hdr = this.add.text(lcx, y+11, '✦ 考考你', {
            fontSize: '13px', fontFamily: 'serif', color: C.hint, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);
        this._cg.add(hdr);
        y += 28;

        const qT = this.add.text(lcx, y, quiz.question, {
            fontSize: '14px', fontFamily: 'serif', color: C.cream,
            align: 'center', wordWrap: { width: maxW-14 }, lineSpacing: 6
        }).setOrigin(0.5,0).setDepth(3);
        this._cg.add(qT);
        y += qT.height + 14;

        const optW = Math.max(188, maxW-28);
        const optH = 40, optGap = 9;
        const answered = !!this._answeredSteps[stepIdx];
        const btnRefs  = [];

        quiz.options.forEach((opt, i) => {
            const btn = this._createOptionBtn(lcx, y+optH/2, optW, optH, opt, () => {
                if (this._answeredSteps[stepIdx]) return;
                this._answeredSteps[stepIdx] = true;
                this._stepChoices[stepIdx]   = i;

                const ok = i === quiz.correct;

                // visual feedback
                btnRefs.forEach((ref, j) => {
                    if (j === quiz.correct)       ref.setCorrect();
                    else if (j === i && !ok)      ref.setWrong();
                    else                          ref.setDimmed();
                });

                const hintPenalty = this._hintUsed[stepIdx] ? 5 : 0;
                if (ok) {
                    const pts = 20 - hintPenalty;
                    this._score += pts;
                    this._showFloat(`+${pts}`, lcx + optW/2 - 16, y - 8, '#90FF90');
                }
                this._updateScoreHUD();
                this._refreshTabs();
                this._showFeedbackPopup(ok, ok ? quiz.explainCorrect : quiz.explainWrong);
            });
            btnRefs.push(btn);
            btn.all.forEach(el => this._cg.add(el));
            y += optH + optGap;
        });

        // Restore state when revisiting
        if (answered && this._stepChoices[stepIdx] !== undefined) {
            const chosen = this._stepChoices[stepIdx];
            btnRefs.forEach((ref, j) => {
                if (j === quiz.correct)                          ref.setCorrect();
                else if (j === chosen && chosen !== quiz.correct) ref.setWrong();
                else                                             ref.setDimmed();
            });
        }

        // Hint button (only shown before answering)
        if (!answered && hintText) {
            const hintUsed = !!this._hintUsed[stepIdx];
            const hintBtn  = this._mkBtn(lcx, y + 14, hintUsed ? '已查看提示' : '💡 提示 (-5分)', () => {
                if (this._hintUsed[stepIdx]) return;
                this._hintUsed[stepIdx] = true;
                hintBtn.t.setText('已查看提示'); hintBtn.t.setColor(C.dim);
                this._showHintBubble(lcx, y + 36, maxW, hintText);
            }, { w: 138, h: 30, fsize: '13px', depth: 4, colorN: 0x2A3A1A, colorH: 0x3A5028, borderC: 0x70A040 });
            [hintBtn.g, hintBtn.t, hintBtn.hit].forEach(el => this._cg.add(el));
        }
    }

    _showHintBubble(cx, y, maxW, text) {
        const bg = this.add.graphics().setDepth(3);
        const tw = maxW - 12;
        const txt = this.add.text(cx, y+10, `💡 ${text}`, {
            fontSize: '12px', fontFamily: 'serif', color: C.hint,
            align: 'center', wordWrap: { width: tw-20 }, lineSpacing: 5
        }).setOrigin(0.5,0).setDepth(4);
        this._cg.add(txt);
        const bh = txt.height + 20;
        bg.fillStyle(0x2A3A10, 0.88); bg.fillRoundedRect(cx-tw/2, y, tw, bh, 8);
        bg.lineStyle(1.5, 0x70A040, 0.8); bg.strokeRoundedRect(cx-tw/2, y, tw, bh, 8);
        this._cg.add(bg);
        // Re-depth: bg should be behind text
        bg.setDepth(3); txt.setDepth(4);

        // Fade in
        bg.setAlpha(0); txt.setAlpha(0);
        this.tweens.add({ targets: [bg, txt], alpha: 1, duration: 300, ease: 'Power2' });
    }

    // ============================================================
    //  药诊  —— 按类别分组 + 悬停知识卡
    // ============================================================

    _renderPrescription() {
        const box = this._CR;
        const ci  = this._caseInfo;
        const rx  = ci.prescription;
        let gy    = box.y + 10;

        const titleT = this.add.text(box.cx, gy, '【药】 开方炼藏', {
            fontSize: '20px', fontFamily: 'serif', color: C.gold, fontStyle: 'bold',
            stroke: '#0A0500', strokeThickness: 2
        }).setOrigin(0.5,0).setDepth(3);
        this._cg.add(titleT);
        gy += titleT.height + 5;

        // Syndrome + hint
        const synthT = this.add.text(box.cx, gy,
            `辨证：${ci.diagnosis.syndrome}　　治则：${rx?rx.effect:'调理身体'}`, {
                fontSize: '14px', fontFamily: 'serif', color: '#D0B880'
            }).setOrigin(0.5,0).setDepth(3);
        this._cg.add(synthT);
        gy += synthT.height + 3;

        if (rx && rx.syndromeHint) {
            const shintT = this.add.text(box.cx, gy, `✦ ${rx.syndromeHint}`, {
                fontSize: '12px', fontFamily: 'serif', color: C.hint, fontStyle: 'italic'
            }).setOrigin(0.5,0).setDepth(3);
            this._cg.add(shintT);
            gy += shintT.height + 3;
        }

        const hintT = this.add.text(box.cx, gy,
            `↓ 从下方 ${HERB_LIBRARY.length} 味药材中选取 ${rx.herbs.length} 味　（悬停查看药性）`, {
                fontSize: '12px', fontFamily: 'serif', color: C.dim, fontStyle: 'italic'
            }).setOrigin(0.5,0).setDepth(3);
        this._cg.add(hintT);
        gy += hintT.height + 10;

        // 4-column grid
        const cols=4, gapX=8, gapY=7;
        const cellW = Math.floor((box.w-gapX*(cols-1)-20)/cols);
        const cellH = 54;

        HERB_LIBRARY.forEach((h, i) => {
            const col=i%cols, row=Math.floor(i/cols);
            const cx=box.x+10+col*(cellW+gapX)+cellW/2;
            const cy=gy+row*(cellH+gapY)+cellH/2;
            const sel=this._selectedHerbs.includes(h.id);
            this._mkHerbCell(cx,cy,cellW,cellH,h,sel).all.forEach(el=>this._cg.add(el));
        });

        const gridH = Math.ceil(HERB_LIBRARY.length/cols)*(cellH+gapY);
        gy += gridH + 10;

        this._rxCountTxt = this.add.text(box.cx, gy,
            `已选药材：${this._selectedHerbs.length} / ${rx.herbs.length}`, {
                fontSize: '15px', fontFamily: 'serif', color: '#FFE4A0'
            }).setOrigin(0.5,0).setDepth(3);
        this._cg.add(this._rxCountTxt);

        const confirmBtn = this._mkBtn(box.cx, gy+32, '确认开方 ✿', () => {
            if (this._selectedHerbs.length===0) return;
            if (this._answeredSteps[4]) return;
            this._answeredSteps[4]=true;
            this._hideHerbTooltip();
            this._checkPrescription();
        }, { depth:5 });
        [confirmBtn.g, confirmBtn.t, confirmBtn.hit].forEach(el=>this._cg.add(el));
    }

    _mkHerbCell(x, y, w, h, herb, selected) {
        const TYPE_COLS = {
            '补气':0x3A6A28,'补血':0x6A2828,'清热':0x284A6A,
            '理气':0x5A3A18,'活血':0x6A1A50,'解表':0x2A5A34,
            '利湿':0x2A5A6A,'补阴':0x4A285A
        };
        const tCol=TYPE_COLS[herb.type]||0x3A3018;
        const g=this.add.graphics().setDepth(3);

        const draw=(sel,hov)=>{
            g.clear();
            g.fillStyle(sel?0x274C18:(hov?tCol:0x1A1008), sel?0.95:hov?0.68:0.88);
            g.fillRoundedRect(x-w/2,y-h/2,w,h,9);
            g.lineStyle(sel?2.5:1.2, sel?0x70E050:(hov?C.panelBorder:0x5A3818), 1);
            g.strokeRoundedRect(x-w/2,y-h/2,w,h,9);
            g.fillStyle(tCol, sel?0.92:0.58);
            g.fillRoundedRect(x-w/2,y-h/2,5,h,{tl:9,tr:0,bl:9,br:0});
        };
        draw(selected, false);

        const nameT=this.add.text(x,y-9,`${selected?'✓ ':''}${herb.name}  (${herb.type})`,{
            fontSize:'13px',fontFamily:'serif',color:selected?'#80E860':'#E8D4A8'
        }).setOrigin(0.5).setDepth(4);
        const effT=this.add.text(x,y+11,herb.effect,{
            fontSize:'11px',fontFamily:'serif',color:'#907850'
        }).setOrigin(0.5).setDepth(4);

        const zone=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true}).setDepth(5);
        zone.on('pointerover',()=>{ draw(this._selectedHerbs.includes(herb.id),true); this._showHerbTooltip(x,y-h/2,herb); });
        zone.on('pointerout', ()=>{ draw(this._selectedHerbs.includes(herb.id),false); this._hideHerbTooltip(); });
        zone.on('pointerdown',()=>{
            if(this._answeredSteps[4]) return;
            const idx=this._selectedHerbs.indexOf(herb.id);
            if(idx>=0) this._selectedHerbs.splice(idx,1); else this._selectedHerbs.push(herb.id);
            const sel=this._selectedHerbs.includes(herb.id);
            draw(sel,false);
            nameT.setText(`${sel?'✓ ':''}${herb.name}  (${herb.type})`);
            nameT.setColor(sel?'#80E860':'#E8D4A8');
            if(this._rxCountTxt) this._rxCountTxt.setText(`已选药材：${this._selectedHerbs.length} / ${this._caseInfo.prescription.herbs.length}`);
        });
        return { all:[g,nameT,effT,zone] };
    }

    // ============================================================
    //  药材知识弹窗  —— 双阶段测高，解决溢出
    // ============================================================

    _showHerbTooltip(cellX, cellTopY, herb) {
        this._hideHerbTooltip();
        const W = this.cameras.main.width, H = this.cameras.main.height;
        const tw = 256, padW = 14, padH = 12;
        const isCorrect = this._caseInfo.prescription.herbs.some(h2 => h2.herbId === herb.id);
        const TEMP_COLS = { '寒':'#60B0FF','微寒':'#90C8FF','凉':'#A8D8FF','平':'#D8D880','温':'#FFB070','热':'#FF7050' };
        const tempCol = TEMP_COLS[herb.temperature] || '#D0D0A0';
        const hintStr = isCorrect ? '✓ 此方对证药材' : '— 仔细考虑是否对症';
        const hintCol = isCorrect ? '#80EE60' : '#907060';
        const knowledge = herb.knowledge || herb.effect;

        // ── Pass 1: create invisible text to measure real heights ──
        const _t1 = this.add.text(0, -2000, `【${herb.name}】`, { fontSize:'15px', fontFamily:'serif' });
        const _t2 = this.add.text(0, -2000, `药性：${herb.temperature}　归类：${herb.type}`, { fontSize:'12px', fontFamily:'serif' });
        const _t3 = this.add.text(0, -2000, knowledge, {
            fontSize: '12px', fontFamily: 'serif', wordWrap: { width: tw - padW * 2, useAdvancedWrap: true }, lineSpacing: 4
        });
        const _t4 = this.add.text(0, -2000, hintStr, { fontSize:'11px', fontFamily:'serif' });
        const h1=_t1.height, h2=_t2.height, h3=_t3.height, h4=_t4.height;
        [_t1,_t2,_t3,_t4].forEach(t=>t.destroy());

        // ── Compute layout ────────────────────────────────────────
        // Chinese serif fonts often render taller than measured; add safety margins
        const headerH = padH + h1 + 10;
        const bodyH   = h2 + 8 + h3 + 16;  // extra 8px bottom buffer for t3
        const footerH = h4 + padH + 8;      // extra 8px below hint text
        const th      = headerH + bodyH + footerH;

        // ── Position (above cell, clamp to screen) ────────────────
        let tx = Math.max(8, Math.min(W-tw-8, cellX-tw/2));
        let ty = cellTopY - th - 10;
        if (ty < 40) ty = cellTopY + 62;
        ty = Math.max(8, Math.min(H-th-8, ty));

        // ── Draw background with accurate height ──────────────────
        const g = this.add.graphics().setDepth(22);
        g.fillStyle(0x000000, 0.42); g.fillRoundedRect(tx+3, ty+3, tw, th, 12); // shadow
        g.fillStyle(0x100806, 0.98); g.fillRoundedRect(tx, ty, tw, th, 12);
        g.lineStyle(2, isCorrect?0x68D040:C.panelBorder, 0.95);
        g.strokeRoundedRect(tx, ty, tw, th, 12);
        g.lineStyle(1, isCorrect?0x48A028:0x8A5820, 0.3);
        g.strokeRoundedRect(tx+4, ty+4, tw-8, th-8, 9);
        // header bar
        g.fillStyle(isCorrect?0x1E4C12:0x3E2A0C, 0.95);
        g.fillRoundedRect(tx+2, ty+2, tw-4, headerH-2, {tl:11,tr:11,bl:0,br:0});
        // header/body divider
        g.lineStyle(1, isCorrect?0x4A8028:C.panelBorder, 0.5);
        g.lineBetween(tx+padW, ty+headerH, tx+tw-padW, ty+headerH);
        // footer divider
        g.lineStyle(1, 0x5A3A18, 0.35);
        g.lineBetween(tx+padW, ty+headerH+bodyH+2, tx+tw-padW, ty+headerH+bodyH+2);

        // ── Real text at measured positions ───────────────────────
        const t1 = this.add.text(tx+tw/2, ty+padH, `【${herb.name}】`, {
            fontSize: '15px', fontFamily: 'serif', color: C.gold, fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(23);

        const t2 = this.add.text(tx+tw/2, ty+headerH+6, `药性：${herb.temperature}　归类：${herb.type}`, {
            fontSize: '12px', fontFamily: 'serif', color: tempCol
        }).setOrigin(0.5, 0).setDepth(23);

        const t3 = this.add.text(tx+padW, ty+headerH+6+h2+8, knowledge, {
            fontSize: '12px', fontFamily: 'serif', color: '#E8D8B0',
            wordWrap: { width: tw-padW*2, useAdvancedWrap: true }, lineSpacing: 4
        }).setOrigin(0, 0).setDepth(23);

        const t4 = this.add.text(tx+tw/2, ty+headerH+bodyH+8, hintStr, {
            fontSize: '11px', fontFamily: 'serif', color: hintCol, fontStyle: 'italic'
        }).setOrigin(0.5, 0).setDepth(23);

        this._tooltipObjs = [g, t1, t2, t3, t4];
    }

    _hideHerbTooltip() {
        if (this._tooltipObjs) {
            this._tooltipObjs.forEach(o => { if (o && o.active) o.destroy(); });
            this._tooltipObjs = null;
        }
    }

    _checkPrescription() {
        const rx=this._caseInfo.prescription;
        const correctIds=rx.herbs.map(h=>h.herbId).sort((a,b)=>a-b);
        const picked=[...this._selectedHerbs].sort((a,b)=>a-b);
        const allHit=correctIds.every(id=>picked.includes(id));
        const noExtra=picked.length===correctIds.length;
        const perfect=allHit&&noExtra;
        let pts=0, msg='';
        if(perfect){
            pts=25; msg=`✔ 药方准确！\n\n${rx.name}\n${rx.effect}`;
        } else if(allHit&&!noExtra){
            pts=15;
            const extras=picked.filter(id=>!correctIds.includes(id)).map(id=>HERB_LIBRARY.find(h=>h.id===id)?.name||id).join('、');
            msg=`□ 药材基本正确，但多加了：${extras}`;
        } else if(picked.some(id=>correctIds.includes(id))){
            pts=8;
            const missing=correctIds.filter(id=>!picked.includes(id)).map(id=>HERB_LIBRARY.find(h=>h.id===id)?.name||id).join('、');
            msg=`□ 部分正确，缺少：${missing}`;
        } else {
            pts=0; msg='✘ 药方不对，可以重新考虑哦 ～';
        }
        this._score+=pts;
        this._updateScoreHUD();
        this._showFeedbackPopup(perfect, msg);
    }

    // ============================================================
    //  SCORE HUD
    // ============================================================

    _updateScoreHUD() {
        if (this._scoreTxt) this._scoreTxt.setText(`本局得分：${this._score}`);
    }

    _showFloat(text, x, y, color) {
        const t = this.add.text(x, y, text, {
            fontSize:'18px',fontFamily:'serif',color,fontStyle:'bold',stroke:'#000000',strokeThickness:2
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({targets:t,y:y-58,alpha:0,duration:850,ease:'Power2',onComplete:()=>t.destroy()});
    }

    // ============================================================
    //  FEEDBACK POPUP  —— 精致动画弹窗
    // ============================================================

    _showFeedbackPopup(correct, text) {
        const W=this.cameras.main.width, H=this.cameras.main.height;
        const pw=520, ph=230;
        const px=(W-pw)/2, py=(H-ph)/2;

        const block=this.add.rectangle(W/2,H/2,W,H,0x000000,0.5).setDepth(18);
        const g=this.add.graphics().setDepth(19);

        // Background
        g.fillStyle(correct?0x162810:0x381010, 0.98);
        g.fillRoundedRect(px,py,pw,ph,16);
        // Border
        g.lineStyle(3, correct?0x68E040:0xFF6868, 1);
        g.strokeRoundedRect(px,py,pw,ph,16);
        g.lineStyle(1.5, correct?0x90F070:0xFFA0A0, 0.35);
        g.strokeRoundedRect(px+5,py+5,pw-10,ph-10,13);
        // Top accent bar
        g.fillStyle(correct?0x1E4010:0x4A1010, 0.9);
        g.fillRoundedRect(px+2,py+2,pw-4,44,{tl:15,tr:15,bl:0,br:0});
        // Cute corner blossoms
        [[px+16,py+16,1,1],[px+pw-16,py+16,-1,1],[px+16,py+ph-16,1,-1],[px+pw-16,py+ph-16,-1,-1]]
            .forEach(([cx,cy,sx,sy])=>this._drawBlossomCorner(g,cx,cy,sx,sy));

        const titleT = this.add.text(W/2, py+23,
            correct?'✔  辨证正确  ✔':'✘  再想想看  ✘', {
                fontSize:'24px',fontFamily:'serif',
                color:correct?'#90FF80':'#FF8888',stroke:'#000000',strokeThickness:2
            }).setOrigin(0.5).setDepth(20);

        const bodyT = this.add.text(W/2, py+82, text, {
            fontSize:'15px',fontFamily:'serif',color:C.cream,
            align:'center',wordWrap:{width:pw-60},lineSpacing:7
        }).setOrigin(0.5,0).setDepth(20);
        bodyT.y = py+66+(ph-66-bodyT.height-28)/2;

        const hint=this.add.text(W/2,py+ph-18,'点击任意处继续 ～',{
            fontSize:'13px',color:'#777777'
        }).setOrigin(0.5).setDepth(20);

        // Animate in
        [g,titleT,bodyT,hint].forEach(o=>o.setAlpha(0));
        g.scaleX=0.8; g.scaleY=0.8;
        this.tweens.add({targets:g,scaleX:1,scaleY:1,alpha:1,duration:230,ease:'Back.easeOut'});
        this.tweens.add({targets:[titleT,bodyT,hint],alpha:1,delay:150,duration:180});

        this.input.once('pointerdown',()=>[block,g,titleT,bodyT,hint].forEach(o=>o.destroy()));
    }

    // ============================================================
    //  FINAL SCREEN
    // ============================================================

    _showFinalScreen() {
        const W=this.cameras.main.width, H=this.cameras.main.height;
        const ci=this._caseInfo, rx=ci.prescription;
        const score=this._score;
        const stars=score>=88?3:score>=62?2:score>=36?1:0;
        const GREETINGS=['再接再厉，继续学习！','有进步哦，加油！','很不错！学以致用～','完美！学识渊博 ✿'];

        const overlay=this.add.rectangle(W/2,H/2,W,H,0x030201,0.95).setDepth(25);
        const pw=660, ph=510, px=(W-pw)/2, py=(H-ph)/2;
        const g=this.add.graphics().setDepth(26);
        g.fillStyle(0x1A0E05,1); g.fillRoundedRect(px,py,pw,ph,18);
        g.lineStyle(3,C.panelBorder,1); g.strokeRoundedRect(px,py,pw,ph,18);
        g.lineStyle(1.5,C.panelBorder2,0.4); g.strokeRoundedRect(px+6,py+6,pw-12,ph-12,15);
        // Header bar
        g.fillStyle(C.headerBg,0.9); g.fillRoundedRect(px+2,py+2,pw-4,52,{tl:17,tr:17,bl:0,br:0});
        [[px+18,py+18,1,1],[px+pw-18,py+18,-1,1],[px+18,py+ph-18,1,-1],[px+pw-18,py+ph-18,-1,-1]]
            .forEach(([cx,cy,sx,sy])=>this._drawBlossomCorner(g,cx,cy,sx,sy));

        let gy=py+26;
        this.add.text(W/2,gy,'问诊结束',{fontSize:'28px',fontFamily:'serif',color:C.gold,stroke:'#0A0500',strokeThickness:3}).setOrigin(0.5,0).setDepth(27);
        gy+=52;

        // Stars
        for(let i=0;i<3;i++){
            const sg=this.add.graphics().setDepth(27);
            this._drawStar(sg, W/2-76+i*76, gy+22, 22, i<stars?0xFFD040:0x3A2A14, i<stars?1:0.3);
        }
        gy+=60;

        this.add.text(W/2,gy,GREETINGS[stars],{fontSize:'16px',fontFamily:'serif',color:C.hint,fontStyle:'italic'}).setOrigin(0.5,0).setDepth(27);
        gy+=32;

        const dg=this.add.graphics().setDepth(27);
        dg.lineStyle(1,C.panelBorder,0.4); dg.lineBetween(px+36,gy,px+pw-36,gy);
        // Diamond on divider
        dg.fillStyle(C.panelBorder,0.5); dg.fillTriangle(W/2,gy-5,W/2+5,gy,W/2,gy+5); dg.fillTriangle(W/2,gy-5,W/2-5,gy,W/2,gy+5);
        gy+=18;

        this.add.text(W/2,gy,`最终得分：${score} 分`,{fontSize:'22px',fontFamily:'serif',color:'#FFE060'}).setOrigin(0.5,0).setDepth(27);
        gy+=36;
        this.add.text(W/2,gy,`辨证结果：${ci.diagnosis.syndrome}`,{fontSize:'16px',fontFamily:'serif',color:'#D0C080'}).setOrigin(0.5,0).setDepth(27);
        gy+=28;
        if(rx){
            this.add.text(W/2,gy,`药方：${rx.name}  ──  ${rx.effect}`,{fontSize:'14px',fontFamily:'serif',color:'#88E888'}).setOrigin(0.5,0).setDepth(27);
            gy+=26;
            if(rx.tips&&rx.tips.length){
                this.add.text(W/2,gy,`医嘱：${rx.tips.join('，')}`,{fontSize:'13px',fontFamily:'serif',color:'#B0A070',fontStyle:'italic'}).setOrigin(0.5,0).setDepth(27);
                gy+=26;
            }
        }
        gy+=6;
        const dg2=this.add.graphics().setDepth(27);
        dg2.lineStyle(1,0x5A3A18,0.35); dg2.lineBetween(px+36,gy,px+pw-36,gy);
        gy+=14;
        this.add.text(W/2,gy,ci.diagnosis.analysis.trim(),{fontSize:'14px',fontFamily:'serif',color:'#C0B090',fontStyle:'italic',align:'center',wordWrap:{width:pw-90},lineSpacing:6}).setOrigin(0.5,0).setDepth(27);

        // ★ 店铺模式：根据是否还有未完成病例，显示不同按钮
        if (this._shopMode) {
            const allDone = this._completedPatients.size >= PATIENT_CASES.length;
            if (allDone) {
                this._mkBtn(W/2, py+ph-28, '返回药斋 ✿', ()=>this._closeScene(), {depth:28});
                this._mkBtn(W/2 + 140, py+ph-28, '重新挑战 ↺', ()=>this._resetAllPatients(), {depth:28});
            } else {
                const nextIdx = this._findNextUncompletedIndex();
                const nextName = PATIENT_CASES[nextIdx]
                    ? PATIENT_CASES[nextIdx].patientInfo.name : '下一位';
                this._mkBtn(W/2 - 120, py+ph-28, '返回药斋 ✕', ()=>this._closeScene(), {depth:28});
                this._mkBtn(W/2 + 120, py+ph-28, `下一位 ▶  ${nextName}`,
                    ()=>this._switchPatient(nextIdx), {depth:28});
            }
        } else {
            this._mkBtn(W/2, py+ph-28, '返回游戏 ✿', ()=>this._closeScene(), {depth:28});
        }

        [overlay,g].forEach(o=>{o.alpha=0;this.tweens.add({targets:o,alpha:1,duration:460});});
    }

    _drawStar(g,cx,cy,r,color,alpha){
        g.fillStyle(color,alpha);
        const pts=[];
        for(let i=0;i<5;i++){
            const oa=-Math.PI/2+i*(Math.PI*2/5),ia=oa+Math.PI/5;
            pts.push({x:cx+r*Math.cos(oa),y:cy+r*Math.sin(oa)});
            pts.push({x:cx+r*0.44*Math.cos(ia),y:cy+r*0.44*Math.sin(ia)});
        }
        g.fillPoints(pts,true,true);
    }

    // ============================================================
    //  AMBIENT PARTICLES
    // ============================================================

    _spawnParticles(W, H) {
        const ps=Array.from({length:22},()=>({
            x:Math.random()*W, y:Math.random()*H,
            r:1+Math.random()*2, speed:0.18+Math.random()*0.35,
            alpha:0.06+Math.random()*0.2, drift:(Math.random()-0.5)*0.25
        }));
        const g=this.add.graphics().setDepth(0);
        const pt=this.time.addEvent({delay:50,loop:true,callback:()=>{
            g.clear();
            ps.forEach(p=>{ p.y-=p.speed; p.x+=p.drift; if(p.y<-4){p.y=H+4;p.x=Math.random()*W;} g.fillStyle(0xD4B060,p.alpha); g.fillCircle(p.x,p.y,p.r); });
        }});
        this._animList.push(pt);
    }

    // ============================================================
    //  NAVIGATION
    // ============================================================

    _goPrev() { if(this._currentStep>0) this._showStep(this._currentStep-1); }
    _goNext() { if(this._currentStep<4) this._showStep(this._currentStep+1); else this._finish(); }

    _updateNavBtns() {
        if(this._btnPrev) this._btnPrev.setVisible(this._currentStep>0);
        if(this._btnNext&&this._btnNext.t)
            this._btnNext.t.setText(this._currentStep===4?'完成问诊 ✿':'下一步 ▶');
    }

    // ============================================================
    //  FINISH / CLOSE
    // ============================================================

    _finish() {
        this._clearAnimTimers(); this._hideHerbTooltip();
        const result={
            patientName:this._caseInfo.patientInfo.name,
            syndrome:this._caseInfo.diagnosis.syndrome, score:this._score,
            prescription:this._caseInfo.prescription
                ?{name:this._caseInfo.prescription.name,herbsSelected:[...this._selectedHerbs]}:null,
            completed:true, timestamp:Date.now()
        };
        if(window.gameStateManager&&window.gameStateManager.state)
            window.gameStateManager.state.__diagnosisResult=result;
        console.log('[DiagnosisMinigame] 诊断完成 →', result);

        // ★ 店铺模式：标记当前病例完成
        if (this._shopMode) {
            this._completedPatients.add(this._shopPatientIndex);
        }

        this._showFinalScreen();
    }

    _closeScene() {
        this._clearAnimTimers(); this._hideHerbTooltip();
        if (this._shopMode) {
            // 店铺模式：直接停止场景，返回药斋/GameScene
            this.cameras.main.fadeOut(300, 5, 3, 2);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.stop());
        } else {
            // 剧情模式：带 fadeOut 停止
            this.cameras.main.fadeOut(400, 5, 3, 2);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.stop());
        }
    }

    // ============================================================
    //  SHOP MODE: PATIENT SELECTOR & CYCLE
    // ============================================================

    /**
     * 构建病例切换器（仅店铺模式）
     */
    _buildPatientSelector(px, py, pw) {
        const selY = py - 10;
        const selH = 38;
        const selW = 460;
        const selX = px + pw / 2;

        // 半透明背景条
        const selBg = this.add.graphics().setDepth(2);
        selBg.fillStyle(0x0A0502, 0.75);
        selBg.fillRoundedRect(selX - selW/2, selY - selH/2, selW, selH, 10);
        selBg.lineStyle(1, C.panelBorder, 0.4);
        selBg.strokeRoundedRect(selX - selW/2, selY - selH/2, selW, selH, 10);

        // 左箭头
        this._mkBtn(selX - selW/2 + 30, selY, '◀',
            () => this._switchPatient(Math.max(0, this._shopPatientIndex - 1)),
            { w: 36, h: 28, fsize: '14px', depth: 3 });

        // 右箭头
        this._mkBtn(selX + selW/2 - 30, selY, '▶',
            () => this._switchPatient(Math.min(PATIENT_CASES.length - 1, this._shopPatientIndex + 1)),
            { w: 36, h: 28, fsize: '14px', depth: 3 });

        // 病例名称 + 进度圆点
        this._patientSelText = this.add.text(selX, selY, '', {
            fontSize: '14px', fontFamily: 'serif', color: C.gold
        }).setOrigin(0.5).setDepth(3);
        this._patientSelDots = this.add.text(selX, selY + 11, '', {
            fontSize: '11px', fontFamily: 'serif', color: C.dim
        }).setOrigin(0.5).setDepth(3);

        this._refreshPatientSelector();
    }

    /**
     * 刷新病例选择器显示
     */
    _refreshPatientSelector() {
        if (!this._patientSelText) return;
        const ci = this._caseInfo;
        if (!ci) return;
        this._patientSelText.setText(
            `${this._shopPatientIndex + 1}/${PATIENT_CASES.length}  ${ci.patientInfo.name}  (${ci.patientInfo.age}岁 ${ci.patientInfo.gender})`
        );

        // 进度圆点
        let dots = '';
        for (let i = 0; i < PATIENT_CASES.length; i++) {
            const done = this._completedPatients.has(i);
            const cur = i === this._shopPatientIndex;
            dots += done ? '● ' : (cur ? '○ ' : '· ');
        }
        this._patientSelDots.setText(dots);
    }

    /**
     * 切换到指定病例
     */
    _switchPatient(index) {
        if (index < 0 || index >= PATIENT_CASES.length) return;
        if (index === this._shopPatientIndex) return;

        // 清理当前状态
        this._clearAnimTimers();
        this._hideHerbTooltip();

        // 销毁所有动态UI元素
        this._cg.clear(true, true);

        // 销毁旧元素（除了面板背景和粒子）
        this.children.list.forEach(child => {
            if (child.depth > 1 && child.depth < 20 && child.type !== 'Graphics') {
                try { child.destroy(); } catch(e) {}
            }
        });

        // 重置状态
        this._shopPatientIndex = index;
        this._caseInfo = PATIENT_CASES[index];
        this._score = 0;
        this._answeredSteps = {};
        this._stepChoices = {};
        this._hintUsed = {};
        this._selectedHerbs = [];
        this._currentStep = 0;
        this._revealedQs = new Set();
        this._tooltipObjs = null;

        // 清空CG组
        if (this._cg) {
            this._cg = this.add.group();
        }

        // 重建UI
        this._buildHeader(this._PX, this._PY, this._PW);
        this._buildPatientSelector(this._PX, this._PY, this._PW);
        this._refreshPatientSelector();

        // 重建步骤容器
        const cY = this._tabsY + 47;
        const ph = this._PH;
        const box = this._CR;
        const cH = ph - (cY - this._PY) - 50;
        this._CR = { x: this._PX + 14, y: cY, w: this._PW - 28, h: cH, cx: this._PX + 14 + (this._PW - 28) / 2 };

        // 重新显示第一步
        this._showStep(0);
    }

    /**
     * 找到下一个未完成的病例索引
     */
    _findNextUncompletedIndex() {
        for (let i = 0; i < PATIENT_CASES.length; i++) {
            if (!this._completedPatients.has(i)) return i;
        }
        return 0; // 全部完成则回到第一个
    }

    /**
     * 重置所有病例完成状态
     */
    _resetAllPatients() {
        this._completedPatients = new Set();
        this._switchPatient(0);
    }

    // ============================================================
    //  UTIL
    // ============================================================

    _clearAnimTimers() { this._animList.forEach(t=>{if(t)t.remove(false);}); this._animList=[]; }

    /* ---------- option button with state feedback ---------- */
    _createOptionBtn(x, y, w, h, text, callback) {
        const g=this.add.graphics().setDepth(3);
        let _state='idle';
        const draw=(hov)=>{
            g.clear();
            if(_state==='correct'){
                g.fillStyle(0x1C580E,1); g.fillRoundedRect(x-w/2,y-h/2,w,h,12);
                g.lineStyle(2.5,0x70FF50,1); g.strokeRoundedRect(x-w/2,y-h/2,w,h,12);
                // tick
                g.lineStyle(2.5,0x90FF70,1); g.beginPath();
                g.moveTo(x-w/2+10,y); g.lineTo(x-w/2+16,y+6); g.lineTo(x-w/2+24,y-7); g.strokePath();
            } else if(_state==='wrong'){
                g.fillStyle(0x581010,1); g.fillRoundedRect(x-w/2,y-h/2,w,h,12);
                g.lineStyle(2.5,0xFF5050,1); g.strokeRoundedRect(x-w/2,y-h/2,w,h,12);
                // cross
                g.lineStyle(2.5,0xFF7070,1);
                g.beginPath(); g.moveTo(x-w/2+10,y-5); g.lineTo(x-w/2+21,y+6); g.strokePath();
                g.beginPath(); g.moveTo(x-w/2+21,y-5); g.lineTo(x-w/2+10,y+6); g.strokePath();
            } else if(_state==='dimmed'){
                g.fillStyle(0x181008,0.38); g.fillRoundedRect(x-w/2,y-h/2,w,h,12);
                g.lineStyle(1,0x3A2810,0.28); g.strokeRoundedRect(x-w/2,y-h/2,w,h,12);
            } else {
                g.fillStyle(hov?C.quizHover:C.quizIdle, hov?1:0.88);
                g.fillRoundedRect(x-w/2,y-h/2,w,h,12);
                g.lineStyle(hov?2:1.5, hov?C.panelBorder:0xA07030, 1);
                g.strokeRoundedRect(x-w/2,y-h/2,w,h,12);
                // Hover: left accent strip
                if(hov){ g.fillStyle(C.panelBorder,0.4); g.fillRoundedRect(x-w/2,y-h/2,5,h,{tl:12,tr:0,bl:12,br:0}); }
            }
        };
        draw(false);
        const t=this.add.text(x,y,text,{
            fontSize:'13px',fontFamily:'serif',color:C.cream,wordWrap:{width:w-20},align:'center'
        }).setOrigin(0.5).setDepth(4);
        const zone=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true}).setDepth(5);
        zone.on('pointerover',()=>{if(_state==='idle')draw(true);});
        zone.on('pointerout', ()=>{if(_state==='idle')draw(false);});
        zone.on('pointerdown',callback);
        return {
            all:[g,t,zone],
            setCorrect:()=>{ _state='correct'; draw(false); t.setColor('#90FF80'); },
            setWrong:  ()=>{ _state='wrong';   draw(false); t.setColor('#FF8080'); },
            setDimmed: ()=>{ _state='dimmed';  draw(false); t.setColor('#504030').setAlpha(0.5); }
        };
    }

    _mkBtn(x, y, label, cb, opts={}) {
        const bw=opts.w||152, bh=opts.h||34, fs=opts.fsize||'16px', depth=opts.depth||5;
        const colN=opts.colorN||C.btnNormal, colH=opts.colorH||C.btnHover;
        const brdC=opts.borderC||C.panelBorder;
        const g=this.add.graphics().setDepth(depth);
        const draw=(hov)=>{
            g.clear();
            g.fillStyle(hov?colH:colN, hov?1:0.88);
            g.fillRoundedRect(x-bw/2,y-bh/2,bw,bh,12);
            g.lineStyle(1.5, brdC, hov?0.95:0.65);
            g.strokeRoundedRect(x-bw/2,y-bh/2,bw,bh,12);
        };
        draw(false);
        const t=this.add.text(x,y,label,{fontSize:fs,fontFamily:'serif',color:C.gold}).setOrigin(0.5).setDepth(depth+1);
        const hit=this.add.zone(x,y,bw,bh).setInteractive({useHandCursor:true}).setDepth(depth+2);
        hit.on('pointerover',()=>draw(true)); hit.on('pointerout',()=>draw(false)); hit.on('pointerdown',cb);
        return {g,t,hit,setVisible:v=>[g,t,hit].forEach(e=>e.setVisible(v))};
    }

    _stepData(idx, ci) {
        switch(idx){
        case 0: return {
            title:'观色辨神',
            description:`${ci.inspection.complexion}；${ci.inspection.tongue}；${ci.inspection.eyes}；${ci.inspection.posture}。`,
            clues:ci.inspection.clues||[], hint:ci.inspection.hint||null, quiz:ci.inspection.quiz||null
        };
        case 1: return {
            title:'听声辨气',
            description:`${ci.listening.voice}，${ci.listening.breathing}。${ci.listening.cough||'无咳嗽'}。`,
            clues:ci.listening.clues||[], hint:ci.listening.hint||null, quiz:ci.listening.quiz||null
        };
        case 2: return { title:'询其病由', description:'', clues:[], hint:ci.inquiry.hint||null, quiz:ci.inquiry.quiz||null };
        case 3: return {
            title:'察指辨脉',
            description:`脉象：${ci.pulse.pulseType} —— ${ci.pulse.description}`,
            clues:ci.pulse.clues||[], hint:ci.pulse.hint||null, quiz:ci.pulse.quiz||null
        };
        default: return {title:'',description:'（数据暂缺）',clues:[],hint:null,quiz:null};
        }
    }
}

window.DiagnosisMinigame = DiagnosisMinigame;
