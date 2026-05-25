// infinite-logic.js - Normal Mod Saf Hesaplama ve Engel Motoru

class InfiniteObstacle {
    constructor(relativeY) {
        this.relativeY = relativeY;
        this.width = 35;
        this.height = 22;
        // Engeller iki duvara rastgele ama homojen dağılır
        this.side = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
    }
    getRealY() {
        return this.relativeY + worldOffset;
    }
}

// Global engel havuzu
let infiniteObstacles = [];
let infNextObstacleY = -250;

function startNormalGame(difficulty) {
    gameMode = 'INFINITE';
    gameState = 'PLAYING';
    selectedDifficulty = difficulty;
    
    score = 0;
    matchCoins = 0;
    worldOffset = 0;
    infiniteObstacles = [];
    infNextObstacleY = -250;
    
    gameSpeed = DIFFICULTY_SETTINGS[difficulty].startSpeed;
    player.init();
    
    document.getElementById('gameHUD').classList.remove('hidden');
    updateInfiniteHUD();
}

function updateInfiniteLogic() {
    if (gameState !== 'PLAYING' || gameMode !== 'INFINITE') return;

    let settings = DIFFICULTY_SETTINGS[selectedDifficulty];
    
    // Düzenli akan yol hesabı ve hızlanma katlanması
    worldOffset += gameSpeed;
    gameSpeed += settings.accel;

    // Skor hesaplama (Mesafe bazlı puanlama)
    score = Math.floor(worldOffset / 150);
    
    // Skora bağlı dengeli para kazanma formülü (Her 4 skorda 1 Coin)
    matchCoins = Math.floor(score / 4);
    
    updateInfiniteHUD();

    // Homojen engel üretim fabrikası
    while (infNextObstacleY > -worldOffset - canvas.height) {
        infiniteObstacles.push(new InfiniteObstacle(infNextObstacleY));
        // Zorluğa göre engeller arası dikey mesafe daralır
        let gap = 200 + Math.random() * 120;
        if (selectedDifficulty === 'ZOR') gap = 150 + Math.random() * 90;
        infNextObstacleY -= gap;
    }

    player.update();
    
    // Çarpışma Testi Fiziği
    let px = player.x - player.size / 2;
    let py = player.y - player.size / 2;
    let pSize = player.size;

    for (let obs of infiniteObstacles) {
        let oy = obs.getRealY();
        if (obs.side === 'LEFT') {
            if (px < WALL_LEFT + obs.width && py + pSize > oy && py < oy + obs.height) {
                triggerInfiniteGameOver();
                return;
            }
        } else {
            if (px + pSize > WALL_RIGHT() - obs.width && py + pSize > oy && py < oy + obs.height) {
                triggerInfiniteGameOver();
                return;
            }
        }
    }

    // Ekrandan çıkıp giden engelleri hafızadan sil
    infiniteObstacles = infiniteObstacles.filter(obs => obs.getRealY() < canvas.height + 50);
}

function updateInfiniteHUD() {
    document.getElementById('hudLeft').innerText = 'Skor: ' + score;
    document.getElementById('hudRight').innerText = '🪙 ' + matchCoins;
}

function triggerInfiniteGameOver() {
    gameState = 'GAMEOVER';
    totalCoins += matchCoins;
    if (score > highScore) highScore = score;
    saveGameData();

    document.getElementById('gameOverTitle').innerText = "ELENDİN!";
    document.getElementById('gameOverTitle').style.color = "#ff0055";
    document.getElementById('finalScore').innerText = "Skor: " + score;
    document.getElementById('finalTarget').classList.add('hidden');
    document.getElementById('gainedCoins').innerText = "Kazanılan: +🪙 " + matchCoins;
    
    document.getElementById('gameHUD').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.remove('hidden');
}
