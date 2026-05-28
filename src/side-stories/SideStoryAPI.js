(function () {
    const SIDE_STORIES = {
        poison_counter_poison: 'src/data/side_story_poison_counter_poison.json'
    };

    const EXTRA_HERBS = [
        {
            id: 'chansu',
            name: '蟾酥',
            property: '辛/温，有大毒',
            meridian: '心经',
            effect: '解毒消肿，强心止痛',
            icon: '☣',
            rarity: 'rare',
            rarityLabel: '稀有',
            category: '矿石类',
            season: '夏秋采收',
            origin: '中华大蟾蜍或黑眶蟾蜍耳后腺分泌物',
            symptom: '瘀血证',
            image: '',
            descDetail: '蟾酥为蟾蜍耳后腺及皮肤腺分泌物晒干或低温烘干而成，性温有大毒，须严格炮制、配伍与剂量控制。'
        },
        {
            id: 'sanqi',
            name: '三七',
            property: '甘微苦/温',
            meridian: '肝胃',
            effect: '化瘀止血，活血定痛',
            icon: '✚',
            rarity: 'uncommon',
            rarityLabel: '优良',
            category: '根茎类',
            season: '秋冬采挖',
            origin: '云南文山',
            symptom: '瘀血证',
            image: '',
            descDetail: '三七为止血化瘀要药，兼具止血与活血之功，常称止血不留瘀、化瘀不出血。'
        },
        {
            id: 'shengdihuang',
            name: '生地黄',
            property: '甘苦/寒',
            meridian: '心肝肾',
            effect: '清热凉血，养阴生津',
            icon: '◆',
            rarity: 'uncommon',
            rarityLabel: '优良',
            category: '根茎类',
            season: '秋季采挖',
            origin: '河南怀庆',
            symptom: '虚劳证',
            image: '',
            descDetail: '生地黄长于清热凉血、养阴生津，适合阴虚内热、津液亏耗之证。'
        }
    ];

    function ensureHerbDefinitions() {
        if (!window.GameData || !Array.isArray(window.GameData.HERBS_DATA)) return;
        EXTRA_HERBS.forEach(herb => {
            if (!window.GameData.HERBS_DATA.some(h => h.id === herb.id)) {
                window.GameData.HERBS_DATA.push(herb);
            }
        });
        if (window.uiManager) {
            window.uiManager.updateHerbGuideUI?.();
            window.uiManager.updateBackpackUI?.();
        }
    }

    async function loadStory(id) {
        const url = SIDE_STORIES[id];
        if (!url) throw new Error(`未知支线剧情: ${id}`);
        const response = await fetch(`${url}?_=${Date.now()}`, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`支线剧情加载失败: ${response.status}`);
        return response.json();
    }

    async function start(id, options) {
        ensureHerbDefinitions();
        const story = await loadStory(id);
        window._activeSideStoryId = id;

        const sceneIndex = options?.sceneIndex || 0;
        if (!window.game || !window.game.scene) {
            throw new Error('Phaser 游戏尚未初始化，无法启动支线剧情');
        }
        window.game.scene.start('IntroScene', {
            debugMode: true,
            debugTargetIdx: sceneIndex,
            forceChapter1: story,
            returnToGame: options?.returnToGame !== false
        });
        return story;
    }

    window.SideStoryAPI = {
        start,
        loadStory,
        ensureHerbDefinitions,
        ids: Object.keys(SIDE_STORIES)
    };
})();
