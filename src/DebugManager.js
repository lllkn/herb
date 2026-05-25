/**
 * DebugManager.js - 剧情调试管理器
 * 按 F3 打开/关闭调试面板，下拉选择事件直接触发
 * 支持随时查看序章或第一章任意剧情片段，方便测试和预览
 */
class DebugManager {
    // ★ 第一章：统一的事件→场景映射
    static EVENT_TO_SCENE = {
        'EVT_PLAINS_ENTRY':     'C01',
        'EVT_FIRST_HERB':       'C02',
        'EVT_WOODCUTTER':       'C03',
        'EVT_ABANDONED_BASKET': 'C04',
        'EVT_WASHERWOMAN':      'C05',
        'EVT_MERCHANT':         'C06',
        'EVT_VILLAGE_GATE':     'C07',
        'EVT_CUNZHANG_INTRO':   'C08',
        'EVT_LAOLI_HERB_GARDEN':'C09',
        'EVT_WELL_VILLAGER':    'C10',
        'EVT_DRYING_PLATFORM':  'C11',
        'EVT_EMPTY_SHOP':       'C12',
        'EVT_ZHANG_DIAGNOSIS':  'C13',
        'EVT_VILLAGE_COMPLETE': 'C14',
        'EVT_VALLEY_ENTRY':     'C15',
        'EVT_YINCHEN_ZONE':     'C15',
        'EVT_YINCHEN_DONE':     'C15',
        'EVT_STONE_BRIDGE':     'C15',
        'EVT_FOG_ZONE':         'C15',
        'EVT_HIDDEN_HERB':      'C15',
        'EVT_GUGEN_DISCOVERY':  'C15',
        'EVT_GUGEN_EXAMINE':    'C15',
        'EVT_RETURN_VILLAGE':   'C16'
    };

    // ★ 序章：场景索引表（序章没有 EVT_ 事件系统，直接用场景ID）
    static PROLOGUE_SCENES = {
        list: ['S01','S02','S03','S04','S05','S06','S07','S08','S09'],
        names: {
            'S01': '开场黑屏独白',
            'S02': '岐黄学堂·清晨',
            'S03': '结业典礼·白院长对话',
            'S04': '药圃·识药与采药',
            'S05': '灵药房·灵宠觉醒',
            'S06': '炮制间·亲手炮制',
            'S07': '内室·图谱托付',
            'S08': '学堂门口·道别与启程',
            'S09': '学堂南门·踏上旅途'
        },
        groups: [
            { label: '📖  学堂', ids: ['S01','S02','S03'] },
            { label: '🌿  修行', ids: ['S04','S05','S06','S07'] },
            { label: '🚪  启程', ids: ['S08','S09'] }
        ]
    };

    // 第一章事件分组（用于下拉 optgroup）
    static CHAPTER1_GROUPS = [
        { label: '🗺  城郊平原', ids: ['EVT_PLAINS_ENTRY','EVT_FIRST_HERB','EVT_WOODCUTTER','EVT_ABANDONED_BASKET','EVT_WASHERWOMAN','EVT_MERCHANT','EVT_VILLAGE_GATE'] },
        { label: '🏘  翠竹村',   ids: ['EVT_CUNZHANG_INTRO','EVT_LAOLI_HERB_GARDEN','EVT_WELL_VILLAGER','EVT_DRYING_PLATFORM','EVT_EMPTY_SHOP','EVT_ZHANG_DIAGNOSIS','EVT_VILLAGE_COMPLETE'] },
        { label: '🏞  溪流山谷', ids: ['EVT_VALLEY_ENTRY','EVT_SHANYAO_ZONE','EVT_SHANYAO_DONE','EVT_STONE_BRIDGE','EVT_FOG_ZONE','EVT_HIDDEN_HERB','EVT_GUGEN_DISCOVERY','EVT_GUGEN_EXAMINE','EVT_RETURN_VILLAGE'] }
    ];

    /**
     * @param {Phaser.Scene} scene - 所属场景（IntroScene）
     */
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.panel = null;
        this.overlay = null;
        this.selectEl = null;
    }

    /**
     * 创建调试面板UI
     */
    createUI() {
        // 已创建则跳过
        if (this.panel) return;

        const loadChapter = window._loadChapter || 0;
        const isPrologue = (loadChapter === 0);

        // 序章模式：不需要 map_events_data，直接从 PROLOGUE_SCENES 构建
        // 第一章模式：优先从 map_events_data 读取事件列表
        let eventsData = null;
        if (!isPrologue) {
            eventsData = this._getEventsData();
            console.log('DebugManager.createUI: eventsData=', !!eventsData, 'events count:', eventsData?.events?.length || 0);
        }

        // 第一章模式但没有 eventsData → 回退到 chapter1 数据构建
        if (!isPrologue && (!eventsData || !eventsData.events)) {
            console.warn('DebugManager: 地图事件配置加载失败，尝试从 chapter1 数据回退构建');
            this._createFallbackUI();
            return;
        }

        // 遮罩层 
        this.overlay = document.createElement('div');
        this.overlay.id = 'debug-chapter1-overlay';
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.55)',
            display: 'none',
            zIndex: '9998',
            backdropFilter: 'blur(3px)'
        });
        this.overlay.onclick = () => this.toggle();
        document.body.appendChild(this.overlay);

        // 面板容器 
        this.panel = document.createElement('div');
        this.panel.id = 'debug-chapter1-panel';
        Object.assign(this.panel.style, {
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '520px',
            maxHeight: '80vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, #1a2a1a 0%, #2a3a2a 100%)',
            border: '2px solid #8b7355',
            borderRadius: '14px',
            padding: '22px 26px',
            color: '#e8d8b8',
            fontFamily: '"FangSong", "KaiTi", "STFangsong", "STKaiti", serif',
            fontSize: '15px',
            boxShadow: '0 0 30px rgba(0,0,0,0.6)',
            display: 'none',
            zIndex: '9999'
        });
        this.overlay.appendChild(this.panel);

        // 阻止面板内点击冒泡到遮罩层（防止误关）
        this.panel.addEventListener('click', (e) => e.stopPropagation());

        // 标题（动态显示当前章节）
        const chapterLabel = isPrologue ? '序章' : '第一章';
        const title = document.createElement('div');
        title.textContent = `🛠  ${chapterLabel}剧情调试器`;
        Object.assign(title.style, {
            fontSize: '20px', fontWeight: 'bold', color: '#ffcc00',
            marginBottom: '14px', textAlign: 'center',
            borderBottom: '1px solid #8b735544',
            paddingBottom: '10px'
        });
        this.panel.appendChild(title);

        // 章节选择 
        const chapterRow = document.createElement('div');
        chapterRow.style.marginBottom = '12px';
        chapterRow.innerHTML = '<span style="color:#8b7355;">章节：</span> ';
        const chapterSel = document.createElement('select');
        chapterSel.style.cssText = 'background:#2a3a2a;color:#e8d8b8;border:1px solid #8b7355;border-radius:6px;padding:3px 6px;font-size:14px;';
        [{ v: 0, l: '序章（S01-S09）' }, { v: 1, l: '第一章（C01-C16）' }].forEach(o => {
            const op = document.createElement('option');
            op.value = o.v; op.textContent = o.l;
            if (o.v === loadChapter) op.selected = true;
            chapterSel.appendChild(op);
        });
        chapterSel.onchange = () => {
            window._loadChapter = parseInt(chapterSel.value);
            // 重新加载（BootScene 会根据 _loadChapter 加载对应数据）
            if (this.scene && this.scene.scene && this.scene.scene.start) {
                this.scene.scene.start('BootScene');
            }
        };
        chapterRow.appendChild(chapterSel);
        this.panel.appendChild(chapterRow);

        // 事件下拉选择
        const label = document.createElement('div');
        label.textContent = '选择事件（触发对应场景）：';
        label.style.cssText = 'color:#8b7355;margin-bottom:6px;font-size:14px;';
        this.panel.appendChild(label);

        this.selectEl = document.createElement('select');
        this.selectEl.id = 'debug-event-select';
        Object.assign(this.selectEl.style, {
            width: '100%',
            background: '#0a0a0a',
            color: '#e8d8b8',
            border: '1px solid #8b7355',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '14px',
            marginBottom: '12px'
        });
        // 默认选项 
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '—— 请选择事件 ——';
        this.selectEl.appendChild(placeholder);

        if (isPrologue) {
            // ★ 序章模式：从 PROLOGUE_SCENES 构建下拉
            this._buildPrologueSelect();
        } else {
            // ★ 第一章模式：从 map_events_data 构建下拉
            const groups = this._groupEvents(eventsData.events);
            groups.forEach(g => {
                const optGroup = document.createElement('optgroup');
                optGroup.label = g.label;
                g.events.forEach(evt => {
                    const op = document.createElement('option');
                    op.value = evt.eventId;
                    const onceTag = evt.once ? '🔒' : '🔓';
                    const locTag = evt.locComplete ? ` [${evt.locComplete}]` : '';
                    op.textContent = `${onceTag} ${evt.eventId}${locTag} - ${this._getEventName(evt)}`;
                    op.dataset.sceneId = this._getSceneId(evt);
                    optGroup.appendChild(op);
                });
                this.selectEl.appendChild(optGroup);
            });
        }
        this.panel.appendChild(this.selectEl);

        // 按钮行 
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:10px;margin-top:14px;justify-content:center;';

        // 触发按钮 
        const triggerBtn = document.createElement('button');
        triggerBtn.textContent = '▶  触发事件';
        Object.assign(triggerBtn.style, {
            flex: '1', padding: '9px 0',
            background: 'linear-gradient(135deg, #4a8c5c, #2d5016)',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
        });
        triggerBtn.onmouseenter = () => { triggerBtn.style.opacity = '0.85'; };
        triggerBtn.onmouseleave = () => { triggerBtn.style.opacity = '1'; };
        triggerBtn.onclick = (e) => { e.stopPropagation(); this._onTrigger(); };
        btnRow.appendChild(triggerBtn);

        // 关闭按钮 
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖  关闭';
        Object.assign(closeBtn.style, {
            flex: '1', padding: '9px 0',
            background: '#3a2a1a',
            color: '#8b7355', border: '1px solid #8b7355', borderRadius: '8px',
            fontSize: '15px', cursor: 'pointer'
        });
        closeBtn.onmouseenter = () => { closeBtn.style.background = '#4a3a2a'; };
        closeBtn.onmouseleave = () => { closeBtn.style.background = '#3a2a1a'; };
        closeBtn.onclick = (e) => { e.stopPropagation(); this.toggle(); };
        btnRow.appendChild(closeBtn);

        this.panel.appendChild(btnRow);

        // 提示文字 
        const hint = document.createElement('div');
        hint.id = 'debug-hint';
        hint.style.cssText = 'margin-top:10px;font-size:12px;color:#6a5a3a;text-align:center;';
        this.panel.appendChild(hint);

        console.log(`DebugManager: ${chapterLabel}调试面板已创建（F3 由 main.js 全局管理）`);
    }

    /**
     * ★ 序章模式：从 PROLOGUE_SCENES 构建下拉选项
     */
    _buildPrologueSelect() {
        const pData = DebugManager.PROLOGUE_SCENES;
        // 尝试从 prologue JSON 获取完整场景名称
        let sceneMap = {};
        try {
            if (this.scene && this.scene.cache && this.scene.cache.json) {
                const prologueData = this.scene.cache.json.get('prologue_data');
                if (prologueData && prologueData.scenes) {
                    prologueData.scenes.forEach(s => { sceneMap[s.id] = s.name || pData.names[s.id] || s.id; });
                }
            }
        } catch(e) { /* 忽略 */ }
        if (Object.keys(sceneMap).length === 0) {
            sceneMap = pData.names;
        }

        pData.groups.forEach(g => {
            const optGroup = document.createElement('optgroup');
            optGroup.label = g.label;
            g.ids.forEach(id => {
                const op = document.createElement('option');
                op.value = id;  // ★ 序章直接用场景ID（如 S01）作 value
                op.dataset.sceneId = id;
                op.textContent = `${id} - ${sceneMap[id] || id}`;
                optGroup.appendChild(op);
            });
            this.selectEl.appendChild(optGroup);
        });
    }

    /**
     * 切换面板显示/隐藏（F3 调用）
     */
    toggle() {
        this.isOpen = !this.isOpen;
        if (this.panel)   this.panel.style.display = this.isOpen ? 'block' : 'none';
        if (this.overlay) this.overlay.style.display = this.isOpen ? 'block' : 'none';

        // ★ 防御性检查：场景可能已销毁（IntroScene → GameScene 切换时）
        try {
            if (this.scene && this.scene.input && this.scene.input.keyboard) {
                this.scene.input.keyboard.enabled = !this.isOpen;
            }
        } catch (e) {
            // 场景已销毁或 input 不可访问，静默忽略
            console.warn('DebugManager: scene.input 访问失败，场景可能已销毁', e.message);
        }

        console.log(`DebugManager: 面板 ${this.isOpen ? '打开' : '关闭'}`);
    }

    /**
     * 销毁面板 
     */
    destroy() {
        if (this.panel && this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
        if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
        this.panel = null;
        this.overlay = null;
        console.log('DebugManager: 已销毁');
    }

    // ========== 私有方法 ========== 

    /**
     * 获取事件配置数据 
     */
    _getEventsData() {
        // 优先使用已加载的缓存 
        if (this.scene && this.scene.cache && this.scene.cache.json && this.scene.cache.json.get) {
            const data = this.scene.cache.json.get('map_events_data');
            if (data && data.events) return data;
        }
        // 回退：使用 window 变量 
        if (window._mapEventsData) return window._mapEventsData;
        return null;
    }

    /**
     * 将事件按地图区域分组 
     */
    _groupEvents(events) {
        const g = DebugManager.CHAPTER1_GROUPS;
        const map = {};
        events.forEach(e => { map[e.eventId] = e; });
        return g.map(grp => ({
            label: grp.label,
            events: grp.ids.map(id => map[id]).filter(Boolean)
        })).filter(grp => grp.events.length > 0);
    }

    /**
     * 根据事件ID获取对应 scene ID（从 story_chapter1.json）
     * ★ 使用静态常量 EVENT_TO_SCENE，避免双重映射维护
     */
    _getSceneId(evt) {
        return DebugManager.EVENT_TO_SCENE[evt.eventId] || '';
    }

    /**
     * 获取事件显示名称 
     */
    _getEventName(evt) {
        const names = {
            'EVT_PLAINS_ENTRY': '出生区搭车过场',
            'EVT_FIRST_HERB': '第一株甘草',
            'EVT_WOODCUTTER': '砍柴老汉问路',
            'EVT_ABANDONED_BASKET': '废弃草药篓',
            'EVT_WASHERWOMAN': '洗衣村妇病情线索',
            'EVT_MERCHANT': '行商药材价格',
            'EVT_VILLAGE_GATE': '翠竹村牌坊',
            'EVT_CUNZHANG_INTRO': '村长接委托',
            'EVT_LAOLI_HERB_GARDEN': '草药圃辨药',
            'EVT_WELL_VILLAGER': '水井边病情线索',
            'EVT_DRYING_PLATFORM': '晒药台炮制',
            'EVT_EMPTY_SHOP': '空置铺面药铺',
            'EVT_ZHANG_DIAGNOSIS': '张大娘四诊问诊',
            'EVT_VILLAGE_COMPLETE': '全部地点完成',
            'EVT_VALLEY_ENTRY': '山谷入口',
            'EVT_YINCHEN_ZONE': '溪岸茵陈区',
            'EVT_YINCHEN_DONE': '茵陈采集完成',
            'EVT_STONE_BRIDGE': '石桥小操作',
            'EVT_FOG_ZONE': '芦苇深处青苗引路',
            'EVT_HIDDEN_HERB': '迷雾中隐藏草药',
            'EVT_GUGEN_DISCOVERY': '谷底蛊根草发现',
            'EVT_GUGEN_EXAMINE': '蛊根草检查旅人登场',
            'EVT_RETURN_VILLAGE': '返回触发第一章结局'
        };
        return names[evt.eventId] || evt.eventId;
    }

    /**
     * 触发按钮回调：找到对应 scene 并跳转 
     */
    _onTrigger() {
        const selectedValue = this.selectEl ? this.selectEl.value : '';
        console.log('=== DebugManager._onTrigger 开始 ===', { selectedValue, hasScene: !!this.scene, hasSelect: !!this.selectEl });

        if (!selectedValue) {
            this._showHint('⚠️ 请先选择一个事件！');
            return;
        }

        // 将选中的值（可能是 eventId 或直接是 sceneId）转换为 sceneId
        let sceneId = selectedValue;

        // 如果选中值以 EVT_ 开头，通过映射查找对应 sceneId
        if (selectedValue.startsWith('EVT_')) {
            // 从 select option 的 dataset 获取（正常模式）
            const opt = this.selectEl.selectedOptions[0];
            if (opt && opt.dataset.sceneId) {
                sceneId = opt.dataset.sceneId;
            } else {
                // 回退模式：selectedValue 可能已经是 C01 格式
                sceneId = this._findSceneIdByEvent(selectedValue);
            }
        }
        console.log('Step1: sceneId =', sceneId);

        if (!sceneId) {
            this._showHint(`❌ 无法识别事件 ${selectedValue}`);
            return;
        }

        // === 智能数据源查找：先在当前加载的数据中找 ===
        let data = this.scene.prologueData;
        let idx = -1;
        let usedFallback = false;

        console.log('Step2: 当前 prologueData:', {
            hasData: !!data,
            title: data?.title,
            scenesCount: data?.scenes?.length,
            isChapter1: this.scene._isChapter1
        });

        if (data && data.scenes) {
            idx = data.scenes.findIndex(s => s.id === sceneId);
            console.log('Step2a: 在当前数据中查找 → idx =', idx);
        }

        // 当前数据中找不到 → 尝试两种数据源（序章或第一章）
        if (idx < 0) {
            // 先试第一章数据
            let fallbackData = null;
            try {
                fallbackData = this.scene.cache.json.get('chapter1_data');
                console.log('Step3a: cache.json.get(chapter1_data):', !!fallbackData, fallbackData?.scenes?.length);
            } catch(e) {
                console.warn('Step3a: cache.get 失败', e.message);
            }
            if (!fallbackData) {
                fallbackData = window._chapter1Data;
                console.log('Step3b: window._chapter1Data:', !!fallbackData, fallbackData?.scenes?.length);
            }

            if (fallbackData && fallbackData.scenes) {
                idx = fallbackData.scenes.findIndex(s => s.id === sceneId);
                console.log('Step3c: 在 chapter1 数据中查找 → idx =', idx);
                if (idx >= 0) {
                    data = fallbackData;
                    usedFallback = true;
                    console.log(`✓ 从第一章缓存找到 ${sceneId}，切换数据源`);
                }
            }

            // 第一章也找不到 → 再试序章数据
            if (idx < 0) {
                fallbackData = null;
                try {
                    fallbackData = this.scene.cache.json.get('prologue_data');
                    console.log('Step3d: cache.json.get(prologue_data):', !!fallbackData, fallbackData?.scenes?.length);
                } catch(e) {
                    console.warn('Step3d: cache.get prologue 失败', e.message);
                }
                if (!fallbackData && window._prologueData) {
                    fallbackData = window._prologueData;
                    console.log('Step3e: window._prologueData:', !!fallbackData, fallbackData?.scenes?.length);
                }
                if (fallbackData && fallbackData.scenes) {
                    idx = fallbackData.scenes.findIndex(s => s.id === sceneId);
                    console.log('Step3f: 在序章数据中查找 → idx =', idx);
                    if (idx >= 0) {
                        data = fallbackData;
                        usedFallback = true;
                        console.log(`✓ 从序章缓存找到 ${sceneId}，切换数据源`);
                    }
                }
            }
        }

        if (idx < 0 || !data || !data.scenes) {
            console.error(`✗ 未找到场景 ${sceneId}`, {
                currentTitle: this.scene.prologueData?.title,
                currentScenes: this.scene.prologueData?.scenes?.map(s => s.id),
                windowCh1: !!window._chapter1Data,
                windowPrologue: !!window._prologueData
            });
            this._showHint(`❌ 未找到场景 ${sceneId}`);
            return;
        }

        this._showHint(`▶  正在跳转到 ${sceneId}...`);
        console.log(`✓ 触发成功 → ${sceneId}（索引 ${idx}/${data.scenes.length-1}）| 数据: ${data.title}${usedFallback ? ' [自动切换]' : ''}`);

        // 如果用了回退数据源，临时切换 prologueData
        if (usedFallback) {
            this.scene.prologueData = data;
            this.scene._isChapter1 = (data.storyId === 'chapter_1');
            this.scene.currentSceneIndex = 0;
            this.scene.currentStepIndex = 0;
            console.log(`已切换 prologueData 为 ${data.title} 数据`);
        }

        // === 调试模式：从目标场景开始连续播放，直到 end 步骤或全部播完 ===
        this.scene._debugMode = true;
        this.scene._debugTargetSceneIdx = idx;

        // 关闭面板
        this.toggle();
        console.log(`[调试] ▶ 准备跳转到 ${sceneId}（索引 ${idx}），调试模式已开启（将连续播放）`);

        // === 使用游戏级延迟（不依赖场景时钟）===
        // 关键：this.scene 是 IntroScene（可能已停止），它的 time.clock 不跑
        // ★ 用 requestAnimationFrame 等待当前帧渲染完成，再短延时 50ms 执行
        const game = this.scene.game;
        
        requestAnimationFrame(() => {
            setTimeout(() => {
            console.log(`[调试] === 延迟执行跳转 ${sceneId} ===`);
            try {
                const introActive = game.scene.isActive('IntroScene');
                const activeScenes = game.scene.getScenes(true).map(s => s.scene.key);
                console.log(`[调试] IntroScene 活跃: ${introActive}, 当前活跃: [${activeScenes.join(', ')}]`);

                if (!introActive) {
                    console.log('[调试] ★ 启动 IntroScene（完整场景切换）...');
                    const startData = { 
                        debugMode: true, 
                        debugTargetIdx: idx,
                    };
                    if (usedFallback && data && data.storyId === 'chapter_1') {
                        startData.forceChapter1 = data;
                    }
                    game.scene.start('IntroScene', startData);
                    console.log('[调试] ✓ game.scene.start("IntroScene") 已调用');
                } else {
                    console.log('[调试] IntroScene 已活跃，直接 _startScene');
                    this.scene._startScene(idx);
                }
            } catch(e) {
                console.error('[调试] ✗ 跳转异常:', e.stack || e);
            }
            }, 50);  // ★ 短延时：等待面板关闭动画 + 场景状态稳定
        });  // requestAnimationFrame 结束

        console.log('=== DebugManager._onTrigger 结束（等待下一帧后执行）===');
    }

    /**
     * 显示提示文字 
     */
    _showHint(msg) {
        const hint = document.getElementById('debug-hint');
        if (hint) {
            hint.textContent = msg;
            hint.style.color = msg.includes('❌') ? '#c44a3a' : '#6a5a3a';
        }
    }

    /**
     * 根据 eventId 查找对应 sceneId（回退用）
     * ★ 使用静态常量 EVENT_TO_SCENE，与 _getSceneId 共用同一数据源
     */
    _findSceneIdByEvent(eventId) {
        return DebugManager.EVENT_TO_SCENE[eventId] || '';
    }

    /**
     * 回退UI：当 map_events_data 不可用时，从 JSON 数据直接构建
     * 支持序章和第一章两种模式
     */
    _createFallbackUI() {
        const loadChapter = window._loadChapter || 0;
        const isPrologue = (loadChapter === 0);
        const chapterLabel = isPrologue ? '序章' : '第一章';

        // 遮罩层
        this.overlay = document.createElement('div');
        this.overlay.id = 'debug-chapter1-overlay';
        Object.assign(this.overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.55)', display: 'none', zIndex: '9998'
        });
        this.overlay.onclick = () => this.toggle();
        document.body.appendChild(this.overlay);

        // 面板
        this.panel = document.createElement('div');
        Object.assign(this.panel.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '480px', maxHeight: '75vh', overflowY: 'auto',
            background: '#1a2a1a', border: '2px solid #8b7355', borderRadius: '14px',
            padding: '20px 24px', color: '#e8d8b8',
            fontFamily: '"FangSong", "KaiTi", serif', fontSize: '15px',
            display: 'none', zIndex: '9999'
        });
        this.overlay.appendChild(this.panel);

        // 阻止面板内点击冒泡到遮罩层
        this.panel.addEventListener('click', (e) => e.stopPropagation());

        const title = document.createElement('div');
        title.textContent = `🛠 ${chapterLabel}剧情调试器（回退模式）`;
        title.style.cssText = 'font-size:18px;font-weight:bold;color:#ffcc00;margin-bottom:12px;text-align:center;border-bottom:1px solid #8b735544;padding-bottom:8px;';
        this.panel.appendChild(title);

        // 章节选择
        const chapterRow = document.createElement('div');
        chapterRow.style.marginBottom = '12px';
        chapterRow.innerHTML = '<span style="color:#8b7355;">章节：</span> ';
        const chapterSel = document.createElement('select');
        chapterSel.style.cssText = 'background:#2a3a2a;color:#e8d8b8;border:1px solid #8b7355;border-radius:6px;padding:3px 6px;font-size:14px;';
        [{ v: 0, l: '序章（S01-S09）' }, { v: 1, l: '第一章（C01-C16）' }].forEach(o => {
            const op = document.createElement('option');
            op.value = o.v; op.textContent = o.l;
            if (o.v === loadChapter) op.selected = true;
            chapterSel.appendChild(op);
        });
        chapterSel.onchange = () => {
            window._loadChapter = parseInt(chapterSel.value);
            if (this.scene && this.scene.scene && this.scene.scene.start) {
                this.scene.scene.start('BootScene');
            }
        };
        chapterRow.appendChild(chapterSel);
        this.panel.appendChild(chapterRow);

        const label = document.createElement('div');
        label.textContent = '选择场景：';
        label.style.cssText = 'color:#8b7355;margin-bottom:6px;font-size:14px;';
        this.panel.appendChild(label);

        this.selectEl = document.createElement('select');
        Object.assign(this.selectEl.style, { width:'100%', background:'#0a0a0a', color:'#e8d8b8', border:'1px solid #8b7355', borderRadius:'8px', padding:'8px', fontSize:'14px' });

        const ph = document.createElement('option');
        ph.value = ''; ph.textContent = '—— 请选择场景 ——';
        this.selectEl.appendChild(ph);

        if (isPrologue) {
            // ★ 序章回退模式
            DebugManager.PROLOGUE_SCENES.groups.forEach(g => {
                const og = document.createElement('optgroup');
                og.label = g.label;
                g.ids.forEach(id => {
                    const op = document.createElement('option');
                    op.value = id; op.textContent = `${id} - ${DebugManager.PROLOGUE_SCENES.names[id] || id}`;
                    og.appendChild(op);
                });
                this.selectEl.appendChild(og);
            });
        } else {
            // ★ 第一章回退模式
            let scenes = [];
            try {
                const chData = this.scene.cache.json.get('chapter1_data');
                if (chData && chData.scenes) scenes = chData.scenes;
            } catch(e) { console.warn('DebugManager fallback: chapter1 data not available'); }

            const groups = [
                { label: '🏔 平原地区', ids: ['C01','C02','C03','C04','C05','C06','C07'] },
                { label: '🎋 翠竹村',   ids: ['C08','C09','C10','C11','C12','C13','C14'] },
                { label: '🌊 溪流山谷', ids: ['C15','C16'] }
            ];

            groups.forEach(g => {
                const og = document.createElement('optgroup');
                og.label = g.label;
                g.ids.forEach(id => {
                    const s = scenes.find(sc => sc.id === id);
                    if (s) {
                        const op = document.createElement('option');
                        op.value = id; op.textContent = `${id} - ${s.name || id}`;
                        og.appendChild(op);
                    }
                });
                this.selectEl.appendChild(og);
            });
        }
        this.panel.appendChild(this.selectEl);

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:10px;margin-top:12px;justify-content:center;';

        const triggerBtn = document.createElement('button');
        triggerBtn.textContent = '▶ 触发场景';
        triggerBtn.style.cssText = 'flex:1;padding:9px 0;background:linear-gradient(135deg,#4a8c5c,#2d5016);color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:bold;cursor:pointer;';
        triggerBtn.onclick = (e) => { e.stopPropagation(); this._onTrigger(); };
        btnRow.appendChild(triggerBtn);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖ 关闭';
        closeBtn.style.cssText = 'flex:1;padding:9px 0;background:#3a2a1a;color:#8b7355;border:1px solid #8b7355;border-radius:8px;font-size:15px;cursor:pointer;';
        closeBtn.onclick = (e) => { e.stopPropagation(); this.toggle(); };
        btnRow.appendChild(closeBtn);
        this.panel.appendChild(btnRow);

        // ★ 提示文字区域（与 createUI 保持一致，确保 _showHint() 可用）
        const hint = document.createElement('div');
        hint.id = 'debug-hint';
        hint.style.cssText = 'margin-top:10px;font-size:12px;color:#6a5a3a;text-align:center;';
        this.panel.appendChild(hint);

        console.log(`DebugManager: ${chapterLabel}回退面板已创建`);
    }
}

// 导出到全局 
window.DebugManager = DebugManager;
