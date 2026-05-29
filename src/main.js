/**
 * 主入口模块 - Main
 * 负责初始化游戏和启动时辰系统
 */

/**
 * 初始化 Phaser 游戏
 * 使用 BootScene 作为启动场景，由它来决定跳转
 */
function initGame() {
    // 场景列表（BootScene 会负责检查并跳转）
    const scenes = [window.BootScene, window.IntroScene, window.GameScene, window.FlowerIdGame, window.DryFlowerGame, window.DiagnosisMinigame];

    const config = {
        type: Phaser.AUTO,
        width: window.GameConfig.GAME_WIDTH,
        height: window.GameConfig.GAME_HEIGHT,
        parent: 'game-container',
        backgroundColor: '#2d5016',
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        scene: scenes  // 使用场景数组，BootScene 是第一个，会自动启动
    };

    window.game = new Phaser.Game(config);
    console.log('Main: 游戏初始化完成，等待 BootScene 跳转');

    // ★ 全局 F3 调试面板切换（独立于场景生命周期，始终可用）
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F3') {
            e.preventDefault();
            const panel = document.getElementById('debug-chapter1-panel');
            const overlay = document.getElementById('debug-chapter1-overlay');
            if (panel && overlay) {
                const isVisible = panel.style.display !== 'none';
                panel.style.display = isVisible ? 'none' : 'block';
                overlay.style.display = isVisible ? 'none' : 'block';
            }
        }
    });
}

/**
 * 启动时辰系统
 * 启动定时器，每秒更新时间状态，每天推进日期和节气
 */
function startTimeSystem() {
    const TIME_PERIODS = window.GameConfig.timeSystem.periods;
    const TICK_INTERVAL = window.GameConfig.timeSystem.tickInterval;
    const TICKS_PER_PERIOD = window.GameConfig.timeSystem.ticksPerPeriod;
    const TICKS_PER_DAY = window.GameConfig.timeSystem.ticksPerDay;

    let timeIndex = 0;
    let timeTicks = 0;

    setInterval(() => {
        timeTicks++;

        // 推进时辰
        if (timeTicks >= TICKS_PER_PERIOD) {
            timeTicks = 0;
            timeIndex = (timeIndex + 1) % TIME_PERIODS.length;

            const currentTime = TIME_PERIODS[timeIndex];
            window.gameStateManager.setCurrentTime(currentTime);
            window.uiManager.updateTimeDisplay(currentTime, Math.floor(timeIndex * 2));
        }

        // 推进日期（每过一天 = ticksPerDay 个 tick）
        if (timeTicks === 0 && timeIndex === 0 && window.gameStateManager.state.dayTickCount > 0) {
            window.gameStateManager.advanceDay();
            window.uiManager.updateSeasonDisplay();
            window.uiManager.updateBackpackHeader(window.gameStateManager.getState(), window.GameData.HERBS_DATA);
        }

        window.gameStateManager.state.dayTickCount++;
    }, TICK_INTERVAL);
}

/**
 * 启动加载序列
 * 立即初始化 Phaser，由场景真实进度驱动进度条
 */
function startLoadingSequence() {
    const ui = window.uiManager;
    ui.updateProgress(5, '正在启动游戏引擎...');
    // 显示游戏容器（加载屏仍覆盖其上），让 Phaser 可以初始化
    ui.showGameContainer();
    initGame();
    startTimeSystem();
}
