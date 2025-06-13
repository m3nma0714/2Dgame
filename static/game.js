const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// プレイヤーの初期設定
const initialPlayerState = {
    x: 100,
    y: 200,
    width: 30,
    height: 50,
    color: 'red',
    speed: 5,
    velocityX: 0,
    velocityY: 0,
    isJumping: false
};
const player = { ...initialPlayerState };

// ゲームの物理設定
const gravity = 0.8;

// 操作キーの状態
const keys = {
    right: false,
    left: false,
    up: false
};

// ステージ（地面やブロック）
const platforms = [
    { x: 0, y: 350, width: 2000, height: 50, color: 'green' }, // 地面
    { x: 200, y: 250, width: 100, height: 20, color: 'brown' },
    { x: 400, y: 180, width: 100, height: 20, color: 'brown' },
    { x: 600, y: 80, width: 100, height: 20, color: 'brown' },
    // 右に拡張したい場合はここで追加
     // 地面を右に拡張
    { x: 900, y: 200, width: 100, height: 20, color: 'brown' },
    { x: 1100, y: 230, width: 100, height: 20, color: 'brown' },
    { x: 1350, y: 180, width: 100, height: 20, color: 'brown' } // 右端のゴール
];

// 敵キャラクターの設定（地面を歩く敵）
const enemy = {
    x: 300,
    y: 320, // 地面の上に配置（地面y:350, 高さ:50, 敵高さ:30）
    width: 40,
    height: 30,
    color: 'blue',
    speed: 3,
    direction: 1 // 1:右, -1:左
};

// 浮遊する敵（ブロック間に1体ずつ、合計2体）
const floatingEnemies = [
    {
        x: 330, // 1つ目のブロック間
        y: 180,
        width: 30,
        height: 30,
        color: 'orange',
        baseY: 180,
        amplitude: 100,
        speed: 0.005,
        phase: 0
    },
    {
        x: 520, // 2つ目のブロック間
        y: 110,
        width: 30,
        height: 30,
        color: 'orange',
        baseY: 110,
        amplitude: 100,
        speed: 0.006,
        phase: Math.PI // ずらして動きを変える
    },
    {
        x: 820, // 3つ目のブロック間
        y: 90,
        width: 30,
        height: 30,
        color: 'orange',
        baseY: 110,
        amplitude: 100,
        speed: 0.007,
        phase: Math.PI // ずらして動きを変える
    }
];

// コインの設定
const coins = [
    { x: 250, y: 210, radius: 12, collected: false },
    { x: 650, y: 40, radius: 12, collected: false },
    { x: 950, y: 160, radius: 12, collected: false },
    { x: 1400, y: 160, radius: 12, collected: false }
];

// ゴールポールの設定
const goalPole = {
    x: 1600, // ポールのx座標（ゴールブロックの右端付近に合わせて調整）
    y: 80,   // ポールのy座標（地面からの高さに合わせて調整）
    width: 16,
    height: 270, // ポールの高さ
    flagWidth: 40,
    flagHeight: 24
};

// ゴールに触れた高さを記録
let goalTouchY = null;

// カメラの位置（スクロール用）
let cameraX = 0;

// キャンバスサイズ
const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;

// ゲーム状態
const GAME_STATE = {
    TITLE: "title",
    STAGE_SELECT: "stage_select",
    PLAY: "play"
};
let gameState = GAME_STATE.TITLE;

// ステージリスト（複数ステージに対応）
const stages = [
    {
        name: "ステージ1",
        platforms: [
            { x: 0, y: 350, width: 2000, height: 50, color: 'green' },
            { x: 200, y: 250, width: 100, height: 20, color: 'brown' },
            { x: 400, y: 180, width: 100, height: 20, color: 'brown' },
            { x: 600, y: 80, width: 100, height: 20, color: 'brown' },
            { x: 900, y: 200, width: 100, height: 20, color: 'brown' },
            { x: 1100, y: 230, width: 100, height: 20, color: 'brown' },
            { x: 1350, y: 180, width: 100, height: 20, color: 'brown' }
        ],
        coins: [
            { x: 250, y: 210, radius: 12, collected: false },
            { x: 650, y: 40, radius: 12, collected: false },
            { x: 950, y: 160, radius: 12, collected: false },
            { x: 1400, y: 160, radius: 12, collected: false }
        ],
        enemy: {
            x: 300, y: 320, width: 40, height: 30, color: 'blue', speed: 3, direction: 1
        },
        floatingEnemies: [
            {
                x: 330, y: 180, width: 30, height: 30, color: 'orange',
                baseY: 180, amplitude: 100, speed: 0.005, phase: 0
            },
            {
                x: 520, y: 110, width: 30, height: 30, color: 'orange',
                baseY: 110, amplitude: 100, speed: 0.006, phase: Math.PI
            },
            {
                x: 820, y: 90, width: 30, height: 30, color: 'orange',
                baseY: 110, amplitude: 100, speed: 0.007, phase: Math.PI
            }
        ],
        goalPole: {
            x: 1600, y: 80, width: 16, height: 270, flagWidth: 40, flagHeight: 24
        }
    },
    {
        name: "ステージ2",
        platforms: [
            { x: 0, y: 350, width: 2000, height: 50, color: 'green' },
            { x: 300, y: 250, width: 100, height: 20, color: 'brown' },
            { x: 600, y: 180, width: 100, height: 20, color: 'brown' },
            { x: 900, y: 120, width: 100, height: 20, color: 'brown' },
            { x: 1200, y: 80, width: 100, height: 20, color: 'brown' },
            { x: 1500, y: 200, width: 100, height: 20, color: 'brown' }
        ],
        coins: [
            { x: 350, y: 210, radius: 12, collected: false },
            { x: 650, y: 140, radius: 12, collected: false },
            { x: 950, y: 100, radius: 12, collected: false },
            { x: 1550, y: 160, radius: 12, collected: false }
        ],
        enemy: {
            x: 500, y: 320, width: 40, height: 30, color: 'blue', speed: 4, direction: 1
        },
        floatingEnemies: [
            {
                x: 700, y: 180, width: 30, height: 30, color: 'purple',
                baseY: 180, amplitude: 120, speed: 0.006, phase: 0
            },
            {
                x: 1200, y: 110, width: 30, height: 30, color: 'purple',
                baseY: 110, amplitude: 120, speed: 0.007, phase: Math.PI
            }
        ],
        goalPole: {
            x: 1700, y: 80, width: 16, height: 270, flagWidth: 40, flagHeight: 24
        }
    }
];
let selectedStageIndex = 0;

// プレイヤー画像の読み込み
const playerImg = new Image();
playerImg.src = "static/player.png"; // 画像ファイルはstaticフォルダに配置してください

// 現在のステージデータをセットする関数
function loadStage(index) {
    const stage = stages[index];
    // プラットフォーム
    platforms.length = 0;
    stage.platforms.forEach(p => platforms.push({ ...p }));
    // コイン
    coins.length = 0;
    stage.coins.forEach(c => coins.push({ ...c }));
    // 敵
    Object.assign(enemy, stage.enemy);
    // 浮遊敵
    floatingEnemies.length = 0;
    stage.floatingEnemies.forEach(fe => floatingEnemies.push({ ...fe }));
    // ゴール
    Object.assign(goalPole, stage.goalPole);
    // プレイヤー初期位置
    Object.assign(player, initialPlayerState);
    cameraX = 0;
    goalTouchY = null;
}

// ステージ選択決定時・リセット時に呼ぶ
function resetGame() {
    loadStage(selectedStageIndex);
    isGameClear = false;
    isGameOver = false;
    keys.right = false;
    keys.left = false;
    keys.up = false;
    for (const coin of coins) {
        coin.collected = false;
    }
    score = 0;
    goalTouchY = null;
    gameState = GAME_STATE.PLAY;
}

let isGameClear = false; // ゲームクリア状態を管理
let isGameOver = false;  // ゲームオーバー状態を管理

// スコア
let score = 0;

// 3. ゲームループ
//------------------------------------
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 4. 更新処理
//------------------------------------
function update() {
    if (gameState === GAME_STATE.PLAY) {
        if (isGameClear || isGameOver) return;

        // 左右の移動
        if (keys.right) {
            player.velocityX = player.speed;
        } else if (keys.left) {
            player.velocityX = -player.speed;
        } else {
            player.velocityX = 0;
        }

        // プレイヤーの位置を更新
        player.x += player.velocityX;
        player.y += player.velocityY;

        // プレイヤーが画面外に出ないように制限
        // スクロールを考慮し、カメラ位置と画面幅で制限
        if (player.x < cameraX) player.x = cameraX;
        // ステージの右端（地面の右端）で止める
        const stageRight = Math.max(...platforms.map(p => p.x + p.width));
        if (player.x + player.width > stageRight) player.x = stageRight - player.width;

        // 重力を適用
        player.velocityY += gravity;

        // カメラのスクロール処理
        // プレイヤーが画面中央より右に来たらカメラを右に動かす
        const centerX = cameraX + SCREEN_WIDTH / 2;
        if (player.x > centerX) {
            cameraX = player.x - SCREEN_WIDTH / 2;
        }
        // 左端で止める（必要なら）
        if (cameraX < 0) cameraX = 0;

        // 当たり判定
        let onPlatform = false;
        for (const platform of platforms) {
            if (
                player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y + player.height > platform.y &&
                player.y + player.height < platform.y + platform.height + player.velocityY
            ) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                onPlatform = true;

                // 紫色のブロックの上に乗ったらゲームクリア
                if (platform.color === 'purple') {
                    isGameClear = true;
                }
            }
        }

        // 敵の移動（地面の範囲で左右に往復）
        enemy.x += enemy.speed * enemy.direction;
        if (enemy.x < 0 || enemy.x + enemy.width > 1600) { // ステージを右に伸ばす場合は範囲も拡大
            enemy.direction *= -1;
        }

        // 浮遊敵の上下移動
        for (const fe of floatingEnemies) {
            fe.y = fe.baseY + Math.sin(performance.now() * fe.speed + fe.phase) * fe.amplitude;
        }

        // 敵との当たり判定（AABB）
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            isGameOver = true;
        }

        // 浮遊敵との当たり判定
        for (const fe of floatingEnemies) {
            if (
                player.x < fe.x + fe.width &&
                player.x + player.width > fe.x &&
                player.y < fe.y + fe.height &&
                player.y + player.height > fe.y
            ) {
                isGameOver = true;
            }
        }

        // コインの取得判定
        for (const coin of coins) {
            if (!coin.collected) {
                const dx = (player.x + player.width / 2) - (coin.x + coin.radius);
                const dy = (player.y + player.height / 2) - (coin.y + coin.radius);
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < player.width / 2 + coin.radius) {
                    coin.collected = true;
                    score += 10;
                }
            }
        }

        // ゴールポール判定
        // プレイヤーがポールに触れたか
        if (
            player.x + player.width > goalPole.x &&
            player.x < goalPole.x + goalPole.width &&
            player.y + player.height > goalPole.y &&
            player.y < goalPole.y + goalPole.height
        ) {
            if (!isGameClear) {
                // 触れた高さを記録（ポールの上端を0とした相対値）
                goalTouchY = player.y + player.height - goalPole.y;
                // スコア加算（高い位置ほど高得点）
                // ポールの上端: 100点, 下端: 10点
                let ratio = 1 - Math.min(Math.max(goalTouchY / goalPole.height, 0), 1);
                let goalScore = Math.round(10 + ratio * 90);
                score += goalScore;
                isGameClear = true;
            }
        }
    }
    // タイトル画面やステージ選択画面では何もしない
}

// 5. 描画処理
//------------------------------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === GAME_STATE.TITLE) {
        // タイトル画面
        ctx.font = "48px sans-serif";
        ctx.fillStyle = "navy";
        ctx.textAlign = "center";
        ctx.fillText("2Dアクションゲーム", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 40);

        // スタートボタン
        ctx.font = "32px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillRect(SCREEN_WIDTH / 2 - 100, SCREEN_HEIGHT / 2, 200, 60);
        ctx.strokeStyle = "#333";
        ctx.strokeRect(SCREEN_WIDTH / 2 - 100, SCREEN_HEIGHT / 2, 200, 60);
        ctx.fillStyle = "#333";
        ctx.fillText("ゲームスタート", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 42);
        return;
    }

    if (gameState === GAME_STATE.STAGE_SELECT) {
        // ステージ選択画面
        ctx.font = "40px sans-serif";
        ctx.fillStyle = "navy";
        ctx.textAlign = "center";
        ctx.fillText("ステージ選択", SCREEN_WIDTH / 2, 100);

        ctx.font = "28px sans-serif";
        for (let i = 0; i < stages.length; i++) {
            ctx.fillStyle = i === selectedStageIndex ? "#FFD700" : "#333";
            ctx.fillText(stages[i].name, SCREEN_WIDTH / 2, 200 + i * 60);
        }
        ctx.font = "20px sans-serif";
        ctx.fillStyle = "#666";
        ctx.fillText("↑↓で選択、Enterで決定", SCREEN_WIDTH / 2, SCREEN_HEIGHT - 40);
        return;
    }

    if (gameState === GAME_STATE.PLAY) {
        // カメラの位置を考慮して描画
        ctx.save();
        ctx.translate(-cameraX, 0);

        // プレイヤーを画像で描画
        if (playerImg.complete) {
            ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        } else {
            // 画像がまだ読み込まれていない場合は四角で描画
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        // 地面を歩く敵を描画
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // 浮遊敵を描画
        for (const fe of floatingEnemies) {
            ctx.fillStyle = fe.color;
            ctx.fillRect(fe.x, fe.y, fe.width, fe.height);
        }

        // ステージを描画
        for (const platform of platforms) {
            ctx.fillStyle = platform.color;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }

        // コインを描画
        for (const coin of coins) {
            if (!coin.collected) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
                ctx.fillStyle = "gold";
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = "orange";
                ctx.stroke();
                ctx.restore();
            }
        }

        // ゴールポールを描画
        ctx.save();
        // ポール
        ctx.fillStyle = "#888";
        ctx.fillRect(goalPole.x, goalPole.y, goalPole.width, goalPole.height);
        // ポールの上の丸
        ctx.beginPath();
        ctx.arc(goalPole.x + goalPole.width / 2, goalPole.y, goalPole.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD700";
        ctx.fill();
        // 旗
        let flagY = goalPole.y + (goalTouchY !== null ? goalTouchY - goalPole.flagHeight / 2 : 0);
        if (isGameClear && goalTouchY !== null) {
            // クリア時は触れた高さに旗を移動
            ctx.fillStyle = "#f33";
            ctx.fillRect(goalPole.x + goalPole.width, flagY, goalPole.flagWidth, goalPole.flagHeight);
            ctx.strokeStyle = "#c00";
            ctx.strokeRect(goalPole.x + goalPole.width, flagY, goalPole.flagWidth, goalPole.flagHeight);
        } else {
            // 通常は一番上に旗
            ctx.fillStyle = "#f33";
            ctx.fillRect(goalPole.x + goalPole.width, goalPole.y, goalPole.flagWidth, goalPole.flagHeight);
            ctx.strokeStyle = "#c00";
            ctx.strokeRect(goalPole.x + goalPole.width, goalPole.y, goalPole.flagWidth, goalPole.flagHeight);
        }
        ctx.restore();

        ctx.restore();

        // ゲームクリア時に文字を表示
        if (isGameClear) {
            ctx.font = "48px sans-serif";
            ctx.fillStyle = "gold";
            ctx.textAlign = "center";
            ctx.fillText("ゲームクリア！", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
            ctx.font = "24px sans-serif";
            ctx.fillStyle = "white";
            if (selectedStageIndex < stages.length - 1) {
                ctx.fillText("スペースキーで次のステージへ", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
            } else {
                ctx.fillText("スペースキーでタイトルへ", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
            }
            // ゴールスコア表示
            if (goalTouchY !== null) {
                let ratio = 1 - Math.min(Math.max(goalTouchY / goalPole.height, 0), 1);
                let goalScore = Math.round(10 + ratio * 90);
                ctx.fillStyle = "gold";
                ctx.fillText(`ゴールボーナス: +${goalScore}点`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 90);
            }
        }

        // ゲームオーバー時に文字を表示
        if (isGameOver) {
            ctx.font = "48px sans-serif";
            ctx.fillStyle = "red";
            ctx.textAlign = "center";
            ctx.fillText("ゲームオーバー", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
            ctx.font = "24px sans-serif";
            ctx.fillStyle = "white";
            ctx.fillText("スペースキーでリスタート", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
        }

        // スコア表示（画面左上固定）
        ctx.save();
        ctx.font = "24px sans-serif";
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.fillText(`スコア: ${score}`, 20, 40);
        ctx.restore();
    }
}

// マウスクリックでスタートボタン判定
canvas.addEventListener('click', (e) => {
    if (gameState === GAME_STATE.TITLE) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (
            mx >= SCREEN_WIDTH / 2 - 100 && mx <= SCREEN_WIDTH / 2 + 100 &&
            my >= SCREEN_HEIGHT / 2 && my <= SCREEN_HEIGHT / 2 + 60
        ) {
            gameState = GAME_STATE.STAGE_SELECT;
        }
    }
});

// ステージ選択画面のキー操作を追加
document.addEventListener('keydown', (e) => {
    // ステージ選択画面
    if (gameState === GAME_STATE.STAGE_SELECT) {
        if (e.key === "ArrowUp") {
            selectedStageIndex = (selectedStageIndex - 1 + stages.length) % stages.length;
            draw(); // 画面を即時更新
        }
        if (e.key === "ArrowDown") {
            selectedStageIndex = (selectedStageIndex + 1) % stages.length;
            draw(); // 画面を即時更新
        }
        if (e.key === "Enter") {
            resetGame(); // ステージデータをロードしてゲーム開始
            gameState = GAME_STATE.PLAY;
        }
        return;
    }

    // ゲームプレイ中のキー操作
    if (gameState !== GAME_STATE.PLAY) return;

    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !player.isJumping) {
        player.isJumping = true;
        player.velocityY = -12;
    }

    // ゲームクリア・オーバー時のスペースキー
    if (isGameClear || isGameOver) {
        if (e.key === ' ') {
            if (isGameClear) {
                if (selectedStageIndex < stages.length - 1) {
                    selectedStageIndex++;
                    resetGame();
                    gameState = GAME_STATE.PLAY;
                } else {
                    gameState = GAME_STATE.TITLE;
                }
            } else {
                resetGame();
                gameState = GAME_STATE.PLAY;
            }
        }
    }
});

// キーを離したときの処理（移動し続けるバグ対策）
document.addEventListener('keyup', (e) => {
    if (gameState !== GAME_STATE.PLAY) return;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.up = false;
});

// 6. ゲーム開始
//------------------------------------
gameLoop();