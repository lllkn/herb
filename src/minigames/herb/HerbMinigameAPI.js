(function () {
    const REGISTRY = {
        licorice: {
            id: 'licorice',
            title: '甘草采挖',
            resultKey: '__herbMinigameResult',
            SceneClass: () => window.LicoriceHarvestGame
        },
        chrysanthemum: {
            id: 'chrysanthemum',
            title: '菊花采摘',
            resultKey: '__herbMinigameResult',
            SceneClass: () => window.ChrysanthemumPickGame
        },
        grind: {
            id: 'grind',
            title: '研磨药粉',
            resultKey: '__herbMinigameResult',
            SceneClass: () => window.HerbGrindingGame
        }
    };

    function ensureStyle() {
        if (document.getElementById('herb-minigame-style')) return;
        const style = document.createElement('style');
        style.id = 'herb-minigame-style';
        style.textContent = `
            .herb-minigame-root {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: grid;
                place-items: center;
                background: rgba(2, 6, 2, .82);
                font-family: "Microsoft YaHei", "SimSun", sans-serif;
            }
            .herb-minigame-shell {
                position: relative;
                width: min(94vw, 960px);
                aspect-ratio: 16 / 9;
                max-height: 86vh;
                border: 1px solid rgba(200,168,75,.46);
                background: #08120a;
                box-shadow: 0 18px 60px rgba(0,0,0,.55);
            }
            .herb-minigame-canvas {
                display: block;
                width: 100%;
                height: 100%;
                cursor: pointer;
            }
            .herb-minigame-overlay {
                position: absolute;
                right: 16px;
                bottom: 16px;
                display: flex;
                gap: 10px;
                pointer-events: none;
            }
            .herb-minigame-close {
                pointer-events: auto;
                background: rgba(14,24,9,.92);
                border: 1px solid rgba(200,168,75,.55);
                color: #f0e6d3;
                font: 13px "Microsoft YaHei", sans-serif;
                padding: 8px 18px;
                border-radius: 4px;
                cursor: pointer;
            }
            .herb-minigame-close:hover {
                border-color: #e8c870;
                background: rgba(30,50,18,.96);
            }
        `;
        document.head.appendChild(style);
    }

    function getHost() {
        return document.getElementById('game-container') || document.body;
    }

    function storeResult(result) {
        if (window.gameStateManager && window.gameStateManager.state) {
            window.gameStateManager.state.__herbMinigameResult = result;
            window.gameStateManager.state[`__herbMinigame_${result.id}_Result`] = result;
        }
    }

    function start(id, options) {
        const config = REGISTRY[id];
        if (!config) return Promise.reject(new Error(`未知本草小游戏: ${id}`));
        const SceneClass = config.SceneClass();
        if (!SceneClass) return Promise.reject(new Error(`小游戏未加载: ${id}`));

        ensureStyle();
        const host = getHost();
        return new Promise((resolve) => {
            const game = new SceneClass(Object.assign({}, options || {}, {
                id,
                title: config.title,
                onComplete: (result) => {
                    storeResult(result);
                    game.destroy();
                    resolve(result);
                }
            }));
            game.mount(host);
        });
    }

    function startLicorice(options) {
        return start('licorice', options);
    }

    function startChrysanthemum(options) {
        return start('chrysanthemum', options);
    }

    function startGrind(options) {
        return start('grind', options);
    }

    window.HerbMinigameAPI = {
        registry: REGISTRY,
        start,
        startLicorice,
        startChrysanthemum,
        startGrind
    };
})();
