/**
 * 游戏状态管理模块 - GameState
 * 管理所有运行时的游戏状态
 */

class GameStateManager {
    constructor() {
        this.reset();
    }

    /**
     * 重置游戏状态到初始值
     */
    reset() {
        this.state = {
            // 背包系统：{ herbId: count }
            backpack: {},

            // 物资/道具库存：{ itemId: count }（非草药类物品）
            inventory: {},

            // 铜钱数量
            copper: 0,

            // 已解锁图鉴的草药ID列表
            unlockedHerbs: [],

            // 总采集数量统计
            collectedCount: 0,
            
            // 时辰系统
            currentTime: window.GameConfig?.timeSystem?.defaultTime || '寅时',
            
            // 日期系统
            currentMonth: '九月',
            currentDay: 17,
            currentSolarTerm: '寒露',
            currentWeather: '晴',

            // 时间tick计数（用于推进日期）
            dayTickCount: 0,

            // 调试模式开关
            debugMode: false,

            // 游戏是否已开始
            isGameStarted: false,

            // 剧情系统：已触发的事件ID集合
            storyEventsFired: new Set(),

            // 剧情系统：已完成的地点集合
            completedLocations: new Set(),

            // 《本草情籍》属性数值：{ attrId: value }
            attributes: {}
        };
    }

    /**
     * 检查是否首次玩游戏（基于localStorage）
     * @returns {boolean} 是否首次
     */
    isFirstPlay() {
        const hasPlayed = localStorage.getItem('baicaoxing_has_played');
        return hasPlayed !== 'true';
    }

    /**
     * 标记为已玩过（存储到localStorage）
     */
    markAsPlayed() {
        try {
            localStorage.setItem('baicaoxing_has_played', 'true');
            console.log('GameState: 已标记为玩过');
        } catch (e) {
            console.error('GameState: 存储标记失败', e);
        }
    }

    /**
     * 重置首次游戏标记（用于测试）
     */
    resetFirstPlayFlag() {
        try {
            localStorage.removeItem('baicaoxing_has_played');
            console.log('GameState: 已重置首次游戏标记');
        } catch (e) {
            console.error('GameState: 重置标记失败', e);
        }
    }

    /**
     * 添加草药到背包
     * @param {string} herbId - 草药ID
     * @returns {boolean} 是否首次获得该草药
     */
    addHerbToBackpack(herbId) {
        if (!this.state.backpack[herbId]) {
            this.state.backpack[herbId] = 0;
        }
        this.state.backpack[herbId]++;
        this.state.collectedCount++;

        // 首次采集解锁图鉴
        const isNewUnlock = !this.state.unlockedHerbs.includes(herbId);
        if (isNewUnlock) {
            this.state.unlockedHerbs.push(herbId);
        }

        return isNewUnlock;
    }

    /**
     * 获取指定草药的数量
     * @param {string} herbId - 草药ID
     * @returns {number} 数量
     */
    getHerbCount(herbId) {
        return this.state.backpack[herbId] || 0;
    }

    /**
     * 检查草药是否已解锁图鉴
     * @param {string} herbId - 草药ID
     * @returns {boolean}
     */
    isHerbUnlocked(herbId) {
        return this.state.unlockedHerbs.includes(herbId);
    }

    /**
     * 切换调试模式
     */
    toggleDebugMode() {
        this.state.debugMode = !this.state.debugMode;
        return this.state.debugMode;
    }

    /**
     * 更新当前时间
     * @param {string} time - 新时间
     */
    setCurrentTime(time) {
        this.state.currentTime = time;
    }

    /**
     * 推进一天（由时间系统调用）
     */
    advanceDay() {
        const monthOrder = window.GameConfig?.monthOrder || ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
        const solarTerms = window.GameConfig?.solarTerms || {};
        const weathers = window.GameConfig?.weathers || ['晴'];

        this.state.currentDay++;
        const daysInMonth = 30; // 每月30天简化

        // 跨月
        if (this.state.currentDay > daysInMonth) {
            this.state.currentDay = 1;
            const curIdx = monthOrder.indexOf(this.state.currentMonth);
            this.state.currentMonth = monthOrder[(curIdx + 1) % monthOrder.length];
        }

        // 更新节气（每月两个节气，上半月一个，下半月一个）
        const terms = solarTerms[this.state.currentMonth];
        if (terms && terms.length >= 2) {
            this.state.currentSolarTerm = this.state.currentDay <= 15 ? terms[0] : terms[1];
        }

        // 随机天气
        this.state.currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
    }

    /**
     * 获取格式化的日期字符串
     * @returns {string} 如 "九月十七"
     */
    getFormattedDate() {
        return `${this.state.currentMonth}${this.state.currentDay > 10 ? this.state.currentDay : '0' + this.state.currentDay}`;
    }

    /**
     * 获取完整的节气天气字符串
     * @returns {string} 如 "寒露·晴"
     */
    getSeasonWeatherString() {
        return `${this.state.currentSolarTerm}·${this.state.currentWeather}`;
    }

    /**
     * 获取当前状态（只读副本）
     * @returns {Object}
     */
    getState() {
        return { ...this.state };
    }

    /**
     * 初始化所有属性为初始值（序章结束时调用）
     */
    initAttributes() {
        const ATTRIBUTES_DATA = window.GameData?.ATTRIBUTES_DATA || [];
        this.state.attributes = {};
        ATTRIBUTES_DATA.forEach(attr => {
            this.state.attributes[attr.id] = attr.initialValue;
        });
        console.log('GameState: 属性已初始化', { ...this.state.attributes });
    }

    /**
     * 获取指定属性的当前值
     * @param {string} attrId - 属性ID
     * @returns {number} 当前值（未初始化返回0）
     */
    getAttribute(attrId) {
        return this.state.attributes[attrId] || 0;
    }

    /**
     * 设置属性值（直接赋值，不超过最大值）
     * @param {string} attrId - 属性ID
     * @param {number} value - 目标值
     * @returns {number} 实际设置后的值
     */
    setAttribute(attrId, value) {
        const ATTRIBUTES_DATA = window.GameData?.ATTRIBUTES_DATA || [];
        const def = ATTRIBUTES_DATA.find(a => a.id === attrId);
        const maxVal = def ? def.maxValue : 999;
        this.state.attributes[attrId] = Math.max(0, Math.min(value, maxVal));
        return this.state.attributes[attrId];
    }

    /**
     * 增加属性值（增量方式，用于剧情奖励等场景）
     * @param {string} attrId - 属性ID
     * @param {number} delta - 增量（可正可负）
     * @returns {number} 增加后的实际值
     */
    addAttribute(attrId, delta) {
        const current = this.getAttribute(attrId);
        return this.setAttribute(attrId, current + delta);
    }

    /**
     * 批量增加属性值（剧情奖励常用）
     * @param {Array<{id:string, delta:number}>} changes - 变更数组 [{id:'reputation', delta:10}, ...]
     */
    batchAddAttributes(changes) {
        if (!Array.isArray(changes)) return;
        changes.forEach(change => {
            if (change.id && typeof change.delta === 'number') {
                this.addAttribute(change.id, change.delta);
            }
        });
        console.log('GameState: 批量属性更新完成', { ...this.state.attributes });
    }

    /**
     * 序列化保存状态（可用于存档）
     * @returns {string} JSON字符串
     */
    serialize() {
        return JSON.stringify(this.state);
    }

    /**
     * 从JSON恢复状态
     * @param {string} jsonStr - JSON字符串
     */
    deserialize(jsonStr) {
        try {
            this.state = JSON.parse(jsonStr);
            return true;
        } catch (e) {
            console.error('GameState 反序列化失败:', e);
            return false;
        }
    }
}

// 创建全局单例实例
window.gameStateManager = new GameStateManager();

// 向后兼容的快捷访问
window.gameState = window.gameStateManager.state;

// ==================== 剧情脚本便捷接口（全局函数）====================

/**
 * 【剧情脚本专用】增加主角属性值
 * 用法: GameAttr.add('reputation', 15);
 * @param {string} attrId - 属性ID（如 'herb_knowledge', 'gathering' 等）
 * @param {number} delta - 增加量（可正可负，负数表示减少）
 * @returns {number} 变更后的实际值
 */
window.GameAttr = {
    /** 增加单个属性 */
    add(attrId, delta) {
        if (!window.gameStateManager) {
            console.warn('GameAttr: gameStateManager 未初始化');
            return 0;
        }
        return window.gameStateManager.addAttribute(attrId, delta);
    },

    /** 批量增加属性（剧情奖励推荐使用此方法）
     * @param {...{id:string, delta:number}} changes - 属性变更列表
     * 例: GameAttr.addMany(
     *     { id: 'reputation', delta: 15 },
     *     { id: 'diagnosis', delta: 8 },
     *     { id: 'herb_knowledge', delta: 5 }
     * );
     */
    addMany(...changes) {
        if (!window.gameStateManager) return;
        window.gameStateManager.batchAddAttributes(changes);
        console.log('[GameAttr] 剧情属性更新:', changes);
    },

    /** 获取当前属性值 */
    get(attrId) {
        if (!window.gameStateManager) return 0;
        return window.gameStateManager.getAttribute(attrId);
    },

    /** 设置属性为指定值（不超过最大值） */
    set(attrId, value) {
        if (!window.gameStateManager) return 0;
        return window.gameStateManager.setAttribute(attrId, value);
    },

    /**
     * 获取所有属性的当前值快照
     * @returns {Object} { herb_knowledge: 23, gathering: 30, ... }
     */
    getAll() {
        if (!window.gameStateManager) return {};
        return { ...window.gameStateManager.state.attributes };
    },

    /**
     * 刷新UI显示（属性变更后调用，可选）
     * 通常不需要手动调用，打开弹窗时自动刷新
     */
    refreshUI() {
        if (window.uiManager?.updateAttributesUI) {
            window.uiManager.updateAttributesUI();
        }
    }
};

console.log('[GameAttr] 全局属性接口已就绪，用法: GameAttr.add("reputation", 10)');
