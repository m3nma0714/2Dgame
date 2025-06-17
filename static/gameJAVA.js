const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const thrower = { x: 0, y: 0, width: 0, height: 0, color: '', throwInterval: 120, throwTimer: 0 };
const projectiles = [];


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
    { x: 250, y: 210, radius: 12, collected: false, score: 10 },
    { x: 650, y: 40, radius: 12, collected: false, score: 10 },
    { x: 950, y: 160, radius: 12, collected: false, score: 10 },
    { x: 1400, y: 160, radius: 12, collected: false, score: 10 },
    { x: 800, y: 100, radius: 16, collected: false, score: 50 } // ★50点コイン追加
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
            { x: 250, y: 210, radius: 12, collected: false, score: 10 },
            { x: 650, y: 40, radius: 12, collected: false, score: 10 },
            { x: 950, y: 160, radius: 12, collected: false, score: 10 },
            { x: 1400, y: 100, radius: 16, collected: false, score: 50 } // ★50点コイン追加
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
            { x: 550, y: 180, width: 100, height: 20, color: 'brown' },
            { x: 840, y: 180, width: 100, height: 20, color: 'brown' },
            { x: 1050, y: 80, width: 30, height: 20, color: 'brown' },
            { x: 1300, y: 200, width: 30, height: 20, color: 'brown' },
            { x: 1500, y: 200, width: 30, height: 20, color: 'brown' },
            { x: 1600, y: 130, width: 20, height: 20, color: 'brown' }
        ],
        coins: [
            { x: 350, y: 210, radius: 12, collected: false, score: 10 },
            { x: 600, y: 100, radius: 12, collected: false, score: 10 },
            { x: 950, y: 100, radius: 12, collected: false, score: 10 },
            { x: 1400, y: 100, radius: 16, collected: false, score: 50 }
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
    },
    {
        name: "ステージ3",
        platforms: [
            { x: 0, y: 350, width: 2000, height: 50, color: 'green' },
            { x: 250, y: 270, width: 120, height: 20, color: 'brown' },
            { x: 500, y: 200, width: 100, height: 20, color: 'brown' },
            { x: 750, y: 150, width: 120, height: 20, color: 'brown' },
            { x: 1060, y: 150, width: 60, height: 20, color: 'brown' },
            { x: 1330, y: 180, width: 100, height: 20, color: 'brown' },
            { x: 1570, y: 120, width: 20, height: 20, color: 'brown' },
            { x: 1740, y: 80, width: 10, height: 20, color: 'brown' }
        ],
        coins: [
            { x: 300, y: 230, radius: 12, collected: false, score: 10 },
            { x: 550, y: 160, radius: 12, collected: false, score: 10 },
            { x: 850, y: 110, radius: 12, collected: false, score: 10 },
            { x: 1350, y: 140, radius: 12, collected: false, score: 10 },
            { x: 1750, y: 40, radius: 16, collected: false, score: 50 }
        ],
        enemy: {
            x: 600, y: 320, width: 40, height: 30, color: 'blue', speed: 5, direction: 1
        },
        floatingEnemies: [
            {
                x: 700, y: 200, width: 30, height: 30, color: 'purple',
                baseY: 200, amplitude: 120, speed: 0.01, phase: 0
            },
            {
                x: 1200, y: 120, width: 30, height: 30, color: 'purple',
                baseY: 120, amplitude: 100, speed: 0.009, phase: Math.PI / 2
            },
            {
                x: 1650, y: 100, width: 30, height: 30, color: 'purple',
                baseY: 100, amplitude: 80, speed: 0.01, phase: Math.PI
            }
        ],
        // 投擲敵の追加
        thrower: {
            x: 220, y: 5, width: 90, height: 90,  throwInterval: 230, throwTimer: 120
        },
        goalPole: {
            x: 1850, y: 80, width: 16, height: 270, flagWidth: 40, flagHeight: 24
        },
        trees: [
            { x: 220, y: 40, width: 100, height: 280, trunkColor: "#8B5A2B", leafColor: "#228B22" },
            { x: 920, y: 40, width: 100, height: 280, trunkColor: "#8B5A2B", leafColor: "#228B22" },
            { x: 1450, y: 40, width: 100, height: 280, trunkColor: "#8B5A2B", leafColor: "#228B22" }
        ]
    }
];
let selectedStageIndex = 0;
         
// プレイヤー画像の読み込み
const playerImg = new Image();
playerImg.src = "static/player.png"; // 画像ファイルはstaticフォルダに配置してください

// 敵画像の読み込み
const enemyImg = new Image();
enemyImg.src = "static/enemy.png"; // staticフォルダにenemy.pngを配置

// 浮遊敵画像の読み込み
const floatingEnemyImg = new Image();
floatingEnemyImg.src = "static/floating_enemy.png"; // staticフォルダにfloating_enemy.pngを配置

// --- 投擲物画像の読み込み ---
const projectileImg = new Image();
projectileImg.src = "static/projectile.png"; // staticフォルダにprojectile.pngを配置

// --- 投擲者アニメーション用画像の読み込み ---
const throwerImg = new Image();
throwerImg.src = "static/thrower_spritesheet.png"; // 横並びのスプライトシート画像を用意

// --- 投擲者アニメーション用のフレーム情報をグローバル変数に追加 ---
thrower.frame = 0;
thrower.frameCount = 25; // スプライトシートのコマ数に合わせて変更
thrower.frameInterval = 23; // 何フレームごとに切り替えるか
thrower.frameTimer = 0;

// 現在のステージデータをセットする関数
function loadStage(index) {
    const stage = stages[index];
    // プラットフォーム
    platforms.length = 0;
    for (const p of stage.platforms) {
        platforms.push({...p});
    }
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
    // 投擲敵
    if (stage.thrower) {
        Object.assign(thrower, stage.thrower);
        // アニメーション用プロパティを必ずセット
        thrower.frame = 0;
        thrower.frameCount = 23;      // ←スプライトシートのコマ数
        thrower.frameInterval = 10;
        thrower.frameTimer = 240;
    } else {
        thrower.x = 0; thrower.y = 0; thrower.width = 0; thrower.height = 0; thrower.color = '';
        thrower.throwInterval = 120; thrower.throwTimer = 0;
        thrower.frame = 0;
        thrower.frameCount = 24;
        thrower.frameInterval = 10;
        thrower.frameTimer = 0;
    }
    projectiles.length = 0;
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
    // 投擲者のタイマーをリセット
    if (selectedStageIndex === 2 && thrower.width > 0) {
        thrower.throwTimer = 0;      // ← ここを0に
        thrower.frameTimer = 0;      // ← ここも0に
        thrower.frame = 0;
    }
}

// ステージ選択やリセット時
function resetStage(stageIndex) {
    // プラットフォーム
    platforms.length = 0;
    for (const p of stages[stageIndex].platforms) {
        platforms.push({...p});
    }
    stages[stageIndex].platforms.forEach(p => platforms.push({ ...p }));
    // コイン
    coins.length = 0;
    stages[stageIndex].coins.forEach(c => coins.push({ ...c }));
    // 敵
    Object.assign(enemy, stages[stageIndex].enemy);
    // 浮遊敵
    floatingEnemies = stages[stageIndex].floatingEnemies.map(e => ({ ...e })); // ディープコピー
    // ゴール
    Object.assign(goalPole, stages[stageIndex].goalPole);
    // プレイヤー初期位置
    Object.assign(player, initialPlayerState);
    cameraX = 0;
    goalTouchY = null;
    // 投擲敵
    if (stages[stageIndex].thrower) {
        Object.assign(thrower, stages[stageIndex].thrower);
        // アニメーション用プロパティを必ずセット
        thrower.frame = 0;
        thrower.frameCount = 23;      // ←スプライトシートのコマ数
        thrower.frameInterval = 10;
        thrower.frameTimer = 120;
    } else {
        thrower.x = 0; thrower.y = 0; thrower.width = 0; thrower.height = 0; thrower.color = '';
        thrower.throwInterval = 120; thrower.throwTimer = 0;
        thrower.frame = 0;
        thrower.frameCount = 24;
        thrower.frameInterval = 10;
        thrower.frameTimer = 0;
    }
    projectiles.length = 0;
}

let isGameClear = false; // ゲームクリア状態を管理
let isGameOver = false;  // ゲームオーバー状態を管理

// スコア
let score = 0;

let lastTimestamp = performance.now();

// ===== 雲オブジェクトの定義 =====
const clouds = [
    { x: 100, y: 60, width: 120, height: 50, speed: 0.3 },
    { x: 400, y: 40, width: 180, height: 60, speed: 0.2 },
    { x: 800, y: 90, width: 140, height: 50, speed: 0.25 },
    { x: 1200, y: 70, width: 160, height: 55, speed: 0.18 },
    { x: 1600, y: 50, width: 110, height: 45, speed: 0.22 }
];

// ===== 雲の更新処理 =====
let cloudSpawnTimer = 0; // 雲生成用タイマーを追加

function updateClouds(delta) {
    // 雲を動かす
    for (let i = clouds.length - 1; i >= 0; i--) {
        const cloud = clouds[i];
        cloud.x += cloud.speed * delta * 60;
        // 画面右端を超えたら配列から削除
        if (cloud.x - cameraX > 2200) {
            clouds.splice(i, 1);
        }
    }
    // 一定間隔で新しい雲を左端に生成
    cloudSpawnTimer += delta;
    if (cloudSpawnTimer > 10) { // 1.2秒ごとに生成（調整可）
        cloudSpawnTimer = 0;
        const newCloud = {
            x: cameraX - 250, // カメラより左
            y: 40 + Math.random() * 80,
            width: 100 + Math.random() * 100,
            height: 40 + Math.random() * 30,
            speed: 0.15 + Math.random() * 0.15
        };
        clouds.push(newCloud);
    }
    // 雲が多すぎる場合は古いものを消す（最大10個など）
    if (clouds.length > 20) {
        clouds.splice(0, clouds.length - 10); // 最初の10個だけ残す
    }
}

// ===== 雲の描画処理 =====
function drawClouds() {
    ctx.save();
    ctx.globalAlpha = 0.7;
    // 雲のスクロール率（0:固定, 1:地面と同じ, 0.3なら地面の30%の速さでスクロール）
    const cloudScrollRate = 0.1;
    for (const cloud of clouds) {
        // 雲の位置はカメラに合わせてスクロール
        const cx = cloud.x - cameraX * cloudScrollRate;
        const cy = cloud.y;
        ctx.beginPath();
        // 雲の形（楕円を複数重ねる）
        ctx.ellipse(cx + cloud.width * 0.3, cy + cloud.height * 0.5, cloud.width * 0.3, cloud.height * 0.4, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + cloud.width * 0.6, cy + cloud.height * 0.4, cloud.width * 0.25, cloud.height * 0.3, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + cloud.width * 0.5, cy + cloud.height * 0.7, cloud.width * 0.28, cloud.height * 0.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
    }
    ctx.restore();
}

// 3. ゲームループ
//------------------------------------
function gameLoop(timestamp) {
    const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;
    updateClouds(delta); // ← 雲の更新を追加
    update(delta);
    draw();
    requestAnimationFrame(gameLoop);
}

// 4. 更新処理
//------------------------------------
function update(delta) {
    if (gameState === GAME_STATE.PLAY) {
        if (isGameClear || isGameOver) return;

        if (keys.right) {
            player.velocityX = player.speed * delta * 60;
        } else if (keys.left) {
            player.velocityX = -player.speed * delta * 60;
        } else {
            player.velocityX = 0;
        }

        // プレイヤーの位置を更新
        player.x += player.velocityX;
        player.y += player.velocityY * delta * 60;
        player.velocityY += gravity * delta * 60;

        // プレイヤーが画面外に出ないように制限
        // スクロールを考慮し、カメラ位置と画面幅で制限
        if (player.x < cameraX) player.x = cameraX;
        // ステージの右端（地面の右端）で止める
        const stageRight = Math.max(...platforms.map(p => p.x + p.width));
        if (player.x + player.width > stageRight) player.x = stageRight - player.width;

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
                    score += coin.score || 10; // scoreプロパティがなければ10点
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

        // ステージ3のみ投擲敵を動作
        if (selectedStageIndex === 2 && thrower.width > 0) {
            thrower.frameTimer++;
            if (thrower.frameTimer >= thrower.frameInterval) {
                thrower.frameTimer = 0;
                thrower.frame = (thrower.frame + 1) % thrower.frameCount;
            }
            thrower.throwTimer++;
            if (thrower.throwTimer >= thrower.throwInterval) {
                thrower.throwTimer = 0;
                // 投擲物を生成（左方向に投げる）
                projectiles.push({
                    x: thrower.x + thrower.width,
                    y: thrower.y + thrower.height / 2.5,
                    radius: 10,
                    vx: 6,
                    vy: -3,
                    color: 'brown'
                });
            }
        }
        // 投擲物の移動
        for (const p of projectiles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // 投擲物の重力
        }
        // 画面外に出た投擲物を削除
        for (let i = projectiles.length - 1; i >= 0; i--) {
            if (projectiles[i].x > cameraX + SCREEN_WIDTH || projectiles[i].y > SCREEN_HEIGHT) {
                projectiles.splice(i, 1);
            }
        }
        // 投擲物とプレイヤーの当たり判定
        for (const p of projectiles) {
            const dx = (player.x + player.width / 2) - p.x;
            const dy = (player.y + player.height / 2) - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < player.width / 2 + p.radius) {
                isGameOver = true;
            }
        }
    }
    // タイトル画面やステージ選択画面では何もしない
}

// 5. 描画処理
//------------------------------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- 雲の描画はゲームプレイ中のみ ---
    if (gameState === GAME_STATE.PLAY) {
        ctx.save();
        ctx.translate(-cameraX, 0);
        drawClouds();
        ctx.restore();
    }

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
        ctx.fillText("スタート", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 42);
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
        ctx.fillText("'W'or'S'で選択、spaceで決定", SCREEN_WIDTH / 2, SCREEN_HEIGHT - 40);
        return;
    }

    if (gameState === GAME_STATE.PLAY) {
        ctx.save();
        ctx.translate(-cameraX, 0);

        // --- ステージごとの木の描画 ---
        const trees = stages[selectedStageIndex].trees || [];
        for (const tree of trees) {
            const trunkWidth = 50;

            // 葉
            ctx.beginPath();
            ctx.arc(
                tree.x + tree.width / 2, // 幹の中心に合わせる
                tree.y,                  // 葉の中心y
                tree.width / 1.5,          // 半径
                0, Math.PI * 2
            );
            ctx.fillStyle = tree.leafColor;
            ctx.fill();

            // 幹
            ctx.fillStyle = tree.trunkColor;
            ctx.fillRect(
                tree.x + tree.width / 2 - trunkWidth / 2, // 幹の中心を葉の中心に合わせる
                tree.y + tree.width / 2,                  // 幹のy
                trunkWidth,                               // 幹の幅
                tree.height                               // 幹の高さ
            );
        }

        // プレイヤー画像描画
        if (playerImg.complete && playerImg.naturalWidth !== 0) {
            ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        } else {
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        // 地面を歩く敵画像描画（画像の比率に合わせてサイズ調整＋向き反転対応）
        if (enemyImg.complete && enemyImg.naturalWidth !== 0) {
            const aspect = enemyImg.naturalWidth / enemyImg.naturalHeight;
            let drawWidth = enemy.height * aspect;
            let drawHeight = enemy.height;
            let drawX = enemy.x + (enemy.width - drawWidth) / 2;
            let drawY = enemy.y;

            ctx.save();
            if (enemy.direction > 0) {
                // 右向きのときは画像を左右反転
                ctx.translate(drawX + drawWidth / 2, drawY + drawHeight / 2);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    enemyImg,
                    -drawWidth / 2,
                    -drawHeight / 2,
                    drawWidth,
                    drawHeight
                );
            } else {
                // 左向き（通常）のとき
                ctx.translate(drawX, drawY);
                ctx.drawImage(enemyImg, 0, 0, drawWidth, drawHeight);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }

        // 浮遊敵を画像で描画（画像の比率に合わせてサイズ調整）
        for (const fe of floatingEnemies) {
            if (floatingEnemyImg.complete && floatingEnemyImg.naturalWidth !== 0) {
                const aspect = floatingEnemyImg.naturalWidth / floatingEnemyImg.naturalHeight;
                let drawWidth = fe.height * aspect;
                let drawHeight = fe.height;
                let drawX = fe.x + (fe.width - drawWidth) / 2;
                let drawY = fe.y;
                ctx.drawImage(floatingEnemyImg, drawX, drawY, drawWidth, drawHeight);
            } else {
                ctx.fillStyle = fe.color;
                ctx.fillRect(fe.x, fe.y, fe.width, fe.height);
            }
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
                if (coin.score === 50) {
                    ctx.fillStyle = "deepskyblue"; // 50点コインは青色
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = "navy";
                } else {
                    ctx.fillStyle = "gold";
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "orange";
                }
                ctx.fill();
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

        // --- 投擲敵の描画（ステージ3のみ） ---
        if (selectedStageIndex === 2 && thrower.width > 0) {
            if (throwerImg.complete && throwerImg.naturalWidth !== 0) {
                // 1コマの幅は小数のまま
                const spriteWidth = 13800 / 23;
                const spriteHeight = 510;
                const sx = spriteWidth * thrower.frame;
                const scale = 1;

                const drawWidth = thrower.width * scale;
                const drawHeight = thrower.height * scale;

                // 幅・高さの中心を基準に反転
                ctx.save();
                const centerX = thrower.x + thrower.width / 2;
                const centerY = thrower.y + thrower.height / 2;
                ctx.translate(centerX, centerY);
                ctx.scale(-1, 1); // 左右反転
                ctx.translate(-centerX, -centerY);

                ctx.drawImage(
                    throwerImg,
                    sx, 0,
                    spriteWidth, spriteHeight,
                    thrower.x, thrower.y,
                    drawWidth, drawHeight
                );
                ctx.restore();
            } else {
                // 画像が読み込めない場合のみ四角形で描画（反転も適用）
                ctx.save();
                const centerX = thrower.x + thrower.width / 2;
                ctx.translate(centerX, thrower.y);
                ctx.scale(-1, 1);
                ctx.translate(-centerX, -thrower.y);
                ctx.fillStyle = thrower.color;
                ctx.fillRect(thrower.x, thrower.y, thrower.width, thrower.height);
                ctx.restore();
            }
        }

        // --- 投擲物の描画 ---
        for (const p of projectiles) {
            if (projectileImg.complete && projectileImg.naturalWidth !== 0) {
                ctx.drawImage(
                    projectileImg,
                    p.x - p.radius,
                    p.y - p.radius,
                    p.radius * 2,
                    p.radius * 2
                );
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.strokeStyle = "#333";
                ctx.stroke();
            }
        }

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
                ctx.fillText("Rキーで次のステージへ", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
            } else {
                ctx.fillText("Rキーでタイトルへ", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
            }
            // ゴールスコア表示
            if (goalTouchY !== null) {
                let ratio = 1 - Math.min(Math.max(goalTouchY / goalPole.height, 0), 1);
                let goalScore = Math.round(10 + ratio * 90);
                ctx.fillStyle = "gold";
                ctx.fillText(`ゴールボーナス: +${goalScore}点`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 90);
            }
        }

        // ゲームオーバー時に画面を暗転＋文字を表示
        if (isGameOver) {
            // 画面全体を半透明の黒で覆う（カメラ位置を考慮せず画面全体に）
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            ctx.restore();

            // 文字を大きく・中央に表示（カメラ位置を加えず、画面中央に固定）
            ctx.font = "bold 60px sans-serif";
            ctx.fillStyle = "red";
            ctx.textAlign = "center";
            ctx.fillText("ゲームオーバー", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

            ctx.font = "28px sans-serif";
            ctx.fillStyle = "white";
            ctx.fillText("Rキー または 画面タップでリスタート", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
        }

        // スコア表示（画面左上固定）
        ctx.save();
        ctx.font = "24px sans-serif";
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.fillText(`スコア: ${score}`, 20, 40);
        ctx.restore();
    }

    // --- メニュー画面が開いていれば最前面に描画 ---
    if (isMenuOpen) {
        drawMenu();
    }
}

// --- メニュー画面の状態管理 ---
let isMenuOpen = false;
let menuSelectedIndex = 0; // 追加: メニューの選択中インデックス

// --- メニュー画面のボタン領域 ---
const menuButtons = [
    { 
        label: "ステージ選択へ戻る", 
        action: () => { 
            gameState = GAME_STATE.TITLE; 
            isMenuOpen = false; 
            draw(); // 画面を即時更新
        } 
    },
    { 
        label: "リトライ", 
        action: () => { 
            gameState = GAME_STATE.STAGE_SELECT; 
            isMenuOpen = false; 
            draw(); // 画面を即時更新
        } 
    }
];

// --- メニュー画面の描画 ---
function drawMenu() {
    // 画面を半透明で覆う
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.restore();

    // メニュー枠
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 4;
    ctx.fillRect(SCREEN_WIDTH / 2 - 180, SCREEN_HEIGHT / 2 - 120, 360, 240);
    ctx.strokeRect(SCREEN_WIDTH / 2 - 180, SCREEN_HEIGHT / 2 - 120, 360, 240);

    // タイトル
    ctx.font = "32px sans-serif";
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.fillText("メニュー", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 60);

    // ボタン
    ctx.font = "28px sans-serif";
    for (let i = 0; i < menuButtons.length; i++) {
        const btnY = SCREEN_HEIGHT / 2 - 10 + i * 60;
        // 選択中のボタンを黄色く
        ctx.fillStyle = (i === menuSelectedIndex) ? "#FFD700" : "#eee";
        ctx.fillRect(SCREEN_WIDTH / 2 - 120, btnY, 240, 48);
        ctx.strokeStyle = "#888";
        ctx.strokeRect(SCREEN_WIDTH / 2 - 120, btnY, 240, 48);
        ctx.fillStyle = "#222";
        ctx.fillText(menuButtons[i].label, SCREEN_WIDTH / 2, btnY + 34);
    }

    // 追加: ESCで閉じる案内
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#eee";
    ctx.fillText("ESCを再度押してメニューを閉じる", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 140);

    ctx.restore();
}

// --- メニュー画面のボタン判定 ---
function handleMenuClick(mx, my) {
    for (let i = 0; i < menuButtons.length; i++) {
        const btnY = SCREEN_HEIGHT / 2 - 10 + i * 60;
        if (
            mx >= SCREEN_WIDTH / 2 - 120 && mx <= SCREEN_WIDTH / 2 + 120 &&
            my >= btnY && my <= btnY + 48
        ) {
            menuSelectedIndex = i;
            menuButtons[i].action();
            return true;
        }
    }
    return false;
}

// --- ESCキーでメニューの開閉 & メニュー操作 ---
document.addEventListener('keydown', (e) => {
    // ...既存のkeydown処理...

    // ゲームプレイ中のみESCでメニュー開閉
    if (gameState === GAME_STATE.PLAY && e.key === "Escape") {
        isMenuOpen = !isMenuOpen;
        // メニューを開いたら選択をリセット
        if (isMenuOpen) {
            menuSelectedIndex = 0;
        }
        draw();
        return;
    }

    // メニュー画面中の操作
    if (isMenuOpen) {
        if (e.key === "w" || e.key === "ArrowUp") {
            menuSelectedIndex = (menuSelectedIndex - 1 + menuButtons.length) % menuButtons.length;
            draw();
            return;
        }
        if (e.key === "s" || e.key === "ArrowDown") {
            menuSelectedIndex = (menuSelectedIndex + 1) % menuButtons.length;
            draw();
            return;
        }
        if (e.key === " " || e.key === "Enter" || e.key === "spacebar" || e.key === "space") {
            menuButtons[menuSelectedIndex].action();
            draw();
            return;
        }
        return;
    }

    // ...既存のキー処理...
});

// --- メニュー画面中はゲーム更新を止める ---
function update(delta) {
    if (isMenuOpen) return; // メニュー中は何もしない
    if (gameState === GAME_STATE.PLAY) {
        if (isGameClear || isGameOver) return;

        if (keys.right) {
            player.velocityX = player.speed * delta * 60;
        } else if (keys.left) {
            player.velocityX = -player.speed * delta * 60;
        } else {
            player.velocityX = 0;
        }

        // プレイヤーの位置を更新
        player.x += player.velocityX;
        player.y += player.velocityY * delta * 60;
        player.velocityY += gravity * delta * 60;

        // プレイヤーが画面外に出ないように制限
        // スクロールを考慮し、カメラ位置と画面幅で制限
        if (player.x < cameraX) player.x = cameraX;
        // ステージの右端（地面の右端）で止める
        const stageRight = Math.max(...platforms.map(p => p.x + p.width));
        if (player.x + player.width > stageRight) player.x = stageRight - player.width;

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
                    score += coin.score || 10; // scoreプロパティがなければ10点
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

        // ステージ3のみ投擲敵を動作
        if (selectedStageIndex === 2 && thrower.width > 0) {
            thrower.frameTimer++;
            if (thrower.frameTimer >= thrower.frameInterval) {
                thrower.frameTimer = 0;
                thrower.frame = (thrower.frame + 1) % thrower.frameCount;
            }
            thrower.throwTimer++;
            if (thrower.throwTimer >= thrower.throwInterval) {
                thrower.throwTimer = 0;
                // 投擲物を生成（左方向に投げる）
                projectiles.push({
                    x: thrower.x + thrower.width,
                    y: thrower.y + thrower.height / 2.5,
                    radius: 10,
                    vx: 6,
                    vy: -3,
                    color: 'brown'
                });
            }
        }
        // 投擲物の移動
        for (const p of projectiles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // 投擲物の重力
        }
        // 画面外に出た投擲物を削除
        for (let i = projectiles.length - 1; i >= 0; i--) {
            if (projectiles[i].x > cameraX + SCREEN_WIDTH || projectiles[i].y > SCREEN_HEIGHT) {
                projectiles.splice(i, 1);
            }
        }
        // 投擲物とプレイヤーの当たり判定
        for (const p of projectiles) {
            const dx = (player.x + player.width / 2) - p.x;
            const dy = (player.y + player.height / 2) - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < player.width / 2 + p.radius) {
                isGameOver = true;
            }
        }
    }
    // タイトル画面やステージ選択画面では何もしない
}

// 5. 描画処理
//------------------------------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- 雲の描画はゲームプレイ中のみ ---
    if (gameState === GAME_STATE.PLAY) {
        ctx.save();
        ctx.translate(-cameraX, 0);
        drawClouds();
        ctx.restore();
    }

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
        ctx.fillText("スタート", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 42);
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
        ctx.fillText("'W'or'S'で選択、spaceで決定", SCREEN_WIDTH / 2, SCREEN_HEIGHT - 40);
        return;
    }

    if (gameState === GAME_STATE.PLAY) {
        ctx.save();
        ctx.translate(-cameraX, 0);

        // --- ステージごとの木の描画 ---
        const trees = stages[selectedStageIndex].trees || [];
        for (const tree of trees) {
            const trunkWidth = 50;

            // 葉
            ctx.beginPath();
            ctx.arc(
                tree.x + tree.width / 2, // 幹の中心に合わせる
                tree.y,                  // 葉の中心y
                tree.width / 1.5,          // 半径
                0, Math.PI * 2
            );
            ctx.fillStyle = tree.leafColor;
            ctx.fill();

            // 幹
            ctx.fillStyle = tree.trunkColor;
            ctx.fillRect(
                tree.x + tree.width / 2 - trunkWidth / 2, // 幹の中心を葉の中心に合わせる
                tree.y + tree.width / 2,                  // 幹のy
                trunkWidth,                               // 幹の幅
                tree.height                               // 幹の高さ
            );
        }

        // プレイヤー画像描画
        if (playerImg.complete && playerImg.naturalWidth !== 0) {
            ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        } else {
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        // 地面を歩く敵画像描画（画像の比率に合わせてサイズ調整＋向き反転対応）
        if (enemyImg.complete && enemyImg.naturalWidth !== 0) {
            const aspect = enemyImg.naturalWidth / enemyImg.naturalHeight;
            let drawWidth = enemy.height * aspect;
            let drawHeight = enemy.height;
            let drawX = enemy.x + (enemy.width - drawWidth) / 2;
            let drawY = enemy.y;

            ctx.save();
            if (enemy.direction > 0) {
                // 右向きのときは画像を左右反転
                ctx.translate(drawX + drawWidth / 2, drawY + drawHeight / 2);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    enemyImg,
                    -drawWidth / 2,
                    -drawHeight / 2,
                    drawWidth,
                    drawHeight
                );
            } else {
                // 左向き（通常）のとき
                ctx.translate(drawX, drawY);
                ctx.drawImage(enemyImg, 0, 0, drawWidth, drawHeight);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }

        // 浮遊敵を画像で描画（画像の比率に合わせてサイズ調整）
        for (const fe of floatingEnemies) {
            if (floatingEnemyImg.complete && floatingEnemyImg.naturalWidth !== 0) {
                const aspect = floatingEnemyImg.naturalWidth / floatingEnemyImg.naturalHeight;
                let drawWidth = fe.height * aspect;
                let drawHeight = fe.height;
                let drawX = fe.x + (fe.width - drawWidth) / 2;
                let drawY = fe.y;
                ctx.drawImage(floatingEnemyImg, drawX, drawY, drawWidth, drawHeight);
            } else {
                ctx.fillStyle = fe.color;
                ctx.fillRect(fe.x, fe.y, fe.width, fe.height);
            }
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
                if (coin.score === 50) {
                    ctx.fillStyle = "deepskyblue"; // 50点コインは青色
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = "navy";
                } else {
                    ctx.fillStyle = "gold";
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "orange";
                }
                ctx.fill();
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

        // --- 投擲敵の描画（ステージ3のみ） ---
        if (selectedStageIndex === 2 && thrower.width > 0) {
            if (throwerImg.complete && throwerImg.naturalWidth !== 0) {
                // 1コマの幅は小数のまま
                const spriteWidth = 13800 / 23;
                const spriteHeight = 510;
                const sx = spriteWidth * thrower.frame;
                const scale = 1;

                const drawWidth = thrower.width * scale;
                const drawHeight = thrower.height * scale;

                // 幅・高さの中心を基準に反転
                ctx.save();
                const centerX = thrower.x + thrower.width / 2;
                const centerY = thrower.y + thrower.height / 2;
                ctx.translate(centerX, centerY);
                ctx.scale(-1, 1); // 左右反転
                ctx.translate(-centerX, -centerY);

                ctx.drawImage(
                    throwerImg,
                    sx, 0,
                    spriteWidth, spriteHeight,
                    thrower.x, thrower.y,
                    drawWidth, drawHeight
                );
                ctx.restore();
            } else {
                // 画像が読み込めない場合のみ四角形で描画（反転も適用）
                ctx.save();
                const centerX = thrower.x + thrower.width / 2;
                ctx.translate(centerX, thrower.y);
                ctx.scale(-1, 1);
                ctx.translate(-centerX, -thrower.y);
                ctx.fillStyle = thrower.color;
                ctx.fillRect(thrower.x, thrower.y, thrower.width, thrower.height);
                ctx.restore();
            }
        }

        // --- 投擲物の描画 ---
        for (const p of projectiles) {
            if (projectileImg.complete && projectileImg.naturalWidth !== 0) {
                ctx.drawImage(
                    projectileImg,
                    p.x - p.radius,
                    p.y - p.radius,
                    p.radius * 2,
                    p.radius * 2
                );
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.strokeStyle = "#333";
                ctx.stroke();
            }
        }

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
                ctx.fillText("Rキーで次のステージへ", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
            } else {
                ctx.fillText("Rキーでタイトルへ", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
            }
            // ゴールスコア表示
            if (goalTouchY !== null) {
                let ratio = 1 - Math.min(Math.max(goalTouchY / goalPole.height, 0), 1);
                let goalScore = Math.round(10 + ratio * 90);
                ctx.fillStyle = "gold";
                ctx.fillText(`ゴールボーナス: +${goalScore}点`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 90);
            }
        }

        // ゲームオーバー時に画面を暗転＋文字を表示
        if (isGameOver) {
            // 画面全体を半透明の黒で覆う（カメラ位置を考慮せず画面全体に）
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            ctx.restore();

            // 文字を大きく・中央に表示（カメラ位置を加えず、画面中央に固定）
            ctx.font = "bold 60px sans-serif";
            ctx.fillStyle = "red";
            ctx.textAlign = "center";
            ctx.fillText("ゲームオーバー", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

            ctx.font = "28px sans-serif";
            ctx.fillStyle = "white";
            ctx.fillText("Rキー または 画面タップでリスタート", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
        }

        // スコア表示（画面左上固定）
        ctx.save();
        ctx.font = "24px sans-serif";
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.fillText(`スコア: ${score}`, 20, 40);
        ctx.restore();

        // --- メニュー画面が開いていれば最前面に描画 ---
        if (isMenuOpen) {
            drawMenu();
        }
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

document.addEventListener('keydown', (e) => {
    // タイトル画面でエンターキーを押したらゲームスタート
    if (gameState === GAME_STATE.TITLE && e.key === " " || e.key === "spacebar" || e.key === "space" ) {
        gameState = GAME_STATE.STAGE_SELECT;
        draw();
        return;
    }

    // ステージ選択画面
    if (gameState === GAME_STATE.STAGE_SELECT) {
        if (e.key === "w" || e.key === "W") {
            selectedStageIndex = (selectedStageIndex - 1 + stages.length) % stages.length;
            draw();
            return;
        }
        if (e.key === "s" || e.key === "S") {
            selectedStageIndex = (selectedStageIndex + 1) % stages.length;
            draw();
            return;
        }
        if (e.key === " " || e.key === "spacebar" || e.key === "space") {
            resetGame(); // これだけでOK
            return;
        }
        return;
    }

    // ゲームクリア・オーバー時のエンターキーでリセットや次ステージ
    if ((isGameClear || isGameOver) && gameState === GAME_STATE.PLAY) {
        if (e.key === 'r' || e.key === 'R') {
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
        return;
    }

    // ゲームプレイ中のキー操作
    if (gameState !== GAME_STATE.PLAY) return;

    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if ((e.key === 'ArrowUp' || e.key === ' ') && !player.isJumping) {
        player.isJumping = true;
        player.velocityY = -12;
    }
});

// キーを離したときの処理（移動し続けるバグ対策）
document.addEventListener('keyup', (e) => {
    if (gameState !== GAME_STATE.PLAY) return;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowUp' || e.key === ' ') keys.up = false;
});

// --- テストプレイ中のみ状態をlocalStorageに保存・復元する例 ---
// ※本番公開時はこの機能を外してください

// 状態保存
function saveTestPlayState() {
    const state = {
        stage: selectedStageIndex,
        score,
        player: { ...player },
        enemy: { ...enemy },
        floatingEnemies: floatingEnemies.map(fe => ({ ...fe })),
        coins: coins.map(c => ({ ...c })),
        cameraX,
        isGameClear,
        isGameOver,
        goalTouchY
    };
    localStorage.setItem('2dgame_test_state', JSON.stringify(state));
}

// 状態復元
function loadTestPlayState() {
    const state = JSON.parse(localStorage.getItem('2dgame_test_state'));
    if (state) {
        selectedStageIndex = state.stage;
        loadStage(selectedStageIndex); // ステージ定義で初期化

        score = state.score;
        Object.assign(player, state.player);
        Object.assign(enemy, state.enemy);
        floatingEnemies.length = 0;
        state.floatingEnemies.forEach(fe => floatingEnemies.push({ ...fe }));

        // コインの位置や半径はステージ定義を使い、collectedだけ復元
        for (let i = 0; i < coins.length; i++) {
            if (state.coins[i]) {
                coins[i].collected = state.coins[i].collected;
            }
        }

        cameraX = state.cameraX;
        isGameClear = state.isGameClear;
        isGameOver = state.isGameOver;
        goalTouchY = state.goalTouchY;
        gameState = GAME_STATE.PLAY;
    }
}

// ページ読み込み時に復元（テストプレイ時のみ）
if (location.search.includes("test") || location.hash.includes("test")) {
    window.addEventListener('DOMContentLoaded', loadTestPlayState);
    // 1秒ごとに状態保存
    setInterval(saveTestPlayState, 1000);
}

// ===== 仮想スティック・ジャンプボタンのUI生成 =====
function createMobileControls() {
    // すでに追加済みなら何もしない
    if (document.getElementById('mobile-controls')) return;

    const controls = document.createElement('div');
    controls.id = 'mobile-controls';
    controls.style.position = 'absolute';
    controls.style.left = '0';
    controls.style.top = '0';
    controls.style.width = '100vw';
    controls.style.height = '100vh';
    controls.style.pointerEvents = 'none';
    controls.style.zIndex = 10;

    // 左スティック
    const stickArea = document.createElement('div');
    stickArea.style.position = 'absolute';
    stickArea.style.left = '20px';
    stickArea.style.bottom = '40px';
    stickArea.style.width = '120px';
    stickArea.style.height = '120px';
    stickArea.style.borderRadius = '60px';
    stickArea.style.background = 'rgba(0,0,0,0.1)';
    stickArea.style.pointerEvents = 'auto';
    stickArea.style.touchAction = 'none';

    // スティックの中心
    const stick = document.createElement('div');
    stick.style.position = 'absolute';
    stick.style.left = '40px';
    stick.style.top = '40px';
    stick.style.width = '40px';
    stick.style.height = '40px';
    stick.style.borderRadius = '20px';
    stick.style.background = 'rgba(0,0,0,0.3)';
    stickArea.appendChild(stick);

    // ジャンプボタン
    const jumpBtn = document.createElement('div');
    jumpBtn.style.position = 'absolute';
    jumpBtn.style.right = '40px';
    jumpBtn.style.bottom = '70px';
    jumpBtn.style.width = '70px';
    jumpBtn.style.height = '70px';
    jumpBtn.style.borderRadius = '35px';
    jumpBtn.style.background = 'rgba(255,180,0,0.7)';
    jumpBtn.style.display = 'flex';
    jumpBtn.style.alignItems = 'center';
    jumpBtn.style.justifyContent = 'center';
    jumpBtn.style.fontSize = '28px';
    jumpBtn.style.color = '#fff';
    jumpBtn.style.fontWeight = 'bold';
    jumpBtn.style.pointerEvents = 'auto';
    jumpBtn.innerText = 'JUMP';

    controls.appendChild(stickArea);
    controls.appendChild(jumpBtn);
    document.body.appendChild(controls);

    // --- 仮想スティックのタッチ操作 ---
    let stickTouchId = null;
    let stickStartX = 0;
    let stickMoved = false;

    stickArea.addEventListener('touchstart', function(e) {
        const t = e.changedTouches[0];
        stickTouchId = t.identifier;
        stickStartX = t.clientX;
        stickMoved = false;
        keys.left = false;
        keys.right = false;
        e.preventDefault();
    }, { passive: false });

    stickArea.addEventListener('touchmove', function(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === stickTouchId) {
                const dx = t.clientX - stickStartX;
                if (dx < -20) {
                    keys.left = true;
                    keys.right = false;
                    stickMoved = true;
                } else if (dx > 20) {
                    keys.right = true;
                    keys.left = false;
                    stickMoved = true;
                } else {
                    keys.left = false;
                    keys.right = false;
                }
                // スティックの見た目を動かす
                stick.style.left = (40 + Math.max(-40, Math.min(40, dx))) + 'px';
            }
        }
        e.preventDefault();
    }, { passive: false });

    stickArea.addEventListener('touchend', function(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === stickTouchId) {
                keys.left = false;
                keys.right = false;
                stick.style.left = '40px';
                stickTouchId = null;
            }
        }
        e.preventDefault();
    }, { passive: false });

    // --- ジャンプボタンのタッチ操作 ---
    jumpBtn.addEventListener('touchstart', function(e) {
        keys.up = true;
        // プレイヤーがジャンプ中でなければジャンプ
        if (!player.isJumping && gameState === GAME_STATE.PLAY) {
            player.isJumping = true;
            player.velocityY = -12;
        }
        jumpBtn.style.background = 'rgba(255,180,0,1)';
        e.preventDefault();
    }, { passive: false });

    jumpBtn.addEventListener('touchend', function(e) {
        keys.up = false;
        jumpBtn.style.background = 'rgba(255,180,0,0.7)';
        e.preventDefault();
    }, { passive: false });
}

// --- スマホ・タブレットなら仮想コントローラーを表示 ---
if (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    && typeof window.ontouchstart !== "undefined"
) {
    window.addEventListener('DOMContentLoaded', createMobileControls);
}

// ステージ選択画面でのタッチ操作
canvas.addEventListener('touchstart', function(e) {
    if (gameState === GAME_STATE.STAGE_SELECT) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;

        // ステージ名の表示位置と同じY座標範囲を判定
        for (let i = 0; i < stages.length; i++) {
            const stageY = 200 + i * 60;
            if (ty > stageY - 30 && ty < stageY + 30) {
                selectedStageIndex = i;
                draw();
                // すぐにゲーム開始
                resetGame();
                gameState = GAME_STATE.PLAY;
                break;
            }
        }
        e.preventDefault();
    }
}, { passive: false });

// --- スマホで強制横画面表示（画面回転ロック） ---
// ※一部ブラウザではユーザー操作が必要な場合があります

function forceLandscape() {
    // 画面が縦長の場合は案内を表示
    function checkOrientation() {
        if (window.innerWidth < window.innerHeight) {
            // 縦画面時の案内を表示
            let overlay = document.getElementById('landscape-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'landscape-overlay';
                overlay.style.position = 'fixed';
                overlay.style.left = '0';
                overlay.style.top = '0';
                overlay.style.width = '100vw';
                overlay.style.height = '100vh';
                overlay.style.background = 'rgba(0,0,0,0.85)';
                overlay.style.color = '#fff';
                overlay.style.display = 'flex';
                overlay.style.flexDirection = 'column';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';
                overlay.style.zIndex = 9999;
                overlay.style.fontSize = '2em';
                overlay.innerHTML = '横画面でプレイしてください<br><span style="font-size:1em;">Please rotate your device</span>';
                document.body.appendChild(overlay);
            } else {
                overlay.style.display = 'flex';
            }
        } else {
            // 横画面なら案内を非表示
            const overlay = document.getElementById('landscape-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    }
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();
}

// スマホ・タブレットなら横画面案内を有効化
if (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    && typeof window.ontouchstart !== "undefined"
) {
    window.addEventListener('DOMContentLoaded', forceLandscape);
}

// 6. ゲーム開始
//------------------------------------
gameLoop(performance.now());


// --- スマホ用：ゲームクリア・ゲームオーバー時に画面タップでリセット・次ステージ ---
// 既存のcanvas.addEventListener('touchstart', ...)の下などに追加

canvas.addEventListener('touchstart', function(e) {
    // ゲームクリアまたはゲームオーバー時
    if (gameState === GAME_STATE.PLAY && (isGameClear || isGameOver)) {
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
        e.preventDefault();
    }
}, { passive: false });

// --- 木オブジェクト（当たり判定なし） ---
const trees = [
    { x: 320, y: 300, width: 50, height: 80, trunkColor: "#8B5A2B", leafColor: "#228B22" },
    { x: 700, y: 320, width: 60, height: 90, trunkColor: "#8B5A2B", leafColor: "#2E8B57" },
    // 必要に応じて追加
];

// ゲーム開始時やリセット時
thrower.throwTimer = -20; // ← マイナス値にすることで60フレーム後に投げ始める

// 投擲者の描画部分
function drawThrower() {
    ctx.save();
    // 反転したいx座標（中心）を計算
    const centerX = thrower.x + thrower.width / 2;
    ctx.translate(centerX, thrower.y);
    ctx.scale(-1, 1); // 左右反転
    ctx.translate(-centerX, -thrower.y);

    // 通常通り描画
    ctx.fillStyle = thrower.color;
    ctx.fillRect(thrower.x, thrower.y, thrower.width, thrower.height);

    ctx.restore();
}

// 投擲物を生成する処理
function throwProjectile() {
    const projectile = {
        x: thrower.x + thrower.width, // 右端から
        y: thrower.y + thrower.height / 2,
        width: 16,
        height: 16,
        color: 'gray',
        speed: 6 // 右向き
    };
    projectiles.push(projectile);
}

// 投擲物の更新
function updateProjectiles() {
    for (const projectile of projectiles) {
        projectile.x += projectile.speed;
    }
}

// 投擲物の描画
function drawProjectiles() {
    for (const projectile of projectiles) {
        ctx.fillStyle = projectile.color;
        ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }
}