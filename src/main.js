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
    const scenes = [window.BootScene, window.IntroScene, window.GameScene];

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
 * 模拟资源加载过程，完成后启动游戏
 */
function startLoadingSequence() {
    const ui = window.uiManager;
    
    ui.updateProgress(10, '正在加载游戏资源...');

    setTimeout(() => {
        ui.updateProgress(30, '正在初始化游戏世界...');

        setTimeout(() => {
            ui.updateProgress(50, '正在生成草药...');

            setTimeout(() => {
                ui.updateProgress(70, '正在创建玩家角色...');

                setTimeout(() => {
                    ui.updateProgress(90, '正在启动游戏...');

                    setTimeout(() => {
                        ui.updateProgress(100, '加载完成！');

                        setTimeout(() => {
                            // 显示游戏界面
                            ui.showGameContainer();

                            // 初始化 Phaser 游戏
                            initGame();

                            // 启动时辰系统
                            startTimeSystem();
                        }, 500);
                    }, 300);
                }, 200);
            }, 200);
        }, 200);
    }, 200);
}
