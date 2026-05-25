// adventure-logic.js - Macera Modu Saf Fizik ve Akıllı Para Hesaplama Beyni

class AdventureObstacle {
    constructor(relativeY) {
        this.relativeY = relativeY;
        this.width = 30;
        this.height = 20;
        
        let chosenSide = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
        if (chosenSide === 'LEFT') {
            if (consecutiveLeftCount >= 3) { chosenSide = 'RIGHT'; consecutiveLeftCount = 0; consecutiveRightCount = 1; }
            else { consecutiveLeftCount++; consecutiveRightCount = 0; }
        } else {
            if (consecutiveRightCount >= 3) { chosenSide = 'LEFT'; consecutiveRightCount = 0; consecutiveLeftCount = 1; }
            else { consecutiveRightCount++; consecutiveLeftCount = 0; }
        }
        this.side = chosenSide;
    }
    getRealY() { return this.relativeY + worldOffset; }
}

class AdventureCoin {
    constructor(relativeY, side) {
        this.relativeY = relativeY;
        this.size = 14;
        this.side = side;
        this.collected = false;
        this.x = (this.side === 'LEFT') ? WALL_LEFT + 25 : WALL_RIGHT() - 25;
    }
    getRealY() { return this.relativeY + worldOffset; }
}

function startAdventureLevel(levelNum) {
    initAudio();
    selectedLevel = levelNum;
    gameMode = 'ADVENTURE';
    gameState = 'PLAYING';
    
    score = 0; 
    matchCoins = 0; 
    worldOffset = 0;
    consecutiveLeftCount = 0; 
    consecutiveRightCount = 0;
    obstacles = []; 
    coins = [];
    nextObstacleY = -200; 
    nextCoinY = -300;
    
    if (typeof DIFFICULTY_SETTINGS !== 'undefined' && DIFFICULTY_SETTINGS['NORMAL']) {
        adventureCurrentSpeed = DIFFICULTY_SETTINGS['NORMAL'].startSpeed; 
    } else {
        adventureCurrentSpeed = 4.5;
    }
    
    adventureTargetScore = 20 + (levelNum * 5); 
    
    if (player && typeof player.init === 'function') {
        player.init(); 
    }
    updateHUD();
    
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('adventureMenu').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
    
    if (!adventureLoopStarted) {
        adventureLoopStarted = true;
        if (typeof adventureGameLoop === 'function') adventureGameLoop();
    }
}

function updateAdventureLogic() {
    if (gameState !== 'PLAYING' || gameMode !== 'ADVENTURE') return;

    let normalSettings = (typeof DIFFICULTY_SETTINGS !== 'undefined') ? DIFFICULTY_SETTINGS['NORMAL'] : { acceleration: 0.0005 };

    worldOffset += adventureCurrentSpeed;
    adventureCurrentSpeed += normalSettings.acceleration || 0.0005; 
    
    score = Math.floor(worldOffset / 160);
    
    if (score >= adventureTargetScore) {
        triggerAdventureWin();
        return;
    }

    let progressRatio = Math.min((selectedLevel - 1) / 49, 1);
    let minGap = 160 - (progressRatio * 30); 
    let maxGap = 280 - (progressRatio * 50); 

    let cHeight = (canvas && canvas.height) ? canvas.height : 800;

    while (nextObstacleY > -worldOffset - cHeight) {
        obstacles.push(new AdventureObstacle(nextObstacleY));
        let gap = Math.random() * (maxGap - minGap) + minGap;
        nextObstacleY -= gap; 
    }

    while (nextCoinY > -worldOffset - cHeight) {
        let chosenSide = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
        let rand = Math.random();

        if (rand < 0.30) {
            for (let i = 0; i < 5; i++) {
                coins.push(new AdventureCoin(nextCoinY - (i * 45), chosenSide));
            }
            nextCoinY -= 450; 
        } else if (rand < 0.75) {
            coins.push(new AdventureCoin(nextCoinY, chosenSide));
            nextCoinY -= 200;
        } else {
            nextCoinY -= 150;
        }
    }

    if (player && typeof player.update === 'function') {
        player.update(); 
    }
    checkAdventureCollisions();
    
    obstacles = obstacles.filter(obs => obs.getRealY() < cHeight + 100);
    coins = coins.filter(c => c.getRealY() < cHeight + 100);
}

function checkAdventureCollisions() {
    if (!player) return;

    let px = player.x - player.size / 2; 
    let py = player.y - player.size / 2;
    let pw = player.size; 
    let ph = player.size;
    
    for (let obs of obstacles) {
        let oy = obs.getRealY();
        if (obs.side === 'LEFT') {
            if (px < WALL_LEFT + obs.width && px + pw > WALL_LEFT && py + ph > oy && py < oy + obs.height) { triggerAdventureGameOver(); return; }
        } else {
            if (px + pw > WALL_RIGHT() - obs.width && px < WALL_RIGHT() && py + ph > oy && py < oy + obs.height) { triggerAdventureGameOver(); return; }
        }
    }

    for (let coin of coins) {
        if (!coin.collected) {
            let cy = coin.getRealY();
            let distX = Math.abs(player.x - coin.x);
            let distY = Math.abs(player.y - cy);
            
            if (distX < (player.size / 2 + coin.size / 2) && distY < (player.size / 2 + coin.size / 2)) {
                coin.collected = true;
                matchCoins++;
                updateHUD();
            }
        }
    }
}

function triggerAdventureGameOver() {
    gameState = 'GAMEOVER';
    totalCoins += matchCoins;
    saveGameData();
    
    const title = document.getElementById('gameOverTitle');
    title.innerText = 'ELENDİN!'; title.style.color = '#ff0055'; title.style.textShadow = '0 0 15px #ff0055';
    document.getElementById('finalScore').innerText = 'Skor: ' + score + ' / ' + adventureTargetScore;
    document.getElementById('gainedCoins').innerText = 'Kazanılan: +🪙 ' + matchCoins;
    document.getElementById('gameOverMenu').classList.remove('hidden');
}

function triggerAdventureWin() {
    gameState = 'WIN';
    let bonus = matchCoins + 10; 
    totalCoins += bonus;
    
    if (selectedLevel === currentLevel && currentLevel < 50) {
        currentLevel++;
    }
    saveAdventureData();
    saveGameData();

    const title = document.getElementById('gameOverTitle');
    title.innerText = 'BÖLÜM GEÇİLDİ!'; title.style.color = '#39ff14'; title.style.textShadow = '0 0 15px #39ff14';
    document.getElementById('finalScore').innerText = 'Skor: ' + score + ' / ' + adventureTargetScore;
    document.getElementById('gainedCoins').innerText = 'Toplam Kazanç: +🪙 ' + bonus + ' (10 Bölüm Bonusu!)';
    document.getElementById('gameOverMenu').classList.remove('hidden');
}
