// adventure-logic.js - Macera Modu Matematiksel Akış ve Fizik Merkezi

class AdvObstacle {
    constructor(relativeY) {
        this.relativeY = relativeY;
        this.width = 35; this.height = 22;
        this.side = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
    }
    getRealY() { return this.relativeY + worldOffset; }
}

class AdvCoin {
    constructor(relativeY, side) {
        this.relativeY = relativeY;
        this.side = side;
        this.size = 14;
        this.collected = false;
        // Paranın yapışık duracağı x koordinatı
        this.x = (side === 'LEFT') ? WALL_LEFT + 20 : WALL_RIGHT() - 20;
    }
    getRealY() { return this.relativeY + worldOffset; }
}

// Seviye Görev Havuzu (Rastgele Dağıtılmış Hedefler)
let advObstacles = [];
let advCoins = [];
let advNextObstacleY = -250;
let advNextCoinY = -350;

let selectedLevel = 1;
let levelTargetDistance = 0; // Metre hedefi
let levelTargetCoins = 0;    // Para toplama hedefi
let currentDistanceMeters = 0;

function startAdventureLevel(levelNum) {
    gameMode = 'ADVENTURE';
    gameState = 'PLAYING';
    selectedLevel = levelNum;
    
    score = 0; // Bu modda score=toplanan para görevini üstlenebilir
    matchCoins = 0;
    worldOffset = 0;
    currentDistanceMeters = 0;
    
    advObstacles = [];
    advCoins = [];
    advNextObstacleY = -250;
    advNextCoinY = -350;

    // Macera modu standart ORTA zorluk hız parametrelerini kullanır
    gameSpeed = DIFFICULTY_SETTINGS['NORMAL'].startSpeed;

    // Dinamik Rastgele Hedef Şeması Belirleme
    let seed = (levelNum * 77) % 3;
    if (seed === 0) {
        levelTargetDistance = 30 + (levelNum * 4); // Sadece Mesafe Görevi
        levelTargetCoins = 0;
    } else if (seed === 1) {
        levelTargetDistance = 0; 
        levelTargetCoins = 5 + Math.floor(levelNum * 0.6); // Sadece Para Görevi
    } else {
        levelTargetDistance = 20 + (levelNum * 3); // Hibrit Görev (Hem mesafe hem para)
        levelTargetCoins = 3 + Math.floor(levelNum * 0.4);
    }

    player.init();
    document.getElementById('gameHUD').classList.remove('hidden');
    updateAdventureHUD();
}

function updateAdventureLogic() {
    if (gameState !== 'PLAYING' || gameMode !== 'ADVENTURE') return;

    // Hızlanma dengesi standart ORTA katsayısı
    worldOffset += gameSpeed;
    gameSpeed += DIFFICULTY_SETTINGS['NORMAL'].accel;

    // 100 Piksel = 1 Metre formülü
    currentDistanceMeters = Math.floor(worldOffset / 100);

    updateAdventureHUD();

    // KAZANMA KONTROLÜ (Hedeflere ulaşıldı mı?)
    let distWin = (levelTargetDistance === 0 || currentDistanceMeters >= levelTargetDistance);
    let coinWin = (levelTargetCoins === 0 || matchCoins >= levelTargetCoins);
    
    if (distWin && coinWin) {
        triggerAdventureWin();
        return;
    }

    // Standart Engel Dağıtımı
    while (advNextObstacleY > -worldOffset - canvas.height) {
        advObstacles.push(new AdvObstacle(advNextObstacleY));
        advNextObstacleY -= (180 + Math.random() * 120);
    }

    // Matematiksel Grup Para Dağıtım Motoru
    while (advNextCoinY > -worldOffset - canvas.height) {
        let randGroup = Math.random();
        let side = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';

        if (randGroup < 0.15) {
            // %15 İhtimalle 4'lü Grup
            for (let i = 0; i < 4; i++) {
                advCoins.push(new AdvCoin(advNextCoinY - (i * 35), side));
            }
            advNextCoinY -= 300;
        } else if (randGroup < 0.45) {
            // %30 İhtimalle 3'lü Grup (0.15 + 0.30 = 0.45)
            for (let i = 0; i < 3; i++) {
                advCoins.push(new AdvCoin(advNextCoinY - (i * 35), side));
            }
            advNextCoinY -= 240;
        } else {
            // Geri kalan %55 İhtimalle Makul Mesafeli Tekli Paralar
            advCoins.push(new AdvCoin(advNextCoinY, side));
            advNextCoinY -= (120 + Math.random() * 60);
        }
    }

    player.update();

    // Çarpışma Testleri
    let px = player.x - player.size / 2;
    let py = player.y - player.size / 2;
    let pSize = player.size;

    // Engel Çarpışması
    for (let obs of advObstacles) {
        let oy = obs.getRealY();
        if (obs.side === 'LEFT') {
            if (px < WALL_LEFT + obs.width && py + pSize > oy && py < oy + obs.height) {
                triggerAdventureGameOver(); return;
            }
        } else {
            if (px + pSize > WALL_RIGHT() - obs.width && py + pSize > oy && py < oy + obs.height) {
                triggerAdventureGameOver(); return;
            }
        }
    }

    // Para Toplama Çarpışması
    for (let coin of advCoins) {
        if (!coin.collected) {
            let cy = coin.getRealY();
            if (Math.abs(player.x - coin.x) < (pSize/2 + coin.size/2) && Math.abs(player.y - cy) < (pSize/2 + coin.size/2)) {
                coin.collected = true;
                matchCoins++;
            }
        }
    }

    advObstacles = advObstacles.filter(obs => obs.getRealY() < canvas.height + 50);
    advCoins = advCoins.filter(c => c.getRealY() < canvas.height + 50);
}

function updateAdventureHUD() {
    let rawDistStr = currentDistanceMeters + "m";
    if (levelTargetDistance > 0) rawDistStr += " / " + levelTargetDistance + "m";
    
    let rawCoinStr = "🪙 " + matchCoins;
    if (levelTargetCoins > 0) rawCoinStr += " / " + levelTargetCoins;

    document.getElementById('hudLeft').innerText = rawDistStr;
    document.getElementById('hudRight').innerText = rawCoinStr;
}

function triggerAdventureGameOver() {
    gameState = 'GAMEOVER';
    totalCoins += matchCoins;
    saveGameData();

    document.getElementById('gameOverTitle').innerText = "ELENDİN!";
    document.getElementById('gameOverTitle').style.color = "#ff0055";
    document.getElementById('finalScore').innerText = "Gidilen Mesafe: " + currentDistanceMeters + "m";
    document.getElementById('finalTarget').classList.add('hidden');
    document.getElementById('gainedCoins').innerText = "Toplanan Bakiye: +🪙 " + matchCoins;
    
    document.getElementById('gameHUD').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.remove('hidden');
}

function triggerAdventureWin() {
    gameState = 'WIN';
    let reward = matchCoins + 5; // Her bölüm sonu 5 para hediye
    let isAllFinished = false;

    if (selectedLevel === currentLevel) {
        if (currentLevel < 50) {
            currentLevel++;
        } else if (currentLevel === 50) {
            reward += 100; // 50 Seviye bitirme ödülü +100 Para
            isAllFinished = true;
        }
    }
    
    totalCoins += reward;
    saveGameData();

    const title = document.getElementById('gameOverTitle');
    if (isAllFinished) {
        title.innerText = "MACERA BİTTİ!";
        title.style.color = "#ffd700";
        document.getElementById('gainedCoins').innerText = "BÜYÜK ÖDÜL: +🪙 " + reward + "\nModu Tamamen Bitirdiniz, Tebrikler!";
    } else {
        title.innerText = "BÖLÜM GEÇİLDİ!";
        title.style.color = "#39ff14";
        document.getElementById('gainedCoins').innerText = "Bölüm Ödülü: +🪙 " + reward + " (5 Hediye!)";
    }

    document.getElementById('finalScore').innerText = "Skor: " + currentDistanceMeters + "m / Toplanan: 🪙 " + matchCoins;
    document.getElementById('gameHUD').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.remove('hidden');
}
