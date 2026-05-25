/**
 * StoryEventManager - 剧情事件管理器
 * 负责 NPC 对话触发、Zone 区域检测、条件判断与奖励发放
 */

class StoryEventManager {
    /**
     * @param {Phaser.Scene} scene - 当前游戏场景
     */
    constructor(scene) {
        this.scene = scene;
        this.events = {};       // eventId → event config
        this.fired = new Set(); // 本场景已触发的一次性事件
    }

    /**
     * 加载事件数据（从JSON文件）
     * @param {Object} eventsJson - map_events_xxx.json 解析后的对象
     */
    loadEvents(eventsJson) {
        if (!eventsJson || !Array.isArray(eventsJson.events)) {
            console.warn('StoryEventManager: 无效的事件JSON');
            return;
        }
        this.events = {};
        eventsJson.events.forEach(evt => {
            this.events[evt.eventId] = evt;
        });
        console.log(`StoryEventManager: 已加载 ${Object.keys(this.events).length} 个事件`);
    }

    /**
     * 通过 npcId 查找对应的事件配置
     * @param {string} npcId - NPC ID（如 'woodcutter_npc'）
     * @returns {Object|null}
     */
    findEventByNpcId(npcId) {
        return Object.values(this.events).find(
            evt => evt.type === 'npc' && evt.npcId === npcId
        ) || null;
    }

    /**
     * 检测与指定目标的 E 键交互
     * @param {string} targetId - NPC ID 或对象 ID
     * @param {string} targetType - 'npc' | 'object'
     * @returns {boolean} 是否成功触发
     */
    checkInteraction(targetId, targetType) {
        const evt = targetType === 'npc'
            ? this.findEventByNpcId(targetId)
            : Object.values(this.events).find(e => e.objectId === targetId);

        if (!evt) {
            console.log(`StoryEventManager: 未找到 ${targetType} "${targetId}" 的事件`);
            return false;
        }

        // once 事件：检查全局是否已触发
        if (evt.once) {
            const globalFired = window.gameStateManager?.state?.storyEventsFired;
            if (globalFired && globalFired.has(evt.eventId)) {
                console.log(`StoryEventManager: 事件 "${evt.eventId}" 已触发过，跳过`);
                return false;
            }
        }

        this.fire(evt.eventId);
        return true;
    }

    /**
     * 触发指定事件
     * @param {string} eventId
     */
    fire(eventId) {
        const evt = this.events[eventId];
        if (!evt) {
            console.warn(`StoryEventManager: 事件 "${eventId}" 不存在`);
            return;
        }

        console.log(`StoryEventManager: 触发事件 "${eventId}"`);

        // 记录触发（once 事件写入全局状态，持久化跨场景）
        if (evt.once) {
            window.gameStateManager?.state?.storyEventsFired?.add(eventId);
        }

        // 执行对话
        if (evt.dialogues && evt.dialogues.length > 0) {
            this._showDialogues(evt.dialogues, () => {
                // 对话结束后发放奖励
                this._applyRewards(evt.rewards);
            });
        } else {
            this._applyRewards(evt.rewards);
        }
    }

    /**
     * 顺序播放对话列表
     * @private
     */
    _showDialogues(dialogues, onComplete) {
        if (!window.storyDialogSystem) {
            console.warn('StoryEventManager: storyDialogSystem 未初始化，跳过对话');
            if (onComplete) onComplete();
            return;
        }
        window.storyDialogSystem.showSequence(dialogues, onComplete);
    }

    /**
     * 发放奖励
     * @private
     */
    _applyRewards(rewards) {
        if (!rewards || rewards.length === 0) return;
        rewards.forEach(reward => {
            if (reward.type === 'attribute') {
                window.GameAttr?.add(reward.id, reward.delta);
                console.log(`StoryEventManager: 属性奖励 ${reward.id} +${reward.delta}`);
            } else if (reward.type === 'item') {
                window.gameStateManager?.state?.inventory &&
                    (window.gameStateManager.state.inventory[reward.id] =
                        (window.gameStateManager.state.inventory[reward.id] || 0) + (reward.count || 1));
                console.log(`StoryEventManager: 物品奖励 ${reward.id} x${reward.count || 1}`);
            }
        });
    }
}

window.StoryEventManager = StoryEventManager;
