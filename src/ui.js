/**
 * UI 管理模块 - UIManager
 * 处理所有 HTML UI 的交互和更新
 */

class UIManager {
    constructor() {
        this.cacheElements();
        this.bindEvents();
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
        // 功能按钮点击事件
        document.querySelectorAll('.func-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal + '-modal';
                this.openModal(modalId);
            });
        });

        // 关闭按钮事件
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // 遮罩层点击关闭
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', () => {
                this.closeAllModals();
            });
        }

        // 任务栏点击高亮
        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
            });
        });

        // 小地图点击打开大地图
        const minimap = document.getElementById('minimap');
        if (minimap) {
            minimap.addEventListener('click', () => {
                this.openModal('map-modal');
            });
        }

        // 清禾药斋入口按钮
        const qingheBtn = document.getElementById('btn-qinghe-shop');
        if (qingheBtn) {
            qingheBtn.addEventListener('click', () => {
                this.goToQingheShop();
            });
        }
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
    updateMinimap(playerX, playerY) {
        if (!this.playerDot || !window.GameConfig) return;

        const mapWidth = 220;
        const mapHeight = 130;
        const x = (playerX / window.GameConfig.WORLD_WIDTH) * mapWidth + 10;
        const y = (playerY / window.GameConfig.WORLD_HEIGHT) * mapHeight + 10;

        this.playerDot.style.left = x + 'px';
        this.playerDot.style.top = y + 'px';
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
    // 当前筛选的分类
    currentCategory = 'all';
    // 总格子数（5列 x 4行）
    TOTAL_SLOTS = 20;

    /**
     * 更新背包UI显示（国风药篓版）
     */
    updateBackpackUI() {
        const grid = document.getElementById('backpack-grid');
        const content = document.getElementById('backpack-content');
        if (!grid || !content) return;

        const state = window.gameStateManager.getState();
        const HERBS_DATA = window.GameData.HERBS_DATA;
        const CATEGORY_MAP = window.GameData.CATEGORY_MAP;

        // 筛选当前分类下的草药
        let filteredItems = [];
        HERBS_DATA.forEach(herb => {
            const count = state.backpack[herb.id] || 0;
            if (count > 0) {
                // 检查分类匹配
                if (this.currentCategory === 'all') {
                    filteredItems.push({ ...herb, count });
                } else if (CATEGORY_MAP[herb.category] === this.currentCategory) {
                    filteredItems.push({ ...herb, count });
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
            filteredItems.forEach(herb => {
                const cell = this.createItemCell(herb);
                grid.appendChild(cell);
            });

            // 填充空格
            for (let i = filteredItems.length; i < this.TOTAL_SLOTS; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'item-cell empty';
                grid.appendChild(emptyCell);
            }

            // 如果之前选中了物品，重新显示详情
            if (this.selectedHerbId) {
                this.showDetailPanel(this.selectedHerbId);
            } else if (filteredItems.length > 0) {
                // 默认选中第一个
                this.selectItem(filteredItems[0].id);
            }
        }

        // 更新顶部统计
        this.updateBackpackHeader(state, HERBS_DATA);
        
        // 绑定分类标签事件
        this.bindCategoryEvents();
    }

    /**
     * 创建单个物品格子
     * @param {Object} herb - 草药数据
     * @returns {HTMLElement}
     */
    createItemCell(herb) {
        const cell = document.createElement('div');
        cell.className = 'item-cell' + (this.selectedHerbId === herb.id ? ' selected' : '');
        cell.dataset.herbId = herb.id;

        cell.innerHTML = `
            <span class="rarity-dot ${herb.rarity}"></span>
            <span class="item-icon-emoji">${herb.icon}</span>
            <span class="item-name-label">${herb.name}</span>
            ${herb.count > 1 ? `<span class="item-num">×</span>${herb.count}` : ''}
        `;

        // 点击选中
        cell.addEventListener('click', () => {
            this.selectItem(herb.id);
        });

        return cell;
    }

    /**
     * 选中某个物品并显示详情
     * @param {string} herbId - 草药ID
     */
    selectItem(herbId) {
        this.selectedHerbId = herbId;

        // 更新选中状态样式
        document.querySelectorAll('#backpack-grid .item-cell').forEach(cell => {
            cell.classList.toggle('selected', cell.dataset.herbId === herbId);
        });

        // 显示详情面板
        this.showDetailPanel(herbId);
    }

    /**
     * 显示右侧详情面板
     * @param {string} herbId - 草药ID
     */
    showDetailPanel(herbId) {
        const detailBody = document.getElementById('detail-body');
        const detailTitle = document.getElementById('detail-title');
        if (!detailBody || !detailTitle) return;

        const herb = window.GameData.HERBS_DATA.find(h => h.id === herbId);
        if (!herb) return;

        const count = window.gameStateManager.getHerbCount(herbId);
        const rarityColors = window.GameConfig.rarityColors;
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

    /**
     * 更新背包头部信息（标题、负重和节气）
     */
    updateBackpackHeader(state, HERBS_DATA) {
        let totalCount = 0;
        let typesCount = 0;
        HERBS_DATA.forEach(herb => {
            const c = state.backpack[herb.id] || 0;
            totalCount += c;
            if (c > 0) typesCount++;
        });

        // 更新标题
        const titleEl = document.querySelector('#backpack-modal .bag-title');
        if (titleEl) {
            titleEl.textContent = `🌿 百草药篓`;
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

    /** 辅助：计算当前负重数 */
    _calcWeight(state) {
        let total = 0;
        (window.GameData.HERBS_DATA || []).forEach(h => { total += (state.backpack[h.id] || 0); });
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

    // ==================== 任务进度 ====================

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
