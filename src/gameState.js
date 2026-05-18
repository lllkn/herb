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
            isGameStarted: false
        };
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
