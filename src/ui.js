/**
 * UI 管理模块 - UIManager
 * 处理所有 HTML UI 的交互和更新
 */

class UIManager {
    constructor() {
        console.log('UIManager: 开始初始化...');
        this.cacheElements();
        console.log('UIManager: 元素缓存完成');
        this.bindEvents();
        console.log('UIManager: 事件绑定完成');
        this.initSettings();
        console.log('UIManager: 初始化完成');
    }

    // ==================== 设置页面管理 ====================
    
    // 默认键位配置
    defaultKeybinds = {
        up: 'W',
        down: 'S',
        left: 'A',
        right: 'D',
        collect: 'E',
        backpack: 'B',
        guide: 'T',
        debug: 'F12'
    };

    // 当前设置
    currentSettings = {
        bgmVolume: 80,
        sfxVolume: 90,
        quality: 'high',
        particleEffect: true,
        autoSave: true,
        showHints: true,
        speedUp: false,
        keybinds: { ...this.defaultKeybinds }
    };

    // 正在监听的键位
    listeningKeybind = null;

    /**
     * 初始化设置系统
     */
    initSettings() {
        this.loadSettings();
        this.bindSettingsEvents();
        this.updateSettingsUI();
    }

    /**
     * 加载设置
     */
    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.currentSettings = { ...this.currentSettings, ...parsed };
            } catch (e) {
                console.warn('设置加载失败，使用默认值');
            }
        }
    }

    /**
     * 保存设置到localStorage
     */
    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.currentSettings));
        this.applySettings();
        console.log('✓ 设置已保存');
    }

    /**
     * 应用设置到游戏
     */
    applySettings() {
        // 应用音量设置
        if (window.audioManager) {
            window.audioManager.setBGMVolume(this.currentSettings.bgmVolume / 100);
            window.audioManager.setSFXVolume(this.currentSettings.sfxVolume / 100);
        }
        
        // 应用画质设置
        if (this.currentSettings.quality === 'low') {
            // 降低粒子效果
        }
        
        // 应用自动存档
        // ...
        
        console.log('设置已应用到游戏');
    }

    /**
     * 重置所有设置
     */
    resetAllSettings() {
        this.currentSettings = {
            bgmVolume: 80,
            sfxVolume: 90,
            quality: 'high',
            particleEffect: true,
            autoSave: true,
            showHints: true,
            speedUp: false,
            keybinds: { ...this.defaultKeybinds }
        };
        this.saveSettings();
        this.updateSettingsUI();
    }

    /**
     * 更新设置UI显示
     */
    updateSettingsUI() {
        // 音量滑块
        const bgmSlider = document.getElementById('settings-bgm-volume');
        const sfxSlider = document.getElementById('settings-sfx-volume');
        const bgmValue = document.getElementById('bgm-value');
        const sfxValue = document.getElementById('sfx-value');
        
        if (bgmSlider) {
            bgmSlider.value = this.currentSettings.bgmVolume;
            bgmValue.textContent = this.currentSettings.bgmVolume + '%';
        }
        if (sfxSlider) {
            sfxSlider.value = this.currentSettings.sfxVolume;
            sfxValue.textContent = this.currentSettings.sfxVolume + '%';
        }
        
        // 画质按钮
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quality === this.currentSettings.quality);
        });
        
        // 开关
        const particleToggle = document.getElementById('particle-effect');
        const autoSaveToggle = document.getElementById('auto-save');
        const hintsToggle = document.getElementById('show-hints');
        const speedUpToggle = document.getElementById('speed-up');
        
        if (particleToggle) particleToggle.checked = this.currentSettings.particleEffect;
        if (autoSaveToggle) autoSaveToggle.checked = this.currentSettings.autoSave;
        if (hintsToggle) hintsToggle.checked = this.currentSettings.showHints;
        if (speedUpToggle) speedUpToggle.checked = this.currentSettings.speedUp;
        
        // 键位显示
        this.updateKeybindDisplay();
    }

    /**
     * 更新键位按钮显示
     */
    updateKeybindDisplay() {
        document.querySelectorAll('.keybind-btn').forEach(btn => {
            const action = btn.dataset.action;
            if (action && this.currentSettings.keybinds[action]) {
                btn.textContent = this.currentSettings.keybinds[action];
            }
        });
    }

    /**
     * 绑定设置页面事件
     */
    bindSettingsEvents() {
        // 音量滑块
        const bgmSlider = document.getElementById('settings-bgm-volume');
        const sfxSlider = document.getElementById('settings-sfx-volume');
        
        if (bgmSlider) {
            bgmSlider.addEventListener('input', (e) => {
                this.currentSettings.bgmVolume = parseInt(e.target.value);
                document.getElementById('bgm-value').textContent = e.target.value + '%';
            });
        }
        
        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => {
                this.currentSettings.sfxVolume = parseInt(e.target.value);
                document.getElementById('sfx-value').textContent = e.target.value + '%';
            });
        }
        
        // 画质按钮
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSettings.quality = btn.dataset.quality;
            });
        });
        
        // 开关
        document.getElementById('particle-effect')?.addEventListener('change', (e) => {
            this.currentSettings.particleEffect = e.target.checked;
        });
        
        document.getElementById('auto-save')?.addEventListener('change', (e) => {
            this.currentSettings.autoSave = e.target.checked;
        });
        
        document.getElementById('show-hints')?.addEventListener('change', (e) => {
            this.currentSettings.showHints = e.target.checked;
            // 更新底部操作提示显示
            const hints = document.getElementById('controls-hint');
            if (hints) {
                hints.style.display = e.target.checked ? 'block' : 'none';
            }
        });
        
        document.getElementById('speed-up')?.addEventListener('change', (e) => {
            this.currentSettings.speedUp = e.target.checked;
        });
        
        // 键位监听
        document.querySelectorAll('.keybind-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.startKeybindListening(e.target);
            });
        });
        
        // 全局键盘监听（用于键位设置）
        document.addEventListener('keydown', (e) => {
            if (this.listeningKeybind) {
                e.preventDefault();
                this.setKeybind(this.listeningKeybind, e);
            }
        });
        
        // 重置键位按钮
        document.getElementById('reset-keybinds')?.addEventListener('click', () => {
            this.currentSettings.keybinds = { ...this.defaultKeybinds };
            this.updateKeybindDisplay();
            console.log('键位已恢复默认');
        });
        
        // 保存设置按钮
        document.getElementById('save-settings')?.addEventListener('click', () => {
            this.saveSettings();
            // 显示保存成功提示
            const btn = document.getElementById('save-settings');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = '✓ 已保存!';
                btn.style.background = 'linear-gradient(135deg, #7AAA52, #6A9A42)';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 1500);
            }
        });
        
        // 重置全部设置按钮
        document.getElementById('reset-all-settings')?.addEventListener('click', () => {
            if (confirm('确定要重置所有设置为默认值吗？')) {
                this.resetAllSettings();
            }
        });
    }

    /**
     * 开始监听键位输入
     */
    startKeybindListening(btn) {
        // 取消之前的监听
        if (this.listeningKeybind) {
            this.listeningKeybind.classList.remove('listening');
            this.listeningKeybind.textContent = this.currentSettings.keybinds[this.listeningKeybind.dataset.action] || '?';
        }
        
        const action = btn.dataset.action;
        this.listeningKeybind = btn;
        btn.classList.add('listening');
        btn.textContent = '...';
    }

    /**
     * 设置键位
     */
    setKeybind(btn, event) {
        const action = btn.dataset.action;
        let keyName = event.key.toUpperCase();
        
        // 特殊键位名称
        const specialKeys = {
            ' ': '空格',
            'ARROWUP': '↑',
            'ARROWDOWN': '↓',
            'ARROWLEFT': '←',
            'ARROWRIGHT': '→',
            'SHIFT': 'Shift',
            'CTRL': 'Ctrl',
            'ALT': 'Alt',
            'ENTER': 'Enter',
            'BACKSPACE': '退格',
            'DELETE': 'Del',
            'TAB': 'Tab',
            'ESCAPE': 'ESC'
        };
        
        if (specialKeys[keyName]) {
            keyName = specialKeys[keyName];
        }
        
        // F1-F12键
        if (keyName.startsWith('F') && /^(F[1-9]|F1[0-2])$/.test(keyName)) {
            keyName = keyName;
        }
        
        // 检查是否与其他键位冲突
        for (const [act, key] of Object.entries(this.currentSettings.keybinds)) {
            if (key === keyName && act !== action) {
                // 交换键位
                this.currentSettings.keybinds[act] = btn.textContent;
                document.querySelector(`.keybind-btn[data-action="${act}"]`).textContent = btn.textContent;
                break;
            }
        }
        
        this.currentSettings.keybinds[action] = keyName;
        btn.classList.remove('listening');
        btn.textContent = keyName;
        this.listeningKeybind = null;
        
        // 更新全局键位配置
        this.updateGameKeybinds();
    }

    /**
     * 更新游戏键位配置
     */
    updateGameKeybinds() {
        if (window.GameConfig) {
            window.GameConfig.KEYS = {
                ...window.GameConfig.KEYS,
                ...this.currentSettings.keybinds
            };
        }
    }

    /**
     * 缓存 DOM 元素引用，避免频繁查询
     */
    cacheElements() {
        // 加载界面元素
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');

        // 游戏容器
        this.gameContainer = document.getElementById('game-container');

        // 小地图元素
        this.playerDot = document.getElementById('player-dot');

        // 时间显示
        this.dateDisplay = document.getElementById('date-display');
        this.timeDisplay = document.getElementById('time-display');
        this.seasonDisplay = document.getElementById('season-display');

        // 采集提示
        this.collectPrompt = document.getElementById('collect-prompt');
        this.collectSuccess = document.getElementById('collect-success');

        // 弹窗相关
        this.modalOverlay = document.getElementById('modal-overlay');

        // 调试面板
        this.debugPanel = document.getElementById('debug-panel');
        this.debugX = document.getElementById('debug-x');
        this.debugY = document.getElementById('debug-y');
        this.debugTime = document.getElementById('debug-time');
        this.debugCollected = document.getElementById('debug-collected');
        this.debugFps = document.getElementById('debug-fps');
    }

    /**
     * 绑定 UI 事件监听器
     */
    bindEvents() {
        // 使用事件委托绑定功能按钮点击事件
        document.addEventListener('click', (e) => {
            // 功能按钮点击
            const funcBtn = e.target.closest('.func-btn');
            if (funcBtn) {
                const modalId = funcBtn.dataset.modal + '-modal';
                console.log('UIManager: 点击功能按钮, modalId:', modalId);
                this.openModal(modalId);
                e.stopPropagation();
                return;
            }
            
            // 关闭按钮点击
            const closeBtn = e.target.closest('.modal-close');
            if (closeBtn) {
                this.closeAllModals();
                e.stopPropagation();
                return;
            }

            // 《本草情籍》分类标签点击切换
            const attrTag = e.target.closest('#attr-category-tags .tag');
            if (attrTag) {
                document.querySelectorAll('#attr-category-tags .tag').forEach(t => t.classList.remove('active'));
                attrTag.classList.add('active');
                this.currentAttrCategory = attrTag.dataset.attrCategory || 'all';
                this.selectedAttrId = null;
                this.updateAttributesUI();
                e.stopPropagation();
                return;
            }
        });

        // 遮罩层点击关闭
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', () => {
                this.closeAllModals();
            });
        }

        // 任务栏点击高亮
        document.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                taskItem.classList.toggle('selected');
            }
        });

        // 小地图点击打开大地图
        document.addEventListener('click', (e) => {
            const minimap = e.target.closest('#minimap');
            if (minimap) {
                this.openModal('map-modal');
            }
        });

        // 清禾药斋入口按钮
        document.addEventListener('click', (e) => {
            const qingheBtn = e.target.closest('#btn-qinghe-shop');
            if (qingheBtn) {
                this.goToQingheShop();
            }
        });
    }

    // ==================== 加载界面 ====================

    /**
     * 更新加载进度条
     * @param {number} value - 进度值 (0-100)
     * @param {string} text - 进度文字
     */
    updateProgress(value, text) {
        if (this.progressFill) {
            this.progressFill.style.width = value + '%';
        }
        if (text && this.progressText) {
            this.progressText.textContent = text;
        }
    }

    /**
     * 隐藏加载界面并显示游戏容器
     */
    showGameContainer() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
        if (this.gameContainer) {
            this.gameContainer.style.display = 'block';
        }
        window.gameStateManager.state.isGameStarted = true;
    }

    // ==================== 弹窗管理 ====================

    /**
     * 打开弹窗
     * @param {string} modalId - 弹窗元素ID
     */
    openModal(modalId) {
        this.closeAllModals();
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
        if (this.modalOverlay) {
            this.modalOverlay.classList.add('active');
        }

        // 打开《本草情籍》弹窗时，刷新属性面板数据
        if (modalId === 'attributes-modal') {
            this.selectedAttrId = null;
            this.currentAttrCategory = 'all';
            this.updateAttributesUI();
        }

        // 打开图鉴弹窗时刷新
        if (modalId === 'herb-guide-modal') {
            this.updateHerbGuideUI?.();
        }

        // 打开背包弹窗时刷新
        if (modalId === 'backpack-modal') {
            this.updateBackpackUI?.();
        }
    }

    /**
     * 关闭所有弹窗
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        if (this.modalOverlay) {
            this.modalOverlay.classList.remove('active');
        }
    }

    // ==================== 小地图 ====================

    /**
     * 更新小地图上玩家位置
     * @param {number} playerX - 玩家X坐标
     * @param {number} playerY - 玩家Y坐标
     */
    setMinimapBackground(dataUrl, imageWidth, imageHeight, mapWidth, mapHeight) {
        this.minimapBackground = {
            url: dataUrl,
            imageWidth,
            imageHeight,
            mapWidth,
            mapHeight
        };

        const minimapContent = document.getElementById('minimap-content');
        if (!minimapContent) return;

        minimapContent.style.backgroundImage = `url(${dataUrl})`;
        minimapContent.style.backgroundRepeat = 'no-repeat';
        minimapContent.style.backgroundPosition = 'center center';
        minimapContent.style.backgroundSize = `${Math.round(imageWidth * 3)}px ${Math.round(imageHeight * 3)}px`;
    }

    updateMinimap(playerX, playerY) {
        if (!this.playerDot || !window.GameConfig) return;

        const minimapContent = document.getElementById('minimap-content');
        if (!minimapContent) return;

        const minimapWidth = minimapContent.clientWidth;
        const minimapHeight = minimapContent.clientHeight;

        if (this.minimapBackground && this.minimapBackground.url) {
            const { imageWidth, imageHeight, mapWidth, mapHeight } = this.minimapBackground;
            const zoom = 0.9;
            const scaledWidth = imageWidth * zoom;
            const scaledHeight = imageHeight * zoom;
            const playerImageX = (playerX / mapWidth) * scaledWidth;
            const playerImageY = (playerY / mapHeight) * scaledHeight;
            let offsetX = Math.round(playerImageX - minimapWidth / 2);
            let offsetY = Math.round(playerImageY - minimapHeight / 2);
            offsetX = Math.min(Math.max(offsetX, 0), Math.max(0, scaledWidth - minimapWidth));
            offsetY = Math.min(Math.max(offsetY, 0), Math.max(0, scaledHeight - minimapHeight));

            minimapContent.style.backgroundSize = `${scaledWidth}px ${scaledHeight}px`;
            minimapContent.style.backgroundPosition = `-${offsetX}px -${offsetY}px`;

            this.playerDot.style.left = minimapWidth / 2 + 'px';
            this.playerDot.style.top = minimapHeight / 2 + 'px';
            return;
        }

        const worldW = window.GameConfig.currentMapWidth || window.GameConfig.WORLD_WIDTH;
        const worldH = window.GameConfig.currentMapHeight || window.GameConfig.WORLD_HEIGHT;
        const x = (playerX / worldW) * minimapWidth;
        const y = (playerY / worldH) * minimapHeight;

        this.playerDot.style.left = x + 'px';
        this.playerDot.style.top = y + 'px';
    }

    /**
     * 更新小地图标题
     */
    updateMinimapTitle() {
        const title = document.getElementById('minimap-title');
        if (!title || !window.GameConfig) return;
        const mapConfig = window.GameConfig.maps[window.GameConfig.currentMapId];
        const mapName = mapConfig ? mapConfig.name : '未知';
        title.textContent = '🗺️ ' + mapName;
    }

    // ==================== 时间显示 ====================

    /**
     * 更新时间显示
     * @param {string} timeName - 时辰名称
     * @param {number} hour - 小时数
     */
    updateTimeDisplay(timeName, hour) {
        if (this.timeDisplay) {
            this.timeDisplay.textContent = `${timeName} ${String(hour).padStart(2, '0')}:00`;
        }
    }

    // ==================== 采集提示 ====================

    /**
     * 显示采集提示
     * @param {string} herbName - 草药名称
     */
    showCollectPrompt(herbName) {
        if (this.collectPrompt) {
            this.collectPrompt.style.display = 'block';
            this.collectPrompt.textContent = `[E] 采集 ${herbName}`;
        }
    }

    /**
     * 隐藏采集提示
     */
    hideCollectPrompt() {
        if (this.collectPrompt) {
            this.collectPrompt.style.display = 'none';
        }
    }

    /**
     * 显示采集成功提示
     * @param {string} herbName - 草药名称
     */
    showCollectSuccess(herbName) {
        if (this.collectSuccess) {
            this.collectSuccess.textContent = `✓ 已采集：${herbName}`;
            this.collectSuccess.style.display = 'block';

            setTimeout(() => {
                this.collectSuccess.style.display = 'none';
            }, 1500);
        }
    }

    // ==================== 背包 UI（国风药篓） ====================
    
    // 当前选中的物品
    selectedHerbId = null;
    // 当前选中的类型（'herb' 或 'item'）
    selectedItemType = 'herb';
    // 当前筛选的分类
    currentCategory = 'all';
    // 总格子数（5列 x 4行）
    TOTAL_SLOTS = 20;

    /**
     * 更新背包UI显示（国风药篓版）—— 支持草药+物资混合展示
     */
    updateBackpackUI() {
        const grid = document.getElementById('backpack-grid');
        const content = document.getElementById('backpack-content');
        if (!grid || !content) return;

        const state = window.gameStateManager.getState();
        const HERBS_DATA = window.GameData.HERBS_DATA || [];
        const ITEMS_DATA = window.GameData.ITEMS_DATA || [];
        const CATEGORY_MAP = window.GameData.CATEGORY_MAP || {};

        // 根据当前分类筛选物品（草药 + 物资统一处理）
        let filteredItems = [];

        // 1. 筛选草药
        HERBS_DATA.forEach(herb => {
            const count = state.backpack[herb.id] || 0;
            if (count > 0) {
                if (this.currentCategory === 'all' || this.currentCategory === 'herb_all') {
                    filteredItems.push({ ...herb, count, itemType: 'herb' });
                } else if (CATEGORY_MAP[herb.category] === this.currentCategory) {
                    filteredItems.push({ ...herb, count, itemType: 'herb' });
                }
            }
        });

        // 2. 筛选物资/道具
        ITEMS_DATA.forEach(item => {
            let count = 0;

            // 铜钱特殊处理：存放在 gameState.copper
            if (item.id === 'copper') {
                count = state.copper || 0;
            } else if (state.inventory && state.inventory[item.id]) {
                count = state.inventory[item.id];
            }

            if (count > 0) {
                // 检查物品分类匹配
                if (this.currentCategory === 'all') {
                    filteredItems.push({ ...item, count, itemType: 'item' });
                } else if (item.category === this._categoryLabelToName(this.currentCategory)) {
                    filteredItems.push({ ...item, count, itemType: 'item' });
                }
            }
        });

        if (filteredItems.length === 0) {
            content.style.display = 'block';
            grid.style.display = 'none';
        } else {
            content.style.display = 'none';
            grid.style.display = 'grid';
            grid.innerHTML = '';

            // 渲染物品格子
            filteredItems.forEach(item => {
                const cell = this.createItemCell(item);
                grid.appendChild(cell);
            });

            // 填充空格
            for (let i = filteredItems.length; i < this.TOTAL_SLOTS; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'item-cell empty';
                grid.appendChild(emptyCell);
            }

            // 恢复选中状态或默认选中第一个
            if (this.selectedHerbId) {
                const found = filteredItems.find(it => it.id === this.selectedHerbId);
                if (found) {
                    this.showDetailPanel(this.selectedHerbId, this.selectedItemType);
                } else {
                    this.selectItem(filteredItems[0].id, filteredItems[0].itemType);
                }
            } else if (filteredItems.length > 0) {
                this.selectItem(filteredItems[0].id, filteredItems[0].itemType);
            }
        }

        // 更新顶部统计
        this.updateBackpackHeader(state);
        
        // 绑定分类标签事件
        this.bindCategoryEvents();
    }

    /**
     * 分类 ID 转中文名称映射（用于物资分类匹配）
     */
    _categoryLabelToName(catId) {
        const map = { 'supplies': '物资', 'documents': '文书', 'special': '特殊', 'pet': '灵宠道具' };
        return map[catId] || catId;
    }

    /**
     * 创建单个物品格子（支持草药和物资）
     * @param {Object} item - 草药或物品数据
     * @returns {HTMLElement}
     */
    createItemCell(item) {
        const cell = document.createElement('div');
        cell.className = 'item-cell' + (this.selectedHerbId === item.id ? ' selected' : '');
        cell.dataset.itemId = item.id;

        // 根据类型显示不同样式标记
        const typeBadge = item.itemType === 'item' ? '<span class="type-badge item-type">物</span>' : '';

        cell.innerHTML = `
            ${typeBadge}
            <span class="rarity-dot ${item.rarity}"></span>
            <span class="item-icon-emoji">${item.icon}</span>
            <span class="item-name-label">${item.name}</span>
            ${item.count > 1 ? `<span class="item-num">×${item.count}</span>` : ''}
        `;

        // 点击选中
        cell.addEventListener('click', () => {
            this.selectItem(item.id, item.itemType || 'herb');
        });

        return cell;
    }

    /**
     * 选中某个物品并显示详情
     * @param {string} itemId - 物品ID
     * @param {string} type - 'herb' 或 'item'
     */
    selectItem(itemId, type) {
        this.selectedHerbId = itemId;
        this.selectedItemType = type || 'herb';

        // 更新选中状态样式
        document.querySelectorAll('#backpack-grid .item-cell').forEach(cell => {
            cell.classList.toggle('selected', cell.dataset.itemId === itemId);
        });

        // 显示详情面板
        this.showDetailPanel(itemId, type);
    }

    /**
     * 显示右侧详情面板（支持草药和物资两种详情模板）
     * @param {string} itemId - 物品ID
     * @param {string} type - 'herb' 或 'item'
     */
    showDetailPanel(itemId, type) {
        const detailBody = document.getElementById('detail-body');
        const detailTitle = document.getElementById('detail-title');
        if (!detailBody || !detailTitle) return;

        const rarityColors = window.GameConfig.rarityColors || {};

        if (type === 'item') {
            // ===== 物资/道具详情 =====
            const item = (window.GameData.ITEMS_DATA || []).find(i => i.id === itemId);
            if (!item) return;
            const count = this._getItemCount(itemId);
            const rarityColor = rarityColors[item.rarity] || '#88AA77';

            detailTitle.textContent = `${item.icon} ${item.name}`;
            detailTitle.style.color = rarityColor;

            detailBody.innerHTML = `
                <div class="detail-icon-big" style="filter: drop-shadow(0 0 10px ${rarityColor}40)">${item.icon}</div>
                <div class="detail-desc">
                    <div class="desc-row"><span class="desc-label">【类型】</span>${this._getItemTypeLabel(item.type)}</div>
                    <div class="desc-row"><span class="desc-label">【描述】</span>${item.description || ''}</div>
                    ${count > 0 ? `<div class="desc-row" style="color:#6AAA5A;font-weight:bold;margin-top:6px;">🎒 拥有数量：×${count}</div>` : ''}
                </div>
                <div class="pet-tip" style="margin-top:8px;font-size:12px;color:#a08060;">${item.descDetail || ''}</div>
            `;
        } else {
            // ===== 草药详情（原有逻辑）=====
            const herb = (window.GameData.HERBS_DATA || []).find(h => h.id === itemId);
            if (!herb) return;

            const count = window.gameStateManager.getHerbCount(itemId);
            const rarityColor = rarityColors[herb.rarity] || '#88AA77';

            detailTitle.textContent = `${herb.icon} ${herb.name}`;
            detailTitle.style.color = rarityColor;

            detailBody.innerHTML = `
                <div class="detail-icon-big" style="filter: drop-shadow(0 0 10px ${rarityColor}40)">${herb.icon}</div>
                <div class="detail-desc">
                    <div class="desc-row"><span class="desc-label">【药性】</span>${herb.property}</div>
                    <div class="desc-row"><span class="desc-label">【归经】</span>${herb.meridian}</div>
                    <div class="desc-row"><span class="desc-label">【功效】</span>${herb.effect}</div>
                    <div class="desc-row"><span class="desc-label">【时节】</span>${herb.season}</div>
                    <div class="desc-row"><span class="desc-label">【产地】</span>${herb.origin}</div>
                    ${count > 0 ? `<div class="desc-row" style="color:#6AAA5A;font-weight:bold;margin-top:6px;">🎒 药篓中拥有：×${count}</div>` : ''}
                </div>
                <div class="pet-tip">${herb.petTip || ''}</div>
            `;
        }
    }

    /** 获取物品数量（支持铜钱、inventory等不同存储位置） */
    _getItemCount(itemId) {
        const state = window.gameStateManager.getState();
        if (itemId === 'copper') return state.copper || 0;
        return (state.inventory && state.inventory[itemId]) || 0;
    }

    /** 物品类型中文名 */
    _getItemTypeLabel(type) {
        const map = { currency: '货币', equipment: '装备', document: '文书', special: '特殊物品' };
        return map[type] || type;
    }

    /**
     * 更新背包头部信息（标题、负重和节气）—— 包含草药+物资统计
     */
    updateBackpackHeader(state) {
        let totalCount = 0;
        let typesCount = 0;

        // 统计草药
        (window.GameData.HERBS_DATA || []).forEach(herb => {
            const c = state.backpack[herb.id] || 0;
            totalCount += c;
            if (c > 0) typesCount++;
        });

        // 统计物资
        (window.GameData.ITEMS_DATA || []).forEach(item => {
            if (item.id === 'copper') {
                const c = state.copper || 0;
                if (c > 0) { totalCount += Math.ceil(c / 50); typesCount++; } // 铜钱按50=1单位算负重
            } else if (state.inventory && state.inventory[item.id]) {
                totalCount += state.inventory[item.id];
                typesCount++;
            }
        });

        // 更新标题
        const titleEl = document.querySelector('#backpack-modal .bag-title');
        if (titleEl) {
            titleEl.textContent = '🌿 百草行囊';
        }

        // 更新负重
        const weightEl = document.getElementById('weight-current');
        if (weightEl) {
            weightEl.textContent = Math.min(totalCount, 50);
        }

        // 动态更新节气（与游戏时间同步）
        this.updateSeasonDisplay();
    }

    /**
     * 更新节气/天气显示（背包头部 + 图鉴头部 + 左上角面板）
     */
    updateSeasonDisplay() {
        const state = window.gameStateManager.getState();

        // 背包头部的节气
        const seasonEl = document.querySelector('#backpack-modal .weight-info');
        if (seasonEl) {
            seasonEl.innerHTML = `负重：<span id="weight-current">${this._calcWeight(state)}</span>/50 · 节气：<strong>${state.currentSolarTerm || '寒露'}</strong>·${state.currentWeather || '晴'}`;
        }

        // 图鉴头部的节气
        const guideSolarEl = document.getElementById('guide-solar-term');
        if (guideSolarEl) {
            guideSolarEl.textContent = state.currentSolarTerm || '寒露';
        }

        // 左上角面板的日期+节气
        if (this.seasonDisplay) {
            this.seasonDisplay.textContent = `${window.gameStateManager.getSeasonWeatherString()}`;
        }
        if (this.dateDisplay) {
            this.dateDisplay.textContent = window.gameStateManager.getFormattedDate();
        }
    }

    /** 辅助：计算当前负重数（草药+物资） */
    _calcWeight(state) {
        let total = 0;
        (window.GameData.HERBS_DATA || []).forEach(h => { total += (state.backpack[h.id] || 0); });
        (window.GameData.ITEMS_DATA || []).forEach(item => {
            if (item.id === 'copper') {
                total += Math.ceil((state.copper || 0) / 50);
            } else {
                total += (state.inventory && state.inventory[item.id]) || 0;
            }
        });
        return Math.min(total, 50);
    }

    /**
     * 绑定分类标签点击事件
     */
    bindCategoryEvents() {
        const tags = document.querySelectorAll('#category-tags .tag');
        tags.forEach(tag => {
            tag.onclick = () => {
                // 切换active状态
                tags.forEach(t => t.classList.remove('active'));
                tag.classList.add('active');

                // 更新筛选分类
                this.currentCategory = tag.dataset.category;
                this.selectedHerbId = null; // 重置选中

                // 重新渲染
                this.updateBackpackUI();
            };
        });
    }

    // ==================== 清禾药斋 ====================

    /**
     * 前往清禾药斋（商城/当铺入口）
     * 关闭背包弹窗，打开药斋界面（预留扩展）
     */
    goToQingheShop() {
        this.closeAllModals();

        // TODO: 以后可拓展为独立的商城/当铺界面
        // 当前先打开药铺弹窗作为过渡
        setTimeout(() => {
            this.openModal('medicine-shop-modal');
            // 可以在这里添加药斋特有的初始化逻辑
            console.log('🏪 已进入清禾药斋 - 商城/当铺功能开发中...');
        }, 300);
    }

    // ==================== 图鉴 UI（国风图谱） ====================

    // 当前图鉴筛选的病症
    currentSymptom = 'all';
    // 当前选中的草药ID（用于详情面板）
    selectedGuideHerbId = null;

    /**
     * 更新草药图鉴UI显示（国风版 - 含病症分类、图片预留、点击详情）
     */
    updateHerbGuideUI() {
        const grid = document.getElementById('guide-grid');
        if (!grid) return;

        const state = window.gameStateManager.getState();
        const HERBS_DATA = window.GameData.HERBS_DATA;
        const SYMPTOM_CATEGORIES = window.GameData.SYMPTOM_CATEGORIES || [];
        const rarityColors = window.GameConfig.rarityColors;

        // 按病症筛选
        let filteredHerbs = [];
        HERBS_DATA.forEach(herb => {
            if (this.currentSymptom === 'all' || herb.symptom === this.currentSymptom) {
                filteredHerbs.push(herb);
            }
        });

        grid.innerHTML = '';

        // 渲染卡片
        filteredHerbs.forEach(herb => {
            const unlocked = state.unlockedHerbs.includes(herb.id);
            const count = state.backpack[herb.id] || 0;
            const card = this.createGuideCard(herb, unlocked, count, rarityColors);
            grid.appendChild(card);
        });

        // 更新统计
        this.updateGuideHeader(state, HERBS_DATA);

        // 绑定病症标签事件
        this.bindSymptomEvents();

        // 如果之前选中了物品，恢复详情
        if (this.selectedGuideHerbId) {
            this.showGuideDetail(this.selectedGuideHerbId);
        }
    }

    /**
     * 创建单个图鉴卡片
     * @param {Object} herb - 草药数据
     * @param {boolean} unlocked - 是否已解锁
     * @param {number} count - 拥有数量
     * @param {Object} rarityColors - 稀有度颜色映射
     * @returns {HTMLElement}
     */
    createGuideCard(herb, unlocked, count, rarityColors) {
        const card = document.createElement('div');
        const rColor = rarityColors[herb.rarity] || '#88AA77';
        card.className = 'guide-card' + (!unlocked ? ' locked' : '') + (this.selectedGuideHerbId === herb.id ? ' selected' : '');
        card.dataset.herbId = herb.id;

        if (unlocked) {
            // 图片区域：优先用 image 字段，没有则用 emoji
            const imgContent = herb.image
                ? `<img src="${herb.image}" alt="${herb.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
                    <span class="guide-card-icon" style="display:none;">${herb.icon}</span>`
                : `<span class="guide-card-icon">${herb.icon}</span>`;

            card.innerHTML = `
                <span class="guide-card-rarity" style="background:${rColor}">${herb.rarityLabel}</span>
                ${herb.symptom ? `<span class="guide-card-symptom">${herb.symptom}</span>` : ''}
                <div class="guide-card-image">${imgContent}</div>
                <span class="guide-card-name">${herb.name}</span>
                ${count > 0 ? `<span style="position:absolute;bottom:3px;right:4px;font-size:10px;color:#6AAA5A;font-weight:bold;background:rgba(255,255,255,0.85);padding:0 4px;border-radius:3px;">×${count}</span>` : ''}
            `;

            card.addEventListener('click', () => { this.selectGuideCard(herb.id); });
        } else {
            card.innerHTML = `
                <div class="guide-card-image"><span class="guide-card-icon">🔒</span></div>
                <span class="guide-card-name">???</span>
                <span class="guide-lock-hint">未发现</span>
            `;
        }

        return card;
    }

    /**
     * 选中图鉴卡片并显示详情
     * @param {string} herbId - 草药ID
     */
    selectGuideCard(herbId) {
        if (!window.gameStateManager.isHerbUnlocked(herbId)) return;

        this.selectedGuideHerbId = herbId;

        // 更新选中样式
        document.querySelectorAll('#guide-grid .guide-card').forEach(c => {
            c.classList.toggle('selected', c.dataset.herbId === herbId);
        });

        // 显示详情面板
        this.showGuideDetail(herbId);
    }

    /**
     * 显示图鉴右侧详情面板
     * @param {string} herbId - 草药ID
     */
    showGuideDetail(herbId) {
        const detailBody = document.getElementById('guide-detail-body');
        const detailTitle = document.getElementById('guide-detail-title');
        if (!detailBody || !detailTitle) return;

        const herb = window.GameData.HERBS_DATA.find(h => h.id === herbId);
        if (!herb) return;

        const unlocked = window.gameStateManager.isHerbUnlocked(herbId);
        const count = window.gameStateManager.getHerbCount(herbId);
        const rarityColors = window.GameConfig.rarityColors;
        const rColor = rarityColors[herb.rarity] || '#88AA77';

        if (!unlocked) {
            detailTitle.textContent = '🔒 未解锁';
            detailTitle.style.color = '#999';
            detailBody.innerHTML = `<p style="text-align:center;color:#c4b5a0;padding:30px 0;">采集此草药后<br>可查看详细信息</p>`;
            return;
        }

        detailTitle.innerHTML = `${herb.icon} ${herb.name}`;
        detailTitle.style.color = rColor;

        // 图片展示区（预留，有图片则显示图片，无则大图标）
        const imageArea = herb.image
            ? `<div style="text-align:center;margin-bottom:10px;"><img src="${herb.image}" style="max-width:180px;max-height:120px;border-radius:8px;border:2px solid #d4b89a;object-fit:cover;" onerror="this.outerHTML='<span class=\'detail-icon-big\'>${herb.icon}</span>'"></div>`
            : `<div class="detail-icon-big" style="filter: drop-shadow(0 0 10px ${rColor}40)">${herb.icon}</div>`;

        detailBody.innerHTML = `
            ${imageArea}
            <div class="detail-desc">
                <div class="desc-row"><span class="desc-label">【药性】</span>${herb.property}</div>
                <div class="desc-row"><span class="desc-label">【归经】</span>${herb.meridian}</div>
                <div class="desc-row"><span class="desc-label">【功效】</span>${herb.effect}</div>
                <div class="desc-row"><span class="desc-label">【主治病症】</span><strong style="color:${rColor}">${herb.symptom || '-'}</strong></div>
                <div class="desc-row"><span class="desc-label">【时节】</span>${herb.season}</div>
                <div class="desc-row"><span class="desc-label">【产地】</span>${herb.origin}</div>
                ${herb.descDetail ? `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #e0d4c0;font-size:12px;color:#7a5a33;line-height:1.8;">📜 ${herb.descDetail}</div>` : ''}
                ${count > 0 ? `<div class="desc-row" style="color:#6AAA5A;font-weight:bold;margin-top:6px;">🎒 药篓中拥有：×${count}</div>` : ''}
            </div>
            <div class="pet-tip">${herb.petTip || ''}</div>
        `;
    }

    /**
     * 更新图鉴头部统计
     */
    updateGuideHeader(state, HERBS_DATA) {
        const unlockedCount = state.unlockedHerbs.length;
        const totalCount = HERBS_DATA.length;

        const unlockEl = document.getElementById('guide-unlocked');
        const totalEl = document.getElementById('guide-total');

        if (unlockEl) unlockEl.textContent = unlockedCount;
        if (totalEl) totalEl.textContent = totalCount;

        // 更新节气
        this.updateSeasonDisplay();
    }

    /**
     * 绑定病症标签点击事件
     */
    bindSymptomEvents() {
        const tags = document.querySelectorAll('#symptom-tags .tag');
        tags.forEach(tag => {
            tag.onclick = () => {
                tags.forEach(t => t.classList.remove('active'));
                tag.classList.add('active');

                this.currentSymptom = tag.dataset.symptom;
                this.selectedGuideHerbId = null;

                this.updateHerbGuideUI();
            };
        });
    }

    // ==================== 《本草情籍》属性面板 UI ====================

    // 当前选中的属性ID
    selectedAttrId = null;
    // 当前筛选的属性分类
    currentAttrCategory = 'all';

    /**
     * 更新《本草情籍》属性面板UI
     */
    updateAttributesUI() {
        const list = document.getElementById('attr-list');
        if (!list) return;

        const state = window.gameStateManager.getState();
        const ATTRIBUTES_DATA = window.GameData.ATTRIBUTES_DATA || [];
        const CATEGORY_MAP = { medical: 'medical', social: 'social', special: 'special' };

        // 按分类筛选
        let filtered = [];
        ATTRIBUTES_DATA.forEach(attr => {
            if (this.currentAttrCategory === 'all' || CATEGORY_MAP[this.currentAttrCategory] === attr.category) {
                filtered.push(attr);
            }
        });

        list.innerHTML = '';

        if (filtered.length === 0) {
            list.innerHTML = `<p style="text-align:center;color:#916c44;padding:40px 0;font-size:14px;">暂无该类属性</p>`;
            return;
        }

        // 渲染属性卡片
        filtered.forEach(attr => {
            const currentVal = this._getAttrValue(attr.id, attr);
            const pct = Math.round((currentVal / attr.maxValue) * 100);
            const card = document.createElement('div');
            card.className = 'attr-card' + (this.selectedAttrId === attr.id ? ' selected' : '');
            card.dataset.attrId = attr.id;
            card.dataset.cat = attr.category;
            card.style.setProperty('--attr-color', this._getAttrColor(attr.category));
            card.style.setProperty('--attr-color-light', this._getAttrColorLight(attr.category));

            card.innerHTML = `
                <div class="attr-icon">${attr.icon}</div>
                <div class="attr-info">
                    <div class="attr-name-row">
                        <span class="attr-name">${attr.name}</span>
                        <span class="attr-value">${currentVal}<small style="font-size:11px;color:#8a7355;">/${attr.maxValue}</small></span>
                    </div>
                    <div class="attr-desc">${attr.description}</div>
                    <div class="attr-bar-wrap">
                        <div class="attr-bar-fill" style="width:${pct}%"></div>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => this.selectAttribute(attr.id));
            list.appendChild(card);
        });

        // 绑定分类标签事件（已改用事件委托，无需每次调用）
        // this.bindAttrCategoryEvents();

        // 更新底部总评
        this.updateAttrSummary(state, ATTRIBUTES_DATA);

        // 恢复选中详情
        if (this.selectedAttrId) {
            this.showAttrDetail(this.selectedAttrId);
        } else if (filtered.length > 0) {
            this.selectAttribute(filtered[0].id);
        }
    }

    /**
     * 获取属性当前值（统一数据源：已初始化用实际值，未初始化用定义中的 initialValue）
     * @param {string} attrId
     * @param {Object} [attrDef] - 属性定义对象（可选，用于 fallback）
     * @returns {number}
     */
    _getAttrValue(attrId, attrDef) {
        const state = window.gameStateManager?.getState();
        const val = state?.attributes?.[attrId];
        // 已存储则返回实际值；否则返回定义的初始值（避免显示0）
        if (val !== undefined && val !== null) return val;
        return attrDef ? attrDef.initialValue : 0;
    }

    /** 获取属性主题色 */
    _getAttrColor(category) {
        return { medical: '#4a9a6a', social: '#c49a30', special: '#8a6ac4' }[category] || '#8b7355';
    }

    _getAttrColorLight(category) {
        return { medical: '#7acaa0', social: '#e8c860', special: '#b09ae8' }[category] || '#c4a870';
    }

    /**
     * 选中某个属性并显示详情
     */
    selectAttribute(attrId) {
        this.selectedAttrId = attrId;

        document.querySelectorAll('#attr-list .attr-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.attrId === attrId);
        });

        this.showAttrDetail(attrId);
    }

    /**
     * 显示右侧属性详情面板
     */
    showAttrDetail(attrId) {
        const body = document.getElementById('attr-detail-body');
        const title = document.getElementById('attr-detail-title');
        if (!body || !title) return;

        const attr = (window.GameData.ATTRIBUTES_DATA || []).find(a => a.id === attrId);
        if (!attr) return;

        const currentVal = this._getAttrValue(attrId, attr);
        const pct = Math.round((currentVal / attr.maxValue) * 100);
        const color = this._getAttrColor(attr.category);

        title.innerHTML = `${attr.icon} ${attr.name}`;
        title.style.color = color;

        body.innerHTML = `
            <div style="text-align:center;margin-bottom:14px;">
                <span style="font-size:42px;filter:drop-shadow(0 0 12px ${color}50)">${attr.icon}</span>
            </div>
            <div class="attr-detail-section">
                <div class="attr-detail-label">【当前数值】</div>
                <div class="attr-detail-text" style="font-size:22px;font-weight:bold;color:${color};">
                    ${currentVal} <span style="font-size:13px;color:#8a7355;">/ ${attr.maxValue}</span>
                    <span style="margin-left:8px;font-size:12px;background:${color}22;color:${color};padding:2px 8px;border-radius:8px;border:1px solid ${color}44;">${pct}%</span>
                </div>
                <div class="attr-bar-wrap" style="margin-top:8px;height:8px;">
                    <div class="attr-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${color},${this._getAttrColorLight(attr.category)})"></div>
                </div>
            </div>
            <div class="attr-detail-section">
                <div class="attr-detail-label">【属性简介】</div>
                <div class="attr-detail-text">${attr.description}</div>
            </div>
            <div class="attr-detail-section">
                <div class="attr-detail-label">【详细说明】</div>
                <div class="attr-detail-text" style="line-height:2;">${attr.detail || ''}</div>
            </div>
            <div class="attr-growth-rule">
                <span class="rule-label">📈 成长规则：</span>${attr.growthRule || '-'}
            </div>
        `;
    }

    /**
     * 更新底部总评（综合评价 + 等级）
     * 评级规则：基于核心属性（医术+声望）的加权均值
     *   Lv.0 学徒未成   avg < 5%   — 刚入门，基础薄弱
     *   Lv.1 初入医途   avg < 15%  — 堂毕业，略知皮毛
     *  Lv.2 小有名气   avg < 30%  — 能处理常见病症
     *   Lv.3 乡野良医   avg < 50%  — 四方百姓信赖
     *   Lv.4 杏林名家   avg < 70%  — 医术精湛，声名远播
     *   Lv.5 国手圣医   avg >= 70% — 妙手回春，一代宗师
     */
    // 评级规则表（供剧情脚本参考使用）
    ATTR_RANK_RULES = [
        { minPct: 0,   level: 0, rank: '学徒未成',   color: '#808080', desc: '初识药理，尚需勤学' },
        { minPct: 5,   level: 1, rank: '初入医途',   color: '#8b7355', desc: '堂毕业，略知皮毛' },
        { minPct: 15,  level: 2, rank: '小有名气',   color: '#4a9a6a', desc: '能治常见病症' },
        { minPct: 30,  level: 3, rank: '乡野良医',   color: '#2a8a5a', desc: '四方百姓信赖' },
        { minPct: 50,  level: 4, rank: '杏林名家',   color: '#c49a30', desc: '医术精湛，声名远播' },
        { minPct: 70,  level: 5, rank: '国手圣医',   color: '#e04040', desc: '妙手回春，一代宗师' }
    ];

    updateAttrSummary(state, ATTRIBUTES_DATA) {
        const rankEl = document.getElementById('attr-rank');
        const levelEl = document.getElementById('attr-total-level');
        if (!rankEl || !levelEl) return;

        // 核心属性：医术(权重1.2) + 声望(权重1.0)，排除特殊类
        const coreAttrs = ATTRIBUTES_DATA.filter(a => a.category !== 'special');
        if (coreAttrs.length === 0) return;

        let weightedSum = 0;
        let totalWeight = 0;
        coreAttrs.forEach(a => {
            const val = this._getAttrValue(a.id, a);
            const weight = a.category === 'medical' ? 1.2 : 1.0; // 医术属性权重更高
            weightedSum += (val / a.maxValue) * 100 * weight;
            totalWeight += weight;
        });
        const avgPct = Math.round(weightedSum / totalWeight);

        // 查表确定段位（从高到低匹配）
        let matched = this.ATTR_RANK_RULES[0];
        for (let i = this.ATTR_RANK_RULES.length - 1; i >= 0; i--) {
            if (avgPct >= this.ATTR_RANK_RULES[i].minPct) {
                matched = this.ATTR_RANK_RULES[i];
                break;
            }
        }

        rankEl.textContent = matched.rank;
        rankEl.style.color = matched.color;
        levelEl.textContent = `Lv.${matched.level}`;
        levelEl.style.color = matched.color;
        levelEl.style.borderColor = matched.color + '66';

        // 设置段位描述
        const descEl = document.getElementById('attr-rank-desc');
        if (descEl) {
            descEl.textContent = `— ${matched.desc}`;
            descEl.style.color = matched.color + 'aa';
        }
    }

    /**
     * 绑定属性面板分类标签事件（事件委托，在bindEvents中一次性绑定）
     */
    bindAttrCategoryEvents() {
        // 事件委托已移至 bindEvents() 中统一处理，此处保留为空以兼容调用
        // 不再每次渲染时重复绑定
    }

    /**
     * 更新任务进度显示
     */
    updateTaskProgress() {
        const task1 = document.querySelector('[data-task="1"]');
        if (!task1) return;

        const checkbox = task1.querySelector('.task-checkbox');
        const taskText = task1.querySelector('.task-text');

        const gancaoCount = window.gameStateManager.getHerbCount('gancao');
        taskText.textContent = `采集甘草 ×3 (${Math.min(gancaoCount, 3)}/3)`;

        if (gancaoCount >= 3) {
            checkbox.textContent = '✓';
            checkbox.style.color = '#4a7c28';
        }
    }

    // ==================== 调试信息 ====================

    /**
     * 切换调试面板显示
     * @param {boolean} show - 是否显示
     */
    toggleDebugPanel(show) {
        if (this.debugPanel) {
            this.debugPanel.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * 更新调试信息显示
     * @param {Object} params - 调试参数
     * @param {number} params.x - 玩家X坐标
     * @param {number} params.y - 玩家Y坐标
     * @param {string} params.time - 当前时辰
     * @param {number} params.fps - 帧率
     */
    updateDebugInfo({ x, y, time, fps }) {
        if (this.debugX) this.debugX.textContent = Math.floor(x);
        if (this.debugY) this.debugY.textContent = Math.floor(y);
        if (this.debugTime) this.debugTime.textContent = time;
        if (this.debugCollected) this.debugCollected.textContent = window.gameStateManager.state.collectedCount;
        if (this.debugFps) this.debugFps.textContent = fps ? fps.toFixed(0) : '60';
    }
}

// 创建全局单例实例
window.uiManager = new UIManager();
